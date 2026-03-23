/**
 * 確認ダイアログ。オーバーレイで表示する。
 * 破壊的操作（仲間手放し等）の確認に使用する。
 */
'use client';

interface Props {
  title:     string;
  message:   string;
  onConfirm: () => void;
  onCancel:  () => void;
}

export function ConfirmDialog({ title, message, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-stone-800">{title}</h2>
        <p className="mt-2 text-sm text-stone-600">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-stone-300 py-3 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white transition hover:bg-red-600"
          >
            確定
          </button>
        </div>
      </div>
    </div>
  );
}
