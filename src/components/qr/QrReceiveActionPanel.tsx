'use client';

/**
 * QR受取アクションパネル。
 * 「仲間にする」「助っ人にする」「見送る」の3択ボタン。
 *
 * QR受取上限時は単純拒否（入替導線なし）。
 * 見送り時は確認ダイアログを呼ぶ側（onSkip）の責任で処理する。
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
      <button
        type="button"
        onClick={onAcceptOwned}
        disabled={disabled}
        className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white shadow transition hover:bg-emerald-600 disabled:opacity-50"
      >
        仲間にする
      </button>
      <button
        type="button"
        onClick={onAcceptSupport}
        disabled={disabled}
        className="w-full rounded-xl bg-sky-500 py-3 text-sm font-bold text-white shadow transition hover:bg-sky-600 disabled:opacity-50"
      >
        助っ人にする
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
