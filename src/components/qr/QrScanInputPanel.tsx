'use client';

import { PrimaryButton } from '@/components/common/PrimaryButton';

interface QrScanInputPanelProps {
  onFilePicked: (file: File) => void;
  disabled: boolean;
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
      className={`flex flex-col items-center gap-4 rounded-[30px] px-6 py-10 text-center shadow-sm transition ${
        disabled
          ? 'cursor-not-allowed border border-[#e6e9e1] bg-white opacity-50'
          : 'cursor-pointer border border-[#d6f0f3] bg-white active:scale-[0.99]'
      }`}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#eef7f8] text-4xl">📷</div>
      <div className="flex flex-col gap-1">
        <span className="text-lg font-black text-[#2c302b]">QRコード画像を選択</span>
        <span className="text-sm text-[#595c57]">PNG / JPG / GIF に対応しています。スクリーンショットでも試せます。</span>
      </div>
      <div className="pointer-events-none">
        <PrimaryButton className="w-auto px-5 py-2 text-xs shadow-sm">ファイルを選ぶ</PrimaryButton>
      </div>
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
