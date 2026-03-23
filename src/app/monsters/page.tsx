'use client';

/**
 * 仲間一覧ページ。
 * GetOwnedMonstersUseCase 経由でデータを取得する。
 * IndexedDB を page 内で直接触らない。
 */
import { useEffect } from 'react';
import { useMonsterStore } from '@/stores/monsterStore';
import { GetOwnedMonstersUseCase } from '@/application/monsters/getOwnedMonstersUseCase';
import { OwnedMonsterList } from '@/components/monsters/OwnedMonsterList';
import { GameLayout } from '@/components/common/GameLayout';
import { ErrorBanner } from '@/components/common/ErrorBanner';

export default function MonstersPage() {
  const { monsterList, setMonsterList, saveError, setSaveError } = useMonsterStore();

  useEffect(() => {
    async function load() {
      const result = await new GetOwnedMonstersUseCase().execute();
      if (!result.ok) {
        setSaveError('仲間一覧の読み込みに失敗しました');
        return;
      }
      setMonsterList(result.value);
    }
    load().catch(() => setSaveError('予期しないエラーが発生しました'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GameLayout>
      {saveError && !monsterList && (
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <ErrorBanner message={saveError} />
        </div>
      )}
      {!monsterList && !saveError && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-stone-400">読み込み中...</p>
        </div>
      )}
      {monsterList && <OwnedMonsterList vm={monsterList} />}
    </GameLayout>
  );
}
