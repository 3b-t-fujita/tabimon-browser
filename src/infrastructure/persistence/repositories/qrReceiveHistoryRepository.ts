/**
 * QrReceiveHistoryRepository 実装。
 * main_save の qrReceiveHistory フィールドを読み書きする。
 *
 * 重要（詳細設計 v4 §9.7）:
 *   QR見送り時は append を呼ばないこと。
 *   受取確定（仲間化 or 助っ人登録）後にのみ append を呼ぶ。
 */
import type { QrReceiveHistoryRepository } from '@/application/ports/SaveRepositoryPort';
import type { QrReceiveHistoryEntry } from '@/infrastructure/storage/models';
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { SaveErrorCode } from '@/common/errors/AppErrorCode';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';

export class QrReceiveHistoryRepositoryImpl implements QrReceiveHistoryRepository {
  constructor(private readonly tx: SaveTransactionService) {}

  async loadAll(): Promise<Result<QrReceiveHistoryEntry[], SaveErrorCode>> {
    const result = await this.tx.load();
    if (!result.ok) return fail(result.errorCode, result.message);
    return ok([...(result.value?.qrReceiveHistory ?? [])]);
  }

  /**
   * 受取履歴に1件追加する。
   * 現在の履歴末尾に entry を追加して saveMultiple へ渡す。
   *
   * 注意: QR見送り時はこのメソッドを呼ばないこと。
   */
  async append(entry: QrReceiveHistoryEntry): Promise<Result<void, SaveErrorCode>> {
    const loadResult = await this.tx.load();
    if (!loadResult.ok) return fail(loadResult.errorCode, loadResult.message);

    const current = loadResult.value?.qrReceiveHistory ?? [];
    const updated = [...current, entry];
    return this.tx.saveMultiple({ qrReceiveHistory: updated });
  }
}
