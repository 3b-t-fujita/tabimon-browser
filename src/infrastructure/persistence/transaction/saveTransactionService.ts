/**
 * 保存トランザクションサービス。詳細設計 v4 §10.3, §10.5 に準拠。
 *
 * 保存手順（崩してはいけない）:
 *   1. temp_save へ書き込む           (TempWriting)
 *   2. temp_save を検証する           (TempValidating)
 *   3. 問題なければ main_save へ反映  (Committing)
 *   4. temp_save を削除               (Completed)
 *   5. 失敗時は main_save を汚さない  (Failed → RollingBack)
 *
 * @module saveTransactionService
 */
import type { SaveTransactionPort } from '@/application/ports/SaveTransactionPort';
import type { MainSaveSnapshot, TempSaveSnapshot } from '@/infrastructure/storage/models';
import { type Result, ok, fail } from '@/common/results/Result';
import { SaveErrorCode } from '@/common/errors/AppErrorCode';
import { SaveStateType } from '@/common/constants/enums';
import { createEmptyMainSave } from '@/infrastructure/storage/models';
import {
  getDatabase,
  SAVE_KEY_MAIN,
  SAVE_KEY_TEMP,
  type TabimonDatabase,
} from '@/infrastructure/persistence/db/tabimonDb';
import { MainSaveSnapshotSchema } from '@/infrastructure/persistence/validators/saveSchemas';
import { validateSaveConsistency } from '@/infrastructure/persistence/validators/saveConsistencyValidator';

// ---------------------------------------------------------------------------
// 内部ヘルパー
// ---------------------------------------------------------------------------

/** IndexedDB から main_save を読み込む。存在しない場合は null を返す。 */
async function readMain(db: TabimonDatabase): Promise<MainSaveSnapshot | null> {
  const record = await db.saves.get(SAVE_KEY_MAIN);
  if (!record) return null;
  try {
    return JSON.parse(record.payload) as MainSaveSnapshot;
  } catch {
    return null;
  }
}

/** IndexedDB から temp_save を読み込む。存在しない場合は null を返す。 */
async function readTemp(db: TabimonDatabase): Promise<MainSaveSnapshot | null> {
  const record = await db.saves.get(SAVE_KEY_TEMP);
  if (!record) return null;
  try {
    return JSON.parse(record.payload) as MainSaveSnapshot;
  } catch {
    return null;
  }
}

/**
 * temp スナップショットを main に上書きマージして新しい MainSaveSnapshot を返す。
 * undefined なフィールドは main の値をそのまま使う。
 */
function mergeSnapshots(
  main: MainSaveSnapshot,
  temp: TempSaveSnapshot,
): MainSaveSnapshot {
  return {
    player:           temp.player           !== undefined ? temp.player           : main.player,
    progress:         temp.progress         !== undefined ? temp.progress         : main.progress,
    settings:         temp.settings         !== undefined ? temp.settings         : main.settings,
    ownedMonsters:    temp.ownedMonsters     !== undefined ? temp.ownedMonsters    : main.ownedMonsters,
    supportMonsters:  temp.supportMonsters   !== undefined ? temp.supportMonsters  : main.supportMonsters,
    qrReceiveHistory: temp.qrReceiveHistory  !== undefined ? temp.qrReceiveHistory : main.qrReceiveHistory,
    adventureSession: temp.adventureSession  !== undefined ? temp.adventureSession : main.adventureSession,
    pendingCandidate: temp.pendingCandidate  !== undefined ? temp.pendingCandidate : main.pendingCandidate,
  };
}

/**
 * MainSaveSnapshot を Zod + 業務整合性で検証する。
 * どちらか一方でも失敗した場合は fail を返す。
 */
