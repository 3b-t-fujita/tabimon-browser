/**
 * 候補見送り UseCase。
 * pendingCandidate を削除してセッションをクローズする。
 * 詳細設計 v4 §8.8 候補見送りに準拠。
 *
 * 重要:
 * - 見送り確認ダイアログは呼び出し元（UI）の責務
 * - 見送り後は pendingCandidate=null, adventureSession=null で保存
 * - QR 上限時の単純拒否とは異なる（こちらは明示的な見送り操作）
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { AdventureErrorCode, SaveErrorCode } from '@/common/errors/AppErrorCode';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';

export type SkipPendingCandidateErrorCode =
  | typeof AdventureErrorCode.SessionNotFound
  | typeof SaveErrorCode.LoadFailed
  | typeof SaveErrorCode.SaveFailed;

export class SkipPendingCandidateUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(): Promise<Result<void, SkipPendingCandidateErrorCode>> {
    // ---- セーブデータ読込 ----
    const loadResult = await this.tx.load();
    if (!loadResult.ok) return fail(SaveErrorCode.LoadFailed, loadResult.message);

    const save = loadResult.value;
    if (!save) return fail(AdventureErrorCode.SessionNotFound, 'セーブデータがありません');

    if (!save.pendingCandidate) {
      return fail(AdventureErrorCode.SessionNotFound, '見送り対象の候補が存在しません');
    }

    // ---- 保存（候補削除 + セッションクローズ） ----
    const saveResult = await this.tx.saveMultiple({
      pendingCandidate: null,
      adventureSession: null,
    });

    if (!saveResult.ok) {
      return fail(SaveErrorCode.SaveFailed, saveResult.message);
    }

    return ok(undefined);
  }
}
