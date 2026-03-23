/**
 * ConfirmRetireAdventureUseCase 統合テスト。
 * §16 保存反映確認: リタイア後の status / resultPendingFlag が正しく保存されることを検証する。
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TabimonDatabase, _resetDatabaseForTest } from '@/infrastructure/persistence/db/tabimonDb';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { ConfirmRetireAdventureUseCase } from './confirmRetireAdventureUseCase';
import { AdventureSessionStatus, PersonalityType, WorldId } from '@/common/constants/enums';
import { createEmptyMainSave } from '@/infrastructure/storage/models';
import { toSessionId, toStageId, toMonsterId, toMonsterMasterId, toPlayerId, toWorldId } from '@/types/ids';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import { _resetStageMasterCache } from '@/infrastructure/master/stageMasterRepository';

function mockFetch(): Promise<Response> {
  return Promise.resolve(new Response(JSON.stringify({ items: [] })));
}

function resetAll(): SaveTransactionService {
  const db = new TabimonDatabase();
  _resetDatabaseForTest(db);
  _resetStageMasterCache();
  return new SaveTransactionService();
}

function makeSession(status: AdventureSessionStatus): AdventureSession {
  return {
    sessionId: toSessionId('sess-r'), stageId: toStageId('stage_w1_1'),
    currentNodeIndex: 2,
    partySnapshot: {
      main: {
        uniqueId: toMonsterId('mon-1'), monsterMasterId: toMonsterMasterId('MON_GRASS_001'),
        displayName: 'グリーニョ', personality: PersonalityType.Brave,
        stats: { maxHp: 100, atk: 15, def: 10, spd: 10 }, skills: [], isMain: true,
      },
      supporters: [],
    },
    battleCheckpointNodeIndex: -1, resultPendingFlag: true,
    status, pendingResultType: null, nextBattleBuffMultiplier: 1.0, randomEventBattle: false,
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

describe('ConfirmRetireAdventureUseCase', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    resetAll();
  });

  it('リタイア後の status が SESSION_PENDING_RESULT になる', async () => {
    const session = makeSession(AdventureSessionStatus.Active);
    await seedWithSession(session);

    const result = await new ConfirmRetireAdventureUseCase().execute(session);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe(AdventureSessionStatus.PendingResult);
  });

  it('リタイア後の resultPendingFlag = true が維持される', async () => {
    const session = makeSession(AdventureSessionStatus.Active);
    await seedWithSession(session);

    const result = await new ConfirmRetireAdventureUseCase().execute(session);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.resultPendingFlag).toBe(true);
  });

  it('DB に SESSION_PENDING_RESULT が保存される', async () => {
    const session = makeSession(AdventureSessionStatus.Active);
    await seedWithSession(session);

    await new ConfirmRetireAdventureUseCase().execute(session);

    const loaded = await new SaveTransactionService().load();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value?.adventureSession?.status).toBe(AdventureSessionStatus.PendingResult);
  });

  it('再読込で SESSION_PENDING_RESULT が維持される', async () => {
    const session = makeSession(AdventureSessionStatus.Active);
    await seedWithSession(session);

    await new ConfirmRetireAdventureUseCase().execute(session);

    const tx = new SaveTransactionService();
    const loaded = await tx.load();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value?.adventureSession?.status).toBe(AdventureSessionStatus.PendingResult);
    expect(loaded.value?.adventureSession?.resultPendingFlag).toBe(true);
  });

  it('currentNodeIndex はリタイア前の値が維持される', async () => {
    const session = makeSession(AdventureSessionStatus.Active);
    await seedWithSession(session);

    const result = await new ConfirmRetireAdventureUseCase().execute(session);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.currentNodeIndex).toBe(2);
  });
});
