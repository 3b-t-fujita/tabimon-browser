/**
 * 冒険開始確認パネル パターンA — ステージ情報重視型
 * ワールド背景バナー + ステージ詳細情報 + 編成確認 + 出発CTA
 * 「このステージに行く理由と期待感」を前面に出したデザイン。
 */
'use client';

import Image from 'next/image';
import type { AdventureConfirmViewModel } from '@/application/viewModels/adventureConfirmViewModel';

interface Props {
  vm:         AdventureConfirmViewModel;
  onStart:    () => void;
  onBack:     () => void;
  onEditParty?: () => void;
  isStarting: boolean;
  startError: string | null;
}

function getWorldKey(stageId: string): 'forest' | 'fire' | 'ice' {
  if (stageId.includes('_w1')) return 'forest';
  if (stageId.includes('_w2')) return 'fire';
  return 'ice';
}

function getStageNo(stageId: string): number {
  const m = stageId.match(/_(\d+)$/);
  return m ? Number(m[1]) : 1;
}

const WORLD_CONFIG = {
  forest: {
    bgImage: '/assets/backgrounds/world_forest_bg_v1.webp',
    gradient: 'linear-gradient(to top, rgba(4,47,30,0.95) 0%, rgba(4,47,30,0.5) 60%, transparent 100%)',
    accent: '#10b981',
    accentDark: '#064e3b',
    icon: '🌿',
    label: '森ワールド',
    memberCard: '#f0fdf4',
    memberBorder: '#a7f3d0',
  },
  fire: {
    bgImage: '/assets/backgrounds/world_desert_bg_v1.webp',
    gradient: 'linear-gradient(to top, rgba(69,10,10,0.95) 0%, rgba(69,10,10,0.5) 60%, transparent 100%)',
    accent: '#f97316',
    accentDark: '#7c2d12',
    icon: '🔥',
    label: '砂漠ワールド',
    memberCard: '#fff7ed',
    memberBorder: '#fed7aa',
  },
  ice: {
    bgImage: '/assets/backgrounds/world_snow_bg_v1.webp',
    gradient: 'linear-gradient(to top, rgba(8,47,73,0.95) 0%, rgba(8,47,73,0.5) 60%, transparent 100%)',
    accent: '#0ea5e9',
    accentDark: '#0c4a6e',
    icon: '❄️',
    label: '雪原ワールド',
    memberCard: '#f0f9ff',
    memberBorder: '#bae6fd',
  },
} as const;

const DIFFICULTY_CONFIG: Record<string, { stars: number; badge: string; badgeText: string; exp: number; nodes: number; rareChance: string }> = {
  'やさしい':   { stars: 1, badge: '#dcfce7', badgeText: '#166534', exp: 30,  nodes: 6, rareChance: '5%' },
  'ふつう':     { stars: 2, badge: '#fef9c3', badgeText: '#854d0e', exp: 70,  nodes: 7, rareChance: '10%' },
  'むずかしい': { stars: 3, badge: '#fee2e2', badgeText: '#991b1b', exp: 120, nodes: 9, rareChance: '15%' },
};

