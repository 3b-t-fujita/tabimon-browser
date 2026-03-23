/**
 * BGM ライフサイクル管理フック。
 * マウント時に指定トラックを再生し、アンマウント時に停止する。
 *
 * 使用例:
 *   useBGM('battle');  // 戦闘画面のマウント/アンマウントに連動
 *   useBGM('home');    // ホーム画面
 */
'use client';

import { useEffect } from 'react';
import { AudioService } from '@/infrastructure/audio/AudioService';
import type { BgmId } from '@/infrastructure/audio/IAudioDriver';

export function useBGM(trackId: BgmId): void {
  useEffect(() => {
    AudioService.playBGM(trackId);
    return () => {
      AudioService.stopBGM();
    };
  }, [trackId]);
}
