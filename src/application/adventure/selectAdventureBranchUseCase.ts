/**
 * 分岐選択 UseCase。
 * BRANCH ノードで選択肢を選び、currentNodeIndex を更新して保存する。
 * 詳細設計 v4 §6.5 分岐仕様に準拠。
 *
 * 重要:
 * - 分岐未選択のまま進行不可（UI 側での強制）
 * - 選択確定後に保存（保存前に currentNodeIndex を先行変更しない）
 * - 保存失敗時は main を壊さない
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { AdventureErrorCode, GeneralErrorCode, SaveErrorCode } from '@/common/errors/AppErrorCode';
import { AdventureSessionStatus, NodeType } from '@/common/constants/enums';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import { getStageMasterById } from '@/infrastructure/master/stageMasterRepository';
import { getNodePatternById } from '@/infrastructure/master/nodePatternRepository';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';

export type SelectAdventureBranchErrorCode =
  | typeof AdventureErrorCode.SessionNotFound
  | typeof AdventureErrorCode.SessionCorrupt
  | typeof AdventureErrorCode.StageNotFound
  | typeof GeneralErrorCode.InvalidInput
  | typeof SaveErrorCode.LoadFailed
  | typeof SaveErrorCode.SaveFailed;

export interface SelectAdventureBranchInput {
  readonly session:              AdventureSession;
  /** 選択した分岐先のノードインデックス */
  readonly selectedNextNodeIndex: number;
}

export class SelectAdventureBranchUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(
    input: SelectAdventureBranchInput,
  ): Promise<Result<AdventureSession, SelectAdventureBranchErrorCode>> {
    const { session, selectedNextNodeIndex } = input;

    // ---- パターン取得 ----
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

    // ---- BRANCH ノードのみ受け付ける ----
    if (currentNode.nodeType !== NodeType.Branch) {
      return fail(
        AdventureErrorCode.SessionCorrupt,
        `分岐ノードではありません: type=${currentNode.nodeType}`,
      );
    }

    // ---- 選択肢の検証 ----
    const validOptions = currentNode.branchOptions ?? [];
    const chosen = validOptions.find((opt) => opt.nextNodeIndex === selectedNextNodeIndex);
    if (!chosen) {
      return fail(GeneralErrorCode.InvalidInput, `無効な分岐選択肢です: ${selectedNextNodeIndex}`);
    }

    const targetNode = pattern.nodes.find((n) => n.nodeIndex === selectedNextNodeIndex);
    if (!targetNode) {
      return fail(AdventureErrorCode.SessionCorrupt, `分岐先ノードが存在しません: index=${selectedNextNodeIndex}`);
    }

    // ---- currentNodeIndex を分岐先へ更新 ----
    const updatedSession: AdventureSession = {
      ...session,
      currentNodeIndex: selectedNextNodeIndex,
      status: AdventureSessionStatus.Active,
    };

    // ---- 保存 ----
    const saveResult = await this.tx.saveMultiple({ adventureSession: updatedSession });
    if (!saveResult.ok) {
      return fail(SaveErrorCode.SaveFailed, saveResult.message);
    }

    return ok(updatedSession);
  }
}
