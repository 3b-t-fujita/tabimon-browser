import type { SkillProficiencyStage } from '@/domain/entities/OwnedMonster';
import { GameConstants } from '@/common/constants/GameConstants';

export function calculateSkillProficiencyStage(useCount: number): SkillProficiencyStage {
  if (useCount >= GameConstants.SKILL_PROFICIENCY_THRESHOLD_3) return 3;
  if (useCount >= GameConstants.SKILL_PROFICIENCY_THRESHOLD_2) return 2;
  if (useCount >= GameConstants.SKILL_PROFICIENCY_THRESHOLD_1) return 1;
  return 0;
}

export function nextSkillProficiencyThreshold(useCount: number): number | null {
  const stage = calculateSkillProficiencyStage(useCount);
  switch (stage) {
    case 0: return GameConstants.SKILL_PROFICIENCY_THRESHOLD_1;
    case 1: return GameConstants.SKILL_PROFICIENCY_THRESHOLD_2;
    case 2: return GameConstants.SKILL_PROFICIENCY_THRESHOLD_3;
    default: return null;
  }
}
