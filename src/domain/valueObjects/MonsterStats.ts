/**
 * モンスターの戦闘ステータス。詳細設計 v4 §7 に準拠。
 * イミュータブル値オブジェクト。
 */
export interface MonsterStats {
  readonly maxHp: number;
  readonly atk:   number;
  readonly def:   number;
  readonly spd:   number;
}

export function createMonsterStats(maxHp: number, atk: number, def: number, spd: number): MonsterStats {
  return { maxHp, atk, def, spd };
}