function validateSnapshot(
  snapshot: MainSaveSnapshot,
): Result<MainSaveSnapshot, SaveErrorCode> {
  // 1) Zod スキーマ検証
  const zodResult = MainSaveSnapshotSchema.safeParse(snapshot);
  if (!zodResult.success) {
    const msg = zodResult.error.issues.map((e) => `${e.path.map(String).join('.')}: ${e.message}`).join('; ');
    return fail(SaveErrorCode.ValidationFailed, `スキーマ検証失敗: ${msg}`);
  }

  // 2) 業務整合性検証
  const consistencyResult = validateSaveConsistency(snapshot);
  if (!consistencyResult.valid) {
    const msg = consistencyResult.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
    return fail(SaveErrorCode.ValidationFailed, `業務整合性検証失敗: ${msg}`);
  }

  return ok(snapshot);
}

// ---------------------------------------------------------------------------
// SaveTransactionService
// ---------------------------------------------------------------------------

/**
 * 保存トランザクションサービス実装。
 * SaveTransactionPort を実装し、IndexedDB (Dexie) を用いる。
 */
export class SaveTransactionService implements SaveTransactionPort {
  private _state: SaveStateType = SaveStateType.Stable;

  get currentState(): SaveStateType {
    return this._state;
  }

  // -------------------------------------------------------------------------
  // saveMultiple (temp → validate → main commit → temp delete)
  // -------------------------------------------------------------------------

  /**
   * 保存を実行する。
   *
   * 手順:
   *   1. 現在の main_save を読み込んで temp とマージ
   *   2. マージ済みスナップショットを検証（TempValidating）
   *   3. temp_save へ書き込む（TempWriting）
   *   4. main_save へ反映する（Committing）
   *   5. temp_save を削除する（Completed）
   *
   * 手順3以降で失敗した場合、main_save は変更されない。
   * temp_save が残る場合は次回起動時の復旧対象になる。
   */
  async saveMultiple(entries: TempSaveSnapshot): Promise<Result<void, SaveErrorCode>> {
    const db = getDatabase();
    this._state = SaveStateType.Requested;

    try {
      // ステップ1: 現在の main を読み込みマージ
      this._state = SaveStateType.SnapshotBuilding;
      const currentMain = (await readMain(db)) ?? createEmptyMainSave();
      const merged = mergeSnapshots(currentMain, entries);

      // ステップ2: 検証
      this._state = SaveStateType.TempValidating;
      const validationResult = validateSnapshot(merged);
      if (!validationResult.ok) {
        this._state = SaveStateType.Failed;
        return fail(validationResult.errorCode, validationResult.message);
      }

      const payload = JSON.stringify(merged);
      const now = new Date().toISOString();

      // ステップ3: temp_save へ書き込む
      this._state = SaveStateType.TempWriting;
      try {
        await db.saves.put({
          id:        SAVE_KEY_TEMP,
          payload,
          updatedAt: now,
        });
      } catch (e) {
        this._state = SaveStateType.Failed;
        const msg = e instanceof Error ? e.message : String(e);
        return fail(SaveErrorCode.TempWriteFailed, `temp_save 書き込み失敗: ${msg}`);
      }

      // ステップ4: main_save へ反映
      this._state = SaveStateType.Committing;
      try {
        await db.saves.put({
          id:        SAVE_KEY_MAIN,
          payload,
          updatedAt: now,
        });
      } catch (e) {
        // main への書き込み失敗 → ロールバック（temp を削除して失敗を返す）
        this._state = SaveStateType.RollingBack;
        await db.saves.delete(SAVE_KEY_TEMP).catch(() => undefined);
        this._state = SaveStateType.Failed;
        const msg = e instanceof Error ? e.message : String(e);
        return fail(SaveErrorCode.CommitFailed, `main_save コミット失敗: ${msg}`);
      }

      // ステップ5: temp_save を削除
      await db.saves.delete(SAVE_KEY_TEMP).catch(() => undefined);

      this._state = SaveStateType.Completed;
      // 次の save に備えて Stable へ戻す
      this._state = SaveStateType.Stable;
      return ok(undefined);

    } catch (e) {
      this._state = SaveStateType.Failed;
      const msg = e instanceof Error ? e.message : String(e);
      return fail(SaveErrorCode.SaveFailed, `保存中に予期しないエラーが発生しました: ${msg}`);
    }
  }

