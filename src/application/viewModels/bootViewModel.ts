/**
 * Boot / Loading 画面用 ViewModel。
 * UI 層が保存・復旧ロジックを直接知らなくて済むよう整形する。
 */
import type { RecoveryPromptViewModel } from './recoveryPromptViewModel';

/** 起動後に進むべき画面 */
export const BootDestination = {
  InitialSetup:     'INITIAL_SETUP',
  Home:             'HOME',
  RecoveryPrompt:   'RECOVERY_PROMPT',
  LoadFailed:       'LOAD_FAILED',
} as const;
export type BootDestination = (typeof BootDestination)[keyof typeof BootDestination];

export interface BootViewModel {
  readonly destination:        BootDestination;
  /** 復旧対象のセッション情報サマリ（RecoveryPrompt 表示用）*/
  readonly recoveryInfo:        RecoveryPromptViewModel | null;
  /** ロード失敗時のエラーメッセージ */
  readonly errorMessage:        string | null;
}
