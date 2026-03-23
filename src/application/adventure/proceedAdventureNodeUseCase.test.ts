/**
 * ProceedAdventureNodeUseCase 統合テスト。
 * §16 保存反映確認: currentNodeIndex が正しく更新・保存されることを検証する。
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TabimonDatabase, _resetDatabaseForTest } from '@/infrastructure/persistence/db/tabimonDb';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { ProceedAdventureNodeUseCase } from './proceedAdventureNodeUseCase';
import { AdventureSessionStatus, PersonalityType, WorldId, RoleType } from '@/common/constants/enums';
import { createEmptyMainSave } from '@/infrastructure/storage/models';
import { toSessionId, toStageId, toMonsterId, toMonsterMasterId, toPlayerId, toWorldId } from '@/types/ids';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import { _resetStageMasterCache } from '@/infrastructure/master/stageMasterRepository';
import { _resetNodePatternCache } from '@/infrastructure/master/nodePatternRepository';

// ---------------------------------------------------------------------------
// モック
// ---------------------------------------------------------------------------

const MOCK_STAGES = {
  items: [
    { stageId: 'stage_w1_1', worldId: 1, stageNo: 1, difficulty: 'Easy', recommendedLevel: 1, nodePatternId: 'pattern_w1_1', unlockStageId: 'stage_w1_2', baseExp: 30 },
  ],
};

const MOCK_PATTERNS = {
  items: [
    {
      patternId: 'pattern_w1_1',
      nodes: [
        { nodeIndex: 0, nodeType: 'NODE_PASS',   nextNodeIndex: 1 },
        { nodeIndex: 1, nodeType: 'NODE_EVENT',  eventId: 'evt_heal_001', nextNodeIndex: 2 },
        { nodeIndex: 2, nodeType: 'NODE_BATTLE', nextNodeIndex: 3 },
        { nodeIndex: 3, nodeType: 'NODE_PASS',   nextNodeIndex: 4 },
        { nodeIndex: 4, nodeType: 'NODE_GOAL' },
      ],
    },
  ],
};

function mockFetch(url: string): Promise<Response> {
  if ((url as string).includes('stages.json'))        return Promise.resolve(new Response(JSON.stringify(MOCK_STAGES)));
  if ((url as string).includes('node_patterns.json')) return Promise.resolve(new Response(JSON.stringify(MOCK_PATTERNS)));
  return Promise.resolve(new Response(JSON.stringify({ items: [] })));
}

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------

function resetAll(): SaveTransactionService {
  const db = new TabimonDatabase();
  _resetDatabaseForTest(db);
  _resetStageMasterCache();
  _resetNodePatternCache();
  return new SaveTransactionService();
}

function makeSession(nodeIndex: number): AdventureSession {
  return {
    sessionId:                 toSessionId('sess-1'),
    stageId:                   toStageId('stage_w1_1'),
    currentNodeIndex:          nodeIndex,
    partySnapshot: {
      main: {
        uniqueId: toMonsterId('mon-1'), monsterMasterId: toMonsterMasterId('MON_GRASS_001'),
        displayName: 'グリーニョ', personality: PersonalityType.Brave,
        stats: { maxHp: 100, atk: 15, def: 10, spd: 10 }, skills: [], isMain: true,
      },
      supporters: [],
    },
    battleCheckpointNodeIndex: -1,
    resultPendingFlag:         true,
    status:                    AdventureSessionStatus.Active,
    pendingResultType:         null,
    nextBattleBuffMultiplier:  1.0,
    randomEventBattle:         false,
  };
}

async function seedWithSession(session: AdventureSession): Promise<void> {
  const tx = resetAll();
  await tx.saveMultiple({
    ...createEmptyMainSave(),
    player: { playerId: toPlayerId('p-1'), playerName: 'T', worldId: toWorldId(WorldId.Forest), mainMonsterId: toMonsterId('mon-1') },
    adventureSession: session,
  });
}

// ---------------------------------------------------------------------------
// テスト
// ---------------------------------------------------------------------------

describe('ProceedAdventureNodeUseCase', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    resetAll();
  });

  it('PASS ノードで currentNodeIndex が +1 される', async () => {
    const session = makeSession(0); // index=0 は NODE_PASS
    await seedWithSession(session);

    const result = await new ProceedAdventureNodeUseCase().execute(session);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.updatedSession.currentNodeIndex).toBe(1);
  });

  it('進行後の currentNodeIndex が DB に保存される', async () => {
    const session = makeSession(0);
    await seedWithSession(session);

    await new ProceedAdventureNodeUseCase().execute(session);

    const loaded = await new SaveTransactionService().load();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value?.adventureSession?.currentNodeIndex).toBe(1);
  });

  it('PASS ノード→ EVENT ノードの nextNodeType が NODE_EVENT', async () => {
    const session = makeSession(0); // index=0 PASS → index=1 EVENT
    await seedWithSession(session);

    const result = await new ProceedAdventureNodeUseCase().execute(session);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.nextNodeType).toBe('NODE_EVENT');
  });

  it('PASS ではないノード（EVENT）では失敗する', async () => {
    const session = makeSession(1); // index=1 は NODE_EVENT
    await seedWithSession(session);

    const result = await new ProceedAdventureNodeUseCase().execute(session);
    expect(result.ok).toBe(false);
  });

  it('別インスタンスで再読込しても currentNodeIndex が維持される', async () => {
    const session = makeSession(3); // index=3 は NODE_PASS → 4
    await seedWithSession(session);

    await new ProceedAdventureNodeUseCase().execute(session);

    const tx = new SaveTransactionService();
    const loaded = await tx.load();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value?.adventureSession?.currentNodeIndex).toBe(4);
  });
});
