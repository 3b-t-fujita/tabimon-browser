/**
 * 仲間モンスターエンティティ。詳細設計 v4 §5.1 所持区分に準拠。
 *
 * - 育成対象（経験値/レベルアップあり）
 * - 相棒設定可
 * - QR生成可（仲間のみ生成可、助っ人は生成不可）
 * - 上限10体（OwnedCapacityPolicy 参照）
 *
 * 保存先: IndexedDB main_save → ownedMonsters ストア
 */
import type { MonsterId, MonsterMasterId, WorldId, SkillId } from '@/types/ids';
import type { WorldId as WorldIdEnum, RoleType, PersonalityType } from '@/common/constants/enums';

export type BondRank = 0 | 1 | 2 | 3 | 4;
export type SkillProficiencyStage = 0 | 1 | 2 | 3;

export interface SkillProficiencyRecord {
  readonly useCount: number;
  readonly stage: SkillProficiencyStage;
}

export interface OwnedMonster {
  /**
   * 個体固有ID（UUID）。
   * QR重複判定の source_unique_monster_id にも使用する。
   */
  readonly uniqueId: MonsterId;

  /** モンスター種別マスタID */
  readonly monsterMasterId: MonsterMasterId;

  /** 表示名（QrPayload.displayName と一致） */
  readonly displayName: string;

  /** 所属ワールド */
  readonly worldId: WorldIdEnum;

  /** ロール */
  readonly role: RoleType;

  /** 現在レベル（1〜30） */
  readonly level: number;

  /** 現在経験値 */
  readonly exp: number;

  /** V3 用の現在EXP。既存 exp と互換を保ちながら段階的に移行する。 */
  readonly currentExp?: number;

  /** 相棒とのきずなポイント */
  readonly bondPoints?: number;

  /** きずなランク */
  readonly bondRank?: BondRank;

  /** 性格（入手時ランダム付与、変更不可） */
  readonly personality: PersonalityType;

  /** 習得済みスキルIDリスト（最大3つ） */
  readonly skillIds: readonly SkillId[];

  /** スキル熟練度 */
  readonly skillProficiency?: Readonly<Record<string, SkillProficiencyRecord>>;

  /** 将来の分岐進化用。初回V3では実質未使用。 */
  readonly evolutionBranchId?: string | null;

  /** 既読のきずな節目 */
  readonly bondMilestoneRead?: readonly number[];

  /**
   * 相棒設定中フラグ。
   * 相棒は手放し不可（MainMonsterPolicy.canRelease 参照）。
   */
  readonly isMain: boolean;
}
