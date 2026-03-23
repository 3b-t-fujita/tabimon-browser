/**
 * パーティメンバー1体分のスナップショット。詳細設計 v4 §5.4 に準拠。
 * 冒険開始時に固定し、冒険中は変更不可。
 */
import type { MonsterId, MonsterMasterId } from '@/types/ids';
import type { PersonalityType } from '@/common/constants/enums';
import type { MonsterStats } from './MonsterStats';
import type { SkillSnapshot } from './SkillSnapshot';

export interface PartyMemberSnapshot {
  readonly uniqueId:        MonsterId;
  readonly monsterMasterId: MonsterMasterId;
  readonly displayName:     string;
  readonly personality:     PersonalityType;
  readonly stats:           MonsterStats;
  readonly skills:          readonly SkillSnapshot[];
  readonly isMain:          boolean;
}
