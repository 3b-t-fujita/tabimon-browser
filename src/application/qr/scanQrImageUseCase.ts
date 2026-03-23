/**
 * 画像ファイルから QR コードを読み取り、埋め込みテキストを返す UseCase。
 * 詳細設計 v4 §9 検証ステップ①「画像読取」に準拠。
 *
 * 使用ライブラリ: jsqr
 * - 初期版は画像アップロード（File）読取
 * - カメラ直読取は次フェーズ
 *
 * jsqr は ImageData（ピクセル配列）を要求するため、
 * ブラウザでは <canvas> を使って変換する。
 */
import jsQR from 'jsqr';
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { QrErrorCode } from '@/common/errors/AppErrorCode';

export type ScanQrImageErrorCode = typeof QrErrorCode.ParseFailed;

export interface ScanQrImagePayload {
  text: string;
}

export class ScanQrImageUseCase {
  /**
   * File オブジェクトから QR テキストを読み取る。
   * ブラウザ環境専用（canvas / createImageBitmap を使用）。
   */
  async execute(file: File): Promise<Result<ScanQrImagePayload, ScanQrImageErrorCode>> {
    try {
      const imageData = await fileToImageData(file);
      const result = jsQR(imageData.data, imageData.width, imageData.height);
      if (!result) {
        return fail(QrErrorCode.ParseFailed, 'QRコードを読み取れませんでした');
      }
      return ok({ text: result.data });
    } catch (err) {
      return fail(QrErrorCode.ParseFailed, `QR読取エラー: ${String(err)}`);
    }
  }

  /**
   * テキスト（すでに復号済みの文字列）を直接渡すオーバーロード。
   * テスト・直接入力用。
   */
  fromText(text: string): Result<ScanQrImagePayload, ScanQrImageErrorCode> {
    if (!text.trim()) {
      return fail(QrErrorCode.ParseFailed, 'QRテキストが空です');
    }
    return ok({ text });
  }
}

// ---------------------------------------------------------------------------
// ブラウザ専用ヘルパー
// ---------------------------------------------------------------------------

async function fileToImageData(file: File): Promise<ImageData> {
  const bitmap = await createImageBitmap(file);

  // モバイルのcanvasサイズ制限対策: 長辺を最大1500pxにダウンスケール。
  // QRコードの読取精度には影響しない（jsQRは部分QRも認識可能）。
  const MAX_SIDE = 1500;
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width  * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width  = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context を取得できませんでした');
  ctx.drawImage(bitmap, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}
