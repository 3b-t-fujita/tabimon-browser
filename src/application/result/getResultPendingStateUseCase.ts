/**
 * リザルト確定前状態取得 UseCase。
 * SESSION_PENDING_RESULT かつ resultPendingFlag=true の状態を確認して返す。
 * 詳細設計 v4 §8 リザルト仕様に準拠。
 *
 * 重要:
 * - resultPendingFlag=false ならば既に確定済み（ResultAlreadyFinal）
 * - SESSION_PENDING_RESULT 以外のセッションは対象外
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { AdventureErrorCode, SaveErrorCode } from '@/common/errors/AppErrorCode';
import { AdventureSessionStatus } from '@/common/constants/enums';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';

export type GetResultPendingStateErrorCode =
  | typeof AdventureErrorCode.SessionNotFound
  | typeof AdventureErrorCode.ResultAlreadyFinal
  | typeof AdventureErrorCode.SessionCorrupt
  | typeof SaveErrorCode.LoadFailed;

export class GetResultPendingStateUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(): Promise<Result<AdventureSession, GetResultPendingStateErrorCode>> {
    const loadResult = await this.tx.load();
    if (!loadResult.ok) return fail(SaveErrorCode.LoadFailed, loadResult.message);

    const session = loadResult.value?.adventureSession;
    if (!session) {
      return fail(AdventureErrorCode.SessionNotFound, 'リザルト対象のセッションがありません');
    }

    if (session.status !== AdventureSessionStatus.PendingResult) {
      return fail(
        AdventureErrorCode.SessionCorrupt,
        `リザルト確定対象ではありません: status=${session.status}`,
      );
    }

    if (!session.resultPendingFlag) {
      return fail(AdventureErrorCode.ResultAlreadyFinal, 'このセッションは既に確定済みです');
    }

    return ok(session);
  }
}
