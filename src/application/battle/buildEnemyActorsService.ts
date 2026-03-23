/**
 * 敵グループプールから BattleActor[] を構築するサービス。
 * 詳細設計 v4 §7 戦闘仕様に準拠。
 *
 * - poolId から enemy_groups.json を参照して敵一覧を取得
 * - 各敵エントリについてマスタデータを取得してステータスを計算
 * - モンスターマスタの initialSkillId からスキルを構築
 */
import type { BattleActor, BattleSkillState } from '@/domain/battle/BattleActor';
import type { SkillSnapshot } from '@/domain/valueObjects/SkillSnapshot';
import { getEnemyGroupByPoolId } from '@/infrastructure/master/enemyGroupRepository';
import {
  getMonsterMasterById,
  computeStats,
} from '@/infrastructure/master/monsterMasterRepository';
import { buildSkillSnapshot } from '@/infrastructure/master/skillMasterRepository';
import type { SkillId } from '@/types/ids';

// ---------------------------------------------------------------------------
// SkillSnapshot → BattleSkillState 変換
// ---------------------------------------------------------------------------

function toSkillState(s: SkillSnapshot): BattleSkillState {
  return {
    skillId:           s.skillId as string,
    displayName:       s.displayName,
    skillType:         s.skillType,
    power:             s.power,
    cooldownSec:       s.cooldownSec,
    targetCount:       s.targetCount,
    cooldownRemaining: 0,
  };
}

// ---------------------------------------------------------------------------
// バランス定数
// ---------------------------------------------------------------------------

/** 敵ステータス全体の基準倍率（1.0 = 等倍）。バランス調整はここを変える */
const ENEMY_STRENGTH_MULTIPLIER = 0.95;

// ---------------------------------------------------------------------------
// 公開 API
// ---------------------------------------------------------------------------

/**
 * 指定 poolId の敵グループを構築して返す。
 * poolId が存在しない場合は空配列を返す。
 * strengthMultiplier は ENEMY_STRENGTH_MULTIPLIER に追加で乗算される（ランダムイベント戦闘の0.7倍など）。
 */
export async function buildEnemyActors(poolId: string, strengthMultiplier = 1.0): Promise<BattleActor[]> {
  const group = await getEnemyGroupByPoolId(poolId);
  if (!group) return [];

  const actors: BattleActor[] = [];
  const combinedMultiplier = ENEMY_STRENGTH_MULTIPLIER * strengthMultiplier;

  for (let i = 0; i < group.enemies.length; i++) {
    const entry  = group.enemies[i];
    const master = await getMonsterMasterById(entry.monsterMasterId);
    const stats  = computeStats(master, entry.level);

    // バランス調整: HP / ATK / DEF に倍率を適用（SPD は変えない）
    const adjHp  = Math.max(1, Math.round(stats.maxHp * combinedMultiplier));
    const adjAtk = Math.max(1, Math.round(stats.atk   * combinedMultiplier));
    const adjDef = Math.max(1, Math.round(stats.def   * combinedMultiplier));

    // スキル構築（マスタに initialSkillId がある場合のみ）
    const skills: BattleSkillState[] = [];
    if (master?.initialSkillId) {
      const snapshot = await buildSkillSnapshot(master.initialSkillId as SkillId);
      if (snapshot) skills.push(toSkillState(snapshot));
    }

    actors.push({
      id:                 `enemy-${i}`,
      displayName:        entry.displayName,
      monsterId:          entry.monsterMasterId,
      isMain:             false,
      isEnemy:            true,
      maxHp:              adjHp,
      baseAtk:            adjAtk,
      baseDef:            adjDef,
      spd:                stats.spd,
      personality:        null,
      skills,
      currentHp:          adjHp,
      actionTimer:        0,
      atkMultiplier:      1.0,
      defMultiplier:      1.0,
      buffTurnsRemaining: 0,
    });
  }

  return actors;
}
