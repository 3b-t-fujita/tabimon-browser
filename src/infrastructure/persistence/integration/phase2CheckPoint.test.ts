/**
 * フェーズ2 節目確認テスト。
 * フェーズ3着手前に保存基盤の正常動作を確認する。
 *
 * 確認項目:
 *   1. 初期データ保存 → 再読込
 *   2. AdventureSession 保存 → 再読込
 *   3. 保存失敗時に main が壊れないこと
 *   4. 復旧不能セッション無効化
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { TabimonDatabase, _resetDatabaseForTest } from '../db/tabimonDb';
import { SaveTransactionService } from '../transaction/saveTransactionService';
import { RecoveryExecutionService, RecoveryNextHint } from '../recovery/recoveryExecutionService';
import { SessionRecoveryAction } from '../recovery/recoveryJudge';
import { AdventureSessionStatus, WorldId, RoleType, PersonalityType } from '@/common/constants/enums';
import { createEmptyMainSave } from '@/infrastructure/storage/models';
import type { MainSaveSnapshot } from '@/infrastructure/storage/models';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import {
  toPlayerId, toWorldId, toMonsterId, toMonsterMasterId,
  toSessionId, toStageId, toSkillId,
} from '@/types/ids';
import type { PartySnapshot } from '@/domain/valueObjects/PartySnapshot';

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------

function makeTx(): SaveTransactionService {
  const db = new TabimonDatabase();
  _resetDatabaseForTest(db);
  return new SaveTransactionService();
}

function makeParty(): PartySnapshot {
  return {
    main: {
      uniqueId:        toMonsterId('mon-1'),
      monsterMasterId: toMonsterMasterId('MON_GRASS_001'),
      displayName:     'グリーニョ',
      personality:     PersonalityType.Brave,
      stats:           { maxHp: 120, atk: 15, def: 8, spd: 10 },
      skills:          [],
      isMain:          true,
      worldId:         1,
    },
    supporters: [],
  };
}

function makeActiveSession(status: AdventureSession['status'], checkpoint = -1): AdventureSession {
  return {
    sessionId:                 toSessionId('sess-abc'),
    stageId:                   toStageId('STAGE_FOREST_01'),
    currentNodeIndex:          5,
    partySnapshot:             makeParty(),
    battleCheckpointNodeIndex: checkpoint,
    resultPendingFlag:         false,
    status,
    pendingResultType:         null,
    nextBattleBuffMultiplier:  1.0,
    randomEventBattle:         false,
  };
}

// ---------------------------------------------------------------------------
// 確認1: 初期データ保存 → 再読込
// ---------------------------------------------------------------------------

describe('確認1: 初期データ保存 → 再読込', () => {
  let tx: SaveTransactionService;

  beforeEach(() => { tx = makeTx(); });

  it('新規プレイヤー情報を保存し、再読込で同じ内容が返る', async () => {
    const snap: MainSaveSnapshot = {
      ...createEmptyMainSave(),
      player: {
        playerId:      toPlayerId('player-uuid-001'),
        playerName:    'テストたろう',
        worldId:       toWorldId('WORLD_FOREST'),
        mainMonsterId: null,
      },
      settings: { bgmVolume: 0.8, sfxVolume: 0.6 },
      progress: { unlockedStageIds: ['STAGE_FOREST_01'], clearedStageIds: [] },
    };

    const saveResult = await tx.saveMultiple(snap);
    expect(saveResult.ok, '保存が成功すること').toBe(true);

    const loadResult = await tx.load();
    expect(loadResult.ok, '読込が成功すること').toBe(true);
    if (!loadResult.ok) return;

    expect(loadResult.value?.player?.playerName, 'playerName が一致').toBe('テストたろう');
    expect(loadResult.value?.player?.playerId, 'playerId が一致').toBe('player-uuid-001');
    expect(loadResult.value?.settings?.bgmVolume, 'bgmVolume が一致').toBe(0.8);
    expect(loadResult.value?.progress?.unlockedStageIds, 'unlockedStageIds が一致')
      .toEqual(['STAGE_FOREST_01']);
  });

  it('複数回の部分更新がマージされる', async () => {
    await tx.saveMultiple({
      player: {
        playerId:      toPlayerId('p-1'),
        playerName:    '花子',
        worldId:       toWorldId('WORLD_VOLCANO'),
        mainMonsterId: null,
      },
    });
    await tx.saveMultiple({
      settings: { bgmVolume: 0.5, sfxVolume: 1.0 },
    });

    const loadResult = await tx.load();
    expect(loadResult.ok).toBe(true);
    if (!loadResult.ok) return;
    // player は最初の保存が残っている
    expect(loadResult.value?.player?.playerName).toBe('花子');
    // settings は2回目の更新が反映されている
    expect(loadResult.value?.settings?.bgmVolume).toBe(0.5);
  });
});

// ---------------------------------------------------------------------------
// 確認2: AdventureSession 保存 → 再読込
// ---------------------------------------------------------------------------

describe('確認2: AdventureSession 保存 → 再読込', () => {
  let tx: SaveTransactionService;

  beforeEach(() => { tx = makeTx(); });

  it('SESSION_ACTIVE セッションが保存・再読込できる', async () => {
    const session = makeActiveSession(AdventureSessionStatus.Active);
    const saveResult = await tx.saveMultiple({ adventureSession: session });
    expect(saveResult.ok, '保存成功').toBe(true);

    const loadResult = await tx.load();
    expect(loadResult.ok, '読込成功').toBe(true);
    if (!loadResult.ok) return;

    const loaded = loadResult.value?.adventureSession;
    expect(loaded, 'adventureSession が存在する').not.toBeNull();
    expect(loaded?.sessionId, 'sessionId が一致').toBe('sess-abc');
    expect(loaded?.stageId, 'stageId が一致').toBe('STAGE_FOREST_01');
    expect(loaded?.currentNodeIndex, 'currentNodeIndex が一致').toBe(5);
    expect(loaded?.status, 'status が一致').toBe(AdventureSessionStatus.Active);
    expect(loaded?.partySnapshot.main.displayName, 'partySnapshot.main が一致').toBe('グリーニョ');
  });

  it('battleCheckpointNodeIndex が正しく保存・再読込できる', async () => {
    const session = makeActiveSession(AdventureSessionStatus.ActiveBattle, 3);
    await tx.saveMultiple({ adventureSession: session });

    const loadResult = await tx.load();
    if (!loadResult.ok) return;
    expect(loadResult.value?.adventureSession?.battleCheckpointNodeIndex, 'battleCheckpoint が一致').toBe(3);
    expect(loadResult.value?.adventureSession?.status, 'status が一致').toBe(AdventureSessionStatus.ActiveBattle);
  });

  it('resultPendingFlag=true が正しく保存・再読込できる', async () => {
    const session: AdventureSession = {
      ...makeActiveSession(AdventureSessionStatus.PendingResult),
      resultPendingFlag: true,
    };
    await tx.saveMultiple({ adventureSession: session });

    const loadResult = await tx.load();
    if (!loadResult.ok) return;
    expect(loadResult.value?.adventureSession?.resultPendingFlag, 'resultPendingFlag が true').toBe(true);
  });

  it('セッションクリアで adventureSession が null になる', async () => {
    await tx.saveMultiple({ adventureSession: makeActiveSession(AdventureSessionStatus.Active) });
    await tx.saveMultiple({ adventureSession: null });

    const loadResult = await tx.load();
    if (!loadResult.ok) return;
    expect(loadResult.value?.adventureSession, 'セッションが null').toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 確認3: 保存失敗時に main が壊れないこと
// ---------------------------------------------------------------------------

describe('確認3: 保存失敗時に main が壊れない', () => {
  let tx: SaveTransactionService;

  beforeEach(() => { tx = makeTx(); });

  it('仲間数上限(>5)超えでも既存 main が保持される', async () => {
    // 正常な初期状態を保存
    await tx.saveMultiple({
      player: {
        playerId:      toPlayerId('p-safe'),
        playerName:    '安全プレイヤー',
        worldId:       toWorldId('WORLD_FOREST'),
        mainMonsterId: null,
      },
    });

    // 仲間6体（上限超え）で保存試行
    const overCapacity = Array.from({ length: 6 }, (_, i) => ({
      uniqueId:        toMonsterId(`over-${i}`),
      monsterMasterId: toMonsterMasterId('MON_001'),
      displayName:     `超過モン${i}`,
      worldId:         WorldId.Forest,
      role:            RoleType.Attack,
      level:           1,
      exp:             0,
      personality:     PersonalityType.Brave,
      skillIds:        [] as ReturnType<typeof toSkillId>[],
      isMain:          false,
    }));

    const failResult = await tx.saveMultiple({ ownedMonsters: overCapacity });
    expect(failResult.ok, '保存失敗が返る').toBe(false);

    // main_save は壊れていない
    const loadResult = await tx.load();
    expect(loadResult.ok, '読込は成功する').toBe(true);
    if (!loadResult.ok) return;
    expect(loadResult.value?.player?.playerName, 'playerName が元のまま').toBe('安全プレイヤー');
    expect(loadResult.value?.ownedMonsters.length, 'ownedMonsters は元の0体').toBe(0);
  });

  it('助っ人数上限(>10)超えでも既存 main が保持される', async () => {
    await tx.saveMultiple({
      player: {
        playerId:   toPlayerId('p-x'),
        playerName: '番人',
        worldId:    toWorldId('WORLD_FOREST'),
        mainMonsterId: null,
      },
    });

    const overSupport = Array.from({ length: 11 }, (_, i) => ({
      supportId:                   `sup-${i}`,
      sourceUniqueMonsterIdFromQr: toMonsterId(`src-${i}`),
      monsterMasterId:             toMonsterMasterId('MON_002'),
      displayName:                 `サポ${i}`,
      worldId:                     WorldId.Forest,
      role:                        RoleType.Guard,
      level:                       1,
      personality:                 PersonalityType.Calm,
      skillIds:                    [] as ReturnType<typeof toSkillId>[],
      registeredAt:                '2024-01-01T00:00:00Z',
    }));

    const failResult = await tx.saveMultiple({ supportMonsters: overSupport });
    expect(failResult.ok, '保存失敗').toBe(false);

    const loadResult = await tx.load();
    expect(loadResult.ok).toBe(true);
    if (!loadResult.ok) return;
    expect(loadResult.value?.player?.playerName).toBe('番人');
    expect(loadResult.value?.supportMonsters.length).toBe(0);
  });

  it('SESSION_ACTIVE_BATTLE なのに battleCheckpoint=-1 の整合エラーでも main が保持される', async () => {
    await tx.saveMultiple({
      player: {
        playerId:   toPlayerId('p-safe2'),
        playerName: '守衛',
        worldId:    toWorldId('WORLD_FOREST'),
        mainMonsterId: null,
      },
    });

    // 業務整合エラー: ActiveBattle なのに battleCheckpointNodeIndex = -1
    const badSession: AdventureSession = {
      ...makeActiveSession(AdventureSessionStatus.ActiveBattle, -1),
    };
    const failResult = await tx.saveMultiple({ adventureSession: badSession });
    expect(failResult.ok, '整合エラーで保存失敗').toBe(false);

    const loadResult = await tx.load();
    expect(loadResult.ok).toBe(true);
    if (!loadResult.ok) return;
    expect(loadResult.value?.player?.playerName).toBe('守衛');
    expect(loadResult.value?.adventureSession).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 確認4: 復旧不能セッション無効化
// ---------------------------------------------------------------------------

describe('確認4: 復旧不能セッション無効化', () => {
  it('SESSION_ACTIVE_BATTLE + battleCheckpoint=-1 → 無効化後 home へ', async () => {
    const tx  = makeTx();
    const svc = new RecoveryExecutionService(tx);

    // 復旧不能なセッションを main_save に保存（直接DBへ書く）
    // ※業務整合エラーなので saveMultiple は通らない → 直接 DB 操作でシミュレート
    const db = new TabimonDatabase();
    _resetDatabaseForTest(db);
    const badSave: MainSaveSnapshot = {
      ...createEmptyMainSave(),
      player: {
        playerId:      toPlayerId('p-broken'),
        playerName:    '復旧テスト',
        worldId:       toWorldId('WORLD_FOREST'),
        mainMonsterId: null,
      },
      adventureSession: makeActiveSession(AdventureSessionStatus.ActiveBattle, -1),
    };
    await db.saves.put({
      id:        'main',
      payload:   JSON.stringify(badSave),
      updatedAt: new Date().toISOString(),
    });
    const tx2  = new SaveTransactionService();
    const svc2 = new RecoveryExecutionService(tx2);

    const result = await svc2.execute();
    expect(result.ok, '復旧実行成功').toBe(true);
    if (!result.ok) return;

    // セッションが無効化されている
    expect(result.value.sessionAction, 'InvalidateSession が選ばれる')
      .toBe(SessionRecoveryAction.InvalidateSession);
    expect(result.value.save?.adventureSession, 'adventureSession が null になっている')
      .toBeNull();
    // player は保持されている（セーブ全体は消えない）
    expect(result.value.save?.player?.playerName, 'player は保持される')
      .toBe('復旧テスト');
    expect(result.value.nextHint, 'SessionInvalidated ヒント')
      .toBe(RecoveryNextHint.SessionInvalidated);
  });

  it('必須フィールド欠損 (sessionId="") → 無効化後 home へ', async () => {
    const db = new TabimonDatabase();
    _resetDatabaseForTest(db);
    const brokenSession: AdventureSession = {
      ...makeActiveSession(AdventureSessionStatus.Active),
      sessionId: toSessionId(''),  // 空 sessionId = 復旧不能
    };
    const snap: MainSaveSnapshot = {
      ...createEmptyMainSave(),
      adventureSession: brokenSession,
    };
    await db.saves.put({
      id: 'main', payload: JSON.stringify(snap), updatedAt: new Date().toISOString(),
    });
    const svc = new RecoveryExecutionService(new SaveTransactionService());

    const result = await svc.execute();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.sessionAction).toBe(SessionRecoveryAction.InvalidateSession);
    expect(result.value.save?.adventureSession).toBeNull();
  });

  it('SESSION_PENDING_RESULT → 無効化せずに ResumePendingResult ヒントを返す', async () => {
    const db = new TabimonDatabase();
    _resetDatabaseForTest(db);
    const pendingSession: AdventureSession = {
      ...makeActiveSession(AdventureSessionStatus.PendingResult),
      resultPendingFlag: true,
    };
    const snap: MainSaveSnapshot = { ...createEmptyMainSave(), adventureSession: pendingSession };
    await db.saves.put({
      id: 'main', payload: JSON.stringify(snap), updatedAt: new Date().toISOString(),
    });
    const svc = new RecoveryExecutionService(new SaveTransactionService());

    const result = await svc.execute();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // セッションは維持される（リザルト確定は UseCase 側の責務）
    expect(result.value.sessionAction).toBe(SessionRecoveryAction.ResumePendingResult);
    expect(result.value.save?.adventureSession).not.toBeNull();
    expect(result.value.nextHint).toBe(RecoveryNextHint.ResumePendingResult);
  });
});
