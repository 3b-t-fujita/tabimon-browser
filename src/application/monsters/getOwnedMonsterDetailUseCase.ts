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
import { getMonsterMasterById, computeStats } from '@/infrastructure/master/monsterMasterRepository';
import { buildSkillSnapshot } from '@/infrastructure/master/skillMasterRepository';
import { toSkillId } from '@/types/ids';
import type { OwnedMonsterDetailViewModel, MonsterSkillViewModel } from '@/application/viewModels/ownedMonsterDetailViewModel';

export type GetDetailErrorCode = SaveErrorCode | typeof MonsterErrorCode.NotFound;

export class GetOwnedMonsterDetailUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(uniqueId: string): Promise<Result<OwnedMonsterDetailViewModel, GetDetailErrorCode>> {
    const result = await this.tx.load();
    if (!result.ok) return fail(result.errorCode as GetDetailErrorCode, result.message);

    const monster = (result.value?.ownedMonsters ?? []).find((m) => m.uniqueId === uniqueId);
    if (!monster) return fail(MonsterErrorCode.NotFound, `Monster not found: ${uniqueId}`);

    // ステータス計算
    const master = await getMonsterMasterById(monster.monsterMasterId as string);
    const raw    = computeStats(master, monster.level);

    // スキル表示情報を取得
    const skillSnapshots = await Promise.all(
      (monster.skillIds as readonly string[]).map((id) => buildSkillSnapshot(toSkillId(id))),
    );
    const skills: MonsterSkillViewModel[] = skillSnapshots
      .map((snap, i) => ({
        skillId:     monster.skillIds[i] as string,
        displayName: snap?.displayName ?? monster.skillIds[i] as string,
        skillType:   snap?.skillType   ?? 'SKILL_NORMAL',
      }));

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
      skills,
      isMain:            monster.isMain,
      canRelease:        canRelease(monster),
      stats: { hp: raw.maxHp, atk: raw.atk, def: raw.def, spd: raw.spd },
    });
  }
}
