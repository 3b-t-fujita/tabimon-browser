/**
 * イベント表示パネルコンポーネント。
 * EVENT_RESOLVING 状態で表示する。
 * イベントメッセージを表示し、「確認」ボタンで次へ進む。
 */
'use client';

interface Props {
  message:    string;
  onConfirm:  () => void;
  isSaving:   boolean;
}

export function EventPanel({ message, onConfirm, isSaving }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-700">イベント発生！</p>
      <p className="text-sm text-stone-700 leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={onConfirm}
        disabled={isSaving}
        className="w-full rounded-lg bg-amber-400 py-3 text-sm font-bold text-white shadow transition hover:bg-amber-500 active:scale-95 disabled:opacity-50"
      >
        {isSaving ? '保存中...' : '確認して進む'}
      </button>
    </div>
  );
}
