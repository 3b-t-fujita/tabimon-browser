'use client';

/**
 * 戦闘ログパネルコンポーネント。
 * 直近の戦闘ログエントリを表示する。
 */
import type { BattleLogEntry } from '@/domain/battle/BattleState';

interface BattleLogPanelProps {
  log:      readonly BattleLogEntry[];
  maxLines?: number;
}

export default function BattleLogPanel({ log, maxLines = 6 }: BattleLogPanelProps) {
  // 最新 maxLines 件を表示（新しいものが下）
  const recent = log.slice(-maxLines);

  if (recent.length === 0) {
    return (
      <div className="min-h-[80px] rounded-[24px] bg-white p-4 text-sm text-[#757872] shadow-sm">
        戦闘開始を待っています...
      </div>
    );
  }

  return (
    <div className="max-h-40 min-h-[80px] overflow-y-auto rounded-[24px] bg-white p-4 text-sm shadow-sm">
      {recent.map((entry, idx) => (
        <div key={`${entry.tick}-${idx}`} className="leading-6 text-[#2c302b]">
          <span className="mr-1 text-xs text-[#757872]">[{entry.tick}]</span>
          <span className="font-medium">{entry.actorName}</span>
          {' の '}
          <span className="text-[#7d5231]">{entry.action}</span>
          {entry.targetName && (
            <>
              {' → '}
              <span className="font-medium">{entry.targetName}</span>
            </>
          )}
          {entry.value !== undefined && (
            <span className="ml-1 text-[#b02500]">({entry.value})</span>
          )}
        </div>
      ))}
    </div>
  );
}
