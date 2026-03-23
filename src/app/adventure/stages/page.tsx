'use client';

/**
 * ステージ選択ページ。
 * GetAvailableStagesUseCase → StageList component。
 * ステージ選択後 /adventure/confirm?stageId=... へ遷移する。
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdventureStore } from '@/stores/adventureStore';
import { GetAvailableStagesUseCase } from '@/application/adventure/getAvailableStagesUseCase';
import { StageList } from '@/components/adventure/StageList';
import { GameLayout } from '@/components/common/GameLayout';
import { ErrorBanner } from '@/components/common/ErrorBanner';

const getStagesUC = new GetAvailableStagesUseCase();

export default function AdventureStagesPage() {
  const router = useRouter();
  const {
    stageSelect,
    setStageSelect,
    startError,
    setStartError,
  } = useAdventureStore();

  useEffect(() => {
    async function load() {
      const result = await getStagesUC.execute();
      if (!result.ok) {
        setStartError('ステージ一覧の読み込みに失敗しました');
        return;
      }
      setStageSelect(result.value);
    }
    load().catch(() => setStartError('予期しないエラーが発生しました'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelect(stageId: string) {
    router.push(`/adventure/confirm?stageId=${encodeURIComponent(stageId)}`);
  }

  return (
    <GameLayout>
      {startError && !stageSelect && (
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <ErrorBanner message={startError} />
        </div>
      )}
      {!stageSelect && !startError && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-stone-400">読み込み中...</p>
        </div>
      )}
      {stageSelect && (
        <StageList
          vm={stageSelect}
          onBack={() => router.back()}
          onSelect={handleSelect}
        />
      )}
    </GameLayout>
  );
}
