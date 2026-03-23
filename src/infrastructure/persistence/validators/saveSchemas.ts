/**
 * 保存データ整合性検証スキーマ。詳細設計 v4 §10.5 復旧方針に準拠。
 * Zod を使って型安全にバリデーションする。
 *
 * 検証対象:
 * - 必須フィールドの存在
 * - 型整合
 * - 業務制約（上限値・参照整合性）
 */
import { z } from 'zod';
import { GameConstants } from '@/common/constants/GameConstants';
import { AdventureSessionStatus } from '@/common/constants/enums';

// --- 共通 primitive ---
const nonEmptyString = z.string().min(1);

// --- SkillSnapshot ---
export const SkillSnapshotSchema = z.object({
  skillId:     nonEmptyString,
  displayName: z.string().default(''),
  skillType:   nonEmptyString,
  cooldownSec: z.number().nonnegative(),
  power:       z.number().nonnegative(),
  targetCount: z.number().int().nonnegative(),
});

// --- MonsterStats ---
export const MonsterStatsSchema = z.object({
  maxHp: z.number().int().positive(),
  atk:   z.number().int().nonnegative(),
  def:   z.number().int().nonnegative(),
  spd:   z.number().int().nonnegative(),
});

// --- PartyMemberSnapshot ---
export const PartyMemberSnapshotSchema = z.object({
  uniqueId:        nonEmptyString,
  monsterMasterId: nonEmptyString,
  displayName:     nonEmptyString,
  personality:     nonEmptyString,
  stats:           MonsterStatsSchema,
  skills:          z.array(SkillSnapshotSchema),
  isMain:          z.boolean(),
});

// --- PartySnapshot ---
export const PartySnapshotSchema = z.object({
  main:       PartyMemberSnapshotSchema,
  supporters: z.array(PartyMemberSnapshotSchema).max(GameConstants.PARTY_MAX_SUPPORTS),
});

// --- AdventureSession ---
export const AdventureSessionSchema = z.object({
  sessionId:                nonEmptyString,
  stageId:                  nonEmptyString,
  currentNodeIndex:         z.number().int().nonnegative(),
  partySnapshot:            PartySnapshotSchema,
  battleCheckpointNodeIndex:z.number().int().min(-1),
  resultPendingFlag:        z.boolean(),
  status:                   nonEmptyString,
  // クラッシュ復旧用。既存セーブとの後方互換のため optional + default(null)
  pendingResultType:        z.enum(['SUCCESS', 'FAILURE', 'RETIRE']).nullable().optional().default(null),
});

// --- Player ---
export const PlayerSchema = z.object({
  playerId:      nonEmptyString,
  playerName:    z.string().min(1).max(GameConstants.PLAYER_NAME_MAX_LENGTH),
  worldId:       nonEmptyString,
  mainMonsterId: z.string().nullable(),
});

// --- OwnedMonster ---
export const OwnedMonsterSchema = z.object({
  uniqueId:        nonEmptyString,
  monsterMasterId: nonEmptyString,
  displayName:     nonEmptyString,
  worldId:         nonEmptyString,
  role:            nonEmptyString,
  level:           z.number().int().min(1).max(GameConstants.MAX_LEVEL),
  exp:             z.number().int().nonnegative(),
  personality:     nonEmptyString,
  skillIds:        z.array(nonEmptyString).max(3),
  isMain:          z.boolean(),
});

// --- SupportMonster ---
export const SupportMonsterSchema = z.object({
  supportId:                    nonEmptyString,
  sourceUniqueMonsterIdFromQr:  nonEmptyString,
  monsterMasterId:              nonEmptyString,
  displayName:                  nonEmptyString,
  worldId:                      nonEmptyString,
  role:                         nonEmptyString,
  level:                        z.number().int().min(1).max(GameConstants.MAX_LEVEL),
  personality:                  nonEmptyString,
  skillIds:                     z.array(nonEmptyString).max(3),
  registeredAt:                 nonEmptyString,
});

// --- PendingCandidate ---
export const PendingCandidateSchema = z.object({
  candidateId:                          nonEmptyString,
  monsterMasterId:                      nonEmptyString,
  sourceUniqueMonsterIdFromCandidate:   nonEmptyString,
  personalityId:                        nonEmptyString,
  originSessionId:                      nonEmptyString,
});

// --- QrReceiveHistoryEntry ---
export const QrReceiveHistoryEntrySchema = z.object({
  sourceUniqueMonsterIdFromQr: nonEmptyString,
  receivedAt:                  nonEmptyString,
});

// --- ProgressState ---
export const ProgressStateSchema = z.object({
  unlockedStageIds: z.array(nonEmptyString),
  clearedStageIds:  z.array(nonEmptyString),
});

// --- SettingsState ---
export const SettingsStateSchema = z.object({
  bgmVolume: z.number().min(0).max(1),
  sfxVolume: z.number().min(0).max(1),
});

// --- MainSaveSnapshot (全体) ---
export const MainSaveSnapshotSchema = z.object({
  player:           PlayerSchema.nullable(),
  progress:         ProgressStateSchema.nullable(),
  settings:         SettingsStateSchema.nullable(),
  ownedMonsters:    z.array(OwnedMonsterSchema),
  supportMonsters:  z.array(SupportMonsterSchema),
  qrReceiveHistory: z.array(QrReceiveHistoryEntrySchema),
  adventureSession: AdventureSessionSchema.nullable(),
  pendingCandidate: PendingCandidateSchema.nullable(),
});

export type MainSaveSnapshotSchemaType = z.infer<typeof MainSaveSnapshotSchema>;
