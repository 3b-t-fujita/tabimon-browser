/**
 * 戦闘 tick エンジン。詳細設計 v4 §7 戦闘仕様に準拠。
 *
 * 1 tick = 0.5秒。
 * processTick() を呼ぶたびに全アクターのタイマーを進め、
 * 行動可能なアクターを処理する。
 *
 * 重要:
 * - 勝敗確定後は tick を進めない（呼び出し元の責務で確認すること）
 * - UI Component から直接呼ばないこと（UseCase / hook 経由）
 * - ダメージ計算は DamageCalculator に委譲する
 */
import type { BattleActor, BattleSkillState } from './BattleActor';
import type { BattleState, BattleLogEntry, BattleOutcome } from './BattleState';
import { cloneBattleState } from './BattleState';
import { calcDamage, calcHeal, clampHp, NORMAL_ATK_PWR } from './DamageCalculator';
import { calcActionThreshold } from './BattleActor';
import { SkillType, PersonalityType } from '@/common/constants/enums';

export const TICK_SEC       = 0.5;
export const BUFF_TURNS     = 3;
export const BUFF_MULTIPLIER  = 1.2;
export const DEBUFF_MULTIPLIER = 0.8;
export const HEAL_THRESHOLD   = 0.5;  // HP が 50% 未満で回復優先
export const SHIELD_HITS      = 2;    // DEF系スキルのシールド被弾回数
export const SHIELD_REDUCTION = 0.55; // まもりのたて / いわのよろい のダメージ軽減率（55%減）
export const SHIELD_REDUCTION_DEF_002 = 0.65; // ブリザードアーマー のダメージ軽減率（65%減）
export const SHIELD_REDUCTION_DEF_003 = 0.75; // グレイシャーウォール のダメージ軽減率（75%減）
export const TYPE_BONUS_MULT = 1.1;  // 属性有利時のダメージ倍率
export const TYPE_WEAK_MULT  = 0.9;  // 属性不利時のダメージ倍率

// ---------------------------------------------------------------------------
// 勝敗判定
// ---------------------------------------------------------------------------

function checkOutcome(state: BattleState): BattleOutcome {
  const mainActor = state.actors.find((a) => a.isMain);
  if (mainActor && mainActor.currentHp <= 0) return 'LOSE';

  const aliveEnemies = state.actors.filter((a) => a.isEnemy && a.currentHp > 0);
  if (aliveEnemies.length === 0) return 'WIN';

  return 'NONE';
}

// ---------------------------------------------------------------------------
// ターゲット選択
// ---------------------------------------------------------------------------

/** HP 割合が最も低い生存アクターを返す（攻撃・回復対象の優先選択に使用） */
function lowestHpRatioTarget(candidates: BattleActor[]): BattleActor | null {
  if (candidates.length === 0) return null;
  return candidates.reduce((a, b) =>
    (a.currentHp / a.maxHp) < (b.currentHp / b.maxHp) ? a : b,
  );
}

// ---------------------------------------------------------------------------
// スキル選択 AI
// ---------------------------------------------------------------------------

interface ChosenAction {
  type:    'NORMAL_ATK' | 'SKILL' | 'SKILL_ALL';
  skill?:  BattleSkillState;
  target?: BattleActor;
}

