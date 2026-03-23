/**
 * 冒険開始時の PartySnapshot 構築サービス。
 * 詳細設計 v4 §5.4 に準拠。
 *
 * - 主役・助っ人のスナップショットを開始時点で固定する
 * - 冒険中に所持データが変わっても本スナップショットは変更しない
 * - MonsterStats / SkillSnapshot はマスタから構築する
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { AdventureErrorCode } from '@/common/errors/AppErrorCode';
import type { MainSaveSnapshot } from '@/infrastructure/storage/models';
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';
import type { SupportMonster } from '@/domain/entities/SupportMonster';
import type { PartySnapshot } from '@/domain/valueObjects/PartySnapshot';
import type { PartyMemberSnapshot } from '@/domain/valueObjects/PartyMemberSnapshot';
import { toMonsterId } from '@/types/ids';
import type { SkillId } from '@/types/ids';
import {
  getMonsterMasterById,
  computeStats,
} from '@/infrastructure/master/monsterMasterRepository';
import { buildSkillSnapshot } from '@/infrastructure/master/skillMasterRepository';

// ---------------------------------------------------------------------------
// 内部ヘルパー
// ---------------------------------------------------------------------------

async function buildMemberSnapshot(
  uniqueId:        string,
  monsterMasterId: string,
  displayName:     string,
  personality:     OwnedMonster['personality'] | SupportMonster['personality'],
  skillIds:        readonly SkillId[],
  level:           number,
  isMain:          boolean,
): Promise<PartyMemberSnapshot> {
  const master = await getMonsterMasterById(monsterMasterId);
  const stats  = computeStats(master, level);

  // スキルスナップショット構築（マスタに存在するものだけ含める）
  const skillResults = await Promise.all(skillIds.map((id) => buildSkillSnapshot(id)));
  const skills = skillResults.filter((s): s is NonNullable<typeof s> => s !== null);

  return {
    uniqueId:        toMonsterId(uniqueId),
    monsterMasterId: monsterMasterId as PartyMemberSnapshot['monsterMasterId'],
    displayName,
    personality,
    stats,
    skills,
    isMain,
  };
}

// ---------------------------------------------------------------------------
// 公開 API
// ---------------------------------------------------------------------------

export type BuildPartySnapshotErrorCode = typeof AdventureErrorCode.PartyBuildFailed;

export async function buildPartySnapshot(
  save:               MainSaveSnapshot,
  selectedSupportIds: readonly string[],
): Promise<Result<PartySnapshot, BuildPartySnapshotErrorCode>> {
  try {
    // 主役を取得
    const mainId  = save.player?.mainMonsterId;
    const mainMon = save.ownedMonsters.find((m) => m.uniqueId === mainId);
    if (!mainMon) {
      return fail(AdventureErrorCode.PartyBuildFailed, '主役モンスターが見つかりません');
    }

    const mainSnapshot = await buildMemberSnapshot(
      mainMon.uniqueId,
      mainMon.monsterMasterId,
      mainMon.displayName,
      mainMon.personality,
      mainMon.skillIds,
      mainMon.level,
      true,
    );

    // 助っ人スナップショット構築
    const supportSnapshots: PartyMemberSnapshot[] = [];
    for (const sid of selectedSupportIds) {
      const sup = save.supportMonsters.find((s) => s.supportId === sid);
      if (!sup) continue; // 存在しない助っ人は無視

      const snapshot = await buildMemberSnapshot(
        sup.supportId,
        sup.monsterMasterId,
        sup.displayName,
        sup.personality,
        sup.skillIds,
        sup.level,
        false,
      );
      supportSnapshots.push(snapshot);
    }

    return ok({ main: mainSnapshot, supporters: supportSnapshots });
  } catch {
    return fail(AdventureErrorCode.PartyBuildFailed, 'パーティスナップショットの構築に失敗しました');
  }
}
