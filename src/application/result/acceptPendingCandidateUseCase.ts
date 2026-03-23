/**
 * 候補受取 UseCase。
 * pendingCandidate を仲間リストに追加し、セッションをクローズする。
 * 詳細設計 v4 §8.8 候補受取に準拠。
 *
 * 仲間上限 (5) に達している場合は CAPACITY_FULL エラーを返す。
 * → 呼び出し元が入替画面へ誘導すること。
 *
 * 受取成功後:
 *   - pendingCandidate = null
 *   - ownedMonsters に新モンスターを追加
 *   - adventureSession = null（クローズ）
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { AdventureErrorCode, MonsterErrorCode, SaveErrorCode } from '@/common/errors/AppErrorCode';
import { RoleType, WorldId as WorldIdEnum } from '@/common/constants/enums';
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';
import { toMonsterId, toMonsterMasterId, toSkillId } from '@/types/ids';
import { hasOwnedCapacity } from '@/domain/policies/OwnedCapacityPolicy';
import { getMonsterMasterById } from '@/infrastructure/master/monsterMasterRepository';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';

export type AcceptPendingCandidateErrorCode =
  | typeof AdventureErrorCode.SessionNotFound
  | typeof MonsterErrorCode.OwnedCapacityFull
  | typeof SaveErrorCode.LoadFailed
  | typeof SaveErrorCode.SaveFailed;

export interface AcceptPendingCandidatePayload {
  addedMonster: OwnedMonster;
}

// 数値ロール → RoleType マッピング
function toRoleType(role: number): RoleType {
  switch (role) {
    case 1: return RoleType.Attack;
    case 2: return RoleType.Guard;
    case 3: return RoleType.Support;
    default: return RoleType.Attack;
  }
}

// 数値ワールドID → WorldIdEnum マッピング
function toWorldIdEnum(worldId: number): WorldIdEnum {
  switch (worldId) {
    case 1: return WorldIdEnum.Forest;
    case 2: return WorldIdEnum.Volcano;
    case 3: return WorldIdEnum.Ice;
    default: return WorldIdEnum.Forest;
  }
}

export class AcceptPendingCandidateUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(): Promise<Result<AcceptPendingCandidatePayload, AcceptPendingCandidateErrorCode>> {
    // ---- セーブデータ読込 ----
    const loadResult = await this.tx.load();
    if (!loadResult.ok) return fail(SaveErrorCode.LoadFailed, loadResult.message);

    const save = loadResult.value;
    if (!save) return fail(AdventureErrorCode.SessionNotFound, 'セーブデータがありません');

    const candidate = save.pendingCandidate;
    if (!candidate) {
      return fail(AdventureErrorCode.SessionNotFound, '受取候補が存在しません');
    }

    // ---- 上限確認 ----
    if (!hasOwnedCapacity(save.ownedMonsters)) {
      return fail(MonsterErrorCode.OwnedCapacityFull, '仲間が上限に達しています（入替が必要です）');
    }

    // ---- モンスターマスタ取得 ----
    const master = await getMonsterMasterById(candidate.monsterMasterId as string);

    // ---- OwnedMonster 構築 ----
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

    // ---- 保存（候補削除 + 仲間追加 + セッションクローズ） ----
    const saveResult = await this.tx.saveMultiple({
      ownedMonsters:    [...save.ownedMonsters, newMonster],
      pendingCandidate: null,
      adventureSession: null,
    });

    if (!saveResult.ok) {
      return fail(SaveErrorCode.SaveFailed, saveResult.message);
    }

    return ok({ addedMonster: newMonster });
  }
}
