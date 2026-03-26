'use client';

import Image from 'next/image';
import type { AdventureNode } from '@/domain/entities/NodePattern';
import type { ExplorePhase } from '@/stores/adventurePlayStore';
import { NodeType } from '@/common/constants/enums';

interface Props {
  currentNode: AdventureNode | null;
  explorePhase: ExplorePhase;
  stageId: string;
  nodeTotal: number;
}

const NODE_IMG: Record<string, string> = {
  [NodeType.Pass]: '/assets/ui/icons/ui_node_pass_v1.webp',
  [NodeType.Branch]: '/assets/ui/icons/ui_node_branch_v1.webp',
  [NodeType.Event]: '/assets/ui/icons/ui_node_event_v1.webp',
  [NodeType.Battle]: '/assets/ui/icons/ui_node_battle_v1.webp',
  [NodeType.Boss]: '/assets/ui/icons/ui_node_boss_v1.webp',
  [NodeType.Goal]: '/assets/ui/icons/ui_node_goal_v1.webp',
};

const NODE_CONFIG: Record<string, { label: string; sub: string; chip: string; text: string; panel: string; emoji: string }> = {
  [NodeType.Pass]: { label: '通過', sub: '前へ進もう', chip: '#b9f9d6', text: '#0a4f36', panel: '#eff2ea', emoji: '🍃' },
  [NodeType.Branch]: { label: '分岐点', sub: 'どちらの道へ進む？', chip: '#e9d5ff', text: '#6b21a8', panel: '#f6efff', emoji: '🔀' },
  [NodeType.Event]: { label: 'イベント', sub: '何かが起きそうだ', chip: '#ffc972', text: '#482f00', panel: '#fff7e6', emoji: '✨' },
  [NodeType.Battle]: { label: '戦闘', sub: '敵が現れた！', chip: '#fac097', text: '#4a280a', panel: '#fff1ec', emoji: '⚔️' },
  [NodeType.Boss]: { label: 'ボス戦', sub: '強敵が待ち構えている', chip: '#fecaca', text: '#991b1b', panel: '#fff1f2', emoji: '💀' },
  [NodeType.Goal]: { label: 'ゴール', sub: '冒険の終着点です', chip: '#d6f0f3', text: '#1e4f57', panel: '#eef7f8', emoji: '🏁' },
};

export function AdventureNodeView({ currentNode, stageId, nodeTotal }: Props) {
  if (!currentNode) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-[28px] bg-white p-8 shadow-sm">
        <span className="text-5xl">🗺️</span>
        <p className="text-sm text-[#757872]">読み込み中...</p>
      </div>
    );
  }

  const conf = NODE_CONFIG[currentNode.nodeType] ?? NODE_CONFIG[NodeType.Pass];
  const imgSrc = NODE_IMG[currentNode.nodeType];
  const worldLabel = stageId.includes('_w1') ? 'ミドリの森' : stageId.includes('_w2') ? 'ホノオ火山' : 'コオリ氷原';

  return (
    <div className="overflow-hidden rounded-[32px] bg-white shadow-sm">
      <div className="px-5 py-4" style={{ background: conf.panel }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6c4324]/70">{worldLabel}</p>
            <p className="mt-2 text-2xl font-black text-[#2c302b]">{conf.label}</p>
            <p className="mt-1 text-sm text-[#595c57]">{conf.sub}</p>
          </div>
          <span className="rounded-full px-3 py-1 text-[11px] font-black" style={{ background: conf.chip, color: conf.text }}>
            ノード {currentNode.nodeIndex + 1}{nodeTotal > 0 ? ` / ${nodeTotal}` : ''}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 px-5 py-8">
        <div className="flex h-28 w-28 items-center justify-center rounded-[28px]" style={{ background: conf.panel }}>
          {imgSrc ? (
            <Image src={imgSrc} alt={conf.label} width={92} height={92} />
          ) : (
            <span className="text-6xl">{conf.emoji}</span>
          )}
        </div>
        <span className="rounded-full px-4 py-2 text-xs font-black" style={{ background: conf.chip, color: conf.text }}>
          {conf.emoji} {conf.label}
        </span>
      </div>
    </div>
  );
}
