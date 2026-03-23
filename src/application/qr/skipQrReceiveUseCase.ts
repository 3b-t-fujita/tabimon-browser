/**
 * QR受取を見送る UseCase。
 * 詳細設計 v4 §9.7 見送りに準拠。
 *
 * 重要（崩してはいけない）:
 * - 見送り時は qrReceiveHistory を更新しない
 * - DB書き込みは一切行わない
 * - 見送り確認ダイアログは呼び出し元（UI）の責務
 */
import type { Result } from '@/common/results/Result';
import { ok } from '@/common/results/Result';

export class SkipQrReceiveUseCase {
  /**
   * 見送り操作を実行する。
   * DB書き込みは行わない（履歴更新なし）。
   */
  execute(): Result<void, never> {
    // 何もしない。履歴を更新しないことがこのUseCaseの仕様。
    return ok(undefined);
  }
}
