/**
 * 仲間一覧取得 UseCase。
 * ownedMonsters を読み込み OwnedMonsterListViewModel を返す。
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { SaveErrorCode } from '@/common/errors/AppErrorCode';
import { GameConstants } from '@/common/constants/GameConstants';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { worldLabel, roleLabel } from '@/application/shared/labelHelpers';
import type { OwnedMonsterListViewModel } from '@/application/viewModels/ownedMonsterListViewModel';

export class GetOwnedMonstersUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(): Promise<Result<OwnedMonsterListViewModel, SaveErrorCode>> {
    const result = await this.tx.load();
    if (!result.ok) return fail(result.errorCode, result.message);

    const owned = result.value?.ownedMonsters ?? [];
    return ok({
      monsters: owned.map((m) => ({
        uniqueId:    m.uniqueId,
        displayName: m.displayName,
        level:       m.level,
        worldLabel:  worldLabel(m.worldId),
        roleLabel:   roleLabel(m.role),
        isMain:      m.isMain,
      })),
      count:    owned.length,
      capacity: GameConstants.OWNED_MONSTER_CAPACITY,
    });
  }
}
