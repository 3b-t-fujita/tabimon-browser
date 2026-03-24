/**
 * Home 画面 component。
 * プレイヤー名・主役立ち絵（大）・仲間数・助っ人数・続きから表示。
 * 仲間一覧 → /monsters、編成 → /party、QR → /qr へ遷移。
 */
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { GameConstants } from '@/common/constants/GameConstants';
import type { HomeViewModel } from '@/application/viewModels/homeViewModel';
import { getMonsterStandUrl } from '@/infrastructure/assets/monsterImageService';

interface Props {
  vm: HomeViewModel;
  onContinue?: () => void;
}

export function HomeScreen({ vm, onContinue }: Props) {
  const router = useRouter();
  const mainStandUrl = getMonsterStandUrl(vm.mainMonsterId);

  return (
    <div className="flex flex-1 flex-col gap-0">

      {/* ─── ヒーローバナー ─── */}
      <div className="relative w-full overflow-hidden" style={{ height: 260 }}>

        {/* 背景 */}
        <Image
          src="/assets/backgrounds/bg_home_main_v1.webp"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />

        {/* 主役立ち絵（右寄せ・下揃え） */}
        {mainStandUrl && (
          <div className="absolute bottom-0 right-2 w-44 h-60 pointer-events-none">
            <Image
              src={mainStandUrl}
              alt={vm.mainMonsterName ?? '主役'}
              fill
              className="object-contain object-bottom drop-shadow-xl"
              priority
              sizes="176px"
            />
          </div>
        )}
        {/* 主役未設定時のプレースホルダー */}
        {!mainStandUrl && !vm.mainMonsterId && (
          <div className="absolute bottom-4 right-6 text-6xl pointer-events-none select-none opacity-40">🐾</div>
        )}

        {/* プレイヤー情報オーバーレイ（左下グラデーション） */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-800/85 via-emerald-700/50 to-transparent px-5 pt-10 pb-4">
          <p className="text-xs text-emerald-100">冒険者</p>
          <h1 className="text-xl font-bold text-white drop-shadow">{vm.playerName}</h1>
          {vm.mainMonsterName && (
            <p className="text-sm text-emerald-100 mt-0.5 drop-shadow">
              主役: <span className="font-semibold">{vm.mainMonsterName}</span>
            </p>
          )}
          {!vm.mainMonsterId && (
            <p className="text-sm text-emerald-200/70 mt-0.5">主役未設定</p>
          )}
        </div>
      </div>

      {/* ─── コンテンツエリア ─── */}
      <div className="flex flex-1 flex-col gap-4 p-5">

        {/* 仲間・助っ人数 */}
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">仲間</p>
            <p className="text-2xl font-bold text-stone-800">
              {vm.ownedCount}
              <span className="ml-1 text-sm font-normal text-stone-400">/ {vm.ownedCapacity}</span>
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">助っ人</p>
            <p className="text-2xl font-bold text-stone-800">
              {vm.supportCount}
              <span className="ml-1 text-sm font-normal text-stone-400">/ {vm.supportCapacity}</span>
            </p>
          </div>
        </section>

        {/* 続きから（条件付き） */}
        {vm.canContinue && (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="mb-1 text-xs font-semibold text-amber-600">
              {vm.continueType === 'PENDING_RESULT' ? 'リザルト確定待ち' : '冒険の続き'}
            </p>
            <p className="text-sm text-stone-600">ステージ: {vm.continueStageId}</p>
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
