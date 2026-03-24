/**
 * 初期設定フォーム component。
 * 表示とイベント発火に専念する。
 * 保存は親（page.tsx）から UseCase 経由で行う。
 */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CompleteInitialSetupUseCase } from '@/application/boot/completeInitialSetupUseCase';
import { LoadHomeDataUseCase } from '@/application/home/loadHomeDataUseCase';
import { useAppUiStore, RouteState } from '@/stores/appUiStore';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { WorldId } from '@/common/constants/enums';

// ワールド選択肢
const WORLD_OPTIONS = [
  { id: WorldId.Forest,  label: '🌿 ミドリの森' },
  { id: WorldId.Volcano, label: '🌋 ホノオ火山' },
  { id: WorldId.Ice,     label: '❄️ コオリ氷原' },
] as const;

// ワールドごとの初期主役
const STARTER_BY_WORLD: Record<string, { id: string; label: string }[]> = {
  [WorldId.Forest]:  [{ id: 'MON_GRASS_001', label: 'グリーニョ (草)' }],
  [WorldId.Volcano]: [{ id: 'MON_FIRE_001',  label: 'フレイム (炎)' }],
  [WorldId.Ice]:     [{ id: 'MON_ICE_001',   label: 'フロスト (氷)' }],
};

// モンスターID → 立ち絵画像パス
const MONSTER_STAND_IMG: Record<string, string> = {
  'MON_GRASS_001': '/assets/monsters/stands/monster_stand_initial_01_v1.webp',
  'MON_FIRE_001':  '/assets/monsters/stands/monster_stand_initial_02_v1.webp',
  'MON_ICE_001':   '/assets/monsters/stands/monster_stand_initial_03_v1.webp',
};

export function InitialSetupForm() {
  const router = useRouter();
  const { setHomeViewModel, setRouteState } = useAppUiStore();

  const [playerName,       setPlayerName]       = useState('');
  const [selectedWorldId,  setSelectedWorldId]  = useState('');
  const [starterMonsterId, setStarterMonsterId] = useState('');
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [errorMessage,     setErrorMessage]     = useState<string | null>(null);

  // ワールドが変わったら主役をリセット
  function handleWorldChange(worldId: string) {
    setSelectedWorldId(worldId);
    setStarterMonsterId('');
  }

  const starterOptions = STARTER_BY_WORLD[selectedWorldId] ?? [];
  const canSubmit = playerName.trim() && selectedWorldId && starterMonsterId && !isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const useCase = new CompleteInitialSetupUseCase();
      const result  = await useCase.execute({ playerName, worldId: selectedWorldId, starterMonsterId });

      if (!result.ok) {
        setErrorMessage(result.message ?? '保存に失敗しました');
        setIsSubmitting(false);
        return;
      }

      // 保存成功 → LoadHomeDataUseCase 経由で HomeViewModel を取得して Home へ
      const loadUseCase = new LoadHomeDataUseCase();
      const loadOutcome = await loadUseCase.execute();
      if (loadOutcome.ok) {
        setHomeViewModel(loadOutcome.homeViewModel);
      }

      setRouteState(RouteState.Home);
      router.push('/home');
    } catch (err) {
      console.error('[InitialSetupForm]', err);
      setErrorMessage('予期しないエラーが発生しました。もう一度お試しください。');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 p-6">
      <div className="text-center">
        {/* 選択中のモンスター立ち絵 or ロゴ */}
        {starterMonsterId && MONSTER_STAND_IMG[starterMonsterId] ? (
          <Image
            src={MONSTER_STAND_IMG[starterMonsterId]}
            alt="選択中のモンスター"
            width={120}
            height={120}
            className="mx-auto drop-shadow-md"
            priority
          />
        ) : (
          <div className="text-4xl">🗺️</div>
        )}
        <h1 className="mt-2 text-2xl font-bold text-stone-800">タビモンへようこそ</h1>
        <p className="mt-1 text-sm text-stone-500">最初に冒険者の情報を設定してください</p>
      </div>

      {errorMessage && <ErrorBanner message={errorMessage} />}

      {/* プレイヤー名 */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-stone-700" htmlFor="playerName">
          冒険者の名前（最大10文字）
        </label>
        <input
          id="playerName"
          type="text"
          maxLength={10}
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="例: タロウ"
          className="rounded-lg border border-stone-300 px-4 py-3 text-base text-stone-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
        />
      </div>

      {/* ワールド選択 */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-stone-700">出発するワールド</p>
        <div className="flex flex-col gap-2">
          {WORLD_OPTIONS.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => handleWorldChange(w.id)}
              className={`rounded-xl border-2 py-3 text-base font-medium transition ${
                selectedWorldId === w.id
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* 初期主役選択 */}
      {starterOptions.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-stone-700">最初の仲間</p>
          <div className="flex flex-col gap-2">
            {starterOptions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStarterMonsterId(s.id)}
                className={`rounded-xl border-2 py-3 text-base font-medium transition ${
                  starterMonsterId === s.id
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 送信ボタン */}
      <div className="mt-auto">
        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full rounded-xl py-4 text-base font-bold shadow transition ${
            canSubmit
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95'
              : 'bg-stone-200 text-stone-400'
          }`}
        >
          {isSubmitting ? '保存中...' : '冒険を始める'}
        </button>
      </div>
    </form>
  );
}
