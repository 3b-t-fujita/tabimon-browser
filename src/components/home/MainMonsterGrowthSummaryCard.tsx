'use client';

import { SoftCard } from '@/components/common/SoftCard';

interface Props {
  monsterName: string;
  level: number | null;
  expProgressRatio: number | null;
  expToNextLevel: number | null;
  bondRank: 0 | 1 | 2 | 3 | 4 | null;
  bondProgressRatio: number | null;
  bondToNextRank: number | null;
  onOpenDetail: () => void;
}

function ProgressBar({
  value,
  fillClassName,
}: {
  value: number | null;
  fillClassName: string;
}) {
  const ratio = value ?? 0;
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-[#e6e9e1]">
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${fillClassName}`}
        style={{ width: `${Math.round(ratio * 100)}%` }}
      />
    </div>
  );
}

export function MainMonsterGrowthSummaryCard({
  monsterName,
  level,
  expProgressRatio,
  expToNextLevel,
  bondRank,
  bondProgressRatio,
  bondToNextRank,
  onOpenDetail,
}: Props) {
  return (
    <button
      type="button"
      onClick={onOpenDetail}
      className="block w-full text-left"
      aria-label="成長サマリー"
    >
      <SoftCard className="p-5 transition active:scale-[0.99]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#6c4324]/70">せいちょう</p>
            <p className="mt-2 truncate text-[clamp(18px,4.8vw,20px)] font-black leading-tight tracking-tight text-[#2c302b]">
              {monsterName || '相棒未設定'}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-black text-[#29664c]">{level !== null ? `Lv ${level}` : 'Lv --'}</p>
            <p className="mt-1 text-xs font-black text-[#9d275f]">
              {bondRank !== null ? `きずな ★${bondRank}` : 'きずな --'}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-black tracking-[0.12em] text-[#6c4324]/70">EXP</p>
              <p className="text-xs text-[#595c57]">
                {expToNextLevel !== null ? `つぎまで あと ${expToNextLevel}` : 'いまが さいだい'}
              </p>
            </div>
            <div className="mt-2">
              <ProgressBar value={expProgressRatio} fillClassName="bg-gradient-to-r from-[#29664c] to-[#55a37f]" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-black tracking-[0.12em] text-[#6c4324]/70">きずな</p>
              <p className="text-xs text-[#595c57]">
                {bondToNextRank !== null && bondToNextRank > 0 ? `つぎまで あと ${bondToNextRank}` : 'いまが いちばん'}
              </p>
            </div>
            <div className="mt-2">
              <ProgressBar value={bondProgressRatio} fillClassName="bg-gradient-to-r from-[#f48fb6] to-[#d94c8b]" />
            </div>
          </div>
        </div>
      </SoftCard>
    </button>
  );
}
