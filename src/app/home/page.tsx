'use client';

/**
 * ホームページ。
 * HomeScreen に HomeViewModel を渡して表示する。
 *
 * 保存データの読み込みは LoadHomeDataUseCase 経由で行う。
 * page.tsx 内で IndexedDB（SaveTransactionService）を直接操作しない。
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppUiStore, RouteState } from '@/stores/appUiStore';
import { LoadHomeDataUseCase } from '@/application/home/loadHomeDataUseCase';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { AdventureResultType, AdventureSessionStatus } from '@/common/constants/enums';
import { HomeScreen } from '@/components/home/HomeScreen';
import { GameLayout } from '@/components/common/GameLayout';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { useBGM } from '@/hooks/useBGM';
import { GameConstants } from '@/common/constants/GameConstants';
import { calculateBondRank } from '@/domain/policies/bondPolicy';

export default function HomePage() {
  useBGM('home');
  const [showLoadingFallback, setShowLoadingFallback] = useState(false);

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
    const timer = window.setTimeout(() => {
      setShowLoadingFallback(true);
    }, 3000);

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
      setShowLoadingFallback(false);
    }

    loadHomeData().catch((err) => {
      console.error('[HomePage]', err);
      setLastUiError('予期しないエラーが発生しました');
    });
    return () => window.clearTimeout(timer);
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

  async function handleBuddyTap() {
    const tx = new SaveTransactionService();
    const loaded = await tx.load();
    if (!loaded.ok || !loaded.value?.player?.mainMonsterId) return;

    const save = loaded.value;
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const record = save.dailyRecord?.date === today
      ? save.dailyRecord
      : { date: today, homeTapCount: 0 };

    if (record.homeTapCount >= GameConstants.HOME_TAP_BOND_DAILY_LIMIT) return;

    const updatedOwned = save.ownedMonsters.map((monster) => {
      if (monster.uniqueId !== save.player?.mainMonsterId) return monster;
      const nextBondPoints = (monster.bondPoints ?? 0) + GameConstants.HOME_TAP_BOND_GAIN;
      return {
        ...monster,
        bondPoints: nextBondPoints,
        bondRank: calculateBondRank(nextBondPoints),
      };
    });

    const saveResult = await tx.saveMultiple({
      ownedMonsters: updatedOwned,
      dailyRecord: { date: today, homeTapCount: record.homeTapCount + 1 },
    });
    if (!saveResult.ok) return;

    const outcome = await new LoadHomeDataUseCase().execute();
    if (outcome.ok) setHomeViewModel(outcome.homeViewModel);
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
          <div className="mt-4 flex w-full max-w-xs flex-col gap-3 rounded-[24px] bg-white px-5 py-5 text-center shadow-sm">
            <p className="text-sm font-black text-[#2c302b]">進まないときの入口</p>
            <p className="text-xs leading-6 text-[#757872]">
              ここから直接はじめられます。表示が止まる場合は下のリンクを使ってください。
            </p>
            <a
              href="/setup"
              className="rounded-full bg-[#29664c] px-5 py-3 text-sm font-black text-white"
            >
              初期設定へ進む
            </a>
            <a
              href="/preview/ui"
              className="rounded-full bg-[#e6e9e1] px-5 py-3 text-sm font-black text-[#29664c]"
            >
              画面プレビューを見る
            </a>
          </div>
          {showLoadingFallback && (
            <div className="mt-4 flex w-full max-w-xs flex-col gap-3 rounded-[24px] bg-white px-5 py-5 text-center shadow-sm">
              <p className="text-sm font-black text-[#2c302b]">まだ始まらないとき</p>
              <p className="text-xs leading-6 text-[#757872]">
                セーブ読込に時間がかかっています。新しく始める場合は初期設定へ進めます。
              </p>
              <button
                type="button"
                onClick={() => router.push('/setup')}
                className="rounded-full bg-[#29664c] px-5 py-3 text-sm font-black text-white"
              >
                初期設定へ進む
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-full bg-[#e6e9e1] px-5 py-3 text-sm font-black text-[#29664c]"
              >
                再読み込み
              </button>
            </div>
          )}
        </div>
      )}

      {homeViewModel && (
        <HomeScreen
          vm={homeViewModel}
          onContinue={handleContinue}
          onBuddyTap={handleBuddyTap}
        />
      )}
    </GameLayout>
  );
}