function decideAiAction(actor: BattleActor, state: BattleState): ChosenAction {
  const aliveParty   = state.actors.filter((a) => !a.isEnemy && a.currentHp > 0);
  const aliveEnemies = state.actors.filter((a) => a.isEnemy  && a.currentHp > 0);

  const friendlies = actor.isEnemy ? aliveEnemies : aliveParty;
  const opponents  = actor.isEnemy ? aliveParty   : aliveEnemies;

  const available = actor.skills.filter((s) => s.cooldownRemaining <= 0);

  const healSkill   = available.find((s) => s.skillType === SkillType.Heal);
  const atkSkill    = available.find(
    (s) => s.skillType === SkillType.Attack && s.targetCount !== 0,
  );
  const atkAllSkill = available.find(
    (s) => s.skillType === SkillType.Attack && s.targetCount === 0,
  );
  const buffSkill   = available.find((s) => s.skillType === SkillType.Buff);
  const debuffSkill = available.find((s) => s.skillType === SkillType.Debuff);

  // ---- 性格補正 heal 閾値 ----
  const healThreshold = actor.personality === PersonalityType.Cautious ? 0.6 : HEAL_THRESHOLD;

  // ---- 1. 回復優先: 仲間に低HP者がいれば回復 ----
  if (healSkill && friendlies.some((a) => a.currentHp / a.maxHp < healThreshold)) {
    const target = lowestHpRatioTarget(friendlies);
    if (target) return { type: 'SKILL', skill: healSkill, target };
  }

  // ---- 2. バフ: まだ未使用（buffTurns=0 かつシールド未展開）----
  if (buffSkill && actor.buffTurnsRemaining === 0 && actor.shieldHitsRemaining === 0) {
    return { type: 'SKILL', skill: buffSkill, target: actor };
  }

  // ---- 3. デバフ: 相手にデバフがまだなければ ----
  if (debuffSkill && opponents.some((o) => o.buffTurnsRemaining === 0)) {
    const target = lowestHpRatioTarget(opponents);
    if (target) return { type: 'SKILL', skill: debuffSkill, target };
  }

  // ---- 4. 全体攻撃 ----
  if (atkAllSkill) return { type: 'SKILL_ALL', skill: atkAllSkill };

  // ---- 5. 単体攻撃スキル ----
  if (atkSkill) {
    const target = lowestHpRatioTarget(opponents);
    if (target) return { type: 'SKILL', skill: atkSkill, target };
  }

  // ---- 6. 通常攻撃 ----
  const target = lowestHpRatioTarget(opponents);
  if (target) return { type: 'NORMAL_ATK', target };

  return { type: 'NORMAL_ATK' };
}

function decideMainAction(actor: BattleActor, state: BattleState): ChosenAction {
  // プレイヤーがスキルをキューしている場合
  if (state.pendingMainSkillId) {
    const queued = actor.skills.find(
      (s) => s.skillId === state.pendingMainSkillId && s.cooldownRemaining <= 0,
    );
    if (queued) {
      const opponents = state.actors.filter((a) => a.isEnemy && a.currentHp > 0);
      if (queued.targetCount === 0) return { type: 'SKILL_ALL', skill: queued };
      const target = lowestHpRatioTarget(opponents);
      if (target) return { type: 'SKILL', skill: queued, target };
    }
  }
  // フォールバック: AI と同じロジック
  return decideAiAction(actor, state);
}

// ---------------------------------------------------------------------------
// 属性相性
// ---------------------------------------------------------------------------

/**
 * 属性3すくみ相性倍率を返す。
 * 森(1) > 氷(3) > 火(2) > 森(1)
 */
function getTypeMultiplier(attackerWorld: number, defenderWorld: number): number {
  if (attackerWorld === 0 || defenderWorld === 0) return 1.0;
  if (attackerWorld === defenderWorld) return 1.0;
  if (attackerWorld === 1 && defenderWorld === 3) return TYPE_BONUS_MULT;
  if (attackerWorld === 3 && defenderWorld === 2) return TYPE_BONUS_MULT;
  if (attackerWorld === 2 && defenderWorld === 1) return TYPE_BONUS_MULT;
  if (attackerWorld === 3 && defenderWorld === 1) return TYPE_WEAK_MULT;
  if (attackerWorld === 2 && defenderWorld === 3) return TYPE_WEAK_MULT;
  if (attackerWorld === 1 && defenderWorld === 2) return TYPE_WEAK_MULT;
  return 1.0;
}

// ---------------------------------------------------------------------------
// アクション適用
// ---------------------------------------------------------------------------

