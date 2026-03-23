'use client';

/**
 * 戦闘画面。詳細設計 v4 §7 戦闘仕様に準拠。
 *
 * フロー:
 *   1. マウント時に session をロードして InitializeBattleUseCase で BattleState を構築
 *   2. BATTLE_RUNNING フェーズで setInterval(500ms) による tick 自動進行
 *   3. プレイヤーはスキルボタンで pendingMainSkillId をキュー
 *   4. 勝敗確定後に ApplyBattleResultUseCase を呼んでセッション保存 → 遷移
 *
 * 重要:
 *   - tick 進行は setInterval で行い、React render に依存しない
 *   - 戦闘計算は UseCase / BattleTickEngine 内で行う（Component に書かない）
 *   - BattleState は IndexedDB に保存しない（ephemeral）
 */
import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GameLayout } from '@/components/common/GameLayout';
import BattlePreparingView from '@/components/battle/BattlePreparingView';
import BattleStatusView from '@/components/battle/BattleStatusView';
import BattleLogPanel from '@/components/battle/BattleLogPanel';
import MainSkillButton from '@/components/battle/MainSkillButton';
import { useBattleStore } from '@/stores/battleStore';
import { useBGM } from '@/hooks/useBGM';
import { useBattleSE } from '@/hooks/useBattleSE';
import { GetCurrentAdventureSessionUseCase } from '@/application/adventure/getCurrentAdventureSessionUseCase';
import { InitializeBattleUseCase } from '@/application/battle/initializeBattleUseCase';
import { ApplyBattleResultUseCase } from '@/application/battle/applyBattleResultUseCase';
import { runBattleTick } from '@/application/battle/runBattleTickUseCase';
import { triggerMainSkill } from '@/application/battle/triggerMainSkillUseCase';
import type { AdventureSession } from '@/domain/entities/AdventureSession';

const TICK_INTERVAL_MS = 500;

