/**
 * 敵グループマスタリポジトリ。
 * /masters/enemy_groups.json を fetch してキャッシュする。
 */

export interface EnemyEntry {
  readonly monsterMasterId: string;
  readonly level:           number;
  readonly displayName:     string;
}

export interface EnemyGroupData {
  readonly poolId:  string;
  readonly enemies: readonly EnemyEntry[];
}

let cache: EnemyGroupData[] | null = null;

async function loadAll(): Promise<EnemyGroupData[]> {
  if (cache) return cache;
  const res  = await fetch('/masters/enemy_groups.json');
  const json = await res.json() as { items: EnemyGroupData[] };
  cache = json.items;
  return cache;
}

export async function getEnemyGroupByPoolId(poolId: string): Promise<EnemyGroupData | null> {
  const all = await loadAll();
  return all.find((g) => g.poolId === poolId) ?? null;
}

/** テスト用キャッシュリセット */
export function _resetEnemyGroupCache(): void {
  cache = null;
}
