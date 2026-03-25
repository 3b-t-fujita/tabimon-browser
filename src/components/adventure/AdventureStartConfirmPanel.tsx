/**
 * 冒険開始確認パネル component。
 * パターンA（ステージ情報重視）とパターンB（編成・出発導線重視）を切り替えて表示できる。
 * DESIGN_PATTERN を 'A' または 'B' に変更することで確定デザインを選択する。
 */
'use client';

import { useState } from 'react';
import type { AdventureConfirmViewModel } from '@/application/viewModels/adventureConfirmViewModel';
import { AdventureConfirmPanelA } from './AdventureConfirmPanelA';
import { AdventureConfirmPanelB } from './AdventureConfirmPanelB';

// ────────────────────────────────────────────────────────────
// ▼ 確定デザインを選ぶときはここを変更する
//   'A' = ステージ情報重視（ワールド背景バナー + ルート情報 + 編成確認）
//   'B' = 編成・出発導線重視（コンパクトヘッダー + 大型メンバーカード + 大型CTA）
//   'COMPARE' = プレビュー用トグル表示（選定前の比較用）
// ────────────────────────────────────────────────────────────
const DESIGN_PATTERN: 'A' | 'B' | 'COMPARE' = 'B';

interface Props {
  vm:          AdventureConfirmViewModel;
  onStart:     () => void;
  onBack:      () => void;
  onEditParty?: () => void;
  isStarting:  boolean;
  startError:  string | null;
}

export function AdventureStartConfirmPanel(props: Props) {
  const [pattern, setPattern] = useState<'A' | 'B'>('A');

  if (DESIGN_PATTERN === 'A') return <AdventureConfirmPanelA {...props} />;
  if (DESIGN_PATTERN === 'B') return <AdventureConfirmPanelB {...props} />;

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
          A ステージ重視
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
          B 編成重視
        </button>
      </div>

      {/* 選択中のパターンを表示 */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {pattern === 'A'
          ? <AdventureConfirmPanelA {...props} />
          : <AdventureConfirmPanelB {...props} />
        }
      </div>
    </div>
  );
}
