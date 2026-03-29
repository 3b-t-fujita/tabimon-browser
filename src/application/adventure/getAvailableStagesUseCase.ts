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
import { isFarmStageUnlocked } from '@/domain/policies/farmStageUnlockPolicy';
import {
  getFarmPrimaryEffectLabel,
  getFarmRecommendedBandLabel,
  getFarmStageName,
  getFarmSupportText,
} from '@/domain/policies/farmStagePolicy';
import { toStageId } from '@/types/ids';
import type { StageId } from '@/types/ids';
import type { StageSelectViewModel } from '@/application/viewModels/stageSelectViewModel';

function worldLabel(worldId: number): string {
  switch (worldId) {
    case 1: return 'ミドリの森';
    case 2: return 'ホノオ火山';
    case 3: return 'コオリ氷原';
    default: return `ワールド${worldId}`;
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
    const clearedStageIds = save?.progress?.clearedStageIds ?? [];

    const masters = await getAllStageMasters();

    const stages = masters.map((m) => {
      const isUnlocked = m.stageType === 'FARM'
        ? isFarmStageUnlocked(m, clearedStageIds)
        : m.stageNo === 1 || isStageUnlocked(toStageId(m.stageId), unlockedSet);
      const wLabel = worldLabel(m.worldId);
      const recommendedBandLabel =
        m.stageType === 'FARM' && m.farmCategory && m.difficultyTier
          ? getFarmRecommendedBandLabel(m.farmCategory, m.difficultyTier)
          : null;
      const primaryEffectLabel =
        m.stageType === 'FARM' && m.farmCategory && m.difficultyTier
          ? getFarmPrimaryEffectLabel(m.farmCategory, m.difficultyTier, m.baseExp)
          : null;
      const supportText =
        m.stageType === 'FARM' && m.farmCategory && m.difficultyTier
          ? getFarmSupportText(m.farmCategory, m.difficultyTier)
          : null;
      return {
        stageId:          m.stageId,
        stageName:        m.stageType === 'FARM' && m.farmCategory
          ? getFarmStageName(m.farmCategory, m.difficultyTier ?? 'EARLY')
          : `${wLabel} ステージ ${m.stageNo}`,
        worldLabel:       wLabel,
        stageType:        m.stageType,
        farmCategory:     m.farmCategory ?? null,
        difficultyTier:   m.difficultyTier ?? null,
        difficulty:       m.difficulty,
        recommendedLevel: m.recommendedLevel,
        estimatedMinutes: m.estimatedMinutes,
        firstClearBonusExp: m.firstClearBonusExp ?? null,
        recommendedBandLabel,
        primaryEffectLabel,
        supportText,
        isUnlocked,
      };
    });

    return ok({
      stages,
      storyStages: stages.filter((stage) => stage.stageType === 'STORY'),
      farmStages: stages.filter((stage) => stage.stageType === 'FARM'),
    });
  }
}
