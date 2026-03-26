'use client';

/**
 * 候補モンスターカード。
 * PendingCandidate の情報（モンスター名・性格）を表示する。
 * 新しい仲間との出会いの高揚感を演出する。
 */
import Image from 'next/image';
import type { PendingCandidate } from '@/domain/entities/PendingCandidate';
import { getMonsterStandUrl } from '@/infrastructure/assets/monsterImageService';
import { personalityLabel } from '@/application/shared/labelHelpers';
import { SoftCard } from '@/components/common/SoftCard';
import { UiChip } from '@/components/common/UiChip';

interface CandidateCardProps {
  candidate:    PendingCandidate;
  displayName:  string;
}

// 性格ラベル（日本語）→ 絵文字
const PERSONALITY_EMOJI: Record<string, string> = {
  'ゆうかん':   '🔥',
  'しんちょう': '🧐',
  'やさしい':   '🌸',
  'せっかち':   '⚡',
  'れいせい':   '🌊',
  'きまぐれ':   '🌀',
};

export default function CandidateCard({ candidate, displayName }: CandidateCardProps) {
  const standUrl  = getMonsterStandUrl(candidate.monsterMasterId as string);
  const persLabel = personalityLabel(candidate.personalityId as string);
  const persEmoji = PERSONALITY_EMOJI[persLabel] ?? '😐';

  return (
    <SoftCard className="overflow-hidden border border-[#d3ead9] bg-[linear-gradient(135deg,#f0fdf4_0%,#dcfce7_50%,#f0fdf4_100%)]">
      {/* キラキラ帯 */}
      <div
        className="w-full py-2 text-center text-[11px] font-black uppercase tracking-widest text-emerald-700"
        style={{ background: 'rgba(16,185,129,0.15)' }}
      >
        ✨ 新しい仲間候補 ✨
      </div>

      {/* 立ち絵 */}
      <div className="flex items-center justify-center py-8" style={{ minHeight: 160 }}>
        {standUrl ? (
          <Image
            src={standUrl}
            alt={displayName}
            width={140}
            height={140}
            className="object-contain"
            style={{ filter: 'drop-shadow(0 8px 20px rgba(16,185,129,0.4))' }}
          />
        ) : (
          <span className="text-7xl">🐾</span>
        )}
      </div>

      {/* 情報 */}
      <div className="flex w-full flex-col items-center gap-2 px-5 pb-5">
        <h2 className="text-xl font-black text-stone-900">{displayName}</h2>
        <div className="flex gap-2">
          <UiChip background="#dcfce7" color="#047857" className="text-xs font-bold">
            {persEmoji} {persLabel}
          </UiChip>
          <UiChip background="#f5f5f4" color="#57534e" className="text-xs font-bold">
            Lv.1 スタート
          </UiChip>
        </div>
      </div>
    </SoftCard>
  );
}
