import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetAvailableStagesUseCase } from './getAvailableStagesUseCase';
import { TabimonDatabase, _resetDatabaseForTest } from '@/infrastructure/persistence/db/tabimonDb';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { createEmptyMainSave } from '@/infrastructure/storage/models';
import { _resetStageMasterCache } from '@/infrastructure/master/stageMasterRepository';

const MOCK_STAGES = {
  items: [
    {
      stageId: 'stage_w1_1', worldId: 1, stageNo: 1, stageType: 'STORY',
      difficulty: 'Easy', recommendedLevel: 1, estimatedMinutes: 3, firstClearBonusExp: 20,
      nodePatternId: 'p1', enemyGroupPoolId: 'eg1', rewardGroupId: 'r1', bossEnemyGroupId: 'b1',
      unlockStageId: 'stage_w1_2', candidateMonsterPoolId: 'c1', baseExp: 30, rareAPoolId: null, rareBPoolId: null,
    },
    {
      stageId: 'stage_w1_2', worldId: 1, stageNo: 2, stageType: 'STORY',
      difficulty: 'Normal', recommendedLevel: 8, estimatedMinutes: 5, firstClearBonusExp: 40,
      nodePatternId: 'p2', enemyGroupPoolId: 'eg2', rewardGroupId: 'r2', bossEnemyGroupId: 'b2',
      unlockStageId: null, candidateMonsterPoolId: 'c2', baseExp: 70, rareAPoolId: null, rareBPoolId: null,
    },
    {
      stageId: 'stage_farm_exp_early', worldId: 1, stageNo: 11, stageType: 'FARM', farmCategory: 'EXP',
      difficultyTier: 'EARLY', difficulty: 'Easy', recommendedLevel: 1, estimatedMinutes: 3,
      nodePatternId: 'pf', enemyGroupPoolId: 'egf', rewardGroupId: 'rf', bossEnemyGroupId: 'bf',
      unlockStageId: null, candidateMonsterPoolId: 'cf', baseExp: 90, rareAPoolId: null, rareBPoolId: null,
    },
    {
      stageId: 'stage_farm_exp_late', worldId: 1, stageNo: 12, stageType: 'FARM', farmCategory: 'EXP',
      difficultyTier: 'LATE', difficulty: 'Normal', recommendedLevel: 15, estimatedMinutes: 4,
      nodePatternId: 'pf2', enemyGroupPoolId: 'egf2', rewardGroupId: 'rf2', bossEnemyGroupId: 'bf2',
      unlockStageId: null, candidateMonsterPoolId: 'cf2', baseExp: 165, rareAPoolId: null, rareBPoolId: null,
    },
    {
      stageId: 'stage_farm_bond_early', worldId: 2, stageNo: 13, stageType: 'FARM', farmCategory: 'BOND',
      difficultyTier: 'EARLY', difficulty: 'Easy', recommendedLevel: 1, estimatedMinutes: 3,
      nodePatternId: 'pf3', enemyGroupPoolId: 'egf3', rewardGroupId: 'rf3', bossEnemyGroupId: 'bf3',
      unlockStageId: null, candidateMonsterPoolId: 'cf3', baseExp: 35, rareAPoolId: null, rareBPoolId: null,
    },
    {
      stageId: 'stage_farm_bond_late', worldId: 2, stageNo: 14, stageType: 'FARM', farmCategory: 'BOND',
      difficultyTier: 'LATE', difficulty: 'Normal', recommendedLevel: 15, estimatedMinutes: 4,
      nodePatternId: 'pf4', enemyGroupPoolId: 'egf4', rewardGroupId: 'rf4', bossEnemyGroupId: 'bf4',
      unlockStageId: null, candidateMonsterPoolId: 'cf4', baseExp: 55, rareAPoolId: null, rareBPoolId: null,
    },
    {
      stageId: 'stage_farm_skill_early', worldId: 3, stageNo: 15, stageType: 'FARM', farmCategory: 'SKILL',
      difficultyTier: 'EARLY', difficulty: 'Easy', recommendedLevel: 1, estimatedMinutes: 3,
      nodePatternId: 'pf5', enemyGroupPoolId: 'egf5', rewardGroupId: 'rf5', bossEnemyGroupId: 'bf5',
      unlockStageId: null, candidateMonsterPoolId: 'cf5', baseExp: 40, rareAPoolId: null, rareBPoolId: null,
    },
    {
      stageId: 'stage_farm_skill_late', worldId: 3, stageNo: 16, stageType: 'FARM', farmCategory: 'SKILL',
      difficultyTier: 'LATE', difficulty: 'Normal', recommendedLevel: 15, estimatedMinutes: 4,
      nodePatternId: 'pf6', enemyGroupPoolId: 'egf6', rewardGroupId: 'rf6', bossEnemyGroupId: 'bf6',
      unlockStageId: null, candidateMonsterPoolId: 'cf6', baseExp: 65, rareAPoolId: null, rareBPoolId: null,
    },
  ],
};

