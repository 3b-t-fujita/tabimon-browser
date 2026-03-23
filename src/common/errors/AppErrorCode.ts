/**
 * アプリ全体のエラーコード定義。
 * 詳細設計 v4 §4, §9, §10 の各エラーコードを統合。
 *
 * QR検証順: version → checksum → duplicate を崩してはいけない。
 * QR上限時は単純拒否（入替画面へ遷移しない）。
 */

// --- QR 系 ---
export const QrErrorCode = {
  None:                'QR_NONE',
  ParseFailed:         'QR_PARSE_FAILED',
  InvalidFormat:       'QR_INVALID_FORMAT',
  VersionMismatch:     'QR_VERSION_MISMATCH',    // version確認失敗
  ChecksumMismatch:    'QR_CHECKSUM_MISMATCH',   // checksum確認失敗
  Duplicate:           'QR_DUPLICATE',            // duplicate確認失敗
  OwnedCapacityFull:   'QR_OWNED_CAPACITY_FULL',  // 仲間上限: 単純拒否
  SupportCapacityFull: 'QR_SUPPORT_CAPACITY_FULL',// 助っ人上限: 単純拒否
} as const;

export type QrErrorCode = (typeof QrErrorCode)[keyof typeof QrErrorCode];

// --- 保存 系 ---
export const SaveErrorCode = {
  SaveBusy:          'SAVE_BUSY',
  SaveFailed:        'SAVE_FAILED',
  LoadFailed:        'LOAD_FAILED',
  CorruptData:       'CORRUPT_DATA',
  TempWriteFailed:   'TEMP_WRITE_FAILED',
  ValidationFailed:  'VALIDATION_FAILED',
  CommitFailed:      'COMMIT_FAILED',
} as const;

export type SaveErrorCode = (typeof SaveErrorCode)[keyof typeof SaveErrorCode];

// --- 冒険 / セッション 系 ---
export const AdventureErrorCode = {
  NoMainMonster:      'ADVENTURE_NO_MAIN',
  NoStageSelected:    'ADVENTURE_NO_STAGE',
  StageNotFound:      'ADVENTURE_STAGE_NOT_FOUND',
  StageNotUnlocked:   'ADVENTURE_STAGE_NOT_UNLOCKED',
  ActiveSession:      'ADVENTURE_ACTIVE_SESSION',
  PartyBuildFailed:   'ADVENTURE_PARTY_BUILD_FAILED',
  SessionNotFound:    'ADVENTURE_SESSION_NOT_FOUND',
  SessionCorrupt:     'ADVENTURE_SESSION_CORRUPT',
  ResultAlreadyFinal: 'ADVENTURE_RESULT_ALREADY_FINAL',
} as const;

export type AdventureErrorCode = (typeof AdventureErrorCode)[keyof typeof AdventureErrorCode];

// --- モンスター / 編成 系 ---
export const MonsterErrorCode = {
  NotFound:             'MONSTER_NOT_FOUND',
  CannotReleaseMain:    'MONSTER_CANNOT_RELEASE_MAIN',
  OwnedCapacityFull:    'MONSTER_OWNED_CAPACITY_FULL',
  SupportCapacityFull:  'MONSTER_SUPPORT_CAPACITY_FULL',
  DuplicateSupport:     'MONSTER_DUPLICATE_SUPPORT',
} as const;

export type MonsterErrorCode = (typeof MonsterErrorCode)[keyof typeof MonsterErrorCode];

// --- 汎用 ---
export const GeneralErrorCode = {
  Unknown:        'UNKNOWN',
  InvalidInput:   'INVALID_INPUT',
  NotInitialized: 'NOT_INITIALIZED',
} as const;

export type GeneralErrorCode = (typeof GeneralErrorCode)[keyof typeof GeneralErrorCode];

/** 全エラーコードの union */
export type AppErrorCode =
  | QrErrorCode
  | SaveErrorCode
  | AdventureErrorCode
  | MonsterErrorCode
  | GeneralErrorCode;
