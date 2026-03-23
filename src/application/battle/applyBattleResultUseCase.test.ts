/**
 * ApplyBattleResultUseCase 統合テスト。
 * 詳細設計 v4 §7, §10.3, §10.4 戦闘結果反映の検証。
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TabimonDatabase, _resetDatabaseForTest } from '@/infrastructure/persistence/db/tabimonDb';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { ApplyBattleResultUseCase } from './applyBattleResultUseCase';
import { AdventureSessionStatus, PersonalityType, WorldId } from '@/common/constants/enums';
import { createEmptyMainSave } from '@/infrastructure/storage/models';
import {
  toSessionId, toStageId, toMonsterId, toMonsterMasterId,
  toPlayerId, toWorldId,
} from '@/types/ids';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import type { BattleState } from '@/domain/battle/BattleState';
import { _resetStageMasterCache } from '@/infrastructure/master/stageMasterRepository';
import { _resetNodePatternCache } from '@/infrastructure/master/nodePatternRepository';

// ---------------------------------------------------------------------------
// モック
// ---------------------------------------------------------------------------

const MOCK_STAGES = {
  items: [
    {
      stageId: 'stage_w1_1', worldId: 1, stageNo: 1, difficulty: 'Easy',
      recommendedLevel: 1, nodePatternId: 'pattern_w1_1',
      enemyGroupPoolId: 'pool_w1_easy', bossEnemyGroupId: 'boss_w1_1',
      unlockStageId: 'stage_w1_2', baseExp: 30,
    },
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
        { nodeIndex: 4, nodeType: 'NODE_BOSS' },
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
        uniqueId:        toMonsterId('mon-1'),
        monsterMasterId: toMonsterMasterId('MON_GRASS_001'),
        displayName:     'グリーニョ',
        personality:     PersonalityType.Brave,
        stats:           { maxHp: 100, atk: 15, def: 10, spd: 10 },
        skills:          [],
        isMain:          true,
      },
      supporters: [],
    },
    battleCheckpointNodeIndex: nodeIndex,  // 戦闘前に設定済み
    resultPendingFlag:         false,
    status:                    AdventureSessionStatus.ActiveBattle,
    pendingResultType:         null,
    nextBattleBuffMultiplier:  1.0,
    randomEventBattle:         false,
  };
}

function makeBattleState(outcome: 'WIN' | 'LOSE'): BattleState {
  return {
    sessionId: 'sess-1',
    stageId:   'stage_w1_1',
    isBoss:    false,
    actors:    [],
    log:       [],
    outcome,
    tickCount: 10,
    pendingMainSkillId: null,
  };
}

async function seedWithSession(session: AdventureSession): Promise<void> {
  const tx = resetAll();
  await tx.saveMultiple({
    ...createEmptyMainSave(),
    player: {
      playerId: toPlayerId('p-1'), playerName: 'T',
      worldId: toWorldId(WorldId.Forest), mainMonsterId: toMonsterId('mon-1'),
    },
    adventureSession: session,
  });
}

// ---------------------------------------------------------------------------
// テスト
// ---------------------------------------------------------------------------

describe('ApplyBattleResultUseCase', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    resetAll();
  });

  it('WIN + BATTLE ノード: currentNodeIndex が次ノードへ進み status=SESSION_ACTIVE になる', async () => {
    const session = makeSession(2); // index=2 は NODE_BATTLE (nextNodeIndex=3)
    await seedWithSession(session);

    const result = await new ApplyBattleResultUseCase().execute(session, makeBattleState('WIN'));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.updatedSession.currentNodeIndex).toBe(3);
    expect(result.value.updatedSession.status).toBe(AdventureSessionStatus.Active);
    expect(result.value.updatedSession.battleCheckpointNodeIndex).toBe(-1);
    expect(result.value.transition).toBe('CONTINUE_EXPLORE');
  });

  it('WIN + BOSS ノード: status=SESSION_PENDING_RESULT, resultPendingFlag=true になる', async () => {
    const session = makeSession(4); // index=4 は NODE_BOSS
    await seedWithSession(session);

    const bossState: BattleState = { ...makeBattleState('WIN'), isBoss: true };
    const result = await new ApplyBattleResultUseCase().execute(session, bossState);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.updatedSession.status).toBe(AdventureSessionStatus.PendingResult);
    expect(result.value.updatedSession.resultPendingFlag).toBe(true);
    expect(result.value.updatedSession.battleCheckpointNodeIndex).toBe(-1);
    expect(result.value.transition).toBe('PENDING_RESULT');
  });

  it('LOSE: status=SESSION_PENDING_RESULT, resultPendingFlag=true になる', async () => {
    const session = makeSession(2);
    await seedWithSession(session);

    const result = await new ApplyBattleResultUseCase().execute(session, makeBattleState('LOSE'));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.updatedSession.status).toBe(AdventureSessionStatus.PendingResult);
    expect(result.value.updatedSession.resultPendingFlag).toBe(true);
    expect(result.value.updatedSession.battleCheckpointNodeIndex).toBe(-1);
    expect(result.value.transition).toBe('PENDING_RESULT');
  });

  it('WIN 後の更新が DB に保存される', async () => {
    const session = makeSession(2);
    await seedWithSession(session);

    await new ApplyBattleResultUseCase().execute(session, makeBattleState('WIN'));

    const loaded = await new SaveTransactionService().load();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value?.adventureSession?.currentNodeIndex).toBe(3);
    expect(loaded.value?.adventureSession?.battleCheckpointNodeIndex).toBe(-1);
  });

  it('outcome=NONE のまま呼ぶと fail になる', async () => {
    const session = makeSession(2);
    await seedWithSession(session);

    const noneState: BattleState = { ...makeBattleState('WIN'), outcome: 'NONE' };
    const result = await new ApplyBattleResultUseCase().execute(session, noneState);

    expect(result.ok).toBe(false);
  });
});