export function AdventureConfirmPanelA({ vm, onStart, onBack, onEditParty, isStarting, startError }: Props) {
  const world   = getWorldKey(vm.stageId);
  const wConf   = WORLD_CONFIG[world];
  const dConf   = DIFFICULTY_CONFIG[vm.difficulty] ?? { stars: 1, badge: '#f3f4f6', badgeText: '#374151', exp: 30, nodes: 6, rareChance: '5%' };
  const stageNo = getStageNo(vm.stageId);

  return (
    <div className="flex flex-1 flex-col" style={{ background: '#f8fafc' }}>

      {/* ══ ① ステージヒーローバナー ══ */}
      <div className="relative shrink-0 overflow-hidden" style={{ height: 220 }}>
        <Image
          src={wConf.bgImage}
          alt={vm.stageName}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* グラデーションオーバーレイ */}
        <div className="absolute inset-0" style={{ background: wConf.gradient }} />

        {/* 戻るボタン */}
        <button
          type="button"
          onClick={onBack}
          className="absolute left-4 top-4 z-10 flex items-center gap-1 rounded-full bg-black/30 px-3 py-1.5 text-sm text-white backdrop-blur-sm"
        >
          ← 戻る
        </button>

        {/* ステージ情報オーバーレイ（左下） */}
        <div className="absolute bottom-0 left-0 z-10 px-5 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{wConf.icon}</span>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-bold"
              style={{ background: `${wConf.accent}30`, color: wConf.accent }}
            >
              {wConf.label}
            </span>
          </div>
          <h1 className="text-xl font-black text-white leading-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
            {vm.stageName}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
              style={{ background: dConf.badge, color: dConf.badgeText }}
            >
              {'⭐'.repeat(dConf.stars)} {vm.difficulty}
            </span>
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              推奨 Lv.{vm.recommendedLevel}〜
            </span>
          </div>
        </div>
      </div>

      {/* ══ ② スクロールコンテンツ ══ */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pt-4 pb-2">

        {/* ルート情報ピル */}
        <div className="flex gap-2 flex-wrap">
          {[
            { icon: '📍', label: `${dConf.nodes}ノード` },
            { icon: '✨', label: `EXP +${dConf.exp}` },
            { icon: '🌟', label: `レア出現 ${dConf.rareChance}` },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 shadow-sm"
            >
              <span className="text-sm">{icon}</span>
              <span className="text-xs font-bold text-stone-700">{label}</span>
            </div>
          ))}
        </div>

        {/* 出撃メンバー */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-400">出撃メンバー</p>
            {onEditParty && (
              <button
                type="button"
                onClick={onEditParty}
                className="text-xs font-semibold"
                style={{ color: wConf.accent }}
              >
                ⚙️ 編成変更
              </button>
            )}
          </div>

          {/* 相棒 */}
          {vm.main ? (
            <div
              className="mb-2 flex items-center gap-3 rounded-2xl border p-3.5 shadow-sm"
              style={{ background: wConf.memberCard, borderColor: wConf.memberBorder }}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl shadow-sm"
                style={{ background: wConf.accent + '20', border: `2px solid ${wConf.accent}` }}
              >
                ⭐
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-black text-white"
                    style={{ background: wConf.accent }}
                  >
                    相棒
                  </span>
                  <span className="font-bold text-stone-800">{vm.main.displayName}</span>
                </div>
                <p className="mt-0.5 text-xs text-stone-400">Lv.{vm.main.level}</p>
              </div>
            </div>
          ) : (
            <div className="mb-2 rounded-2xl border-2 border-dashed border-red-200 bg-red-50 p-3.5 text-center">
              <p className="text-sm font-bold text-red-500">⚠️ 相棒が設定されていません</p>
            </div>
          )}

          {/* 助っ人スロット */}
          <div className="grid grid-cols-2 gap-2">
            {[0, 1].map((i) => {
              const sup = vm.supports[i];
              return sup ? (
                <div
                  key={sup.supportId}
                  className="flex items-center gap-2 rounded-xl border p-3 shadow-sm"
                  style={{ background: '#fafafa', borderColor: '#e5e7eb' }}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-lg">🤝</div>
                  <div>
                    <p className="text-xs font-bold text-stone-700 leading-tight">{sup.displayName}</p>
                    <p className="text-[10px] text-stone-400">Lv.{sup.level}</p>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex items-center justify-center rounded-xl border-2 border-dashed border-stone-200 p-3 text-center">
                  <p className="text-xs text-stone-300">空きスロット</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* エラー表示 */}
        {startError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-600">❌ {startError}</p>
          </div>
        )}
        {!vm.canStart && vm.cannotStartReason && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-medium text-amber-700">⚠️ {vm.cannotStartReason}</p>
          </div>
        )}
      </div>

      {/* ══ ③ 出発CTA（固定フッター） ══ */}
      <div className="shrink-0 px-4 pb-6 pt-3">
        <button
          type="button"
          onClick={onStart}
          disabled={isStarting || !vm.canStart}
          className="relative w-full overflow-hidden rounded-2xl py-5 text-base font-black text-white shadow-lg transition active:scale-95 disabled:opacity-50"
          style={vm.canStart && !isStarting
            ? { background: `linear-gradient(135deg, ${wConf.accentDark} 0%, ${wConf.accent} 100%)`, boxShadow: `0 4px 20px ${wConf.accent}50` }
            : { background: '#d1d5db' }
          }
        >
          <span className="relative z-10">
            {isStarting ? '⏳ 出発準備中...' : vm.canStart ? `🗺️ ${vm.stageName}へ出発！` : '出発できません'}
          </span>
          {vm.canStart && !isStarting && (
            <span
              className="absolute inset-x-0 top-0 h-1/2 rounded-t-2xl"
              style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)' }}
            />
          )}
        </button>
      </div>
    </div>
  );
}
