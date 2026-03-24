'use client';

/**
 * 探索本編ページ（AdventurePlayPage）。
 * 詳細設計 v4 §6 / フェーズ6指示書に準拠。
 *
 * 重要仕様:
 * - 冒険中は自由な画面遷移を禁止する（戻る = リタイア確認）
 * - currentNodeIndex の更新は UseCase に委譲（UI 直書き禁止）
 * - ノード進行確定時は保存必須
 * - 保存失敗時は main を壊さない
 */
import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GameLayout } from '@/components/common/GameLayout';
import { AdventureNodeView } from '@/components/adventure/AdventureNodeView';
import { BranchSelectPanel } from '@/components/adventure/BranchSelectPanel';
import { EventPanel } from '@/components/adventure/EventPanel';
import { RetireConfirmDialog } from '@/components/adventure/RetireConfirmDialog';
import { NodeType } from '@/common/constants/enums';
import { useAdventurePlayStore } from '@/stores/adventurePlayStore';
import { GetCurrentAdventureSessionUseCase } from '@/application/adventure/getCurrentAdventureSessionUseCase';
import { ResolveCurrentNodeUseCase } from '@/application/adventure/resolveCurrentNodeUseCase';
import { ProceedAdventureNodeUseCase } from '@/application/adventure/proceedAdventureNodeUseCase';
import { SelectAdventureBranchUseCase } from '@/application/adventure/selectAdventureBranchUseCase';
import { ResolveAdventureEventUseCase } from '@/application/adventure/resolveAdventureEventUseCase';
import { PrepareBattleUseCase } from '@/application/adventure/prepareBattleUseCase';
import { ConfirmRetireAdventureUseCase } from '@/application/adventure/confirmRetireAdventureUseCase';
import { ReachGoalUseCase } from '@/application/adventure/reachGoalUseCase';
import { getStageMasterById } from '@/infrastructure/master/stageMasterRepository';
import { getNodePatternById } from '@/infrastructure/master/nodePatternRepository';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import type { AdventureNode } from '@/domain/entities/NodePattern';

// UseCase インスタンス（コンポーネント外でシングルトン）
const getSessionUC    = new GetCurrentAdventureSessionUseCase();
const resolveNodeUC   = new ResolveCurrentNodeUseCase();
const proceedNodeUC   = new ProceedAdventureNodeUseCase();
const selectBranchUC  = new SelectAdventureBranchUseCase();
const resolveEventUC  = new ResolveAdventureEventUseCase();
const prepareBattleUC = new PrepareBattleUseCase();
const retireUC        = new ConfirmRetireAdventureUseCase();
const goalUC          = new ReachGoalUseCase();

