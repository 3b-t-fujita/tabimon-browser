/**
 * 冒険候補抽選 UseCase。
 * SUCCESS 時のみ候補を生成して pendingCandidate に保存する。
 * 詳細設計 v4 §8.7 候補生成に準拠。
 *
 * 重要:
 * - FAILURE / RETIRE では候補を生成しない
 * - 候補なし（抽選外れ）の場合は null を保存して ok を返す
 * - 1冒険につき候補は最大1体
 * - resultPendingFlag=false（確定済み）を前提として呼ぶこと
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { AdventureErrorCode, SaveErrorCode } from '@/common/errors/AppErrorCode';
import { AdventureResultType, AdventureSessionStatus } from '@/common/constants/enums';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import type { PendingCandidate } from '@/domain/entities/PendingCandidate';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { buildPendingCandidate } from './buildPendingCandidateService';

export type RollAdventureCandidateErrorCode =
  | typeof AdventureErrorCode.SessionCorrupt
  | typeof SaveErrorCode.SaveFailed;

export interface RollAdventureCandidatePayload {
  candidate: PendingCandidate | null;  // null = 候補なし
}

export class RollAdventureCandidateUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(
    session:    AdventureSession,
    resultType: AdventureResultType,
  ): Promise<Result<RollAdventureCandidatePayload, RollAdventureCandidateErrorCode>> {
    // ---- SESSION_COMPLETED でのみ呼ぶことを確認 ----
    if (session.status !== AdventureSessionStatus.Completed) {
      return fail(
        AdventureErrorCode.SessionCorrupt,
        `確定済みセッションではありません: status=${session.status}`,
      );
    }

    // ---- SUCCESS 以外は候補なし ----
    if (resultType !== AdventureResultType.Success) {
      return ok({ candidate: null });
    }

    // ---- 候補抽選 ----
    const candidate = await buildPendingCandidate(session);

    // ---- pendingCandidate を保存（null も明示的に保存） ----
    const saveResult = await this.tx.saveMultiple({ pendingCandidate: candidate });
    if (!saveResult.ok) {
      return fail(SaveErrorCode.SaveFailed, saveResult.message);
    }

    return ok({ candidate });
  }
}
