'use client';

/**
 * 仲間入替ページ。詳細設計 v4 §8.8 候補受取（上限時）に準拠。
 *
 * フロー:
 *   1. IndexedDB から ownedMonsters + pendingCandidate を読み込む
 *   2. 候補なし → /home へリダイレクト
 *   3. CapacityReplacePanel で手放すモンスターを選択（相棒は選択不可）
 *   4. 確認 → ReplaceOwnedMonsterWithCandidateUseCase(releaseUniqueId) → /home
 *
 * 注意:
 *   - このページは「冒険候補のみ」の導線（QR上限時は単純拒否で来ない）
 *   - 相棒の手放しは MainMonsterPolicy で防止済み（UseCase 側でも弾く）
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GameLayout } from '@/components/common/GameLayout';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SoftCard } from '@/components/common/SoftCard';
import CandidateCard from '@/components/result/CandidateCard';
import CapacityReplacePanel from '@/components/result/CapacityReplacePanel';
import type { PendingCandidate } from '@/domain/entities/PendingCandidate';
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';
import type { MonsterId } from '@/types/ids';
import { ReplaceOwnedMonsterWithCandidateUseCase } from '@/application/result/replaceOwnedMonsterWithCandidateUseCase';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { getMonsterMasterById } from '@/infrastructure/master/monsterMasterRepository';

export default function AdventureCandidateReplacePage() {
  const router = useRouter();

  const [candidate, setCandidate]             = useState<PendingCandidate | null>(null);
  const [candidateDisplayName, setCandidateDisplayName] = useState<string>('');
  const [ownedMonsters, setOwnedMonsters]     = useState<OwnedMonster[]>([]);
  const [isLoading, setIsLoading]             = useState(true);
  const [isSaving, setIsSaving]               = useState(false);
  const [pendingReleaseId, setPendingReleaseId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage]       = useState<string | null>(null);

  // ---- 初期ロード ----
  useEffect(() => {
    (async () => {
      try {
        const tx = new SaveTransactionService();
        const loadResult = await tx.load();

        if (!loadResult.ok || !loadResult.value?.pendingCandidate) {
          router.replace('/home');
          return;
        }

        const save = loadResult.value;
        const c = save.pendingCandidate!;

        setCandidate(c);
        setOwnedMonsters([...save.ownedMonsters]);

        const master = await getMonsterMasterById(c.monsterMasterId as string);
        setCandidateDisplayName(master?.displayName ?? (c.monsterMasterId as string));
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- 手放し選択 → 確認 ----
  const handleSelectRelease = (uniqueId: string) => {
    setPendingReleaseId(uniqueId);
  };

  // ---- 確認後に入替実行 ----
  const handleConfirmReplace = async () => {
    if (!pendingReleaseId) return;
    setIsSaving(true);
    try {
      const uc = new ReplaceOwnedMonsterWithCandidateUseCase();
      const result = await uc.execute(pendingReleaseId as MonsterId);

      if (!result.ok) {
        setErrorMessage(result.message ?? result.errorCode);
        setPendingReleaseId(null);
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
          <p className="text-lg animate-pulse font-bold">入替候補を確認中...</p>
          <p className="text-sm text-stone-400">仲間一覧と候補データを読み込んでいます</p>
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
          <PrimaryButton onClick={() => router.push('/home')} className="mt-2 py-2 text-sm shadow-sm" background="#44403c">
            ホームへ戻る
          </PrimaryButton>
        </div>
      </GameLayout>
    );
  }

  if (!candidate) return null;

  // 手放し対象の表示名
  const releaseTarget = ownedMonsters.find((m) => m.uniqueId === pendingReleaseId);

  return (
    <GameLayout>
      <div className="flex flex-1 flex-col gap-4 bg-[#f5f7f0] px-5 py-5">
        {/* ヘッダー */}
        <SoftCard className="p-5 text-center">
          <p className="text-[10px] font-black tracking-[0.14em] text-[#6c4324]/70">入替確認</p>
          <p className="mt-2 text-2xl font-black text-[#2c302b]">仲間が上限です</p>
          <p className="mt-2 text-sm leading-6 text-[#595c57]">手放す仲間を選ぶと、新しい候補と入れ替えられます。相棒は選べません。</p>
        </SoftCard>

        {/* 候補カード（受け入れる側） */}
        <CandidateCard candidate={candidate} displayName={candidateDisplayName} />

        {/* 手放す仲間を選択 */}
        <CapacityReplacePanel
          owned={ownedMonsters}
          onSelect={handleSelectRelease}
          disabled={isSaving}
        />
      </div>

      {/* 入替確認ダイアログ */}
      {pendingReleaseId && releaseTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-[28px] bg-white p-6">
            <p className="font-bold text-[#2c302b]">入替を確認</p>
            <p className="text-sm text-[#595c57]">
              <span className="font-medium text-[#b02500]">{releaseTarget.displayName}</span>
              （Lv.{releaseTarget.level}）を手放して、
              <span className="font-medium text-[#29664c]">{candidateDisplayName}</span>
              を仲間にしますか？
            </p>
            <p className="text-xs text-[#757872]">※ 手放したモンスターは戻せません</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPendingReleaseId(null)}
                disabled={isSaving}
                className="flex-1 rounded-xl border border-stone-300 py-2 text-sm text-[#595c57] hover:bg-stone-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirmReplace}
                disabled={isSaving}
                className="flex-1 rounded-xl bg-[#29664c] py-2 text-sm font-bold text-white hover:bg-[#246147] disabled:opacity-50"
              >
                入替える
              </button>
            </div>
          </div>
        </div>
      )}
    </GameLayout>
  );
}
