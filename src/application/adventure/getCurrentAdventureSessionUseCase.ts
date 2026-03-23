/**
 * 現在の AdventureSession を取得する UseCase。
 * セッションが存在しない・無効な状態の場合はエラーを返す。
 * 詳細設計 v4 §10.3 に準拠。
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { AdventureErrorCode, SaveErrorCode } from '@/common/errors/AppErrorCode';
import { AdventureSessionStatus } from '@/common/constants/enums';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';

export type GetCurrentAdventureSessionErrorCode =
  | typeof AdventureErrorCode.SessionNotFound
  | typeof AdventureErrorCode.SessionCorrupt
  | typeof SaveErrorCode.LoadFailed;

export class GetCurrentAdventureSessionUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(): Promise<Result<AdventureSession, GetCurrentAdventureSessionErrorCode>> {
    const loadResult = await this.tx.load();
    if (!loadResult.ok) return fail(SaveErrorCode.LoadFailed, loadResult.message);

    const session = loadResult.value?.adventureSession;
    if (!session) {
      return fail(AdventureErrorCode.SessionNotFound, '進行中の冒険セッションがありません');
    }

    // 有効なセッション状態か確認（Active / ActiveBattle / PendingResult）
    const validStatuses: readonly AdventureSessionStatus[] = [
      AdventureSessionStatus.Active,
      AdventureSessionStatus.ActiveBattle,
      AdventureSessionStatus.PendingResult,
    ];
    if (!validStatuses.includes(session.status)) {
      return fail(AdventureErrorCode.SessionCorrupt, `セッション状態が無効です: ${session.status}`);
    }

    return ok(session);
  }
}
