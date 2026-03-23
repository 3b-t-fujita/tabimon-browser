/**
 * 分岐選択パネルコンポーネント。
 * BRANCH_SELECTING 状態で表示する。
 * 選択肢を1つ選ぶまで次へ進めない。
 */
'use client';

import type { NodeBranchOption } from '@/domain/entities/NodePattern';

interface Props {
  options:   readonly NodeBranchOption[];
  onSelect:  (nextNodeIndex: number) => void;
  isSaving:  boolean;
}

export function BranchSelectPanel({ options, onSelect, isSaving }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
      <p className="text-sm font-semibold text-blue-700">道を選んでください</p>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <button
            key={opt.nextNodeIndex}
            type="button"
            onClick={() => onSelect(opt.nextNodeIndex)}
            disabled={isSaving}
            className="w-full rounded-lg bg-blue-500 py-3 text-sm font-bold text-white shadow transition hover:bg-blue-600 active:scale-95 disabled:opacity-50"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
