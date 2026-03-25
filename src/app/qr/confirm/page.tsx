'use client';

/**
 * QR受取確認ページ。
 * scan ページから遷移し、受取先（仲間 / 助っ人 / 見送り）を選択する。
 *
 * フロー:
 *   1. qrStore から parsedPayload を取得
 *   2. QrPayloadPreview で内容確認
 *   3. 仲間にする → AcceptQrAsOwnedMonsterUseCase（上限時は単純拒否エラー表示）
 *   4. 助っ人にする → AcceptQrAsSupportMonsterUseCase（上限時は単純拒否エラー表示）
 *   5. 見送る → 確認ダイアログ → SkipQrReceiveUseCase（履歴更新なし）
 *
 * 重要:
 *   - 上限時は入替画面へ遷移しない（単純拒否）
 *   - 見送り時は履歴更新しない
 *   - 重複判定はここで行う（validateQrDuplicateUseCase）
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameLayout } from '@/components/common/GameLayout';
import QrPayloadPreview from '@/components/qr/QrPayloadPreview';
import QrReceiveActionPanel from '@/components/qr/QrReceiveActionPanel';
import { useQrStore } from '@/stores/qrStore';
import { ValidateQrDuplicateUseCase } from '@/application/qr/validateQrDuplicateUseCase';
import { AcceptQrAsOwnedMonsterUseCase } from '@/application/qr/acceptQrAsOwnedMonsterUseCase';
import { AcceptQrAsSupportMonsterUseCase } from '@/application/qr/acceptQrAsSupportMonsterUseCase';
import { SkipQrReceiveUseCase } from '@/application/qr/skipQrReceiveUseCase';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import type { QrReceiveDestination } from '@/domain/entities/QrPayload';

export default function QrConfirmPage() {
  const router = useRouter();
  const {
    phase, parsedPayload, errorMessage, completedMsg,
    showSkipConfirm,
    setPhase, setError, setCompleted,
    openSkipConfirm, closeSkipConfirm, reset,
  } = useQrStore();

  // payload がなければ scan に戻す
  useEffect(() => {
    if (!parsedPayload) {
      router.replace('/qr/scan');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!parsedPayload) return null;

  const isSaving = phase === 'QR_SAVING';

  // ---- 重複チェック + 受取実行 ----
  const handleReceive = async (destination: QrReceiveDestination) => {
    setPhase('QR_VALIDATE_DUPLICATE');

    // セーブデータ読込（重複チェック用）
    const tx = new SaveTransactionService();
    const loadResult = await tx.load();
    if (!loadResult.ok) {
      setError(loadResult.message ?? 'セーブデータ読み込みに失敗しました');
      return;
    }

    const save = loadResult.value;
    const owned    = save?.ownedMonsters    ?? [];
    const supports = save?.supportMonsters  ?? [];
    const history  = save?.qrReceiveHistory ?? [];

    // 重複・上限検証
    const dupUC = new ValidateQrDuplicateUseCase();
    const dupResult = dupUC.execute({ payload: parsedPayload, destination, owned, supports, history });
    if (!dupResult.ok) {
      setError(dupResult.message ?? dupResult.errorCode);
      return;
    }

    if (destination === 'dismiss') {
      // 見送り：DB書き込みなし、履歴更新なし
      new SkipQrReceiveUseCase().execute();
      setCompleted('見送りました');
      setTimeout(() => { reset(); router.push('/home'); }, 1000);
      return;
    }

    // ---- 受取保存 ----
    setPhase('QR_SAVING');

    if (destination === 'owned') {
      const uc = new AcceptQrAsOwnedMonsterUseCase();
      const result = await uc.execute(parsedPayload);
      if (!result.ok) { setError(result.message ?? result.errorCode); return; }
      setCompleted(`${result.value.addedMonster.displayName} を仲間にしました！`);
    } else {
      const uc = new AcceptQrAsSupportMonsterUseCase();
      const result = await uc.execute(parsedPayload);
      if (!result.ok) { setError(result.message ?? result.errorCode); return; }
      setCompleted(`${result.value.addedSupport.displayName} を助っ人にしました！`);
    }

    setTimeout(() => { reset(); router.push('/home'); }, 1200);
  };

  // ---- 見送り確認 ----
  const handleSkipConfirmed = () => {
    closeSkipConfirm();
    handleReceive('dismiss');
  };

  // ---- 完了表示 ----
  if (phase === 'QR_COMPLETED' && completedMsg) {
    return (
      <GameLayout>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <span className="text-5xl">✅</span>
          <p className="text-base font-black text-emerald-700 text-center">{completedMsg}</p>
          <p className="text-sm text-stone-400 animate-pulse">ホームへ戻ります...</p>
        </div>
      </GameLayout>
    );
  }

  // ---- エラー表示 ----
  if (phase === 'QR_ERROR' && errorMessage) {
    return (
      <GameLayout>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <span className="text-4xl">⚠️</span>
          <p className="font-black text-red-500">受取できませんでした</p>
          <p className="text-sm text-stone-400 text-center">{errorMessage}</p>
          <div className="flex gap-2.5 w-full max-w-xs mt-2">
            <button
              type="button"
              onClick={() => router.push('/qr/scan')}
              className="flex-1 rounded-2xl border-2 border-stone-200 py-3 text-sm font-bold text-stone-600 hover:bg-stone-50"
            >
              再スキャン
            </button>
            <button
              type="button"
              onClick={() => router.push('/home')}
              className="flex-1 rounded-2xl py-3 text-sm font-black text-white shadow"
              style={{ background: 'linear-gradient(135deg, #1f2937, #374151)' }}
            >
              ホームへ
            </button>
          </div>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout>
      <div className="flex flex-1 flex-col" style={{ background: '#f8fafc' }}>

        {/* ヘッダー */}
        <header className="shrink-0 border-b border-stone-200 bg-white px-4 py-3.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1.5 text-sm font-semibold text-stone-600"
          >
            ← 戻る
          </button>
          <h1 className="mt-2 text-xl font-black text-stone-900">QR受取確認</h1>
          <p className="text-xs text-stone-400 mt-0.5">受取先を選んでください</p>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pb-6">

          {/* payload プレビュー */}
          <QrPayloadPreview payload={parsedPayload} />

          {/* アクション */}
          <QrReceiveActionPanel
            onAcceptOwned={()   => handleReceive('owned')}
            onAcceptSupport={() => handleReceive('support')}
            onSkip={openSkipConfirm}
            disabled={isSaving}
          />

          {isSaving && (
            <p className="text-center text-sm text-stone-400 animate-pulse">保存中...</p>
          )}

        </div>
      </div>

      {/* 見送り確認ダイアログ */}
      {showSkipConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
        >
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #6b7280, #9ca3af)' }} />
            <div className="flex flex-col gap-4 px-6 pt-5 pb-6">
              <div>
                <p className="font-black text-stone-800">本当に見送りますか？</p>
                <p className="mt-1.5 text-sm text-stone-500 leading-relaxed">
                  見送ると履歴に残りません。<br />同じQRを後で読み取ることもできます。
                </p>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={closeSkipConfirm}
                  disabled={isSaving}
                  className="flex-1 rounded-2xl border-2 border-stone-200 py-3 text-sm font-bold text-stone-600 hover:bg-stone-50 disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleSkipConfirmed}
                  disabled={isSaving}
                  className="flex-1 rounded-2xl py-3 text-sm font-black text-white shadow disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #374151, #6b7280)' }}
                >
                  見送る
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </GameLayout>
  );
}
