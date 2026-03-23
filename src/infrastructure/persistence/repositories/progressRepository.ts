/**
 * ProgressRepository 実装。
 * main_save の progress フィールドを読み書きする。
 */
import type { ProgressRepository } from '@/application/ports/SaveRepositoryPort';
import type { ProgressState } from '@/infrastructure/storage/models';
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { SaveErrorCode } from '@/common/errors/AppErrorCode';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';

export class ProgressRepositoryImpl implements ProgressRepository {
  constructor(private readonly tx: SaveTransactionService) {}

  async load(): Promise<Result<ProgressState | null, SaveErrorCode>> {
    const result = await this.tx.load();
    if (!result.ok) return fail(result.errorCode, result.message);
    return ok(result.value?.progress ?? null);
  }

  async save(progress: ProgressState): Promise<Result<void, SaveErrorCode>> {
    return this.tx.saveMultiple({ progress });
  }
}
