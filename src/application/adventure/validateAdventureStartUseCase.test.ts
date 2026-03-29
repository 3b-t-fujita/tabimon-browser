/**
 * ValidateAdventureStartUseCase ユニットテスト。
 * fake-indexeddb + fetch モックで完結する。
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TabimonDatabase, _resetDatabaseForTest } from '@/infrastructure/persistence/db/tabimonDb';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { ValidateAdventureStartUseCase } from './validateAdventureStartUseCase';
import { AdventureErrorCode, MonsterErrorCode, SaveErrorCode } from '@/common/errors/AppErrorCode';
import { AdventureSessionStatus, RoleType, PersonalityType, WorldId } from '@/common/constants/enums';
import { createEmptyMainSave } from '@/infrastructure/storage/models';
import { toPlayerId, toWorldId, toMonsterId, toMonsterMasterId, toSessionId, toStageId } from '@/types/ids';
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';
import type { SupportMonster } from '@/domain/entities/SupportMonster';
import { _resetStageMasterCache } from '@/infrastructure/master/stageMasterRepository';

// ---------------------------------------------------------------------------
// fetch モック（ステージマスタのみ必要）
// ---------------------------------------------------------------------------

const MOCK_STAGES = {
  items: [
    { stageId: 'stage_w1_1', worldId: 1, stageNo: 1, stageType: 'STORY', difficulty: 'Easy',   recommendedLevel: 1, estimatedMinutes: 3, nodePatternId: 'p1', enemyGroupPoolId: 'eg1', rewardGroupId: 'r1', bossEnemyGroupId: 'b1', unlockStageId: 'stage_w1_2', candidateMonsterPoolId: 'c1', baseExp: 30 },
    { stageId: 'stage_w1_2', worldId: 1, stageNo: 2, stageType: 'STORY', difficulty: 'Normal', recommendedLevel: 8, estimatedMinutes: 5, nodePatternId: 'p2', enemyGroupPoolId: 'eg2', rewardGroupId: 'r2', bossEnemyGroupId: 'b2', unlockStageId: null, candidateMonsterPoolId: 'c2', baseExp: 70 },
    { stageId: 'stage_w2_1', worldId: 2, stageNo: 1, stageType: 'STORY', difficulty: 'Easy',   recommendedLevel: 1, estimatedMinutes: 3, nodePatternId: 'p3', enemyGroupPoolId: 'eg3', rewardGroupId: 'r3', bossEnemyGroupId: 'b3', unlockStageId: 'stage_w2_2', candidateMonsterPoolId: 'c3', baseExp: 30 },
    { stageId: 'stage_farm_bond_early', worldId: 2, stageNo: 13, stageType: 'FARM', farmCategory: 'BOND', difficultyTier: 'EARLY', difficulty: 'Easy', recommendedLevel: 1, estimatedMinutes: 3, nodePatternId: 'p4', enemyGroupPoolId: 'eg4', rewardGroupId: 'r4', bossEnemyGroupId: 'b4', unlockStageId: null, candidateMonsterPoolId: 'c4', baseExp: 35 },
    { stageId: 'stage_farm_bond_late', worldId: 2, stageNo: 14, stageType: 'FARM', farmCategory: 'BOND', difficultyTier: 'LATE', difficulty: 'Normal', recommendedLevel: 15, estimatedMinutes: 4, nodePatternId: 'p5', enemyGroupPoolId: 'eg5', rewardGroupId: 'r5', bossEnemyGroupId: 'b5', unlockStageId: null, candidateMonsterPoolId: 'c5', baseExp: 55 },
  ],
};

function mockFetch(url: string): Promise<Response> {
  if ((url as string).includes('stages.json')) {
    return Promise.resolve(new Response(JSON.stringify(MOCK_STAGES)));
  }
  return Promise.resolve(new Response(JSON.stringify({ items: [] })));
}

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------

function resetDb(): SaveTransactionService {
  const db = new TabimonDatabase();
  _resetDatabaseForTest(db);
  return new SaveTransactionService();
}

function makeMonster(id: string, isMain: boolean): OwnedMonster {
  return {
    uniqueId: toMonsterId(id), monsterMasterId: toMonsterMasterId('MON_GRASS_001'),
    displayName: `Mon_${id}`, worldId: WorldId.Forest, role: RoleType.Attack,
    level: 5, exp: 0, personality: PersonalityType.Brave, skillIds: [], isMain,
  };
}

function makeSupport(id: string): SupportMonster {
  return {
    supportId: id, sourceUniqueMonsterIdFromQr: `src-${id}`,
    monsterMasterId: toMonsterMasterId('MON_GRASS_001'), displayName: `Sup_${id}`,
    worldId: WorldId.Forest, role: RoleType.Attack, level: 3,
    personality: PersonalityType.Brave, skillIds: [], registeredAt: '2024-01-01T00:00:00Z',
  };
}

async function seedWithMonsters(
  mainId: string | null,
  ownedMonsters: OwnedMonster[],
  supports: SupportMonster[] = [],
  unlockedStageIds: string[] = ['stage_w1_1', 'stage_w2_1', 'stage_w3_1'],
  clearedStageIds: string[] = [],
): Promise<void> {
  const tx = resetDb();
  await tx.saveMultiple({
    ...createEmptyMainSave(),
    player: {
      playerId:      toPlayerId('p-1'),
      playerName:    'テスター',
      worldId:       toWorldId(WorldId.Forest),
      mainMonsterId: mainId ? toMonsterId(mainId) : null,
    },
    ownedMonsters,
    supportMonsters: supports,
    progress: { unlockedStageIds, clearedStageIds },
  });
}

// ---------------------------------------------------------------------------
// テスト
// ---------------------------------------------------------------------------

describe('ValidateAdventureStartUseCase', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    _resetStageMasterCache();
    const db = new TabimonDatabase();
    _resetDatabaseForTest(db);
  });

  it('相棒設定済み・解放ステージ → ok', async () => {
    await seedWithMonsters('mon-1', [makeMonster('mon-1', true)]);
    const uc = new ValidateAdventureStartUseCase();
    const result = await uc.execute({ stageId: 'stage_w1_1', selectedSupportIds: [] });
    expect(result.ok).toBe(true);
  });

  it('相棒未設定 → NoMainMonster エラー', async () => {
    await seedWithMonsters(null, [makeMonster('mon-1', false)]);
    const uc = new ValidateAdventureStartUseCase();
    const result = await uc.execute({ stageId: 'stage_w1_1', selectedSupportIds: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe(AdventureErrorCode.NoMainMonster);
  });

  it('ステージID空 → NoStageSelected エラー', async () => {
    await seedWithMonsters('mon-1', [makeMonster('mon-1', true)]);
    const uc = new ValidateAdventureStartUseCase();
    const result = await uc.execute({ stageId: '', selectedSupportIds: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe(AdventureErrorCode.NoStageSelected);
  });

  it('存在しないステージ → StageNotFound エラー', async () => {
    await seedWithMonsters('mon-1', [makeMonster('mon-1', true)]);
    const uc = new ValidateAdventureStartUseCase();
    const result = await uc.execute({ stageId: 'stage_unknown_99', selectedSupportIds: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe(AdventureErrorCode.StageNotFound);
  });

  it('未解放ステージ（stageNo=2 で未解放） → StageNotUnlocked エラー', async () => {
    // unlockedStageIds にstage_w1_2を含まない
    await seedWithMonsters('mon-1', [makeMonster('mon-1', true)], [], ['stage_w1_1']);
    const uc = new ValidateAdventureStartUseCase();
    const result = await uc.execute({ stageId: 'stage_w1_2', selectedSupportIds: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe(AdventureErrorCode.StageNotUnlocked);
  });

  it('解放済みステージ（unlockedStageIds に含む） → ok', async () => {
    await seedWithMonsters('mon-1', [makeMonster('mon-1', true)], [], ['stage_w1_1', 'stage_w1_2', 'stage_w2_1', 'stage_w3_1']);
    const uc = new ValidateAdventureStartUseCase();
    const result = await uc.execute({ stageId: 'stage_w1_2', selectedSupportIds: [] });
    expect(result.ok).toBe(true);
  });

  it('stageNo=1 は unlockedStageIds になくても通過', async () => {
    await seedWithMonsters('mon-1', [makeMonster('mon-1', true)], [], []);
    const uc = new ValidateAdventureStartUseCase();
    const result = await uc.execute({ stageId: 'stage_w1_1', selectedSupportIds: [] });
    expect(result.ok).toBe(true);
  });

  it('そだてる前半は物語ステージ1クリアで通過', async () => {
    await seedWithMonsters('mon-1', [makeMonster('mon-1', true)], [], [], ['stage_w1_1']);
    const uc = new ValidateAdventureStartUseCase();
    const result = await uc.execute({ stageId: 'stage_farm_bond_early', selectedSupportIds: [] });
    expect(result.ok).toBe(true);
  });

  it('そだてる後半は物語ステージ2未クリアだと失敗', async () => {
    await seedWithMonsters('mon-1', [makeMonster('mon-1', true)], [], [], ['stage_w1_1']);
    const uc = new ValidateAdventureStartUseCase();
    const result = await uc.execute({ stageId: 'stage_farm_bond_late', selectedSupportIds: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe(AdventureErrorCode.StageNotUnlocked);
  });

  it('そだてる後半は物語ステージ2クリアで通過', async () => {
    await seedWithMonsters('mon-1', [makeMonster('mon-1', true)], [], [], ['stage_w2_2']);
    const uc = new ValidateAdventureStartUseCase();
    const result = await uc.execute({ stageId: 'stage_farm_bond_late', selectedSupportIds: [] });
    expect(result.ok).toBe(true);
  });

  it('助っ人3体（上限超過） → SupportCapacityFull エラー', async () => {
    await seedWithMonsters('mon-1', [makeMonster('mon-1', true)],
      [makeSupport('s-1'), makeSupport('s-2'), makeSupport('s-3')]);
    const uc = new ValidateAdventureStartUseCase();
    const result = await uc.execute({ stageId: 'stage_w1_1', selectedSupportIds: ['s-1', 's-2', 's-3'] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe(MonsterErrorCode.SupportCapacityFull);
  });

  it('助っ人重複 → DuplicateSupport エラー', async () => {
    await seedWithMonsters('mon-1', [makeMonster('mon-1', true)], [makeSupport('s-1')]);
    const uc = new ValidateAdventureStartUseCase();
    const result = await uc.execute({ stageId: 'stage_w1_1', selectedSupportIds: ['s-1', 's-1'] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe(MonsterErrorCode.DuplicateSupport);
  });

  it('存在しない助っ人ID → NotFound エラー', async () => {
    await seedWithMonsters('mon-1', [makeMonster('mon-1', true)]);
    const uc = new ValidateAdventureStartUseCase();
    const result = await uc.execute({ stageId: 'stage_w1_1', selectedSupportIds: ['sup-999'] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe(MonsterErrorCode.NotFound);
  });

  it('SESSION_ACTIVE セッション進行中 → ActiveSession エラー', async () => {
    await seedWithMonsters('mon-1', [makeMonster('mon-1', true)]);
    const tx = new SaveTransactionService();
    await tx.saveMultiple({
      adventureSession: {
        sessionId: toSessionId('sess-1'), stageId: toStageId('stage_w1_1'),
        currentNodeIndex: 3, partySnapshot: {
          main: {
            uniqueId: toMonsterId('mon-1'), monsterMasterId: toMonsterMasterId('MON_GRASS_001'),
            displayName: 'Mon_mon-1', personality: PersonalityType.Brave,
            stats: { maxHp: 100, atk: 15, def: 10, spd: 10 }, skills: [], isMain: true, worldId: 0,
          },
          supporters: [],
        },
        battleCheckpointNodeIndex: -1, resultPendingFlag: true,
        status: AdventureSessionStatus.Active, pendingResultType: null,
        nextBattleBuffMultiplier: 1.0, randomEventBattle: false,
      },
    });
    const uc = new ValidateAdventureStartUseCase();
    const result = await uc.execute({ stageId: 'stage_w1_1', selectedSupportIds: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe(AdventureErrorCode.ActiveSession);
  });
});
