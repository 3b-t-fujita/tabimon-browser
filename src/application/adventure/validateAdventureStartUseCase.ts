/**
 * 冒険開始前バリデーション UseCase。
 * 詳細設計 v4 §4.1〜4.4 / §13 バリデーション要件に準拠。
 *
 * チェック項目（順序固定）:
 *   1. セーブデータ / プレイヤー存在確認
 *   2. 主役設定済み
 *   3. ステージ選択済み
 *   4. ステージがマスタに存在する
 *   5. ステージが解放済み（stageNo===1 は常に解放）
 *   6. 助っ人選択数 0〜2
 *   7. 助っ人重複なし
 *   8. 各助っ人が supportMonsters に存在する
 *   9. 進行中 AdventureSession との衝突チェック
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { AdventureErrorCode, MonsterErrorCode, SaveErrorCode } from '@/common/errors/AppErrorCode';
import { AdventureSessionStatus } from '@/common/constants/enums';
import { GameConstants } from '@/common/constants/GameConstants';
import { isStageUnlocked } from '@/domain/policies/StageUnlockPolicy';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { getStageMasterById } from '@/infrastructure/master/stageMasterRepository';
import type { StageId } from '@/types/ids';
import { toStageId } from '@/types/ids';

export type ValidateAdventureStartErrorCode =
  | typeof AdventureErrorCode[keyof typeof AdventureErrorCode]
  | typeof MonsterErrorCode.NotFound
  | typeof MonsterErrorCode.SupportCapacityFull
  | typeof MonsterErrorCode.DuplicateSupport
  | typeof SaveErrorCode.LoadFailed;

export interface ValidateAdventureStartInput {
  readonly stageId:           string;
  readonly selectedSupportIds: readonly string[];
}

export class ValidateAdventureStartUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(
    input: ValidateAdventureStartInput,
  ): Promise<Result<void, ValidateAdventureStartErrorCode>> {
    // --- 1. セーブロード ---
    const loadResult = await this.tx.load();
    if (!loadResult.ok) return fail(SaveErrorCode.LoadFailed, loadResult.message);
    const save = loadResult.value;

    // --- 2. プレイヤー / 主役 ---
    if (!save?.player) {
      return fail(AdventureErrorCode.NoMainMonster, 'セーブデータが存在しません');
    }
    if (!save.player.mainMonsterId) {
      return fail(AdventureErrorCode.NoMainMonster, '主役が設定されていません');
    }

    // --- 3. ステージ選択 ---
    if (!input.stageId) {
      return fail(AdventureErrorCode.NoStageSelected, 'ステージが選択されていません');
    }

    // --- 4. ステージがマスタに存在する ---
    const stageMaster = await getStageMasterById(input.stageId);
    if (!stageMaster) {
      return fail(AdventureErrorCode.StageNotFound, `ステージが見つかりません: ${input.stageId}`);
    }

    // --- 5. ステージ解放チェック（stageNo===1 は常に解放） ---
    if (stageMaster.stageNo !== 1) {
      const unlockedSet = new Set<StageId>(
        (save.progress?.unlockedStageIds ?? []).map(toStageId),
      );
      if (!isStageUnlocked(toStageId(input.stageId), unlockedSet)) {
        return fail(AdventureErrorCode.StageNotUnlocked, 'このステージはまだ解放されていません');
      }
    }

    // --- 6. 助っ人選択数 ---
    if (input.selectedSupportIds.length > GameConstants.PARTY_MAX_SUPPORTS) {
      return fail(
        MonsterErrorCode.SupportCapacityFull,
        `助っ人は最大${GameConstants.PARTY_MAX_SUPPORTS}体までです`,
      );
    }

    // --- 7. 助っ人重複 ---
    const deduplicated = new Set(input.selectedSupportIds);
    if (deduplicated.size !== input.selectedSupportIds.length) {
      return fail(MonsterErrorCode.DuplicateSupport, '同じ助っ人を重複して選択できません');
    }

    // --- 8. 各助っ人が supportMonsters に存在 ---
    for (const sid of input.selectedSupportIds) {
      const exists = save.supportMonsters.some((s) => s.supportId === sid);
      if (!exists) {
        return fail(MonsterErrorCode.NotFound, `助っ人が見つかりません: ${sid}`);
      }
    }

    // --- 9. 進行中セッション衝突チェック ---
    const session = save.adventureSession;
    if (
      session &&
      (session.status === AdventureSessionStatus.Active ||
       session.status === AdventureSessionStatus.ActiveBattle)
    ) {
      return fail(AdventureErrorCode.ActiveSession, '進行中の冒険があります。続きから再開してください');
    }

    return ok(undefined);
  }
}
