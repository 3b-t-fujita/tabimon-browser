/**
 * 仲間所持上限ルール。詳細設計 v4 §4.5 所持制御、§5.2 制約に準拠。
 * 仲間上限: 10体（GameConstants.OWNED_MONSTER_CAPACITY）
 */
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';
import { GameConstants } from '@/common/constants/GameConstants';

/** 仲間枠に空きがあるか確認する */
export function hasOwnedCapacity(owned: readonly OwnedMonster[]): boolean {
  return owned.length < GameConstants.OWNED_MONSTER_CAPACITY;
}

/** 現在の仲間数が上限に達しているか確認する */
export function isOwnedAtCapacity(owned: readonly OwnedMonster[]): boolean {
  return owned.length >= GameConstants.OWNED_MONSTER_CAPACITY;
}