function applyAction(
  actor:  BattleActor,
  action: ChosenAction,
  state:  BattleState,
): BattleLogEntry {
  const effAtk = actor.baseAtk * actor.atkMultiplier;
  const typeMult = (action.target) ? getTypeMultiplier(actor.worldId, action.target.worldId) : 1.0;
  const atkName = action.skill?.displayName ?? '通常攻撃';

  if (action.type === 'NORMAL_ATK' && action.target) {
    const effDef = action.target.baseDef * action.target.defMultiplier;
    let dmg      = calcDamage(effAtk, NORMAL_ATK_PWR, effDef);
    dmg          = Math.max(1, Math.round(dmg * typeMult));
    dmg          = applyShield(action.target, dmg);
    action.target.currentHp = clampHp(action.target.currentHp - dmg, action.target.maxHp);
    return {
      tick: state.tickCount, actorName: actor.displayName,
      action: '通常攻撃', targetName: action.target.displayName, value: dmg,
    };
  }

  if (action.type === 'SKILL' && action.skill && action.target) {
    action.skill.cooldownRemaining = action.skill.cooldownSec;
    const skill = action.skill;

    if (skill.skillType === SkillType.Heal) {
      const heal = calcHeal(effAtk, skill.power);
      action.target.currentHp = clampHp(action.target.currentHp + heal, action.target.maxHp);
      return {
        tick: state.tickCount, actorName: actor.displayName,
        action: skill.displayName, targetName: action.target.displayName, value: heal,
      };
    }

    if (skill.skillType === SkillType.Buff) {
      // buff self
      applyBuff(actor, skill);
      return {
        tick: state.tickCount, actorName: actor.displayName,
        action: skill.displayName, targetName: actor.displayName,
      };
    }

    if (skill.skillType === SkillType.Debuff) {
      applyDebuff(action.target, skill);
      return {
        tick: state.tickCount, actorName: actor.displayName,
        action: skill.displayName, targetName: action.target.displayName,
      };
    }

    // Single-target attack
    const effDef = action.target.baseDef * action.target.defMultiplier;
    let dmg      = calcDamage(effAtk, skill.power, effDef);
    dmg          = Math.max(1, Math.round(dmg * typeMult));
    dmg          = applyShield(action.target, dmg);
    action.target.currentHp = clampHp(action.target.currentHp - dmg, action.target.maxHp);
    return {
      tick: state.tickCount, actorName: actor.displayName,
      action: atkName, targetName: action.target.displayName, value: dmg,
    };
  }

  if (action.type === 'SKILL_ALL' && action.skill) {
    action.skill.cooldownRemaining = action.skill.cooldownSec;
    const skill   = action.skill;
    const targets = actor.isEnemy
      ? state.actors.filter((a) => !a.isEnemy && a.currentHp > 0)
      : state.actors.filter((a) =>  a.isEnemy && a.currentHp > 0);

    let totalDmg = 0;
    for (const t of targets) {
      const tTypeMult = getTypeMultiplier(actor.worldId, t.worldId);
      const effDef = t.baseDef * t.defMultiplier;
      let dmg      = calcDamage(effAtk, skill.power, effDef);
      dmg          = Math.max(1, Math.round(dmg * tTypeMult));
      dmg          = applyShield(t, dmg);
      t.currentHp  = clampHp(t.currentHp - dmg, t.maxHp);
      totalDmg    += dmg;
    }
    return {
      tick: state.tickCount, actorName: actor.displayName,
      action: `${skill.displayName}（全体）`, value: totalDmg,
    };
  }

  // 行動対象なし（fallback）
  return { tick: state.tickCount, actorName: actor.displayName, action: '様子を見ている' };
}

/** ATK バフスキル（ちからだめ）のIDリスト */
const ATK_BUFF_SKILL_IDS = ['skill_buff_002'];

/** スキルIDごとのシールド軽減率テーブル */
const SHIELD_REDUCTION_MAP: Record<string, number> = {
  'skill_buff_001': SHIELD_REDUCTION,          // まもりのたて        55%
  'skill_def_001':  SHIELD_REDUCTION,          // いわのよろい        55%
  'skill_def_002':  SHIELD_REDUCTION_DEF_002,  // ブリザードアーマー  65%
  'skill_def_003':  SHIELD_REDUCTION_DEF_003,  // グレイシャーウォール 75%
};

function applyBuff(actor: BattleActor, skill: BattleSkillState): void {
  if (ATK_BUFF_SKILL_IDS.includes(skill.skillId)) {
    // ATKバフ: 倍率アップ + tick ベースで継続
    actor.atkMultiplier      = BUFF_MULTIPLIER;
    actor.buffTurnsRemaining = BUFF_TURNS;
  } else if (skill.skillId in SHIELD_REDUCTION_MAP) {
    // DEFシールド: スキルごとの軽減率 × 2被弾まで継続
    actor.shieldHitsRemaining = SHIELD_HITS;
    actor.damageReductionRate = SHIELD_REDUCTION_MAP[skill.skillId];
    // AI が再使用しないよう buffTurnsRemaining を大きく設定（シールド消滅時にリセット）
    actor.buffTurnsRemaining  = 999;
  } else {
    // その他 Buff: DEF 倍率アップ（後方互換）
    actor.defMultiplier      = BUFF_MULTIPLIER;
    actor.buffTurnsRemaining = BUFF_TURNS;
  }
}

