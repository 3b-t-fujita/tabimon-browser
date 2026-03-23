/**
 * タビモン用 Dexie データベース定義。
 * 詳細設計 v4 §10.2 保存対象 / ブラウザ版技術スタック再設計書に準拠。
 *
 * ストア設計:
 *   main_save  — 正式保存データ（key='main'）
 *   temp_save  — 一時保存データ（key='temp'）
 *   save_meta  — 保存メタ情報（最終更新日時・スキーマバージョン等）
 *
 * main / temp はそれぞれ 1レコードのみ持つ（key固定）。
 * JSON文字列としてペイロードを保存し、読込時にパース・検証する。
 *
 * 保存手順（崩してはいけない）:
 *   1. temp_save へ書く
 *   2. temp_save を検証する（Zodスキーマ + 業務整合性）
 *   3. 問題なければ main_save へ反映する
 *   4. temp_save を削除する
 *   5. 失敗時は main_save を汚さない
 */
import Dexie, { type Table } from 'dexie';

export const SAVE_KEY_MAIN = 'main' as const;
export const SAVE_KEY_TEMP = 'temp' as const;
export type SaveKey = typeof SAVE_KEY_MAIN | typeof SAVE_KEY_TEMP;

/** セーブレコード */
export interface SaveRecord {
  /** 保存キー（'main' or 'temp'） */
  id:        SaveKey;
  /** JSON シリアライズ済みの MainSaveSnapshot */
  payload:   string;
  /** 最終更新日時（ISO 8601） */
  updatedAt: string;
}

/** 保存メタ情報 */
export interface SaveMetaRecord {
  key:           string;
  value:         string;
  updatedAt:     string;
}

export const SCHEMA_VERSION = 1;

/**
 * タビモン用 Dexie データベース。
 */
export class TabimonDatabase extends Dexie {
  saves!:    Table<SaveRecord,    SaveKey>;
  saveMeta!: Table<SaveMetaRecord, string>;

  constructor() {
    super('TabimonDB');
    this.version(SCHEMA_VERSION).stores({
      saves:    'id',   // id が PK ('main' | 'temp')
      saveMeta: 'key',  // key が PK
    });
  }
}

/** シングルトンインスタンス */
let _db: TabimonDatabase | null = null;

export function getDatabase(): TabimonDatabase {
  if (!_db) {
    _db = new TabimonDatabase();
  }
  return _db;
}

/**
 * テスト用: DBインスタンスをリセットする。
 * 本番コードからは呼ばないこと。
 */
export function _resetDatabaseForTest(db?: TabimonDatabase): void {
  _db = db ?? null;
}
