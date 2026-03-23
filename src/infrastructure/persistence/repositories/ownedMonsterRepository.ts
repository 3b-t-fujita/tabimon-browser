/**
 * OwnedMonsterRepository 実装。
 * main_save の ownedMonsters フィールドを読み書きする。
 * 書き込みは SaveTransactionService 経由（temp → validate → main）。
 */
import type { OwnedMonsterRepository } from '@/application/ports/SaveRepositoryPort';
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { SaveErrorCode } from '@/common/errors/AppErrorCode';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';

export class OwnedMonsterRepositoryImpl implements OwnedMonsterRepository {
  constructor(private readonly tx: SaveTransactionService) {}

  async loadAll(): Promise<Result<OwnedMonster[], SaveErrorCode>> {
    const result = await this.tx.load();
    if (!result.ok) return fail(result.errorCode, result.message);
    // readonly → mutable コピーを返す（UseCase 側で自由に扱えるよう）
    return ok([...(result.value?.ownedMonsters ?? [])]);
  }

  async save(monsters: readonly OwnedMonster[]): Promise<Result<void, SaveErrorCode>> {
    return this.tx.saveMultiple({ ownedMonsters: monsters });
  }
}
