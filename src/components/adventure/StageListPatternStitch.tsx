'use client';

import { useMemo, useState } from 'react';
import type { StageSelectViewModel } from '@/application/viewModels/stageSelectViewModel';
import { AppScreenHeader } from '@/components/common/AppScreenHeader';
import { SoftCard } from '@/components/common/SoftCard';
import { UiChip } from '@/components/common/UiChip';
import { getFarmTierLabel } from '@/domain/policies/farmStagePolicy';
import { difficultyLabel } from '@/application/shared/labelHelpers';

interface Props {
  vm: StageSelectViewModel;
  onBack: () => void;
  onSelect: (stageId: string) => void;
}

const WORLD_THEME: Record<string, {
  icon: string;
  shell: string;
  button: string;
  chip: string;
  accentText: string;
  note: string;
}> = {
  'ミドリの森': {
    icon: '🌿',
    shell: 'linear-gradient(135deg, #29664c 0%, #246147 100%)',
    button: 'linear-gradient(135deg, #29664c 0%, #246147 100%)',
    chip: '#b9f9d6',
    accentText: '#0a4f36',
    note: 'もりへ いこう',
  },
  'ホノオ火山': {
    icon: '🔥',
    shell: 'linear-gradient(135deg, #7d5231 0%, #6c4324 100%)',
    button: 'linear-gradient(135deg, #7d5231 0%, #6c4324 100%)',
    chip: '#fac097',
    accentText: '#4a280a',
    note: 'かざんへ いこう',
  },
  'コオリ氷原': {
    icon: '❄️',
    shell: 'linear-gradient(135deg, #4c7b83 0%, #2f6c77 100%)',
    button: 'linear-gradient(135deg, #4c7b83 0%, #2f6c77 100%)',
    chip: '#d6f0f3',
    accentText: '#1e4f57',
    note: 'こおりへ いこう',
  },
};

function getDifficultyChip(difficulty: string): { label: string; bg: string; text: string } {
  if (difficulty === 'Easy' || difficulty.includes('やさ')) return { label: 'やさしい', bg: '#b9f9d6', text: '#0a4f36' };
  if (difficulty === 'Hard' || difficulty.includes('むず')) return { label: 'むずかしい', bg: '#fac097', text: '#4a280a' };
  return { label: 'ふつう', bg: '#ffc972', text: '#482f00' };
}

