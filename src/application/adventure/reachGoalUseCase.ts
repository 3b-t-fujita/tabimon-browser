/**
 * ゴール到達 UseCase。
 * GOAL ノードに到達した際に呼ぶ。
 * status を SESSION_PENDING_RESULT に設定して保存し、リザルト処理へ渡す。
 * 詳細設計 v4 §10.5 ゴールフローに準拠。
 *
 * 重要:
 * - resultPendingFlag = true のまま維持（リザルト未確定）
 * - 保存成功後に /adventure/result へ遷移する（呼び出し元の責務）
 * - 保存失敗時は main を壊さない
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { AdventureErrorCode, SaveErrorCode } from '@/common/errors/AppErrorCode';
import { AdventureResultType, AdventureSessionStatus, NodeType } from '@/common/constants/enums';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import { getStageMasterById } from '@/infrastructure/master/stageMasterRepository';
import { getNodePatternById } from '@/infrastructure/master/nodePatternRepository';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';

export type ReachGoalErrorCode =
  | typeof AdventureErrorCode.SessionCorrupt
  | typeof AdventureErrorCode.StageNotFound
  | typeof SaveErrorCode.LoadFailed
  | typeof SaveErrorCode.SaveFailed;

export class ReachGoalUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(
    session: AdventureSession,
  ): Promise<Result<AdventureSession, ReachGoalErrorCode>> {
    // ---- 現在ノードが GOAL であることを確認 ----
    const stageMaster = await getStageMasterById(session.stageId);
    if (!stageMaster) {
      return fail(AdventureErrorCode.StageNotFound, `ステージが見つかりません: ${session.stageId}`);
    }

    const pattern = await getNodePatternById(stageMaster.nodePatternId);
    if (!pattern) {
      return fail(AdventureErrorCode.SessionCorrupt, `ノードパターンが見つかりません`);
    }

    const currentNode = pattern.nodes.find((n) => n.nodeIndex === session.currentNodeIndex);
    if (!currentNode) {
      return fail(AdventureErrorCode.SessionCorrupt, `ノードが見つかりません: index=${session.currentNodeIndex}`);
    }

    if (currentNode.nodeType !== NodeType.Goal) {
      return fail(AdventureErrorCode.SessionCorrupt, `ゴールノードではありません: type=${currentNode.nodeType}`);
    }

    // ---- status を SESSION_PENDING_RESULT へ変更 ----
    const updatedSession: AdventureSession = {
      ...session,
      status:            AdventureSessionStatus.PendingResult,
      resultPendingFlag: true,
      pendingResultType: AdventureResultType.Success,
    };

    const saveResult = await this.tx.saveMultiple({ adventureSession: updatedSession });
    if (!saveResult.ok) {
      return fail(SaveErrorCode.SaveFailed, saveResult.message);
    }

    return ok(updatedSession);
  }
}
