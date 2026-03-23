/**
 * SelectSupportMonsterUseCase ユニットテスト。
 * 純粋関数のため DB 不要。
 */
import { describe, it, expect } from 'vitest';
import { SelectSupportMonsterUseCase, SelectSupportErrorCode } from './selectSupportMonsterUseCase';

const useCase = new SelectSupportMonsterUseCase();
const available = ['sup-1', 'sup-2', 'sup-3'];

describe('SelectSupportMonsterUseCase', () => {
  it('空のリストに追加できる', () => {
    const result = useCase.execute([], 'sup-1', available);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual(['sup-1']);
  });

  it('1体選択済みにもう1体追加できる', () => {
    const result = useCase.execute(['sup-1'], 'sup-2', available);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual(['sup-1', 'sup-2']);
  });

  it('2体選択済みは AtCapacity エラー', () => {
    const result = useCase.execute(['sup-1', 'sup-2'], 'sup-3', available);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe(SelectSupportErrorCode.AtCapacity);
  });

  it('すでに選択中は Duplicate エラー', () => {
    const result = useCase.execute(['sup-1'], 'sup-1', available);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe(SelectSupportErrorCode.Duplicate);
  });

  it('候補に存在しない ID は NotFound エラー', () => {
    const result = useCase.execute([], 'sup-999', available);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe(SelectSupportErrorCode.NotFound);
  });

  it('元のリストは変更されない（イミュータブル）', () => {
    const original = ['sup-1'];
    const result = useCase.execute(original, 'sup-2', available);
    expect(result.ok).toBe(true);
    expect(original).toEqual(['sup-1']); // 元配列が変わっていないこと
  });
});
