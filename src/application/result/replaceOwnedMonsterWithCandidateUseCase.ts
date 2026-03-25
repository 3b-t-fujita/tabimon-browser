/**
 * 仲間入替受取 UseCase。
 * 仲間上限時に既存の仲間1体を手放して候補を受け取る。
 * 詳細設計 v4 §8.8 候補受取（上限時）に準拠。
 *
 * 重要:
 * - 相棒は手放し不可（MainMonsterPolicy.canRelease）
 * - 受取後: 指定モンスター削除 + 候補追加 + pendingCandidate=null + adventureSession=null
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { AdventureErrorCode, MonsterErrorCode, SaveErrorCode } from '@/common/errors/AppErrorCode';
import { RoleType, WorldId as WorldIdEnum } from '@/common/constants/enums';
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';
import { toMonsterId, toSkillId } from '@/types/ids';
import { canRelease } from '@/domain/policies/MainMonsterPolicy';
import { getMonsterMasterById } from '@/infrastructure/master/monsterMasterRepository';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import type { MonsterId } from '@/types/ids';

export type ReplaceOwnedMonsterErrorCode =
  | typeof AdventureErrorCode.SessionNotFound
  | typeof MonsterErrorCode.NotFound
  | typeof MonsterErrorCode.CannotReleaseMain
  | typeof SaveErrorCode.LoadFailed
  | typeof SaveErrorCode.SaveFailed;

export interface ReplaceOwnedMonsterPayload {
  addedMonster:    OwnedMonster;
  releasedMonster: OwnedMonster;
}

function toRoleType(role: number): RoleType {
  switch (role) {
    case 1: return RoleType.Attack;
    case 2: return RoleType.Guard;
    case 3: return RoleType.Support;
    default: return RoleType.Attack;
  }
}

function toWorldIdEnum(worldId: number): WorldIdEnum {
  switch (worldId) {
    case 1: return WorldIdEnum.Forest;
    case 2: return WorldIdEnum.Volcano;
    case 3: return WorldIdEnum.Ice;
    default: return WorldIdEnum.Forest;
  }
}

export class ReplaceOwnedMonsterWithCandidateUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(
    releaseUniqueId: MonsterId,
  ): Promise<Result<ReplaceOwnedMonsterPayload, ReplaceOwnedMonsterErrorCode>> {
    // ---- セーブデータ読込 ----
    const loadResult = await this.tx.load();
    if (!loadResult.ok) return fail(SaveErrorCode.LoadFailed, loadResult.message);

    const save = loadResult.value;
    if (!save) return fail(AdventureErrorCode.SessionNotFound, 'セーブデータがありません');

    const candidate = save.pendingCandidate;
    if (!candidate) {
      return fail(AdventureErrorCode.SessionNotFound, '入替対象の候補が存在しません');
    }

    // ---- 手放し対象を確認 ----
    const releaseTarget = save.ownedMonsters.find((m) => m.uniqueId === releaseUniqueId);
    if (!releaseTarget) {
      return fail(MonsterErrorCode.NotFound, `指定モンスターが見つかりません: ${releaseUniqueId}`);
    }

    if (!canRelease(releaseTarget)) {
      return fail(MonsterErrorCode.CannotReleaseMain, '相棒は手放せません');
    }

    // ---- モンスターマスタ取得 ----
    const master = await getMonsterMasterById(candidate.monsterMasterId as string);

    // ---- 新モンスター構築 ----
    const newMonster: OwnedMonster = {
      uniqueId:        candidate.sourceUniqueMonsterIdFromCandidate,
      monsterMasterId: candidate.monsterMasterId,
      displayName:     master?.displayName ?? (candidate.monsterMasterId as string),
      worldId:         master ? toWorldIdEnum(master.worldId) : WorldIdEnum.Forest,
      role:            master ? toRoleType(master.role) : RoleType.Attack,
      level:           1,
      exp:             0,
      personality:     candidate.personalityId,
      skillIds:        master?.initialSkillId ? [toSkillId(master.initialSkillId)] : [],
      isMain:          false,
    };

    // ---- 仲間リスト更新（手放し → 追加） ----
    const updatedOwned = save.ownedMonsters
      .filter((m) => m.uniqueId !== releaseUniqueId)
      .concat([newMonster]);

    // ---- 保存 ----
    const saveResult = await this.tx.saveMultiple({
      ownedMonsters:    updatedOwned,
      pendingCandidate: null,
      adventureSession: null,
    });

    if (!saveResult.ok) {
      return fail(SaveErrorCode.SaveFailed, saveResult.message);
    }

    return ok({ addedMonster: newMonster, releasedMonster: releaseTarget });
  }
}
