'use client';

import Image from 'next/image';
import { AdventureResultType } from '@/common/constants/enums';
import type { StatGains } from '@/application/result/finalizeAdventureResultUseCase';
import { SoftCard } from '@/components/common/SoftCard';
import { UiChip } from '@/components/common/UiChip';

interface ResultSummaryViewProps {
  resultType: AdventureResultType;
  stageId: string;
  expGained: number;
  firstClearBonusExp: number;
  newLevel: number;
  leveledUp: boolean;
  stageUnlocked: boolean;
  statGains: StatGains | null;
  evolved: boolean;
  evolvedName: string | null;
  bondPointsGained: number;
  bondRankBefore: number;
  bondRankAfter: number;
  skillUpdates: Array<{ skillId: string; skillName: string; useCountBefore: number; useCountAfter: number; stageBefore: number; stageAfter: number }>;
  farmRewardMessage?: string | null;
}

const RESULT_CONFIG: Record<AdventureResultType, {
  label: string;
  sublabel: string;
  banner: string;
  shell: string;
  chip: string;
  text: string;
}> = {
  [AdventureResultType.Success]: {
    label: '冒険成功！',
    sublabel: 'よく がんばった！',
    banner: '/assets/result/ui_result_banner_success_v1.webp',
    shell: 'linear-gradient(135deg, #29664c 0%, #246147 100%)',
    chip: '#b9f9d6',
    text: '#0a4f36',
  },
  [AdventureResultType.Failure]: {
    label: '冒険失敗…',
    sublabel: 'また ちょうせん！',
    banner: '/assets/result/ui_result_banner_fail_v1.webp',
    shell: 'linear-gradient(135deg, #7d5231 0%, #6c4324 100%)',
    chip: '#fac097',
    text: '#4a280a',
  },
  [AdventureResultType.Retire]: {
    label: 'リタイア',
    sublabel: 'ここで ひとやすみ',
    banner: '/assets/result/ui_result_banner_retire_v1.webp',
    shell: 'linear-gradient(135deg, #4f5d68 0%, #334155 100%)',
    chip: '#dbe4ea',
    text: '#334155',
  },
};

export default function ResultSummaryView({
  resultType, stageId, expGained, firstClearBonusExp, newLevel, leveledUp, stageUnlocked, statGains, evolved, evolvedName, bondPointsGained, bondRankBefore, bondRankAfter, skillUpdates, farmRewardMessage,
}: ResultSummaryViewProps) {
  const cfg = RESULT_CONFIG[resultType];

  return (
    <div className="overflow-hidden rounded-[32px] bg-white shadow-sm">
      <div className="relative h-44">
        <Image src={cfg.banner} alt={cfg.label} fill sizes="100vw" className="object-cover pointer-events-none" priority />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(12,15,11,0.05) 0%, rgba(12,15,11,0.65) 72%, rgba(12,15,11,0.9) 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">{stageId}</p>
          <p className="mt-2 text-[30px] font-black leading-tight">{cfg.label}</p>
          <p className="mt-1 text-sm text-white/75">{cfg.sublabel}</p>
        </div>
      </div>

      <div className="space-y-4 bg-[#f5f7f0] p-5">
        {farmRewardMessage && (
          <SoftCard className="p-5">
            <UiChip background="#eef7f8" color="#1e4f57">
              そだてる
            </UiChip>
            <p className="mt-3 text-lg font-black text-[#2c302b]">{farmRewardMessage}</p>
          </SoftCard>
        )}

        <div className="rounded-[24px] px-4 py-4 text-white" style={{ background: cfg.shell }}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black tracking-[0.14em] text-white/70">けいけんち</p>
              <p className="mt-2 text-2xl font-black">+{expGained} EXP</p>
              {firstClearBonusExp > 0 && (
                <p className="mt-1 text-xs text-white/80">はじめて ぼーなす +{firstClearBonusExp}</p>
              )}
            </div>
            <span className="rounded-full bg-white/14 px-4 py-2 text-xs font-black">
              Lv.{newLevel}
            </span>
          </div>
        </div>

        {leveledUp && (
          <SoftCard className="p-5">
            <UiChip background={cfg.chip} color={cfg.text}>
              レベルアップ
            </UiChip>
            <p className="mt-3 text-lg font-black text-[#2c302b]">Lv.{newLevel} になった！</p>

            {statGains && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {[
                  ['HP', statGains.hp],
                  ['ATK', statGains.atk],
                  ['DEF', statGains.def],
                  ['SPD', statGains.spd],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[20px] bg-[#f5f7f0] px-3 py-3 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#6c4324]/70">{label}</p>
                    <p className="mt-1 text-lg font-black text-[#2c302b]">+{value}</p>
                  </div>
                ))}
              </div>
            )}
          </SoftCard>
        )}

        <SoftCard className="p-5">
          <div data-testid="result-bond-section">
          <UiChip background="#ffe3ef" color="#9d275f">
            きずな
          </UiChip>
          <p className="mt-3 text-lg font-black text-[#2c302b]">+{bondPointsGained} pt</p>
          <p className="mt-1 text-sm text-[#595c57]">
            ランク {bondRankBefore} → {bondRankAfter}
          </p>
          {bondRankAfter > bondRankBefore && (
            <p className="mt-3 text-sm font-black text-[#9d275f]">きずなが ふかまった！</p>
          )}
          </div>
        </SoftCard>

        <SoftCard className="p-5">
          <div data-testid="result-skill-section">
          <UiChip background="#d6f0f3" color="#1e4f57">
            じゅくれん
          </UiChip>
          {skillUpdates.length === 0 ? (
            <p className="mt-3 text-sm text-[#595c57]">わざは まだ のびてないよ。</p>
          ) : (
            <div className="mt-4 space-y-3">
              {skillUpdates.map((skill) => (
                <div key={skill.skillId} className="rounded-[20px] bg-[#f5f7f0] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-[#2c302b]">{skill.skillName}</p>
                    <p className="text-xs font-black text-[#1e4f57]">
                      だんかい {skill.stageBefore} → {skill.stageAfter}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-[#595c57]">
                    つかった かず {skill.useCountBefore} → {skill.useCountAfter}
                  </p>
                </div>
              ))}
            </div>
          )}
          </div>
        </SoftCard>

        {evolved && evolvedName && (
          <SoftCard className="p-5">
            <div data-testid="result-evolution-section">
            <UiChip background="#f3e8ff" color="#6b21a8">
              進化
            </UiChip>
            <div className="mt-4 rounded-[22px] bg-[#f8f1ff] px-4 py-5 text-center">
              <p className="text-xs font-black tracking-[0.14em] text-[#6b21a8]/70">しんかえんしゅつ</p>
              <p className="mt-2 text-sm text-[#595c57]">ひかって…</p>
              <p className="mt-3 text-lg font-black text-[#2c302b]">✨ {evolvedName} に しんかした！</p>
            </div>
            </div>
          </SoftCard>
        )}

        {stageUnlocked && (
          <SoftCard className="p-5">
            <div data-testid="result-stage-unlock-section">
            <UiChip background="#d6f0f3" color="#1e4f57">
              解放
            </UiChip>
            <p className="mt-3 text-lg font-black text-[#2c302b]">あたらしい ステージが ひらいた！</p>
            </div>
          </SoftCard>
        )}
      </div>
    </div>
  );
}
