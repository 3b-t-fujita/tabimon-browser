/**
 * 仲間詳細 パターンA — ビジュアル重視型
 * ワールド背景 + 大立ち絵ヒーローバナーで「うちの子感」を最大化。
 * スクロールで詳細情報→アクションへ自然に誘導する。
 */
'use client';

import Image from 'next/image';
import type { OwnedMonsterDetailViewModel } from '@/application/viewModels/ownedMonsterDetailViewModel';
import { getMonsterStandUrl } from '@/infrastructure/assets/monsterImageService';

// ── ワールド設定 ─────────────────────────────────────────────
const WORLD_CONFIG: Record<string, {
  bgImage: string; accent: string; accentDark: string;
  overlay: string; icon: string;
}> = {
  'ミドリの森': {
    bgImage:    '/assets/backgrounds/world_forest_bg_v1.webp',
    accent:     '#10b981', accentDark: '#064e3b',
    overlay:    'linear-gradient(to bottom, rgba(4,47,30,0.10) 0%, rgba(4,47,30,0.50) 55%, rgba(4,47,30,0.92) 100%)',
    icon: '🌿',
  },
  'ホノオ火山': {
    bgImage:    '/assets/backgrounds/world_desert_bg_v1.webp',
    accent:     '#f97316', accentDark: '#7c2d12',
    overlay:    'linear-gradient(to bottom, rgba(69,10,10,0.10) 0%, rgba(69,10,10,0.50) 55%, rgba(69,10,10,0.92) 100%)',
    icon: '🔥',
  },
  'コオリ氷原': {
    bgImage:    '/assets/backgrounds/world_snow_bg_v1.webp',
    accent:     '#38bdf8', accentDark: '#0c4a6e',
    overlay:    'linear-gradient(to bottom, rgba(8,47,73,0.10) 0%, rgba(8,47,73,0.50) 55%, rgba(8,47,73,0.92) 100%)',
    icon: '❄️',
  },
};
const DEFAULT_WORLD = {
  bgImage: '/assets/backgrounds/world_forest_bg_v1.webp',
  accent: '#6b7280', accentDark: '#374151',
  overlay: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%)',
  icon: '🌍',
};

// ── ロール設定 ──────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { icon: string; bg: string; text: string }> = {
  'アタック':  { icon: '⚔️', bg: '#fee2e2', text: '#991b1b' },
  'ガード':    { icon: '🛡️', bg: '#dbeafe', text: '#1e40af' },
  'サポート':  { icon: '💚', bg: '#dcfce7', text: '#166534' },
};

// ── 性格 → 絵文字 ───────────────────────────────────────────
const PERSONALITY_EMOJI: Record<string, string> = {
  'ゆうかん':   '🔥',
  'しんちょう': '🧐',
  'やさしい':   '🌸',
  'せっかち':   '⚡',
  'れいせい':   '🌊',
  'きまぐれ':   '🌀',
};

// ── スキルタイプ ─────────────────────────────────────────────
const SKILL_TYPE_CONFIG: Record<string, { icon: string; label: string; bg: string; text: string }> = {
  SKILL_ATTACK: { icon: '⚔️', label: '攻撃',    bg: '#fee2e2', text: '#991b1b' },
  SKILL_HEAL:   { icon: '💚', label: '回復',    bg: '#dcfce7', text: '#166534' },
  SKILL_BUFF:   { icon: '✨', label: '強化',    bg: '#fef9c3', text: '#854d0e' },
  SKILL_DEBUFF: { icon: '💨', label: '弱体化',  bg: '#f3e8ff', text: '#6b21a8' },
  SKILL_NORMAL: { icon: '👊', label: '通常',    bg: '#f1f5f9', text: '#475569' },
};

