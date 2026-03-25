/**
 * 冒険開始確認パネル パターンB — 編成・出発導線重視型
 * コンパクトなステージ概要 + 編成フォーカスカード + 大型出発CTA
 * 「誰と行くか」を前面に出し、パーティを整えてから出発する流れを重視。
 */
'use client';

import type { AdventureConfirmViewModel } from '@/application/viewModels/adventureConfirmViewModel';

interface Props {
  vm:          AdventureConfirmViewModel;
  onStart:     () => void;
  onBack:      () => void;
  onEditParty?: () => void;
  isStarting:  boolean;
  startError:  string | null;
}

function getWorldKey(stageId: string): 'forest' | 'fire' | 'ice' {
  if (stageId.includes('_w1')) return 'forest';
  if (stageId.includes('_w2')) return 'fire';
  return 'ice';
}

const WORLD_CONFIG = {
  forest: {
    accent:      '#059669',
    accentLight: '#d1fae5',
    accentDark:  '#064e3b',
    icon:        '🌿',
    label:       '森ワールド',
    headerBg:    'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
    ctaBg:       'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
    ctaShadow:   'rgba(16,185,129,0.45)',
    mainCard:    '#f0fdf4',
    mainBorder:  '#6ee7b7',
    supCard:     '#f8fffe',
    supBorder:   '#a7f3d0',
  },
  fire: {
    accent:      '#ea580c',
    accentLight: '#ffedd5',
    accentDark:  '#7c2d12',
    icon:        '🔥',
    label:       '砂漠ワールド',
    headerBg:    'linear-gradient(135deg, #7c2d12 0%, #9a3412 100%)',
    ctaBg:       'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)',
    ctaShadow:   'rgba(249,115,22,0.45)',
    mainCard:    '#fff7ed',
    mainBorder:  '#fdba74',
    supCard:     '#fffbf8',
    supBorder:   '#fed7aa',
  },
  ice: {
    accent:      '#0284c7',
    accentLight: '#e0f2fe',
    accentDark:  '#0c4a6e',
    icon:        '❄️',
    label:       '雪原ワールド',
    headerBg:    'linear-gradient(135deg, #0c4a6e 0%, #075985 100%)',
    ctaBg:       'linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 100%)',
    ctaShadow:   'rgba(14,165,233,0.45)',
    mainCard:    '#f0f9ff',
    mainBorder:  '#7dd3fc',
    supCard:     '#f8fbff',
    supBorder:   '#bae6fd',
  },
} as const;

const DIFFICULTY_CONFIG: Record<string, { stars: number; badge: string; badgeText: string; exp: number; nodes: number }> = {
  'やさしい':   { stars: 1, badge: '#dcfce7', badgeText: '#166534', exp: 30,  nodes: 6 },
  'ふつう':     { stars: 2, badge: '#fef9c3', badgeText: '#854d0e', exp: 70,  nodes: 7 },
  'むずかしい': { stars: 3, badge: '#fee2e2', badgeText: '#991b1b', exp: 120, nodes: 9 },
};

