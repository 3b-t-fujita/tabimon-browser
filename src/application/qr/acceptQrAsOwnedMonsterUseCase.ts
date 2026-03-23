/**
 * QR受取：仲間として追加する UseCase。
 * 詳細設計 v4 §9.7, §9.8 に準拠。
 *
 * 処理:
 *   1. セーブデータ読込
 *   2. 重複・上限チェック（validateForOwned）
 *      上限時 → QR_OWNED_CAPACITY_FULL（単純拒否。入替画面へは遷移しない）
 *   3. QrPayloadV1 から OwnedMonster を構築
 *   4. ownedMonsters + qrReceiveHistory を一括保存
 *
 * 受取履歴:
 *   - 受取確定後にのみ更新する
 *   - 見送り時は更新しない（本 UseCase では見送りは呼ばない）
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { QrErrorCode, SaveErrorCode } from '@/common/errors/AppErrorCode';
import { WorldId as WorldIdEnum, RoleType, PersonalityType } from '@/common/constants/enums';
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';
import type { QrPayloadV1 } from '@/domain/entities/QrPayload';
import { toMonsterId, toMonsterMasterId, toSkillId } from '@/types/ids';
import { validateForOwned } from '@/domain/policies/QrReceivePolicy';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';

export type AcceptQrAsOwnedErrorCode =
  | typeof QrErrorCode.Duplicate
  | typeof QrErrorCode.OwnedCapacityFull
  | typeof SaveErrorCode.LoadFailed
  | typeof SaveErrorCode.SaveFailed;

export interface AcceptQrAsOwnedPayload {
  addedMonster: OwnedMonster;
}

export class AcceptQrAsOwnedMonsterUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(
    payload: QrPayloadV1,
  ): Promise<Result<AcceptQrAsOwnedPayload, AcceptQrAsOwnedErrorCode>> {
    // ---- セーブデータ読込 ----
    const loadResult = await this.tx.load();
    if (!loadResult.ok) return fail(SaveErrorCode.LoadFailed, loadResult.message);

    const save = loadResult.value;
    const owned    = save?.ownedMonsters    ?? [];
    const supports = save?.supportMonsters  ?? [];
    const history  = save?.qrReceiveHistory ?? [];

    // ---- 重複・上限チェック ----
    // 受取履歴での重複も確認
    const sourceId = payload.sourceUniqueMonsterIdFromQr;
    if (history.some((h) => h.sourceUniqueMonsterIdFromQr === sourceId)) {
      return fail(QrErrorCode.Duplicate, '既に受取済みのQRコードです');
    }

    const policyErr = validateForOwned(payload, owned, supports);
    if (policyErr !== QrErrorCode.None) {
      return fail(
        policyErr as AcceptQrAsOwnedErrorCode,
        policyErr === QrErrorCode.Duplicate
          ? 'このモンスターは既に仲間/助っ人にいます'
          : '仲間が上限（5体）に達しています',
      );
    }

    // ---- OwnedMonster 構築 ----
    const newMonster: OwnedMonster = {
      uniqueId:        toMonsterId(payload.sourceUniqueMonsterIdFromQr),
      monsterMasterId: toMonsterMasterId(payload.monsterMasterId),
      displayName:     payload.displayName,
      worldId:         (payload.worldId as WorldIdEnum),
      role:            (payload.roleId as RoleType),
      level:           payload.level,
      exp:             0,
      personality:     (payload.personalityId as PersonalityType),
      skillIds:        payload.skillSnapshot
                         ? payload.skillSnapshot.split('|').filter(Boolean).map(toSkillId)
                         : [],
      isMain:          false,
    };

    // ---- 受取履歴エントリ ----
    const historyEntry = {
      sourceUniqueMonsterIdFromQr: payload.sourceUniqueMonsterIdFromQr,
      receivedAt: new Date().toISOString(),
    };

    // ---- 一括保存（仲間追加 + 履歴更新） ----
    const saveResult = await this.tx.saveMultiple({
      ownedMonsters:    [...owned, newMonster],
      qrReceiveHistory: [...history, historyEntry],
    });

    if (!saveResult.ok) return fail(SaveErrorCode.SaveFailed, saveResult.message);

    return ok({ addedMonster: newMonster });
  }
}
