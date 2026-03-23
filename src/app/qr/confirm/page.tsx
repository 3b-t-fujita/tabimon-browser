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
          <p className="text-2xl">✅</p>
          <p className="font-bold text-emerald-700">{completedMsg}</p>
        </div>
      </GameLayout>
    );
  }

  // ---- エラー表示 ----
  if (phase === 'QR_ERROR' && errorMessage) {
    return (
      <GameLayout>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <p className="font-bold text-red-500">受取できませんでした</p>
          <p className="text-sm text-gray-500">{errorMessage}</p>
          <div className="flex gap-3 w-full max-w-xs">
            <button
              type="button"
              onClick={() => router.push('/qr/scan')}
              className="flex-1 rounded-xl border border-stone-300 py-2 text-sm text-stone-600"
            >
              再スキャン
            </button>
            <button
              type="button"
              onClick={() => router.push('/home')}
              className="flex-1 rounded-xl bg-gray-700 py-2 text-sm text-white"
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
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.back()} className="text-stone-500 text-sm">← 戻る</button>
          <h1 className="text-lg font-bold">QR受取確認</h1>
        </div>

        <p className="text-sm text-stone-500">受取先を選んでください</p>

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
          <p className="text-center text-sm text-stone-500 animate-pulse">保存中...</p>
        )}
      </div>

      {/* 見送り確認ダイアログ */}
      {showSkipConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 flex flex-col gap-4">
            <p className="font-bold text-stone-800">本当に見送りますか？</p>
            <p className="text-sm text-stone-500">
              見送ると履歴に残りません。同じQRを後で読み取ることもできます。
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeSkipConfirm}
                disabled={isSaving}
                className="flex-1 rounded-xl border border-stone-300 py-2 text-sm text-stone-600"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSkipConfirmed}
                disabled={isSaving}
                className="flex-1 rounded-xl bg-stone-600 py-2 text-sm font-bold text-white"
              >
                見送る
              </button>
            </div>
          </div>
        </div>
      )}
    </GameLayout>
  );
}
