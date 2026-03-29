/**
 * IndexedDB 保存モデル定義。詳細設計 v4 §10.2 保存対象に準拠。
 *
 * main_save: 正式保存データ
 * temp_save: 一時保存データ（検証後 main へ反映）
 *
 * 保存手順（崩してはいけない）:
 *   1. temp_save へ書く
 *   2. temp_save を検証する
 *   3. 問題なければ main_save へ反映する
 *   4. 成功後 temp_save を削除する
 *   5. 失敗時は main_save を汚さない
 */
import type { Player } from '@/domain/entities/Player';
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';
import type { SupportMonster } from '@/domain/entities/SupportMonster';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import type { PendingCandidate } from '@/domain/entities/PendingCandidate';

/**
 * 進行状態（未解放/解放済みステージ等）
 */
export interface ProgressState {
  readonly unlockedStageIds: readonly string[];
  readonly clearedStageIds: readonly string[];
}

/**
 * 設定
 */
export interface SettingsState {
  readonly bgmVolume: number;
  readonly sfxVolume: number;
}

/**
 * 日次の軽量行動記録
 */
export interface DailyRecord {
  readonly date: string; // YYYY-MM-DD (local)
  readonly homeTapCount: number;
}

/**
 * QR受取履歴エントリ
 */
export interface QrReceiveHistoryEntry {
  readonly sourceUniqueMonsterIdFromQr: string;
  readonly receivedAt: string; // ISO 8601
}

/**
 * main_save の全データスナップショット。
 * IndexedDB 内の正式保存領域。
 * 詳細設計 v4 §10.2 保存対象 7項目 に対応。
 */
export interface MainSaveSnapshot {
  readonly player:               Player | null;
  readonly progress:             ProgressState | null;
  readonly settings:             SettingsState | null;
  readonly dailyRecord:          DailyRecord | null;
  readonly ownedMonsters:        readonly OwnedMonster[];
  readonly supportMonsters:      readonly SupportMonster[];
  readonly qrReceiveHistory:     readonly QrReceiveHistoryEntry[];
  readonly adventureSession:     AdventureSession | null;
  readonly pendingCandidate:     PendingCandidate | null;
}

/**
 * temp_save の保存単位。
 * 更新対象のキーのみ含む部分スナップショット。
 * null = 当該キーは変更なし（main_save の値を維持）。
 */
export type TempSaveSnapshot = Partial<MainSaveSnapshot>;

/** 初期 MainSaveSnapshot（新規プレイヤー用） */
export function createEmptyMainSave(): MainSaveSnapshot {
  return {
    player:           null,
    progress:         null,
    settings:         { bgmVolume: 1.0, sfxVolume: 1.0 },
    dailyRecord:      null,
    ownedMonsters:    [],
    supportMonsters:  [],
    qrReceiveHistory: [],
    adventureSession: null,
    pendingCandidate: null,
  };
}
