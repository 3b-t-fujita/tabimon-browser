/**
 * スキルのスナップショット。AdventureSession の PartySnapshot 内で使用。
 * 詳細設計 v4 §7.4 CT処理、§7.8 スキル種別に準拠。
 * 冒険開始時に固定し、冒険中は変更不可。
 */
import type { SkillId } from '@/types/ids';
import type { SkillType } from '@/common/constants/enums';

export interface SkillSnapshot {
  readonly skillId:     SkillId;
  readonly displayName: string;   // スキル表示名
  readonly skillType:   SkillType;
  readonly cooldownSec: number;  // スキル再使用CT（秒単位）
  readonly power:       number;  // スキル威力係数
  readonly targetCount: number;  // 対象数（0=全体）
}
