/**
 * SelectAdventureBranchUseCase 統合テスト。
 * §16 保存反映確認: 分岐選択結果が正しく保存されることを検証する。
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TabimonDatabase, _resetDatabaseForTest } from '@/infrastructure/persistence/db/tabimonDb';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { SelectAdventureBranchUseCase } from './selectAdventureBranchUseCase';
import { AdventureSessionStatus, PersonalityType, WorldId } from '@/common/constants/enums';
import { createEmptyMainSave } from '@/infrastructure/storage/models';
import { toSessionId, toStageId, toMonsterId, toMonsterMasterId, toPlayerId, toWorldId } from '@/types/ids';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import { _resetStageMasterCache } from '@/infrastructure/master/stageMasterRepository';
import { _resetNodePatternCache } from '@/infrastructure/master/nodePatternRepository';

// ---------------------------------------------------------------------------
// モック（BRANCH ノードを持つパターン）
// ---------------------------------------------------------------------------

const MOCK_STAGES = {
  items: [
    { stageId: 'stage_w1_2', worldId: 1, stageNo: 2, difficulty: 'Normal', recommendedLevel: 8, nodePatternId: 'pattern_w1_2', unlockStageId: null, baseExp: 70 },
  ],
};

const MOCK_PATTERNS = {
  items: [
    {
      patternId: 'pattern_w1_2',
      nodes: [
        { nodeIndex: 0, nodeType: 'NODE_PASS',   nextNodeIndex: 1 },
        { nodeIndex: 1, nodeType: 'NODE_BATTLE', nextNodeIndex: 2 },
        { nodeIndex: 2, nodeType: 'NODE_EVENT',  eventId: 'evt_gather_001', nextNodeIndex: 3 },
        { nodeIndex: 3, nodeType: 'NODE_BRANCH', branchOptions: [
          { label: '安全な道', nextNodeIndex: 4 },
          { label: '険しい道', nextNodeIndex: 5 },
        ]},
        { nodeIndex: 4, nodeType: 'NODE_PASS',   nextNodeIndex: 6 },
        { nodeIndex: 5, nodeType: 'NODE_BATTLE', nextNodeIndex: 6 },
        { nodeIndex: 6, nodeType: 'NODE_BOSS' },
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
    sessionId: toSessionId('sess-2'), stageId: toStageId('stage_w1_2'),
    currentNodeIndex: nodeIndex,
    partySnapshot: {
      main: {
        uniqueId: toMonsterId('mon-1'), monsterMasterId: toMonsterMasterId('MON_GRASS_001'),
        displayName: 'グリーニョ', personality: PersonalityType.Brave,
        stats: { maxHp: 100, atk: 15, def: 10, spd: 10 }, skills: [], isMain: true, worldId: 0,
      },
      supporters: [],
    },
    battleCheckpointNodeIndex: -1, resultPendingFlag: true,
    status: AdventureSessionStatus.Active, pendingResultType: null,
    nextBattleBuffMultiplier: 1.0, randomEventBattle: false,
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

describe('SelectAdventureBranchUseCase', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    resetAll();
  });

  it('分岐選択A（index=4）で currentNodeIndex が 4 になる', async () => {
    const session = makeSession(3);
    await seedWithSession(session);

    const result = await new SelectAdventureBranchUseCase().execute({
      session, selectedNextNodeIndex: 4,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.currentNodeIndex).toBe(4);
  });

  it('分岐選択B（index=5）で currentNodeIndex が 5 になる', async () => {
    const session = makeSession(3);
    await seedWithSession(session);

    const result = await new SelectAdventureBranchUseCase().execute({
      session, selectedNextNodeIndex: 5,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.currentNodeIndex).toBe(5);
  });

  it('分岐選択結果が DB に保存される', async () => {
    const session = makeSession(3);
    await seedWithSession(session);

    await new SelectAdventureBranchUseCase().execute({ session, selectedNextNodeIndex: 4 });

    const loaded = await new SaveTransactionService().load();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value?.adventureSession?.currentNodeIndex).toBe(4);
  });

  it('無効な分岐先（存在しない index）は失敗する', async () => {
    const session = makeSession(3);
    await seedWithSession(session);

    const result = await new SelectAdventureBranchUseCase().execute({
      session, selectedNextNodeIndex: 99,
    });
    expect(result.ok).toBe(false);
  });

  it('BRANCH ではないノードで呼ぶと失敗する', async () => {
    const session = makeSession(0); // NODE_PASS
    await seedWithSession(session);

    const result = await new SelectAdventureBranchUseCase().execute({
      session, selectedNextNodeIndex: 1,
    });
    expect(result.ok).toBe(false);
  });
});
