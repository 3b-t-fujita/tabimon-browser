/**
 * イベントノード処理 UseCase。
 * EVENT ノードの内容をランダム処理し、currentNodeIndex を次へ進めて保存する。
 * 詳細設計 v4 §6.6 イベントノード仕様に準拠。
 *
 * イベント種別:
 *   - HEAL (30%):    テキスト表示のみ（HP変動なし）
 *   - NOTHING (30%): 何もなし
 *   - BOOST (20%):   次の戦闘のみ全ステータス×1.2
 *   - BATTLE (20%):  ランダム遭遇戦（ボスプールを0.7倍で使用）
 *
 * イベント処理後、currentNodeIndex を nextNodeIndex へ進めて保存する。
 * BATTLE 時はノードを進めず SESSION_ACTIVE_BATTLE に遷移する。
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { AdventureErrorCode, SaveErrorCode } from '@/common/errors/AppErrorCode';
import { AdventureSessionStatus, NodeType } from '@/common/constants/enums';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import { getStageMasterById } from '@/infrastructure/master/stageMasterRepository';
import { getNodePatternById } from '@/infrastructure/master/nodePatternRepository';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { rollRandomEvent, getEventMessageForType, type RandomEventType } from './eventMessageHelper';

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
  /** 今回のランダムイベント種別 */
  readonly resolvedEventType: RandomEventType;
  /** true = イベント戦闘を即時トリガーする必要あり */
  readonly triggerBattle: boolean;
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

    // ---- ランダムイベント決定 ----
    const eventType = rollRandomEvent();
    const eventMessage = getEventMessageForType(eventType);

    // ---- イベント種別に応じてセッション更新 ----
    let updatedSession: AdventureSession;
    let triggerBattle = false;

    if (eventType === 'BATTLE') {
      // ランダム戦闘: ノードを進めず、status = SESSION_ACTIVE_BATTLE, randomEventBattle = true
      updatedSession = {
        ...session,
        nextBattleBuffMultiplier: session.nextBattleBuffMultiplier ?? 1.0,
        randomEventBattle: true,
        status: AdventureSessionStatus.ActiveBattle,
      };
      triggerBattle = true;
    } else if (eventType === 'BOOST') {
      // やる気アップ: nextBattleBuffMultiplier = 1.2、次のノードへ進む
      updatedSession = {
        ...session,
        currentNodeIndex: nextNode.nodeIndex,
        nextBattleBuffMultiplier: 1.2,
        randomEventBattle: false,
        status: AdventureSessionStatus.Active,
      };
    } else {
      // HEAL / NOTHING: 次のノードへ進む
      updatedSession = {
        ...session,
        currentNodeIndex: nextNode.nodeIndex,
        nextBattleBuffMultiplier: session.nextBattleBuffMultiplier ?? 1.0,
        randomEventBattle: false,
        status: AdventureSessionStatus.Active,
      };
    }

    // ---- 保存 ----
    const saveResult = await this.tx.saveMultiple({ adventureSession: updatedSession });
    if (!saveResult.ok) {
      return fail(SaveErrorCode.SaveFailed, saveResult.message);
    }

    return ok({
      updatedSession,
      eventMessage,
      nextNodeType: triggerBattle ? NodeType.Battle : nextNode.nodeType,
      resolvedEventType: eventType,
      triggerBattle,
    });
  }
}
