/**
 * 保存データ整合性チェック。詳細設計 v4 §10.5 復旧方針に準拠。
 *
 * - 破損データは読込不可
 * - AdventureSession の必須項目不足は復旧不能とみなす
 * - 復旧不能セッションは無効化してホームへ戻す
 * - 全体読込失敗時はタイトルへ戻す
 */
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import type { Player } from '@/domain/entities/Player';
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';
import { GameConstants } from '@/common/constants/GameConstants';

/**
 * AdventureSession が復旧可能かチェックする。
 * 復旧不能の場合はセッションを無効化してホームへ戻す。
 */
export function isSessionRecoverable(session: AdventureSession | null): boolean {
  if (session === null) return false;
  if (!session.sessionId) return false;
  if (!session.stageId) return false;
  if (!session.partySnapshot) return false;
  if (!session.partySnapshot.main) return false;
  return true;
}

/**
 * Player データの必須項目をチェックする。
 */
export function isPlayerValid(player: Player | null): boolean {
  if (player === null) return false;
  if (!player.playerId) return false;
  if (!player.playerName || player.playerName.trim() === '') return false;
  if (!player.worldId) return false;
  return true;
}

/**
 * OwnedMonster の整合性をチェックする。
 */
export function isOwnedMonsterValid(monster: OwnedMonster | null): boolean {
  if (monster === null) return false;
  if (!monster.uniqueId) return false;
  if (!monster.monsterMasterId) return false;
  if (monster.level < 1 || monster.level > GameConstants.MAX_LEVEL) return false;
  return true;
}
