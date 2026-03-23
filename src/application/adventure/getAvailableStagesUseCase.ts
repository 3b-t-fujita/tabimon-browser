/**
 * 解放済みステージ一覧取得 UseCase。
 * 詳細設計 v4 §6.3 に準拠。
 *
 * - stageNo===1 のステージは常に解放（初期解放）
 * - それ以外は progress.unlockedStageIds に含まれる場合に解放
 * - 全9ステージを解放フラグ付きで返す
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { SaveErrorCode } from '@/common/errors/AppErrorCode';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { getAllStageMasters } from '@/infrastructure/master/stageMasterRepository';
import { isStageUnlocked } from '@/domain/policies/StageUnlockPolicy';
import { toStageId } from '@/types/ids';
import type { StageId } from '@/types/ids';
import type { StageSelectViewModel } from '@/application/viewModels/stageSelectViewModel';

function worldLabel(worldId: number): string {
  switch (worldId) {
    case 1: return 'ミドリの森';
    case 2: return 'ほのおの山';
    case 3: return 'こおりの地';
    default: return `ワールド${worldId}`;
  }
}

function difficultyLabel(difficulty: string): string {
  switch (difficulty) {
    case 'Easy':   return 'やさしい';
    case 'Normal': return 'ふつう';
    case 'Hard':   return 'むずかしい';
    default:       return difficulty;
  }
}

export class GetAvailableStagesUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(): Promise<Result<StageSelectViewModel, typeof SaveErrorCode.LoadFailed>> {
    const loadResult = await this.tx.load();
    if (!loadResult.ok) return fail(SaveErrorCode.LoadFailed, loadResult.message);
    const save = loadResult.value;

    const unlockedSet = new Set<StageId>(
      (save?.progress?.unlockedStageIds ?? []).map(toStageId),
    );

    const masters = await getAllStageMasters();

    const stages = masters.map((m) => {
      // stageNo===1 は常に解放
      const isUnlocked = m.stageNo === 1 || isStageUnlocked(toStageId(m.stageId), unlockedSet);
      const wLabel = worldLabel(m.worldId);
      return {
        stageId:          m.stageId,
        stageName:        `${wLabel} Stage ${m.stageNo}`,
        worldLabel:       wLabel,
        difficulty:       difficultyLabel(m.difficulty),
        recommendedLevel: m.recommendedLevel,
        isUnlocked,
      };
    });

    return ok({ stages });
  }
}
