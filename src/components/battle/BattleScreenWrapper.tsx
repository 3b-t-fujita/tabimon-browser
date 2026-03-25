/**
 * バトル画面デザイン切り替えラッパー。
 * DESIGN_PATTERN を変更することで確定デザインを選択する。
 *
 *   'A'       = 視認性重視型（4層レイアウト・ダーク基調）
 *   'B'       = 臨場感強化型（ワールド背景・敵フォーカス・グロースキル）
 *   'COMPARE' = 上部トグルで A/B を切り替えて比較
 */
'use client';

import { useState } from 'react';
import type { BattleScreenProps } from './BattleScreenPatternA';
import { BattleScreenPatternA } from './BattleScreenPatternA';
import { BattleScreenPatternB } from './BattleScreenPatternB';

// ────────────────────────────────────────────────────────────
// ▼ 確定デザインを選ぶときはここを変更する
const DESIGN_PATTERN: 'A' | 'B' | 'COMPARE' = 'COMPARE';
// ────────────────────────────────────────────────────────────

export function BattleScreenWrapper(props: BattleScreenProps) {
  const [pattern, setPattern] = useState<'A' | 'B'>('A');

  if (DESIGN_PATTERN === 'A') return <BattleScreenPatternA {...props} />;
  if (DESIGN_PATTERN === 'B') return <BattleScreenPatternB {...props} />;

  // COMPARE モード
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* トグルバー */}
      <div className="flex shrink-0 items-center justify-center gap-0 border-b border-slate-700 bg-slate-900 py-2">
        <button
          type="button"
          onClick={() => setPattern('A')}
          className={`rounded-l-xl border px-5 py-1.5 text-xs font-bold transition ${
            pattern === 'A'
              ? 'border-sky-500 bg-sky-500 text-white'
              : 'border-slate-600 bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          A 視認性重視
        </button>
        <button
          type="button"
          onClick={() => setPattern('B')}
          className={`rounded-r-xl border-y border-r px-5 py-1.5 text-xs font-bold transition ${
            pattern === 'B'
              ? 'border-sky-500 bg-sky-500 text-white'
              : 'border-slate-600 bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          B 臨場感重視
        </button>
      </div>

      {/* 選択中パターン */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {pattern === 'A'
          ? <BattleScreenPatternA {...props} />
          : <BattleScreenPatternB {...props} />
        }
      </div>
    </div>
  );
}
