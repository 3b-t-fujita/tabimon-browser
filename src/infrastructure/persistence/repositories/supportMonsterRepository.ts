/**
 * SupportMonsterRepository 実装。
 * main_save の supportMonsters フィールドを読み書きする。
 * 書き込みは SaveTransactionService 経由（temp → validate → main）。
 */
import type { SupportMonsterRepository } from '@/application/ports/SaveRepositoryPort';
import type { SupportMonster } from '@/domain/entities/SupportMonster';
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { SaveErrorCode } from '@/common/errors/AppErrorCode';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';

export class SupportMonsterRepositoryImpl implements SupportMonsterRepository {
  constructor(private readonly tx: SaveTransactionService) {}

  async loadAll(): Promise<Result<SupportMonster[], SaveErrorCode>> {
    const result = await this.tx.load();
    if (!result.ok) return fail(result.errorCode, result.message);
    return ok([...(result.value?.supportMonsters ?? [])]);
  }

  async save(monsters: readonly SupportMonster[]): Promise<Result<void, SaveErrorCode>> {
    return this.tx.saveMultiple({ supportMonsters: monsters });
  }
}