// ── StatBar ──────────────────────────────────────────────────
function StatBar({ label, value, max, color, accent }: {
  label: string; value: number; max: number; color: string; accent: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 text-xs font-black text-stone-400">{label}</span>
      <div className="relative flex-1 overflow-hidden rounded-full bg-stone-100" style={{ height: 8 }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="w-8 text-right text-sm font-black" style={{ color: accent }}>{value}</span>
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────
interface Props {
  vm:           OwnedMonsterDetailViewModel;
  onSetMain:    () => void;
  onRelease:    () => void;
  onBack:       () => void;
  onQrGenerate: () => void;
  isSaving:     boolean;
}

// ── Pattern A メイン ─────────────────────────────────────────
export function OwnedMonsterDetailPatternA({ vm, onSetMain, onRelease, onBack, onQrGenerate, isSaving }: Props) {
  const wConf    = WORLD_CONFIG[vm.worldLabel] ?? DEFAULT_WORLD;
  const rConf    = ROLE_CONFIG[vm.roleLabel]   ?? { icon: '❓', bg: '#f1f5f9', text: '#475569' };
  const standUrl = getMonsterStandUrl(vm.monsterMasterId);
  const persEmoji = PERSONALITY_EMOJI[vm.personalityLabel] ?? '😐';

  return (
    <div className="flex flex-1 flex-col" style={{ background: '#f8fafc' }}>

      {/* ══ ① ヒーローバナー（ワールド背景 + 大立ち絵） ══ */}
      <div className="relative shrink-0 overflow-hidden" style={{ height: 300 }}>
        {/* 世界観背景 */}
        <Image src={wConf.bgImage} alt={vm.worldLabel} fill className="object-cover" priority sizes="100vw" />
        {/* グラデーションオーバーレイ */}
        <div className="absolute inset-0" style={{ background: wConf.overlay }} />

        {/* 戻るボタン */}
        <button
          type="button"
          onClick={onBack}
          className="absolute left-4 top-4 z-10 flex items-center gap-1 rounded-full bg-black/30 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm"
        >
          ← 戻る
        </button>

        {/* 相棒バッジ */}
        {vm.isMain && (
          <div className="absolute right-4 top-4 z-10">
            <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-900 shadow-lg">
              ★ 相棒
            </span>
          </div>
        )}

        {/* 立ち絵（中央） */}
        <div className="absolute inset-x-0 bottom-10 flex justify-center" style={{ zIndex: 5 }}>
          {standUrl ? (
            <Image
              src={standUrl}
              alt={vm.displayName}
              width={180}
              height={180}
              className="object-contain"
              style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))' }}
            />
          ) : (
            <div className="flex h-44 w-44 items-center justify-center text-7xl">🐾</div>
          )}
        </div>

        {/* モンスター名・ワールド（バナー下部） */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{wConf.icon}</span>
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
              style={{ background: `${wConf.accent}40` }}
            >
              {vm.worldLabel}
            </span>
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
              style={{ background: rConf.bg, color: rConf.text }}
            >
              {rConf.icon} {vm.roleLabel}
            </span>
          </div>
          <h1
            className="text-2xl font-black text-white leading-tight"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}
          >
            {vm.displayName}
          </h1>
        </div>
      </div>

      {/* ══ ② スクロールコンテンツ ══ */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pt-4 pb-2">

        {/* ── レベル・性格・EXP パネル ── */}
        <div
          className="flex items-center gap-0 overflow-hidden rounded-2xl border shadow-sm"
          style={{ borderColor: `${wConf.accent}30`, background: 'white' }}
        >
          <div className="flex flex-1 flex-col items-center border-r py-3" style={{ borderColor: `${wConf.accent}20` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">LEVEL</p>
            <p className="text-2xl font-black" style={{ color: wConf.accent }}>
              {vm.level}
            </p>
          </div>
          <div className="flex flex-1 flex-col items-center border-r py-3" style={{ borderColor: `${wConf.accent}20` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">EXP</p>
            <p className="text-lg font-black text-stone-700">{vm.exp}</p>
          </div>
          <div className="flex flex-1 flex-col items-center py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">性格</p>
            <p className="text-base font-black text-stone-700">
              {persEmoji} {vm.personalityLabel}
            </p>
          </div>
        </div>

        {/* ── ステータス ── */}
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-stone-400">ステータス</p>
          <div className="flex flex-col gap-3">
            <StatBar label="HP"  value={vm.stats.hp}  max={300} color={wConf.accent}  accent={wConf.accent} />
            <StatBar label="ATK" value={vm.stats.atk} max={100} color="#ef4444"       accent="#ef4444" />
            <StatBar label="DEF" value={vm.stats.def} max={100} color="#3b82f6"       accent="#3b82f6" />
            <StatBar label="SPD" value={vm.stats.spd} max={50}  color="#f59e0b"       accent="#f59e0b" />
          </div>
        </section>

        {/* ── スキル ── */}
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-stone-400">スキル</p>
          {vm.skills.length === 0 ? (
            <p className="text-sm text-stone-400">スキルなし</p>
          ) : (
            <div className="flex flex-col gap-2">
              {vm.skills.map((skill) => {
                const sConf = SKILL_TYPE_CONFIG[skill.skillType] ?? SKILL_TYPE_CONFIG.SKILL_NORMAL;
                return (
                  <div
                    key={skill.skillId}
                    className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
                    style={{ borderColor: `${wConf.accent}25`, background: `${wConf.accent}08` }}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
                      style={{ background: sConf.bg }}
                    >
                      {sConf.icon}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-stone-800">{skill.displayName}</p>
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: sConf.bg, color: sConf.text }}
                    >
                      {sConf.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>

      {/* ══ ③ アクションボタン ══ */}
      <div className="shrink-0 border-t border-stone-100 bg-white px-4 pb-6 pt-4">
        {/* 相棒設定（メインCTA） */}
        {!vm.isMain && (
          <button
            type="button"
            onClick={onSetMain}
            disabled={isSaving}
            className="relative mb-3 w-full overflow-hidden rounded-2xl py-4 text-base font-black text-white shadow-lg transition active:scale-95 disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${wConf.accentDark}, ${wConf.accent})`,
              boxShadow:  `0 4px 16px ${wConf.accent}40`,
            }}
          >
            <span
              className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl"
              style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)' }}
            />
            <span className="relative z-10">
              {isSaving ? '設定中...' : `⭐ 相棒に設定する`}
            </span>
          </button>
        )}

        <div className="flex gap-2">
          {/* QR生成 */}
          <button
            type="button"
            onClick={onQrGenerate}
            disabled={isSaving}
            className="flex-1 rounded-2xl border-2 py-3 text-sm font-bold transition active:scale-95 disabled:opacity-50"
            style={{ borderColor: wConf.accent, color: wConf.accent, background: `${wConf.accent}10` }}
          >
            📤 QR生成
          </button>
          {/* 手放す */}
          <button
            type="button"
            onClick={onRelease}
            disabled={isSaving || !vm.canRelease}
            className={`flex-1 rounded-2xl border-2 py-3 text-sm font-bold transition active:scale-95 ${
              vm.canRelease
                ? 'border-red-300 bg-red-50 text-red-500'
                : 'border-stone-200 bg-stone-50 text-stone-300'
            } disabled:opacity-50`}
          >
            {vm.canRelease ? '🗑️ 手放す' : '手放し不可'}
          </button>
        </div>
      </div>

    </div>
  );
}
