/**
 * ダメージ / 回復計算。詳細設計 v4 §7.6 ダメージ計算に準拠。
 *
 * ダメージ式:
 *   base = atk × power − def × 0.5
 *   final = floor(max(1, base) × random(0.95, 1.05))
 *
 * 回復式:
 *   heal = floor(atk × power), 最低 1
 *
 * ランダム幅: ±5%（テスト時は固定値を渡せるように randomFn を引数化）
 */

export const DEFENSE_COEFF  = 0.5;
export const RAND_MIN        = 0.95;
export const RAND_MAX        = 1.05;
export const NORMAL_ATK_PWR  = 1.0; // 通常攻撃の威力係数

/**
 * ダメージ計算（純粋関数）。
 * @param atk       攻撃者の有効ATK（バフ倍率適用済み）
 * @param power     スキル威力係数（通常攻撃 = 1.0）
 * @param def       防御者の有効DEF（バフ倍率適用済み）
 * @param randomFn  乱数生成器（テスト時に固定値を渡す用途）
 */
export function calcDamage(
  atk:      number,
  power:    number,
  def:      number,
  randomFn: () => number = Math.random,
): number {
  const base  = atk * power - def * DEFENSE_COEFF;
  const rand  = RAND_MIN + randomFn() * (RAND_MAX - RAND_MIN);
  return Math.floor(Math.max(1, base) * rand);
}

/**
 * 回復計算（純粋関数）。
 * @param atk    使用者の有効ATK
 * @param power  スキル威力係数
 */
export function calcHeal(atk: number, power: number): number {
  return Math.max(1, Math.floor(atk * power));
}

/**
 * HPを現在値にクランプする（最低0、最高maxHp）。
 */
export function clampHp(hp: number, maxHp: number): number {
  return Math.min(maxHp, Math.max(0, hp));
}
