/**
 * 仲間モンスターエンティティ。詳細設計 v4 §5.1 所持区分に準拠。
 *
 * - 育成対象（経験値/レベルアップあり）
 * - 主役設定可
 * - QR生成可（仲間のみ生成可、助っ人は生成不可）
 * - 上限5体（OwnedCapacityPolicy 参照）
 *
 * 保存先: IndexedDB main_save → ownedMonsters ストア
 */
import type { MonsterId, MonsterMasterId, WorldId, SkillId } from '@/types/ids';
import type { WorldId as WorldIdEnum, RoleType, PersonalityType } from '@/common/constants/enums';

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

  /** 性格（入手時ランダム付与、変更不可） */
  readonly personality: PersonalityType;

  /** 習得済みスキルIDリスト（最大3つ） */
  readonly skillIds: readonly SkillId[];

  /**
   * 主役設定中フラグ。
   * 主役は手放し不可（MainMonsterPolicy.canRelease 参照）。
   */
  readonly isMain: boolean;
}
