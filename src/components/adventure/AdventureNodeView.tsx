/**
 * 現在ノードの状態表示コンポーネント。
 * ノード種別に応じてアイコンとラベルを表示する。
 */
'use client';

import type { AdventureNode } from '@/domain/entities/NodePattern';
import type { ExplorePhase } from '@/stores/adventurePlayStore';
import { NodeType } from '@/common/constants/enums';

interface Props {
  currentNode:  AdventureNode | null;
  explorePhase: ExplorePhase;
  stageId:      string;
  nodeTotal:    number;
}

const NODE_ICON: Record<string, string> = {
  [NodeType.Pass]:   '👣',
  [NodeType.Branch]: '🔀',
  [NodeType.Event]:  '✨',
  [NodeType.Battle]: '⚔️',
  [NodeType.Boss]:   '💀',
  [NodeType.Goal]:   '🏁',
};

const NODE_LABEL: Record<string, string> = {
  [NodeType.Pass]:   '通過',
  [NodeType.Branch]: '分岐',
  [NodeType.Event]:  'イベント',
  [NodeType.Battle]: '戦闘',
  [NodeType.Boss]:   'ボス戦',
  [NodeType.Goal]:   'ゴール',
};

const PHASE_LABEL: Record<ExplorePhase, string> = {
  LOADING:           '読み込み中...',
  AUTO_MOVING:       '前進中',
  BRANCH_SELECTING:  '分岐を選択してください',
  EVENT_RESOLVING:   'イベント発生！',
  BATTLE_PREPARING:  '戦闘準備中...',
  GOAL_REACHED:      'ゴール到達！',
  RETIRE_CONFIRMING: 'リタイア確認中',
  SAVE_ERROR:        '保存エラー',
};

export function AdventureNodeView({ currentNode, explorePhase, stageId, nodeTotal }: Props) {
  if (!currentNode) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-white p-6 shadow-sm">
        <p className="text-stone-400">読み込み中...</p>
      </div>
    );
  }

  const nodeIndex  = currentNode.nodeIndex;
  const nodeType   = currentNode.nodeType;
  const icon       = NODE_ICON[nodeType]  ?? '❓';
  const typeLabel  = NODE_LABEL[nodeType] ?? nodeType;
  const phaseLabel = PHASE_LABEL[explorePhase];

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-sm">
      {/* ステージ・進行状況 */}
      <div className="flex items-center justify-between text-xs text-stone-400">
        <span>{stageId}</span>
        <span>ノード {nodeIndex + 1} / {nodeTotal}</span>
      </div>

      {/* ノードアイコン・種別 */}
      <div className="flex flex-col items-center gap-2 py-4">
        <span className="text-5xl">{icon}</span>
        <span className="text-lg font-bold text-stone-800">{typeLabel}</span>
        <span className="text-sm text-stone-500">{phaseLabel}</span>
      </div>

      {/* ノードインデックス（デバッグ補助） */}
      <div className="text-center text-xs text-stone-300">
        index: {nodeIndex}
      </div>
    </div>
  );
}
