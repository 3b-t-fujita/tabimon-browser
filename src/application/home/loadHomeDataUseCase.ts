/**
 * ホームデータ読込 UseCase。
 * IndexedDB から保存データを読み込み、HomeViewModel を返す。
 *
 * page.tsx や component はこの UseCase 経由で呼ぶ。
 * SaveTransactionService を直接呼ばない。
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { SaveErrorCode } from '@/common/errors/AppErrorCode';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { BuildHomeViewModelUseCase } from './buildHomeViewModelUseCase';
import type { HomeViewModel } from '@/application/viewModels/homeViewModel';

export type LoadHomeDataErrorCode = SaveErrorCode | 'NO_SAVE_DATA';

export interface LoadHomeDataResult {
  readonly homeViewModel: HomeViewModel;
  /** データが存在しない（初回起動相当） */
  readonly noData:        false;
}

export type LoadHomeDataOutcome =
  | { readonly ok: true;  readonly homeViewModel: HomeViewModel }
  | { readonly ok: false; readonly noData: true }
  | { readonly ok: false; readonly noData: false; readonly errorCode: LoadHomeDataErrorCode };

export class LoadHomeDataUseCase {
  private readonly tx:        SaveTransactionService;
  private readonly buildVm:   BuildHomeViewModelUseCase;

  constructor() {
    this.tx      = new SaveTransactionService();
    this.buildVm = new BuildHomeViewModelUseCase();
  }

  async execute(): Promise<LoadHomeDataOutcome> {
    const result = await this.tx.load();

    if (!result.ok) {
      return { ok: false, noData: false, errorCode: result.errorCode as SaveErrorCode };
    }

    if (!result.value || !result.value.player) {
      // データなし（初回起動） → 呼び出し元が Setup へ誘導する
      return { ok: false, noData: true };
    }

    return {
      ok:            true,
      homeViewModel: this.buildVm.execute(result.value),
    };
  }
}
