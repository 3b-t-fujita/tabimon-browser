'use client';

/**
 * QR 機能メニュー。
 * 「QR生成」と「QR読取」への入口を提供する。
 *
 * - QR生成: 仲間モンスターの QR を生成して相手に見せる
 * - QR読取: 相手の QR を読み取って仲間/助っ人として受け取る
 */
import { useRouter } from 'next/navigation';
import { GameLayout } from '@/components/common/GameLayout';

export default function QrMenuPage() {
  const router = useRouter();

  return (
    <GameLayout>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-stone-500 text-sm"
          >
            ← 戻る
          </button>
          <h1 className="text-lg font-bold">QR機能</h1>
        </div>

        <p className="text-sm text-stone-500">
          QRコードで仲間モンスターを交換できます
        </p>

        <div className="flex flex-col gap-3 mt-2">
          <button
            type="button"
            onClick={() => router.push('/qr/generate')}
            className="w-full rounded-xl bg-emerald-500 py-4 text-base font-bold text-white shadow transition hover:bg-emerald-600 active:scale-95"
          >
            📤 QR生成
          </button>
          <p className="text-xs text-stone-400 text-center -mt-1">
            自分の仲間モンスターの QR を作る
          </p>

          <button
            type="button"
            onClick={() => router.push('/qr/scan')}
            className="w-full rounded-xl bg-sky-500 py-4 text-base font-bold text-white shadow transition hover:bg-sky-600 active:scale-95"
          >
            📷 QR読取
          </button>
          <p className="text-xs text-stone-400 text-center -mt-1">
            相手の QR を読み取って仲間/助っ人にする
          </p>
        </div>
      </div>
    </GameLayout>
  );
}
