/**
 * ステージマスタ読込。public/masters/stages.json をフェッチしてキャッシュする。
 * Server / Client 両対応（fetch API）。
 */
import type { StageMaster } from '@/domain/entities/StageMaster';
import type { StageId } from '@/types/ids';
import { toStageId } from '@/types/ids';

let cache: StageMaster[] | null = null;

export async function getAllStageMasters(): Promise<StageMaster[]> {
  if (cache) return cache;
  const res  = await fetch('/masters/stages.json');
  const data = await res.json() as { items: StageMaster[] };
  cache = data.items;
  return cache;
}

export async function getStageMasterById(stageId: string): Promise<StageMaster | null> {
  const all = await getAllStageMasters();
  return all.find((s) => s.stageId === stageId) ?? null;
}

/** stageNo === 1 のステージ（初期解放対象）を返す */
export async function getInitialUnlockStageIds(): Promise<StageId[]> {
  const all = await getAllStageMasters();
  return all.filter((s) => s.stageNo === 1).map((s) => toStageId(s.stageId));
}

/** テスト用キャッシュクリア */
export function _resetStageMasterCache(): void {
  cache = null;
}
