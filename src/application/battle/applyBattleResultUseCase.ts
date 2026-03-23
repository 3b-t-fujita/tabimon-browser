/**
 * 戦闘結果反映 UseCase。
 * 戦闘終了後に AdventureSession へ結果を反映して保存する。
 * 詳細設計 v4 §7, §10.3, §10.4 に準拠。
 *
 * 勝利 (WIN):
 *   - BATTLE ノード（nextNodeIndex あり）: currentNodeIndex を進め、status = SESSION_ACTIVE
 *   - BOSS ノード（nextNodeIndex なし）:   resultPendingFlag = true, status = SESSION_PENDING_RESULT
 *   - randomEventBattle === true:         EVENT ノードの nextNodeIndex へ進み、SESSION_ACTIVE
 *
 * 敗北 (LOSE):
 *   - どのノードでも:  resultPendingFlag = true, status = SESSION_PENDING_RESULT
 *
 * 共通:
 *   - battleCheckpointNodeIndex = -1（戦闘後はチェックポイント不要）
 *   - nextBattleBuffMultiplier = 1.0（戦闘後リセット）
 *   - randomEventBattle = false（戦闘後リセット）
 *
 * 重要:
 *   - 保存前に outcome を確認すること（NONE のまま呼ばないこと）
 *   - 保存失敗時は main_save を汚さない
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { AdventureErrorCode, SaveErrorCode } from '@/common/errors/AppErrorCode';
import { AdventureSessionStatus, AdventureResultType, NodeType } from '@/common/constants/enums';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import type { BattleState } from '@/domain/battle/BattleState';
import { getStageMasterById } from '@/infrastructure/master/stageMasterRepository';
import { getNodePatternById } from '@/infrastructure/master/nodePatternRepository';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';

export type ApplyBattleResultErrorCode =
  | typeof AdventureErrorCode.SessionCorrupt
  | typeof AdventureErrorCode.StageNotFound
  | typeof SaveErrorCode.SaveFailed
  | typeof SaveErrorCode.LoadFailed;

/** 反映結果：次にどの画面へ遷移すべきか */
export type BattleResultTransition =
  | 'CONTINUE_EXPLORE'  // 勝利 + 次ノードあり → 探索続行
  | 'PENDING_RESULT';   // 勝利(BOSS) or 敗北 → リザルト待ち

export interface ApplyBattleResultPayload {
  updatedSession:  AdventureSession;
  transition:      BattleResultTransition;
  /** PENDING_RESULT 時のみ設定（CONTINUE_EXPLORE 時は null） */
  resultType:      AdventureResultType | null;
}

export class ApplyBattleResultUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(
    session:     AdventureSession,
    battleState: BattleState,
  ): Promise<Result<ApplyBattleResultPayload, ApplyBattleResultErrorCode>> {
    // ---- 前提確認 ----
    if (battleState.outcome === 'NONE') {
      return fail(AdventureErrorCode.SessionCorrupt, '戦闘がまだ終了していません');
    }

    // ---- ステージ・ノード情報取得 ----
    const stageMaster = await getStageMasterById(session.stageId);
    if (!stageMaster) {
      return fail(AdventureErrorCode.StageNotFound, `ステージが見つかりません: ${session.stageId}`);
    }

    const pattern = await getNodePatternById(stageMaster.nodePatternId);
    if (!pattern) {
      return fail(AdventureErrorCode.SessionCorrupt, 'ノードパターンが見つかりません');
    }

    const currentNode = pattern.nodes.find((n) => n.nodeIndex === session.currentNodeIndex);
    if (!currentNode) {
      return fail(
        AdventureErrorCode.SessionCorrupt,
        `ノードが見つかりません: index=${session.currentNodeIndex}`,
      );
    }

    const isRandomEventBattle = session.randomEventBattle ?? false;

    // ---- 結果に応じてセッション更新 ----
    let updatedSession: AdventureSession;
    let transition: BattleResultTransition;

    if (battleState.outcome === 'WIN') {
      if (isRandomEventBattle) {
        // ランダムイベント戦闘勝利: EVENT ノードの nextNodeIndex へ進む
        if (currentNode.nextNodeIndex === undefined || currentNode.nextNodeIndex === null) {
          return fail(AdventureErrorCode.SessionCorrupt, 'イベントノードに nextNodeIndex がありません');
        }
        updatedSession = {
          ...session,
          currentNodeIndex:          currentNode.nextNodeIndex,
          battleCheckpointNodeIndex: -1,
          status:                    AdventureSessionStatus.Active,
          pendingResultType:         null,
          nextBattleBuffMultiplier:  1.0,
          randomEventBattle:         false,
        };
        transition = 'CONTINUE_EXPLORE';
      } else {
        const isBoss = currentNode.nodeType === NodeType.Boss;
        const hasNext = currentNode.nextNodeIndex !== undefined;

        if (!isBoss && hasNext) {
          // 勝利 + 通常戦闘 → 次ノードへ進む
          updatedSession = {
            ...session,
            currentNodeIndex:          currentNode.nextNodeIndex!,
            battleCheckpointNodeIndex: -1,
            status:                    AdventureSessionStatus.Active,
            pendingResultType:         null,
            nextBattleBuffMultiplier:  1.0,
            randomEventBattle:         false,
          };
          transition = 'CONTINUE_EXPLORE';
        } else {
          // 勝利 + BOSS、またはnextNodeIndexなし → リザルト待ち
          updatedSession = {
            ...session,
            battleCheckpointNodeIndex: -1,
            resultPendingFlag:         true,
            status:                    AdventureSessionStatus.PendingResult,
            pendingResultType:         AdventureResultType.Success,
            nextBattleBuffMultiplier:  1.0,
            randomEventBattle:         false,
          };
          transition = 'PENDING_RESULT';
        }
      }
    } else {
      // 敗北 → リザルト待ち
      updatedSession = {
        ...session,
        battleCheckpointNodeIndex: -1,
        resultPendingFlag:         true,
        status:                    AdventureSessionStatus.PendingResult,
        pendingResultType:         AdventureResultType.Failure,
        nextBattleBuffMultiplier:  1.0,
        randomEventBattle:         false,
      };
      transition = 'PENDING_RESULT';
    }

    // ---- resultType を決定 ----
    let resultType: AdventureResultType | null = null;
    if (transition === 'PENDING_RESULT') {
      resultType = battleState.outcome === 'WIN'
        ? AdventureResultType.Success
        : AdventureResultType.Failure;
    }

    // ---- 保存 ----
    const saveResult = await this.tx.saveMultiple({ adventureSession: updatedSession });
    if (!saveResult.ok) {
      return fail(SaveErrorCode.SaveFailed, saveResult.message);
    }

    return ok({ updatedSession, transition, resultType });
  }
}
