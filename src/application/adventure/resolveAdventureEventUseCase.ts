/**
 * イベントノード処理 UseCase。
 * EVENT ノードの内容を処理し、currentNodeIndex を次へ進めて保存する。
 * 詳細設計 v4 §6.6 イベントノード仕様に準拠。
 *
 * フェーズ6最小実装:
 *   - Heal (1):     partySnapshot の HP は固定（戦闘外では HP 変動なし）。テキスト表示のみ。
 *   - Gather (2):   テキスト表示のみ（アイテム未実装）。
 *   - Trap (3):     テキスト表示のみ（ペナルティ未実装）。
 *   - Treasure (5): テキスト表示のみ（報酬未実装）。
 *   - Special (6):  テキスト表示のみ。
 *
 * イベント処理後、currentNodeIndex を nextNodeIndex へ進めて保存する。
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { AdventureErrorCode, SaveErrorCode } from '@/common/errors/AppErrorCode';
import { AdventureSessionStatus, NodeType } from '@/common/constants/enums';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import { getStageMasterById } from '@/infrastructure/master/stageMasterRepository';
import { getNodePatternById } from '@/infrastructure/master/nodePatternRepository';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { getEventMessage } from './eventMessageHelper';

export type ResolveAdventureEventErrorCode =
  | typeof AdventureErrorCode.SessionCorrupt
  | typeof AdventureErrorCode.StageNotFound
  | typeof SaveErrorCode.LoadFailed
  | typeof SaveErrorCode.SaveFailed;

export interface ResolveAdventureEventResult {
  readonly updatedSession: AdventureSession;
  /** イベントの表示テキスト（呼び出し元が UI に表示する） */
  readonly eventMessage: string;
  /** 進行後のノード種別 */
  readonly nextNodeType: string;
}

export class ResolveAdventureEventUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(
    session: AdventureSession,
  ): Promise<Result<ResolveAdventureEventResult, ResolveAdventureEventErrorCode>> {
    // ---- パターン取得 ----
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

    // ---- EVENT ノードのみ受け付ける ----
    if (currentNode.nodeType !== NodeType.Event) {
      return fail(AdventureErrorCode.SessionCorrupt, `イベントノードではありません: type=${currentNode.nodeType}`);
    }

    if (currentNode.nextNodeIndex === undefined || currentNode.nextNodeIndex === null) {
      return fail(AdventureErrorCode.SessionCorrupt, '次のノードが定義されていません');
    }

    const nextNode = pattern.nodes.find((n) => n.nodeIndex === currentNode.nextNodeIndex);
    if (!nextNode) {
      return fail(AdventureErrorCode.SessionCorrupt, `次のノードが存在しません`);
    }

    // ---- イベントメッセージ（フェーズ6: テキストのみ） ----
    const eventMessage = getEventMessage(currentNode.eventId ?? '');

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

    return ok({ updatedSession, eventMessage, nextNodeType: nextNode.nodeType });
  }
}
