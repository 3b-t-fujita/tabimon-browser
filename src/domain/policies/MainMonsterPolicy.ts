/**
 * 相棒設定・手放しのルール。詳細設計 v4 §4.5 所持制御、§5.2 制約に準拠。
 *
 * - 相棒は仲間のみ設定可能（助っ人を相棒にはできない）
 * - 相棒設定中のモンスターは手放し不可
 */
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';
import type { MonsterId } from '@/types/ids';

/** 相棒に設定できるか確認する（仲間エンティティであればtrue） */
export function canSetAsMain(monster: OwnedMonster): boolean {
  return true; // OwnedMonster は仲間エンティティ。型で保証済み。
}

/**
 * 指定モンスターを手放せるか確認する。
 * 相棒設定中は手放し不可。
 */
export function canRelease(monster: OwnedMonster): boolean {
  return !monster.isMain;
}

/**
 * 新しい相棒設定を適用したモンスターリストを返す。
 * immutable: 既存の配列を変更せず新しい配列を返す。
 */
export function applyMainChange(
  allOwned: readonly OwnedMonster[],
  newMainUniqueId: MonsterId
): OwnedMonster[] {
  return allOwned.map((m) => ({
    ...m,
    isMain: m.uniqueId === newMainUniqueId,
  }));
}
