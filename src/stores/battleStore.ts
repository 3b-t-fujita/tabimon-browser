/**
 * 戦闘 UI 状態 Zustand Store。
 * AdventureBattlePage が使う戦闘専用 UI 状態を管理する。
 * フェーズ7指示書 §5.3 に準拠。
 *
 * 持ってよいもの:
 *   - 現在の BattleState（UI 表示用コピー。IndexedDB には保存しない）
 *   - 戦闘内部フェーズ（BattlePhase）
 *   - エラーメッセージ
 *
 * 持ってはいけないもの:
 *   - IndexedDB 直接操作
 *   - tick 進行ロジック
 *   - AdventureSession の更新ロジック（UseCase に委譲）
 */
import { create } from 'zustand';
import type { BattleState } from '@/domain/battle/BattleState';

/** 戦闘内部フェーズ */
export type BattlePhase =
  | 'BATTLE_PREPARING'       // 戦闘開始準備中（initializeBattle 呼び出し前）
  | 'BATTLE_RUNNING'         // 戦闘進行中（tick 中）
  | 'BATTLE_RESULT_APPLYING' // 戦闘終了 → 結果反映中
  | 'FAILED';                // エラー（操作不能）

interface BattleStoreState {
  /** 現在の BattleState（UI 表示用。null = 未初期化） */
  battleState:    BattleState | null;
  /** 戦闘内部フェーズ */
  battlePhase:    BattlePhase;
  /** エラーメッセージ（FAILED 時に設定） */
  errorMessage:   string | null;
}

interface BattleStoreActions {
  setBattleState(s: BattleState | null): void;
  setBattlePhase(phase: BattlePhase): void;
  setError(msg: string | null): void;
  reset(): void;
}

const INITIAL_STATE: BattleStoreState = {
  battleState:  null,
  battlePhase:  'BATTLE_PREPARING',
  errorMessage: null,
};

export const useBattleStore = create<BattleStoreState & BattleStoreActions>((set) => ({
  ...INITIAL_STATE,

  setBattleState: (s)     => set({ battleState: s }),
  setBattlePhase: (phase) => set({ battlePhase: phase }),
  setError:       (msg)   => set({ errorMessage: msg, battlePhase: msg !== null ? 'FAILED' : 'BATTLE_PREPARING' }),
  reset:          ()      => set(INITIAL_STATE),
}));
