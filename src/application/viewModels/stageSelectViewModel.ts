/**
 * ステージ選択画面 ViewModel。
 * GetAvailableStagesUseCase が生成する。
 */

export interface StageListItemViewModel {
  readonly stageId:          string;
  readonly stageName:        string;   // e.g., "ミドリの森 Stage 1"
  readonly worldLabel:       string;   // e.g., "ミドリの森"
  readonly difficulty:       string;   // "やさしい" | "ふつう" | "むずかしい"
  readonly recommendedLevel: number;
  readonly isUnlocked:       boolean;
}

export interface StageSelectViewModel {
  readonly stages: readonly StageListItemViewModel[];
}
