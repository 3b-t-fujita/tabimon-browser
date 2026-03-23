/**
 * QrPayloadV1 の version を検証する UseCase。
 * 詳細設計 v4 §9 検証ステップ④「version確認」に準拠。
 *
 * 検証順: version → checksum → duplicate を崩さないこと。
 * このUseCase は checksum / duplicate より先に呼ぶこと。
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { QrErrorCode } from '@/common/errors/AppErrorCode';
import { GameConstants } from '@/common/constants/GameConstants';
import type { QrPayloadV1 } from '@/domain/entities/QrPayload';

export type ValidateQrVersionErrorCode = typeof QrErrorCode.VersionMismatch;

export class ValidateQrVersionUseCase {
  execute(payload: QrPayloadV1): Result<void, ValidateQrVersionErrorCode> {
    if (payload.payloadVersion !== GameConstants.QR_PAYLOAD_VERSION) {
      return fail(
        QrErrorCode.VersionMismatch,
        `非対応バージョンです: ${payload.payloadVersion}（対応: ${GameConstants.QR_PAYLOAD_VERSION}）`,
      );
    }
    return ok(undefined);
  }
}
