/**
 * 助っ人選択解除 UseCase（純粋関数 / DB 副作用なし）。
 * 指定の supportId を選択中リストから除外した新しい配列を返す。
 */
import type { Result } from '@/common/results/Result';
import { ok } from '@/common/results/Result';

export class RemoveSelectedSupportUseCase {
  execute(currentSelection: string[], supportId: string): Result<string[], never> {
    return ok(currentSelection.filter((id) => id !== supportId));
  }
}
