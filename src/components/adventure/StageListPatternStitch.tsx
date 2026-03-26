'use client';

import type { StageSelectViewModel } from '@/application/viewModels/stageSelectViewModel';
import { AppScreenHeader } from '@/components/common/AppScreenHeader';
import { SoftCard } from '@/components/common/SoftCard';
import { UiChip } from '@/components/common/UiChip';

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
    note: '木漏れ日の奥へ、まずは森の入口から旅を始めよう',
  },
  'ホノオ火山': {
    icon: '🔥',
    shell: 'linear-gradient(135deg, #7d5231 0%, #6c4324 100%)',
    button: 'linear-gradient(135deg, #7d5231 0%, #6c4324 100%)',
    chip: '#fac097',
    accentText: '#4a280a',
    note: '熱を帯びた荒野へ。準備を整えて一気に踏み込もう',
  },
  'コオリ氷原': {
    icon: '❄️',
    shell: 'linear-gradient(135deg, #4c7b83 0%, #2f6c77 100%)',
    button: 'linear-gradient(135deg, #4c7b83 0%, #2f6c77 100%)',
    chip: '#d6f0f3',
    accentText: '#1e4f57',
    note: '澄んだ空気の先へ。静かな氷原で新しい出会いを探そう',
  },
};

function getDifficultyChip(difficulty: string): { label: string; bg: string; text: string } {
  if (difficulty.includes('やさ')) return { label: difficulty, bg: '#b9f9d6', text: '#0a4f36' };
  if (difficulty.includes('むず')) return { label: difficulty, bg: '#fac097', text: '#4a280a' };
  return { label: difficulty, bg: '#ffc972', text: '#482f00' };
}

export function StageListPatternStitch({ vm, onBack, onSelect }: Props) {
  const grouped = vm.stages.reduce<Record<string, Array<(typeof vm.stages)[number]>>>((acc, stage) => {
    const key = stage.worldLabel;
    if (!acc[key]) acc[key] = [];
    acc[key].push(stage);
    return acc;
  }, {});

  return (
    <div className="flex flex-1 flex-col bg-[#f5f7f0] text-[#2c302b]">
      <AppScreenHeader
        backLabel="ホームへ戻る"
        onBack={onBack}
        eyebrow="ぼうけんさき"
        title="旅先を選ぼう"
        description="次に向かうワールドを選んで、相棒たちとの冒険を進めよう。"
      />

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pb-6 pt-5">
        <SoftCard tone="muted" className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black tracking-[0.16em] text-[#6c4324]/70">ぼうけんガイド</p>
              <p className="mt-2 text-lg font-black text-[#2c302b]">今行ける場所から少しずつ旅を広げよう</p>
              <p className="mt-2 text-sm leading-6 text-[#595c57]">
                解放済みのステージはそのまま出発できます。未解放の場所は次の目標として並べてあります。
              </p>
            </div>
            <div className="rounded-full bg-white px-4 py-2 text-center">
              <p className="text-[10px] font-black tracking-[0.12em] text-[#6c4324]/70">ワールド</p>
              <p className="mt-1 text-2xl font-black text-[#2c302b]">{Object.keys(grouped).length}</p>
            </div>
          </div>
        </SoftCard>

        {Object.entries(grouped).map(([worldLabel, stages]) => {
          const theme = WORLD_THEME[worldLabel] ?? {
            icon: '🌍',
            shell: 'linear-gradient(135deg, #29664c 0%, #246147 100%)',
            button: 'linear-gradient(135deg, #29664c 0%, #246147 100%)',
            chip: '#e6e9e1',
            accentText: '#29664c',
            note: 'まだ見ぬ土地へ足を踏み入れよう',
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
                      次の旅へ
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
                            <UiChip background={difficulty.bg} color={difficulty.text}>
                              {difficulty.label}
                            </UiChip>
                            <UiChip background={theme.chip} color={theme.accentText}>
                              推奨 Lv.{stage.recommendedLevel}
                            </UiChip>
                          </div>

                          <p className="mt-3 text-[clamp(18px,4.9vw,20px)] font-black leading-tight tracking-tight text-[#2c302b]">
                            {stage.stageName}
                          </p>
                          <p className="mt-2 text-sm text-[#595c57]">
                            {stage.isUnlocked
                              ? '準備ができたらすぐに出発できます。'
                              : '前のステージを進めると、この旅先が解放されます。'}
                          </p>
                        </div>

                        <div className="shrink-0">
                          <span
                            className="inline-flex rounded-full px-4 py-2 text-xs font-black"
                            style={{
                              background: stage.isUnlocked ? theme.chip : '#e6e9e1',
                              color: stage.isUnlocked ? theme.accentText : '#757872',
                            }}
                          >
                            {stage.isUnlocked ? '出発' : '未解放'}
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
