/**
 * Recovery Prompt 画面用 ViewModel。
 * フェーズ3指示書 §14 要求の独立ファイル。
 */

/** 復旧対象セッションのサマリ（表示用） */
export interface RecoveryPromptViewModel {
  /** 復旧タイプ */
  readonly type:    'PENDING_RESULT' | 'ACTIVE' | 'INVALIDATED';
  /** ステージID（表示用） */
  readonly stageId: string;
}
