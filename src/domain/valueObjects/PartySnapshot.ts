/**
 * 冒険開始時の編成スナップショット。詳細設計 v4 §5.4 に準拠。
 * AdventureSession に保持し、冒険中は変更不可。
 * 主役変更・助っ人変更の反映は次回冒険開始時から有効。
 *
 * - 主役（main）は必須
 * - 助っ人（supporters）は0〜2体
 */
import type { PartyMemberSnapshot } from './PartyMemberSnapshot';

export interface PartySnapshot {
  /** 主役（必須。助っ人を主役にはできない） */
  readonly main: PartyMemberSnapshot;
  /** 助っ人0〜2体 */
  readonly supporters: readonly PartyMemberSnapshot[];
}
