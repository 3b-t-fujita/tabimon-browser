/**
 * 助っ人所持上限ルール。詳細設計 v4 §4.5 所持制御、§5.2 制約に準拠。
 * 助っ人上限: 10体（GameConstants.SUPPORT_MONSTER_CAPACITY）
 */
import type { SupportMonster } from '@/domain/entities/SupportMonster';
import { GameConstants } from '@/common/constants/GameConstants';

/** 助っ人枠に空きがあるか確認する */
export function hasSupportCapacity(supports: readonly SupportMonster[]): boolean {
  return supports.length < GameConstants.SUPPORT_MONSTER_CAPACITY;
}

/** 現在の助っ人数が上限に達しているか確認する */
export function isSupportAtCapacity(supports: readonly SupportMonster[]): boolean {
  return supports.length >= GameConstants.SUPPORT_MONSTER_CAPACITY;
}
