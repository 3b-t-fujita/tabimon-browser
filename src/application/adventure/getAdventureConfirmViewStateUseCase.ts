/**
 * 冒険開始確認画面 ViewModel 取得 UseCase。
 * ステージ選択 + 現在の編成から確認画面 ViewModel を構築する。
 *
 * バリデーション結果（canStart / cannotStartReason）も含め、
 * UI は本 UseCase の戻り値だけで表示を構成できる。
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { SaveErrorCode, AdventureErrorCode } from '@/common/errors/AppErrorCode';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { getStageMasterById } from '@/infrastructure/master/stageMasterRepository';
import { ValidateAdventureStartUseCase } from './validateAdventureStartUseCase';
import type { AdventureConfirmViewModel } from '@/application/viewModels/adventureConfirmViewModel';

function difficultyLabel(difficulty: string): string {
  switch (difficulty) {
    case 'Easy':   return 'やさしい';
    case 'Normal': return 'ふつう';
    case 'Hard':   return 'むずかしい';
    default:       return difficulty;
  }
}

function worldLabel(worldId: number): string {
  switch (worldId) {
    case 1: return 'ミドリの森';
    case 2: return 'ほのおの山';
    case 3: return 'こおりの地';
    default: return `ワールド${worldId}`;
  }
}

export type GetAdventureConfirmErrorCode =
  | typeof SaveErrorCode.LoadFailed
  | typeof AdventureErrorCode.StageNotFound;

export class GetAdventureConfirmViewStateUseCase {
  private readonly tx:          SaveTransactionService;
  private readonly validateUC:  ValidateAdventureStartUseCase;

  constructor() {
    this.tx         = new SaveTransactionService();
    this.validateUC = new ValidateAdventureStartUseCase();
  }

  async execute(
    stageId:            string,
    selectedSupportIds: readonly string[],
  ): Promise<Result<AdventureConfirmViewModel, GetAdventureConfirmErrorCode>> {
    // --- セーブロード ---
    const loadResult = await this.tx.load();
    if (!loadResult.ok) return fail(SaveErrorCode.LoadFailed, loadResult.message);
    const save = loadResult.value;

    // --- ステージマスタ ---
    const stageMaster = await getStageMasterById(stageId);
    if (!stageMaster) {
      return fail(AdventureErrorCode.StageNotFound, `ステージが見つかりません: ${stageId}`);
    }
    const wLabel = worldLabel(stageMaster.worldId);
    const stageName = `${wLabel} Stage ${stageMaster.stageNo}`;

    // --- 主役情報 ---
    const mainId  = save?.player?.mainMonsterId;
    const mainMon = save?.ownedMonsters.find((m) => m.uniqueId === mainId) ?? null;

    // --- 助っ人情報 ---
    const supports = selectedSupportIds
      .map((sid) => save?.supportMonsters.find((s) => s.supportId === sid))
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .map((s) => ({ supportId: s.supportId, displayName: s.displayName, level: s.level }));

    // --- バリデーション結果 ---
    const validateResult = await this.validateUC.execute({ stageId, selectedSupportIds });
    const canStart         = validateResult.ok;
    const cannotStartReason = validateResult.ok
      ? null
      : (validateResult.message ?? 'バリデーションエラー');

    const vm: AdventureConfirmViewModel = {
      stageId,
      stageName,
      difficulty:       difficultyLabel(stageMaster.difficulty),
      recommendedLevel: stageMaster.recommendedLevel,
      main:             mainMon ? { displayName: mainMon.displayName, level: mainMon.level } : null,
      supports,
      canStart,
      cannotStartReason,
    };

    return ok(vm);
  }
}