export function AdventureConfirmPanelB({ vm, onStart, onBack, onEditParty, isStarting, startError }: Props) {
  const world = getWorldKey(vm.stageId);
  const wConf = WORLD_CONFIG[world];
  const dConf = DIFFICULTY_CONFIG[vm.difficulty] ?? { stars: 1, badge: '#f3f4f6', badgeText: '#374151', exp: 30, nodes: 6 };

  return (
    <div className="flex flex-1 flex-col" style={{ background: '#f8fafc' }}>

      {/* ══ ① コンパクトヘッダー ══ */}
      <header
        className="relative shrink-0 px-5 pb-4 pt-5"
        style={{ background: wConf.headerBg }}
      >
        {/* 装飾サークル */}
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, white, transparent)' }}
        />

        <button
          type="button"
          onClick={onBack}
          className="mb-3 flex items-center gap-1 text-sm text-white/70"
        >
          ← 戻る
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-base">{wConf.icon}</span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white/80"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                {wConf.label}
              </span>
            </div>
            <h1 className="text-xl font-black text-white leading-tight">{vm.stageName}</h1>
          </div>

          {/* ステージ概要ピル（右上） */}
          <div className="flex flex-col items-end gap-1.5 pt-0.5">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
              style={{ background: dConf.badge, color: dConf.badgeText }}
            >
              {'⭐'.repeat(dConf.stars)} {vm.difficulty}
            </span>
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold text-white">
              Lv.{vm.recommendedLevel}〜
            </span>
          </div>
        </div>

        {/* EXP / ノード インラインサマリー */}
        <div className="mt-3 flex gap-3 border-t border-white/10 pt-3">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-white/70">
            <span>📍</span>{dConf.nodes}ノード
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-white/70">
            <span>✨</span>EXP +{dConf.exp}
          </span>
        </div>
      </header>

      {/* ══ ② 編成セクション（メイン） ══ */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pt-4 pb-2">

        {/* 編成ラベル + 編成変更ボタン */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-stone-400">編成確認</p>
            <p className="mt-0.5 text-[10px] text-stone-300">このメンバーで出発します</p>
          </div>
          {onEditParty && (
            <button
              type="button"
              onClick={onEditParty}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white shadow-sm"
              style={{ background: wConf.headerBg }}
            >
              ⚙️ 編成を変更
            </button>
          )}
        </div>

        {/* 主役カード（大） */}
        {vm.main ? (
          <div
            className="relative overflow-hidden rounded-2xl border-2 p-4 shadow-sm"
            style={{ background: wConf.mainCard, borderColor: wConf.mainBorder }}
          >
            {/* 背景アクセント */}
            <div
              className="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-10"
              style={{ background: `linear-gradient(to left, ${wConf.accent}, transparent)` }}
            />
            <div className="relative flex items-center gap-4">
              {/* アバター */}
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${wConf.accent}30, ${wConf.accent}10)`,
                  border: `2.5px solid ${wConf.accent}`,
                }}
              >
                ⭐
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-black text-white"
                    style={{ background: wConf.accent }}
                  >
                    主役
                  </span>
                </div>
                <p className="mt-1 text-lg font-black text-stone-800 leading-tight">
                  {vm.main.displayName}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className="rounded-lg px-2 py-0.5 text-xs font-bold"
                    style={{ background: wConf.accentLight, color: wConf.accent }}
                  >
                    Lv.{vm.main.level}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-red-300 bg-red-50 p-4 text-center">
            <p className="text-base">⚠️</p>
            <p className="mt-1 text-sm font-bold text-red-600">主役が設定されていません</p>
            <p className="mt-0.5 text-xs text-red-400">編成変更から主役を設定してください</p>
          </div>
        )}

        {/* 助っ人カード */}
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-300">
            助っ人 ({vm.supports.length}/2)
          </p>
          <div className="flex flex-col gap-2">
            {[0, 1].map((i) => {
              const sup = vm.supports[i];
              return sup ? (
                <div
                  key={sup.supportId}
                  className="flex items-center gap-3 rounded-xl border p-3.5 shadow-sm"
                  style={{ background: wConf.supCard, borderColor: wConf.supBorder }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl shadow-sm"
                    style={{ background: `${wConf.accent}15`, border: `1.5px solid ${wConf.accent}30` }}
                  >
                    🤝
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-stone-700 leading-tight">{sup.displayName}</p>
                    <p className="mt-0.5 text-xs text-stone-400">Lv.{sup.level}</p>
                  </div>
                  <span
                    className="rounded-lg px-2 py-1 text-[10px] font-bold"
                    style={{ background: wConf.accentLight, color: wConf.accent }}
                  >
                    助っ人{i + 1}
                  </span>
                </div>
              ) : (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border-2 border-dashed border-stone-200 px-4 py-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-300 text-xl">
                    +
                  </div>
                  <p className="text-sm text-stone-300">助っ人{i + 1}（空き）</p>
                </div>
              );
            })}
          </div>
        </div>

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

      {/* ══ ③ 大型出発CTA（固定フッター） ══ */}
      <div className="shrink-0 px-4 pb-6 pt-3">
        {/* サブテキスト */}
        {vm.canStart && !isStarting && (
          <p className="mb-2 text-center text-xs text-stone-400">
            {vm.supports.length === 0
              ? '助っ人なしで出発します'
              : `${vm.supports.length}体の助っ人と一緒に出発！`}
          </p>
        )}
        <button
          type="button"
          onClick={onStart}
          disabled={isStarting || !vm.canStart}
          className="relative w-full overflow-hidden rounded-2xl py-5 text-lg font-black text-white shadow-lg transition active:scale-95 disabled:opacity-50"
          style={
            vm.canStart && !isStarting
              ? { background: wConf.ctaBg, boxShadow: `0 6px 24px ${wConf.ctaShadow}` }
              : { background: '#d1d5db' }
          }
        >
          {/* 光沢レイヤー */}
          {vm.canStart && !isStarting && (
            <span
              className="absolute inset-x-0 top-0 h-1/2 rounded-t-2xl"
              style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)' }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isStarting ? (
              <>⏳ <span>出発準備中...</span></>
            ) : vm.canStart ? (
              <>
                <span className="text-xl">🗺️</span>
                <span>出発する！</span>
                <span className="text-sm font-semibold opacity-80">→</span>
              </>
            ) : (
              <span>出発できません</span>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}
