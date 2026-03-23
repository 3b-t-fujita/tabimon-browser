/**
 * ゲーム全体の音声制御サービス（シングルトン）。
 *
 * 呼び出し側は AudioService を通じてのみ音声を操作する。
 * 内部実装（合成 or ファイル）は IAudioDriver が隠蔽する。
 *
 * ---- 将来ファイル音源に切り替える方法 ----
 * 1. FileAudioDriver implements IAudioDriver を新規作成
 * 2. このファイルの import を SynthAudioDriver → FileAudioDriver に変更
 *    （または AudioService.setDriver(new FileAudioDriver()) を呼ぶ）
 * それだけで全画面の音声がファイル再生に切り替わる。
 */
import type { IAudioDriver, BgmId, SeId } from './IAudioDriver';
import { SynthAudioDriver } from './SynthAudioDriver';

export class AudioService {
  private static _driver: IAudioDriver = new SynthAudioDriver();

  /**
   * ドライバーを差し替える（将来のファイル音源切替用）。
   * 切替前に stopBGM() を呼ぶことを推奨。
   */
  static setDriver(driver: IAudioDriver): void {
    this._driver = driver;
  }

  /** BGM を再生する。同一 id の再呼び出しは無視される。 */
  static playBGM(id: BgmId): void {
    try { this._driver.playBGM(id); } catch { /* ignore */ }
  }

  /** BGM を停止する。 */
  static stopBGM(): void {
    try { this._driver.stopBGM(); } catch { /* ignore */ }
  }

  /** SE を単発再生する。 */
  static playSE(id: SeId): void {
    try { this._driver.playSE(id); } catch { /* ignore */ }
  }

  /**
   * AudioContext を resume する。
   * ユーザージェスチャーのハンドラ内（onClick など）で呼ぶこと。
   * ファイルベース実装では不要だが呼んでも問題ない。
   */
  static resume(): void {
    this._driver.resume().catch(() => { /* ignore */ });
  }
}
