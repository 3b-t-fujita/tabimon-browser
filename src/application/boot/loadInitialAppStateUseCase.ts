/**
 * アプリ起動時の初期状態読込 UseCase。
 * 保存データを読み込み、復旧判定を行い、遷移先を決定する。
 *
 * 呼び出し元（Boot コンポーネント）はこの UseCase の結果だけを使って
 * 画面遷移を決める。IndexedDB や復旧ロジックは知らない。
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { SaveErrorCode } from '@/common/errors/AppErrorCode';
import { AdventureSessionStatus } from '@/common/constants/enums';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { RecoveryExecutionService } from '@/infrastructure/persistence/recovery/recoveryExecutionService';
import { RecoveryNextHint } from '@/infrastructure/persistence/recovery/recoveryExecutionService';
import { SessionRecoveryAction } from '@/infrastructure/persistence/recovery/recoveryJudge';
import {
  BootDestination,
  type BootViewModel,
} from '@/application/viewModels/bootViewModel';
import type { RecoveryPromptViewModel } from '@/application/viewModels/recoveryPromptViewModel';
import type { MainSaveSnapshot } from '@/infrastructure/storage/models';

export interface LoadInitialAppStateResult {
  readonly viewModel:      BootViewModel;
  /** 復旧後の保存データ（BootApplicationService が HomeViewModel 構築に使う） */
  readonly resolvedSave:   MainSaveSnapshot | null;
}

export class LoadInitialAppStateUseCase {
  private readonly tx:       SaveTransactionService;
  private readonly recovery: RecoveryExecutionService;

  constructor() {
    this.tx       = new SaveTransactionService();
    this.recovery = new RecoveryExecutionService(this.tx);
  }

  async execute(): Promise<Result<LoadInitialAppStateResult, SaveErrorCode>> {
    // 1. 復旧実行（temp昇格 / セッション復旧 / 無効化 も含む）
    const recoveryResult = await this.recovery.execute();
    if (!recoveryResult.ok) {
      return ok({
        viewModel: {
          destination:   BootDestination.LoadFailed,
          recoveryInfo:  null,
          errorMessage:  '保存データの読み込みに失敗しました。最初からやり直してください。',
        },
        resolvedSave: null,
      });
    }

    const { save, nextHint, sessionAction } = recoveryResult.value;

    // 2. セーブなし → 初回起動
    if (!save || !save.player) {
      return ok({
        viewModel: {
          destination:  BootDestination.InitialSetup,
          recoveryInfo: null,
          errorMessage: null,
        },
        resolvedSave: save,
      });
    }

    // 3. 遷移先決定
    const destination = this.resolveDestination(nextHint);
    const recoveryInfo = this.buildRecoveryInfo(nextHint, sessionAction, save);

    return ok({
      viewModel: {
        destination,
        recoveryInfo,
        errorMessage: null,
      },
      resolvedSave: save,
    });
  }

  private resolveDestination(hint: RecoveryNextHint): BootDestination {
    switch (hint) {
      case RecoveryNextHint.ResumePendingResult:
        return BootDestination.RecoveryPrompt;
      case RecoveryNextHint.LoadFailed:
        return BootDestination.LoadFailed;
      case RecoveryNextHint.SessionInvalidated:
      case RecoveryNextHint.Normal:
      default:
        return BootDestination.Home;
    }
  }

  private buildRecoveryInfo(
    hint:          RecoveryNextHint,
    sessionAction: SessionRecoveryAction,
    save:          MainSaveSnapshot,
  ): RecoveryPromptViewModel | null {
    if (!save.adventureSession) return null;

    if (hint === RecoveryNextHint.ResumePendingResult) {
      return {
        type:    'PENDING_RESULT',
        stageId: save.adventureSession.stageId,
      };
    }
    if (sessionAction === SessionRecoveryAction.ResumeActive ||
        sessionAction === SessionRecoveryAction.RestoreToBattleCheckpoint) {
      return {
        type:    'ACTIVE',
        stageId: save.adventureSession.stageId,
      };
    }
    return null;
  }
}
