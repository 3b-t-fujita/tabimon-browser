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
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SoftCard } from '@/components/common/SoftCard';
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
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
          <span className="text-4xl animate-pulse">🐾</span>
          <p className="text-base font-black text-stone-700 animate-pulse">新しい仲間候補を確認中...</p>
          <p className="text-sm text-stone-400">出会いの内容を読み込んでいます</p>
        </div>
      </GameLayout>
    );
  }

  // ---- エラー ----
  if (errorMessage) {
    return (
      <GameLayout>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <span className="text-4xl">⚠️</span>
          <p className="font-black text-red-500">エラーが発生しました</p>
          <p className="text-sm text-stone-400 text-center">{errorMessage}</p>
          <PrimaryButton onClick={() => router.push('/home')} className="mt-2 py-3 text-sm shadow-sm" background="#44403c">
            ホームへ戻る
          </PrimaryButton>
        </div>
      </GameLayout>
    );
  }

  if (!candidate) return null;

  return (
    <GameLayout>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-[#f5f7f0] px-5 py-5">
        <SoftCard className="p-5">
          <p className="text-[10px] font-black tracking-[0.14em] text-[#6c4324]/70">新しいなかま</p>
          <p className="mt-2 text-2xl font-black text-[#2c302b]">新しい仲間候補に出会いました</p>
          <p className="mt-2 text-sm leading-6 text-[#595c57]">ここで仲間にするか、今回は見送るかを決められます。受け入れるとすぐに仲間一覧へ反映されます。</p>
        </SoftCard>

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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
        >
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #7d5231, #b02500)' }} />
            <div className="flex flex-col gap-4 px-6 pt-5 pb-6">
              <div>
                <p className="font-black text-[#2c302b]">本当に見送りますか？</p>
                <p className="mt-1.5 text-sm leading-relaxed text-[#595c57]">
                  見送ると、この候補は二度と現れません。
                </p>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSkipConfirm(false)}
                  disabled={isSaving}
                  className="flex-1 rounded-2xl border-2 border-stone-200 py-3 text-sm font-bold text-[#595c57] hover:bg-stone-50 disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleSkipConfirmed}
                  disabled={isSaving}
                  className="flex-1 rounded-2xl py-3 text-sm font-black text-white shadow disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #7d5231, #b02500)' }}
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
