/**
 * ステージカード component。
 * 解放状態・選択操作・選択不可の視覚表現を担当する。
 */
'use client';

import type { StageListItemViewModel } from '@/application/viewModels/stageSelectViewModel';

interface Props {
  stage:    StageListItemViewModel;
  onSelect: (stageId: string) => void;
}

export function StageCard({ stage, onSelect }: Props) {
  const locked = !stage.isUnlocked;

  return (
    <li
      className={`rounded-xl border p-4 transition ${
        locked
          ? 'border-stone-200 bg-stone-50 opacity-60'
          : 'border-stone-200 bg-white shadow-sm hover:border-emerald-300 hover:bg-emerald-50 active:scale-[0.98]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-stone-800">{stage.stageName}</p>
            {locked && (
              <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-500">
                🔒 未解放
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-stone-500">
            難易度: {stage.difficulty} ／ 推奨Lv.{stage.recommendedLevel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(stage.stageId)}
          disabled={locked}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            locked
              ? 'cursor-not-allowed bg-stone-100 text-stone-300'
              : 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95'
          }`}
        >
          {locked ? '未解放' : '選択'}
        </button>
      </div>
    </li>
  );
}
