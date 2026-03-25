/**
 * StartAdventureUseCase 統合テスト。
 * 詳細設計 v4 §16 保存反映確認項目を全て検証する。
 *
 * 確認項目:
 *   - AdventureSession が保存される
 *   - sessionId が発行される
 *   - stageId が保存される
 *   - currentNodeIndex = 0 が保存される
 *   - battleCheckpointNodeIndex = -1 が保存される
 *   - resultPendingFlag = true が保存される
 *   - 再読込で session を取得できる
 *   - バリデーション失敗は DB を汚さない
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TabimonDatabase, _resetDatabaseForTest } from '@/infrastructure/persistence/db/tabimonDb';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { StartAdventureUseCase } from './startAdventureUseCase';
import { AdventureErrorCode, MonsterErrorCode } from '@/common/errors/AppErrorCode';
import { AdventureSessionStatus, RoleType, PersonalityType, WorldId } from '@/common/constants/enums';
import { createEmptyMainSave } from '@/infrastructure/storage/models';
import { toPlayerId, toWorldId, toMonsterId, toMonsterMasterId } from '@/types/ids';
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';
import { _resetStageMasterCache } from '@/infrastructure/master/stageMasterRepository';
import { _resetMonsterMasterCache } from '@/infrastructure/master/monsterMasterRepository';
import { _resetSkillMasterCache } from '@/infrastructure/master/skillMasterRepository';

// ---------------------------------------------------------------------------
// fetch モック
// ---------------------------------------------------------------------------

const MOCK_STAGES = {
  items: [
    { stageId: 'stage_w1_1', worldId: 1, stageNo: 1, difficulty: 'Easy', recommendedLevel: 1, nodePatternId: 'p1', unlockStageId: 'stage_w1_2', baseExp: 30 },
    { stageId: 'stage_w1_2', worldId: 1, stageNo: 2, difficulty: 'Normal', recommendedLevel: 8, nodePatternId: 'p2', unlockStageId: null, baseExp: 70 },
  ],
};
const MOCK_MONSTERS = { items: [] };
const MOCK_SKILLS   = { items: [] };

function mockFetch(url: string): Promise<Response> {
  if ((url as string).includes('stages.json'))   return Promise.resolve(new Response(JSON.stringify(MOCK_STAGES)));
  if ((url as string).includes('monsters.json')) return Promise.resolve(new Response(JSON.stringify(MOCK_MONSTERS)));
  if ((url as string).includes('skills.json'))   return Promise.resolve(new Response(JSON.stringify(MOCK_SKILLS)));
  return Promise.resolve(new Response(JSON.stringify({ items: [] })));
}

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------

function resetAll(): SaveTransactionService {
  const db = new TabimonDatabase();
  _resetDatabaseForTest(db);
  _resetStageMasterCache();
  _resetMonsterMasterCache();
  _resetSkillMasterCache();
  return new SaveTransactionService();
}

function makeMonster(id: string, isMain: boolean): OwnedMonster {
  return {
    uniqueId: toMonsterId(id), monsterMasterId: toMonsterMasterId('MON_GRASS_001'),
    displayName: `Mon_${id}`, worldId: WorldId.Forest, role: RoleType.Attack,
    level: 5, exp: 0, personality: PersonalityType.Brave, skillIds: [], isMain,
  };
}

async function seedSave(mainId: string, monsters: OwnedMonster[], unlockedStageIds: string[] = ['stage_w1_1', 'stage_w2_1']): Promise<void> {
  const tx = resetAll();
  await tx.saveMultiple({
    ...createEmptyMainSave(),
    player: {
      playerId: toPlayerId('p-1'), playerName: 'テスター',
      worldId: toWorldId(WorldId.Forest), mainMonsterId: toMonsterId(mainId),
    },
    ownedMonsters: monsters,
    progress: { unlockedStageIds, clearedStageIds: [] },
  });
}

// ---------------------------------------------------------------------------
// テスト
// ---------------------------------------------------------------------------

describe('StartAdventureUseCase', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    resetAll();
  });

  // --- §16 保存反映確認 ---

  it('冒険開始後に AdventureSession が保存される', async () => {
    await seedSave('mon-1', [makeMonster('mon-1', true)]);
    const result = await new StartAdventureUseCase().execute({
      stageId: 'stage_w1_1', selectedSupportIds: [],
    });
    expect(result.ok).toBe(true);

    const loaded = await new SaveTransactionService().load();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value?.adventureSession).not.toBeNull();
  });

  it('sessionId が発行される（空でない）', async () => {
    await seedSave('mon-1', [makeMonster('mon-1', true)]);
    const result = await new StartAdventureUseCase().execute({
      stageId: 'stage_w1_1', selectedSupportIds: [],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.sessionId).toBeTruthy();
    expect(result.value.sessionId.length).toBeGreaterThan(0);
  });

  it('stageId が正しく保存される', async () => {
    await seedSave('mon-1', [makeMonster('mon-1', true)]);
    const result = await new StartAdventureUseCase().execute({
      stageId: 'stage_w1_1', selectedSupportIds: [],
    });
    if (!result.ok) return;
    expect(result.value.stageId).toBe('stage_w1_1');

    const loaded = await new SaveTransactionService().load();
    if (!loaded.ok) return;
    expect(loaded.value?.adventureSession?.stageId).toBe('stage_w1_1');
  });

  it('currentNodeIndex = 0 が保存される', async () => {
    await seedSave('mon-1', [makeMonster('mon-1', true)]);
    const result = await new StartAdventureUseCase().execute({
      stageId: 'stage_w1_1', selectedSupportIds: [],
    });
    if (!result.ok) return;
    expect(result.value.currentNodeIndex).toBe(0);

    const loaded = await new SaveTransactionService().load();
    if (!loaded.ok) return;
    expect(loaded.value?.adventureSession?.currentNodeIndex).toBe(0);
  });

  it('battleCheckpointNodeIndex = -1 が保存される', async () => {
    await seedSave('mon-1', [makeMonster('mon-1', true)]);
    const result = await new StartAdventureUseCase().execute({
      stageId: 'stage_w1_1', selectedSupportIds: [],
    });
    if (!result.ok) return;
    expect(result.value.battleCheckpointNodeIndex).toBe(-1);

    const loaded = await new SaveTransactionService().load();
    if (!loaded.ok) return;
    expect(loaded.value?.adventureSession?.battleCheckpointNodeIndex).toBe(-1);
  });

  it('resultPendingFlag = true が保存される', async () => {
    await seedSave('mon-1', [makeMonster('mon-1', true)]);
    const result = await new StartAdventureUseCase().execute({
      stageId: 'stage_w1_1', selectedSupportIds: [],
    });
    if (!result.ok) return;
    expect(result.value.resultPendingFlag).toBe(true);

    const loaded = await new SaveTransactionService().load();
    if (!loaded.ok) return;
    expect(loaded.value?.adventureSession?.resultPendingFlag).toBe(true);
  });

  it('status = SESSION_ACTIVE が保存される', async () => {
    await seedSave('mon-1', [makeMonster('mon-1', true)]);
    const result = await new StartAdventureUseCase().execute({
      stageId: 'stage_w1_1', selectedSupportIds: [],
    });
    if (!result.ok) return;
    expect(result.value.status).toBe(AdventureSessionStatus.Active);

    const loaded = await new SaveTransactionService().load();
    if (!loaded.ok) return;
    expect(loaded.value?.adventureSession?.status).toBe(AdventureSessionStatus.Active);
  });

  it('partySnapshot に相棒が含まれる', async () => {
    await seedSave('mon-1', [makeMonster('mon-1', true)]);
    const result = await new StartAdventureUseCase().execute({
      stageId: 'stage_w1_1', selectedSupportIds: [],
    });
    if (!result.ok) return;
    expect(result.value.partySnapshot.main).not.toBeNull();
    expect(result.value.partySnapshot.main.uniqueId).toBe('mon-1');
    expect(result.value.partySnapshot.main.isMain).toBe(true);
  });

  it('再読込で AdventureSession を取得できる', async () => {
    await seedSave('mon-1', [makeMonster('mon-1', true)]);
    await new StartAdventureUseCase().execute({
      stageId: 'stage_w1_1', selectedSupportIds: [],
    });

    // 別インスタンスで再読込
    const tx     = new SaveTransactionService();
    const loaded = await tx.load();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value?.adventureSession?.sessionId).toBeTruthy();
    expect(loaded.value?.adventureSession?.currentNodeIndex).toBe(0);
  });

  // --- バリデーション失敗 ---

  it('相棒未設定は失敗し DB が汚れない', async () => {
    const tx = resetAll();
    await tx.saveMultiple({
      ...createEmptyMainSave(),
      player: { playerId: toPlayerId('p-1'), playerName: 'T', worldId: toWorldId(WorldId.Forest), mainMonsterId: null },
    });

    const result = await new StartAdventureUseCase().execute({
      stageId: 'stage_w1_1', selectedSupportIds: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe(AdventureErrorCode.NoMainMonster);

    const loaded = await tx.load();
    if (!loaded.ok) return;
    expect(loaded.value?.adventureSession).toBeNull();
  });

  it('未解放ステージは失敗する', async () => {
    await seedSave('mon-1', [makeMonster('mon-1', true)], ['stage_w1_1']); // stage_w1_2 は未解放
    const result = await new StartAdventureUseCase().execute({
      stageId: 'stage_w1_2', selectedSupportIds: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe(AdventureErrorCode.StageNotUnlocked);
  });

  it('助っ人重複は失敗する', async () => {
    await seedSave('mon-1', [makeMonster('mon-1', true)]);
    const result = await new StartAdventureUseCase().execute({
      stageId: 'stage_w1_1', selectedSupportIds: ['s-1', 's-1'],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe(MonsterErrorCode.DuplicateSupport);
  });
});
