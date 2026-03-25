/**
 * リタイア確認ダイアログ。
 * 冒険中の「戻る」操作で表示するオーバーレイダイアログ。
 * 詳細設計 v4 §4.1 / §15 リタイア仕様に準拠。
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
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="リタイア確認"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* 警告ストライプ */}
        <div
          className="h-2 w-full"
          style={{ background: 'linear-gradient(90deg, #ef4444, #f97316, #ef4444)' }}
        />

        <div className="px-6 pt-5 pb-6 flex flex-col gap-5">
          {/* テキスト */}
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-black text-stone-800">冒険をやめますか？</h2>
            <p className="text-sm text-stone-500 leading-relaxed">
              リタイアすると冒険は失敗扱いになります。<br />本当によろしいですか？
            </p>
          </div>

          {/* ボタン */}
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSaving}
              className="w-full rounded-2xl py-3.5 text-sm font-black text-white shadow-lg transition active:scale-95 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #b91c1c, #ef4444)',
                boxShadow:  '0 4px 14px rgba(239,68,68,0.4)',
              }}
            >
              {isSaving ? '処理中...' : '🏳️ はい、リタイアする'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="w-full rounded-2xl border-2 border-stone-200 bg-white py-3.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 active:scale-95 disabled:opacity-50"
            >
              ⚔️ いいえ、続ける
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
