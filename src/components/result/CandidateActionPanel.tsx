'use client';

/**
 * 候補受取/見送りアクションパネル。
 */

import { PrimaryButton } from '@/components/common/PrimaryButton';

interface CandidateActionPanelProps {
  onAccept:   () => void;
  onSkip:     () => void;
  disabled:   boolean;
}

export default function CandidateActionPanel({ onAccept, onSkip, disabled }: CandidateActionPanelProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <PrimaryButton onClick={onAccept} disabled={disabled} className="py-4 text-base">
        🤝 なかまに する
      </PrimaryButton>

      <button
        type="button"
        onClick={onSkip}
        disabled={disabled}
        className="w-full rounded-full border-2 border-stone-200 bg-white py-4 text-sm font-bold text-[#595c57] transition hover:bg-stone-50 active:scale-95 disabled:opacity-50"
      >
        こんかいは やめる
      </button>
    </div>
  );
}
