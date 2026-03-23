'use client';

/**
 * QR画像アップロード入力パネル。
 * 画像ファイルを受け取り、onFilePicked を呼ぶ。
 * 初期版は画像アップロード読取（カメラ直読取は次フェーズ）。
 */

interface QrScanInputPanelProps {
  onFilePicked: (file: File) => void;
  disabled:     boolean;
}

export default function QrScanInputPanel({ onFilePicked, disabled }: QrScanInputPanelProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFilePicked(file);
    // 同じファイルを再選択できるよう value をリセット
    e.target.value = '';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <label
        htmlFor="qr-scan-input"
        className={`flex flex-col items-center gap-2 w-full rounded-xl border-2 border-dashed border-stone-300 p-8 text-center cursor-pointer transition
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-emerald-400 hover:bg-emerald-50'}`}
      >
        <span className="text-4xl">📷</span>
        <span className="font-medium text-stone-600">QRコード画像を選択</span>
        <span className="text-xs text-stone-400">PNG / JPG / GIF に対応</span>
        <input
          id="qr-scan-input"
          type="file"
          accept="image/*"
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />
      </label>
    </div>
  );
}
