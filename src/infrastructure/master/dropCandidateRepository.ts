/**
 * 候補ドロッププール読込。public/masters/drop_candidates.json をフェッチしてキャッシュする。
 */

export interface DropCandidateEntry {
  readonly poolId:     string;
  readonly monsterId:  string;
  readonly weight:     number;
}

let cache: DropCandidateEntry[] | null = null;

async function loadAll(): Promise<DropCandidateEntry[]> {
  if (cache) return cache;
  const res  = await fetch('/masters/drop_candidates.json');
  const json = await res.json() as { items: DropCandidateEntry[] };
  cache = json.items;
  return cache;
}

/** 指定 poolId のドロップエントリを返す */
export async function getDropCandidatesByPoolId(poolId: string): Promise<DropCandidateEntry[]> {
  const all = await loadAll();
  return all.filter((e) => e.poolId === poolId);
}

/**
 * 重み付き抽選で1体選ぶ。
 * entries が空の場合は null を返す。
 * @param randomFn テスト用乱数差し替え
 */
export function pickWeightedRandom(
  entries:  readonly DropCandidateEntry[],
  randomFn: () => number = Math.random,
): DropCandidateEntry | null {
  if (entries.length === 0) return null;
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
  let rand = randomFn() * totalWeight;
  for (const entry of entries) {
    rand -= entry.weight;
    if (rand <= 0) return entry;
  }
  return entries[entries.length - 1];
}

/** テスト用キャッシュリセット */
export function _resetDropCandidateCache(): void {
  cache = null;
}
