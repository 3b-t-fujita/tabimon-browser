'use client';

/**
 * QR 機能メニュー。
 * QR生成・QR読取への入口。
 */
import { useRouter } from 'next/navigation';
import { GameLayout } from '@/components/common/GameLayout';

export default function QrMenuPage() {
  const router = useRouter();

  return (
    <GameLayout>
      <div className="flex flex-1 flex-col" style={{ background: '#f8fafc' }}>

        {/* ヘッダー */}
        <header className="shrink-0 border-b border-stone-200 bg-white px-4 py-3.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1.5 text-sm font-semibold text-stone-600"
          >
            ← 戻る
          </button>
          <h1 className="mt-2 text-xl font-black text-stone-900">QR交換</h1>
          <p className="text-xs text-stone-400 mt-0.5">QRコードで仲間モンスターを交換しよう</p>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">

          {/* つながり体験メッセージ */}
          <div
            className="flex items-center gap-3 rounded-2xl border border-sky-100 px-4 py-3.5"
            style={{ background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)' }}
          >
            <span className="text-2xl">🤝</span>
            <div>
              <p className="text-sm font-black text-sky-700">仲間を交換しよう！</p>
              <p className="text-xs text-sky-500">友だちとQRを見せ合って仲間を増やそう</p>
            </div>
          </div>

          {/* QR生成カード */}
          <button
            type="button"
            onClick={() => router.push('/qr/generate')}
            className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border-2 bg-white p-5 text-left shadow-sm transition active:scale-95"
            style={{ borderColor: '#bbf7d0' }}
          >
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
              style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}
            >
              📤
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-base font-black text-stone-900">QR生成</span>
              <span className="text-xs text-stone-500">自分の仲間モンスターのQRを作る</span>
              <span className="mt-1 text-[10px] font-bold text-emerald-600">→ 相手に見せてスキャンしてもらおう</span>
            </div>
            <span
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-black text-white shadow"
              style={{ background: 'linear-gradient(135deg, #064e3b, #10b981)' }}
            >
              生成
            </span>
          </button>

          {/* QR読取カード */}
          <button
            type="button"
            onClick={() => router.push('/qr/scan')}
            className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border-2 bg-white p-5 text-left shadow-sm transition active:scale-95"
            style={{ borderColor: '#bae6fd' }}
          >
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
              style={{ background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)' }}
            >
              📷
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-base font-black text-stone-900">QR読取</span>
              <span className="text-xs text-stone-500">相手のQRを読み取って仲間/助っ人にする</span>
              <span className="mt-1 text-[10px] font-bold text-sky-600">→ 画像ファイルを選択してスキャン</span>
            </div>
            <span
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-black text-white shadow"
              style={{ background: 'linear-gradient(135deg, #0c4a6e, #38bdf8)' }}
            >
              読取
            </span>
          </button>

        </div>
      </div>
    </GameLayout>
  );
}
