/**
 * 冒険セッションクローズ UseCase。
 * 候補なしの場合など、accept/skip を使わずにセッションを終了するパス。
 * adventureSession=null, pendingCandidate=null で保存する。
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { SaveErrorCode } from '@/common/errors/AppErrorCode';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';

export type CloseAdventureSessionErrorCode =
  | typeof SaveErrorCode.SaveFailed;

export class CloseAdventureSessionUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(): Promise<Result<void, CloseAdventureSessionErrorCode>> {
    const saveResult = await this.tx.saveMultiple({
      adventureSession: null,
      pendingCandidate: null,
    });

    if (!saveResult.ok) {
      return fail(SaveErrorCode.SaveFailed, saveResult.message);
    }

    return ok(undefined);
  }
}
