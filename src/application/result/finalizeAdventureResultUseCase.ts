/**
 * 冒険リザルト確定 UseCase。
 * resultPendingFlag=true → false への遷移を実行し、報酬を反映する。
 * 詳細設計 v4 §8, §10.6 二重反映防止に準拠。
 *
 * 処理内容:
 *   1. resultPendingFlag=true を確認（false なら ResultAlreadyFinal で即リターン）
 *   2. 主役モンスターに経験値を付与（レベルアップ処理込み）
 *   3. SUCCESS の場合: 次ステージ解放（unlockStageId があれば）+ clearedStageIds 追加
 *   4. resultPendingFlag=false, status=SESSION_COMPLETED に更新して保存
 *
 * 重要:
 *   - resultPendingFlag=false への遷移は保存成功後のみ
 *   - 保存失敗時は main データを汚さない（SaveTransactionService が保証）
 *   - 同一 sessionId の再確定を防ぐ（resultPendingFlag=false チェック）
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { AdventureErrorCode, SaveErrorCode } from '@/common/errors/AppErrorCode';
import { AdventureSessionStatus, AdventureResultType } from '@/common/constants/enums';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';
import { toStageId } from '@/types/ids';
import { getStageMasterById } from '@/infrastructure/master/stageMasterRepository';
import { getMonsterMasterById, computeStats } from '@/infrastructure/master/monsterMasterRepository';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { calculateAdventureRewards } from './calculateAdventureRewardsService';

export type FinalizeAdventureResultErrorCode =
  | typeof AdventureErrorCode.SessionNotFound
  | typeof AdventureErrorCode.ResultAlreadyFinal
  | typeof AdventureErrorCode.SessionCorrupt
  | typeof AdventureErrorCode.StageNotFound
  | typeof SaveErrorCode.LoadFailed
  | typeof SaveErrorCode.SaveFailed;

export interface StatGains {
  hp:  number;
  atk: number;
  def: number;
  spd: number;
}

export interface FinalizeResultPayload {
  updatedSession: AdventureSession;
  expGained:      number;
  newLevel:       number;
  leveledUp:      boolean;
  stageUnlocked:  boolean;
  resultType:     AdventureResultType;
  /** レベルアップ時のステータス上昇量。レベルアップしなかった場合は null */
  statGains:      StatGains | null;
  evolved:        boolean;
  evolvedName:    string | null;
}

export class FinalizeAdventureResultUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(
    session:    AdventureSession,
    resultType: AdventureResultType,
  ): Promise<Result<FinalizeResultPayload, FinalizeAdventureResultErrorCode>> {
    // ---- 二重反映防止 ----
    if (!session.resultPendingFlag) {
      return fail(AdventureErrorCode.ResultAlreadyFinal, '既に確定済みです（二重反映防止）');
    }

    // ---- メインセーブデータ読込 ----
    const loadResult = await this.tx.load();
    if (!loadResult.ok) return fail(SaveErrorCode.LoadFailed, loadResult.message);

    const save = loadResult.value;
    if (!save) return fail(AdventureErrorCode.SessionNotFound, 'セーブデータが存在しません');

    // ---- ステージマスタ取得 ----
    const stageMaster = await getStageMasterById(session.stageId);
    if (!stageMaster) {
      return fail(AdventureErrorCode.StageNotFound, `ステージが見つかりません: ${session.stageId}`);
    }

    // ---- 主役モンスターを取得 ----
    const mainId   = save.player?.mainMonsterId;
    const mainMon  = save.ownedMonsters.find((m) => m.uniqueId === mainId);

    // ---- 経験値計算 ----
    const oldLevel = mainMon?.level ?? 1;
    const { expGained, newLevel, newExp, leveledUp } = await calculateAdventureRewards(
      stageMaster.baseExp,
      resultType,
      oldLevel,
      mainMon?.exp ?? 0,
    );

    // ---- レベルアップ時のステータス上昇量を計算 ----
    let statGains: StatGains | null = null;
    if (leveledUp && mainMon) {
      const master   = await getMonsterMasterById(mainMon.monsterMasterId as string);
      const oldStats = computeStats(master, oldLevel);
      const newStats = computeStats(master, newLevel);
      statGains = {
        hp:  newStats.maxHp - oldStats.maxHp,
        atk: newStats.atk   - oldStats.atk,
        def: newStats.def   - oldStats.def,
        spd: newStats.spd   - oldStats.spd,
      };
    }

    // ---- 主役モンスター更新 ----
    let updatedOwned: OwnedMonster[] = save.ownedMonsters.map((m) => {
      if (m.uniqueId !== mainId) return m;
      return { ...m, level: newLevel, exp: newExp };
    });

    // ---- 進化チェック（Lv15 に到達 かつ evolvesTo がある場合）----
    let evolved = false;
    let evolvedName: string | null = null;

    if (leveledUp && newLevel >= 15 && oldLevel < 15 && mainMon) {
      const mainMaster = await getMonsterMasterById(mainMon.monsterMasterId as string);
      if (mainMaster?.evolvesTo) {
        const evoMaster = await getMonsterMasterById(mainMaster.evolvesTo);
        if (evoMaster) {
          evolved = true;
          evolvedName = evoMaster.displayName;
          updatedOwned = updatedOwned.map((m) => {
            if (m.uniqueId !== mainId) return m;
            return {
              ...m,
              monsterMasterId: mainMaster.evolvesTo as OwnedMonster['monsterMasterId'],
              displayName:     evoMaster.displayName,
              worldId:         evoMaster.worldId as unknown as OwnedMonster['worldId'],
            };
          });
        }
      }
    }

    // ---- ステージ解放（SUCCESS のみ）----
    let stageUnlocked = false;
    let unlockedIds   = [...(save.progress?.unlockedStageIds ?? [])];
    let clearedIds    = [...(save.progress?.clearedStageIds  ?? [])];

    if (resultType === AdventureResultType.Success) {
      const stageIdStr = session.stageId as string;
      if (!clearedIds.includes(stageIdStr)) {
        clearedIds = [...clearedIds, stageIdStr];
      }
      if (stageMaster.unlockStageId && !unlockedIds.includes(stageMaster.unlockStageId)) {
        unlockedIds   = [...unlockedIds, stageMaster.unlockStageId];
        stageUnlocked = true;
      }
    }

    // ---- セッション更新 ----
    const updatedSession: AdventureSession = {
      ...session,
      resultPendingFlag: false,
      status:            AdventureSessionStatus.Completed,
    };

    // ---- 保存 ----
    const saveResult = await this.tx.saveMultiple({
      ownedMonsters:    updatedOwned,
      adventureSession: updatedSession,
      progress: {
        unlockedStageIds: unlockedIds,
        clearedStageIds:  clearedIds,
      },
    });

    if (!saveResult.ok) {
      return fail(SaveErrorCode.SaveFailed, saveResult.message);
    }

    return ok({ updatedSession, expGained, newLevel, leveledUp, stageUnlocked, resultType, statGains, evolved, evolvedName });
  }
}
