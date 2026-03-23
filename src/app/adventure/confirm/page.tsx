'use client';

/**
 * 冒険開始確認ページ。
 * URL パラメータ stageId + monsterStore.selectedSupportIds から確認 ViewModel を構築する。
 * 冒険開始ボタン → StartAdventureUseCase → /adventure/play へ遷移。
 */
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMonsterStore } from '@/stores/monsterStore';
import { useAdventureStore } from '@/stores/adventureStore';
import { GetAdventureConfirmViewStateUseCase } from '@/application/adventure/getAdventureConfirmViewStateUseCase';
import { StartAdventureUseCase } from '@/application/adventure/startAdventureUseCase';
import { AdventureStartConfirmPanel } from '@/components/adventure/AdventureStartConfirmPanel';
import { GameLayout } from '@/components/common/GameLayout';
import { ErrorBanner } from '@/components/common/ErrorBanner';

const confirmUC = new GetAdventureConfirmViewStateUseCase();
const startUC   = new StartAdventureUseCase();

export default function AdventureConfirmPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const stageId      = searchParams.get('stageId') ?? '';

  const { selectedSupportIds } = useMonsterStore();
  const {
    adventureConfirm,
    setAdventureConfirm,
    isStarting,
    setIsStarting,
    startError,
    setStartError,
  } = useAdventureStore();

  useEffect(() => {
    if (!stageId) {
      setStartError('ステージが指定されていません');
      return;
    }
    async function load() {
      const result = await confirmUC.execute(stageId, selectedSupportIds);
      if (!result.ok) {
        setStartError('確認画面の読み込みに失敗しました');
        return;
      }
      setAdventureConfirm(result.value);
    }
    load().catch(() => setStartError('予期しないエラーが発生しました'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageId, selectedSupportIds]);

  async function handleStart() {
    if (!stageId || isStarting) return;
    setIsStarting(true);
    setStartError(null);

    const result = await startUC.execute({
      stageId,
      selectedSupportIds,
    });

    setIsStarting(false);

    if (!result.ok) {
      setStartError(result.message ?? '冒険の開始に失敗しました');
      // 確認 VM を再取得してバリデーション状態を更新
      const refreshed = await confirmUC.execute(stageId, selectedSupportIds);
      if (refreshed.ok) setAdventureConfirm(refreshed.value);
      return;
    }

    // 保存成功 → 探索本編へ（フェーズ6接続先）
    router.push('/adventure/play');
  }

  return (
    <GameLayout>
      {startError && !adventureConfirm && (
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <ErrorBanner message={startError} />
        </div>
      )}
      {!adventureConfirm && !startError && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-stone-400">読み込み中...</p>
        </div>
      )}
      {adventureConfirm && (
        <AdventureStartConfirmPanel
          vm={adventureConfirm}
          onStart={handleStart}
          onBack={() => router.back()}
          isStarting={isStarting}
          startError={startError}
        />
      )}
    </GameLayout>
  );
}