  // -------------------------------------------------------------------------
  // load
  // -------------------------------------------------------------------------

  /**
   * main_save を読み込む。
   * 存在しない場合は ok(null) を返す（新規プレイヤー）。
   * 読み込み失敗（破損等）は fail を返す。
   */
  async load(): Promise<Result<MainSaveSnapshot | null, SaveErrorCode>> {
    const db = getDatabase();
    try {
      const main = await readMain(db);
      return ok(main);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return fail(SaveErrorCode.LoadFailed, `読み込み中にエラーが発生しました: ${msg}`);
    }
  }

  // -------------------------------------------------------------------------
  // hasPendingTemp / clearTemp
  // -------------------------------------------------------------------------

  /**
   * temp_save が存在するかを確認する。
   * true の場合、前回の保存が中断されている可能性がある。
   */
  async hasPendingTemp(): Promise<boolean> {
    const db = getDatabase();
    try {
      const record = await db.saves.get(SAVE_KEY_TEMP);
      return record !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * temp_save を削除する。
   * 復旧完了後・保存キャンセル後に呼ぶ。
   */
  async clearTemp(): Promise<void> {
    const db = getDatabase();
    try {
      await db.saves.delete(SAVE_KEY_TEMP);
    } catch {
      // 削除失敗は静かに無視（既に存在しない場合など）
    }
  }

  // -------------------------------------------------------------------------
  // 復旧用ユーティリティ
  // -------------------------------------------------------------------------

  /**
   * temp_save が存在する場合、内容を検証して返す。
   * - 検証成功 → ok(MainSaveSnapshot)
   * - 存在しない → ok(null)
   * - 検証失敗 → fail（temp_save は汚染されている可能性あり）
   */
  async loadAndValidateTemp(): Promise<Result<MainSaveSnapshot | null, SaveErrorCode>> {
    const db = getDatabase();
    try {
      const temp = await readTemp(db);
      if (!temp) return ok(null);

      const validationResult = validateSnapshot(temp);
      if (!validationResult.ok) {
        return fail(validationResult.errorCode, validationResult.message);
      }
      return ok(temp);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return fail(SaveErrorCode.LoadFailed, `temp読み込み中にエラーが発生しました: ${msg}`);
    }
  }

  /**
   * temp_save を main_save へ昇格させる（復旧フロー専用）。
   *   1. temp_save を読む
   *   2. 検証する
   *   3. main_save へ書く
   *   4. temp_save を削除する
   *
   * 通常の saveMultiple フローではなく、起動時復旧専用。
   */
  async promoteTempToMain(): Promise<Result<void, SaveErrorCode>> {
    const db = getDatabase();
    this._state = SaveStateType.Committing;
    try {
      const tempRecord = await db.saves.get(SAVE_KEY_TEMP);
      if (!tempRecord) {
        this._state = SaveStateType.Stable;
        return fail(SaveErrorCode.LoadFailed, 'temp_save が存在しません');
      }

      let parsed: MainSaveSnapshot;
      try {
        parsed = JSON.parse(tempRecord.payload) as MainSaveSnapshot;
      } catch {
        this._state = SaveStateType.Failed;
        return fail(SaveErrorCode.CorruptData, 'temp_save のパースに失敗しました');
      }

      const validationResult = validateSnapshot(parsed);
      if (!validationResult.ok) {
        this._state = SaveStateType.Failed;
        return fail(validationResult.errorCode, validationResult.message);
      }

      await db.saves.put({
        id:        SAVE_KEY_MAIN,
        payload:   tempRecord.payload,
        updatedAt: new Date().toISOString(),
      });
      await db.saves.delete(SAVE_KEY_TEMP).catch(() => undefined);

      this._state = SaveStateType.Stable;
      return ok(undefined);
    } catch (e) {
      this._state = SaveStateType.Failed;
      const msg = e instanceof Error ? e.message : String(e);
      return fail(SaveErrorCode.CommitFailed, `temp昇格中にエラーが発生しました: ${msg}`);
    }
  }
}
