'use client';

/**
 * QR受取アクションパネル。
 * 「仲間にする」「助っ人にする」「見送る」の3択。
 * QR受取上限時は単純拒否（入替導線なし）。
 */

interface QrReceiveActionPanelProps {
  onAcceptOwned:   () => void;
  onAcceptSupport: () => void;
  onSkip:          () => void;
  disabled:        boolean;
}

export default function QrReceiveActionPanel({
  onAcceptOwned, onAcceptSupport, onSkip, disabled,
}: QrReceiveActionPanelProps) {
  return (
    <div className="flex flex-col gap-2.5">
      {/* 仲間にする */}
      <button
        type="button"
        onClick={onAcceptOwned}
        disabled={disabled}
        className="relative w-full overflow-hidden rounded-2xl py-4 text-sm font-black text-white shadow-lg transition active:scale-95 disabled:opacity-50"
        style={{
          background: 'linear-gradient(135deg, #064e3b, #10b981)',
          boxShadow:  '0 4px 14px rgba(16,185,129,0.4)',
        }}
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl"
          style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)' }}
        />
        <span className="relative z-10">🤝 仲間にする</span>
      </button>

      {/* 助っ人にする */}
      <button
        type="button"
        onClick={onAcceptSupport}
        disabled={disabled}
        className="relative w-full overflow-hidden rounded-2xl py-4 text-sm font-black text-white shadow-lg transition active:scale-95 disabled:opacity-50"
        style={{
          background: 'linear-gradient(135deg, #0c4a6e, #38bdf8)',
          boxShadow:  '0 4px 14px rgba(56,189,248,0.4)',
        }}
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl"
          style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)' }}
        />
        <span className="relative z-10">🛡️ 助っ人にする</span>
      </button>

      {/* 見送る */}
      <button
        type="button"
        onClick={onSkip}
        disabled={disabled}
        className="w-full rounded-2xl border-2 border-stone-200 bg-white py-3.5 text-sm font-bold text-stone-500 transition hover:bg-stone-50 active:scale-95 disabled:opacity-50"
      >
        見送る
      </button>
    </div>
  );
}
