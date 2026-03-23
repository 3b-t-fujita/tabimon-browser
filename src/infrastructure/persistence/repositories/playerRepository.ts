/**
 * PlayerRepository 実装。
 * main_save の player フィールドを読み書きする。
 * 書き込みは SaveTransactionService 経由（temp → validate → main）。
 */
import type { PlayerRepository } from '@/application/ports/SaveRepositoryPort';
import type { Player } from '@/domain/entities/Player';
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { SaveErrorCode } from '@/common/errors/AppErrorCode';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';

export class PlayerRepositoryImpl implements PlayerRepository {
  constructor(private readonly tx: SaveTransactionService) {}

  async load(): Promise<Result<Player | null, SaveErrorCode>> {
    const result = await this.tx.load();
    if (!result.ok) return fail(result.errorCode, result.message);
    return ok(result.value?.player ?? null);
  }

  async save(player: Player): Promise<Result<void, SaveErrorCode>> {
    return this.tx.saveMultiple({ player });
  }
}
