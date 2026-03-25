/**
 * ステージ一覧 component（リデザイン版）。
 * ワールドごとにセクション分けし、世界観のある見出しを追加。
 */
'use client';

import type { StageSelectViewModel } from '@/application/viewModels/stageSelectViewModel';
import { StageCard } from './StageCard';

interface Props {
  vm:       StageSelectViewModel;
  onBack:   () => void;
  onSelect: (stageId: string) => void;
}

const WORLD_HEADER: Record<string, { icon: string; label: string; sub: string; bg: string }> = {
  'ミドリの森': { icon: '🌿', label: 'ミドリの森',  sub: '草と木々に覆われた緑豊かなワールド', bg: 'from-emerald-900 to-emerald-700' },
  '砂漠ワールド': { icon: '🔥', label: '灼熱の砂漠', sub: '炎と溶岩が渦巻く灼熱のワールド',      bg: 'from-orange-900 to-orange-700' },
  '雪原ワールド': { icon: '❄️', label: '凍てつく雪原', sub: '雪と氷に閉ざされた極寒のワールド',  bg: 'from-sky-900 to-sky-700' },
};

function WorldHeader({ worldLabel }: { worldLabel: string }) {
  const info = WORLD_HEADER[worldLabel];
  if (!info) {
    return (
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">{worldLabel}</p>
    );
  }
  return (
    <div
      className="mb-3 flex items-center gap-3 rounded-xl px-4 py-3"
      style={{ background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }}
    >
      <span className="text-2xl">{info.icon}</span>
      <div>
        <p className="text-sm font-black text-white">{info.label}</p>
        <p className="text-[10px] text-white/60">{info.sub}</p>
      </div>
    </div>
  );
}

export function StageList({ vm, onBack, onSelect }: Props) {
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
    <div className="flex flex-1 flex-col" style={{ background: '#f0fdf4' }}>

      {/* ヘッダー */}
      <header
        className="shrink-0 px-5 pb-5 pt-5"
        style={{ background: 'linear-gradient(160deg, #064e3b 0%, #047857 100%)' }}
      >
        <button type="button" onClick={onBack} className="mb-3 flex items-center gap-1 text-sm text-emerald-300">
          ← ホームへ戻る
        </button>
        <h1 className="text-2xl font-black text-white">🗺️ ステージ選択</h1>
        <p className="mt-1 text-sm text-emerald-300/70">冒険に出るステージを選ぼう</p>
      </header>

      {/* ステージ一覧 */}
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-5">
        {Object.entries(grouped).map(([worldLabel, stages]) => (
          <section key={worldLabel}>
            {/* ワールド見出し */}
            {(() => {
              const info = WORLD_HEADER[worldLabel];
              const bgMap: Record<string, string> = {
                'ミドリの森': 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
                '砂漠ワールド': 'linear-gradient(135deg, #7c2d12 0%, #9a3412 100%)',
                '雪原ワールド': 'linear-gradient(135deg, #0c4a6e 0%, #075985 100%)',
              };
              return (
                <div
                  className="mb-3 flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: bgMap[worldLabel] ?? '#374151' }}
                >
                  <span className="text-2xl">{info?.icon ?? '🌍'}</span>
                  <div>
                    <p className="text-sm font-black text-white">{info?.label ?? worldLabel}</p>
                    <p className="text-[10px] text-white/60">{info?.sub ?? ''}</p>
                  </div>
                </div>
              );
            })()}

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
