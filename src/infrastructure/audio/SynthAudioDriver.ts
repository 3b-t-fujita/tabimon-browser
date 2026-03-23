/**
 * Web Audio API による音声合成ドライバー。
 * 外部ファイル不要でチップチューン風の BGM / SE を生成する。
 *
 * 将来 MP3 ファイルに差し替える場合は FileAudioDriver を新規作成し、
 * AudioService.setDriver() に渡すだけでよい。
 */
import type { IAudioDriver, BgmId, SeId } from './IAudioDriver';

// ---------------------------------------------------------------------------
// BGM ノート定義
// ---------------------------------------------------------------------------

interface Note { freq: number; dur: number }

/** 戦闘 BGM: Aマイナー系、駆け上がるアルペジオ */
const BATTLE_NOTES: Note[] = [
  { freq: 440,   dur: 0.12 }, // A4
  { freq: 523.3, dur: 0.12 }, // C5
  { freq: 659.3, dur: 0.12 }, // E5
  { freq: 784,   dur: 0.12 }, // G5
  { freq: 659.3, dur: 0.12 }, // E5
  { freq: 523.3, dur: 0.12 }, // C5
  { freq: 440,   dur: 0.24 }, // A4 (held)
  { freq: 392,   dur: 0.12 }, // G4
  { freq: 493.9, dur: 0.12 }, // B4
  { freq: 587.3, dur: 0.12 }, // D5
  { freq: 698.5, dur: 0.12 }, // F5
  { freq: 587.3, dur: 0.12 }, // D5
  { freq: 493.9, dur: 0.12 }, // B4
  { freq: 392,   dur: 0.24 }, // G4 (held)
];

/** ホーム BGM: Cメジャー、穏やかなアルペジオ */
const HOME_NOTES: Note[] = [
  { freq: 523.3,  dur: 0.25 }, // C5
  { freq: 659.3,  dur: 0.25 }, // E5
  { freq: 784,    dur: 0.25 }, // G5
  { freq: 1046.5, dur: 0.5  }, // C6
  { freq: 784,    dur: 0.25 }, // G5
  { freq: 659.3,  dur: 0.25 }, // E5
  { freq: 523.3,  dur: 0.5  }, // C5
  { freq: 587.3,  dur: 0.25 }, // D5
  { freq: 698.5,  dur: 0.25 }, // F5
  { freq: 880,    dur: 0.25 }, // A5
  { freq: 698.5,  dur: 0.25 }, // F5
  { freq: 587.3,  dur: 0.25 }, // D5
  { freq: 523.3,  dur: 0.75 }, // C5 (long hold)
];

const BGM_VOLUME: Record<BgmId, number> = {
  home:   0.08,
  battle: 0.10,
};

// ---------------------------------------------------------------------------
// Driver 実装
// ---------------------------------------------------------------------------

export class SynthAudioDriver implements IAudioDriver {
  private ctx:         AudioContext | null = null;
  private masterGain:  GainNode     | null = null;
  private stopFlag                         = false;
  private timerId:     ReturnType<typeof setTimeout> | null = null;
  private currentBgm:  BgmId        | null = null;

  // ---- AudioContext 遅延初期化 ----
  private getCtx(): AudioContext {
    if (!this.ctx) {
      // window.AudioContext || window.webkitAudioContext（Safari対応）
      const Ctor =
        typeof AudioContext !== 'undefined'
          ? AudioContext
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          : (window as any).webkitAudioContext as typeof AudioContext;
      this.ctx = new Ctor();
    }
    return this.ctx;
  }

  async resume(): Promise<void> {
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  // -----------------------------------------------------------------------
  // BGM
  // -----------------------------------------------------------------------

  playBGM(id: BgmId): void {
    if (this.currentBgm === id) return;     // 同じ曲は二重再生しない
    this.stopBGM();

    const ctx = this.getCtx();
    if (ctx.state === 'suspended') {
      // autoplay ブロック中は BGM を無音スタートし、resume後に聞こえる
      ctx.resume().catch(() => {});
    }

    this.currentBgm = id;
    this.stopFlag    = false;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = BGM_VOLUME[id];
    this.masterGain.connect(ctx.destination);

    this.scheduleLoop(ctx, id, ctx.currentTime);
  }

  stopBGM(): void {
    this.stopFlag = true;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.masterGain && this.ctx) {
      const g = this.masterGain;
      const t = this.ctx.currentTime;
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0, t + 0.3);
      // フェードアウト後に disconnect
      setTimeout(() => { try { g.disconnect(); } catch { /* ignore */ } }, 500);
    }
    this.masterGain = null;
    this.currentBgm = null;
  }

  /**
   * ノートを一括スケジュールし、ループ直前に次ループを予約する。
   * stopFlag が true になったら再スケジュールしない。
   */
  private scheduleLoop(ctx: AudioContext, id: BgmId, startTime: number): void {
    if (this.stopFlag) return;
    const gain = this.masterGain;
    if (!gain) return;

    const notes     = id === 'battle' ? BATTLE_NOTES : HOME_NOTES;
    const waveType: OscillatorType = id === 'battle' ? 'square' : 'triangle';
    const totalDur  = notes.reduce((s, n) => s + n.dur, 0);

    let t = startTime;
    for (const { freq, dur } of notes) {
      const osc      = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type           = waveType;
      osc.frequency.value = freq;
      osc.connect(noteGain);
      noteGain.connect(gain);

      noteGain.gain.setValueAtTime(0,   t);
      noteGain.gain.linearRampToValueAtTime(0.85, t + 0.01);
      noteGain.gain.setValueAtTime(0.85, t + dur * 0.65);
      noteGain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.95);

      osc.start(t);
      osc.stop(t + dur);
      t += dur;
    }

    // ループ終了の 300ms 前に次ループを予約（途切れ防止）
    const nextStart = startTime + totalDur;
    const delayMs   = Math.max(0, (nextStart - 0.3 - ctx.currentTime) * 1000);
    const captured  = gain; // stopBGM 後の古い gain を誤って使わないよう捕捉

    this.timerId = setTimeout(() => {
      if (!this.stopFlag && this.masterGain === captured) {
        this.scheduleLoop(ctx, id, nextStart);
      }
    }, delayMs);
  }

  // -----------------------------------------------------------------------
  // SE
  // -----------------------------------------------------------------------

  playSE(id: SeId): void {
    try {
      const ctx = this.getCtx();
      if (ctx.state === 'suspended') return; // ジェスチャー前は鳴らさない
      if (id === 'attack') this.playAttackSE(ctx);
      if (id === 'hit')    this.playHitSE(ctx);
    } catch { /* ignore */ }
  }

  /** こちらの攻撃 SE: 鋭い上昇スイープ音 */
  private playAttackSE(ctx: AudioContext): void {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(380, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(820, ctx.currentTime + 0.10);

    gain.gain.setValueAtTime(0.22,  ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.14);
  }

  /** 被攻撃 SE: 鈍い低音の衝撃音 + ノイズバースト */
  private playHitSE(ctx: AudioContext): void {
    // 低音 thud
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.22);

    gain.gain.setValueAtTime(0.38,  ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.24);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.24);

    // ノイズバースト（衝撃感）
    const bufSize = Math.floor(ctx.sampleRate * 0.04);
    const buf     = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data    = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const noise  = ctx.createBufferSource();
    const nGain  = ctx.createGain();
    noise.buffer = buf;
    noise.connect(nGain);
    nGain.connect(ctx.destination);

    nGain.gain.setValueAtTime(0.18,  ctx.currentTime);
    nGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.04);
  }
}
