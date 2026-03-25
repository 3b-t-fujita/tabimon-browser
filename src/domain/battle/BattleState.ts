/**
 * 戦闘全体の状態型定義。
 * 詳細設計 v4 §7 戦闘仕様に準拠。
 *
 * BattleState はセッション保存の対象外（IndexedDB には保存しない）。
 * 戦闘中の一時状態として Zustand Store のみで管理する。
 * 保存対象は AdventureSession（battleCheckpointNodeIndex / status）のみ。
 */
import type { BattleActor } from './BattleActor';

/** 戦闘結果 */
export type BattleOutcome = 'NONE' | 'WIN' | 'LOSE';

/** 戦闘ログエントリ */
export interface BattleLogEntry {
  tick:        number;
  actorName:   string;
  action:      string;   // "通常攻撃", "かみつく", "いやしのひかり" 等
  targetName?: string;
  value?:      number;   // ダメージ量 / 回復量
}

/** 戦闘全体状態 */
export interface BattleState {
  readonly sessionId: string;
  readonly stageId:   string;
  readonly isBoss:    boolean;

  actors:             BattleActor[];
  log:                BattleLogEntry[];
  outcome:            BattleOutcome;
  tickCount:          number;
  /** プレイヤーがキューした相棒スキルID（null = キューなし） */
  pendingMainSkillId: string | null;
}

/** BattleState の深いクローン（tick 処理前に必ず使う） */
export function cloneBattleState(state: BattleState): BattleState {
  return {
    ...state,
    actors: state.actors.map((a) => ({
      ...a,
      skills: a.skills.map((s) => ({ ...s })),
    })),
    log: [...state.log],
  };
}
