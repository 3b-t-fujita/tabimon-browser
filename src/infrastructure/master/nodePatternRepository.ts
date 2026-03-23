/**
 * ノードパターン マスタリポジトリ。
 * /masters/node_patterns.json を fetch してキャッシュする。
 */
import type { NodePattern } from '@/domain/entities/NodePattern';

let cache: NodePattern[] | null = null;

async function loadAll(): Promise<NodePattern[]> {
  if (cache) return cache;
  const res = await fetch('/masters/node_patterns.json');
  const json = await res.json() as { items: NodePattern[] };
  cache = json.items;
  return cache;
}

export async function getNodePatternById(patternId: string): Promise<NodePattern | null> {
  const all = await loadAll();
  return all.find((p) => p.patternId === patternId) ?? null;
}

/** テスト用キャッシュリセット */
export function _resetNodePatternCache(): void {
  cache = null;
}
