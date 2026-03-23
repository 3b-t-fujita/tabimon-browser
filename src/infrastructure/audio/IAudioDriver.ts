/**
 * 音声ドライバー Interface。
 *
 * 現在は SynthAudioDriver (Web Audio API 合成) が実装している。
 * 将来 MP3/OGG ファイルに切り替える場合は FileAudioDriver を実装して
 * AudioService.setDriver() に渡すだけでよい。
 */

export type BgmId = 'home' | 'battle';
export type SeId  = 'attack' | 'hit';

export interface IAudioDriver {
  /**
   * BGM を再生開始する。同一 id を再度呼んでも二重再生しない。
   * 別の id を呼ぶと自動で前の BGM を停止してから切り替える。
   */
  playBGM(id: BgmId): void;

  /** BGM をフェードアウトして停止する。 */
  stopBGM(): void;

  /** SE を単発再生する（重複再生可）。 */
  playSE(id: SeId): void;

  /**
   * AudioContext を resume する。
   * Web Audio API はユーザージェスチャー後に呼ぶ必要がある。
   * ファイルベース実装では何もしなくてよい。
   */
  resume(): Promise<void>;
}