function mockFetch(url: string): Promise<Response> {
  if ((url as string).includes('stages.json')) {
    return Promise.resolve(new Response(JSON.stringify(MOCK_STAGES)));
  }
  return Promise.resolve(new Response(JSON.stringify({ items: [] })));
}

function resetAll(): SaveTransactionService {
  const db = new TabimonDatabase();
  _resetDatabaseForTest(db);
  _resetStageMasterCache();
  return new SaveTransactionService();
}

describe('GetAvailableStagesUseCase', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    resetAll();
  });

  it('story と farm を分離して返す', async () => {
    const tx = resetAll();
    await tx.saveMultiple({
      ...createEmptyMainSave(),
      progress: {
        unlockedStageIds: ['stage_w1_2'],
        clearedStageIds: ['stage_w1_1', 'stage_w1_2'],
      },
    });

    const result = await new GetAvailableStagesUseCase().execute();
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.storyStages).toHaveLength(2);
    expect(result.value.farmStages).toHaveLength(6);
    expect(result.value.farmStages[0]?.stageName).toBe('けいけんちの草原・前半');
    expect(result.value.farmStages[0]?.recommendedBandLabel).toBe('Lv1〜14');
    expect(result.value.storyStages[1]?.isUnlocked).toBe(true);
  });

  it('物語1クリアで前半のみ解放され、物語2クリアで後半も解放される', async () => {
    const tx = resetAll();
    await tx.saveMultiple({
      ...createEmptyMainSave(),
      progress: {
        unlockedStageIds: [],
        clearedStageIds: ['stage_w2_1'],
      },
    });

    const result = await new GetAvailableStagesUseCase().execute();
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.farmStages.filter((farm) => farm.difficultyTier === 'EARLY').every((farm) => farm.isUnlocked)).toBe(true);
    expect(result.value.farmStages.filter((farm) => farm.difficultyTier === 'LATE').every((farm) => !farm.isUnlocked)).toBe(true);
  });

  it('物語2クリアで後半も解放される', async () => {
    const tx = resetAll();
    await tx.saveMultiple({
      ...createEmptyMainSave(),
      progress: {
        unlockedStageIds: [],
        clearedStageIds: ['stage_w3_2'],
      },
    });

    const result = await new GetAvailableStagesUseCase().execute();
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.farmStages.every((farm) => farm.isUnlocked)).toBe(true);
    expect(result.value.farmStages.map((farm) => farm.farmCategory)).toEqual([
      'EXP', 'EXP', 'BOND', 'BOND', 'SKILL', 'SKILL',
    ]);
    expect(result.value.farmStages.map((farm) => farm.difficultyTier)).toEqual([
      'EARLY', 'LATE', 'EARLY', 'LATE', 'EARLY', 'LATE',
    ]);
  });
});
