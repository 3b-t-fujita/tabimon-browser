/**
 * QR受取のビジネスルール。詳細設計 v4 §9.6 重複判定、§9.7 上限判定に準拠。
 *
 * 重要仕様（崩してはいけない）:
 * - 重複判定は仲間・助っ人横断で sourceUniqueMonsterIdFromQr 単位
 * - QR上限到達時は入替画面へ遷移せず単純拒否（QR_OWNED_CAPACITY_FULL / QR_SUPPORT_CAPACITY_FULL）
 * - 候補受取の上限時のみ入替画面を使用（QRとは別導線）
 *
 * QR検証順: version → checksum → duplicate（この順を崩してはいけない）
 * 検証順の最終段階として、上限チェックを行う。
 */
import type { QrPayloadV1 } from '@/domain/entities/QrPayload';
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';
import type { SupportMonster } from '@/domain/entities/SupportMonster';
import { QrErrorCode } from '@/common/errors/AppErrorCode';
import { isOwnedAtCapacity } from './OwnedCapacityPolicy';
import { isSupportAtCapacity } from './SupportCapacityPolicy';

/**
 * QRペイロードを助っ人として受取可能か検証する。
 * 重複 → 助っ人上限 の順でチェックする。
 * 上限時は QR_SUPPORT_CAPACITY_FULL を返す（入替画面へは遷移しない）。
 */
export function validateForSupport(
  payload: QrPayloadV1,
  owned: readonly OwnedMonster[],
  supports: readonly SupportMonster[]
): QrErrorCode {
  if (isDuplicate(payload.sourceUniqueMonsterIdFromQr, owned, supports)) {
    return QrErrorCode.Duplicate;
  }
  if (isSupportAtCapacity(supports)) {
    return QrErrorCode.SupportCapacityFull; // 単純拒否
  }
  return QrErrorCode.None;
}

/**
 * QRペイロードを仲間として受取可能か検証する。
 * 重複 → 仲間上限 の順でチェックする。
 * 上限時は QR_OWNED_CAPACITY_FULL を返す（入替画面へは遷移しない）。
 */
export function validateForOwned(
  payload: QrPayloadV1,
  owned: readonly OwnedMonster[],
  supports: readonly SupportMonster[]
): QrErrorCode {
  if (isDuplicate(payload.sourceUniqueMonsterIdFromQr, owned, supports)) {
    return QrErrorCode.Duplicate;
  }
  if (isOwnedAtCapacity(owned)) {
    return QrErrorCode.OwnedCapacityFull; // 単純拒否
  }
  return QrErrorCode.None;
}

/**
 * 仲間・助っ人横断で重複判定する。
 * sourceUniqueMonsterIdFromQr 単位でチェックする。
 */
function isDuplicate(
  sourceId: string,
  owned: readonly OwnedMonster[],
  supports: readonly SupportMonster[]
): boolean {
  if (owned.some((m) => m.uniqueId === sourceId)) return true;
  if (supports.some((s) => s.sourceUniqueMonsterIdFromQr === sourceId)) return true;
  return false;
}
