/**
 * SaveTransactionService テスト。
 *
 * 検証観点:
 *   - temp → validate → main → temp削除 の順序
 *   - 検証失敗時に main が汚染されないこと
 *   - load が main を返すこと
 *   - hasPendingTemp / clearTemp の動作
 *   - promoteTempToMain の動作
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { TabimonDatabase, _resetDatabaseForTest, SAVE_KEY_MAIN, SAVE_KEY_TEMP } from '../db/tabimonDb';
import { SaveTransactionService } from './saveTransactionService';
import { SaveStateType, WorldId, RoleType, PersonalityType } from '@/common/constants/enums';
import { SaveErrorCode } from '@/common/errors/AppErrorCode';
import type { MainSaveSnapshot } from '@/infrastructure/storage/models';
import { createEmptyMainSave } from '@/infrastructure/storage/models';
import { toPlayerId, toWorldId, toMonsterId, toMonsterMasterId, toSkillId } from '@/types/ids';

// ---------------------------------------------------------------------------
// テスト用ヘルパー
// ---------------------------------------------------------------------------

/** テスト用に毎回新しい DB インスタンスを生成する */
function createFreshDb(): TabimonDatabase {
  const db = new TabimonDatabase();
  _resetDatabaseForTest(db);
  return db;
}

/** 最小限有効な MainSaveSnapshot */
function validSave(): MainSaveSnapshot {
  return createEmptyMainSave();
}

/** player を持つ有効な MainSaveSnapshot */
function saveWithPlayer(): MainSaveSnapshot {
  return {
    ...createEmptyMainSave(),
    player: {
      playerId:      toPlayerId('player-1'),
      playerName:    'テストプレイヤー',
      worldId:       toWorldId('WORLD_FOREST'),
      mainMonsterId: null,
    },
  };
}

// ---------------------------------------------------------------------------
// テスト
// ---------------------------------------------------------------------------

