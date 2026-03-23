/**
 * 冒険開始確認画面 ViewModel。
 */

export interface AdventureConfirmMainViewModel {
  readonly displayName: string;
  readonly level:       number;
}

export interface AdventureConfirmSupportViewModel {
  readonly supportId:   string;
  readonly displayName: string;
  readonly level:       number;
}

export interface AdventureConfirmViewModel {
  readonly stageId:          string;
  readonly stageName:        string;
  readonly difficulty:       string;
  readonly recommendedLevel: number;
  readonly main:             AdventureConfirmMainViewModel | null;
  readonly supports:         readonly AdventureConfirmSupportViewModel[];
  /** 開始可否フラグ（バリデーション済み状態を UI に渡す） */
  readonly canStart:         boolean;
  readonly cannotStartReason: string | null;
}
