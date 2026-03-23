/**
 * 起動時復旧実行サービス。詳細設計 v4 §10.5 復旧方針に準拠。
 *
 * 呼び出し手順（アプリ起動時）:
 *   1. hasPendingTemp() を確認
 *   2. loadAndValidateTemp() で temp を検証
 *   3. judgeRecovery() で復旧アクションを決定
 *   4. executeRecovery() で実際の復旧処理を実行
 *   5. 復旧結果（RecoveryExecutionResult）を上位層に返す
 *      → 上位層（UseCase / Store）が画面遷移先を決定する
 *
 * この層では画面遷移は行わない。
 */
import type { MainSaveSnapshot } from '@/infrastructure/storage/models';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { SaveErrorCode } from '@/common/errors/AppErrorCode';
import { AdventureSessionStatus } from '@/common/constants/enums';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import {
  judgeRecovery,
  RecoveryAction,
  SessionRecoveryAction,
  type RecoveryJudgeResult,
} from './recoveryJudge';

// ---------------------------------------------------------------------------
// 復旧実行結果型
// ---------------------------------------------------------------------------

/** 復旧後に上位層へ渡す結果 */
export interface RecoveryExecutionResult {
  /** 復旧後の main_save（null = 存在しない/新規） */
  save: MainSaveSnapshot | null;
  /** セッションに対して行ったアクション */
  sessionAction: SessionRecoveryAction;
  /** 上位層への誘導先ヒント */
  nextHint: RecoveryNextHint;
}

/** 復旧後に上位層が取るべきアクションのヒント */
export const RecoveryNextHint = {
  /** 通常通りタイトル/ホームへ進む */
  Normal:             'NORMAL',
  /** リザルト確定処理（FinalizeAdventureResultUseCase）を呼ぶ */
  ResumePendingResult:'RESUME_PENDING_RESULT',
  /** セッション無効化済み → ホームへ戻す */
  SessionInvalidated: 'SESSION_INVALIDATED',
  /** データ読み込み全体失敗 → タイトルへ戻す */
  LoadFailed:         'LOAD_FAILED',
} as const;
export type RecoveryNextHint = (typeof RecoveryNextHint)[keyof typeof RecoveryNextHint];

// ---------------------------------------------------------------------------
// RecoveryExecutionService
// ---------------------------------------------------------------------------

export class RecoveryExecutionService {
  constructor(private readonly tx: SaveTransactionService) {}

  /**
   * 起動時復旧処理を実行する。
   *
   * 失敗しても main_save を壊さない。
   * 全体読み込み失敗時は LoadFailed を返す（→ タイトルへ）。
   */
  async execute(): Promise<Result<RecoveryExecutionResult, SaveErrorCode>> {
    // 1. temp の存在確認
    const hasPending = await this.tx.hasPendingTemp();

    // 2. temp の検証（存在する場合のみ）
    let tempValidated: MainSaveSnapshot | null = null;
    if (hasPending) {
      const tempResult = await this.tx.loadAndValidateTemp();
      if (tempResult.ok) {
        tempValidated = tempResult.value;
      }
      // 検証失敗の場合は tempValidated = null のまま → DiscardTemp アクション
    }

    // 3. 現在の main_save を読み込む
    const mainResult = await this.tx.load();
    if (!mainResult.ok) {
      return fail(mainResult.errorCode, mainResult.message);
    }
    const mainSave = mainResult.value;

    // 4. 復旧アクション判定
    const judgeResult = judgeRecovery(hasPending, tempValidated, mainSave);

    // 5. 復旧実行
    return this.applyRecovery(judgeResult, tempValidated, mainSave);
  }

  // -------------------------------------------------------------------------
  // private
  // -------------------------------------------------------------------------

