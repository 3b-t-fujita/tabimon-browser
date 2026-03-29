/**
 * Home 画面用 ViewModel 構築 UseCase。
 * 保存データを受け取り、UI に必要な形に整形する。
 * component が Domain オブジェクトを直接知る必要をなくす。
 */
import type { MainSaveSnapshot } from '@/infrastructure/storage/models';
import type { HomeViewModel } from '@/application/viewModels/homeViewModel';
import { GameConstants } from '@/common/constants/GameConstants';
import { AdventureSessionStatus } from '@/common/constants/enums';
import { buildMainMonsterGrowthSummary } from './buildMainMonsterGrowthSummary';

export class BuildHomeViewModelUseCase {
  execute(save: MainSaveSnapshot): HomeViewModel {
    const player        = save.player;
    const session       = save.adventureSession;
    const ownedMonsters = save.ownedMonsters;
    const supportMonsters = save.supportMonsters;

    // 相棒情報
    const mainMonster = player?.mainMonsterId
      ? ownedMonsters.find((m) => m.uniqueId === player.mainMonsterId) ?? null
      : null;

    // 続きから判定
    const canContinue   = session !== null && session !== undefined;
    const continueType  = canContinue
      ? (session!.status === AdventureSessionStatus.PendingResult ? 'PENDING_RESULT' : 'ACTIVE')
      : null;
    const mainMonsterCurrentExp = mainMonster?.currentExp ?? mainMonster?.exp ?? null;
    const mainMonsterBondPoints = mainMonster?.bondPoints ?? 0;
    const growthSummary = buildMainMonsterGrowthSummary({
      level: mainMonster?.level ?? null,
      currentExp: mainMonsterCurrentExp,
      bondPoints: mainMonsterBondPoints,
    });

    return {
      playerName:       player?.playerName ?? '（未設定）',
      mainMonsterName:      mainMonster?.displayName ?? '',
      mainMonsterLevel:     mainMonster?.level ?? null,
      mainMonsterCurrentExp,
      mainMonsterExpToNextLevel: growthSummary.expToNextLevel,
      mainMonsterExpProgressRatio: growthSummary.expProgressRatio,
      mainMonsterBondPoints,
      mainMonsterBondRank: growthSummary.bondRank,
      mainMonsterBondToNextRank: growthSummary.bondToNextRank,
      mainMonsterBondProgressRatio: growthSummary.bondProgressRatio,
      mainMonsterId:        player?.mainMonsterId ?? null,
      mainMonsterMasterId:  mainMonster?.monsterMasterId ?? null,
      ownedCount:       ownedMonsters.length,
      ownedCapacity:    GameConstants.OWNED_MONSTER_CAPACITY,
      supportCount:     supportMonsters.length,
      supportCapacity:  GameConstants.SUPPORT_MONSTER_CAPACITY,
      canContinue,
      continueStageId:  session?.stageId ?? null,
      continueType,
    };
  }
}
