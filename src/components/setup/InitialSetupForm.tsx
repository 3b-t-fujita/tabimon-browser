/**
 * 初期設定フォーム。
 * 冒険者名・ワールド・初期相棒を選択してゲームを開始する。
 */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CompleteInitialSetupUseCase } from '@/application/boot/completeInitialSetupUseCase';
import { LoadHomeDataUseCase } from '@/application/home/loadHomeDataUseCase';
import { useAppUiStore, RouteState } from '@/stores/appUiStore';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SoftCard } from '@/components/common/SoftCard';
import { UiChip } from '@/components/common/UiChip';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { WorldId } from '@/common/constants/enums';

// ── ワールド設定 ─────────────────────────────────────────────
const WORLD_OPTIONS = [
  {
    id:      WorldId.Forest,
    label:   'ミドリの森',
    emoji:   '🌿',
    accent:  '#10b981',
    accentDk:'#064e3b',
    bg:      '#f0fdf4',
    bgGrad:  'linear-gradient(135deg, #f0fdf4, #dcfce7)',
    desc:    '緑豊かな森の世界。草・自然系モンスターが暮らす',
  },
  {
    id:      WorldId.Volcano,
    label:   'ホノオ火山',
    emoji:   '🌋',
    accent:  '#f97316',
    accentDk:'#7c2d12',
    bg:      '#fff7ed',
    bgGrad:  'linear-gradient(135deg, #fff7ed, #ffedd5)',
    desc:    '灼熱の火山地帯。炎・岩系モンスターが棲む',
  },
  {
    id:      WorldId.Ice,
    label:   'コオリ氷原',
    emoji:   '❄️',
    accent:  '#38bdf8',
    accentDk:'#0c4a6e',
    bg:      '#f0f9ff',
    bgGrad:  'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
    desc:    '極寒の氷の大地。氷・水系モンスターが息づく',
  },
] as const;

// ── ワールドごとの初期相棒 ───────────────────────────────────
const STARTER_BY_WORLD: Record<string, { id: string; label: string }[]> = {
  [WorldId.Forest]:  [{ id: 'MON_GRASS_001', label: 'グリーニョ' }],
  [WorldId.Volcano]: [{ id: 'MON_FIRE_001',  label: 'フレイム' }],
  [WorldId.Ice]:     [{ id: 'MON_ICE_001',   label: 'フロスト' }],
};