  private async applyRecovery(
    judge:         RecoveryJudgeResult,
    tempValidated: MainSaveSnapshot | null,
    mainSave:      MainSaveSnapshot | null,
  ): Promise<Result<RecoveryExecutionResult, SaveErrorCode>> {

    // ---- temp アクション ----
    let effectiveSave = mainSave;

    if (judge.tempAction === RecoveryAction.PromoteTempToMain) {
      // temp を main へ昇格
      const promoteResult = await this.tx.promoteTempToMain();
      if (!promoteResult.ok) {
        // 昇格失敗 → temp を破棄して main をそのまま使う
        await this.tx.clearTemp();
        console.warn('[Recovery] temp昇格失敗、mainをそのまま使います', promoteResult.message);
      } else {
        effectiveSave = tempValidated;
      }
    } else if (judge.tempAction === RecoveryAction.DiscardTemp) {
      // temp を破棄
      await this.tx.clearTemp();
      console.warn('[Recovery] temp_save が破損していたため破棄しました');
    }
    // RecoveryAction.None はそのまま

    // ---- セッションアクション ----
    const { sessionAction, effectiveSaveAfterSession } =
      await this.applySessionRecovery(judge.sessionAction, effectiveSave);

    // nextHint を決定
    const nextHint = this.resolveNextHint(sessionAction);

    return ok({
      save:          effectiveSaveAfterSession,
      sessionAction,
      nextHint,
    });
  }

  private async applySessionRecovery(
    sessionAction: SessionRecoveryAction,
    save:          MainSaveSnapshot | null,
  ): Promise<{ sessionAction: SessionRecoveryAction; effectiveSaveAfterSession: MainSaveSnapshot | null }> {

    switch (sessionAction) {
      case SessionRecoveryAction.RestoreToBattleCheckpoint: {
        // 戦闘中クラッシュ → currentNodeIndex を battleCheckpointNodeIndex へ巻き戻す
        const session = save?.adventureSession;
        if (!session) break;

        const restored: AdventureSession = {
          ...session,
          currentNodeIndex: session.battleCheckpointNodeIndex,
          status:           AdventureSessionStatus.Active,
          // battleCheckpoint はリセットしない（次の戦闘で再設定される）
        };

        const saveResult = await this.tx.saveMultiple({ adventureSession: restored });
        if (!saveResult.ok) {
          console.warn('[Recovery] battleCheckpoint復旧の保存失敗、セッションを無効化します', saveResult.message);
          return this.invalidateSession(save);
        }

        // save を更新
        const updatedSave: MainSaveSnapshot | null = save
          ? { ...save, adventureSession: restored }
          : null;
        return { sessionAction: SessionRecoveryAction.RestoreToBattleCheckpoint, effectiveSaveAfterSession: updatedSave };
      }

      case SessionRecoveryAction.ResumePendingResult:
        // 何もしない（リザルト確定は上位層が行う）
        return { sessionAction, effectiveSaveAfterSession: save };

      case SessionRecoveryAction.ResumeActive:
        // 何もしない（現在ノードから再開）
        return { sessionAction, effectiveSaveAfterSession: save };

      case SessionRecoveryAction.InvalidateSession:
        // セッションを無効化（null にして保存）
        return this.invalidateSession(save);

      case SessionRecoveryAction.None:
      default:
        break;
    }

    return { sessionAction, effectiveSaveAfterSession: save };
  }

  private async invalidateSession(
    save: MainSaveSnapshot | null,
  ): Promise<{ sessionAction: SessionRecoveryAction; effectiveSaveAfterSession: MainSaveSnapshot | null }> {
    const saveResult = await this.tx.saveMultiple({ adventureSession: null });
    if (!saveResult.ok) {
      console.warn('[Recovery] セッション無効化の保存失敗', saveResult.message);
    }
    const updatedSave: MainSaveSnapshot | null = save
      ? { ...save, adventureSession: null }
      : null;
    return {
      sessionAction:            SessionRecoveryAction.InvalidateSession,
      effectiveSaveAfterSession: updatedSave,
    };
  }

  private resolveNextHint(sessionAction: SessionRecoveryAction): RecoveryNextHint {
    switch (sessionAction) {
      case SessionRecoveryAction.ResumePendingResult:
        return RecoveryNextHint.ResumePendingResult;
      case SessionRecoveryAction.InvalidateSession:
        return RecoveryNextHint.SessionInvalidated;
      default:
        return RecoveryNextHint.Normal;
    }
  }
}
