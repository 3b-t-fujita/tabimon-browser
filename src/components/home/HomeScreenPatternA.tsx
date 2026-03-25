/**
 * ホーム画面 パターンA — ヒーロービジュアル重視
 * モンスターを画面の主役に置き、冒険への高揚感を前面に出したデザイン。
 */
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { HomeViewModel } from '@/application/viewModels/homeViewModel';
import { getMonsterStandUrl } from '@/infrastructure/assets/monsterImageService';

interface Props {
  vm: HomeViewModel;
  onContinue?: () => void;
}

export function HomeScreenPatternA({ vm, onContinue }: Props) {
  const router = useRouter();
  const mainStandUrl = getMonsterStandUrl(vm.mainMonsterMasterId);

  return (
    <div className="flex flex-1 flex-col bg-stone-50">

      {/* ══════════════════════════════════════
          ① ヒーローエリア
          背景 + 大きなモンスター立ち絵 + 下部オーバーレイ
      ══════════════════════════════════════ */}
      <div className="relative w-full shrink-0 overflow-hidden" style={{ height: 320 }}>

        {/* 背景画像 */}
        <Image
          src="/assets/backgrounds/bg_home_main_v1.webp"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />

        {/* 左上：タイトルロゴ風バッジ */}
        <div className="absolute left-4 top-4 z-10">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold tracking-widest text-white backdrop-blur-sm">
            TABIMON
          </span>
        </div>

        {/* 右上：仲間・助っ人カウント */}
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          <div className="flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-1 backdrop-blur-sm">
            <span className="text-xs">👥</span>
            <span className="text-xs font-bold text-white">{vm.ownedCount}/{vm.ownedCapacity}</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-1 backdrop-blur-sm">
            <span className="text-xs">🤝</span>
            <span className="text-xs font-bold text-white">{vm.supportCount}/{vm.supportCapacity}</span>
          </div>
        </div>

        {/* モンスター立ち絵 — 右寄せ大きく配置 */}
        {mainStandUrl ? (
          <div className="absolute bottom-0 right-0 w-52 h-72 pointer-events-none z-10">
            <Image
              src={mainStandUrl}
              alt={vm.mainMonsterName ?? '主役'}
              fill
              className="object-contain object-bottom"
              style={{ filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.5))' }}
              priority
              sizes="208px"
            />
          </div>
        ) : (
          <div className="absolute bottom-8 right-8 text-8xl pointer-events-none select-none opacity-30 z-10">🐾</div>
        )}

        {/* 下部グラデーションオーバーレイ */}
        <div
          className="absolute inset-x-0 bottom-0 z-20"
          style={{
            height: '60%',
            background: 'linear-gradient(to top, rgba(6,26,15,0.92) 0%, rgba(6,26,15,0.6) 50%, transparent 100%)',
          }}
        />

        {/* 左下：プレイヤー情報 */}
        <div className="absolute bottom-0 left-0 z-30 px-5 pb-5">
          <p className="text-[11px] font-semibold tracking-widest text-emerald-300/80 uppercase">冒険者</p>
          <h1 className="mt-0.5 text-2xl font-black text-white leading-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
            {vm.playerName}
          </h1>
          {vm.mainMonsterName ? (
            <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/30 px-2.5 py-0.5 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-emerald-100">{vm.mainMonsterName}</span>
            </div>
          ) : (
            <p className="mt-1 text-xs text-stone-400">主役未設定</p>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════
          ② アクションエリア
      ══════════════════════════════════════ */}
      <div className="flex flex-1 flex-col gap-3 px-4 pt-4 pb-6">

        {/* 続きから（進行中の冒険がある場合のみ） */}
        {vm.canContinue && (
          <div
            className="flex items-center gap-3 rounded-2xl border border-amber-200 p-4"
            style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-xl shadow-sm">
              {vm.continueType === 'PENDING_RESULT' ? '📋' : '▶️'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-700">
                {vm.continueType === 'PENDING_RESULT' ? 'リザルト確定待ち' : '冒険の続きがあります'}
              </p>
              <p className="mt-0.5 truncate text-sm font-bold text-stone-800">{vm.continueStageId}</p>
            </div>
            <button
              type="button"
              onClick={onContinue}
              className="shrink-0 rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-white shadow-sm transition active:scale-95 hover:bg-amber-500"
            >
              続きへ
            </button>
          </div>
        )}

        {/* メインCTA：冒険へ */}
        <button
          type="button"
          onClick={() => router.push('/adventure/stages')}
          className="relative w-full overflow-hidden rounded-2xl py-5 text-lg font-black text-white shadow-lg transition active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
            boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
          }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <span className="text-2xl">🗺️</span>
            <span>冒険へ出発！</span>
          </span>
          {/* 光沢ハイライト */}
          <span
            className="absolute inset-x-0 top-0 h-1/2 rounded-t-2xl"
            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)' }}
          />
        </button>

        {/* サブナビゲーション */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '👥', label: '仲間一覧', path: '/monsters' },
            { icon: '🛡️', label: '編成', path: '/party' },
            { icon: '📷', label: 'QR交換', path: '/qr' },
          ].map(({ icon, label, path }) => (
            <button
              key={path}
              type="button"
              onClick={() => router.push(path)}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-stone-200 bg-white py-4 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/50 active:scale-95"
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-xs font-semibold text-stone-600">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
