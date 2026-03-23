/**
 * 現在の主役取得 UseCase。
 * player.mainMonsterId から該当の OwnedMonster を取得する。
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { SaveErrorCode } from '@/common/errors/AppErrorCode';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';

export class GetCurrentMainMonsterUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(): Promise<Result<OwnedMonster | null, SaveErrorCode>> {
    const result = await this.tx.load();
    if (!result.ok) return fail(result.errorCode, result.message);

    const save = result.value;
    if (!save?.player?.mainMonsterId) return ok(null);

    const main = save.ownedMonsters.find((m) => m.uniqueId === save.player!.mainMonsterId);
    return ok(main ?? null);
  }
}
