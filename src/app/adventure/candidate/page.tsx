'use client';

/**
 * 候補確認ページ。詳細設計 v4 §8.8 候補受取/見送りに準拠。
 *
 * フロー:
 *   1. IndexedDB から pendingCandidate を読み込む
 *   2. モンスターマスタから表示名を取得し CandidateCard を表示
 *   3. 受取 → AcceptPendingCandidateUseCase
 *        成功       → /home
 *        上限（CAPACITY_FULL） → /adventure/candidate/replace
 *   4. 見送り → 確認ダイアログ → SkipPendingCandidateUseCase → /home
 *
 * 注意:
 *   - pendingCandidate が存在しない場合は /home へリダイレクト
 *   - QR受取の上限時単純拒否とは異なり、候補のみ入替導線あり
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GameLayout } from '@/components/common/GameLayout';
import CandidateCard from '@/components/result/CandidateCard';
import CandidateActionPanel from '@/components/result/CandidateActionPanel';
import type { PendingCandidate } from '@/domain/entities/PendingCandidate';
import { MonsterErrorCode } from '@/common/errors/AppErrorCode';
import { AcceptPendingCandidateUseCase } from '@/application/result/acceptPendingCandidateUseCase';
import { SkipPendingCandidateUseCase } from '@/application/result/skipPendingCandidateUseCase';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { getMonsterMasterById } from '@/infrastructure/master/monsterMasterRepository';

export default function AdventureCandidatePage() {
  const router = useRouter();

  const [candidate, setCandidate]         = useState<PendingCandidate | null>(null);
  const [displayName, setDisplayName]     = useState<string>('');
  const [isLoading, setIsLoading]         = useState(true);
  const [isSaving, setIsSaving]           = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [errorMessage, setErrorMessage]   = useState<string | null>(null);

  // ---- 初期ロード ----
  useEffect(() => {
    (async () => {
      try {
        const tx = new SaveTransactionService();
        const loadResult = await tx.load();

        if (!loadResult.ok || !loadResult.value?.pendingCandidate) {
          // 候補なし → ホームへ
          router.replace('/home');
          return;
        }

        const c = loadResult.value.pendingCandidate;
        setCandidate(c);

        // 表示名をマスタから取得
        const master = await getMonsterMasterById(c.monsterMasterId as string);
        setDisplayName(master?.displayName ?? (c.monsterMasterId as string));
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- 受取 ----
  const handleAccept = async () => {
    setIsSaving(true);
    try {
      const uc = new AcceptPendingCandidateUseCase();
      const result = await uc.execute();

      if (!result.ok) {
        if (result.errorCode === MonsterErrorCode.OwnedCapacityFull) {
          // 上限 → 入替画面へ
          router.push('/adventure/candidate/replace');
          return;
        }
        setErrorMessage(result.message ?? result.errorCode);
        return;
      }

      router.push('/home');
    } finally {
      setIsSaving(false);
    }
  };

  // ---- 見送り（確認後） ----
  const handleSkipConfirmed = async () => {
    setShowSkipConfirm(false);
    setIsSaving(true);
    try {
      const uc = new SkipPendingCandidateUseCase();
      const result = await uc.execute();

      if (!result.ok) {
        setErrorMessage(result.message ?? result.errorCode);
        return;
      }

      router.push('/home');
    } finally {
      setIsSaving(false);
    }
  };

  // ---- ローディング ----
  if (isLoading) {
    return (
      <GameLayout>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <p className="text-lg animate-pulse font-bold">候補を確認中...</p>
        </div>
      </GameLayout>
    );
  }

  // ---- エラー ----
  if (errorMessage) {
    return (
      <GameLayout>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <p className="text-red-500 font-bold">エラーが発生しました</p>
          <p className="text-sm text-gray-400">{errorMessage}</p>
          <button
            type="button"
            onClick={() => router.push('/home')}
            className="mt-2 px-6 py-2 rounded bg-gray-700 text-white text-sm"
          >
            ホームへ戻る
          </button>
        </div>
      </GameLayout>
    );
  }

  if (!candidate) return null;

  return (
    <GameLayout>
      <div className="flex flex-1 flex-col gap-6 p-4">
        {/* ヘッダー */}
        <div className="text-center">
          <p className="text-lg font-bold text-emerald-700">新しい仲間候補！</p>
          <p className="text-sm text-stone-500 mt-1">仲間にしますか？</p>
        </div>

        {/* 候補カード */}
        <CandidateCard candidate={candidate} displayName={displayName} />

        {/* アクション */}
        <CandidateActionPanel
          onAccept={handleAccept}
          onSkip={() => setShowSkipConfirm(true)}
          disabled={isSaving}
        />
      </div>

      {/* 見送り確認ダイアログ */}
      {showSkipConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 flex flex-col gap-4">
            <p className="font-bold text-stone-800">本当に見送りますか？</p>
            <p className="text-sm text-stone-500">
              見送ると、この候補は二度と現れません。
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSkipConfirm(false)}
                disabled={isSaving}
                className="flex-1 rounded-xl border border-stone-300 py-2 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSkipConfirmed}
                disabled={isSaving}
                className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
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
