/**
 * QRテキスト文字列を QrPayloadV1 へパースする UseCase。
 * 詳細設計 v4 §9 検証ステップ②③「文字列復号・JSON解析」に準拠。
 *
 * 検証内容:
 * - JSON.parse の成否
 * - 最低限のフィールド存在確認（payloadVersion, checksumHash の存在）
 *
 * version / checksum の値検証は後続 UseCase（ValidateQrVersion/Checksum）が行う。
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { QrErrorCode } from '@/common/errors/AppErrorCode';
import type { QrPayloadV1 } from '@/domain/entities/QrPayload';

export type ParseQrPayloadErrorCode = typeof QrErrorCode.ParseFailed | typeof QrErrorCode.InvalidFormat;

const REQUIRED_FIELDS: (keyof QrPayloadV1)[] = [
  'payloadVersion',
  'sourceUniqueMonsterIdFromQr',
  'monsterMasterId',
  'displayName',
  'worldId',
  'roleId',
  'personalityId',
  'level',
  'skillSnapshot',
  'checksumHash',
];

export class ParseQrPayloadUseCase {
  execute(text: string): Result<QrPayloadV1, ParseQrPayloadErrorCode> {
    // ---- JSON解析 ----
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return fail(QrErrorCode.ParseFailed, 'QRコードのJSON解析に失敗しました');
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return fail(QrErrorCode.InvalidFormat, 'QRコードのフォーマットが不正です');
    }

    // ---- 必須フィールド確認 ----
    const obj = parsed as Record<string, unknown>;
    for (const field of REQUIRED_FIELDS) {
      if (!(field in obj)) {
        return fail(QrErrorCode.InvalidFormat, `必須フィールドが欠損しています: ${field}`);
      }
    }

    return ok(obj as unknown as QrPayloadV1);
  }
}