export default function AdventureBattlePage() {
  const router     = useRouter();
  const {
    battleState, battlePhase,
    setBattleState, setBattlePhase, setError, reset,
  } = useBattleStore();

  // BGM・SE
  useBGM('battle');
  useBattleSE(battleState);

  // セッション参照（tick コールバック内で参照するため ref で保持）
  const sessionRef        = useRef<AdventureSession | null>(null);
  const applyingRef       = useRef(false);
  const tickIntervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- tick 停止ヘルパー ----
  const stopTick = useCallback(() => {
    if (tickIntervalRef.current !== null) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  }, []);

  // ---- 戦闘結果反映 ----
  const applyResult = useCallback(async () => {
    if (applyingRef.current) return;
    applyingRef.current = true;

    stopTick();
    setBattlePhase('BATTLE_RESULT_APPLYING');

    const currentBattleState = useBattleStore.getState().battleState;
    const session = sessionRef.current;

    if (!currentBattleState || !session) {
      setError('戦闘状態またはセッションが取得できません');
      return;
    }

    const useCase = new ApplyBattleResultUseCase();
    const result  = await useCase.execute(session, currentBattleState);

    if (!result.ok) {
      setError(result.message ?? '戦闘結果の反映に失敗しました');
      return;
    }

    if (result.value.transition === 'CONTINUE_EXPLORE') {
      router.push('/adventure/play');
    } else {
      const type = result.value.resultType ?? 'FAILURE';
      router.push(`/adventure/result?type=${type}`);
    }
  }, [router, stopTick, setBattlePhase, setError]);

  // ---- tick 開始 ----
  const startTick = useCallback(() => {
    if (tickIntervalRef.current !== null) return;

    tickIntervalRef.current = setInterval(() => {
      const store = useBattleStore.getState();
      if (store.battlePhase !== 'BATTLE_RUNNING') return;
      if (!store.battleState) return;

      const next = runBattleTick(store.battleState);
      store.setBattleState(next);

      if (next.outcome !== 'NONE') {
        applyResult();
      }
    }, TICK_INTERVAL_MS);
  }, [applyResult]);

  // ---- 初期化 ----
  useEffect(() => {
    reset();
    applyingRef.current = false;

    (async () => {
      // セッションロード
      const sessionUC = new GetCurrentAdventureSessionUseCase();
      const sessionResult = await sessionUC.execute();
      if (!sessionResult.ok) {
        setError(`セッション読み込み失敗: ${sessionResult.message ?? sessionResult.errorCode}`);
        return;
      }
      sessionRef.current = sessionResult.value;

      // BattleState 初期化
      const initUC = new InitializeBattleUseCase();
      const initResult = await initUC.execute(sessionResult.value);
      if (!initResult.ok) {
        setError(`戦闘初期化失敗: ${initResult.message ?? initResult.errorCode}`);
        return;
      }

      setBattleState(initResult.value);
      setBattlePhase('BATTLE_RUNNING');
      startTick();
    })();

    return () => stopTick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- スキルボタン押下ハンドラ ----
  const handleSkillSelect = useCallback((skillId: string) => {
    const store = useBattleStore.getState();
    if (!store.battleState || store.battlePhase !== 'BATTLE_RUNNING') return;
    const updated = triggerMainSkill(store.battleState, skillId);
    store.setBattleState(updated);
  }, []);

  // ---- 主役スキル一覧 ----
  const mainActor = battleState?.actors.find((a) => a.isMain && !a.isEnemy);
  const mainSkills = mainActor?.skills ?? [];

  // ---- レンダリング ----
  if (battlePhase === 'BATTLE_PREPARING' || battlePhase === 'FAILED') {
    return (
      <GameLayout>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          {battlePhase === 'FAILED' ? (
            <>
              <p className="text-red-400 font-bold">エラーが発生しました</p>
              <p className="text-sm text-gray-400">
                {useBattleStore.getState().errorMessage ?? '不明なエラー'}
              </p>
              <button
                type="button"
                onClick={() => router.push('/adventure/play')}
                className="mt-4 px-6 py-2 rounded bg-gray-700 text-white text-sm"
              >
                探索に戻る
              </button>
            </>
          ) : (
            <BattlePreparingView />
          )}
        </div>
      </GameLayout>
    );
  }

  if (battlePhase === 'BATTLE_RESULT_APPLYING') {
    return (
      <GameLayout>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <p className="text-lg animate-pulse font-bold">
            {battleState?.outcome === 'WIN' ? '🎉 勝利！' : '💀 敗北...'}
          </p>
          <p className="text-gray-400 text-sm">結果を反映中...</p>
        </div>
      </GameLayout>
    );
  }

  // BATTLE_RUNNING
  if (!battleState) return null;

  const isRunning = battlePhase === 'BATTLE_RUNNING';

  return (
    <GameLayout>
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">
            {battleState.isBoss ? '🔥 BOSS戦' : '⚔️ 戦闘中'}
          </span>
          <span className="text-xs text-gray-500">
            tick: {battleState.tickCount}
          </span>
        </div>

        {/* ステータス表示 */}
        <BattleStatusView actors={battleState.actors} />

        {/* 戦闘ログ */}
        <BattleLogPanel log={battleState.log} />

        {/* 主役スキルボタン */}
        <div>
          <div className="text-xs text-gray-400 mb-2">★ 主役スキル（あなたが操作できます）</div>
          <MainSkillButton
            skills={mainSkills}
            disabled={!isRunning || (battleState.pendingMainSkillId !== null)}
            onSelect={handleSkillSelect}
          />
          {battleState.pendingMainSkillId && (
            <p className="text-xs text-yellow-400 mt-1">
              スキル発動待機中: {battleState.pendingMainSkillId}
            </p>
          )}
        </div>

        {/* 味方・敵の自動行動インジケータ */}
        <p className="text-xs text-gray-500 text-center">
          味方・敵は自動行動します（0.5秒ごとに更新）
        </p>
      </div>
    </GameLayout>
  );
}
