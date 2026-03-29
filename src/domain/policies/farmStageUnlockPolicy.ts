import type { StageMaster } from '@/domain/entities/StageMaster';

function hasClearedAnyStoryStage(clearedStageIds: readonly string[], stageNo: 1 | 2): boolean {
  return clearedStageIds.some((stageId) => /_w\d_[12]$/.test(stageId) && stageId.endsWith(`_${stageNo}`));
}

export function isFarmStageUnlocked(
  stageMaster: StageMaster,
  clearedStageIds: readonly string[],
): boolean {
  if (stageMaster.stageType !== 'FARM') return false;

  if (stageMaster.difficultyTier === 'EARLY') {
    return hasClearedAnyStoryStage(clearedStageIds, 1) || hasClearedAnyStoryStage(clearedStageIds, 2);
  }

  if (stageMaster.difficultyTier === 'LATE') {
    return hasClearedAnyStoryStage(clearedStageIds, 2);
  }

  return false;
}
