/**
 * Home 画面 component。
 * パターンA（ヒーロービジュアル重視）とパターンB（情報整理重視）を切り替えて表示できる。
 * DESIGN_PATTERN を 'A' または 'B' に変更することで確定デザインを選択する。
 */
'use client';

import { useState } from 'react';
import type { HomeViewModel } from '@/application/viewModels/homeViewModel';
import { HomeScreenPatternA } from './HomeScreenPatternA';
import { HomeScreenPatternB } from './HomeScreenPatternB';

// ────────────────────────────────────────────────────────────
// ▼ 確定デザインを選ぶときはここを変更する
//   'A' = ヒーロービジュアル重視
//   'B' = 情報整理重視
//   'COMPARE' = プレビュー用トグル表示（選定前の比較用）
// ────────────────────────────────────────────────────────────
const DESIGN_PATTERN: 'A' | 'B' | 'COMPARE' = 'COMPARE';

interface Props {
  vm: HomeViewModel;
  onContinue?: () => void;
}

export function HomeScreen({ vm, onContinue }: Props) {
  const [pattern, setPattern] = useState<'A' | 'B'>('A');

  if (DESIGN_PATTERN === 'A') return <HomeScreenPatternA vm={vm} onContinue={onContinue} />;
  if (DESIGN_PATTERN === 'B') return <HomeScreenPatternB vm={vm} onContinue={onContinue} />;

  // COMPARE モード：上部にトグルを表示
  return (
    <div className="flex flex-1 flex-col">
      {/* デザイン選択トグル（比較用・確定後は削除） */}
      <div className="flex shrink-0 items-center justify-center gap-0 border-b border-stone-200 bg-white py-2 shadow-sm">
        <button
          type="button"
          onClick={() => setPattern('A')}
          className={`rounded-l-xl border px-5 py-1.5 text-xs font-bold transition ${
            pattern === 'A'
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-stone-200 bg-white text-stone-500 hover:bg-stone-50'
          }`}
        >
          A ヒーロー重視
        </button>
        <button
          type="button"
          onClick={() => setPattern('B')}
          className={`rounded-r-xl border-y border-r px-5 py-1.5 text-xs font-bold transition ${
            pattern === 'B'
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-stone-200 bg-white text-stone-500 hover:bg-stone-50'
          }`}
        >
          B 情報整理重視
        </button>
      </div>

      {/* 選択中のパターンを表示 */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {pattern === 'A'
          ? <HomeScreenPatternA vm={vm} onContinue={onContinue} />
          : <HomeScreenPatternB vm={vm} onContinue={onContinue} />
        }
      </div>
    </div>
  );
}