describe('SaveTransactionService', () => {
  let svc: SaveTransactionService;

  beforeEach(async () => {
    // 毎テストで新しいインメモリDBを使う
    createFreshDb();
    svc = new SaveTransactionService();
  });

  // -------------------------------------------------------------------------
  // 初期状態
  // -------------------------------------------------------------------------

  it('初期状態は Stable', () => {
    expect(svc.currentState).toBe(SaveStateType.Stable);
  });

  // -------------------------------------------------------------------------
  // load (初回 = null)
  // -------------------------------------------------------------------------

  it('初回 load は ok(null) を返す', async () => {
    const result = await svc.load();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeNull();
  });

  // -------------------------------------------------------------------------
  // saveMultiple → load の基本フロー
  // -------------------------------------------------------------------------

  it('saveMultiple 後に load で保存内容が取得できる', async () => {
    const saveResult = await svc.saveMultiple(saveWithPlayer());
    expect(saveResult.ok).toBe(true);

    const loadResult = await svc.load();
    expect(loadResult.ok).toBe(true);
    if (loadResult.ok) {
      expect(loadResult.value?.player?.playerName).toBe('テストプレイヤー');
    }
  });

  it('saveMultiple 完了後 temp_save が残っていないこと', async () => {
    await svc.saveMultiple(saveWithPlayer());
    const hasPending = await svc.hasPendingTemp();
    expect(hasPending).toBe(false);
  });

  it('saveMultiple 後の状態は Stable', async () => {
    await svc.saveMultiple(saveWithPlayer());
    expect(svc.currentState).toBe(SaveStateType.Stable);
  });

  // -------------------------------------------------------------------------
  // 部分更新のマージ
  // -------------------------------------------------------------------------

  it('部分スナップショットは既存の main とマージされる', async () => {
    // まず player を保存
    await svc.saveMultiple(saveWithPlayer());

    // settings だけ更新
    const saveResult = await svc.saveMultiple({
      settings: { bgmVolume: 0.5, sfxVolume: 0.3 },
    });
    expect(saveResult.ok).toBe(true);

    const loadResult = await svc.load();
    expect(loadResult.ok).toBe(true);
    if (loadResult.ok) {
      // player は残っているはず
      expect(loadResult.value?.player?.playerName).toBe('テストプレイヤー');
      // settings は更新されているはず
      expect(loadResult.value?.settings?.bgmVolume).toBe(0.5);
    }
  });

  // -------------------------------------------------------------------------
  // 検証失敗時に main が汚染されないこと
  // -------------------------------------------------------------------------

  it('検証失敗時に main_save が汚染されない', async () => {
    // まず正常な状態を保存
    await svc.saveMultiple(saveWithPlayer());

    const beforeLoad = await svc.load();
    expect(beforeLoad.ok).toBe(true);

    // 仲間上限を超えるデータを保存しようとする（ownedMonsters > 5）
    const tooManyMonsters = Array.from({ length: 6 }, (_, i) => ({
      uniqueId:        toMonsterId(`monster-${i}`),
      monsterMasterId: toMonsterMasterId('MON_001'),
      displayName:     `モンスター${i}`,
      worldId:         WorldId.Forest,
      role:            RoleType.Attack,
      level:           1,
      exp:             0,
      personality:     PersonalityType.Brave,
      skillIds:        [] as ReturnType<typeof toSkillId>[],
      isMain:          false,
    }));

    const saveResult = await svc.saveMultiple({ ownedMonsters: tooManyMonsters });
    expect(saveResult.ok).toBe(false);
    if (!saveResult.ok) {
      expect(saveResult.errorCode).toBe(SaveErrorCode.ValidationFailed);
    }

    // main_save は汚染されていない
    const afterLoad = await svc.load();
    expect(afterLoad.ok).toBe(true);
    if (afterLoad.ok) {
      expect(afterLoad.value?.player?.playerName).toBe('テストプレイヤー');
      expect(afterLoad.value?.ownedMonsters.length).toBe(0);
    }
  });

  // -------------------------------------------------------------------------
  // hasPendingTemp / clearTemp
  // -------------------------------------------------------------------------

  it('初回 hasPendingTemp は false', async () => {
    const result = await svc.hasPendingTemp();
    expect(result).toBe(false);
  });

  it('clearTemp は temp_save を削除する', async () => {
    // 手動で temp_save を作成
    const db = new TabimonDatabase();
    _resetDatabaseForTest(db);
    await db.saves.put({
      id:        SAVE_KEY_TEMP,
      payload:   JSON.stringify(validSave()),
      updatedAt: new Date().toISOString(),
    });
    svc = new SaveTransactionService();

    expect(await svc.hasPendingTemp()).toBe(true);
    await svc.clearTemp();
    expect(await svc.hasPendingTemp()).toBe(false);
  });

  // -------------------------------------------------------------------------
  // loadAndValidateTemp
  // -------------------------------------------------------------------------

  it('temp_save がない場合 loadAndValidateTemp は ok(null)', async () => {
    const result = await svc.loadAndValidateTemp();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeNull();
  });

  it('有効な temp_save がある場合 loadAndValidateTemp はスナップショットを返す', async () => {
    const db = new TabimonDatabase();
    _resetDatabaseForTest(db);
    const snap = saveWithPlayer();
    await db.saves.put({
      id:        SAVE_KEY_TEMP,
      payload:   JSON.stringify(snap),
      updatedAt: new Date().toISOString(),
    });
    svc = new SaveTransactionService();

    const result = await svc.loadAndValidateTemp();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value?.player?.playerName).toBe('テストプレイヤー');
    }
  });

  it('破損した temp_save がある場合 loadAndValidateTemp は fail', async () => {
    const db = new TabimonDatabase();
    _resetDatabaseForTest(db);
    // 仲間数上限超えの破損データ
    const corrupt: MainSaveSnapshot = {
      ...createEmptyMainSave(),
      ownedMonsters: Array.from({ length: 6 }, (_, i) => ({
        uniqueId:        toMonsterId(`m${i}`),
        monsterMasterId: toMonsterMasterId('MON_001'),
        displayName:     `M${i}`,
        worldId:         WorldId.Forest,
        role:            RoleType.Attack,
        level:           1,
        exp:             0,
        personality:     PersonalityType.Brave,
        skillIds:        [] as ReturnType<typeof toSkillId>[],
        isMain:          false,
      })),
    };
    await db.saves.put({
      id:        SAVE_KEY_TEMP,
      payload:   JSON.stringify(corrupt),
      updatedAt: new Date().toISOString(),
    });
    svc = new SaveTransactionService();

    const result = await svc.loadAndValidateTemp();
    expect(result.ok).toBe(false);
  });

  // -------------------------------------------------------------------------
  // promoteTempToMain
  // -------------------------------------------------------------------------

  it('promoteTempToMain は temp を main へ昇格し temp を削除する', async () => {
    const db = new TabimonDatabase();
    _resetDatabaseForTest(db);
    const snap = saveWithPlayer();
    await db.saves.put({
      id:        SAVE_KEY_TEMP,
      payload:   JSON.stringify(snap),
      updatedAt: new Date().toISOString(),
    });
    svc = new SaveTransactionService();

    const promoteResult = await svc.promoteTempToMain();
    expect(promoteResult.ok).toBe(true);

    // main に反映されている
    const loadResult = await svc.load();
    expect(loadResult.ok).toBe(true);
    if (loadResult.ok) {
      expect(loadResult.value?.player?.playerName).toBe('テストプレイヤー');
    }

    // temp が削除されている
    expect(await svc.hasPendingTemp()).toBe(false);
  });

  it('temp_save がない場合 promoteTempToMain は fail', async () => {
    const result = await svc.promoteTempToMain();
    expect(result.ok).toBe(false);
  });
});
