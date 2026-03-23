/**
 * 続きから可否判定 UseCase。
 * AdventureSession の有無と状態から、続きから可能かどうかを返す。
 */
import type { MainSaveSnapshot } from '@/infrastructure/storage/models';
import { AdventureSessionStatus } from '@/common/constants/enums';
import { isSessionRecoverable } from '@/domain/services/SaveConsistencyChecker';

export interface ContinueAvailability {
  readonly canContinue:  boolean;
  readonly reason:       'PENDING_RESULT' | 'ACTIVE' | 'NONE';
  readonly stageId:      string | null;
}

export class JudgeContinueAvailableUseCase {
  execute(save: MainSaveSnapshot): ContinueAvailability {
    const session = save.adventureSession;

    if (!session || !isSessionRecoverable(session)) {
      return { canContinue: false, reason: 'NONE', stageId: null };
    }

    if (session.status === AdventureSessionStatus.PendingResult) {
      return { canContinue: true, reason: 'PENDING_RESULT', stageId: session.stageId };
    }

    if (
      session.status === AdventureSessionStatus.Active ||
      session.status === AdventureSessionStatus.ActiveBattle
    ) {
      return { canContinue: true, reason: 'ACTIVE', stageId: session.stageId };
    }

    return { canContinue: false, reason: 'NONE', stageId: null };
  }
}
