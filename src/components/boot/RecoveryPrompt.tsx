/**
 * Recovery Prompt component。
 * 復旧対象セッションがある場合に案内を出す。
 * 「続きから進む」か「通常ホームへ」を選ぶ。
 */
'use client';

import { useAppUiStore, RouteState } from '@/stores/appUiStore';
import type { RecoveryPromptViewModel } from '@/application/viewModels/recoveryPromptViewModel';

interface Props {
  recoveryInfo: RecoveryPromptViewModel;
}

export function RecoveryPrompt({ recoveryInfo }: Props) {
  const { setRouteState, setRecoveryPromptOpen } = useAppUiStore();

  const typeLabel = recoveryInfo.type === 'PENDING_RESULT'
    ? 'リザルト確定待ち'
    : '冒険途中';

  function handleContinue() {
    setRecoveryPromptOpen(false);
    // TODO: フェーズ4で冒険/リザルト画面へ本接続
    // 現時点では Home にモーダル形式で「続き」表示
    setRouteState(RouteState.Home);
  }

  function handleGoHome() {
    setRecoveryPromptOpen(false);
    setRouteState(RouteState.Home);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="text-4xl">⚠️</div>
      <h2 className="text-center text-xl font-bold text-stone-800">
        前回の冒険が残っています
      </h2>
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <p className="font-semibold">{typeLabel}</p>
        <p className="mt-1 text-stone-600">ステージ: {recoveryInfo.stageId}</p>
      </div>
      <p className="text-center text-sm text-stone-500">
        続きから進むか、ホームへ戻るか選んでください。
      </p>
      <div className="flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={handleContinue}
          className="w-full rounded-xl bg-emerald-500 py-3 text-base font-bold text-white shadow transition hover:bg-emerald-600 active:scale-95"
        >
          続きから進む
        </button>
        <button
          type="button"
          onClick={handleGoHome}
          className="w-full rounded-xl border border-stone-300 py-3 text-base font-medium text-stone-600 transition hover:bg-stone-100 active:scale-95"
        >
          通常ホームへ
        </button>
      </div>
    </div>
  );
}
