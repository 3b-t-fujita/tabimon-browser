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
    <div className="flex flex-col gap-3">
      {/* 仲間にする */}
      <button
        type="button"
        onClick={onAcceptOwned}
        disabled={disabled}
        className="relative w-full overflow-hidden rounded-full py-4 text-sm font-black text-white shadow-lg transition active:scale-95 disabled:opacity-50"
        style={{
          background: 'linear-gradient(135deg, #29664c, #246147)',
          boxShadow:  '0 4px 14px rgba(41,102,76,0.35)',
        }}
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full"
          style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)' }}
        />
        <span className="relative z-10">🤝 仲間にする</span>
      </button>

      {/* 助っ人にする */}
      <button
        type="button"
        onClick={onAcceptSupport}
        disabled={disabled}
        className="relative w-full overflow-hidden rounded-full py-4 text-sm font-black text-white shadow-lg transition active:scale-95 disabled:opacity-50"
        style={{
          background: 'linear-gradient(135deg, #4c7b83, #2f6c77)',
          boxShadow:  '0 4px 14px rgba(76,123,131,0.35)',
        }}
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full"
          style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)' }}
        />
        <span className="relative z-10">🛡️ 助っ人にする</span>
      </button>

      {/* 見送る */}
      <button
        type="button"
        onClick={onSkip}
        disabled={disabled}
        className="w-full rounded-full border-2 border-stone-200 bg-white py-3.5 text-sm font-bold text-[#595c57] transition hover:bg-stone-50 active:scale-95 disabled:opacity-50"
      >
        見送る
      </button>
    </div>
  );
}
