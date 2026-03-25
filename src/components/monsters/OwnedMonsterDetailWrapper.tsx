/**
 * 仲間詳細 デザイン切り替えラッパー。
 * DESIGN_PATTERN を変更することで確定デザインを選択する。
 *
 *   'A'       = ビジュアル重視型（ワールド背景ヒーローバナー）
 *   'B'       = 育成情報整理重視型（横並びプロフィール + 整然データ）
 *   'COMPARE' = 上部トグルで A/B を切り替えて比較
 */
'use client';

import { useState } from 'react';
import type { OwnedMonsterDetailViewModel } from '@/application/viewModels/ownedMonsterDetailViewModel';
import { OwnedMonsterDetailPatternA } from './OwnedMonsterDetailPatternA';
import { OwnedMonsterDetailPatternB } from './OwnedMonsterDetailPatternB';

// ────────────────────────────────────────────────────────────
// ▼ 確定デザインを選ぶときはここを変更する
const DESIGN_PATTERN: 'A' | 'B' | 'COMPARE' = 'COMPARE';
// ────────────────────────────────────────────────────────────

interface Props {
  vm:           OwnedMonsterDetailViewModel;
  onSetMain:    () => void;
  onRelease:    () => void;
  onBack:       () => void;
  onQrGenerate: () => void;
  isSaving:     boolean;
}

export function OwnedMonsterDetailWrapper(props: Props) {
  const [pattern, setPattern] = useState<'A' | 'B'>('A');

  if (DESIGN_PATTERN === 'A') return <OwnedMonsterDetailPatternA {...props} />;
  if (DESIGN_PATTERN === 'B') return <OwnedMonsterDetailPatternB {...props} />;

  // COMPARE モード
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* トグルバー */}
      <div className="flex shrink-0 items-center justify-center gap-0 border-b border-stone-200 bg-white py-2">
        <button
          type="button"
          onClick={() => setPattern('A')}
          className={`rounded-l-xl border px-5 py-1.5 text-xs font-bold transition ${
            pattern === 'A'
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-stone-300 bg-stone-100 text-stone-500 hover:bg-stone-200'
          }`}
        >
          A ビジュアル重視
        </button>
        <button
          type="button"
          onClick={() => setPattern('B')}
          className={`rounded-r-xl border-y border-r px-5 py-1.5 text-xs font-bold transition ${
            pattern === 'B'
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-stone-300 bg-stone-100 text-stone-500 hover:bg-stone-200'
          }`}
        >
          B 育成情報重視
        </button>
      </div>

      {/* 選択中パターン */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {pattern === 'A'
          ? <OwnedMonsterDetailPatternA {...props} />
          : <OwnedMonsterDetailPatternB {...props} />
        }
      </div>
    </div>
  );
}
