/**
 * 保存データ業務整合性検証。詳細設計 v4 §10.5, §11 に準拠。
 *
 * Zodスキーマが型整合を担い、このモジュールは業務ルール整合性を担う:
 * - 相棒が ownedMonsters 内に存在すること
 * - 仲間上限 <= 10 / 助っ人上限 <= 10
 * - AdventureSession の status と必須フィールドの整合
 *   - SESSION_ACTIVE_BATTLE のとき battleCheckpointNodeIndex >= 0
 *   - SESSION_PENDING_RESULT のとき resultPendingFlag === true
 * - pendingCandidate の存在と session 状態整合
 */
import type { MainSaveSnapshot } from '@/infrastructure/storage/models';
import { GameConstants } from '@/common/constants/GameConstants';
import { AdventureSessionStatus } from '@/common/constants/enums';

export interface ConsistencyError {
  field: string;
  message: string;
}

export interface ConsistencyResult {
  valid: boolean;
  errors: ConsistencyError[];
}

/**
 * MainSaveSnapshot の業務整合性を検証する。
 * Zodスキーマ検証後に呼ぶことを想定。
 */
export function validateSaveConsistency(save: MainSaveSnapshot): ConsistencyResult {
  const errors: ConsistencyError[] = [];

  // --- 仲間・助っ人上限 ---
  if (save.ownedMonsters.length > GameConstants.OWNED_MONSTER_CAPACITY) {
    errors.push({
      field: 'ownedMonsters',
      message: `仲間数(${save.ownedMonsters.length})が上限(${GameConstants.OWNED_MONSTER_CAPACITY})を超えています`,
    });
  }
  if (save.supportMonsters.length > GameConstants.SUPPORT_MONSTER_CAPACITY) {
    errors.push({
      field: 'supportMonsters',
      message: `助っ人数(${save.supportMonsters.length})が上限(${GameConstants.SUPPORT_MONSTER_CAPACITY})を超えています`,
    });
  }

  // --- 相棒の存在確認 ---
  if (save.player?.mainMonsterId) {
    const mainExists = save.ownedMonsters.some(
      (m) => m.uniqueId === save.player!.mainMonsterId
    );
    if (!mainExists) {
      errors.push({
        field: 'player.mainMonsterId',
        message: `相棒(${save.player.mainMonsterId})が ownedMonsters に存在しません`,
      });
    }
  }

  // --- 相棒フラグの整合 ---
  const mainFlaggedMonsters = save.ownedMonsters.filter((m) => m.isMain);
  if (mainFlaggedMonsters.length > 1) {
    errors.push({
      field: 'ownedMonsters.isMain',
      message: `isMain=true のモンスターが複数存在します(${mainFlaggedMonsters.length}体)`,
    });
  }

  // --- AdventureSession 業務整合 ---
  const session = save.adventureSession;
  if (session) {
    validateSessionConsistency(session, errors);
  }

  // --- PendingCandidate と Session 状態整合 ---
  if (save.pendingCandidate && !save.adventureSession) {
    // セッションなしで候補が残っている場合は警告レベル（復旧可能）
    // エラーとしてログに残すのみ
    errors.push({
      field: 'pendingCandidate',
      message: 'adventureSession なしで pendingCandidate が存在します（前回の候補が未処理です）',
    });
  }

  return { valid: errors.length === 0, errors };
}

function validateSessionConsistency(
  session: NonNullable<MainSaveSnapshot['adventureSession']>,
  errors: ConsistencyError[]
): void {
  // SESSION_ACTIVE_BATTLE のとき battleCheckpointNodeIndex >= 0 が必須
  if (session.status === AdventureSessionStatus.ActiveBattle) {
    if (session.battleCheckpointNodeIndex < 0) {
      errors.push({
        field: 'adventureSession.battleCheckpointNodeIndex',
        message: 'SESSION_ACTIVE_BATTLE なのに battleCheckpointNodeIndex が未設定です',
      });
    }
  }

  // SESSION_PENDING_RESULT のとき resultPendingFlag === true が必須
  if (session.status === AdventureSessionStatus.PendingResult) {
    if (!session.resultPendingFlag) {
      errors.push({
        field: 'adventureSession.resultPendingFlag',
        message: 'SESSION_PENDING_RESULT なのに resultPendingFlag が false です',
      });
    }
  }

  // partySnapshot の相棒整合
  if (!session.partySnapshot?.main) {
    errors.push({
      field: 'adventureSession.partySnapshot.main',
      message: 'partySnapshot.main が存在しません',
    });
  }
}