export function StageListPatternStitch({ vm, onBack, onSelect }: Props) {
  const [tab, setTab] = useState<'STORY' | 'FARM'>('STORY');
  const activeStages = tab === 'STORY' ? vm.storyStages : vm.farmStages;
  const grouped = activeStages.reduce<Record<string, Array<(typeof vm.stages)[number]>>>((acc, stage) => {
    const key = stage.worldLabel;
    if (!acc[key]) acc[key] = [];
    acc[key].push(stage);
    return acc;
  }, {});
  const stageCount = useMemo(() => activeStages.length, [activeStages]);

  return (
    <div className="flex flex-1 flex-col bg-[#f5f7f0] text-[#2c302b]">
      <AppScreenHeader
        backLabel="ホームへ"
        onBack={onBack}
        eyebrow="ステージ"
        title="ステージを えらぼう"
        description="いきたい ステージを えらぼう。"
      />

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pb-6 pt-5">
        <SoftCard tone="muted" className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black tracking-[0.16em] text-[#6c4324]/70">ぼうけんガイド</p>
              <p className="mt-2 text-lg font-black text-[#2c302b]">
                {tab === 'STORY' ? 'ものがたりを すすめよう' : 'そだてて つよくなろう'}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#595c57]">
                {tab === 'STORY'
                  ? 'ひらいた ところへ すぐ いけるよ。'
                  : '3しゅるい から えらべるよ。'}
              </p>
            </div>
            <div className="rounded-full bg-white px-4 py-2 text-center">
              <p className="text-[10px] font-black tracking-[0.12em] text-[#6c4324]/70">ステージ</p>
              <p className="mt-1 text-2xl font-black text-[#2c302b]">{stageCount}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTab('STORY')}
              className={`rounded-full px-4 py-3 text-sm font-black transition ${tab === 'STORY' ? 'bg-[#29664c] text-white' : 'bg-white text-[#29664c]'}`}
            >
              ものがたり
            </button>
            <button
              type="button"
              onClick={() => setTab('FARM')}
              className={`rounded-full px-4 py-3 text-sm font-black transition ${tab === 'FARM' ? 'bg-[#29664c] text-white' : 'bg-white text-[#29664c]'}`}
            >
              そだてる
            </button>
          </div>
        </SoftCard>

        {Object.entries(grouped).map(([worldLabel, stages]) => {
          const theme = WORLD_THEME[worldLabel] ?? {
            icon: '🌍',
            shell: 'linear-gradient(135deg, #29664c 0%, #246147 100%)',
            button: 'linear-gradient(135deg, #29664c 0%, #246147 100%)',
            chip: '#e6e9e1',
            accentText: '#29664c',
            note: 'つぎの ステージへ いこう',
          };
          const nextStage = stages.find((stage) => stage.isUnlocked) ?? stages[0];

          return (
            <section key={worldLabel} className="overflow-hidden rounded-[32px] bg-white shadow-sm">
              <div className="px-5 pb-5 pt-5 text-white" style={{ background: theme.shell }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/12 text-2xl">
                      {theme.icon}
                    </div>
                    <h2 className="mt-4 text-[26px] font-black leading-tight">{worldLabel}</h2>
                    <p className="mt-2 max-w-[240px] text-sm leading-6 text-white/80">{theme.note}</p>
                  </div>

                  {nextStage && (
                    <button
                      type="button"
                      onClick={() => nextStage.isUnlocked && onSelect(nextStage.stageId)}
                      disabled={!nextStage.isUnlocked}
                      className="rounded-full bg-white/14 px-4 py-2 text-sm font-black text-white backdrop-blur-sm transition active:scale-95 disabled:opacity-50"
                    >
                      いく
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3 bg-[#f5f7f0] p-4">
                {stages.map((stage) => {
                  const difficulty = getDifficultyChip(stage.difficulty);

                  return (
                    <button
                      key={stage.stageId}
                      type="button"
                      onClick={() => stage.isUnlocked && onSelect(stage.stageId)}
                      disabled={!stage.isUnlocked}
                      className="w-full rounded-[26px] bg-white px-4 py-4 text-left shadow-sm transition active:scale-[0.99] disabled:opacity-55"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {stage.stageType === 'FARM' && stage.farmCategory && (
                              <UiChip background="#eef7f8" color="#1e4f57">
                                {stage.farmCategory === 'EXP'
                                  ? 'EXP'
                                  : stage.farmCategory === 'BOND'
                                    ? 'きずな'
                                    : 'わざ'}
                              </UiChip>
                            )}
                            {stage.stageType === 'FARM' && stage.difficultyTier && (
                              <UiChip background="#f4efe7" color="#6c4324">
                                {getFarmTierLabel(stage.difficultyTier)}
                              </UiChip>
                            )}
                            <UiChip background={difficulty.bg} color={difficulty.text}>
                              {difficultyLabel(stage.difficulty) || difficulty.label}
                            </UiChip>
                            <UiChip background={theme.chip} color={theme.accentText}>
                              {stage.stageType === 'FARM' && stage.recommendedBandLabel
                                ? `めやす ${stage.recommendedBandLabel}`
                                : `めやす Lv.${stage.recommendedLevel}`}
                            </UiChip>
                            <UiChip background="#f4efe7" color="#6c4324">
                              {stage.estimatedMinutes} ふん
                            </UiChip>
                          </div>

                          <p className="mt-3 text-[clamp(18px,4.9vw,20px)] font-black leading-tight tracking-tight text-[#2c302b]">
                            {stage.stageName}
                          </p>
                          <p className="mt-2 text-sm text-[#595c57]">
                            {stage.stageType === 'FARM'
                              ? (stage.supportText ?? 'あいぼうを そだてよう。')
                              : stage.isUnlocked
                                ? 'すぐに いけるよ。'
                                : 'まえを クリアで ひらくよ。'}
                          </p>
                          {stage.stageType === 'FARM' && stage.primaryEffectLabel ? (
                            <p className="mt-2 text-xs font-black text-[#29664c]">
                              {stage.primaryEffectLabel}
                            </p>
                          ) : null}
                          {stage.stageType === 'STORY' && stage.firstClearBonusExp ? (
                            <p className="mt-2 text-xs font-black text-[#29664c]">
                              はじめて ぼーなす +{stage.firstClearBonusExp} EXP
                            </p>
                          ) : null}
                        </div>

                        <div className="shrink-0">
                          <span
                            className="inline-flex rounded-full px-4 py-2 text-xs font-black"
                            style={{
                              background: stage.isUnlocked ? theme.chip : '#e6e9e1',
                              color: stage.isUnlocked ? theme.accentText : '#757872',
                            }}
                          >
                            {stage.isUnlocked ? 'いく' : 'まだ'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
