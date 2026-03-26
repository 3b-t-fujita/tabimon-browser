'use client';

import Image from 'next/image';
import type { AdventureConfirmViewModel } from '@/application/viewModels/adventureConfirmViewModel';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { UiChip } from '@/components/common/UiChip';
import { getMonsterIconUrl } from '@/infrastructure/assets/monsterImageService';

interface Props {
  vm: AdventureConfirmViewModel;
  onStart: () => void;
  onBack: () => void;
  onEditParty?: () => void;
  isStarting: boolean;
  startError: string | null;
}

function getWorldKey(stageId: string): 'forest' | 'fire' | 'ice' {
  if (stageId.includes('_w1')) return 'forest';
  if (stageId.includes('_w2')) return 'fire';
  return 'ice';
}

const WORLD_THEME = {
  forest: {
    shell: '#e9efe6',
    panel: '#ffffff',
    panelSoft: '#f5f7f0',
    accent: '#29664c',
    accentSoft: '#b9f9d6',
    accentText: '#0a4f36',
    worldLabel: '🌿 ミドリの森',
  },
  fire: {
    shell: '#f4ece5',
    panel: '#ffffff',
    panelSoft: '#fff6ef',
    accent: '#9f4b18',
    accentSoft: '#fac097',
    accentText: '#5d2d0d',
    worldLabel: '🔥 ホノオ火山',
  },
  ice: {
    shell: '#eaf2f4',
    panel: '#ffffff',
    panelSoft: '#f4fbfd',
    accent: '#2f6c77',
    accentSoft: '#c9edf2',
    accentText: '#17434a',
    worldLabel: '❄️ コオリ氷原',
  },
} as const;

const DIFFICULTY_META: Record<string, { icon: string; exp: number; nodes: number; rare: string }> = {
  やさしい: { icon: '⭐', exp: 30, nodes: 6, rare: '5%' },
  ふつう: { icon: '⭐⭐', exp: 70, nodes: 7, rare: '10%' },
  むずかしい: { icon: '⭐⭐⭐', exp: 120, nodes: 9, rare: '15%' },
};

function MonsterIcon({ masterId, fallback }: { masterId: string; fallback: string }) {
  const url = getMonsterIconUrl(masterId);
  return url ? (
    <div className="relative h-16 w-16 overflow-hidden rounded-[20px] bg-white">
      <Image src={url} alt="" fill className="object-contain p-1" sizes="64px" />
    </div>
  ) : (
    <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-white text-3xl">
      {fallback}
    </div>
  );
}

