/**
 * QR受取：助っ人として登録する UseCase。
 * 詳細設計 v4 §9.7, §9.8 に準拠。
 *
 * 処理:
 *   1. セーブデータ読込
 *   2. 重複・上限チェック（validateForSupport）
 *      上限時 → QR_SUPPORT_CAPACITY_FULL（単純拒否。入替画面へは遷移しない）
 *   3. QrPayloadV1 から SupportMonster を構築
 *   4. supportMonsters + qrReceiveHistory を一括保存
 *
 * 受取履歴:
 *   - 受取確定後にのみ更新する
 *   - 見送り時は更新しない（本 UseCase では見送りは呼ばない）
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { QrErrorCode, SaveErrorCode } from '@/common/errors/AppErrorCode';
import { WorldId as WorldIdEnum, RoleType, PersonalityType } from '@/common/constants/enums';
import type { SupportMonster } from '@/domain/entities/SupportMonster';
import type { QrPayloadV1 } from '@/domain/entities/QrPayload';
import { toMonsterMasterId, toSkillId } from '@/types/ids';
import { validateForSupport } from '@/domain/policies/QrReceivePolicy';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';

export type AcceptQrAsSupportErrorCode =
  | typeof QrErrorCode.Duplicate
  | typeof QrErrorCode.SupportCapacityFull
  | typeof SaveErrorCode.LoadFailed
  | typeof SaveErrorCode.SaveFailed;

export interface AcceptQrAsSupportPayload {
  addedSupport: SupportMonster;
}

export class AcceptQrAsSupportMonsterUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(
    payload: QrPayloadV1,
  ): Promise<Result<AcceptQrAsSupportPayload, AcceptQrAsSupportErrorCode>> {
    // ---- セーブデータ読込 ----
    const loadResult = await this.tx.load();
    if (!loadResult.ok) return fail(SaveErrorCode.LoadFailed, loadResult.message);

    const save = loadResult.value;
    const owned    = save?.ownedMonsters    ?? [];
    const supports = save?.supportMonsters  ?? [];
    const history  = save?.qrReceiveHistory ?? [];

    // ---- 受取履歴での重複チェック ----
    const sourceId = payload.sourceUniqueMonsterIdFromQr;
    if (history.some((h) => h.sourceUniqueMonsterIdFromQr === sourceId)) {
      return fail(QrErrorCode.Duplicate, '既に受取済みのQRコードです');
    }

    // ---- 重複・上限チェック（仲間・助っ人横断） ----
    const policyErr = validateForSupport(payload, owned, supports);
    if (policyErr !== QrErrorCode.None) {
      return fail(
        policyErr as AcceptQrAsSupportErrorCode,
        policyErr === QrErrorCode.Duplicate
          ? 'このモンスターは既に仲間/助っ人にいます'
          : '助っ人が上限（10体）に達しています',
      );
    }

    // ---- SupportMonster 構築 ----
    const newSupport: SupportMonster = {
      supportId:                   crypto.randomUUID(),
      sourceUniqueMonsterIdFromQr: payload.sourceUniqueMonsterIdFromQr,
      monsterMasterId:             toMonsterMasterId(payload.monsterMasterId),
      displayName:                 payload.displayName,
      worldId:                     (payload.worldId as WorldIdEnum),
      role:                        (payload.roleId as RoleType),
      level:                       payload.level,
      personality:                 (payload.personalityId as PersonalityType),
      skillIds:                    payload.skillSnapshot
                                     ? payload.skillSnapshot.split('|').filter(Boolean).map(toSkillId)
                                     : [],
      registeredAt:                new Date().toISOString(),
    };

    // ---- 受取履歴エントリ ----
    const historyEntry = {
      sourceUniqueMonsterIdFromQr: payload.sourceUniqueMonsterIdFromQr,
      receivedAt: new Date().toISOString(),
    };

    // ---- 一括保存（助っ人追加 + 履歴更新） ----
    const saveResult = await this.tx.saveMultiple({
      supportMonsters:  [...supports, newSupport],
      qrReceiveHistory: [...history, historyEntry],
    });

    if (!saveResult.ok) return fail(SaveErrorCode.SaveFailed, saveResult.message);

    return ok({ addedSupport: newSupport });
  }
}
