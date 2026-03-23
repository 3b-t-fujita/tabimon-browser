/**
 * 受取待ち候補モンスター。詳細設計 v4 §8.8 候補受取に準拠。
 *
 * - 受取確定前は一時領域にのみ保持する
 * - 正式保存は確定操作時
 * - 候補上限到達時は入替画面へ（QR上限時の単純拒否とは異なる）
 *
 * 保存先: IndexedDB main_save → pendingCandidate ストア
 */
import type { CandidateId, MonsterMasterId, MonsterId, SessionId } from '@/types/ids';
import type { PersonalityType } from '@/common/constants/enums';

export interface PendingCandidate {
  /** 候補固有ID（UUID） */
  readonly candidateId: CandidateId;

  /** モンスター種別マスタID */
  readonly monsterMasterId: MonsterMasterId;

  /**
   * 生成された個体固有ID。
   * 受取時に OwnedMonster.uniqueId になる。
   */
  readonly sourceUniqueMonsterIdFromCandidate: MonsterId;

  /** ランダム付与された性格 */
  readonly personalityId: PersonalityType;

  /** 由来のセッションID */
  readonly originSessionId: SessionId;
}
