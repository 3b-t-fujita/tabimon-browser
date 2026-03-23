/**
 * Home 画面 component。
 * プレイヤー名・主役・仲間数・助っ人数・続きから表示。
 * 仲間一覧 → /monsters、編成 → /party、QR → /qr へ遷移。
 */
'use client';

import { useRouter } from 'next/navigation';
import { GameConstants } from '@/common/constants/GameConstants';
import type { HomeViewModel } from '@/application/viewModels/homeViewModel';

interface Props {
  vm: HomeViewModel;
  onContinue?: () => void;
}

export function HomeScreen({ vm, onContinue }: Props) {
  const router = useRouter();
  return (
    <div className="flex flex-1 flex-col gap-0">
      {/* ヘッダー */}
      <header className="bg-emerald-500 px-5 py-4">
        <p className="text-sm text-emerald-100">冒険者</p>
        <h1 className="text-xl font-bold text-white">{vm.playerName}</h1>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* 主役カード */}
        <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">主役</p>
          {vm.mainMonsterId ? (
            <p className="text-lg font-bold text-stone-800">
              {vm.mainMonsterName || vm.mainMonsterId}
            </p>
          ) : (
            <p className="text-sm text-stone-400">未設定</p>
          )}
        </section>

        {/* 仲間・助っ人数 */}
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">仲間</p>
            <p className="text-2xl font-bold text-stone-800">
              {vm.ownedCount}
              <span className="ml-1 text-sm font-normal text-stone-400">
                / {vm.ownedCapacity}
              </span>
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">助っ人</p>
            <p className="text-2xl font-bold text-stone-800">
              {vm.supportCount}
              <span className="ml-1 text-sm font-normal text-stone-400">
                / {vm.supportCapacity}
              </span>
            </p>
          </div>
        </section>

        {/* 続きから（条件付き） */}
        {vm.canContinue && (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="mb-1 text-xs font-semibold text-amber-600">
              {vm.continueType === 'PENDING_RESULT' ? 'リザルト確定待ち' : '冒険の続き'}
            </p>
            <p className="text-sm text-stone-600">
              ステージ: {vm.continueStageId}
            </p>
            <button
              type="button"
              onClick={onContinue}
              className="mt-3 w-full rounded-lg bg-amber-400 py-2 text-sm font-bold text-white transition hover:bg-amber-500 active:scale-95"
            >
              続きから
            </button>
          </section>
        )}

        {/* アクションボタン群 */}
        <section className="mt-auto flex flex-col gap-3">
          <button
            type="button"
            onClick={() => router.push('/adventure/stages')}
            className="w-full rounded-xl bg-emerald-500 py-4 text-base font-bold text-white shadow transition hover:bg-emerald-600 active:scale-95"
          >
            🗺️ 冒険へ
          </button>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => router.push('/monsters')}
              className="rounded-xl border border-stone-300 bg-white py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50 active:scale-95"
            >
              👥 仲間一覧
            </button>
            <button
              type="button"
              onClick={() => router.push('/party')}
              className="rounded-xl border border-stone-300 bg-white py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50 active:scale-95"
            >
              🛡️ 編成
            </button>
            <button
              type="button"
              onClick={() => router.push('/qr')}
              className="rounded-xl border border-stone-300 bg-white py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50 active:scale-95"
            >
              📷 QR
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
