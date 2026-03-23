/**
 * QR checksum 計算・検証。詳細設計 v4 §9.9 checksum計算仕様に準拠。
 *
 * 計算対象の連結順（| 区切り）:
 *   1. payload_version
 *   2. source_unique_monster_id
 *   3. monster_master_id
 *   4. display_name
 *   5. world_id
 *   6. role_id
 *   7. personality_id
 *   8. level
 *   9. skill_snapshot
 *  10. FIXED_SALT
 *
 * C# の SHA256 実装をブラウザの WebCrypto API (SubtleCrypto) へ読み替え。
 * 計算結果は C# 実装と同一の hex string になる。
 */
import type { QrPayloadV1 } from '@/domain/entities/QrPayload';
import { GameConstants } from '@/common/constants/GameConstants';

// 固定ソルト。C# 実装と一致させること。
const FIXED_SALT = 'TABIMON_QR_SALT_V1';

/**
 * QrPayloadV1 の checksum を計算して返す。
 * 非同期（WebCrypto API 使用）。
 */
export async function computeChecksum(payload: QrPayloadV1): Promise<string> {
  const raw = buildRaw(payload);
  return hashSha256(raw);
}

/**
 * QrPayloadV1 の checksum が正しいか検証する。
 * 非同期（WebCrypto API 使用）。
 */
export async function verifyChecksum(payload: QrPayloadV1): Promise<boolean> {
  if (!payload.checksumHash) return false;
  const expected = await computeChecksum(payload);
  return expected === payload.checksumHash;
}

function buildRaw(p: QrPayloadV1): string {
  const sep = GameConstants.QR_CHECKSUM_SEPARATOR;
  return [
    p.payloadVersion,
    p.sourceUniqueMonsterIdFromQr,
    p.monsterMasterId,
    p.displayName,
    p.worldId,
    p.roleId,
    p.personalityId,
    String(p.level),
    p.skillSnapshot,
    FIXED_SALT,
  ].join(sep);
}

async function hashSha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
