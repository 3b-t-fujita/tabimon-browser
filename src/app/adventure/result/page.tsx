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
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GameLayout } from '@/components/common/GameLayout';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SoftCard } from '@/components/common/SoftCard';
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
  const [stageId, setStageId] = useState('');
  const [nextRoute, setNextRoute] = useState<string | null>(null);
  const {
    resultType, resultPhase, expGained, newLevel, leveledUp, stageUnlocked, statGains, evolved, evolvedName,
    bondPointsGained, bondRankBefore, bondRankAfter, skillUpdates, firstClearBonusExp, farmRewardMessage,
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
        setStageId(session.stageId);

        // ---- 2. 報酬確定 ----
        const finalizeUC = new FinalizeAdventureResultUseCase();
        const finalizeResult = await finalizeUC.execute(session, typeParam);

        if (!finalizeResult.ok) {
          setError(finalizeResult.message ?? finalizeResult.errorCode);
          return;
        }

        const { updatedSession, expGained: exp, newLevel: lvl, leveledUp: lu, stageUnlocked: su, statGains: sg, evolved: ev, evolvedName: en, bondPointsGained: bg, bondRankBefore: brb, bondRankAfter: bra, skillUpdates: sku, firstClearBonusExp: fcbe, farmRewardMessage: frm } = finalizeResult.value;
        setRewardInfo({ expGained: exp, newLevel: lvl, leveledUp: lu, stageUnlocked: su, statGains: sg, evolved: ev, evolvedName: en, bondPointsGained: bg, bondRankBefore: brb, bondRankAfter: bra, skillUpdates: sku, firstClearBonusExp: fcbe, farmRewardMessage: frm });
        setResultPhase('RESULT_FINALIZED');

        // ---- 3. 候補抽選（SUCCESS のみ） ----
        const rollUC = new RollAdventureCandidateUseCase();
        const rollResult = await rollUC.execute(updatedSession, typeParam);

        if (!rollResult.ok) {
          setError(rollResult.message ?? rollResult.errorCode);
          return;
        }

        if (rollResult.value.candidate) {
          // 候補あり → CTA で候補画面へ
          setResultPhase('CANDIDATE_PENDING');
          setNextRoute('/adventure/candidate');
        } else {
          // 候補なし → セッションクローズ → CTA でホーム
          const closeUC = new CloseAdventureSessionUseCase();
          await closeUC.execute();
          setResultPhase('COMPLETED');
          setNextRoute('/home');
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

  // ---- ローディング中 ----
  if (resultPhase === 'RESULT_PENDING' || !resultType) {
    return (
      <GameLayout>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
          <span className="text-4xl animate-pulse">🏆</span>
          <p className="text-base font-black text-stone-700 animate-pulse">リザルト確定中...</p>
          <p className="text-sm text-stone-400">経験値や解放状況をまとめています</p>
        </div>
      </GameLayout>
    );
  }

  // ---- 結果表示 ----
  return (
    <GameLayout>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pb-6" style={{ background: '#f8fafc' }}>
        <ResultSummaryView
          resultType={resultType}
          stageId={stageId}
          expGained={expGained}
          firstClearBonusExp={firstClearBonusExp}
          newLevel={newLevel}
          leveledUp={leveledUp}
          stageUnlocked={stageUnlocked}
          statGains={statGains}
          evolved={evolved}
          evolvedName={evolvedName}
          bondPointsGained={bondPointsGained}
          bondRankBefore={bondRankBefore}
          bondRankAfter={bondRankAfter}
          skillUpdates={skillUpdates}
          farmRewardMessage={farmRewardMessage}
        />

        {resultPhase === 'RESULT_FINALIZED' && (
          <SoftCard tone="soft" className="px-4 py-3 text-center">
            <p className="text-sm text-stone-500 animate-pulse">
              {isSaving ? '最終処理を進めています...' : '次の展開を確認しています...'}
            </p>
          </SoftCard>
        )}

        {resultPhase === 'CANDIDATE_PENDING' && (
          <SoftCard tone="soft" className="space-y-3 px-4 py-4 text-center">
            <p className="text-sm font-black text-emerald-700">✨ 新しい仲間候補がいます！</p>
            <p className="text-xs text-emerald-600">つぎに進むと候補確認画面へ移動します。</p>
            <PrimaryButton
              type="button"
              onClick={() => nextRoute && router.push(nextRoute)}
              className="py-3 text-sm shadow-sm"
            >
              候補を見に行く
            </PrimaryButton>
          </SoftCard>
        )}

        {resultPhase === 'COMPLETED' && (
          <SoftCard tone="soft" className="space-y-3 px-4 py-4 text-center">
            <p className="text-sm text-stone-500">
              結果の反映が終わりました。ホームへ戻れます。
            </p>
            <PrimaryButton
              type="button"
              onClick={() => nextRoute && router.push(nextRoute)}
              className="py-3 text-sm shadow-sm"
            >
              ホームへ戻る
            </PrimaryButton>
          </SoftCard>
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
