/**
 * QRペイロード（QR_V1）。詳細設計 v4 §9.2 に準拠。
 *
 * checksum計算対象と連結順（| 区切り）:
 *   payload_version | source_unique_monster_id | monster_master_id | display_name
 *   | world_id | role_id | personality_id | level | skill_snapshot | FIXED_SALT
 *
 * QR検証順: version → checksum → duplicate を崩してはいけない。
 * QR上限時は単純拒否（入替画面へ遷移しない）。
 */
import { GameConstants } from '@/common/constants/GameConstants';

export interface QrPayloadV1 {
  /** ペイロードバージョン（固定: "QR_V1"） */
  readonly payloadVersion: typeof GameConstants.QR_PAYLOAD_VERSION;

  /**
   * 元モンスターの個体固有ID。
   * 重複判定キー。仲間・助っ人横断で source_unique_monster_id 単位でチェックする。
   */
  readonly sourceUniqueMonsterIdFromQr: string;

  /** モンスター種別マスタID */
  readonly monsterMasterId: string;

  /** 表示名 */
  readonly displayName: string;

  /** 所属ワールドID */
  readonly worldId: string;

  /** ロールID */
  readonly roleId: string;

  /** 性格ID */
  readonly personalityId: string;

  /** レベル */
  readonly level: number;

  /**
   * スキルスナップショット文字列。
   * スキルID配列を表示順で連結した文字列（例: "skill_001|skill_002"）。
   * checksum計算に使用。
   */
  readonly skillSnapshot: string;

  /** 改ざん検知用checksum（固定ソルト付き簡易ハッシュ） */
  readonly checksumHash: string;
}

/** QR受取の分類 */
export type QrReceiveDestination = 'support' | 'owned' | 'dismiss';
