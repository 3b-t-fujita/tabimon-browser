'use client';

/**
 * リザルト確定ページ。詳細設計 v4 §8 に準拠。
 *
 * フロー:
 *   1. ?type=SUCCESS|FAILURE|RETIRE をURLから取得
 *   2. GetResultPendingStateUseCase でセッション確認
 *   3. FinalizeAdventureResultUseCase で報酬反映・resultPendingFlag=false
 *   4. RollAdventureCandidateUseCase で候補抽選（SUCCESS のみ）
 *   5. 候補あり → /adventure/candidate へ遷移
 *      候補なし → CloseAdventureSessionUseCase → /home へ遷移
 *
 * 二重反映防止:
 *   - resultPendingFlag=false の場合は ResultAlreadyFinal → /home へリダイレクト
 */
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GameLayout } from '@/components/common/GameLayout';
import ResultSummaryView from '@/components/result/ResultSummaryView';
import { AdventureResultType } from '@/common/constants/enums';
import { useResultStore } from '@/stores/resultStore';
import { GetResultPendingStateUseCase } from '@/application/result/getResultPendingStateUseCase';
import { FinalizeAdventureResultUseCase } from '@/application/result/finalizeAdventureResultUseCase';
import { RollAdventureCandidateUseCase } from '@/application/result/rollAdventureCandidateUseCase';
import { CloseAdventureSessionUseCase } from '@/application/result/closeAdventureSessionUseCase';
import { AdventureErrorCode } from '@/common/errors/AppErrorCode';

function parseResultType(raw: string | null): AdventureResultType | null {
  if (raw === 'SUCCESS') return AdventureResultType.Success;
  if (raw === 'FAILURE') return AdventureResultType.Failure;
  if (raw === 'RETIRE')  return AdventureResultType.Retire;
  return null;
}

function AdventureResultContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const {
    resultType, resultPhase, expGained, newLevel, leveledUp, stageUnlocked,
    errorMessage, isSaving,
    setResultType, setResultPhase, setRewardInfo, setError, setIsSaving, reset,
  } = useResultStore();

  useEffect(() => {
    reset();
    const typeParam = parseResultType(searchParams.get('type'));

    if (!typeParam) {
      // type不明（クラッシュ復旧など）→ ホームへ
      router.replace('/home');
      return;
    }

    setResultType(typeParam);

    (async () => {
      setIsSaving(true);
      try {
        // ---- 1. セッション確認 ----
        const getStateUC = new GetResultPendingStateUseCase();
        const stateResult = await getStateUC.execute();

        if (!stateResult.ok) {
          // 既に確定済みならホームへ（二重反映防止）
          if (stateResult.errorCode === AdventureErrorCode.ResultAlreadyFinal) {
            router.replace('/home');
            return;
          }
          setError(stateResult.message ?? stateResult.errorCode);
          return;
        }

        const session = stateResult.value;

        // ---- 2. 報酬確定 ----
        const finalizeUC = new FinalizeAdventureResultUseCase();
        const finalizeResult = await finalizeUC.execute(session, typeParam);

        if (!finalizeResult.ok) {
          setError(finalizeResult.message ?? finalizeResult.errorCode);
          return;
        }

        const { updatedSession, expGained: exp, newLevel: lvl, leveledUp: lu, stageUnlocked: su } = finalizeResult.value;
        setRewardInfo({ expGained: exp, newLevel: lvl, leveledUp: lu, stageUnlocked: su });
        setResultPhase('RESULT_FINALIZED');

        // ---- 3. 候補抽選（SUCCESS のみ） ----
        const rollUC = new RollAdventureCandidateUseCase();
        const rollResult = await rollUC.execute(updatedSession, typeParam);

        if (!rollResult.ok) {
          setError(rollResult.message ?? rollResult.errorCode);
          return;
        }

        if (rollResult.value.candidate) {
          // 候補あり → 候補画面へ
          setResultPhase('CANDIDATE_PENDING');
          router.push('/adventure/candidate');
        } else {
          // 候補なし → セッションクローズ → ホーム
          const closeUC = new CloseAdventureSessionUseCase();
          await closeUC.execute();
          setResultPhase('COMPLETED');
          // 少し待ってホームへ遷移（結果表示を見せる）
          setTimeout(() => router.push('/home'), 1500);
        }
      } finally {
        setIsSaving(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- エラー表示 ----
  if (resultPhase === 'FAILED') {
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

  // ---- ローディング中 ----
  if (resultPhase === 'RESULT_PENDING' || !resultType) {
    return (
      <GameLayout>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <p className="text-lg animate-pulse font-bold">リザルト確定中...</p>
          <p className="text-gray-400 text-sm">しばらくお待ちください</p>
        </div>
      </GameLayout>
    );
  }

  // ---- 結果表示 ----
  return (
    <GameLayout>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <ResultSummaryView
          resultType={resultType}
          stageId={''}
          expGained={expGained}
          newLevel={newLevel}
          leveledUp={leveledUp}
          stageUnlocked={stageUnlocked}
        />

        {resultPhase === 'RESULT_FINALIZED' && (
          <p className="text-center text-sm text-stone-500 animate-pulse">
            {isSaving ? '処理中...' : '候補を確認中...'}
          </p>
        )}

        {resultPhase === 'CANDIDATE_PENDING' && (
          <p className="text-center text-sm text-emerald-600 font-medium">
            新しい仲間候補がいます！ →
          </p>
        )}

        {resultPhase === 'COMPLETED' && (
          <p className="text-center text-sm text-stone-500">
            ホームへ戻ります...
          </p>
        )}
      </div>
    </GameLayout>
  );
}

export default function AdventureResultPage() {
  return (
    <Suspense>
      <AdventureResultContent />
    </Suspense>
  );
}
