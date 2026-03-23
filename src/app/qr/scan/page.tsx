'use client';

/**
 * QRスキャンページ。
 * 画像アップロードで QR を読み取り、検証を経て /qr/confirm へ遷移する。
 *
 * 検証順（崩してはいけない）:
 *   1. 画像読取 (ScanQrImageUseCase)
 *   2. 文字列復号 → JSON解析 (ParseQrPayloadUseCase)
 *   3. version確認 (ValidateQrVersionUseCase)
 *   4. checksum確認 (ValidateQrChecksumUseCase)
 *   5. → /qr/confirm へ遷移（重複確認は受取時に行う）
 */
import { useRouter } from 'next/navigation';
import { GameLayout } from '@/components/common/GameLayout';
import QrScanInputPanel from '@/components/qr/QrScanInputPanel';
import { useQrStore } from '@/stores/qrStore';
import { ScanQrImageUseCase } from '@/application/qr/scanQrImageUseCase';
import { ParseQrPayloadUseCase } from '@/application/qr/parseQrPayloadUseCase';
import { ValidateQrVersionUseCase } from '@/application/qr/validateQrVersionUseCase';
import { ValidateQrChecksumUseCase } from '@/application/qr/validateQrChecksumUseCase';

export default function QrScanPage() {
  const router = useRouter();
  const { phase, errorMessage, setPhase, setParsedPayload, setError, reset } = useQrStore();

  const isProcessing = phase !== 'QR_IDLE' && phase !== 'QR_ERROR';

  const handleFilePicked = async (file: File) => {
    reset();

    // ---- ① 画像読取 ----
    setPhase('QR_SCANNING');
    const scanner = new ScanQrImageUseCase();
    const scanResult = await scanner.execute(file);
    if (!scanResult.ok) {
      setError(scanResult.message ?? scanResult.errorCode);
      return;
    }

    // ---- ② JSON解析 ----
    setPhase('QR_PARSE_JSON');
    const parser = new ParseQrPayloadUseCase();
    const parseResult = parser.execute(scanResult.value.text);
    if (!parseResult.ok) {
      setError(parseResult.message ?? parseResult.errorCode);
      return;
    }

    // ---- ③ version確認 ----
    setPhase('QR_VALIDATE_VERSION');
    const versionUC = new ValidateQrVersionUseCase();
    const versionResult = versionUC.execute(parseResult.value);
    if (!versionResult.ok) {
      setError(versionResult.message ?? versionResult.errorCode);
      return;
    }

    // ---- ④ checksum確認 ----
    setPhase('QR_VALIDATE_CHECKSUM');
    const checksumUC = new ValidateQrChecksumUseCase();
    const checksumResult = await checksumUC.execute(parseResult.value);
    if (!checksumResult.ok) {
      setError(checksumResult.message ?? checksumResult.errorCode);
      return;
    }

    // ---- 受取確認へ ----
    setParsedPayload(parseResult.value);
    router.push('/qr/confirm');
  };

  const phaseLabel: Record<string, string> = {
    QR_SCANNING:           '画像を読み取り中...',
    QR_PARSE_JSON:         'データを解析中...',
    QR_VALIDATE_VERSION:   'バージョンを確認中...',
    QR_VALIDATE_CHECKSUM:  'チェックサムを確認中...',
  };

  return (
    <GameLayout>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.back()} className="text-stone-500 text-sm">← 戻る</button>
          <h1 className="text-lg font-bold">QR読取</h1>
        </div>

        <p className="text-sm text-stone-500">相手のQRコード画像を選択してください</p>

        <QrScanInputPanel onFilePicked={handleFilePicked} disabled={isProcessing} />

        {/* 処理中ラベル */}
        {isProcessing && (
          <p className="text-center text-sm text-stone-500 animate-pulse">
            {phaseLabel[phase] ?? '処理中...'}
          </p>
        )}

        {/* エラー表示 */}
        {phase === 'QR_ERROR' && errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="font-bold text-red-600 text-sm">読み取りに失敗しました</p>
            <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
            <button
              type="button"
              onClick={reset}
              className="mt-3 px-4 py-1 rounded bg-red-500 text-white text-sm"
            >
              もう一度試す
            </button>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
