/**
 * 主役スキル発動 UseCase。
 * プレイヤーが選択したスキルIDを BattleState の pendingMainSkillId にセットする。
 *
 * 重要:
 * - 実際のスキル発動は次の processTick() 内で行われる（エンジン側処理）
 * - クールダウン中のスキルを指定しても tick 時にスキップされる
 * - 戦闘決着後（outcome !== 'NONE'）は変更しない
 */
import type { BattleState } from '@/domain/battle/BattleState';

/**
 * 主役スキルをキューに積む。
 * 純粋関数。副作用なし。
 *
 * @param state    現在の BattleState
 * @param skillId  発動したいスキルID
 * @returns        pendingMainSkillId が更新された新しい BattleState
 */
export function triggerMainSkill(state: BattleState, skillId: string): BattleState {
  if (state.outcome !== 'NONE') return state;
  return { ...state, pendingMainSkillId: skillId };
}
