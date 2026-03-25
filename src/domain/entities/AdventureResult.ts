/**
 * 冒険リザルト。詳細設計 v4 §8 に準拠。
 *
 * - 経験値は相棒のみ加算
 * - 成功時のみステージ解放更新
 * - 1冒険につき最大1候補、抽選は SUCCESS 時のみ
 * - sessionId による二重反映防止（resultPendingFlag と組み合わせて使用）
 */
import type { SessionId, CandidateId } from '@/types/ids';
import type { AdventureResultType } from '@/common/constants/enums';

export interface AdventureResult {
  /** 対応するセッションID（二重反映防止に使用） */
  readonly sessionId: SessionId;

  /** リザルト種別: SUCCESS / FAILURE / RETIRE */
  readonly resultType: AdventureResultType;

  /** 相棒に付与する経験値（補正済み） */
  readonly expGained: number;

  /** 取得素材・報酬（アイテムID → 個数） */
  readonly rewards: Readonly<Record<string, number>>;

  /**
   * 新規モンスター候補ID（PendingCandidate.candidateId）。
   * null = 候補なし。
   */
  readonly candidateId: CandidateId | null;
}
