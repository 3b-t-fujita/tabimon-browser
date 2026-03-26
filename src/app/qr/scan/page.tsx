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
      <div className="flex flex-1 flex-col bg-[#f5f7f0] text-[#2c302b]">

        <header className="shrink-0 border-b border-emerald-950/5 bg-white/70 px-5 py-4 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full bg-[#e6e9e1] px-4 py-2 text-sm font-semibold text-[#29664c]"
          >
            ← 戻る
          </button>
          <p className="mt-4 text-[10px] font-black tracking-[0.14em] text-[#6c4324]/70">コードを読む</p>
          <h1 className="mt-1 text-[clamp(26px,7vw,30px)] font-black leading-tight tracking-tight text-[#1f3528]">コードを読む</h1>
          <p className="mt-2 text-sm text-[#595c57]">相手のコード画像を選択してください。</p>
        </header>

        <div className="flex flex-1 flex-col gap-4 px-5 py-5">

          <QrScanInputPanel onFilePicked={handleFilePicked} disabled={isProcessing} />

          {/* 処理中 */}
          {isProcessing && (
            <div
              className="flex items-center justify-center gap-2 rounded-[24px] bg-[#eef7f8] px-4 py-4"
            >
              <span className="text-base animate-pulse">📡</span>
              <p className="text-sm font-bold text-[#1e4f57] animate-pulse">
                {phaseLabel[phase] ?? '処理中...'}
              </p>
            </div>
          )}

          {/* エラー */}
          {phase === 'QR_ERROR' && errorMessage && (
            <div className="flex flex-col gap-3 rounded-[24px] bg-[#fff1ec] p-4">
              <div>
                <p className="font-black text-[#b02500] text-sm">読み取りに失敗しました</p>
                <p className="mt-1 text-xs text-[#d06345]">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={reset}
                className="w-full rounded-full bg-[#b02500] py-3 text-sm font-black text-white shadow-sm transition active:scale-95"
              >
                もう一度試す
              </button>
            </div>
          )}

        </div>
      </div>
    </GameLayout>
  );
}
