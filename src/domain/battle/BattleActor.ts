/**
 * 戦闘参加者（BattleActor）型定義。
 * 詳細設計 v4 §7 戦闘仕様に準拠。
 *
 * フィールドは戦闘中に変化する（mutable）。
 * BattleState / BattleTickEngine 内でのみ直接変更すること。
 * UI からは読み取りのみ行うこと。
 */
import type { SkillType, PersonalityType } from '@/common/constants/enums';

/** 戦闘中のスキル状態（クールダウン追跡付き） */
export interface BattleSkillState {
  skillId:           string;
  displayName:       string;
  skillType:         SkillType;
  power:             number;
  cooldownSec:       number;  // 再使用CT（秒）
  targetCount:       number;  // 0=全体, 1=単体
  cooldownRemaining: number;  // 残CT（秒）。0 = 使用可能
}

/** 戦闘参加者。パーティメンバーまたは敵 */
export interface BattleActor {
  /** 一意ID（パーティメンバー: uniqueId, 敵: "enemy-0", "enemy-1"...） */
  id:              string;
  displayName:     string;
  isMain:          boolean;
  isEnemy:         boolean;
  maxHp:           number;
  baseAtk:         number;
  baseDef:         number;
  spd:             number;
  personality:     PersonalityType | null;
  skills:          BattleSkillState[];

  /** 変化するフィールド */
  currentHp:       number;
  /** 行動タイマー（0.5秒毎に +0.5）。actionThreshold = 20.0/spd に達すると行動 */
  actionTimer:     number;
  /** ATKバフ/デバフ倍率（1.0=なし, 1.2=バフ, 0.8=デバフ） */
  atkMultiplier:   number;
  /** DEFバフ/デバフ倍率 */
  defMultiplier:   number;
  /** バフ/デバフの残りtick数（0=効果なし） */
  buffTurnsRemaining: number;
}

/** 行動しきい値を計算する（SPD に基づく） */
export function calcActionThreshold(spd: number): number {
  return 20.0 / Math.max(1, spd);
}
