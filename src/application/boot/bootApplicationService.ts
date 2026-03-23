/**
 * Boot アプリケーションサービス。
 * 起動時に呼ぶ единственный エントリポイント。
 * LoadInitialAppStateUseCase を束ねてフロントエンドに単純なインターフェースを提供する。
 */
import { LoadInitialAppStateUseCase } from './loadInitialAppStateUseCase';
import type { LoadInitialAppStateResult } from './loadInitialAppStateUseCase';
import type { BootViewModel } from '@/application/viewModels/bootViewModel';
import { BootDestination } from '@/application/viewModels/bootViewModel';

export class BootApplicationService {
  private readonly loadUseCase: LoadInitialAppStateUseCase;

  constructor() {
    this.loadUseCase = new LoadInitialAppStateUseCase();
  }

  async boot(): Promise<LoadInitialAppStateResult> {
    const result = await this.loadUseCase.execute();

    if (!result.ok) {
      // UseCase 自体が例外的に失敗した場合（通常は ok で帰ってくる）
      return {
        viewModel: {
          destination:  BootDestination.LoadFailed,
          recoveryInfo: null,
          errorMessage: '起動処理に失敗しました。ページを再読み込みしてください。',
        },
        resolvedSave: null,
      };
    }

    return result.value;
  }
}
