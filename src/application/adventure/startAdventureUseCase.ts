/**
 * 冒険開始 UseCase。詳細設計 v4 §4.4 / §14 に準拠。
 *
 * 処理順:
 *   1. バリデーション（ValidateAdventureStartUseCase と同等）
 *   2. PartySnapshot 構築
 *   3. AdventureSession 生成
 *   4. saveMultiple で保存（temp→validate→main）
 *   5. AdventureSession を返す
 *
 * 重要:
 *   - currentNodeIndex = 0
 *   - battleCheckpointNodeIndex = -1 (null 相当)
 *   - resultPendingFlag = true
 *   - status = SESSION_ACTIVE
 *   - partySnapshot は開始時点で固定
 *   - 「開始ボタンを押せたらOK」ではなく保存成功までを開始成立とする
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { AdventureErrorCode, MonsterErrorCode, SaveErrorCode } from '@/common/errors/AppErrorCode';
import { AdventureSessionStatus } from '@/common/constants/enums';
import { GameConstants } from '@/common/constants/GameConstants';
import { isStageUnlocked } from '@/domain/policies/StageUnlockPolicy';
import { isFarmStageUnlocked } from '@/domain/policies/farmStageUnlockPolicy';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { getStageMasterById } from '@/infrastructure/master/stageMasterRepository';
import { buildPartySnapshot } from './buildPartySnapshotService';
import { toSessionId, toStageId } from '@/types/ids';
import type { StageId } from '@/types/ids';

export type StartAdventureErrorCode =
  | typeof AdventureErrorCode[keyof typeof AdventureErrorCode]
  | typeof MonsterErrorCode.NotFound
  | typeof MonsterErrorCode.SupportCapacityFull
  | typeof MonsterErrorCode.DuplicateSupport
  | typeof SaveErrorCode.LoadFailed
  | typeof SaveErrorCode.SaveFailed;

export interface StartAdventureInput {
  readonly stageId:            string;
  readonly selectedSupportIds: readonly string[];
}

export class StartAdventureUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(
    input: StartAdventureInput,
  ): Promise<Result<AdventureSession, StartAdventureErrorCode>> {
    // -------- 1. ロード --------
    const loadResult = await this.tx.load();
    if (!loadResult.ok) return fail(SaveErrorCode.LoadFailed, loadResult.message);
    const save = loadResult.value;

    // -------- 2. バリデーション --------
    if (!save?.player?.mainMonsterId) {
      return fail(AdventureErrorCode.NoMainMonster, '相棒が設定されていません');
    }

    if (!input.stageId) {
      return fail(AdventureErrorCode.NoStageSelected, 'ステージが選択されていません');
    }

    const stageMaster = await getStageMasterById(input.stageId);
    if (!stageMaster) {
      return fail(AdventureErrorCode.StageNotFound, `ステージが見つかりません: ${input.stageId}`);
    }

    if (stageMaster.stageType === 'FARM') {
      const clearedStageIds = save.progress?.clearedStageIds ?? [];
      if (!isFarmStageUnlocked(stageMaster, clearedStageIds)) {
        return fail(AdventureErrorCode.StageNotUnlocked, 'このステージはまだ解放されていません');
      }
    } else if (stageMaster.stageNo !== 1) {
      const unlockedSet = new Set<StageId>(
        (save.progress?.unlockedStageIds ?? []).map(toStageId),
      );
      if (!isStageUnlocked(toStageId(input.stageId), unlockedSet)) {
        return fail(AdventureErrorCode.StageNotUnlocked, 'このステージはまだ解放されていません');
      }
    }

    if (input.selectedSupportIds.length > GameConstants.PARTY_MAX_SUPPORTS) {
      return fail(
        MonsterErrorCode.SupportCapacityFull,
        `おたすけは さいだい${GameConstants.PARTY_MAX_SUPPORTS}たいまでだよ`,
      );
    }

    const deduplicated = new Set(input.selectedSupportIds);
    if (deduplicated.size !== input.selectedSupportIds.length) {
      return fail(MonsterErrorCode.DuplicateSupport, 'おなじ おたすけは えらべないよ');
    }

    for (const sid of input.selectedSupportIds) {
      if (!save.supportMonsters.some((s) => s.supportId === sid)) {
        return fail(MonsterErrorCode.NotFound, `おたすけが みつからないよ: ${sid}`);
      }
    }

    const session = save.adventureSession;
    if (
      session &&
      (session.status === AdventureSessionStatus.Active ||
       session.status === AdventureSessionStatus.ActiveBattle)
    ) {
      return fail(AdventureErrorCode.ActiveSession, '進行中の冒険があります');
    }

    // -------- 3. PartySnapshot 構築 --------
    const partyResult = await buildPartySnapshot(save, input.selectedSupportIds);
    if (!partyResult.ok) {
      return fail(AdventureErrorCode.PartyBuildFailed, partyResult.message);
    }

    // -------- 4. AdventureSession 生成 --------
    const newSession: AdventureSession = {
      sessionId:                 toSessionId(crypto.randomUUID()),
      stageId:                   toStageId(input.stageId),
      currentNodeIndex:          0,
      partySnapshot:             partyResult.value,
      battleCheckpointNodeIndex: -1,
      resultPendingFlag:         true,
      status:                    AdventureSessionStatus.Active,
      pendingResultType:         null,
      nextBattleBuffMultiplier:  1.0,
      randomEventBattle:         false,
    };

    // -------- 5. 保存 --------
    const saveResult = await this.tx.saveMultiple({ adventureSession: newSession });
    if (!saveResult.ok) {
      return fail(SaveErrorCode.SaveFailed, saveResult.message);
    }

    return ok(newSession);
  }
}