export function AdventureConfirmPanelB({
  vm,
  onStart,
  onBack,
  onEditParty,
  isStarting,
  startError,
}: Props) {
  const theme = WORLD_THEME[getWorldKey(vm.stageId)];
  const difficulty = DIFFICULTY_META[vm.difficulty] ?? DIFFICULTY_META['やさしい'];

  return (
    <div className="flex flex-1 flex-col" style={{ background: theme.shell }}>
      <div className="flex-1 overflow-y-auto px-4 pb-5 pt-5">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
          <section
            className="overflow-hidden rounded-[34px] border border-white/70 shadow-sm"
            style={{ background: theme.panel }}
          >
            <div className="px-5 pb-5 pt-5">
              <button
                type="button"
                onClick={onBack}
                className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#f5f7f0] px-3 py-2 text-sm font-bold text-[#595c57] transition active:scale-95"
              >
                <span>←</span>
                <span>戻る</span>
              </button>

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <UiChip background={theme.accentSoft} color={theme.accentText}>
                    {theme.worldLabel}
                  </UiChip>
                  <h1 className="mt-3 text-[28px] font-black leading-tight text-[#1f3528]">
                    {vm.stageName}
                  </h1>
                  <p className="mt-2 text-sm text-[#757872]">
                    この編成で冒険に出発します。
                  </p>
                </div>

                <div className="shrink-0 rounded-[22px] px-3 py-3 text-center" style={{ background: theme.panelSoft }}>
                  <p className="text-[11px] font-black text-[#6c4324]/70">{difficulty.icon}</p>
                  <p className="mt-1 text-[11px] font-bold text-[#595c57]">{vm.difficulty}</p>
                  <p className="mt-1 text-[10px] text-[#9ca3af]">Lv.{vm.recommendedLevel}+</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-[22px] px-4 py-4" style={{ background: theme.panelSoft }}>
                  <p className="text-[10px] font-black tracking-[0.12em] text-[#6c4324]/70">ルート数</p>
                  <p className="mt-2 text-xl font-black text-[#2c302b]">{difficulty.nodes}</p>
                </div>
                <div className="rounded-[22px] px-4 py-4" style={{ background: theme.panelSoft }}>
                  <p className="text-[10px] font-black tracking-[0.12em] text-[#6c4324]/70">けいけんち</p>
                  <p className="mt-2 text-xl font-black text-[#2c302b]">+{difficulty.exp}</p>
                </div>
                <div className="rounded-[22px] px-4 py-4" style={{ background: theme.panelSoft }}>
                  <p className="text-[10px] font-black tracking-[0.12em] text-[#6c4324]/70">レア</p>
                  <p className="mt-2 text-xl font-black text-[#2c302b]">{difficulty.rare}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[34px] bg-white px-5 py-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black tracking-[0.14em] text-[#29664c]/70">へんせい</p>
                <p className="mt-1 text-sm text-[#757872]">相棒と助っ人を確認してから出発します。</p>
              </div>
              {onEditParty && (
                <button
                  type="button"
                  onClick={onEditParty}
                  className="rounded-full px-4 py-2 text-xs font-black text-white transition active:scale-95"
                  style={{ background: theme.accent }}
                >
                  編成を変更
                </button>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {vm.main ? (
                <div className="rounded-[28px] p-4" style={{ background: theme.panelSoft }}>
                  <div className="flex items-center gap-4">
                    <div className="rounded-[24px] p-1.5" style={{ background: theme.accentSoft }}>
                      <MonsterIcon masterId={vm.main.monsterMasterId} fallback="⭐" />
                    </div>
                    <div className="min-w-0 flex-1">
                    <UiChip background={theme.accent} color="#ffffff">
                        相棒
                    </UiChip>
                      <p className="mt-2 truncate text-xl font-black text-[#2c302b]">{vm.main.displayName}</p>
                      <p className="mt-1 text-sm text-[#757872]">Lv.{vm.main.level}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[28px] border border-[#ffd1c8] bg-[#fff5f2] px-4 py-4">
                  <p className="text-sm font-black text-[#9e3120]">相棒が設定されていません</p>
                  <p className="mt-1 text-xs text-[#c2410c]">編成から相棒を選んでください。</p>
                </div>
              )}

              {[0, 1].map((index) => {
                const support = vm.supports[index];
                if (!support) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="flex items-center gap-4 rounded-[24px] border border-dashed border-stone-200 bg-[#fbfbfa] px-4 py-4"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white text-2xl text-stone-300">
                        +
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-400">助っ人 {index + 1}</p>
                        <p className="mt-1 text-xs text-stone-300">まだ選ばれていません</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={support.supportId}
                    className="flex items-center gap-4 rounded-[24px] px-4 py-4"
                    style={{ background: '#ffffff', border: `1px solid ${theme.accentSoft}` }}
                  >
                    <div className="rounded-[22px] p-1.5" style={{ background: theme.panelSoft }}>
                      <MonsterIcon masterId={support.monsterMasterId} fallback="🤝" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-black text-[#2c302b]">{support.displayName}</p>
                      <p className="mt-1 text-sm text-[#757872]">Lv.{support.level}</p>
                    </div>
                    <UiChip background={theme.accentSoft} color={theme.accentText} className="text-[10px]">
                      助っ人 {index + 1}
                    </UiChip>
                  </div>
                );
              })}
            </div>
          </section>

          {startError && (
            <section className="rounded-[28px] border border-[#ffd1c8] bg-[#fff5f2] px-5 py-4 shadow-sm">
              <p className="text-sm font-black text-[#9e3120]">開始できません</p>
              <p className="mt-1 text-sm text-[#c2410c]">{startError}</p>
            </section>
          )}

          {!vm.canStart && vm.cannotStartReason && (
            <section className="rounded-[28px] border border-[#fde68a] bg-[#fffbea] px-5 py-4 shadow-sm">
              <p className="text-sm font-black text-[#7d5231]">確認事項</p>
              <p className="mt-1 text-sm text-[#9a6700]">{vm.cannotStartReason}</p>
            </section>
          )}
        </div>
      </div>

      <div className="shrink-0 px-4 pb-6 pt-2" style={{ background: theme.shell }}>
        <div className="mx-auto w-full max-w-sm">
          {vm.canStart && !isStarting && (
            <p className="mb-2 text-center text-xs text-[#757872]">
              {vm.supports.length > 0
                ? `${vm.supports.length}体の助っ人といっしょに出発します`
                : '相棒ひとりで出発します'}
            </p>
          )}
          <PrimaryButton
            onClick={onStart}
            disabled={isStarting || !vm.canStart}
            background={vm.canStart && !isStarting
              ? `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent}dd 100%)`
              : '#d6d3d1'}
          >
            {isStarting ? '出発準備中...' : vm.canStart ? 'この編成で出発する' : '出発できません'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
