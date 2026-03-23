/**
 * レベル経験値テーブル読込。public/masters/level_exp.json をフェッチしてキャッシュする。
 */

export interface LevelExpEntry {
  readonly level:       number;
  readonly requiredExp: number;  // このレベルに上がるのに必要な経験値
  readonly totalExp:    number;  // Lv1 からの累積必要経験値
}

let cache: LevelExpEntry[] | null = null;

async function loadAll(): Promise<LevelExpEntry[]> {
  if (cache) return cache;
  const res  = await fetch('/masters/level_exp.json');
  const json = await res.json() as { items: LevelExpEntry[] };
  cache = json.items;
  return cache;
}

/**
 * 現在の経験値と加算経験値から新しいレベル・経験値を計算する。
 * レベル上限は MAX_LEVEL（30）。
 */
export async function applyExp(
  currentLevel: number,
  currentExp:   number,
  expGained:    number,
  maxLevel:     number,
): Promise<{ newLevel: number; newExp: number; leveledUp: boolean }> {
  const table = await loadAll();
  let level = currentLevel;
  let exp   = currentExp + expGained;

  while (level < maxLevel) {
    const nextEntry = table.find((e) => e.level === level + 1);
    if (!nextEntry) break;
    if (exp >= nextEntry.requiredExp) {
      exp -= nextEntry.requiredExp;
      level++;
    } else {
      break;
    }
  }

  // 上限到達時は余剰経験値を 0 に（または上限経験値でクランプ）
  if (level >= maxLevel) exp = 0;

  return {
    newLevel:  level,
    newExp:    exp,
    leveledUp: level > currentLevel,
  };
}

/** テスト用キャッシュリセット */
export function _resetLevelExpCache(): void {
  cache = null;
}
