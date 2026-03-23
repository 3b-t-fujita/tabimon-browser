'use client';

/**
 * QR画像表示コンポーネント。
 * dataUrl（base64）を <img> で表示する。
 */

interface QrImageViewProps {
  dataUrl: string;
  altText?: string;
  size?: number;
}

export default function QrImageView({ dataUrl, altText = 'QRコード', size = 300 }: QrImageViewProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dataUrl}
        alt={altText}
        width={size}
        height={size}
        className="rounded-lg border-2 border-stone-300 shadow"
      />
      <p className="text-xs text-stone-400">このQRを相手に読み取らせてください</p>
    </div>
  );
}
