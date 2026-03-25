/**
 * 仲間詳細 パターンB — 育成情報整理重視型
 * コンパクトヘッダー + 横並びプロフィール + 整然とした育成データで
 * 「育て具合・強さ・スキル」をひと目で把握しやすくする。
 */
'use client';

import Image from 'next/image';
import type { OwnedMonsterDetailViewModel } from '@/application/viewModels/ownedMonsterDetailViewModel';
import { getMonsterStandUrl } from '@/infrastructure/assets/monsterImageService';

// ── ワールド設定 ─────────────────────────────────────────────
const WORLD_CONFIG: Record<string, {
  accent: string; accentLight: string; accentDark: string;
  headerBg: string; icon: string;
}> = {
  'ミドリの森': {
    accent:      '#10b981', accentLight: '#d1fae5', accentDark: '#064e3b',
    headerBg:    '#f0fdf4',
    icon: '🌿',
  },
  'ホノオ火山': {
    accent:      '#f97316', accentLight: '#ffedd5', accentDark: '#7c2d12',
    headerBg:    '#fff7ed',
    icon: '🔥',
  },
  'コオリ氷原': {
    accent:      '#38bdf8', accentLight: '#e0f2fe', accentDark: '#0c4a6e',
    headerBg:    '#f0f9ff',
    icon: '❄️',
  },
};
const DEFAULT_WORLD = {
  accent: '#6b7280', accentLight: '#f3f4f6', accentDark: '#374151',
  headerBg: '#f9fafb',
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
  SKILL_ATTACK: { icon: '⚔️', label: '攻撃',   bg: '#fee2e2', text: '#991b1b' },
  SKILL_HEAL:   { icon: '💚', label: '回復',   bg: '#dcfce7', text: '#166534' },
  SKILL_BUFF:   { icon: '✨', label: '強化',   bg: '#fef9c3', text: '#854d0e' },
  SKILL_DEBUFF: { icon: '💨', label: '弱体化', bg: '#f3e8ff', text: '#6b21a8' },
  SKILL_NORMAL: { icon: '👊', label: '通常',   bg: '#f1f5f9', text: '#475569' },
};

