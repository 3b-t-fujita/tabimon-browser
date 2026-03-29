/**
 * 冒険進行セッション。詳細設計 v4 §10.3 に準拠。
 *
 * 重要仕様:
 * - 冒険開始時に生成し、partySnapshot を固定する
 * - 冒険中に所持データが変わっても本セッションには反映しない
 * - battleCheckpoint: 戦闘開始前のノードインデックス。
 *   戦闘中クラッシュ時はこのノードから再開する（戦闘開始前へ戻す）
 * - resultPendingFlag: true=報酬未反映。
 *   false への遷移時のみ報酬/経験値/ステージ解放を反映する（二重反映防止）
 *
 * 保存先: IndexedDB の main_save 内 adventureSession ストア
 */
import type { SessionId, StageId } from '@/types/ids';
import type { AdventureResultType, AdventureSessionStatus } from '@/common/constants/enums';
import type { PartySnapshot } from '@/domain/valueObjects/PartySnapshot';

export interface AdventureSession {
  /** セッション固有ID（UUID）。リザルト二重反映防止に使用 */
  readonly sessionId: SessionId;

  /** 選択ステージID */
  readonly stageId: StageId;

  /** 現在進行中のノードインデックス */
  readonly currentNodeIndex: number;

  /**
   * 冒険開始時に固定した編成スナップショット。
   * 変更は次回冒険開始時から有効。
   */
  readonly partySnapshot: PartySnapshot;

  /**
   * 戦闘開始前に保存したノードインデックス。
   * 戦闘中クラッシュ時はこのノードから再開する。
   * -1 = 戦闘前チェックポイントなし。
   */
  readonly battleCheckpointNodeIndex: number;

  /**
   * リザルト未確定フラグ。
   * true  = 報酬未反映状態（リザルト確定処理が必要）
   * false = 反映済み（または未発生）
   * false への遷移時のみ報酬/経験値/解放を反映する。
   * 詳細設計 v4 §10.6 二重反映防止に準拠。
   */
  readonly resultPendingFlag: boolean;

  /** セッション状態 */
  readonly status: AdventureSessionStatus;

  /**
   * PENDING_RESULT 状態時のリザルト種別。
   * クラッシュ復旧時に正しいリザルト画面（?type=...）へ遷移するために使用。
   * null = まだリザルト確定前（SESSION_ACTIVE 等）。
   * 詳細設計 v4 §10.6 二重反映防止に準拠。
   */
  readonly pendingResultType: AdventureResultType | null;

  /**
   * 次の戦闘のステータス倍率（やる気アップイベント用）。
   * 1.0 = 通常、1.2 = 全ステータス×1.2。
   * 戦闘後は 1.0 にリセットする。
   */
  readonly nextBattleBuffMultiplier: number;

  /**
   * ランダムイベント戦闘フラグ。
   * true = イベント経由のランダム戦闘（ボスプールを0.7倍で使用）。
   * 戦闘後は false にリセットする。
   */
  readonly randomEventBattle: boolean;

  /**
   * 直近バトルで相棒が使用したスキル回数。
   * V3 の熟練反映用。リザルト確定後は空に戻す。
   */
  readonly resultSkillUsageCounts?: Readonly<Record<string, number>>;
}
