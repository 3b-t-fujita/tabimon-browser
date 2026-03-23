/**
 * ノード進行 UseCase（PASS / 通過ノード用）。
 * 現在ノードの nextNodeIndex へ currentNodeIndex を進め、保存する。
 * 詳細設計 v4 §6.4 ノード進行ルールに準拠。
 *
 * 重要:
 * - BRANCH / GOAL / BOSS / EVENT ノードにはこの UseCase を使わない
 * - 保存前に UI 側だけで currentNodeIndex を先行更新しない
 * - 保存失敗時は main を壊さない（SaveTransactionService の保証）
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { AdventureErrorCode, SaveErrorCode } from '@/common/errors/AppErrorCode';
import { AdventureSessionStatus, NodeType } from '@/common/constants/enums';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import { getStageMasterById } from '@/infrastructure/master/stageMasterRepository';
import { getNodePatternById } from '@/infrastructure/master/nodePatternRepository';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';

export type ProceedAdventureNodeErrorCode =
  | typeof AdventureErrorCode.SessionNotFound
  | typeof AdventureErrorCode.SessionCorrupt
  | typeof AdventureErrorCode.StageNotFound
  | typeof SaveErrorCode.LoadFailed
  | typeof SaveErrorCode.SaveFailed;

export interface ProceedAdventureNodeResult {
  readonly updatedSession: AdventureSession;
  /** 進行後のノード種別（次に何が起きるか） */
  readonly nextNodeType: string;
}

export class ProceedAdventureNodeUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(
    session: AdventureSession,
  ): Promise<Result<ProceedAdventureNodeResult, ProceedAdventureNodeErrorCode>> {
    // ---- 現在ノード取得 ----
    const stageMaster = await getStageMasterById(session.stageId);
    if (!stageMaster) {
      return fail(AdventureErrorCode.StageNotFound, `ステージが見つかりません: ${session.stageId}`);
    }

    const pattern = await getNodePatternById(stageMaster.nodePatternId);
    if (!pattern) {
      return fail(AdventureErrorCode.SessionCorrupt, `ノードパターンが見つかりません: ${stageMaster.nodePatternId}`);
    }

    const currentNode = pattern.nodes.find((n) => n.nodeIndex === session.currentNodeIndex);
    if (!currentNode) {
      return fail(AdventureErrorCode.SessionCorrupt, `ノードが見つかりません: index=${session.currentNodeIndex}`);
    }

    // ---- PASS ノードのみ受け付ける ----
    if (currentNode.nodeType !== NodeType.Pass) {
      return fail(
        AdventureErrorCode.SessionCorrupt,
        `このノードは自動前進できません: type=${currentNode.nodeType}`,
      );
    }

    if (currentNode.nextNodeIndex === undefined || currentNode.nextNodeIndex === null) {
      return fail(AdventureErrorCode.SessionCorrupt, '次のノードが定義されていません');
    }

    const nextNode = pattern.nodes.find((n) => n.nodeIndex === currentNode.nextNodeIndex);
    if (!nextNode) {
      return fail(AdventureErrorCode.SessionCorrupt, `次のノードが存在しません: index=${currentNode.nextNodeIndex}`);
    }

    // ---- currentNodeIndex を進める ----
    const updatedSession: AdventureSession = {
      ...session,
      currentNodeIndex: nextNode.nodeIndex,
      status: AdventureSessionStatus.Active,
    };

    // ---- 保存 ----
    const saveResult = await this.tx.saveMultiple({ adventureSession: updatedSession });
    if (!saveResult.ok) {
      return fail(SaveErrorCode.SaveFailed, saveResult.message);
    }

    return ok({ updatedSession, nextNodeType: nextNode.nodeType });
  }
}
