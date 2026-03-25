/**
 * ReleaseOwnedMonsterUseCase ユニットテスト。
 * fake-indexeddb を使用して DB 込みで検証する。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { TabimonDatabase, _resetDatabaseForTest } from '@/infrastructure/persistence/db/tabimonDb';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { ReleaseOwnedMonsterUseCase, ReleaseErrorCode } from './releaseOwnedMonsterUseCase';
import { RoleType, PersonalityType, WorldId } from '@/common/constants/enums';
import { createEmptyMainSave } from '@/infrastructure/storage/models';
import { toPlayerId, toWorldId, toMonsterId, toMonsterMasterId } from '@/types/ids';
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';

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
    uniqueId:        toMonsterId(id),
    monsterMasterId: toMonsterMasterId('MON_GRASS_001'),
    displayName:     `モンスター_${id}`,
    worldId:         WorldId.Forest,
    role:            RoleType.Attack,
    level:           5,
    exp:             100,
    personality:     PersonalityType.Brave,
    skillIds:        [],
    isMain,
  };
}

async function seedSave(monsters: OwnedMonster[]): Promise<void> {
  const tx = resetDb();
  await tx.saveMultiple({
    ...createEmptyMainSave(),
    player: {
      playerId:      toPlayerId('player-1'),
      playerName:    'テスター',
      worldId:       toWorldId(WorldId.Forest),
      mainMonsterId: monsters.find((m) => m.isMain)?.uniqueId ?? null,
    },
    ownedMonsters: monsters,
  });
}

// ---------------------------------------------------------------------------
// テスト
// ---------------------------------------------------------------------------

describe('ReleaseOwnedMonsterUseCase', () => {
  beforeEach(() => {
    const db = new TabimonDatabase();
    _resetDatabaseForTest(db);
  });

  it('非相棒モンスターを手放せる', async () => {
    await seedSave([
      makeMonster('mon-1', true),
      makeMonster('mon-2', false),
    ]);

    const result = await new ReleaseOwnedMonsterUseCase().execute('mon-2');
    expect(result.ok).toBe(true);

    const tx = new SaveTransactionService();
    const loaded = await tx.load();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const ids = (loaded.value?.ownedMonsters ?? []).map((m) => m.uniqueId);
    expect(ids).not.toContain('mon-2');
    expect(ids).toContain('mon-1');
  });

  it('相棒モンスターは手放せない（IsMain エラー）', async () => {
    await seedSave([makeMonster('mon-1', true)]);

    const result = await new ReleaseOwnedMonsterUseCase().execute('mon-1');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe(ReleaseErrorCode.IsMain);
  });

  it('存在しない仲間IDは NotFound エラー', async () => {
    await seedSave([makeMonster('mon-1', true)]);

    const result = await new ReleaseOwnedMonsterUseCase().execute('mon-999');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe(ReleaseErrorCode.NotFound);
  });

  it('空IDは InvalidInput エラー', async () => {
    await seedSave([makeMonster('mon-1', true)]);

    const result = await new ReleaseOwnedMonsterUseCase().execute('');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe(ReleaseErrorCode.InvalidInput);
  });

  it('手放し後に他モンスターは変わらない', async () => {
    await seedSave([
      makeMonster('mon-1', true),
      makeMonster('mon-2', false),
      makeMonster('mon-3', false),
    ]);

    await new ReleaseOwnedMonsterUseCase().execute('mon-2');

    const tx = new SaveTransactionService();
    const loaded = await tx.load();
    if (!loaded.ok) return;

    const ids = (loaded.value?.ownedMonsters ?? []).map((m) => m.uniqueId);
    expect(ids).toEqual(['mon-1', 'mon-3']);
  });
});
