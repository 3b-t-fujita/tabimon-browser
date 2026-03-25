'use client';

/**
 * リザルト概要表示コンポーネント。
 * 結果種別・獲得経験値・レベルアップ・ステータス上昇・ステージ解放を表示する。
 */
import Image from 'next/image';
import { AdventureResultType } from '@/common/constants/enums';
import type { StatGains } from '@/application/result/finalizeAdventureResultUseCase';

interface ResultSummaryViewProps {
  resultType:    AdventureResultType;
  stageId:       string;
  expGained:     number;
  newLevel:      number;
  leveledUp:     boolean;
  stageUnlocked: boolean;
  statGains:     StatGains | null;
  evolved:       boolean;
  evolvedName:   string | null;
}

const RESULT_CONFIG: Record<AdventureResultType, {
  label:     string;
  sublabel:  string;
  banner:    string;
  accent:    string;
  accentDk:  string;
  bg:        string;
  overlay:   string;
}> = {
  [AdventureResultType.Success]: {
    label:    '冒険成功！',
    sublabel: 'お疲れさまでした！',
    banner:   '/assets/result/ui_result_banner_success_v1.webp',
    accent:   '#10b981',
    accentDk: '#064e3b',
    bg:       '#f0fdf4',
    overlay:  'linear-gradient(to bottom, rgba(4,47,30,0.10) 0%, rgba(4,47,30,0.55) 60%, rgba(4,47,30,0.92) 100%)',
  },
  [AdventureResultType.Failure]: {
    label:    '冒険失敗…',
    sublabel: 'また挑戦しよう！',
    banner:   '/assets/result/ui_result_banner_fail_v1.webp',
    accent:   '#ef4444',
    accentDk: '#7f1d1d',
    bg:       '#fef2f2',
    overlay:  'linear-gradient(to bottom, rgba(127,29,29,0.10) 0%, rgba(127,29,29,0.55) 60%, rgba(127,29,29,0.92) 100%)',
  },
  [AdventureResultType.Retire]: {
    label:    'リタイア',
    sublabel: '次はがんばろう',
    banner:   '/assets/result/ui_result_banner_retire_v1.webp',
    accent:   '#6b7280',
    accentDk: '#1f2937',
    bg:       '#f9fafb',
    overlay:  'linear-gradient(to bottom, rgba(31,41,55,0.10) 0%, rgba(31,41,55,0.55) 60%, rgba(31,41,55,0.92) 100%)',
  },
};

// ── StatChip ──────────────────────────────────────────────────
function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white px-2 py-2 border border-amber-100 shadow-sm">
      <span className="text-[9px] font-black text-stone-400">{label}</span>
      <span className="text-sm font-black mt-0.5" style={{ color }}>+{value}</span>
    </div>
  );
}

// ── メイン ────────────────────────────────────────────────────
export default function ResultSummaryView({
  resultType, stageId, expGained, newLevel, leveledUp, stageUnlocked, statGains, evolved, evolvedName,
}: ResultSummaryViewProps) {
  const cfg = RESULT_CONFIG[resultType];

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl shadow-sm" style={{ background: cfg.bg }}>

      {/* ── ① バナー ── */}
      <div className="relative shrink-0 overflow-hidden" style={{ height: 160 }}>
        <Image src={cfg.banner} alt={cfg.label} fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0" style={{ background: cfg.overlay }} />

        {/* 結果テキスト */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
          <p
            className="text-2xl font-black text-white leading-tight"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}
          >
            {cfg.label}
          </p>
          <p className="text-xs text-white/70 mt-0.5">{cfg.sublabel}</p>
        </div>
      </div>

      {/* ── ② 報酬エリア ── */}
      <div className="flex flex-col gap-3 p-4">

        {/* EXP */}
        <div
          className="flex items-center justify-between rounded-2xl px-4 py-3 border"
          style={{ borderColor: `${cfg.accent}30`, background: `${cfg.accent}10` }}
        >
          <span className="text-sm font-bold text-stone-600">獲得経験値</span>
          <span className="text-base font-black" style={{ color: cfg.accent }}>
            +{expGained} EXP
          </span>
        </div>

        {/* レベルアップ */}
        {leveledUp && (
          <div
            className="flex flex-col gap-3 overflow-hidden rounded-2xl border border-amber-200"
            style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)' }}
          >
            <div className="flex items-center gap-2 px-4 pt-4">
              <span className="text-lg">⬆️</span>
              <div>
                <p className="text-sm font-black text-amber-800">レベルアップ！</p>
                <p className="text-xs text-amber-600 font-bold">Lv. {newLevel} になった！</p>
              </div>
            </div>

            {statGains && (
              <div className="grid grid-cols-4 gap-2 px-4 pb-4">
                <StatChip label="HP"  value={statGains.hp}  color="#10b981" />
                <StatChip label="ATK" value={statGains.atk} color="#ef4444" />
                <StatChip label="DEF" value={statGains.def} color="#3b82f6" />
                <StatChip label="SPD" value={statGains.spd} color="#f59e0b" />
              </div>
            )}
          </div>
        )}

        {/* 進化 */}
        {evolved && evolvedName && (
          <div
            className="flex items-center gap-3 rounded-2xl border border-purple-200 px-4 py-3"
            style={{ background: 'linear-gradient(135deg, #faf5ff, #f3e8ff)' }}
          >
            <span className="text-2xl">✨</span>
            <div>
              <p className="text-sm font-black text-purple-700">進化！</p>
              <p className="text-xs text-purple-600">→ {evolvedName} になった！</p>
            </div>
          </div>
        )}

        {/* ステージ解放 */}
        {stageUnlocked && (
          <div
            className="flex items-center gap-3 rounded-2xl border border-sky-200 px-4 py-3"
            style={{ background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)' }}
          >
            <span className="text-2xl">🔓</span>
            <p className="text-sm font-black text-sky-700">新ステージが解放されました！</p>
          </div>
        )}

      </div>
    </div>
  );
}
