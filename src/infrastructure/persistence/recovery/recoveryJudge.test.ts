/**
 * RecoveryJudge テスト。
 *
 * 検証観点:
 *   - temp なし → None / None
 *   - temp あり + 検証OK → PromoteTempToMain
 *   - temp あり + 検証NG → DiscardTemp
 *   - SESSION_ACTIVE_BATTLE + battleCheckpoint >= 0 → RestoreToBattleCheckpoint
 *   - SESSION_ACTIVE_BATTLE + battleCheckpoint = -1  → InvalidateSession
 *   - SESSION_PENDING_RESULT → ResumePendingResult
 *   - SESSION_ACTIVE → ResumeActive
 *   - 必須フィールド欠損セッション → InvalidateSession
 *   - セッションなし → None
 */
import { describe, it, expect } from 'vitest';
import { judgeRecovery, judgeSessionRecovery, RecoveryAction, SessionRecoveryAction } from './recoveryJudge';
import { AdventureSessionStatus } from '@/common/constants/enums';
import { createEmptyMainSave } from '@/infrastructure/storage/models';
import type { MainSaveSnapshot } from '@/infrastructure/storage/models';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import { toSessionId, toStageId, toMonsterId, toMonsterMasterId } from '@/types/ids';
import type { PartySnapshot } from '@/domain/valueObjects/PartySnapshot';

// ---------------------------------------------------------------------------
// テスト用ヘルパー
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
      worldId:         1,
    },
    supporters: [],
  };
}

function makeSession(
  status: AdventureSession['status'],
  battleCheckpointNodeIndex = -1,
  resultPendingFlag = false,
): AdventureSession {
  return {
    sessionId:                 toSessionId('session-1'),
    stageId:                   toStageId('stage-1'),
    currentNodeIndex:          3,
    partySnapshot:             makePartySnapshot(),
    battleCheckpointNodeIndex,
    resultPendingFlag,
    status,
    pendingResultType: null,
    nextBattleBuffMultiplier: 1.0,
    randomEventBattle: false,
  };
}

function saveWithSession(session: AdventureSession | null): MainSaveSnapshot {
  return { ...createEmptyMainSave(), adventureSession: session };
}

// ---------------------------------------------------------------------------
// judgeRecovery テスト
// ---------------------------------------------------------------------------

describe('judgeRecovery', () => {
  const emptyMain = createEmptyMainSave();

  it('temp なし → tempAction=None, sessionAction=None', () => {
    const result = judgeRecovery(false, null, emptyMain);
    expect(result.tempAction).toBe(RecoveryAction.None);
    expect(result.sessionAction).toBe(SessionRecoveryAction.None);
  });

  it('temp あり + 検証OK → PromoteTempToMain', () => {
    const validTemp = createEmptyMainSave();
    const result = judgeRecovery(true, validTemp, emptyMain);
    expect(result.tempAction).toBe(RecoveryAction.PromoteTempToMain);
  });

  it('temp あり + 検証NG (null) → DiscardTemp', () => {
    const result = judgeRecovery(true, null, emptyMain);
    expect(result.tempAction).toBe(RecoveryAction.DiscardTemp);
  });

  it('temp昇格時はtempのセッション状態でsessionActionを判定する', () => {
    const session = makeSession(AdventureSessionStatus.PendingResult, -1, true);
    const validTemp = saveWithSession(session);
    const result = judgeRecovery(true, validTemp, emptyMain);
    expect(result.tempAction).toBe(RecoveryAction.PromoteTempToMain);
    expect(result.sessionAction).toBe(SessionRecoveryAction.ResumePendingResult);
  });

  it('temp破棄時はmainのセッション状態でsessionActionを判定する', () => {
    const session = makeSession(AdventureSessionStatus.Active);
    const mainWithSession = saveWithSession(session);
    const result = judgeRecovery(true, null, mainWithSession);
    expect(result.tempAction).toBe(RecoveryAction.DiscardTemp);
    expect(result.sessionAction).toBe(SessionRecoveryAction.ResumeActive);
  });
});

// ---------------------------------------------------------------------------
// judgeSessionRecovery テスト
// ---------------------------------------------------------------------------

describe('judgeSessionRecovery', () => {
  it('セッションなし → None', () => {
    expect(judgeSessionRecovery(null)).toBe(SessionRecoveryAction.None);
  });

  it('SESSION_ACTIVE_BATTLE + battleCheckpoint >= 0 → RestoreToBattleCheckpoint', () => {
    const session = makeSession(AdventureSessionStatus.ActiveBattle, 2);
    expect(judgeSessionRecovery(session)).toBe(SessionRecoveryAction.RestoreToBattleCheckpoint);
  });

  it('SESSION_ACTIVE_BATTLE + battleCheckpoint = -1 → InvalidateSession', () => {
    const session = makeSession(AdventureSessionStatus.ActiveBattle, -1);
    expect(judgeSessionRecovery(session)).toBe(SessionRecoveryAction.InvalidateSession);
  });

  it('SESSION_PENDING_RESULT → ResumePendingResult', () => {
    const session = makeSession(AdventureSessionStatus.PendingResult, -1, true);
    expect(judgeSessionRecovery(session)).toBe(SessionRecoveryAction.ResumePendingResult);
  });

  it('SESSION_ACTIVE → ResumeActive', () => {
    const session = makeSession(AdventureSessionStatus.Active);
    expect(judgeSessionRecovery(session)).toBe(SessionRecoveryAction.ResumeActive);
  });

  it('SESSION_COMPLETED → None', () => {
    const session = makeSession(AdventureSessionStatus.Completed);
    expect(judgeSessionRecovery(session)).toBe(SessionRecoveryAction.None);
  });

  it('IDLE → None', () => {
    const session = makeSession(AdventureSessionStatus.Idle);
    expect(judgeSessionRecovery(session)).toBe(SessionRecoveryAction.None);
  });

  it('sessionId なし（復旧不能）→ InvalidateSession', () => {
    const session = makeSession(AdventureSessionStatus.Active);
    // sessionId を空にして復旧不能にする
    const broken = { ...session, sessionId: toSessionId('') };
    expect(judgeSessionRecovery(broken)).toBe(SessionRecoveryAction.InvalidateSession);
  });

  it('partySnapshot.main なし（復旧不能）→ InvalidateSession', () => {
    const session = makeSession(AdventureSessionStatus.Active);
    const broken = {
      ...session,
      partySnapshot: { ...session.partySnapshot, main: null as unknown as typeof session.partySnapshot.main },
    };
    expect(judgeSessionRecovery(broken)).toBe(SessionRecoveryAction.InvalidateSession);
  });
});
