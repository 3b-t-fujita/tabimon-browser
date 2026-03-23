/**
 * リタイア確定 UseCase。
 * リタイア確認ダイアログで「はい」を押した際に呼ぶ。
 * status を SESSION_PENDING_RESULT に設定して保存し、リザルト処理へ渡す。
 * 詳細設計 v4 §4.1 / §10.5 リタイアフローに準拠。
 *
 * 重要:
 * - 通常の画面戻り（back()）は使わないこと（呼び出し元の責務）
 * - 保存成功後に /adventure/result へ遷移する（呼び出し元の責務）
 * - resultPendingFlag = true のまま維持（リザルト未確定）
 * - 保存失敗時は main を壊さない
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { AdventureErrorCode, SaveErrorCode } from '@/common/errors/AppErrorCode';
import { AdventureResultType, AdventureSessionStatus } from '@/common/constants/enums';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';

export type ConfirmRetireAdventureErrorCode =
  | typeof AdventureErrorCode.SessionNotFound
  | typeof SaveErrorCode.LoadFailed
  | typeof SaveErrorCode.SaveFailed;

export class ConfirmRetireAdventureUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(
    session: AdventureSession,
  ): Promise<Result<AdventureSession, ConfirmRetireAdventureErrorCode>> {
    if (!session) {
      return fail(AdventureErrorCode.SessionNotFound, 'セッションがありません');
    }

    // status を SESSION_PENDING_RESULT へ変更（resultPendingFlag は true のまま）
    const updatedSession: AdventureSession = {
      ...session,
      status:            AdventureSessionStatus.PendingResult,
      resultPendingFlag: true,
      pendingResultType: AdventureResultType.Retire,
    };

    const saveResult = await this.tx.saveMultiple({ adventureSession: updatedSession });
    if (!saveResult.ok) {
      return fail(SaveErrorCode.SaveFailed, saveResult.message);
    }

    return ok(updatedSession);
  }
}
