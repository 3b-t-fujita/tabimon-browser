import { AdventureResultType } from '@/common/constants/enums';
import { GameConstants } from '@/common/constants/GameConstants';
import type { FarmCategory, FarmDifficultyTier } from '@/domain/entities/StageMaster';

export function getFarmStageName(category: FarmCategory, tier: FarmDifficultyTier): string {
  if (category === 'EXP') return tier === 'EARLY' ? 'けいけんちの草原・前半' : 'けいけんちの草原・後半';
  if (category === 'BOND') return tier === 'EARLY' ? 'きずなの広場・前半' : 'きずなの広場・後半';
  return tier === 'EARLY' ? 'わざみがきの丘・前半' : 'わざみがきの丘・後半';
}

export function getFarmTierLabel(tier: FarmDifficultyTier): string {
  return tier === 'EARLY' ? '前半向け' : '後半向け';
}

export function getFarmRecommendedBandLabel(category: FarmCategory, tier: FarmDifficultyTier): string {
  if (category === 'EXP') return tier === 'EARLY' ? 'Lv1〜14' : 'Lv15〜30';
  if (category === 'BOND') return tier === 'EARLY' ? 'Rank0〜2' : 'Rank2〜4';
  return tier === 'EARLY' ? 'Stage0〜2' : 'Stage2〜3';
}

export function getFarmSupportText(category: FarmCategory, tier: FarmDifficultyTier): string {
  if (category === 'EXP') return tier === 'EARLY' ? 'レベルを どんどん あげたいときに' : 'つよくなった あいぼうを さらに のばそう';
  if (category === 'BOND') return tier === 'EARLY' ? 'あいぼうとの きずなを そだてよう' : 'もっと ふかい きずなを めざそう';
  return tier === 'EARLY' ? 'わざを たくさん つかって みがこう' : 'とくいわざを さらに きたえよう';
}

export function getFarmPrimaryEffectLabel(category: FarmCategory, tier: FarmDifficultyTier, baseExp: number): string {
  if (category === 'EXP') return `主な効果 +${baseExp} EXP`;
  if (category === 'BOND') {
    return tier === 'EARLY'
      ? `主な効果 成功 +${GameConstants.FARM_BOND_EARLY_GAIN_SUCCESS}`
      : `主な効果 成功 +${GameConstants.FARM_BOND_LATE_GAIN_SUCCESS}`;
  }
  return tier === 'EARLY'
    ? `主な効果 使用回数 ×${GameConstants.FARM_SKILL_EARLY_MULTIPLIER}（上限 +${GameConstants.FARM_SKILL_EARLY_CAP}）`
    : `主な効果 使用回数 ×${GameConstants.FARM_SKILL_LATE_MULTIPLIER}（上限 +${GameConstants.FARM_SKILL_LATE_CAP}）`;
}

export function getFarmResultMessage(category: FarmCategory, tier: FarmDifficultyTier): string {
  if (category === 'EXP') return tier === 'EARLY' ? 'けいけんちを しっかり かくとく！' : 'けいけんちを たっぷり かくとく！';
  if (category === 'BOND') return tier === 'EARLY' ? 'きずなが すこしずつ ふかまった！' : 'きずなが ぐっと ふかまった！';
  return tier === 'EARLY' ? 'わざが みがかれてきた！' : 'わざが ぐんと みがかれた！';
}

export function getFarmBondGain(tier: FarmDifficultyTier, resultType: AdventureResultType): number {
  if (tier === 'EARLY') {
    switch (resultType) {
      case AdventureResultType.Success: return GameConstants.FARM_BOND_EARLY_GAIN_SUCCESS;
      case AdventureResultType.Failure: return GameConstants.FARM_BOND_EARLY_GAIN_FAILURE;
      case AdventureResultType.Retire: return GameConstants.FARM_BOND_EARLY_GAIN_RETIRE;
    }
  }

  switch (resultType) {
    case AdventureResultType.Success: return GameConstants.FARM_BOND_LATE_GAIN_SUCCESS;
    case AdventureResultType.Failure: return GameConstants.FARM_BOND_LATE_GAIN_FAILURE;
    case AdventureResultType.Retire: return GameConstants.FARM_BOND_LATE_GAIN_RETIRE;
  }
}

export function getFarmSkillMultiplier(tier: FarmDifficultyTier): number {
  return tier === 'EARLY' ? GameConstants.FARM_SKILL_EARLY_MULTIPLIER : GameConstants.FARM_SKILL_LATE_MULTIPLIER;
}

export function getFarmSkillCap(tier: FarmDifficultyTier): number {
  return tier === 'EARLY' ? GameConstants.FARM_SKILL_EARLY_CAP : GameConstants.FARM_SKILL_LATE_CAP;
}

export function getFarmEnemyStrengthMultiplier(tier: FarmDifficultyTier): number {
  return tier === 'EARLY'
    ? GameConstants.FARM_ENEMY_EARLY_MULTIPLIER
    : GameConstants.FARM_ENEMY_LATE_MULTIPLIER;
}