// ── StatBar ──────────────────────────────────────────────────
function StatBar({ label, value, max, color, accent }: {
  label: string; value: number; max: number; color: string; accent: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <span className="w-9 shrink-0 text-[11px] font-black text-stone-500">{label}</span>
      <div className="relative flex-1 overflow-hidden rounded-full bg-stone-100" style={{ height: 7 }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-xs font-black" style={{ color: accent }}>{value}</span>
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

// ── Pattern B メイン ─────────────────────────────────────────
export function OwnedMonsterDetailPatternB({ vm, onSetMain, onRelease, onBack, onQrGenerate, isSaving }: Props) {
  const wConf     = WORLD_CONFIG[vm.worldLabel] ?? DEFAULT_WORLD;
  const rConf     = ROLE_CONFIG[vm.roleLabel]   ?? { icon: '❓', bg: '#f1f5f9', text: '#475569' };
  const standUrl  = getMonsterStandUrl(vm.monsterMasterId);
  const persEmoji = PERSONALITY_EMOJI[vm.personalityLabel] ?? '😐';

  return (
    <div className="flex flex-1 flex-col" style={{ background: '#f8fafc' }}>

      {/* ══ ① ヘッダーバー ══ */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: wConf.headerBg, borderColor: `${wConf.accent}30` }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-stone-600 bg-white border border-stone-200 shadow-sm"
        >
          ← 戻る
        </button>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-base">{wConf.icon}</span>
          <span className="text-sm font-bold truncate" style={{ color: wConf.accentDark }}>{vm.worldLabel}</span>
        </div>
        {vm.isMain && (
          <span className="shrink-0 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-900 shadow">
            ★ 相棒
          </span>
        )}
      </div>

      {/* ══ ② スクロールコンテンツ ══ */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pt-4 pb-2">

        {/* ── プロフィールカード（横並び） ── */}
        <div
          className="flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm"
          style={{ borderColor: `${wConf.accent}30` }}
        >
          {/* 立ち絵エリア */}
          <div
            className="shrink-0 flex items-center justify-center rounded-xl overflow-hidden"
            style={{
              width: 96, height: 96,
              background: `linear-gradient(135deg, ${wConf.accentLight}, white)`,
              border: `2px solid ${wConf.accent}30`,
            }}
          >
            {standUrl ? (
              <Image
                src={standUrl}
                alt={vm.displayName}
                width={80}
                height={80}
                className="object-contain"
                style={{ filter: `drop-shadow(0 4px 8px ${wConf.accent}40)` }}
              />
            ) : (
              <span className="text-4xl">🐾</span>
            )}
          </div>

          {/* 情報エリア */}
          <div className="flex flex-1 min-w-0 flex-col gap-1.5">
            <h1 className="text-xl font-black text-stone-900 leading-tight truncate">
              {vm.displayName}
            </h1>
            {/* バッジ行 */}
            <div className="flex flex-wrap gap-1">
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                style={{ background: rConf.bg, color: rConf.text }}
              >
                {rConf.icon} {vm.roleLabel}
              </span>
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-stone-100 text-stone-600"
              >
                {persEmoji} {vm.personalityLabel}
              </span>
            </div>
            {/* レベル・EXP */}
            <div className="flex items-baseline gap-3 mt-0.5">
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] font-bold text-stone-400">Lv.</span>
                <span className="text-2xl font-black leading-none" style={{ color: wConf.accent }}>
                  {vm.level}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] font-bold text-stone-400">EXP</span>
                <span className="text-sm font-black text-stone-700">{vm.exp}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── ステータス ── */}
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">ステータス</p>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: wConf.accentLight, color: wConf.accentDark }}
            >
              Lv.{vm.level}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <StatBar label="HP"  value={vm.stats.hp}  max={300} color={wConf.accent} accent={wConf.accent} />
            <StatBar label="ATK" value={vm.stats.atk} max={100} color="#ef4444"      accent="#ef4444" />
            <StatBar label="DEF" value={vm.stats.def} max={100} color="#3b82f6"      accent="#3b82f6" />
            <StatBar label="SPD" value={vm.stats.spd} max={50}  color="#f59e0b"      accent="#f59e0b" />
          </div>

          {/* ステータス数値グリッド */}
          <div
            className="mt-4 grid grid-cols-4 divide-x rounded-xl overflow-hidden border"
            style={{ borderColor: `${wConf.accent}20` }}
          >
            {[
              { label: 'HP',  value: vm.stats.hp,  color: wConf.accent },
              { label: 'ATK', value: vm.stats.atk, color: '#ef4444' },
              { label: 'DEF', value: vm.stats.def, color: '#3b82f6' },
              { label: 'SPD', value: vm.stats.spd, color: '#f59e0b' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center py-2 bg-stone-50">
                <span className="text-[9px] font-black text-stone-400">{s.label}</span>
                <span className="text-base font-black mt-0.5" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
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
                    className="flex items-center gap-3 rounded-xl bg-stone-50 px-3 py-2.5 border border-stone-100"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
                      style={{ background: sConf.bg }}
                    >
                      {sConf.icon}
                    </span>
                    <p className="flex-1 text-sm font-bold text-stone-800">{skill.displayName}</p>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
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
        {/* 相棒設定 */}
        {!vm.isMain && (
          <button
            type="button"
            onClick={onSetMain}
            disabled={isSaving}
            className="mb-3 w-full rounded-2xl py-4 text-base font-black text-white shadow-lg transition active:scale-95 disabled:opacity-50"
            style={{
              background:  `linear-gradient(135deg, ${wConf.accentDark}, ${wConf.accent})`,
              boxShadow:   `0 4px 16px ${wConf.accent}40`,
            }}
          >
            {isSaving ? '設定中...' : '⭐ 相棒に設定する'}
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
