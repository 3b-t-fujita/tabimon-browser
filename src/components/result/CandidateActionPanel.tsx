'use client';

/**
 * 候補受取/見送りアクションパネル。
 */

interface CandidateActionPanelProps {
  onAccept:   () => void;
  onSkip:     () => void;
  disabled:   boolean;
}

export default function CandidateActionPanel({ onAccept, onSkip, disabled }: CandidateActionPanelProps) {
  return (
    <div className="flex flex-col gap-2.5">
      {/* 仲間にする（メインCTA） */}
      <button
        type="button"
        onClick={onAccept}
        disabled={disabled}
        className="relative w-full overflow-hidden rounded-2xl py-5 text-base font-black text-white shadow-lg transition active:scale-95 disabled:opacity-50"
        style={{
          background: 'linear-gradient(135deg, #064e3b, #10b981)',
          boxShadow:  '0 4px 16px rgba(16,185,129,0.45)',
        }}
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl"
          style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)' }}
        />
        <span className="relative z-10">🤝 仲間にする</span>
      </button>

      {/* 見送る（サブアクション） */}
      <button
        type="button"
        onClick={onSkip}
        disabled={disabled}
        className="w-full rounded-2xl border-2 border-stone-200 bg-white py-4 text-sm font-bold text-stone-500 transition hover:bg-stone-50 active:scale-95 disabled:opacity-50"
      >
        見送る
      </button>
    </div>
  );
}
