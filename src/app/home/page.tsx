'use client';

/**
 * ホームページ。
 * HomeScreen に HomeViewModel を渡して表示する。
 *
 * 保存データの読み込みは LoadHomeDataUseCase 経由で行う。
 * page.tsx 内で IndexedDB（SaveTransactionService）を直接操作しない。
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppUiStore, RouteState } from '@/stores/appUiStore';
import { LoadHomeDataUseCase } from '@/application/home/loadHomeDataUseCase';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { AdventureResultType, AdventureSessionStatus } from '@/common/constants/enums';
import { HomeScreen } from '@/components/home/HomeScreen';
import { GameLayout } from '@/components/common/GameLayout';
import { ErrorBanner } from '@/components/common/ErrorBanner';

export default function HomePage() {
  const router = useRouter();
  const {
    homeViewModel,
    lastUiError,
    setHomeViewModel,
    setRouteState,
    setLastUiError,
  } = useAppUiStore();

  // 直接アクセス時（store が空の場合）は UseCase 経由でロードし直す
  useEffect(() => {
    if (homeViewModel) return;

    async function loadHomeData() {
      const useCase = new LoadHomeDataUseCase();
      const outcome = await useCase.execute();

      if (!outcome.ok && outcome.noData) {
        // データなし → Setup へ
        setRouteState(RouteState.InitialSetup);
        router.replace('/setup');
        return;
      }

      if (!outcome.ok) {
        setLastUiError('データの読み込みに失敗しました');
        return;
      }

      setHomeViewModel(outcome.homeViewModel);
    }

    loadHomeData().catch((err) => {
      console.error('[HomePage]', err);
      setLastUiError('予期しないエラーが発生しました');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 「続きから」ボタン押下時の遷移処理。
   * 最新のセーブデータを読み込み、状況に応じて適切な画面へ遷移する。
   * - pendingCandidate あり → 候補受取画面
   * - SESSION_PENDING_RESULT → リザルト画面（pendingResultType を URL に付加）
   * - SESSION_ACTIVE / SESSION_ACTIVE_BATTLE → 探索画面
   */
  async function handleContinue() {
    const tx = new SaveTransactionService();
    const loaded = await tx.load();
    if (!loaded.ok) {
      setLastUiError('データの読み込みに失敗しました');
      return;
    }
    const save = loaded.value;

    // 候補受取が最優先（リザルト確定後にクラッシュした場合）
    if (save?.pendingCandidate) {
      router.push('/adventure/candidate');
      return;
    }

    const session = save?.adventureSession;
    if (!session) {
      setLastUiError('続きのデータが見つかりませんでした');
      return;
    }

    if (session.status === AdventureSessionStatus.PendingResult) {
      const type = session.pendingResultType ?? AdventureResultType.Success;
      router.push(`/adventure/result?type=${type}`);
    } else {
      // SESSION_ACTIVE or SESSION_ACTIVE_BATTLE
      router.push('/adventure/play');
    }
  }

  return (
    <GameLayout>
      {lastUiError && !homeViewModel && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
          <ErrorBanner message={lastUiError} />
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-stone-700 px-6 py-3 text-sm font-bold text-white"
          >
            再読み込み
          </button>
        </div>
      )}

      {!homeViewModel && !lastUiError && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8">
          <p className="text-sm text-stone-400">読み込み中...</p>
        </div>
      )}

      {homeViewModel && (
        <HomeScreen
          vm={homeViewModel}
          onContinue={handleContinue}
        />
      )}
    </GameLayout>
  );
}
