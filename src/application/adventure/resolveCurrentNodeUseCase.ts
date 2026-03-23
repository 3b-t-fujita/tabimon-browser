/**
 * 現在ノードを解決する UseCase。
 * AdventureSession の currentNodeIndex に対応する AdventureNode を返す。
 * 詳細設計 v4 §6 ノード進行仕様に準拠。
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { AdventureErrorCode, SaveErrorCode } from '@/common/errors/AppErrorCode';
import type { AdventureNode } from '@/domain/entities/NodePattern';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import { getStageMasterById } from '@/infrastructure/master/stageMasterRepository';
import { getNodePatternById } from '@/infrastructure/master/nodePatternRepository';

export type ResolveCurrentNodeErrorCode =
  | typeof AdventureErrorCode.SessionNotFound
  | typeof AdventureErrorCode.SessionCorrupt
  | typeof AdventureErrorCode.StageNotFound
  | typeof SaveErrorCode.LoadFailed;

export class ResolveCurrentNodeUseCase {
  async execute(
    session: AdventureSession,
  ): Promise<Result<AdventureNode, ResolveCurrentNodeErrorCode>> {
    const stageMaster = await getStageMasterById(session.stageId);
    if (!stageMaster) {
      return fail(AdventureErrorCode.StageNotFound, `ステージが見つかりません: ${session.stageId}`);
    }

    const pattern = await getNodePatternById(stageMaster.nodePatternId);
    if (!pattern) {
      return fail(
        AdventureErrorCode.SessionCorrupt,
        `ノードパターンが見つかりません: ${stageMaster.nodePatternId}`,
      );
    }

    const node = pattern.nodes.find((n) => n.nodeIndex === session.currentNodeIndex);
    if (!node) {
      return fail(
        AdventureErrorCode.SessionCorrupt,
        `ノードが見つかりません: index=${session.currentNodeIndex}`,
      );
    }

    return ok(node);
  }
}
