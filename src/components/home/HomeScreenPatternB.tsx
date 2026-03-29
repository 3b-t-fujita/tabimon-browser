/**
 * ホーム画面 パターンB — 情報整理重視
 * モンスターカード + クリーンな2×2ナビグリッド。
 * 情報の優先順位が明確で、スマホで一目で状況が把握できるダッシュボード型デザイン。
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

export function HomeScreenPatternB({ vm, onContinue }: Props) {
  const router = useRouter();
  const mainStandUrl = getMonsterStandUrl(vm.mainMonsterMasterId);

  return (
    <div className="flex flex-1 flex-col" style={{ background: '#f0fdf4' }}>

      {/* ══════════════════════════════════════
          ① トップヘッダー
      ══════════════════════════════════════ */}
      <div
        className="relative shrink-0 overflow-hidden px-4 pb-6 pt-5"
        style={{ background: 'linear-gradient(160deg, #064e3b 0%, #065f46 60%, #047857 100%)' }}
      >
        {/* 装飾的な円 */}
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6ee7b7, transparent)' }}
        />

        {/* プレイヤー名 */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[0.15em] text-emerald-400/80 uppercase">冒険者</p>
            <h1 className="mt-0.5 text-xl font-black text-white">{vm.playerName}</h1>
          </div>
          <div className="flex gap-2 pt-1">
            <div className="rounded-lg bg-white/10 px-2.5 py-1.5 text-center backdrop-blur-sm">
              <p className="text-[10px] font-semibold text-emerald-300">仲間</p>
              <p className="text-sm font-black text-white">{vm.ownedCount}<span className="text-xs font-normal text-emerald-300">/{vm.ownedCapacity}</span></p>
            </div>
            <div className="rounded-lg bg-white/10 px-2.5 py-1.5 text-center backdrop-blur-sm">
              <p className="text-[10px] font-semibold text-emerald-300">おたすけ</p>
              <p className="text-sm font-black text-white">{vm.supportCount}<span className="text-xs font-normal text-emerald-300">/{vm.supportCapacity}</span></p>
            </div>
          </div>
        </div>

        {/* モンスターカード（ヘッダー下部にフロート） */}
        <div
          className="relative mt-4 overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm"
          style={{ minHeight: 100 }}
        >
          <div className="flex items-end gap-0">
            {/* モンスター立ち絵エリア */}
            <div className="relative shrink-0" style={{ width: 110, height: 120 }}>
              {mainStandUrl ? (
                <Image
                  src={mainStandUrl}
                  alt={vm.mainMonsterName ?? '相棒'}
                  fill
                  className="object-contain object-bottom"
                  style={{ filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.4))' }}
                  priority
                  sizes="110px"
                />
              ) : (
                <div className="flex h-full w-full items-end justify-center pb-2 text-6xl opacity-30">🐾</div>
              )}
            </div>

            {/* モンスター情報 */}
            <div className="flex-1 py-4 pr-4">
              {vm.mainMonsterName ? (
                <>
                  <p className="text-[10px] font-semibold text-emerald-300/70 uppercase tracking-wide">相棒モンスター</p>
                  <p className="mt-0.5 text-lg font-black text-white leading-tight">{vm.mainMonsterName}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="rounded-md bg-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-200">🌿 森</span>
                    <span className="rounded-md bg-sky-500/30 px-2 py-0.5 text-[10px] font-bold text-sky-200">サポート</span>
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-sm text-emerald-300/70">相棒未設定</p>
                  <p className="mt-1 text-xs text-emerald-400/50">仲間一覧から設定しましょう</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          ② アクションエリア（上部が少し丸く浮いて見えるように）
      ══════════════════════════════════════ */}
      <div
        className="mx-3 -mt-3 flex flex-1 flex-col gap-3 rounded-t-3xl px-3 pt-4 pb-6"
        style={{ background: '#f0fdf4' }}
      >

        {/* 続きから */}
        {vm.canContinue && (
          <div className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 border border-amber-100 shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-base shadow-sm">
              {vm.continueType === 'PENDING_RESULT' ? '📋' : '▶️'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-700">
                {vm.continueType === 'PENDING_RESULT' ? 'リザルト確定待ち' : '冒険の続き'}
              </p>
              <p className="truncate text-xs text-stone-500 mt-0.5">{vm.continueStageId}</p>
            </div>
            <button
              type="button"
              onClick={onContinue}
              className="shrink-0 rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-bold text-white transition active:scale-95 hover:bg-amber-500"
            >
              再開
            </button>
          </div>
        )}

        {/* メインCTA */}
        <button
          type="button"
          onClick={() => router.push('/adventure/stages')}
          className="relative w-full overflow-hidden rounded-2xl py-5 text-base font-black text-white shadow-md transition active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="text-xl">🗺️</span>
            <span>冒険へ出発！</span>
          </span>
          <span
            className="absolute inset-x-0 top-0 h-1/2 rounded-t-2xl"
            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)' }}
          />
        </button>

        {/* 2×2 サブナビゲーション */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '👥', label: '仲間一覧', sub: `${vm.ownedCount}体`, path: '/monsters', color: '#ecfdf5', border: '#a7f3d0' },
            { icon: '🛡️', label: '編成', sub: 'パーティ設定', path: '/party', color: '#eff6ff', border: '#bfdbfe' },
            { icon: '📖', label: '図鑑', sub: 'コレクション', path: '/monsters/gallery', color: '#fef9c3', border: '#fde68a' },
            { icon: '📷', label: 'QR交換', sub: 'モンスター共有', path: '/qr', color: '#fdf4ff', border: '#e9d5ff' },
          ].map(({ icon, label, sub, path, color, border }) => (
            <button
              key={path}
              type="button"
              onClick={() => router.push(path)}
              className="flex items-center gap-3 rounded-2xl p-4 text-left shadow-sm transition active:scale-95"
              style={{ background: color, border: `1.5px solid ${border}` }}
            >
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="text-sm font-bold text-stone-800">{label}</p>
                <p className="mt-0.5 text-xs text-stone-400">{sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
