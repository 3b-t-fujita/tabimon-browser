/**
 * 助っ人追加 UseCase（純粋関数 / DB 副作用なし）。
 * 詳細設計 v4 §4.3 編成、§12 編成に準拠。
 *
 * ルール:
 *   - 最大 PARTY_MAX_SUPPORTS (2) 体まで
 *   - 重複不可
 *   - 対象が存在しなければ追加しない
 *
 * DB 書き込みは行わない。選択結果は Zustand store で保持し、
 * 冒険開始時（フェーズ5）に AdventureSession へスナップショットする。
 */
import { GameConstants } from '@/common/constants/GameConstants';
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';

export const SelectSupportErrorCode = {
  AtCapacity:   'SELECT_SUPPORT_AT_CAPACITY',
  Duplicate:    'SELECT_SUPPORT_DUPLICATE',
  NotFound:     'SELECT_SUPPORT_NOT_FOUND',
} as const;
export type SelectSupportErrorCode = typeof SelectSupportErrorCode[keyof typeof SelectSupportErrorCode];

export class SelectSupportMonsterUseCase {
  execute(
    currentSelection: string[],
    supportId:        string,
    availableSupportIds: string[],
  ): Result<string[], SelectSupportErrorCode> {
    if (!availableSupportIds.includes(supportId)) {
      return fail(SelectSupportErrorCode.NotFound, `助っ人が見つかりません: ${supportId}`);
    }
    if (currentSelection.includes(supportId)) {
      return fail(SelectSupportErrorCode.Duplicate, 'すでに選択済みの助っ人です');
    }
    if (currentSelection.length >= GameConstants.PARTY_MAX_SUPPORTS) {
      return fail(SelectSupportErrorCode.AtCapacity, `助っ人は最大${GameConstants.PARTY_MAX_SUPPORTS}体まで選択できます`);
    }
    return ok([...currentSelection, supportId]);
  }
}