export default function AdventurePlayPage() {
  const router = useRouter();
  const {
    session, currentNode, explorePhase, branchOptions, eventMessage,
    isSaving, saveErrorMessage, showRetireDialog, pendingSession,
    setSession, setCurrentNode, setExplorePhase, setBranchOptions,
    setEventMessage, setIsSaving, setSaveError, setPendingSession,
    openRetireDialog, closeRetireDialog, reset,
  } = useAdventurePlayStore();

  // ----------------------------------------------------------------
  // ノード到達時の状態遷移ロジック
  // ----------------------------------------------------------------
  const applyNodePhase = useCallback(
    (sess: AdventureSession, node: AdventureNode, nodeTotal: number) => {
      setSession(sess);
      setCurrentNode(node);

      switch (node.nodeType) {
        case NodeType.Pass:
          setExplorePhase('AUTO_MOVING');
          break;
        case NodeType.Branch:
          setExplorePhase('BRANCH_SELECTING');
          setBranchOptions(node.branchOptions ?? []);
          break;
        case NodeType.Event:
          setExplorePhase('EVENT_RESOLVING');
          setEventMessage('✨ 何かが起きそうだ... 確認ボタンを押してみよう！');
          break;
        case NodeType.Battle:
        case NodeType.Boss:
          // 戦闘ノードは自動的に PrepareUseCase を実行
          setExplorePhase('BATTLE_PREPARING');
          handlePrepareBattle(sess);
          break;
        case NodeType.Goal:
          setExplorePhase('GOAL_REACHED');
          handleGoalReached(sess);
          break;
        default:
          setExplorePhase('AUTO_MOVING');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ----------------------------------------------------------------
  // 初期ロード
  // ----------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      reset();
      setExplorePhase('LOADING');

      const sessionResult = await getSessionUC.execute();
      if (cancelled) return;

      if (!sessionResult.ok) {
        // セッションなし → ホームへ戻す
        router.replace('/home');
        return;
      }

      const sess = sessionResult.value;
      const nodeResult = await resolveNodeUC.execute(sess);
      if (cancelled) return;

      if (!nodeResult.ok) {
        setSaveError(`ノード解決失敗: ${nodeResult.message ?? nodeResult.errorCode}`);
        return;
      }

      const node = nodeResult.value;

      // ノード総数の取得（進行状況表示用）
      const stageMaster = await getStageMasterById(sess.stageId);
      const pattern = stageMaster ? await getNodePatternById(stageMaster.nodePatternId) : null;
      const nodeTotal = pattern?.nodes.length ?? 0;
      if (cancelled) return;

      applyNodePhase(sess, node, nodeTotal);
    }

    load().catch((e) => {
      if (!cancelled) setSaveError(String(e));
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------
  // ブラウザ back ボタン → リタイア確認へ変換
  // ----------------------------------------------------------------
  useEffect(() => {
    // ダミーエントリをスタックに積んで back を検出する
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      if (explorePhase !== 'RETIRE_CONFIRMING') {
        openRetireDialog();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [explorePhase, openRetireDialog]);

  // ----------------------------------------------------------------
  // PASS ノード前進
  // ----------------------------------------------------------------
  async function handleProceedNode() {
    if (!session || isSaving) return;
    setIsSaving(true);
    try {
      const result = await proceedNodeUC.execute(session);
      if (!result.ok) {
        setSaveError(`ノード進行失敗: ${result.message ?? result.errorCode}`);
        return;
      }
      const { updatedSession } = result.value;
      const nodeResult = await resolveNodeUC.execute(updatedSession);
      if (!nodeResult.ok) {
        setSaveError(`ノード解決失敗: ${nodeResult.message ?? nodeResult.errorCode}`);
        return;
      }
      applyNodePhase(updatedSession, nodeResult.value, 0);
    } finally {
      setIsSaving(false);
    }
  }

  // ----------------------------------------------------------------
  // BRANCH 選択
  // ----------------------------------------------------------------
  async function handleBranchSelect(nextNodeIndex: number) {
    if (!session || isSaving) return;
    setIsSaving(true);
    try {
      const result = await selectBranchUC.execute({ session, selectedNextNodeIndex: nextNodeIndex });
      if (!result.ok) {
        setSaveError(`分岐選択失敗: ${result.message ?? result.errorCode}`);
        return;
      }
      const updatedSession = result.value;
      const nodeResult = await resolveNodeUC.execute(updatedSession);
      if (!nodeResult.ok) {
        setSaveError(`ノード解決失敗: ${nodeResult.message ?? nodeResult.errorCode}`);
        return;
      }
      applyNodePhase(updatedSession, nodeResult.value, 0);
    } finally {
      setIsSaving(false);
    }
  }

  // ----------------------------------------------------------------
  // EVENT 確認（1回目クリック: ランダム抽選 → 結果メッセージ表示）
  // ----------------------------------------------------------------
  async function handleEventConfirm() {
    if (!session || isSaving) return;
    setIsSaving(true);
    try {
      const result = await resolveEventUC.execute(session);
      if (!result.ok) {
        setSaveError(`イベント処理失敗: ${result.message ?? result.errorCode}`);
        return;
      }
      const { updatedSession, triggerBattle } = result.value;

      if (triggerBattle) {
        // ランダムイベント戦闘: メッセージを表示してから prepareBattleUC を呼んで /adventure/battle へ
        setEventMessage(result.value.eventMessage);
        setExplorePhase('BATTLE_PREPARING');
        const prepResult = await prepareBattleUC.execute(updatedSession);
        if (!prepResult.ok) {
          setSaveError(`戦闘準備失敗: ${prepResult.message ?? prepResult.errorCode}`);
          return;
        }
        router.push('/adventure/battle');
        return;
      }

      // HEAL / NOTHING / BOOST: 結果メッセージを表示し、2回目クリック待ちへ
      setEventMessage(result.value.eventMessage);
      setPendingSession(updatedSession);
      setExplorePhase('EVENT_RESULT');
    } finally {
      setIsSaving(false);
    }
  }

  // ----------------------------------------------------------------
  // EVENT 結果確認（2回目クリック: 次ノードへ進む）
  // ----------------------------------------------------------------
  async function handleEventResultProceed() {
    if (!pendingSession || isSaving) return;
    setIsSaving(true);
    try {
      const nodeResult = await resolveNodeUC.execute(pendingSession);
      if (!nodeResult.ok) {
        setSaveError(`ノード解決失敗: ${nodeResult.message ?? nodeResult.errorCode}`);
        return;
      }
      setEventMessage(null);
      setPendingSession(null);
      applyNodePhase(pendingSession, nodeResult.value, 0);
    } finally {
      setIsSaving(false);
    }
  }

  // ----------------------------------------------------------------
  // BATTLE / BOSS 準備
  // ----------------------------------------------------------------
  async function handlePrepareBattle(sess: AdventureSession) {
    setIsSaving(true);
    try {
      const result = await prepareBattleUC.execute(sess);
      if (!result.ok) {
        setSaveError(`戦闘準備失敗: ${result.message ?? result.errorCode}`);
        return;
      }
      // 保存成功 → /adventure/battle へ遷移（フェーズ7 プレースホルダー）
      router.push('/adventure/battle');
    } finally {
      setIsSaving(false);
    }
  }

  // ----------------------------------------------------------------
  // GOAL 到達
  // ----------------------------------------------------------------
  async function handleGoalReached(sess: AdventureSession) {
    setIsSaving(true);
    try {
      const result = await goalUC.execute(sess);
      if (!result.ok) {
        setSaveError(`ゴール処理失敗: ${result.message ?? result.errorCode}`);
        return;
      }
      // 保存成功 → /adventure/result へ遷移（SUCCESS）
      router.push('/adventure/result?type=SUCCESS');
    } finally {
      setIsSaving(false);
    }
  }

  // ----------------------------------------------------------------
  // リタイア確認
  // ----------------------------------------------------------------
  async function handleRetireConfirm() {
    if (!session || isSaving) return;
    setIsSaving(true);
    try {
      const result = await retireUC.execute(session);
      if (!result.ok) {
        setSaveError(`リタイア処理失敗: ${result.message ?? result.errorCode}`);
        return;
      }
      // 保存成功 → /adventure/result へ遷移（RETIRE）
      router.push('/adventure/result?type=RETIRE');
    } finally {
      setIsSaving(false);
    }
  }

  // ----------------------------------------------------------------
  // レンダリング
  // ----------------------------------------------------------------
  const nodeTotal = 0; // フェーズ6 簡易版: ストアへの保持は後続フェーズで改善

  return (
    <GameLayout>
      {/* リタイア確認ダイアログ（オーバーレイ） */}
      {showRetireDialog && (
        <RetireConfirmDialog
          onConfirm={handleRetireConfirm}
          onCancel={closeRetireDialog}
          isSaving={isSaving}
        />
      )}

      <div className="flex flex-1 flex-col gap-0">
        {/* ヘッダー */}
        <header className="flex items-center justify-between bg-stone-800 px-5 py-3">
          <button
            type="button"
            onClick={openRetireDialog}
            className="text-sm text-stone-400 transition hover:text-white"
          >
            ✕ やめる
          </button>
          <h1 className="text-sm font-bold text-white">
            {session?.stageId ?? '冒険中'}
          </h1>
          <div className="w-16" /> {/* スペーサー */}
        </header>

        <div className="flex flex-1 flex-col gap-4 p-5">
          {/* 保存エラー表示 */}
          {explorePhase === 'SAVE_ERROR' && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">保存エラー</p>
              <p>{saveErrorMessage}</p>
            </div>
          )}

          {/* 現在ノード表示 */}
          <AdventureNodeView
            currentNode={currentNode}
            explorePhase={explorePhase}
            stageId={session?.stageId ?? ''}
            nodeTotal={nodeTotal}
          />

          {/* 分岐選択 */}
          {explorePhase === 'BRANCH_SELECTING' && (
            <BranchSelectPanel
              options={branchOptions}
              onSelect={handleBranchSelect}
              isSaving={isSaving}
            />
          )}

          {/* イベント表示（確認前） */}
          {explorePhase === 'EVENT_RESOLVING' && eventMessage && (
            <EventPanel
              message={eventMessage}
              onConfirm={handleEventConfirm}
              isSaving={isSaving}
            />
          )}

          {/* イベント結果表示（確認後・次ノードへ進む前） */}
          {explorePhase === 'EVENT_RESULT' && eventMessage && (
            <EventPanel
              message={eventMessage}
              onConfirm={handleEventResultProceed}
              isSaving={isSaving}
            />
          )}

          {/* 戦闘準備中 */}
          {explorePhase === 'BATTLE_PREPARING' && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-sm font-semibold text-red-700">⚔️ 戦闘が始まります...</p>
              {isSaving && <p className="mt-1 text-xs text-red-400">準備中</p>}
            </div>
          )}

          {/* ゴール到達 */}
          {explorePhase === 'GOAL_REACHED' && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
              <p className="text-sm font-semibold text-emerald-700">🏁 ゴール到達！</p>
              {isSaving && <p className="mt-1 text-xs text-emerald-400">結果を保存中...</p>}
            </div>
          )}

          {/* 前進ボタン（PASS ノード用） */}
          {explorePhase === 'AUTO_MOVING' && (
            <button
              type="button"
              onClick={handleProceedNode}
              disabled={isSaving}
              className="w-full rounded-xl bg-emerald-500 py-4 text-base font-bold text-white shadow transition hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? '保存中...' : '前へ進む →'}
            </button>
          )}

          {/* ローディング表示 */}
          {explorePhase === 'LOADING' && (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-stone-400">読み込み中...</p>
            </div>
          )}
        </div>
      </div>
    </GameLayout>
  );
}
