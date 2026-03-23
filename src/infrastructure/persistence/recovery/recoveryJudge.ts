/**
 * 起動時復旧判定。詳細設計 v4 §10.5 復旧方針に準拠。
 *
 * 復旧シナリオ:
 *   1. temp_save あり + 検証OK  → temp を main へ昇格（前回保存が中断したが内容は正常）
 *   2. temp_save あり + 検証NG  → temp を破棄して main をそのまま使う（temp が破損）
 *   3. temp_save なし            → 通常起動（main をそのまま使う）
 *
 * AdventureSession 復旧シナリオ（main_save のセッション状態に応じて）:
 *   SESSION_ACTIVE_BATTLE   → battleCheckpointNodeIndex へ currentNodeIndex を巻き戻す
 *   SESSION_PENDING_RESULT  → resultPendingFlag=true のままリザルト確定処理へ誘導
 *   復旧不能（必須フィールド欠損）→ セッションを無効化して main_save に書き戻す（save全体は保持）
 */

import type { MainSaveSnapshot } from '@/infrastructure/storage/models';
import { AdventureSessionStatus } from '@/common/constants/enums';
import { isSessionRecoverable } from '@/domain/services/SaveConsistencyChecker';

// ---------------------------------------------------------------------------
// 判定結果型
// ---------------------------------------------------------------------------

/** 起動時の復旧アクション種別 */
export const RecoveryAction = {
  /** temp_save を main へ昇格してから通常起動 */
  PromoteTempToMain: 'PROMOTE_TEMP_TO_MAIN',
  /** temp_save を破棄して通常起動 */
  DiscardTemp:       'DISCARD_TEMP',
  /** 通常起動（temp なし） */
  None:              'NONE',
} as const;
export type RecoveryAction = (typeof RecoveryAction)[keyof typeof RecoveryAction];

/** セッション復旧アクション種別 */
export const SessionRecoveryAction = {
  /** 戦闘中クラッシュ → battleCheckpointNodeIndex へ巻き戻し */
  RestoreToBattleCheckpoint: 'RESTORE_TO_BATTLE_CHECKPOINT',
  /** リザルト未確定 → リザルト確定処理へ誘導 */
  ResumePendingResult:       'RESUME_PENDING_RESULT',
  /** 通常の探索中断 → currentNodeIndex から再開 */
  ResumeActive:              'RESUME_ACTIVE',
  /** セッション無効化（必須フィールド欠損等） */
  InvalidateSession:         'INVALIDATE_SESSION',
  /** セッションなし（通常起動） */
  None:                      'NONE',
} as const;
export type SessionRecoveryAction = (typeof SessionRecoveryAction)[keyof typeof SessionRecoveryAction];

export interface RecoveryJudgeResult {
  /** temp_save に対するアクション */
  tempAction:    RecoveryAction;
  /** AdventureSession に対するアクション */
  sessionAction: SessionRecoveryAction;
}

// ---------------------------------------------------------------------------
// RecoveryJudge
// ---------------------------------------------------------------------------

/**
 * temp_save の有無と main_save のセッション状態から復旧アクションを判定する。
 *
 * @param hasPendingTemp   - temp_save が存在するか
 * @param tempValidated    - temp_save の検証結果（null = temp なし or 検証不能）
 * @param mainSave         - 現在の main_save（null = 存在しない）
 */
export function judgeRecovery(
  hasPendingTemp: boolean,
  tempValidated:  MainSaveSnapshot | null,
  mainSave:       MainSaveSnapshot | null,
): RecoveryJudgeResult {
  // ---- temp_save 判定 ----
  let tempAction: RecoveryAction;
  if (!hasPendingTemp) {
    tempAction = RecoveryAction.None;
  } else if (tempValidated !== null) {
    tempAction = RecoveryAction.PromoteTempToMain;
  } else {
    tempAction = RecoveryAction.DiscardTemp;
  }

  // ---- セッション判定 ----
  // temp昇格後は tempValidated が有効なセーブになるので、そちらを参照する
  const effectiveSave = tempAction === RecoveryAction.PromoteTempToMain
    ? tempValidated
    : mainSave;

  const sessionAction = judgeSessionRecovery(effectiveSave?.adventureSession ?? null);

  return { tempAction, sessionAction };
}

/**
 * AdventureSession のみから復旧アクションを判定する。
 */
export function judgeSessionRecovery(
  session: MainSaveSnapshot['adventureSession'],
): SessionRecoveryAction {
  if (!session) return SessionRecoveryAction.None;

  // 必須フィールド不足 → 無効化
  if (!isSessionRecoverable(session)) {
    return SessionRecoveryAction.InvalidateSession;
  }

  switch (session.status) {
    case AdventureSessionStatus.ActiveBattle:
      // 戦闘中クラッシュ → battleCheckpointNodeIndex へ巻き戻し
      if (session.battleCheckpointNodeIndex >= 0) {
        return SessionRecoveryAction.RestoreToBattleCheckpoint;
      }
      // battleCheckpoint が -1 のまま ActiveBattle は異常 → 無効化
      return SessionRecoveryAction.InvalidateSession;

    case AdventureSessionStatus.PendingResult:
      // リザルト未確定 → 確定処理へ誘導
      return SessionRecoveryAction.ResumePendingResult;

    case AdventureSessionStatus.Active:
      // 通常探索中断 → 現在ノードから再開
      return SessionRecoveryAction.ResumeActive;

    case AdventureSessionStatus.Completed:
    case AdventureSessionStatus.Idle:
    default:
      // 完了済み / Idle → セッションなし扱い
      return SessionRecoveryAction.None;
  }
}
