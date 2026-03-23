/**
 * 編成画面初期状態取得 UseCase。
 * DB から主役 + 助っ人一覧を読み込み PartyEditViewModel を返す。
 * 選択中助っ人は Zustand 側で管理するため、初期値は空配列。
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { SaveErrorCode } from '@/common/errors/AppErrorCode';
import { GameConstants } from '@/common/constants/GameConstants';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { worldLabel, roleLabel } from '@/application/shared/labelHelpers';
import type { PartyEditViewModel } from '@/application/viewModels/partyEditViewModel';

export class GetPartyEditStateUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(selectedSupportIds: string[] = []): Promise<Result<PartyEditViewModel, SaveErrorCode>> {
    const result = await this.tx.load();
    if (!result.ok) return fail(result.errorCode, result.message);

    const save       = result.value;
    const owned      = save?.ownedMonsters   ?? [];
    const supports   = save?.supportMonsters ?? [];
    const player     = save?.player          ?? null;

    // 主役情報
    const mainMonster = player?.mainMonsterId
      ? owned.find((m) => m.uniqueId === player.mainMonsterId) ?? null
      : null;

    const main = mainMonster
      ? {
          uniqueId:    mainMonster.uniqueId,
          displayName: mainMonster.displayName,
          level:       mainMonster.level,
          roleLabel:   roleLabel(mainMonster.role),
        }
      : null;

    // 助っ人候補
    const selectedSet = new Set(selectedSupportIds);
    const supportCandidates = supports.map((s) => ({
      supportId:   s.supportId,
      displayName: s.displayName,
      level:       s.level,
      roleLabel:   roleLabel(s.role),
      worldLabel:  worldLabel(s.worldId),
      isSelected:  selectedSet.has(s.supportId),
    }));

    // 選択中
    const selectedSupports = selectedSupportIds
      .map((id) => supports.find((s) => s.supportId === id))
      .filter((s): s is NonNullable<typeof s> => s !== undefined)
      .map((s) => ({
        supportId:   s.supportId,
        displayName: s.displayName,
        level:       s.level,
      }));

    return ok({
      main,
      supportCandidates,
      selectedSupports,
      canAddSupport: selectedSupportIds.length < GameConstants.PARTY_MAX_SUPPORTS,
    });
  }
}
