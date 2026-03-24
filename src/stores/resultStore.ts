/**
 * リザルト UI 状態 Zustand Store。
 * AdventureResultPage / CandidatePage が使う状態のみを持つ。
 * フェーズ8指示書 §5.3 に準拠。
 */
import { create } from 'zustand';
import { AdventureResultType } from '@/common/constants/enums';
import type { PendingCandidate } from '@/domain/entities/PendingCandidate';
import type { StatGains } from '@/application/result/finalizeAdventureResultUseCase';

/** リザルトフェーズ */
export type ResultPhase =
  | 'RESULT_PENDING'          // セッション確定待ち（resultPendingFlag=true）
  | 'RESULT_FINALIZED'        // 確定完了（報酬反映済み）
  | 'CANDIDATE_PENDING'       // 候補確認待ち
  | 'COMPLETED'               // 全処理完了（navigating to home）
  | 'FAILED';                 // エラー

interface ResultStoreState {
  resultType:     AdventureResultType | null;
  resultPhase:    ResultPhase;
  expGained:      number;
  newLevel:       number;
  leveledUp:      boolean;
  stageUnlocked:  boolean;
  statGains:      StatGains | null;
  evolved:        boolean;
  evolvedName:    string | null;
  candidate:      PendingCandidate | null;
  errorMessage:   string | null;
  isSaving:       boolean;
  /** 見送り確認ダイアログ表示中 */
  showSkipConfirm: boolean;
}

interface ResultStoreActions {
  setResultType(t: AdventureResultType | null): void;
  setResultPhase(p: ResultPhase): void;
  setRewardInfo(info: { expGained: number; newLevel: number; leveledUp: boolean; stageUnlocked: boolean; statGains: StatGains | null; evolved: boolean; evolvedName: string | null }): void;
  setCandidate(c: PendingCandidate | null): void;
  setError(msg: string | null): void;
  setIsSaving(v: boolean): void;
  openSkipConfirm(): void;
  closeSkipConfirm(): void;
  reset(): void;
}

const INITIAL: ResultStoreState = {
  resultType:      null,
  resultPhase:     'RESULT_PENDING',
  expGained:       0,
  newLevel:        1,
  leveledUp:       false,
  stageUnlocked:   false,
  statGains:       null,
  evolved:         false,
  evolvedName:     null,
  candidate:       null,
  errorMessage:    null,
  isSaving:        false,
  showSkipConfirm: false,
};

export const useResultStore = create<ResultStoreState & ResultStoreActions>((set) => ({
  ...INITIAL,

  setResultType:  (t)    => set({ resultType: t }),
  setResultPhase: (p)    => set({ resultPhase: p }),
  setRewardInfo:  (info) => set({ ...info }),
  setCandidate:   (c)    => set({ candidate: c }),
  setError:       (msg)  => set({ errorMessage: msg, resultPhase: msg !== null ? 'FAILED' : 'RESULT_PENDING' }),
  setIsSaving:    (v)    => set({ isSaving: v }),
  openSkipConfirm:  () => set({ showSkipConfirm: true }),
  closeSkipConfirm: () => set({ showSkipConfirm: false }),
  reset:          ()     => set(INITIAL),
}));