// ── 立ち絵パス ───────────────────────────────────────────────
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

  function handleWorldChange(worldId: string) {
    setSelectedWorldId(worldId);
    setStarterMonsterId('');
  }

  const selectedWorld  = WORLD_OPTIONS.find((w) => w.id === selectedWorldId) ?? null;
  const starterOptions = STARTER_BY_WORLD[selectedWorldId] ?? [];
  const canSubmit      = playerName.trim() && selectedWorldId && starterMonsterId && !isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await new CompleteInitialSetupUseCase().execute({ playerName, worldId: selectedWorldId, starterMonsterId });
      if (!result.ok) {
        setErrorMessage(result.message ?? '保存に失敗しました');
        return;
      }
      const loadOutcome = await new LoadHomeDataUseCase().execute();
      if (loadOutcome.ok) setHomeViewModel(loadOutcome.homeViewModel);
      setRouteState(RouteState.Home);
      router.push('/home');
    } catch (err) {
      console.error('[InitialSetupForm]', err);
      setErrorMessage('予期しないエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  }

  const ctaAccent   = selectedWorld?.accent   ?? '#10b981';
  const ctaAccentDk = selectedWorld?.accentDk ?? '#064e3b';

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col overflow-y-auto bg-[#f5f7f0] text-[#2c302b]"
    >
      <div className="shrink-0 px-5 pt-6">
        <SoftCard className="overflow-hidden">
          <div
            className="flex flex-col items-center gap-3 px-5 pb-6 pt-8"
            style={{
              background: selectedWorld
                ? `linear-gradient(to bottom, ${selectedWorld.bg}, #ffffff)`
                : 'linear-gradient(to bottom, #eff2ea, #ffffff)',
            }}
          >
        {/* 立ち絵 or デフォルトアイコン */}
        <div style={{ minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {starterMonsterId && MONSTER_STAND_IMG[starterMonsterId] ? (
            <Image
              src={MONSTER_STAND_IMG[starterMonsterId]}
              alt="選択中のモンスター"
              width={120}
              height={120}
              className="object-contain"
              style={{ filter: `drop-shadow(0 8px 20px ${ctaAccent}50)` }}
              priority
            />
          ) : (
            <span className="text-7xl" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))' }}>🗺️</span>
          )}
        </div>
        <p className="text-[10px] font-black tracking-[0.14em] text-[#6c4324]/70">さいしょのぼうけん</p>
        <h1 className="text-[clamp(26px,7vw,30px)] font-black tracking-tight text-[#1f3528]">タビモンへようこそ</h1>
        <p className="text-sm text-[#595c57] text-center">冒険者の情報を設定して、最初の旅に出発しましょう。</p>
          </div>
        </SoftCard>
      </div>

      <div className="flex flex-col gap-5 px-5 pt-5 pb-6">

        {errorMessage && <ErrorBanner message={errorMessage} />}

        {/* プレイヤー名 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-black tracking-[0.14em] text-stone-400" htmlFor="playerName">
            冒険者の名前（最大10文字）
          </label>
          <input
            id="playerName"
            type="text"
            maxLength={10}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="例: タロウ"
            className="rounded-[24px] border-2 border-stone-200 bg-white px-4 py-4 text-base text-stone-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        {/* ワールド選択 */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-black tracking-[0.14em] text-stone-400">
            出発するワールド
          </p>
          <div className="flex flex-col gap-2">
            {WORLD_OPTIONS.map((w) => {
              const isSelected = selectedWorldId === w.id;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => handleWorldChange(w.id)}
                  className="relative flex items-center gap-3 overflow-hidden rounded-[24px] border-2 px-4 py-4 text-left shadow-sm transition active:scale-95"
                  style={isSelected
                    ? { borderColor: w.accent, background: w.bgGrad }
                    : { borderColor: '#e7e5e4', background: 'white' }
                  }
                >
                  <span className="text-2xl">{w.emoji}</span>
                  <div className="flex flex-col gap-0.5">
                    <span
                      className="text-base font-black"
                      style={{ color: isSelected ? w.accent : '#292524' }}
                    >
                      {w.label}
                    </span>
                    <span className="text-xs text-stone-400">{w.desc}</span>
                  </div>
                  {isSelected && (
                    <UiChip className="ml-auto shrink-0 text-[10px]" background={w.accent} color="#ffffff">
                      選択中
                    </UiChip>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 初期相棒選択 */}
        {starterOptions.length > 0 && selectedWorld && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-black tracking-[0.14em] text-stone-400">
              最初の仲間
            </p>
            <div className="flex flex-col gap-2">
              {starterOptions.map((s) => {
                const isSelected = starterMonsterId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStarterMonsterId(s.id)}
                  className="relative flex items-center gap-3 overflow-hidden rounded-[24px] border-2 px-4 py-4 text-left shadow-sm transition active:scale-95"
                    style={isSelected
                      ? { borderColor: selectedWorld.accent, background: selectedWorld.bgGrad }
                      : { borderColor: '#e7e5e4', background: 'white' }
                    }
                  >
                    {/* スタンド画像サムネイル */}
                    {MONSTER_STAND_IMG[s.id] && (
                      <div
                        className="shrink-0 flex items-center justify-center rounded-xl overflow-hidden"
                        style={{ width: 48, height: 48, background: selectedWorld.bg, border: `1.5px solid ${selectedWorld.accent}30` }}
                      >
                        <Image
                          src={MONSTER_STAND_IMG[s.id]}
                          alt={s.label}
                          width={40}
                          height={40}
                          className="object-contain"
                        />
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5">
                      <span
                        className="text-base font-black"
                        style={{ color: isSelected ? selectedWorld.accent : '#292524' }}
                      >
                        {s.label}
                      </span>
                      <span className="text-xs text-stone-400">Lv.1 からスタート</span>
                    </div>
                    {isSelected && (
                      <UiChip className="ml-auto shrink-0 text-[10px]" background={selectedWorld.accent} color="#ffffff">
                        選択中
                      </UiChip>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 送信ボタン */}
        <PrimaryButton
          type="submit"
          disabled={!canSubmit}
          className="mt-2 text-base"
          background={canSubmit ? `linear-gradient(135deg, ${ctaAccentDk}, ${ctaAccent})` : '#d6d3d1'}
        >
          {isSubmitting ? '保存中...' : '🗺️ 冒険を始める'}
        </PrimaryButton>

      </div>
    </form>
  );
}
