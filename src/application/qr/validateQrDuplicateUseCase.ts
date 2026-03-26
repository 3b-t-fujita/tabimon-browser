/**
 * QrPayloadV1 の重複・上限を検証する UseCase。
 * 詳細設計 v4 §9 検証ステップ⑥「重複確認」に準拠。
 *
 * 検証順: version → checksum → duplicate を崩さないこと。
 * このUseCase は version / checksum 確認済み後に呼ぶこと。
 *
 * 重複判定:
 * - sourceUniqueMonsterIdFromQr 単位
 * - 仲間（ownedMonsters）/ 助っ人（supportMonsters）横断チェック
 * - 受取履歴（qrReceiveHistory）でも確認
 *
 * 上限判定（受取先ごと）:
 * - 仲間: 上限5 → QR_OWNED_CAPACITY_FULL（単純拒否。入替画面へ遷移しない）
 * - 助っ人: 上限10 → QR_SUPPORT_CAPACITY_FULL（単純拒否）
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { QrErrorCode } from '@/common/errors/AppErrorCode';
import type { QrPayloadV1, QrReceiveDestination } from '@/domain/entities/QrPayload';
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';
import type { SupportMonster } from '@/domain/entities/SupportMonster';
import type { QrReceiveHistoryEntry } from '@/infrastructure/storage/models';
import { validateForOwned, validateForSupport } from '@/domain/policies/QrReceivePolicy';

export type ValidateQrDuplicateErrorCode =
  | typeof QrErrorCode.Duplicate
  | typeof QrErrorCode.OwnedCapacityFull
  | typeof QrErrorCode.SupportCapacityFull;

export interface ValidateQrDuplicateInput {
  payload:    QrPayloadV1;
  destination: QrReceiveDestination;
  owned:      readonly OwnedMonster[];
  supports:   readonly SupportMonster[];
  history:    readonly QrReceiveHistoryEntry[];
}

export class ValidateQrDuplicateUseCase {
  execute(input: ValidateQrDuplicateInput): Result<void, ValidateQrDuplicateErrorCode> {
    const { payload, destination, owned, supports, history } = input;
    const sourceId = payload.sourceUniqueMonsterIdFromQr;

    // ---- 受取履歴でも重複確認 ----
    if (history.some((h) => h.sourceUniqueMonsterIdFromQr === sourceId)) {
      return fail(QrErrorCode.Duplicate, '既に受取済みのQRコードです');
    }

    if (destination === 'dismiss') {
      // 見送りは上限・重複に関係なく通す
      return ok(undefined);
    }

    if (destination === 'owned') {
      const err = validateForOwned(payload, owned, supports);
      if (err !== QrErrorCode.None) {
        return fail(err as ValidateQrDuplicateErrorCode, errorMessage(err));
      }
    } else {
      // 'support'
      const err = validateForSupport(payload, owned, supports);
      if (err !== QrErrorCode.None) {
        return fail(err as ValidateQrDuplicateErrorCode, errorMessage(err));
      }
    }

    return ok(undefined);
  }
}

function errorMessage(code: string): string {
  switch (code) {
    case QrErrorCode.Duplicate:           return 'このモンスターは既に仲間/助っ人にいます';
    case QrErrorCode.OwnedCapacityFull:   return '仲間が上限（10体）に達しています';
    case QrErrorCode.SupportCapacityFull: return '助っ人が上限（10体）に達しています';
    default:                              return '受取できません';
  }
}
