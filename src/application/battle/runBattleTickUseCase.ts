/**
 * 戦闘 tick 進行 UseCase。
 * BattleTickEngine の processTick() を薄くラップする。
 *
 * 重要:
 * - BattleState は ephemeral。IndexedDB には保存しない。
 * - 勝敗確定後（outcome !== 'NONE'）は状態を変えずに返す（エンジン側保証）。
 * - 呼び出し元（UI hook / setInterval）が tick 間隔を制御すること。
 */
import type { BattleState } from '@/domain/battle/BattleState';
import { processTick } from '@/domain/battle/BattleTickEngine';

/**
 * 1 tick を処理して新しい BattleState を返す。
 * 純粋関数ラッパー。副作用なし。
 */
export function runBattleTick(state: BattleState): BattleState {
  return processTick(state);
}
