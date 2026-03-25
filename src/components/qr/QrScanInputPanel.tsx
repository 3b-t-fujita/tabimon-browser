'use client';

/**
 * QR画像アップロード入力パネル。
 * 画像ファイルを受け取り onFilePicked を呼ぶ。
 */

interface QrScanInputPanelProps {
  onFilePicked: (file: File) => void;
  disabled:     boolean;
}

export default function QrScanInputPanel({ onFilePicked, disabled }: QrScanInputPanelProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFilePicked(file);
    e.target.value = '';
  };

  return (
    <label
      htmlFor="qr-scan-input"
      className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition ${
        disabled
          ? 'cursor-not-allowed opacity-50 border-stone-200 bg-stone-50'
          : 'cursor-pointer border-sky-200 bg-sky-50 hover:border-sky-400 hover:bg-sky-100 active:scale-95'
      }`}
    >
      <span className="text-5xl">📷</span>
      <div className="flex flex-col gap-1">
        <span className="text-base font-black text-sky-700">QRコード画像を選択</span>
        <span className="text-xs text-stone-400">PNG / JPG / GIF に対応</span>
      </div>
      <span
        className="rounded-full px-4 py-2 text-xs font-black text-white shadow"
        style={{ background: 'linear-gradient(135deg, #0c4a6e, #38bdf8)' }}
      >
        ファイルを選ぶ
      </span>
      <input
        id="qr-scan-input"
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />
    </label>
  );
}
