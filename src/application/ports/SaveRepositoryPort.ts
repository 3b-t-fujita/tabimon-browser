/**
 * 保存 Repository 抽象インターフェース群。
 * UseCase 層が直接依存する抽象。
 * Infrastructure 層でこれらを IndexedDB（Dexie）ベースで実装する。
 *
 * 注意: 画面から Repository を直接触ってはいけない。
 *       画面 → UseCase → Repository の呼び出し順を維持すること。
 */
import type { Result } from '@/common/results/Result';
import type { SaveErrorCode } from '@/common/errors/AppErrorCode';
import type { Player } from '@/domain/entities/Player';
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';
import type { SupportMonster } from '@/domain/entities/SupportMonster';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import type { PendingCandidate } from '@/domain/entities/PendingCandidate';
import type { QrReceiveHistoryEntry, ProgressState, SettingsState } from '@/infrastructure/storage/models';
import type { MonsterId } from '@/types/ids';

// --- Player ---
export interface PlayerRepository {
  load(): Promise<Result<Player | null, SaveErrorCode>>;
  save(player: Player): Promise<Result<void, SaveErrorCode>>;
}

// --- OwnedMonster ---
export interface OwnedMonsterRepository {
  loadAll(): Promise<Result<OwnedMonster[], SaveErrorCode>>;
  save(monsters: readonly OwnedMonster[]): Promise<Result<void, SaveErrorCode>>;
}

// --- SupportMonster ---
export interface SupportMonsterRepository {
  loadAll(): Promise<Result<SupportMonster[], SaveErrorCode>>;
  save(monsters: readonly SupportMonster[]): Promise<Result<void, SaveErrorCode>>;
}

// --- AdventureSession ---
export interface AdventureSessionRepository {
  load(): Promise<Result<AdventureSession | null, SaveErrorCode>>;
  save(session: AdventureSession): Promise<Result<void, SaveErrorCode>>;
  /** セッション終了時にクリアする */
  clear(): Promise<Result<void, SaveErrorCode>>;
}

// --- PendingCandidate ---
export interface PendingCandidateRepository {
  load(): Promise<Result<PendingCandidate | null, SaveErrorCode>>;
  save(candidate: PendingCandidate): Promise<Result<void, SaveErrorCode>>;
  clear(): Promise<Result<void, SaveErrorCode>>;
}

// --- QrReceiveHistory ---
export interface QrReceiveHistoryRepository {
  loadAll(): Promise<Result<QrReceiveHistoryEntry[], SaveErrorCode>>;
  /**
   * 受取履歴を追加する。
   * QR見送り時は呼び出さないこと（詳細設計 v4 §9.7 見送り時履歴更新なし）。
   */
  append(entry: QrReceiveHistoryEntry): Promise<Result<void, SaveErrorCode>>;
}

// --- Progress ---
export interface ProgressRepository {
  load(): Promise<Result<ProgressState | null, SaveErrorCode>>;
  save(progress: ProgressState): Promise<Result<void, SaveErrorCode>>;
}

// --- Settings ---
export interface SettingsRepository {
  load(): Promise<Result<SettingsState | null, SaveErrorCode>>;
  save(settings: SettingsState): Promise<Result<void, SaveErrorCode>>;
}
