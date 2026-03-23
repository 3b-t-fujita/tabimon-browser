/**
 * リタイア確認ダイアログコンポーネント。
 * 冒険中の「戻る」操作で表示するオーバーレイダイアログ。
 * 「はい」→ リタイア処理、「いいえ」→ 元状態へ戻る。
 * 詳細設計 v4 §4.1 / §15 リタイア仕様に準拠。
 *
 * 重要: 通常の画面戻り（router.back()）は使用しない。
 */
'use client';

interface Props {
  onConfirm: () => void;
  onCancel:  () => void;
  isSaving:  boolean;
}

export function RetireConfirmDialog({ onConfirm, onCancel, isSaving }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label="リタイア確認"
    >
      <div className="mx-5 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-lg font-bold text-stone-800">冒険をやめますか？</h2>
        <p className="mb-6 text-sm text-stone-500">
          リタイアすると冒険は失敗扱いになります。
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="w-full rounded-xl bg-red-500 py-3 text-sm font-bold text-white shadow transition hover:bg-red-600 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? '処理中...' : 'はい、リタイアする'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="w-full rounded-xl border border-stone-300 bg-white py-3 text-sm font-bold text-stone-700 transition hover:bg-stone-50 active:scale-95 disabled:opacity-50"
          >
            いいえ、続ける
          </button>
        </div>
      </div>
    </div>
  );
}
