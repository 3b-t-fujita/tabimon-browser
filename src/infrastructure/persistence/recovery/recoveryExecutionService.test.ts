/**
 * RecoveryExecutionService テスト。
 *
 * 検証観点:
 *   - temp なし → save をそのまま返す
 *   - temp あり + 正常 → 昇格して返す
 *   - SESSION_ACTIVE_BATTLE → battleCheckpointNodeIndex へ巻き戻す
 *   - SESSION_PENDING_RESULT → ResumePendingResult ヒントを返す
 *   - 必須フィールド欠損セッション → 無効化してホームへ
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { TabimonDatabase, _resetDatabaseForTest, SAVE_KEY_MAIN, SAVE_KEY_TEMP } from '../db/tabimonDb';
import { SaveTransactionService } from '../transaction/saveTransactionService';
import { RecoveryExecutionService, RecoveryNextHint } from './recoveryExecutionService';
import { SessionRecoveryAction } from './recoveryJudge';
import { AdventureSessionStatus } from '@/common/constants/enums';
import { createEmptyMainSave } from '@/infrastructure/storage/models';
import type { MainSaveSnapshot } from '@/infrastructure/storage/models';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import { toSessionId, toStageId, toMonsterId, toMonsterMasterId } from '@/types/ids';
import type { PartySnapshot } from '@/domain/valueObjects/PartySnapshot';

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------

function makePartySnapshot(): PartySnapshot {
  return {
    main: {
      uniqueId:        toMonsterId('mon-1'),
      monsterMasterId: toMonsterMasterId('MON_001'),
      displayName:     'テストモン',
      personality:     'PERSONALITY_BRAVE',
      stats:           { maxHp: 100, atk: 10, def: 5, spd: 8 },
      skills:          [],
      isMain:          true,
    },
    supporters: [],
  };
}

function makeSession(
  status: AdventureSession['status'],
  battleCheckpointNodeIndex = -1,
  currentNodeIndex = 3,
  resultPendingFlag = false,
): AdventureSession {
  return {
    sessionId:                 toSessionId('session-1'),
    stageId:                   toStageId('stage-1'),
    currentNodeIndex,
    partySnapshot:             makePartySnapshot(),
    battleCheckpointNodeIndex,
    resultPendingFlag,
    status,
    pendingResultType: null,
    nextBattleBuffMultiplier: 1.0,
    randomEventBattle: false,
  };
}

async function seedMain(db: TabimonDatabase, snap: MainSaveSnapshot): Promise<void> {
  await db.saves.put({
    id:        SAVE_KEY_MAIN,
    payload:   JSON.stringify(snap),
    updatedAt: new Date().toISOString(),
  });
}

async function seedTemp(db: TabimonDatabase, snap: MainSaveSnapshot): Promise<void> {
  await db.saves.put({
    id:        SAVE_KEY_TEMP,
    payload:   JSON.stringify(snap),
    updatedAt: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// テスト
// ---------------------------------------------------------------------------

describe('RecoveryExecutionService', () => {
  let tx:  SaveTransactionService;
  let svc: RecoveryExecutionService;

  beforeEach(() => {
    const db = new TabimonDatabase();
    _resetDatabaseForTest(db);
    tx  = new SaveTransactionService();
    svc = new RecoveryExecutionService(tx);
  });

  // -------------------------------------------------------------------------
  // 通常起動
  // -------------------------------------------------------------------------

  it('temp なし・セッションなし → Normal ヒント', async () => {
    const db = new TabimonDatabase();
    _resetDatabaseForTest(db);
    await seedMain(db, createEmptyMainSave());
    tx  = new SaveTransactionService();
    svc = new RecoveryExecutionService(tx);

    const result = await svc.execute();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.nextHint).toBe(RecoveryNextHint.Normal);
      expect(result.value.sessionAction).toBe(SessionRecoveryAction.None);
    }
  });

  // -------------------------------------------------------------------------
  // temp 昇格
  // -------------------------------------------------------------------------

  it('有効な temp → main へ昇格して返す', async () => {
    const db = new TabimonDatabase();
    _resetDatabaseForTest(db);
    const tempSnap: MainSaveSnapshot = {
      ...createEmptyMainSave(),
      settings: { bgmVolume: 0.3, sfxVolume: 0.7 },
    };
    await seedTemp(db, tempSnap);
    tx  = new SaveTransactionService();
    svc = new RecoveryExecutionService(tx);

    const result = await svc.execute();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.save?.settings?.bgmVolume).toBe(0.3);
      // temp が削除されている
      expect(await tx.hasPendingTemp()).toBe(false);
    }
  });

  // -------------------------------------------------------------------------
  // SESSION_ACTIVE_BATTLE 復旧
  // -------------------------------------------------------------------------

  it('SESSION_ACTIVE_BATTLE + battleCheckpoint=2 → currentNodeIndex が 2 に巻き戻る', async () => {
    const db = new TabimonDatabase();
    _resetDatabaseForTest(db);
    const session = makeSession(AdventureSessionStatus.ActiveBattle, 2, 5);
    await seedMain(db, { ...createEmptyMainSave(), adventureSession: session });
    tx  = new SaveTransactionService();
    svc = new RecoveryExecutionService(tx);

    const result = await svc.execute();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.sessionAction).toBe(SessionRecoveryAction.RestoreToBattleCheckpoint);
      expect(result.value.save?.adventureSession?.currentNodeIndex).toBe(2);
      expect(result.value.save?.adventureSession?.status).toBe(AdventureSessionStatus.Active);
    }
  });

  it('SESSION_ACTIVE_BATTLE + battleCheckpoint=-1 → セッション無効化', async () => {
    const db = new TabimonDatabase();
    _resetDatabaseForTest(db);
    const session = makeSession(AdventureSessionStatus.ActiveBattle, -1, 3);
    await seedMain(db, { ...createEmptyMainSave(), adventureSession: session });
    tx  = new SaveTransactionService();
    svc = new RecoveryExecutionService(tx);

    const result = await svc.execute();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.sessionAction).toBe(SessionRecoveryAction.InvalidateSession);
      expect(result.value.save?.adventureSession).toBeNull();
      expect(result.value.nextHint).toBe(RecoveryNextHint.SessionInvalidated);
    }
  });

  // -------------------------------------------------------------------------
  // SESSION_PENDING_RESULT 復旧
  // -------------------------------------------------------------------------

  it('SESSION_PENDING_RESULT → ResumePendingResult ヒント・セッション維持', async () => {
    const db = new TabimonDatabase();
    _resetDatabaseForTest(db);
    const session = makeSession(AdventureSessionStatus.PendingResult, -1, 5, true);
    await seedMain(db, { ...createEmptyMainSave(), adventureSession: session });
    tx  = new SaveTransactionService();
    svc = new RecoveryExecutionService(tx);

    const result = await svc.execute();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.sessionAction).toBe(SessionRecoveryAction.ResumePendingResult);
      expect(result.value.nextHint).toBe(RecoveryNextHint.ResumePendingResult);
      // セッションは維持される
      expect(result.value.save?.adventureSession).not.toBeNull();
    }
  });
});
