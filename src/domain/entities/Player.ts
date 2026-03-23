/**
 * プレイヤーエンティティ。詳細設計 v4 §10.2 保存対象に準拠。
 * 保存先: IndexedDB main_save → player ストア
 */
import type { PlayerId, MonsterId, WorldId } from '@/types/ids';

export interface Player {
  /** プレイヤー固有ID（UUID） */
  readonly playerId: PlayerId;

  /** プレイヤー名（最大10文字、空文字不可） */
  readonly playerName: string;

  /**
   * 所属ワールド（初期設定で選択、変更不可）
   * WorldId の string 値（"WORLD_FOREST" 等）を保持
   */
  readonly worldId: WorldId;

  /**
   * 現在の主役モンスターの個体固有ID。
   * 未設定時は null。
   * 主役は手放し不可（MainMonsterPolicy.canRelease 参照）。
   */
  readonly mainMonsterId: MonsterId | null;
}
