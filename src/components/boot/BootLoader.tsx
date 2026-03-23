/**
 * BootLoader component。
 * 起動直後に表示し、保存読込・復旧判定を実行して結果を親へ伝える。
 *
 * この component は表示とイベント発火に専念する。
 * 保存・復旧ロジックは BootApplicationService に委譲する。
 */
'use client';

import { useEffect } from 'react';
import { BootApplicationService } from '@/application/boot/bootApplicationService';
import { useAppUiStore, RouteState } from '@/stores/appUiStore';
import { BootDestination } from '@/application/viewModels/bootViewModel';

export function BootLoader() {
  const {
    setBooting,
    setRouteState,
    setBootViewModel,
    setLastUiError,
  } = useAppUiStore();

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const svc    = new BootApplicationService();
      const result = await svc.boot();

      if (cancelled) return;

      setBootViewModel(result.viewModel);

      // 遷移先を RouteState へ変換
      switch (result.viewModel.destination) {
        case BootDestination.InitialSetup:
          setRouteState(RouteState.InitialSetup);
          break;
        case BootDestination.RecoveryPrompt:
          setRouteState(RouteState.RecoveryPrompt);
          break;
        case BootDestination.LoadFailed:
          setLastUiError(result.viewModel.errorMessage ?? '読み込みに失敗しました');
          setRouteState(RouteState.LoadFailed);
          break;
        case BootDestination.Home:
        default:
          setRouteState(RouteState.Home);
          break;
      }

      setBooting(false);
    }

    boot().catch((err) => {
      if (cancelled) return;
      console.error('[BootLoader] 予期しないエラー', err);
      setLastUiError('起動処理中に予期しないエラーが発生しました。ページを再読み込みしてください。');
      setRouteState(RouteState.LoadFailed);
      setBooting(false);
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <div className="text-4xl">🗺️</div>
      <p className="text-lg font-semibold text-stone-700">タビモン</p>
      <p className="text-sm text-stone-400">読み込み中...</p>
      <div className="mt-2 h-1 w-32 overflow-hidden rounded-full bg-stone-200">
        <div className="h-full animate-pulse rounded-full bg-emerald-400" />
      </div>
    </div>
  );
}
