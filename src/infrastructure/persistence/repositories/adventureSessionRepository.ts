/**
 * AdventureSessionRepository 実装。
 * main_save の adventureSession フィールドを読み書き・クリアする。
 * 書き込みは SaveTransactionService 経由（temp → validate → main）。
 *
 * 重要:
 *  - battleCheckpointNodeIndex / resultPendingFlag は AdventureSession の一部として保存される。
 *  - セッションの直接 clear は adventureSession: null を saveMultiple へ渡す。
 */
import type { AdventureSessionRepository } from '@/application/ports/SaveRepositoryPort';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { SaveErrorCode } from '@/common/errors/AppErrorCode';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';

export class AdventureSessionRepositoryImpl implements AdventureSessionRepository {
  constructor(private readonly tx: SaveTransactionService) {}

  async load(): Promise<Result<AdventureSession | null, SaveErrorCode>> {
    const result = await this.tx.load();
    if (!result.ok) return fail(result.errorCode, result.message);
    return ok(result.value?.adventureSession ?? null);
  }

  async save(session: AdventureSession): Promise<Result<void, SaveErrorCode>> {
    return this.tx.saveMultiple({ adventureSession: session });
  }

  /**
   * セッションを終了してクリアする。
   * リザルト確定後・セッション無効化後に呼ぶ。
   */
  async clear(): Promise<Result<void, SaveErrorCode>> {
    return this.tx.saveMultiple({ adventureSession: null });
  }
}
