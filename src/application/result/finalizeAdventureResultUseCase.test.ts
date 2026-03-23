/**
 * FinalizeAdventureResultUseCase 統合テスト。
 * 詳細設計 v4 §8, §10.6 リザルト確定・二重反映防止の検証。
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TabimonDatabase, _resetDatabaseForTest } from '@/infrastructure/persistence/db/tabimonDb';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { FinalizeAdventureResultUseCase } from './finalizeAdventureResultUseCase';
import {
  AdventureSessionStatus, AdventureResultType,
  PersonalityType, WorldId,
} from '@/common/constants/enums';
import { AdventureErrorCode } from '@/common/errors/AppErrorCode';
import { createEmptyMainSave } from '@/infrastructure/storage/models';
import {
  toSessionId, toStageId, toMonsterId, toMonsterMasterId, toPlayerId, toWorldId,
} from '@/types/ids';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';
import { _resetStageMasterCache } from '@/infrastructure/master/stageMasterRepository';
import { _resetLevelExpCache } from '@/infrastructure/master/levelExpRepository';

// ---------------------------------------------------------------------------
// モック
// ---------------------------------------------------------------------------

const MOCK_STAGES = {
  items: [
    {
      stageId: 'stage_w1_1', worldId: 1, stageNo: 1, difficulty: 'Easy',
      recommendedLevel: 1, nodePatternId: 'pattern_w1_1',
      enemyGroupPoolId: 'pool_w1_easy', bossEnemyGroupId: 'boss_w1_1',
      candidateMonsterPoolId: 'cand_pool_w1',
      unlockStageId: 'stage_w1_2', baseExp: 100,
    },
    {
      stageId: 'stage_w1_2', worldId: 1, stageNo: 2, difficulty: 'Normal',
      recommendedLevel: 5, nodePatternId: 'pattern_w1_2',
      enemyGroupPoolId: 'pool_w1_normal', bossEnemyGroupId: 'boss_w1_2',
      candidateMonsterPoolId: 'cand_pool_w1',
      unlockStageId: null, baseExp: 200,
    },
  ],
};

// Lv1→Lv2: 50EXP必要, Lv2→Lv3: 100EXP必要
const MOCK_LEVEL_EXP = {
  items: [
    { level: 2, requiredExp: 50,  totalExp: 50  },
    { level: 3, requiredExp: 100, totalExp: 150 },
    { level: 4, requiredExp: 200, totalExp: 350 },
  ],
};

function mockFetch(url: string): Promise<Response> {
  if ((url as string).includes('stages.json'))    return Promise.resolve(new Response(JSON.stringify(MOCK_STAGES)));
  if ((url as string).includes('level_exp.json')) return Promise.resolve(new Response(JSON.stringify(MOCK_LEVEL_EXP)));
  return Promise.resolve(new Response(JSON.stringify({ items: [] })));
}

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------

function resetAll(): SaveTransactionService {
  const db = new TabimonDatabase();
  _resetDatabaseForTest(db);
  _resetStageMasterCache();
  _resetLevelExpCache();
  return new SaveTransactionService();
}

const MAIN_MON_ID = toMonsterId('mon-1');

function makeMainMonster(overrides: Partial<OwnedMonster> = {}): OwnedMonster {
  return {
    uniqueId:        MAIN_MON_ID,
    monsterMasterId: toMonsterMasterId('MON_GRASS_001'),
    displayName:     'グリーニョ',
    worldId:         WorldId.Forest,
    role:            'ATTACK' as OwnedMonster['role'],
    level:           1,
    exp:             0,
    personality:     PersonalityType.Brave,
    skillIds:        [],
    isMain:          true,
    ...overrides,
  };
}

function makeSession(overrides: Partial<AdventureSession> = {}): AdventureSession {
  return {
    sessionId:                 toSessionId('sess-1'),
    stageId:                   toStageId('stage_w1_1'),
    currentNodeIndex:          4,
    partySnapshot: {
      main: {
        uniqueId:        MAIN_MON_ID,
        monsterMasterId: toMonsterMasterId('MON_GRASS_001'),
        displayName:     'グリーニョ',
        personality:     PersonalityType.Brave,
        stats:           { maxHp: 100, atk: 15, def: 10, spd: 10 },
        skills:          [],
        isMain:          true,
      },
      supporters: [],
    },
    battleCheckpointNodeIndex: -1,
    resultPendingFlag:         true,   // 未確定
    status:                    AdventureSessionStatus.PendingResult,
    pendingResultType:         AdventureResultType.Success,
    nextBattleBuffMultiplier:  1.0,
    randomEventBattle:         false,
    ...overrides,
  };
}

async function seedSave(
  session: AdventureSession,
  mainMon: OwnedMonster = makeMainMonster(),
): Promise<void> {
  const tx = resetAll();
  await tx.saveMultiple({
    ...createEmptyMainSave(),
    player: {
      playerId:      toPlayerId('p-1'),
      playerName:    'Tester',
      worldId:       toWorldId(WorldId.Forest),
      mainMonsterId: MAIN_MON_ID,
    },
    ownedMonsters:    [mainMon],
    adventureSession: session,
    progress: {
      unlockedStageIds: ['stage_w1_1'],
      clearedStageIds:  [],
    },
  });
}

// ---------------------------------------------------------------------------
// テスト
// ---------------------------------------------------------------------------

describe('FinalizeAdventureResultUseCase', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    resetAll();
  });

  it('SUCCESS: 経験値が反映され resultPendingFlag=false になる', async () => {
    const session = makeSession();
    await seedSave(session);

    const result = await new FinalizeAdventureResultUseCase().execute(session, AdventureResultType.Success);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // baseExp=100 × SUCCESS=1.0 = 100
    expect(result.value.expGained).toBe(100);
    // Lv1 + 100EXP → Lv2(50) 消費 → 残り50EXP、leveledUp=true
    expect(result.value.leveledUp).toBe(true);
    expect(result.value.newLevel).toBe(2);
    expect(result.value.updatedSession.resultPendingFlag).toBe(false);
    expect(result.value.updatedSession.status).toBe(AdventureSessionStatus.Completed);
  });

  it('SUCCESS: ステージクリア記録 + 次ステージ解放 (stageUnlocked=true)', async () => {
    const session = makeSession();
    await seedSave(session);

    const result = await new FinalizeAdventureResultUseCase().execute(session, AdventureResultType.Success);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.stageUnlocked).toBe(true);

    // DBへの保存内容を確認
    const loaded = await new SaveTransactionService().load();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value?.progress?.clearedStageIds).toContain('stage_w1_1');
    expect(loaded.value?.progress?.unlockedStageIds).toContain('stage_w1_2');
  });

  it('FAILURE: 経験値が 0.5倍 反映される', async () => {
    const session = makeSession();
    await seedSave(session);

    const result = await new FinalizeAdventureResultUseCase().execute(session, AdventureResultType.Failure);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // baseExp=100 × FAILURE=0.5 = 50
    expect(result.value.expGained).toBe(50);
    // 50EXP → Lv2へ丁度到達 leveledUp=true
    expect(result.value.leveledUp).toBe(true);
    expect(result.value.stageUnlocked).toBe(false);
  });

  it('RETIRE: 経験値が 0.3倍 反映される', async () => {
    const session = makeSession();
    await seedSave(session);

    const result = await new FinalizeAdventureResultUseCase().execute(session, AdventureResultType.Retire);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // baseExp=100 × RETIRE=0.3 = 30
    expect(result.value.expGained).toBe(30);
    expect(result.value.leveledUp).toBe(false);
    expect(result.value.stageUnlocked).toBe(false);
  });

  it('FAILURE: ステージクリア記録されない', async () => {
    const session = makeSession();
    await seedSave(session);

    await new FinalizeAdventureResultUseCase().execute(session, AdventureResultType.Failure);

    const loaded = await new SaveTransactionService().load();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value?.progress?.clearedStageIds).not.toContain('stage_w1_1');
    expect(loaded.value?.progress?.unlockedStageIds).not.toContain('stage_w1_2');
  });

  it('二重反映防止: resultPendingFlag=false だと ResultAlreadyFinal エラーになる', async () => {
    const session = makeSession({ resultPendingFlag: false });
    await seedSave(session);

    const result = await new FinalizeAdventureResultUseCase().execute(session, AdventureResultType.Success);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorCode).toBe(AdventureErrorCode.ResultAlreadyFinal);
  });

  it('同一セッションを2回 execute しても2回目は ResultAlreadyFinal になる', async () => {
    const session = makeSession();
    await seedSave(session);

    const first = await new FinalizeAdventureResultUseCase().execute(session, AdventureResultType.Success);
    expect(first.ok).toBe(true);

    // 1回目後の updatedSession (resultPendingFlag=false) で再試行
    if (!first.ok) return;
    const second = await new FinalizeAdventureResultUseCase().execute(
      first.value.updatedSession,
      AdventureResultType.Success,
    );
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.errorCode).toBe(AdventureErrorCode.ResultAlreadyFinal);
  });
});
