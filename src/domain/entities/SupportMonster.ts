/**
 * 助っ人モンスターエンティティ。詳細設計 v4 §5.1 所持区分に準拠。
 *
 * - 育成対象外（経験値/レベルアップなし）
 * - 相棒設定不可（助っ人を相棒にはできない）
 * - QR生成不可
 * - 仲間上限（5）に含めない
 * - 上限10体（SupportCapacityPolicy 参照）
 *
 * 保存先: IndexedDB main_save → supportMonsters ストア
 */
import type { MonsterId, MonsterMasterId, SkillId } from '@/types/ids';
import type { WorldId, RoleType, PersonalityType } from '@/common/constants/enums';

export interface SupportMonster {
  /** 助っ人登録ID（UUID） */
  readonly supportId: string;

  /**
   * 元モンスターの固有ID。
   * QR重複判定に使用（仲間・助っ人横断）。
   * 詳細設計 v4 §9.6 重複判定に準拠。
   */
  readonly sourceUniqueMonsterIdFromQr: string;

  /** モンスター種別マスタID */
  readonly monsterMasterId: MonsterMasterId;

  /** 表示名 */
  readonly displayName: string;

  /** 所属ワールド */
  readonly worldId: WorldId;

  /** ロール */
  readonly role: RoleType;

  /** 登録時点のレベル（育成不可） */
  readonly level: number;

  /** 性格 */
  readonly personality: PersonalityType;

  /** スキルIDリスト（QR受取時スナップショット） */
  readonly skillIds: readonly SkillId[];

  /** 登録日時（ISO 8601） */
  readonly registeredAt: string;
}
