/**
 * SettingsRepository 実装。
 * main_save の settings フィールドを読み書きする。
 */
import type { SettingsRepository } from '@/application/ports/SaveRepositoryPort';
import type { SettingsState } from '@/infrastructure/storage/models';
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { SaveErrorCode } from '@/common/errors/AppErrorCode';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';

export class SettingsRepositoryImpl implements SettingsRepository {
  constructor(private readonly tx: SaveTransactionService) {}

  async load(): Promise<Result<SettingsState | null, SaveErrorCode>> {
    const result = await this.tx.load();
    if (!result.ok) return fail(result.errorCode, result.message);
    return ok(result.value?.settings ?? null);
  }

  async save(settings: SettingsState): Promise<Result<void, SaveErrorCode>> {
    return this.tx.saveMultiple({ settings });
  }
}
