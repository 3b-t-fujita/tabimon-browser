/**
 * 現在ノードの状態表示コンポーネント。
 * ノード種別に応じてワールドテーマの演出付きカードを表示する。
 */
'use client';

import Image from 'next/image';
import type { AdventureNode } from '@/domain/entities/NodePattern';
import type { ExplorePhase } from '@/stores/adventurePlayStore';
import { NodeType } from '@/common/constants/enums';

interface Props {
  currentNode:  AdventureNode | null;
  explorePhase: ExplorePhase;
  stageId:      string;
  nodeTotal:    number;
}

const NODE_IMG: Record<string, string> = {
  [NodeType.Pass]:   '/assets/ui/icons/ui_node_pass_v1.webp',
  [NodeType.Branch]: '/assets/ui/icons/ui_node_branch_v1.webp',
  [NodeType.Event]:  '/assets/ui/icons/ui_node_event_v1.webp',
  [NodeType.Battle]: '/assets/ui/icons/ui_node_battle_v1.webp',
  [NodeType.Boss]:   '/assets/ui/icons/ui_node_boss_v1.webp',
  [NodeType.Goal]:   '/assets/ui/icons/ui_node_goal_v1.webp',
};

const NODE_CONFIG: Record<string, {
  label: string; sub: string; accent: string; bg: string; bgGrad: string; emoji: string; glow: boolean;
}> = {
  [NodeType.Pass]:   { label: '通過',     sub: '前へ進もう',           accent: '#10b981', bg: '#f0fdf4', bgGrad: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', emoji: '🍃', glow: false },
  [NodeType.Branch]: { label: '分岐点',   sub: 'どちらの道へ向かう？', accent: '#8b5cf6', bg: '#f5f3ff', bgGrad: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', emoji: '🔀', glow: false },
  [NodeType.Event]:  { label: 'イベント', sub: '何かが起きそうだ…',    accent: '#f59e0b', bg: '#fffbeb', bgGrad: 'linear-gradient(135deg, #fffbeb, #fef3c7)', emoji: '✨', glow: false },
  [NodeType.Battle]: { label: '戦闘！',   sub: '敵が現れた！',         accent: '#ef4444', bg: '#fef2f2', bgGrad: 'linear-gradient(135deg, #fef2f2, #fee2e2)', emoji: '⚔️', glow: true  },
  [NodeType.Boss]:   { label: 'ボス戦！', sub: '強敵が待ち構えている！',accent: '#dc2626', bg: '#fff1f2', bgGrad: 'linear-gradient(135deg, #fff1f2, #ffe4e6)', emoji: '💀', glow: true  },
  [NodeType.Goal]:   { label: 'ゴール！', sub: 'もうすぐ冒険の終わり…', accent: '#f59e0b', bg: '#fefce8', bgGrad: 'linear-gradient(135deg, #fefce8, #fef9c3)', emoji: '🏁', glow: false },
};

function getWorldAccent(stageId: string) {
  if (stageId.includes('_w1')) return '#10b981';
  if (stageId.includes('_w2')) return '#f97316';
  return '#38bdf8';
}

export function AdventureNodeView({ currentNode, explorePhase, stageId, nodeTotal }: Props) {
  const worldAccent = getWorldAccent(stageId);

  if (!currentNode) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-2xl p-10"
        style={{ background: '#f8fafc', minHeight: 220 }}
      >
        <div className="text-4xl animate-pulse">🗺️</div>
        <p className="text-sm text-stone-400">読み込み中...</p>
      </div>
    );
  }

  const nodeType  = currentNode.nodeType;
  const nodeIndex = currentNode.nodeIndex;
  const imgSrc    = NODE_IMG[nodeType];
  const nConf     = NODE_CONFIG[nodeType] ?? {
    label: nodeType, sub: '', accent: worldAccent,
    bg: '#f8fafc', bgGrad: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', emoji: '❓', glow: false,
  };

  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border shadow-sm"
      style={{ background: nConf.bgGrad, borderColor: `${nConf.accent}30` }}
    >
      {/* ── ノードタイプ帯 ── */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: `${nConf.accent}18` }}
      >
        <span className="text-xs font-black tracking-widest uppercase" style={{ color: nConf.accent }}>
          {nConf.emoji} {nConf.label}
        </span>
        <span className="text-xs text-stone-400">
          ノード {nodeIndex + 1}{nodeTotal > 0 ? ` / ${nodeTotal}` : ''}
        </span>
      </div>

      {/* ── ノードアイコン ── */}
      <div className="flex flex-col items-center gap-3 px-4 py-8">
        {imgSrc ? (
          <div
            className="flex items-center justify-center rounded-2xl p-5"
            style={{
              background:  `${nConf.accent}18`,
              boxShadow:   nConf.glow ? `0 0 32px ${nConf.accent}50, 0 0 8px ${nConf.accent}30` : undefined,
            }}
          >
            <Image
              src={imgSrc}
              alt={nConf.label}
              width={120}
              height={120}
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}
            />
          </div>
        ) : (
          <span className="text-7xl">{nConf.emoji}</span>
        )}

        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-2xl font-black" style={{ color: nConf.accent }}>
            {nConf.label}
          </span>
          <span className="text-sm text-stone-500">{nConf.sub}</span>
        </div>
      </div>
    </div>
  );
}
