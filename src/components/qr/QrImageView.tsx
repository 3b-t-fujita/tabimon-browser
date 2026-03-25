'use client';

/**
 * QR画像表示コンポーネント。
 * dataUrl（base64）を中央に大きく表示する。
 */

interface QrImageViewProps {
  dataUrl:  string;
  altText?: string;
  size?:    number;
}

export default function QrImageView({ dataUrl, altText = 'QRコード', size = 280 }: QrImageViewProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="rounded-2xl border-2 border-stone-200 bg-white p-4 shadow-lg"
        style={{ display: 'inline-flex' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          alt={altText}
          width={size}
          height={size}
          style={{ display: 'block', borderRadius: 8 }}
        />
      </div>
      <p className="text-xs font-bold text-stone-400">このQRを相手にスキャンしてもらおう 📲</p>
    </div>
  );
}
