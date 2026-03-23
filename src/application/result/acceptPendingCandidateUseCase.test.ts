/**
 * AcceptPendingCandidateUseCase 統合テスト。
 * 詳細設計 v4 §8.8 候補受取の検証。
 *
 * 重要: OwnedCapacityFull 時は入替導線（QR上限の単純拒否とは異なる）。
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TabimonDatabase, _resetDatabaseForTest } from '@/infrastructure/persistence/db/tabimonDb';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { AcceptPendingCandidateUseCase } from './acceptPendingCandidateUseCase';
import {
  PersonalityType, WorldId,
} from '@/common/constants/enums';
import { MonsterErrorCode, AdventureErrorCode } from '@/common/errors/AppErrorCode';
import { createEmptyMainSave } from '@/infrastructure/storage/models';
import {
  toSessionId, toStageId, toMonsterId, toMonsterMasterId,
  toPlayerId, toWorldId, toCandidateId,
} from '@/types/ids';
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';
import type { PendingCandidate } from '@/domain/entities/PendingCandidate';
import { _resetMonsterMasterCache } from '@/infrastructure/master/monsterMasterRepository';

// ---------------------------------------------------------------------------
// モック
// ---------------------------------------------------------------------------

const MOCK_MONSTERS = {
  items: [
    {
      monsterId: 'MON_GRASS_001', displayName: 'グリーニョ',
      worldId: 1, role: 1, maxHp: 80, atk: 12, def: 8, spd: 10,
      initialSkillId: 'SKILL_BITE_001', dropRate: 0.3,
    },
    {
      monsterId: 'MON_FIRE_001', displayName: 'フレアーリ',
      worldId: 2, role: 1, maxHp: 75, atk: 15, def: 6, spd: 12,
      initialSkillId: 'SKILL_FIRE_001', dropRate: 0.2,
    },
  ],
};

function mockFetch(url: string): Promise<Response> {
  if ((url as string).includes('monsters.json')) return Promise.resolve(new Response(JSON.stringify(MOCK_MONSTERS)));
  return Promise.resolve(new Response(JSON.stringify({ items: [] })));
}

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------

function resetAll(): SaveTransactionService {
  const db = new TabimonDatabase();
  _resetDatabaseForTest(db);
  _resetMonsterMasterCache();
  return new SaveTransactionService();
}

function makeOwnedMonster(id: string, overrides: Partial<OwnedMonster> = {}): OwnedMonster {
  return {
    uniqueId:        toMonsterId(id),
    monsterMasterId: toMonsterMasterId('MON_GRASS_001'),
    displayName:     `モンスター${id}`,
    worldId:         WorldId.Forest,
    role:            'ATTACK' as OwnedMonster['role'],
    level:           1,
    exp:             0,
    personality:     PersonalityType.Brave,
    skillIds:        [],
    isMain:          false,
    ...overrides,
  };
}

function makeCandidate(overrides: Partial<PendingCandidate> = {}): PendingCandidate {
  return {
    candidateId:                        toCandidateId('cand-1'),
    monsterMasterId:                    toMonsterMasterId('MON_FIRE_001'),
    sourceUniqueMonsterIdFromCandidate: toMonsterId('new-mon-1'),
    personalityId:                      PersonalityType.Calm,
    originSessionId:                    toSessionId('sess-1'),
    ...overrides,
  };
}

async function seedSave(
  ownedMonsters: OwnedMonster[],
  pendingCandidate: PendingCandidate | null,
): Promise<void> {
  const tx = resetAll();
  await tx.saveMultiple({
    ...createEmptyMainSave(),
    player: {
      playerId:      toPlayerId('p-1'),
      playerName:    'Tester',
      worldId:       toWorldId(WorldId.Forest),
      mainMonsterId: ownedMonsters[0]?.uniqueId ?? toMonsterId('mon-main'),
    },
    ownedMonsters,
    pendingCandidate,
    adventureSession: {
      sessionId:                 toSessionId('sess-1'),
      stageId:                   toStageId('stage_w1_1'),
      currentNodeIndex:          4,
      partySnapshot:             { main: { uniqueId: toMonsterId('mon-1'), monsterMasterId: toMonsterMasterId('MON_GRASS_001'), displayName: 'グリーニョ', personality: PersonalityType.Brave, stats: { maxHp: 100, atk: 15, def: 10, spd: 10 }, skills: [], isMain: true }, supporters: [] },
      battleCheckpointNodeIndex: -1,
      resultPendingFlag:         false,
      status:                    'SESSION_COMPLETED' as AdventureSession['status'],
      pendingResultType:         null,
    },
  });
}

// ---------------------------------------------------------------------------
// テスト
// ---------------------------------------------------------------------------

import type { AdventureSession } from '@/domain/entities/AdventureSession';

describe('AcceptPendingCandidateUseCase', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    resetAll();
  });

  it('通常受取: 候補が仲間リストに追加され pendingCandidate=null, adventureSession=null になる', async () => {
    const main = makeOwnedMonster('mon-main', { isMain: true });
    const candidate = makeCandidate();
    await seedSave([main], candidate);

    const result = await new AcceptPendingCandidateUseCase().execute();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.addedMonster.monsterMasterId).toBe(candidate.monsterMasterId);
    expect(result.value.addedMonster.displayName).toBe('フレアーリ');
    expect(result.value.addedMonster.level).toBe(1);
    expect(result.value.addedMonster.exp).toBe(0);
    expect(result.value.addedMonster.isMain).toBe(false);

    // DB確認
    const loaded = await new SaveTransactionService().load();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value?.ownedMonsters).toHaveLength(2);
    expect(loaded.value?.pendingCandidate).toBeNull();
    expect(loaded.value?.adventureSession).toBeNull();
  });

  it('仲間が4体（上限未満）でも受取可能', async () => {
    const mons = [
      makeOwnedMonster('mon-main', { isMain: true }),
      makeOwnedMonster('mon-2'),
      makeOwnedMonster('mon-3'),
      makeOwnedMonster('mon-4'),
    ];
    const candidate = makeCandidate();
    await seedSave(mons, candidate);

    const result = await new AcceptPendingCandidateUseCase().execute();

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const loaded = await new SaveTransactionService().load();
    if (!loaded.ok) return;
    expect(loaded.value?.ownedMonsters).toHaveLength(5);
  });

  it('仲間5体（上限）だと OwnedCapacityFull エラーになる（入替導線へ誘導）', async () => {
    const mons = [
      makeOwnedMonster('mon-main', { isMain: true }),
      makeOwnedMonster('mon-2'),
      makeOwnedMonster('mon-3'),
      makeOwnedMonster('mon-4'),
      makeOwnedMonster('mon-5'),
    ];
    const candidate = makeCandidate();
    await seedSave(mons, candidate);

    const result = await new AcceptPendingCandidateUseCase().execute();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorCode).toBe(MonsterErrorCode.OwnedCapacityFull);
    // DB は変更されない
    const loaded = await new SaveTransactionService().load();
    if (!loaded.ok) return;
    expect(loaded.value?.ownedMonsters).toHaveLength(5);
    expect(loaded.value?.pendingCandidate).not.toBeNull();
  });

  it('pendingCandidate が存在しない場合は SessionNotFound エラー', async () => {
    const main = makeOwnedMonster('mon-main', { isMain: true });
    await seedSave([main], null);

    const result = await new AcceptPendingCandidateUseCase().execute();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorCode).toBe(AdventureErrorCode.SessionNotFound);
  });
});
