/**
 * DamageCalculator 単体テスト。
 * 詳細設計 v4 §7.6 ダメージ計算式の検証。
 */
import { describe, it, expect } from 'vitest';
import {
  calcDamage,
  calcHeal,
  clampHp,
  DEFENSE_COEFF,
  RAND_MIN,
  RAND_MAX,
  NORMAL_ATK_PWR,
} from './DamageCalculator';

describe('calcDamage', () => {
  it('ランダム固定値（1.0）でダメージが正しく計算される', () => {
    // base = 100 * 1.0 - 50 * 0.5 = 75, rand=1.0 → floor(75 * 1.0) = 75
    expect(calcDamage(100, 1.0, 50, () => 1.0)).toBe(
      Math.floor(75 * (RAND_MIN + 1.0 * (RAND_MAX - RAND_MIN))),
    );
  });

  it('ランダム固定値（0.0）でダメージが最小乱数になる', () => {
    // base = 100 * 1.0 - 50 * 0.5 = 75, rand=RAND_MIN=0.95 → floor(75 * 0.95) = 71
    expect(calcDamage(100, 1.0, 50, () => 0.0)).toBe(Math.floor(75 * RAND_MIN));
  });

  it('ダメージは最低 1 になる（DEF が ATK を大幅に上回る場合）', () => {
    // base = 10 * 1.0 - 1000 * 0.5 = 10 - 500 = -490 → max(1, -490) = 1
    const dmg = calcDamage(10, 1.0, 1000, () => 0.5);
    expect(dmg).toBe(1);
  });

  it('スキル威力係数が正しく適用される', () => {
    // base = 100 * 1.5 - 0 * 0.5 = 150, rand=1.0
    const expected = Math.floor(150 * (RAND_MIN + 1.0 * (RAND_MAX - RAND_MIN)));
    expect(calcDamage(100, 1.5, 0, () => 1.0)).toBe(expected);
  });

  it('通常攻撃威力係数 NORMAL_ATK_PWR=1.0 が定義されている', () => {
    expect(NORMAL_ATK_PWR).toBe(1.0);
  });

  it('DEFENSE_COEFF は 0.5 である', () => {
    expect(DEFENSE_COEFF).toBe(0.5);
  });

  it('ランダム幅が ±5% の範囲（RAND_MIN=0.95, RAND_MAX=1.05）', () => {
    expect(RAND_MIN).toBe(0.95);
    expect(RAND_MAX).toBe(1.05);
  });
});

describe('calcHeal', () => {
  it('回復量が正しく計算される', () => {
    // floor(100 * 0.8) = 80
    expect(calcHeal(100, 0.8)).toBe(80);
  });

  it('回復量は最低 1 になる', () => {
    expect(calcHeal(0, 0.0)).toBe(1);
  });

  it('威力係数 1.0 では ATK がそのまま回復量になる', () => {
    expect(calcHeal(50, 1.0)).toBe(50);
  });
});

describe('clampHp', () => {
  it('HP が maxHp を超えない', () => {
    expect(clampHp(150, 100)).toBe(100);
  });

  it('HP が 0 未満にならない', () => {
    expect(clampHp(-10, 100)).toBe(0);
  });

  it('範囲内の値はそのまま返る', () => {
    expect(clampHp(60, 100)).toBe(60);
  });

  it('HP=0 はそのまま 0 を返す', () => {
    expect(clampHp(0, 100)).toBe(0);
  });
});