/**
 * シールドによるダメージ軽減を適用し、被弾カウントを減らす。
 * シールドが切れたらフィールドをリセットする。
 * @returns 軽減後のダメージ値
 */
function applyShield(target: BattleActor, dmg: number): number {
  if (target.shieldHitsRemaining <= 0) return dmg;
  const reduced = Math.max(1, Math.floor(dmg * (1 - target.damageReductionRate)));
  target.shieldHitsRemaining--;
  if (target.shieldHitsRemaining <= 0) {
    target.shieldHitsRemaining = 0;
    target.damageReductionRate = 0;
    target.buffTurnsRemaining  = 0; // AI が再使用できるようリセット
  }
  return reduced;
}

function applyDebuff(target: BattleActor, skill: BattleSkillState): void {
  // Phase 7 簡易版: ATK ダウン
  target.atkMultiplier      = DEBUFF_MULTIPLIER;
  target.buffTurnsRemaining = BUFF_TURNS;
}

// ---------------------------------------------------------------------------
// メイン tick 処理
// ---------------------------------------------------------------------------

/**
 * 1 tick を処理して新しい BattleState を返す。
 * 勝敗確定後は状態を変えずに返す。
 *
 * @param state  現在の BattleState
 * @returns      更新後の BattleState（deep clone）
 */
export function processTick(state: BattleState): BattleState {
  if (state.outcome !== 'NONE') return state;

  const s = cloneBattleState(state);
  // pendingMainSkillId を処理後にクリア
  let clearPendingSkill = false;

  // ---- 1. タイマー加算 & クールダウン減少 ----
  for (const actor of s.actors) {
    if (actor.currentHp <= 0) continue;
    actor.actionTimer += TICK_SEC;
    for (const skill of actor.skills) {
      skill.cooldownRemaining = Math.max(0, skill.cooldownRemaining - TICK_SEC);
    }
    if (actor.buffTurnsRemaining > 0 && actor.buffTurnsRemaining !== 999) {
      // 999 はシールド中の sentinel 値 → tick では減らさない（被弾時に applyShield が管理）
      actor.buffTurnsRemaining--;
      if (actor.buffTurnsRemaining <= 0) {
        actor.atkMultiplier = 1.0;
        actor.defMultiplier = 1.0;
      }
    }
  }

  // ---- 2. 行動可能アクターを抽出 ----
  const readyActors = s.actors.filter((a) => {
    if (a.currentHp <= 0) return false;
    return a.actionTimer >= calcActionThreshold(a.spd);
  });

  // ---- 3. 行動順ソート（SPD 降順、主役優先、パーティ→敵） ----
  readyActors.sort((a, b) => {
    if (a.spd !== b.spd) return b.spd - a.spd;
    if (a.isMain && !b.isMain) return -1;
    if (!a.isMain && b.isMain) return  1;
    if (!a.isEnemy && b.isEnemy) return -1;
    if (a.isEnemy && !b.isEnemy) return  1;
    return 0;
  });

  // ---- 4. 各アクターの行動 ----
  for (const actor of readyActors) {
    if (actor.currentHp <= 0) continue;

    const action = (actor.isMain && !actor.isEnemy)
      ? decideMainAction(actor, s)
      : decideAiAction(actor, s);

    if (actor.isMain && s.pendingMainSkillId) clearPendingSkill = true;

    const logEntry = applyAction(actor, action, s);
    s.log.push(logEntry);
    actor.actionTimer = 0;

    const outcome = checkOutcome(s);
    if (outcome !== 'NONE') {
      s.outcome = outcome;
      s.tickCount++;
      if (clearPendingSkill) s.pendingMainSkillId = null;
      return s;
    }
  }

  s.tickCount++;
  if (clearPendingSkill) s.pendingMainSkillId = null;
  return s;
}
