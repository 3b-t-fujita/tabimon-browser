/**
 * ステージ一覧 component。
 * StageCard の一覧表示と世界ごとのグルーピングを担当する。
 */
'use client';

import type { StageSelectViewModel } from '@/application/viewModels/stageSelectViewModel';
import { StageCard } from './StageCard';

interface Props {
  vm:       StageSelectViewModel;
  onBack:   () => void;
  onSelect: (stageId: string) => void;
}

export function StageList({ vm, onBack, onSelect }: Props) {
  // ワールドラベルごとにグルーピング
  const grouped = vm.stages.reduce<Record<string, typeof vm.stages[number][]>>(
    (acc, stage) => {
      const key = stage.worldLabel;
      if (!acc[key]) acc[key] = [];
      acc[key].push(stage);
      return acc;
    },
    {},
  );

  return (
    <div className="flex flex-1 flex-col">
      {/* ヘッダー */}
      <header className="bg-stone-700 px-5 py-4">
        <button type="button" onClick={onBack} className="mb-1 text-sm text-stone-300">
          ← 戻る
        </button>
        <h1 className="text-xl font-bold text-white">🗺️ ステージ選択</h1>
      </header>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
        {Object.entries(grouped).map(([world, stages]) => (
          <section key={world}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
              {world}
            </p>
            <ul className="flex flex-col gap-2">
              {stages.map((s) => (
                <StageCard key={s.stageId} stage={s} onSelect={onSelect} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
