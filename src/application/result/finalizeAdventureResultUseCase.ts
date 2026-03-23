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
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { calculateAdventureRewards } from './calculateAdventureRewardsService';

export type FinalizeAdventureResultErrorCode =
  | typeof AdventureErrorCode.SessionNotFound
  | typeof AdventureErrorCode.ResultAlreadyFinal
  | typeof AdventureErrorCode.SessionCorrupt
  | typeof AdventureErrorCode.StageNotFound
  | typeof SaveErrorCode.LoadFailed
  | typeof SaveErrorCode.SaveFailed;

export interface FinalizeResultPayload {
  updatedSession: AdventureSession;
  expGained:      number;
  newLevel:       number;
  leveledUp:      boolean;
  stageUnlocked:  boolean;
  resultType:     AdventureResultType;
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
    const { expGained, newLevel, newExp, leveledUp } = await calculateAdventureRewards(
      stageMaster.baseExp,
      resultType,
      mainMon?.level  ?? 1,
      mainMon?.exp    ?? 0,
    );

    // ---- 主役モンスター更新 ----
    const updatedOwned: OwnedMonster[] = save.ownedMonsters.map((m) => {
      if (m.uniqueId !== mainId) return m;
      return { ...m, level: newLevel, exp: newExp };
    });

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

    return ok({ updatedSession, expGained, newLevel, leveledUp, stageUnlocked, resultType });
  }
}
