/**
 * ゲーム全体の列挙値定義。
 * C# の enum を TypeScript の union type / const object へ読み替え。
 * 詳細設計 v4 の各仕様に準拠。
 */

// --- ワールド ---
export const WorldId = {
  Forest: 'WORLD_FOREST',   // ミドリの森
  Volcano: 'WORLD_VOLCANO', // ホノオ火山
  Ice: 'WORLD_ICE',         // コオリ氷原
} as const;
export type WorldId = (typeof WorldId)[keyof typeof WorldId];

// --- ロール ---
export const RoleType = {
  Attack:  'ROLE_ATTACK',   // アタック
  Guard:   'ROLE_GUARD',    // ガード
  Support: 'ROLE_SUPPORT',  // サポート
} as const;
export type RoleType = (typeof RoleType)[keyof typeof RoleType];

// --- 性格（6種） ---
export const PersonalityType = {
  Brave:    'PERSONALITY_BRAVE',    // ゆうかん
  Cautious: 'PERSONALITY_CAUTIOUS', // しんちょう
  Kind:     'PERSONALITY_KIND',     // やさしい
  Hasty:    'PERSONALITY_HASTY',    // せっかち
  Calm:     'PERSONALITY_CALM',     // れいせい
  Whimsy:   'PERSONALITY_WHIMSY',   // きまぐれ
} as const;
export type PersonalityType = (typeof PersonalityType)[keyof typeof PersonalityType];

// --- 冒険結果 ---
export const AdventureResultType = {
  Success: 'SUCCESS',
  Failure: 'FAILURE',
  Retire:  'RETIRE',
} as const;
export type AdventureResultType = (typeof AdventureResultType)[keyof typeof AdventureResultType];

// --- 冒険セッション状態 ---
export const AdventureSessionStatus = {
  Idle:             'IDLE',              // セッションなし
  Active:           'SESSION_ACTIVE',    // 探索中
  ActiveBattle:     'SESSION_ACTIVE_BATTLE', // 戦闘中（異常終了時はbattleCheckpointへ戻す）
  PendingResult:    'SESSION_PENDING_RESULT', // リザルト確定待ち
  Completed:        'SESSION_COMPLETED', // 完了済み
} as const;
export type AdventureSessionStatus = (typeof AdventureSessionStatus)[keyof typeof AdventureSessionStatus];

// --- ノード種別 ---
export const NodeType = {
  Pass:    'NODE_PASS',    // 通過
  Branch:  'NODE_BRANCH',  // 分岐
  Event:   'NODE_EVENT',   // イベント
  Battle:  'NODE_BATTLE',  // 戦闘
  Goal:    'NODE_GOAL',    // ゴール
  Boss:    'NODE_BOSS',    // ボス
} as const;
export type NodeType = (typeof NodeType)[keyof typeof NodeType];

// --- イベント種別 ---
export const EventType = {
  Heal:     'EVENT_HEAL',     // 回復
  Gather:   'EVENT_GATHER',   // 採取 / 報酬
  Trap:     'EVENT_TRAP',     // 罠 / 危険
  Enemy:    'EVENT_ENEMY',    // 敵遭遇
  Treasure: 'EVENT_TREASURE', // 宝箱
  Special:  'EVENT_SPECIAL',  // 特殊（予約）
} as const;
export type EventType = (typeof EventType)[keyof typeof EventType];

// --- スキル種別 ---
export const SkillType = {
  Attack:  'SKILL_ATTACK',  // 攻撃
  Heal:    'SKILL_HEAL',    // 回復
  Buff:    'SKILL_BUFF',    // バフ
  Debuff:  'SKILL_DEBUFF',  // デバフ
  Normal:  'SKILL_NORMAL',  // 通常攻撃
} as const;
export type SkillType = (typeof SkillType)[keyof typeof SkillType];

// --- バフ種別 ---
export const BuffType = {
  AtkUp:   'BUFF_ATK_UP',
  AtkDown: 'BUFF_ATK_DOWN',
  DefUp:   'BUFF_DEF_UP',
  DefDown: 'BUFF_DEF_DOWN',
  SpdUp:   'BUFF_SPD_UP',
  SpdDown: 'BUFF_SPD_DOWN',
} as const;
export type BuffType = (typeof BuffType)[keyof typeof BuffType];

// --- 保存状態 ---
export const SaveStateType = {
  Stable:          'STABLE',
  Requested:       'REQUESTED',
  SnapshotBuilding:'SNAPSHOT_BUILDING',
  TempWriting:     'TEMP_WRITING',
  TempValidating:  'TEMP_VALIDATING',
  Committing:      'COMMITTING',
  Completed:       'COMPLETED',
  Failed:          'FAILED',
  RollingBack:     'ROLLING_BACK',
} as const;
export type SaveStateType = (typeof SaveStateType)[keyof typeof SaveStateType];
