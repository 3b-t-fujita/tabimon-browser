/**
 * ノードパターン エンティティ。
 * ステージのノードシーケンスを表す。
 * 詳細設計 v4 §6 冒険ノード仕様に準拠。
 */
import type { NodeType } from '@/common/constants/enums';

/** 分岐選択肢 */
export interface NodeBranchOption {
  readonly label:         string;
  readonly nextNodeIndex: number;
}

/** 単一ノード定義 */
export interface AdventureNode {
  readonly nodeIndex:     number;
  readonly nodeType:      NodeType;
  /** 次ノードインデックス（BRANCH / GOAL / BOSS は不要） */
  readonly nextNodeIndex?: number;
  /** EVENT ノードに紐づくイベントID */
  readonly eventId?:      string;
  /** BRANCH ノードの選択肢リスト */
  readonly branchOptions?: readonly NodeBranchOption[];
}

/** ステージに割り当てられるノードパターン */
export interface NodePattern {
  readonly patternId: string;
  readonly nodes:     readonly AdventureNode[];
}
