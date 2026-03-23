'use client';

/**
 * 候補受取/見送りアクションパネル。
 * 受取ボタン・見送りボタンを表示する。
 */

interface CandidateActionPanelProps {
  onAccept:   () => void;
  onSkip:     () => void;
  disabled:   boolean;
}

export default function CandidateActionPanel({
  onAccept, onSkip, disabled,
}: CandidateActionPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onAccept}
        disabled={disabled}
        className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white shadow transition hover:bg-emerald-600 disabled:opacity-50"
      >
        仲間にする
      </button>
      <button
        type="button"
        onClick={onSkip}
        disabled={disabled}
        className="w-full rounded-xl border border-stone-300 bg-white py-3 text-sm font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-50"
      >
        見送る
      </button>
    </div>
  );
}
