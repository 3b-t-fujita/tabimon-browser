/**
 * PendingCandidate 構築サービス。
 * 候補抽選プールから1体を選んで PendingCandidate を生成する。
 * 詳細設計 v4 §8.7 候補生成に準拠。
 *
 * - drop_candidates.json の重み付き抽選
 * - 個体IDは UUID で生成
 * - 性格はランダム付与
 */
import type { PendingCandidate } from '@/domain/entities/PendingCandidate';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import { PersonalityType } from '@/common/constants/enums';
import { toCandidateId, toMonsterId, toMonsterMasterId, toSessionId } from '@/types/ids';
import {
  getDropCandidatesByPoolId,
  pickWeightedRandom,
} from '@/infrastructure/master/dropCandidateRepository';
import { getStageMasterById } from '@/infrastructure/master/stageMasterRepository';

const PERSONALITIES = Object.values(PersonalityType) as PersonalityType[];

/** テスト用乱数差し替え対応: ランダム性格を返す */
function randomPersonality(randomFn: () => number = Math.random): PersonalityType {
  const idx = Math.floor(randomFn() * PERSONALITIES.length);
  return PERSONALITIES[idx];
}

/**
 * 候補抽選を行い PendingCandidate を生成する。
 * 対象プールが空か抽選結果なしの場合は null を返す（候補なし）。
 *
 * @param session     現在の AdventureSession
 * @param randomFn    テスト用乱数差し替え
 */
export async function buildPendingCandidate(
  session:  AdventureSession,
  randomFn: () => number = Math.random,
): Promise<PendingCandidate | null> {
  // ステージマスタから候補プールIDを取得
  const stageMaster = await getStageMasterById(session.stageId);
  if (!stageMaster?.candidateMonsterPoolId) return null;

  const entries = await getDropCandidatesByPoolId(stageMaster.candidateMonsterPoolId);
  const picked  = pickWeightedRandom(entries, randomFn);
  if (!picked) return null;

  return {
    candidateId:                          toCandidateId(crypto.randomUUID()),
    monsterMasterId:                      toMonsterMasterId(picked.monsterId),
    sourceUniqueMonsterIdFromCandidate:   toMonsterId(crypto.randomUUID()),
    personalityId:                        randomPersonality(randomFn),
    originSessionId:                      session.sessionId,
  };
}
