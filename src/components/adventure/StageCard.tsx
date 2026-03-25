/**
 * ステージカード component（リデザイン版）。
 * ワールド属性に応じた色テーマ、難易度星表示、推奨Lvバッジを統合。
 */
'use client';

import Image from 'next/image';
import type { StageListItemViewModel } from '@/application/viewModels/stageSelectViewModel';

interface Props {
  stage:    StageListItemViewModel;
  onSelect: (stageId: string) => void;
}

// stageId ("stage_w1_*" 等) からワールドを判定
function getWorldKey(stageId: string): 'forest' | 'fire' | 'ice' {
  if (stageId.includes('_w1')) return 'forest';
  if (stageId.includes('_w2')) return 'fire';
  if (stageId.includes('_w3')) return 'ice';
  return 'forest';
}

const WORLD_STYLE = {
  forest: {
    icon: '🌿',
    accent: '#059669',
    headerBg: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
    badge: { bg: 'rgba(16,185,129,0.15)', text: '#6ee7b7' },
  },
  fire: {
    icon: '🔥',
    accent: '#ea580c',
    headerBg: 'linear-gradient(135deg, #7c2d12 0%, #9a3412 100%)',
    badge: { bg: 'rgba(234,88,12,0.15)', text: '#fdba74' },
  },
  ice: {
    icon: '❄️',
    accent: '#0284c7',
    headerBg: 'linear-gradient(135deg, #0c4a6e 0%, #075985 100%)',
    badge: { bg: 'rgba(2,132,199,0.15)', text: '#7dd3fc' },
  },
} as const;

const DIFFICULTY_STYLE: Record<string, { stars: number; bg: string; text: string; label: string }> = {
  'やさしい':   { stars: 1, bg: '#dcfce7', text: '#166534', label: 'Easy' },
  'ふつう':     { stars: 2, bg: '#fef9c3', text: '#854d0e', label: 'Normal' },
  'むずかしい': { stars: 3, bg: '#fee2e2', text: '#991b1b', label: 'Hard' },
};

export function StageCard({ stage, onSelect }: Props) {
  const locked  = !stage.isUnlocked;
  const world   = getWorldKey(stage.stageId);
  const wStyle  = WORLD_STYLE[world];
  const dStyle  = DIFFICULTY_STYLE[stage.difficulty] ?? { stars: 1, bg: '#f3f4f6', text: '#374151', label: stage.difficulty };

  return (
    <li
      className={`overflow-hidden rounded-2xl shadow-sm transition ${
        locked ? 'opacity-50' : 'active:scale-[0.98]'
      }`}
      style={{ border: locked ? '1.5px solid #e5e7eb' : `1.5px solid ${wStyle.accent}30` }}
    >
      {/* カラーヘッダー */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: locked ? '#9ca3af' : wStyle.headerBg }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{wStyle.icon}</span>
          <span className="text-sm font-bold text-white">{stage.stageName}</span>
        </div>
        {locked && (
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white/80">
            🔒 未解放
          </span>
        )}
      </div>

      {/* カード本体 */}
      <div className="flex items-center gap-3 bg-white px-4 py-3">
        {/* 難易度・推奨Lv */}
        <div className="flex flex-1 flex-wrap gap-1.5">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
            style={{ background: dStyle.bg, color: dStyle.text }}
          >
            {'⭐'.repeat(dStyle.stars)} {stage.difficulty}
          </span>
          <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
            推奨 Lv.{stage.recommendedLevel}〜
          </span>
        </div>

        {/* 選択ボタン */}
        <button
          type="button"
          onClick={() => onSelect(stage.stageId)}
          disabled={locked}
          className="shrink-0 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: locked ? '#9ca3af' : wStyle.headerBg }}
        >
          {locked ? '🔒' : '出発 →'}
        </button>
      </div>
    </li>
  );
}
