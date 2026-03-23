/**
 * PendingCandidateRepository 実装。
 * main_save の pendingCandidate フィールドを読み書き・クリアする。
 * 書き込みは SaveTransactionService 経由（temp → validate → main）。
 */
import type { PendingCandidateRepository } from '@/application/ports/SaveRepositoryPort';
import type { PendingCandidate } from '@/domain/entities/PendingCandidate';
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { SaveErrorCode } from '@/common/errors/AppErrorCode';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';

export class PendingCandidateRepositoryImpl implements PendingCandidateRepository {
  constructor(private readonly tx: SaveTransactionService) {}

  async load(): Promise<Result<PendingCandidate | null, SaveErrorCode>> {
    const result = await this.tx.load();
    if (!result.ok) return fail(result.errorCode, result.message);
    return ok(result.value?.pendingCandidate ?? null);
  }

  async save(candidate: PendingCandidate): Promise<Result<void, SaveErrorCode>> {
    return this.tx.saveMultiple({ pendingCandidate: candidate });
  }

  async clear(): Promise<Result<void, SaveErrorCode>> {
    return this.tx.saveMultiple({ pendingCandidate: null });
  }
}
