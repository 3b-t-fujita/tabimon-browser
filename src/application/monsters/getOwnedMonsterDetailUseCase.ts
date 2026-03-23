/**
 * 仲間詳細取得 UseCase。
 * uniqueId を受け取り OwnedMonsterDetailViewModel を返す。
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { SaveErrorCode, MonsterErrorCode } from '@/common/errors/AppErrorCode';
import { canRelease } from '@/domain/policies/MainMonsterPolicy';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { worldLabel, roleLabel, personalityLabel } from '@/application/shared/labelHelpers';
import type { OwnedMonsterDetailViewModel } from '@/application/viewModels/ownedMonsterDetailViewModel';

export type GetDetailErrorCode = SaveErrorCode | typeof MonsterErrorCode.NotFound;

export class GetOwnedMonsterDetailUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(uniqueId: string): Promise<Result<OwnedMonsterDetailViewModel, GetDetailErrorCode>> {
    const result = await this.tx.load();
    if (!result.ok) return fail(result.errorCode as GetDetailErrorCode, result.message);

    const monster = (result.value?.ownedMonsters ?? []).find((m) => m.uniqueId === uniqueId);
    if (!monster) return fail(MonsterErrorCode.NotFound, `Monster not found: ${uniqueId}`);

    return ok({
      uniqueId:          monster.uniqueId,
      displayName:       monster.displayName,
      monsterMasterId:   monster.monsterMasterId,
      level:             monster.level,
      exp:               monster.exp,
      worldLabel:        worldLabel(monster.worldId),
      roleLabel:         roleLabel(monster.role),
      personalityLabel:  personalityLabel(monster.personality),
      skillIds:          [...monster.skillIds],
      isMain:            monster.isMain,
      canRelease:        canRelease(monster),
    });
  }
}
