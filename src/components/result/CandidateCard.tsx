'use client';

/**
 * 候補モンスターカード。
 * PendingCandidate の情報（モンスター名・性格）を表示する。
 * 新しい仲間との出会いの高揚感を演出する。
 */
import Image from 'next/image';
import type { PendingCandidate } from '@/domain/entities/PendingCandidate';
import { getMonsterStandUrl } from '@/infrastructure/assets/monsterImageService';

interface CandidateCardProps {
  candidate:    PendingCandidate;
  displayName:  string;
}

// 性格 → 絵文字
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
  const persId    = candidate.personalityId as string;
  const persEmoji = PERSONALITY_EMOJI[persId] ?? '😐';

  return (
    <div
      className="flex flex-col items-center overflow-hidden rounded-2xl border shadow-sm"
      style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #f0fdf4 100%)', borderColor: '#86efac' }}
    >
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
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-700">
            {persEmoji} {persId}
          </span>
          <span className="rounded-full bg-stone-100 px-3 py-0.5 text-xs font-bold text-stone-500">
            Lv.1 スタート
          </span>
        </div>
      </div>
    </div>
  );
}
