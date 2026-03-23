/**
 * ChangeMainMonsterUseCase ユニットテスト。
 * fake-indexeddb を使用して DB 込みで検証する。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { TabimonDatabase, _resetDatabaseForTest } from '@/infrastructure/persistence/db/tabimonDb';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { ChangeMainMonsterUseCase } from './changeMainMonsterUseCase';
import { GeneralErrorCode, MonsterErrorCode } from '@/common/errors/AppErrorCode';
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

async function seedSave(monsters: OwnedMonster[]): Promise<SaveTransactionService> {
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
  return tx;
}

// ---------------------------------------------------------------------------
// テスト
// ---------------------------------------------------------------------------

describe('ChangeMainMonsterUseCase', () => {
  beforeEach(() => {
    const db = new TabimonDatabase();
    _resetDatabaseForTest(db);
  });

  it('非主役モンスターを主役に設定できる', async () => {
    await seedSave([
      makeMonster('mon-1', true),
      makeMonster('mon-2', false),
    ]);

    const result = await new ChangeMainMonsterUseCase().execute('mon-2');
    expect(result.ok).toBe(true);

    const tx = new SaveTransactionService();
    const loaded = await tx.load();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const monsters = loaded.value?.ownedMonsters ?? [];
    expect(monsters.find((m) => m.uniqueId === 'mon-2')?.isMain).toBe(true);
    expect(monsters.find((m) => m.uniqueId === 'mon-1')?.isMain).toBe(false);
    expect(loaded.value?.player?.mainMonsterId).toBe('mon-2');
  });

  it('空IDは InvalidInput エラー', async () => {
    await seedSave([makeMonster('mon-1', true)]);

    const result = await new ChangeMainMonsterUseCase().execute('');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe(GeneralErrorCode.InvalidInput);
  });

  it('存在しない仲間IDは NotFound エラー', async () => {
    await seedSave([makeMonster('mon-1', true)]);

    const result = await new ChangeMainMonsterUseCase().execute('mon-999');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe(MonsterErrorCode.NotFound);
  });

  it('すでに主役のモンスターを再度設定してもエラーにならない', async () => {
    await seedSave([makeMonster('mon-1', true)]);

    const result = await new ChangeMainMonsterUseCase().execute('mon-1');
    expect(result.ok).toBe(true);

    const tx = new SaveTransactionService();
    const loaded = await tx.load();
    if (!loaded.ok) return;
    expect(loaded.value?.player?.mainMonsterId).toBe('mon-1');
  });
});
