/**
 * QrPayloadV1 から QR画像（base64 Data URL）を生成する UseCase。
 * 詳細設計 v4 §9.2 QR画像生成に準拠。
 *
 * 使用ライブラリ: qrcode
 * - JSON文字列化した payload を QR画像に変換する
 * - 返値は data:image/png;base64,... 形式
 */
import QRCode from 'qrcode';
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { QrErrorCode } from '@/common/errors/AppErrorCode';
import type { QrPayloadV1 } from '@/domain/entities/QrPayload';

export type GenerateQrImageErrorCode = typeof QrErrorCode.InvalidFormat;

export interface GenerateQrImagePayload {
  dataUrl: string;   // data:image/png;base64,...
}

export class GenerateQrImageUseCase {
  async execute(
    payload: QrPayloadV1,
  ): Promise<Result<GenerateQrImagePayload, GenerateQrImageErrorCode>> {
    try {
      const jsonStr = JSON.stringify(payload);
      const dataUrl = await QRCode.toDataURL(jsonStr, {
        errorCorrectionLevel: 'M',
        width: 512,
        margin: 4,
      });
      return ok({ dataUrl });
    } catch (err) {
      return fail(
        QrErrorCode.InvalidFormat,
        `QR画像生成に失敗しました: ${String(err)}`,
      );
    }
  }
}
