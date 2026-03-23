/**
 * 戦闘 SE 検出フック。
 * battleState のログ差分を監視し、攻撃/被攻撃を検出して SE を鳴らす。
 *
 * 検出ルール:
 *   - 新規ログエントリの actorName が敵一覧に含まれる → hit SE（被攻撃）
 *   - 新規ログエントリの actorName が味方       → attack SE（こちらの攻撃）
 *   - value が undefined / 0 以下（バフ・デバフ等）は無音
 *   - 1 tick につき SE は 1 種 1 回まで（過剰発火防止）
 */
'use client';

import { useEffect, useRef } from 'react';
import { AudioService } from '@/infrastructure/audio/AudioService';
import type { BattleState } from '@/domain/battle/BattleState';

export function useBattleSE(battleState: BattleState | null): void {
  const prevLogLenRef = useRef(0);

  useEffect(() => {
    if (!battleState) return;

    const prevLen    = prevLogLenRef.current;
    const newEntries = battleState.log.slice(prevLen);
    prevLogLenRef.current = battleState.log.length;

    if (newEntries.length === 0) return;

    // 敵アクター名のセット（isEnemy フラグで判定）
    const enemyNames = new Set(
      battleState.actors
        .filter((a) => a.isEnemy)
        .map((a) => a.displayName),
    );

    let playedAttack = false;
    let playedHit    = false;

    for (const entry of newEntries) {
      // ダメージ/回復がない行動（バフ・デバフ・様子見）は無音
      if (entry.value === undefined || entry.value <= 0) continue;

      if (enemyNames.has(entry.actorName)) {
        // 敵がダメージを与えた → 被攻撃 SE
        if (!playedHit) {
          AudioService.resume(); // AudioContext がサスペンド中なら起こす
          AudioService.playSE('hit');
          playedHit = true;
        }
      } else {
        // 味方がダメージを与えた → 攻撃 SE
        if (!playedAttack) {
          AudioService.resume();
          AudioService.playSE('attack');
          playedAttack = true;
        }
      }

      // 両方鳴らしたら抜ける
      if (playedAttack && playedHit) break;
    }
  // ログの長さが変わった時だけ実行する
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleState?.log.length]);
}
