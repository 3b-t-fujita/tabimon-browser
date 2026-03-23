/**
 * QrPayloadV1 の checksum を検証する UseCase。
 * 詳細設計 v4 §9 検証ステップ⑤「checksum確認」に準拠。
 *
 * 検証順: version → checksum → duplicate を崩さないこと。
 * このUseCase は version確認済み後、duplicate より先に呼ぶこと。
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { QrErrorCode } from '@/common/errors/AppErrorCode';
import type { QrPayloadV1 } from '@/domain/entities/QrPayload';
import { verifyChecksum } from '@/domain/services/QrChecksumService';

export type ValidateQrChecksumErrorCode = typeof QrErrorCode.ChecksumMismatch;

export class ValidateQrChecksumUseCase {
  async execute(payload: QrPayloadV1): Promise<Result<void, ValidateQrChecksumErrorCode>> {
    const valid = await verifyChecksum(payload);
    if (!valid) {
      return fail(QrErrorCode.ChecksumMismatch, 'QRコードのchecksum検証に失敗しました（改ざんの可能性）');
    }
    return ok(undefined);
  }
}
