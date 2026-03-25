/**
 * ステージ一覧 component（リデザイン版）。
 * ワールドごとにセクション分けし、世界観のある見出しと色付き囲いで表示。
 */
'use client';

import type { StageSelectViewModel } from '@/application/viewModels/stageSelectViewModel';
import { StageCard } from './StageCard';

interface Props {
  vm:       StageSelectViewModel;
  onBack:   () => void;
  onSelect: (stageId: string) => void;
}

// worldLabel（'ミドリの森' | 'ほのおの山' | 'こおりの地'）に対応する設定
const WORLD_CONFIG: Record<string, {
  icon:       string;
  label:      string;
  sub:        string;
  headerBg:   string;  // セクション見出しの背景
  sectionBg:  string;  // ステージ一覧の囲い背景
  sectionBdr: string;  // 囲いボーダー色
}> = {
  'ミドリの森': {
    icon:       '🌿',
    label:      'ミドリの森',
    sub:        '草と木々に覆われた緑豊かなワールド',
    headerBg:   'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
    sectionBg:  '#f0fdf4',
    sectionBdr: '#bbf7d0',
  },
  'ほのおの山': {
    icon:       '🔥',
    label:      'ほのおの山',
    sub:        '炎と溶岩が渦巻く灼熱のワールド',
    headerBg:   'linear-gradient(135deg, #7c2d12 0%, #9a3412 100%)',
    sectionBg:  '#fff7ed',
    sectionBdr: '#fed7aa',
  },
  'こおりの地': {
    icon:       '❄️',
    label:      'こおりの地',
    sub:        '雪と氷に閉ざされた極寒のワールド',
    headerBg:   'linear-gradient(135deg, #0c4a6e 0%, #075985 100%)',
    sectionBg:  '#f0f9ff',
    sectionBdr: '#bae6fd',
  },
};

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
    <div className="flex flex-1 flex-col" style={{ background: '#f5f5f0' }}>

      {/* ページヘッダー */}
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

      {/* ワールドセクション一覧 */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-5">
        {Object.entries(grouped).map(([worldLabel, stages]) => {
          const conf = WORLD_CONFIG[worldLabel] ?? {
            icon: '🌍',
            label: worldLabel,
            sub: '',
            headerBg: 'linear-gradient(135deg, #374151, #4b5563)',
            sectionBg: '#f9fafb',
            sectionBdr: '#e5e7eb',
          };

          return (
            <section key={worldLabel}>

              {/* ワールド見出し */}
              <div
                className="mb-3 flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: conf.headerBg }}
              >
                <span className="text-2xl">{conf.icon}</span>
                <div>
                  <p className="text-sm font-black text-white">{conf.label}</p>
                  <p className="text-[10px] text-white/60">{conf.sub}</p>
                </div>
              </div>

              {/* 色付き囲いでステージをまとめる */}
              <div
                className="rounded-2xl border p-3"
                style={{ background: conf.sectionBg, borderColor: conf.sectionBdr }}
              >
                <ul className="flex flex-col gap-2">
                  {stages.map((s) => (
                    <StageCard key={s.stageId} stage={s} onSelect={onSelect} />
                  ))}
                </ul>
              </div>

            </section>
          );
        })}
      </div>
    </div>
  );
}
