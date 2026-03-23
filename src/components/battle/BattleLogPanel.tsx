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
      <div className="p-3 bg-gray-900 rounded text-sm text-gray-500 min-h-[80px]">
        戦闘開始を待っています...
      </div>
    );
  }

  return (
    <div className="p-3 bg-gray-900 rounded text-sm min-h-[80px] max-h-40 overflow-y-auto">
      {recent.map((entry, idx) => (
        <div key={`${entry.tick}-${idx}`} className="text-gray-200 leading-5">
          <span className="text-gray-500 text-xs mr-1">[{entry.tick}]</span>
          <span className="font-medium">{entry.actorName}</span>
          {' の '}
          <span className="text-yellow-300">{entry.action}</span>
          {entry.targetName && (
            <>
              {' → '}
              <span className="font-medium">{entry.targetName}</span>
            </>
          )}
          {entry.value !== undefined && (
            <span className="text-orange-400 ml-1">({entry.value})</span>
          )}
        </div>
      ))}
    </div>
  );
}
