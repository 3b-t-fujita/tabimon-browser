/**
 * ステージ選択画面 ViewModel。
 * GetAvailableStagesUseCase が生成する。
 */

import type { FarmCategory, FarmDifficultyTier } from '@/domain/entities/StageMaster';

export interface StageListItemViewModel {
  readonly stageId:          string;
  readonly stageName:        string;
  readonly worldLabel:       string;   // e.g., "ミドリの森"
  readonly stageType:        'STORY' | 'FARM';
  readonly farmCategory:     FarmCategory | null;
  readonly difficultyTier:   FarmDifficultyTier | null;
  readonly difficulty:       string;   // "やさしい" | "ふつう" | "むずかしい"
  readonly recommendedLevel: number;
  readonly estimatedMinutes: number;
  readonly firstClearBonusExp: number | null;
  readonly recommendedBandLabel: string | null;
  readonly primaryEffectLabel: string | null;
  readonly supportText: string | null;
  readonly isUnlocked:       boolean;
}

export interface StageSelectViewModel {
  readonly storyStages: readonly StageListItemViewModel[];
  readonly farmStages: readonly StageListItemViewModel[];
  readonly stages: readonly StageListItemViewModel[];
}
