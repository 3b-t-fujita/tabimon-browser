/**
 * 探索進行 UI 状態 Zustand Store。
 * AdventurePlayPage が使う状態のみを持つ。
 * フェーズ6指示書 §5.3 / §4.3 に準拠。
 *
 * 持ってよいもの:
 *   - 現在 AdventureSession（UI 表示用コピー。永続実体は IndexedDB）
 *   - 現在ノード情報
 *   - 探索内部状態（ExplorePhase）
 *   - 分岐選択肢・イベント表示用テキスト
 *   - 保存中フラグ・保存失敗フラグ
 *   - リタイア確認表示フラグ
 *
 * 持ってはいけないもの:
 *   - IndexedDB 直接操作
 *   - currentNodeIndex の独自進行ロジック
 *   - AdventureSession の更新ロジック（UseCase に委譲）
 */
import { create } from 'zustand';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import type { AdventureNode, NodeBranchOption } from '@/domain/entities/NodePattern';

/** 探索内部状態 */
export type ExplorePhase =
  | 'LOADING'            // セッション読み込み中
  | 'AUTO_MOVING'        // 通常ノード（PASS）自動前進中
  | 'BRANCH_SELECTING'   // 分岐選択待ち
  | 'EVENT_RESOLVING'    // イベント処理中
  | 'BATTLE_PREPARING'   // 戦闘準備中（BATTLE / BOSS ノード到達）
  | 'GOAL_REACHED'       // ゴール到達（GOAL ノード）
  | 'RETIRE_CONFIRMING'  // リタイア確認ダイアログ表示中
  | 'SAVE_ERROR';        // 保存失敗（操作不能）

interface AdventurePlayState {
  /** 現在の AdventureSession（UI 表示用。null = 未ロード） */
  session:          AdventureSession | null;
  /** 現在のノード定義 */
  currentNode:      AdventureNode | null;
  /** 探索内部状態 */
  explorePhase:     ExplorePhase;
  /** 分岐選択肢（BRANCH_SELECTING 時に設定） */
  branchOptions:    readonly NodeBranchOption[];
  /** イベントメッセージ（EVENT_RESOLVING 時に設定） */
  eventMessage:     string | null;
  /** 保存処理中フラグ */
  isSaving:         boolean;
  /** 保存失敗メッセージ（SAVE_ERROR 時に設定） */
  saveErrorMessage: string | null;
  /** リタイア確認ダイアログ表示中フラグ（RETIRE_CONFIRMING と連動） */
  showRetireDialog: boolean;
}

interface AdventurePlayActions {
  setSession(s: AdventureSession | null): void;
  setCurrentNode(n: AdventureNode | null): void;
  setExplorePhase(phase: ExplorePhase): void;
  setBranchOptions(opts: readonly NodeBranchOption[]): void;
  setEventMessage(msg: string | null): void;
  setIsSaving(v: boolean): void;
  setSaveError(msg: string | null): void;
  openRetireDialog(): void;
  closeRetireDialog(): void;
  reset(): void;
}

const INITIAL_STATE: AdventurePlayState = {
  session:          null,
  currentNode:      null,
  explorePhase:     'LOADING',
  branchOptions:    [],
  eventMessage:     null,
  isSaving:         false,
  saveErrorMessage: null,
  showRetireDialog: false,
};

export const useAdventurePlayStore = create<AdventurePlayState & AdventurePlayActions>((set) => ({
  ...INITIAL_STATE,

  setSession:      (s)     => set({ session: s }),
  setCurrentNode:  (n)     => set({ currentNode: n }),
  setExplorePhase: (phase) => set({ explorePhase: phase }),
  setBranchOptions:(opts)  => set({ branchOptions: opts }),
  setEventMessage: (msg)   => set({ eventMessage: msg }),
  setIsSaving:     (v)     => set({ isSaving: v }),
  setSaveError:    (msg)   => set({
    saveErrorMessage: msg,
    explorePhase: msg !== null ? 'SAVE_ERROR' : 'AUTO_MOVING',
  }),
  openRetireDialog:  () => set({ showRetireDialog: true,  explorePhase: 'RETIRE_CONFIRMING' }),
  closeRetireDialog: () => set({ showRetireDialog: false, explorePhase: 'AUTO_MOVING' }),
  reset: () => set(INITIAL_STATE),
}));
