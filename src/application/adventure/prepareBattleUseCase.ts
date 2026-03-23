/**
 * 戦闘準備 UseCase。
 * BATTLE / BOSS ノードに到達した際に呼ぶ。
 * battleCheckpointNodeIndex を現在ノードに設定し、
 * status を SESSION_ACTIVE_BATTLE に更新して保存する。
 * 詳細設計 v4 §10.4 battleCheckpoint 仕様に準拠。
 *
 * 重要:
 * - battleCheckpointNodeIndex = currentNodeIndex（異常終了時にここへ戻す）
 * - status = SESSION_ACTIVE_BATTLE
 * - 保存成功後に /adventure/battle へ遷移する（呼び出し元の責務）
 * - 保存失敗時は main を壊さない
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { AdventureErrorCode, SaveErrorCode } from '@/common/errors/AppErrorCode';
import { AdventureSessionStatus, NodeType } from '@/common/constants/enums';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import { getStageMasterById } from '@/infrastructure/master/stageMasterRepository';
import { getNodePatternById } from '@/infrastructure/master/nodePatternRepository';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';

export type PrepareBattleErrorCode =
  | typeof AdventureErrorCode.SessionCorrupt
  | typeof AdventureErrorCode.StageNotFound
  | typeof SaveErrorCode.LoadFailed
  | typeof SaveErrorCode.SaveFailed;

export class PrepareBattleUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(
    session: AdventureSession,
  ): Promise<Result<AdventureSession, PrepareBattleErrorCode>> {
    // ---- 現在ノード確認 ----
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

    // ---- BATTLE / BOSS ノードのみ受け付ける ----
    if (currentNode.nodeType !== NodeType.Battle && currentNode.nodeType !== NodeType.Boss) {
      return fail(
        AdventureErrorCode.SessionCorrupt,
        `戦闘ノードではありません: type=${currentNode.nodeType}`,
      );
    }

    // ---- battleCheckpointNodeIndex を現在位置に設定 ----
    const updatedSession: AdventureSession = {
      ...session,
      battleCheckpointNodeIndex: session.currentNodeIndex,
      status: AdventureSessionStatus.ActiveBattle,
    };

    // ---- 保存 ----
    const saveResult = await this.tx.saveMultiple({ adventureSession: updatedSession });
    if (!saveResult.ok) {
      return fail(SaveErrorCode.SaveFailed, saveResult.message);
    }

    return ok(updatedSession);
  }
}
