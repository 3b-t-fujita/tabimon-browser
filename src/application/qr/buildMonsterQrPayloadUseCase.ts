/**
 * 仲間モンスターから QrPayloadV1 を構築する UseCase。
 * 詳細設計 v4 §9.2, §9.9 checksum計算仕様に準拠。
 *
 * 重要:
 * - QR生成対象は仲間モンスターのみ（助っ人は不可）
 * - payloadVersion は QR_V1 固定
 * - checksum を計算してから QrPayloadV1 を返す
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { QrErrorCode } from '@/common/errors/AppErrorCode';
import { GameConstants } from '@/common/constants/GameConstants';
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';
import type { QrPayloadV1 } from '@/domain/entities/QrPayload';
import { computeChecksum } from '@/domain/services/QrChecksumService';

export type BuildQrPayloadErrorCode = typeof QrErrorCode.InvalidFormat;

/**
 * OwnedMonster から QrPayloadV1 を構築する。
 * checksumHash を計算して埋め込む。
 */
export class BuildMonsterQrPayloadUseCase {
  async execute(
    monster: OwnedMonster,
  ): Promise<Result<QrPayloadV1, BuildQrPayloadErrorCode>> {
    // skillSnapshot: skillId を | で連結
    const skillSnapshot = (monster.skillIds as readonly string[]).join(
      GameConstants.QR_CHECKSUM_SEPARATOR,
    );

    // checksumHash なしの仮 payload（checksum計算用）
    const base: QrPayloadV1 = {
      payloadVersion:             GameConstants.QR_PAYLOAD_VERSION,
      sourceUniqueMonsterIdFromQr: monster.uniqueId as string,
      monsterMasterId:            monster.monsterMasterId as string,
      displayName:                monster.displayName,
      worldId:                    monster.worldId as string,
      roleId:                     monster.role as string,
      personalityId:              monster.personality as string,
      level:                      monster.level,
      skillSnapshot,
      checksumHash:               '',   // 仮。以下で上書き
    };

    const checksumHash = await computeChecksum(base);

    return ok({ ...base, checksumHash });
  }
}
