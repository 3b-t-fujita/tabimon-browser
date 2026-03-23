/**
 * 冒険リザルト報酬計算サービス。
 * 詳細設計 v4 §8.3 経験値計算に準拠。
 *
 * 経験値計算式:
 *   expGained = floor(stage.baseExp × EXP_COEFF_*)
 *   EXP_COEFF_SUCCESS=1.0 / FAILURE=0.5 / RETIRE=0.3
 *
 * レベルアップ: level_exp.json のテーブルに基づく。
 */
import { AdventureResultType } from '@/common/constants/enums';
import { GameConstants } from '@/common/constants/GameConstants';
import { applyExp } from '@/infrastructure/master/levelExpRepository';

export interface RewardCalculationResult {
  expGained:  number;
  newLevel:   number;
  newExp:     number;
  leveledUp:  boolean;
}

/** 結果種別ごとの経験値係数を返す */
function expCoeff(resultType: AdventureResultType): number {
  switch (resultType) {
    case AdventureResultType.Success: return GameConstants.EXP_COEFF_SUCCESS;
    case AdventureResultType.Failure: return GameConstants.EXP_COEFF_FAILURE;
    case AdventureResultType.Retire:  return GameConstants.EXP_COEFF_RETIRE;
  }
}

/**
 * ステージ基礎経験値・結果種別・現在レベル/経験値から報酬を計算する。
 */
export async function calculateAdventureRewards(
  baseExp:      number,
  resultType:   AdventureResultType,
  currentLevel: number,
  currentExp:   number,
): Promise<RewardCalculationResult> {
  const expGained = Math.floor(baseExp * expCoeff(resultType));
  const { newLevel, newExp, leveledUp } = await applyExp(
    currentLevel,
    currentExp,
    expGained,
    GameConstants.MAX_LEVEL,
  );
  return { expGained, newLevel, newExp, leveledUp };
}
