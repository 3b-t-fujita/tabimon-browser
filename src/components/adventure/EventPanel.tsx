/**
 * イベント表示パネル。
 * EVENT_RESOLVING / EVENT_RESULT 状態で表示する。
 */
'use client';

interface Props {
  message:    string;
  onConfirm:  () => void;
  isSaving:   boolean;
}

export function EventPanel({ message, onConfirm, isSaving }: Props) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border border-amber-200 shadow-sm"
      style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}
    >
      {/* ヘッダー */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ background: 'rgba(245,158,11,0.15)' }}
      >
        <span className="text-base">✨</span>
        <span className="text-xs font-black uppercase tracking-widest text-amber-700">
          イベント発生！
        </span>
      </div>

      {/* メッセージ */}
      <p className="px-5 py-4 text-sm leading-relaxed text-stone-700">{message}</p>

      {/* 確認ボタン */}
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSaving}
          className="relative w-full overflow-hidden rounded-2xl py-4 text-sm font-black text-white shadow-lg transition active:scale-95 disabled:opacity-50"
          style={{
            background:  'linear-gradient(135deg, #d97706, #f59e0b)',
            boxShadow:   '0 4px 14px rgba(245,158,11,0.45)',
          }}
        >
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl"
            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)' }}
          />
          <span className="relative z-10">
            {isSaving ? '処理中...' : '✨ 確認して進む'}
          </span>
        </button>
      </div>
    </div>
  );
}
