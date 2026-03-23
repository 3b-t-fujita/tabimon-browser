'use client';

/**
 * 候補モンスターカードコンポーネント。
 * PendingCandidate の情報（モンスター名・性格）を表示する。
 */
import type { PendingCandidate } from '@/domain/entities/PendingCandidate';
import { getMonsterStandUrl } from '@/infrastructure/assets/monsterImageService';

interface CandidateCardProps {
  candidate:    PendingCandidate;
  displayName:  string;  // マスタから取得した表示名
}

export default function CandidateCard({ candidate, displayName }: CandidateCardProps) {
  const standUrl = getMonsterStandUrl(candidate.monsterMasterId as string);
  return (
    <div className="p-4 rounded-xl border-2 border-emerald-400 bg-emerald-50 text-center">
      <div className="mb-2 flex justify-center">
        {standUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={standUrl} alt={displayName} className="h-24 w-24 object-contain" />
        ) : (
          <span className="text-4xl">🐾</span>
        )}
      </div>
      <div className="text-lg font-bold text-emerald-700">{displayName}</div>
      <div className="text-xs text-stone-500 mt-1">性格: {candidate.personalityId}</div>
      <div className="text-xs text-stone-400 mt-0.5">Lv.1 から始まります</div>
    </div>
  );
}
