'use client';

/**
 * ルートページ。
 * 起動処理を実行し、結果に応じてサブページへリダイレクトする。
 *
 * Boot フロー:
 *   1. BootLoader が BootApplicationService を呼ぶ
 *   2. 結果を Zustand store に格納
 *   3. RouteState に応じて /setup / /home へ push
 *
 * UI は BootLoader と RecoveryPrompt のみ。
 * IndexedDB を直接触らない。
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppUiStore, RouteState } from '@/stores/appUiStore';
import { BootLoader } from '@/components/boot/BootLoader';
import { RecoveryPrompt } from '@/components/boot/RecoveryPrompt';
import { GameLayout } from '@/components/common/GameLayout';
import { ErrorBanner } from '@/components/common/ErrorBanner';

export default function RootPage() {
  const router = useRouter();
  const {
    isBooting,
    currentRouteState,
    bootViewModel,
    lastUiError,
  } = useAppUiStore();

  // Boot 完了後に画面遷移
  useEffect(() => {
    if (isBooting) return;

    switch (currentRouteState) {
      case RouteState.InitialSetup:
        router.replace('/setup');
        break;
      case RouteState.Home:
        router.replace('/home');
        break;
      case RouteState.RecoveryPrompt:
        // RecoveryPrompt はこのページ内で表示（サブページに行かない）
        break;
      case RouteState.LoadFailed:
        // エラーはこのページで表示
        break;
      default:
        break;
    }
  }, [isBooting, currentRouteState, router]);

  return (
    <GameLayout>
      {/* Boot 中 */}
      {isBooting && <BootLoader />}

      {/* 読み込み失敗 */}
      {!isBooting && currentRouteState === RouteState.LoadFailed && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
          <div className="text-4xl">⚠️</div>
          <ErrorBanner message={lastUiError ?? '読み込みに失敗しました'} />
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-stone-700 px-6 py-3 text-sm font-bold text-white"
          >
            再読み込み
          </button>
        </div>
      )}

      {/* 復旧プロンプト */}
      {!isBooting && currentRouteState === RouteState.RecoveryPrompt && bootViewModel?.recoveryInfo && (
        <RecoveryPrompt recoveryInfo={bootViewModel.recoveryInfo} />
      )}
    </GameLayout>
  );
}
