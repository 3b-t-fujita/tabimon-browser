/**
 * ステージ解放ルール。詳細設計 v4 §6.3 ステージ構成に準拠。
 * - 前ステージクリアで次ステージ解放
 * - Stage1 は初期から解放済み
 */
import type { StageId } from '@/types/ids';

/** 指定ステージが解放済みか確認する */
export function isStageUnlocked(stageId: StageId, unlockedStageIds: ReadonlySet<StageId>): boolean {
  return unlockedStageIds.has(stageId);
}

/**
 * ステージクリア時に次ステージを解放した新しいセットを返す。
 * unlockTargetStageId が null の場合はシリーズ末端（何もしない）。
 * immutable: 既存のセットを変更せず新しいセットを返す。
 */
export function applyStageUnlock(
  unlockedStageIds: ReadonlySet<StageId>,
  unlockTargetStageId: StageId | null
): Set<StageId> {
  const next = new Set<StageId>(unlockedStageIds);
  if (unlockTargetStageId !== null) {
    next.add(unlockTargetStageId);
  }
  return next;
}
