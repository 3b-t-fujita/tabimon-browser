/**
 * エラーダイアログ。オーバーレイで表示する。
 * 主役手放し不可・保存失敗・重複選択 等のエラー通知に使用する。
 */
'use client';

interface Props {
  title:    string;
  message:  string;
  onClose:  () => void;
}

export function ErrorDialog({ title, message, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-red-700">{title}</h2>
        <p className="mt-2 text-sm text-stone-600">{message}</p>
        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-stone-700 py-3 text-sm font-bold text-white transition hover:bg-stone-800"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
