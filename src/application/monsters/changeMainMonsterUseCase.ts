/**
 * 相棒変更 UseCase。
 * 詳細設計 v4 §4.5 / §5.2 に準拠。
 *
 * - 相棒は仲間からのみ設定可能（OwnedMonster であれば常に true）
 * - 変更後は player.mainMonsterId と ownedMonsters.isMain を更新して保存する
 * - 保存は SaveTransactionService 経由（temp → validate → main）
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { SaveErrorCode, MonsterErrorCode, GeneralErrorCode } from '@/common/errors/AppErrorCode';
import { applyMainChange } from '@/domain/policies/MainMonsterPolicy';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { toMonsterId } from '@/types/ids';

export type ChangeMainErrorCode = SaveErrorCode | typeof MonsterErrorCode.NotFound | typeof GeneralErrorCode.InvalidInput;

export class ChangeMainMonsterUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(newMainUniqueId: string): Promise<Result<void, ChangeMainErrorCode>> {
    if (!newMainUniqueId) return fail(GeneralErrorCode.InvalidInput, '相棒IDが指定されていません');

    const loadResult = await this.tx.load();
    if (!loadResult.ok) return fail(loadResult.errorCode as ChangeMainErrorCode, loadResult.message);

    const save = loadResult.value;
    if (!save?.player) return fail(GeneralErrorCode.InvalidInput, '保存データが存在しません');

    // 対象モンスターが仲間に存在するか確認
    const target = save.ownedMonsters.find((m) => m.uniqueId === newMainUniqueId);
    if (!target) return fail(MonsterErrorCode.NotFound, `仲間が見つかりません: ${newMainUniqueId}`);

    // isMain フラグをリビルドする
    const updatedOwned  = applyMainChange(save.ownedMonsters, toMonsterId(newMainUniqueId));
    const updatedPlayer = { ...save.player, mainMonsterId: toMonsterId(newMainUniqueId) };

    // 仲間リストと player を同時保存
    return this.tx.saveMultiple({
      player:        updatedPlayer,
      ownedMonsters: updatedOwned,
    }) as Promise<Result<void, ChangeMainErrorCode>>;
  }
}
