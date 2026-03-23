/**
 * 仲間手放し UseCase。
 * 詳細設計 v4 §4.5「主役設定中モンスターは手放し不可」に準拠。
 *
 * - canRelease が false の場合はエラーを返す（保存しない）
 * - 手放し成功時は ownedMonsters から除外して保存する
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { SaveErrorCode, GeneralErrorCode, MonsterErrorCode } from '@/common/errors/AppErrorCode';
import { canRelease } from '@/domain/policies/MainMonsterPolicy';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';

export const ReleaseErrorCode = {
  IsMain:       MonsterErrorCode.CannotReleaseMain,
  NotFound:     MonsterErrorCode.NotFound,
  SaveFailed:   SaveErrorCode.SaveFailed,
  LoadFailed:   SaveErrorCode.LoadFailed,
  InvalidInput: GeneralErrorCode.InvalidInput,
} as const;
export type ReleaseErrorCode = typeof ReleaseErrorCode[keyof typeof ReleaseErrorCode];

export class ReleaseOwnedMonsterUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(uniqueId: string): Promise<Result<void, ReleaseErrorCode>> {
    if (!uniqueId) return fail(ReleaseErrorCode.InvalidInput, '仲間IDが指定されていません');

    const loadResult = await this.tx.load();
    if (!loadResult.ok) return fail(ReleaseErrorCode.LoadFailed, loadResult.message);

    const save = loadResult.value;
    const monster = (save?.ownedMonsters ?? []).find((m) => m.uniqueId === uniqueId);
    if (!monster) return fail(ReleaseErrorCode.NotFound, `仲間が見つかりません: ${uniqueId}`);

    // 主役手放し不可チェック
    if (!canRelease(monster)) {
      return fail(ReleaseErrorCode.IsMain, '主役に設定されている仲間は手放せません');
    }

    const updatedOwned = (save?.ownedMonsters ?? []).filter((m) => m.uniqueId !== uniqueId);

    const saveResult = await this.tx.saveMultiple({ ownedMonsters: updatedOwned });
    if (!saveResult.ok) return fail(ReleaseErrorCode.SaveFailed, saveResult.message);

    return ok(undefined);
  }
}
