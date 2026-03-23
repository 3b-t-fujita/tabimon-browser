/**
 * 保存トランザクション抽象インターフェース。
 * 詳細設計 v4 §10.1, §10.4, §10.7, §10.8 保存フローに準拠。
 *
 * 保存フロー（崩してはいけない）:
 *   STABLE → temp_save へ書く → temp_save を検証する
 *     → main_save へ反映 → temp_save を削除 → STABLE
 *   失敗時: main_save を汚さない → STABLE
 *
 * インフラ層でこのポートを Dexie（IndexedDB）ベースで実装する。
 */
import type { Result } from '@/common/results/Result';
import type { SaveErrorCode } from '@/common/errors/AppErrorCode';
import type { MainSaveSnapshot, TempSaveSnapshot } from '@/infrastructure/storage/models';
import type { SaveStateType } from '@/common/constants/enums';

export interface SaveTransactionPort {
  /** 現在の保存状態 */
  readonly currentState: SaveStateType;

  /**
   * 複数の保存単位をアトミックに保存する。
   *
   * 内部フロー:
   *   1. temp_save へ書く（TEMP_WRITING）
   *   2. temp_save を検証する（TEMP_VALIDATING）
   *   3. main_save へ反映する（COMMITTING）
   *   4. 成功後 temp_save を削除する（COMPLETED）
   *   5. 失敗時は temp_save を破棄し main_save を維持する（ROLLING_BACK）
   */
  saveMultiple(entries: TempSaveSnapshot): Promise<Result<void, SaveErrorCode>>;

  /**
   * main_save からデータを読み込む。
   * 読込失敗時（破損・未存在を除く）は null を返す。
   * 破損データ検出時は LoadFailed として扱う。
   */
  load(): Promise<Result<MainSaveSnapshot | null, SaveErrorCode>>;

  /**
   * temp_save が残存しているか確認する（起動時復旧チェック用）。
   * 残存している場合は前回の保存が中断した可能性がある。
   */
  hasPendingTemp(): Promise<boolean>;

  /**
   * temp_save を強制削除する（復旧不能時のクリーンアップ）。
   */
  clearTemp(): Promise<void>;
}
