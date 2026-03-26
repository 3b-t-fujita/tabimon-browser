/**
 * QR受取フロー 統合テスト。
 * フェーズ9指示書 §7, 完了条件 6〜10 に対応。
 *
 * 検証内容:
 * - version不一致拒否
 * - checksum不一致拒否
 * - 重複拒否（仲間・助っ人横断）
 * - 仲間上限拒否（単純拒否・入替画面へ行かない）
 * - 助っ人上限拒否（単純拒否）
 * - 見送り時の履歴未更新
 * - 仲間受取成功（履歴更新確認）
 * - 助っ人登録成功（履歴更新確認）
 * - 受取履歴での重複拒否
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TabimonDatabase, _resetDatabaseForTest } from '@/infrastructure/persistence/db/tabimonDb';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { ValidateQrVersionUseCase } from './validateQrVersionUseCase';
import { ValidateQrChecksumUseCase } from './validateQrChecksumUseCase';
import { ValidateQrDuplicateUseCase } from './validateQrDuplicateUseCase';
import { AcceptQrAsOwnedMonsterUseCase } from './acceptQrAsOwnedMonsterUseCase';
import { AcceptQrAsSupportMonsterUseCase } from './acceptQrAsSupportMonsterUseCase';
import { SkipQrReceiveUseCase } from './skipQrReceiveUseCase';
import { BuildMonsterQrPayloadUseCase } from './buildMonsterQrPayloadUseCase';
import type { QrPayloadV1 } from '@/domain/entities/QrPayload';
import { QrErrorCode } from '@/common/errors/AppErrorCode';
import { GameConstants } from '@/common/constants/GameConstants';
import { PersonalityType, WorldId, RoleType } from '@/common/constants/enums';
import { createEmptyMainSave } from '@/infrastructure/storage/models';
import {
  toMonsterId, toMonsterMasterId, toSkillId, toPlayerId, toWorldId,
} from '@/types/ids';
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';
import type { SupportMonster } from '@/domain/entities/SupportMonster';

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------

function resetAll(): SaveTransactionService {
  const db = new TabimonDatabase();
  _resetDatabaseForTest(db);
  return new SaveTransactionService();
}

/** 有効な QrPayloadV1 を生成（checksum計算済み） */
async function makeValidPayload(overrides: Partial<QrPayloadV1> = {}): Promise<QrPayloadV1> {
  const monster: OwnedMonster = {
    uniqueId:        toMonsterId('src-mon-001'),
    monsterMasterId: toMonsterMasterId('MON_GRASS_001'),
    displayName:     'グリーニョ',
    worldId:         WorldId.Forest,
    role:            RoleType.Attack,
    level:           5,
    exp:             30,
    personality:     PersonalityType.Brave,
    skillIds:        [toSkillId('SKILL_BITE_001')],
    isMain:          false,
  };
  const uc = new BuildMonsterQrPayloadUseCase();
  const result = await uc.execute(monster);
  if (!result.ok) throw new Error('payload生成失敗');
  return { ...result.value, ...overrides };
}

function makeOwnedMonster(id: string, overrides: Partial<OwnedMonster> = {}): OwnedMonster {
  return {
    uniqueId:        toMonsterId(id),
    monsterMasterId: toMonsterMasterId('MON_GRASS_001'),
    displayName:     `Mon-${id}`,
    worldId:         WorldId.Forest,
    role:            RoleType.Attack,
    level:           1,
    exp:             0,
    personality:     PersonalityType.Brave,
    skillIds:        [],
    isMain:          false,
    ...overrides,
  };
}

function makeSupportMonster(sourceId: string): SupportMonster {
  return {
    supportId:                   `support-${sourceId}`,
    sourceUniqueMonsterIdFromQr: sourceId,
    monsterMasterId:             toMonsterMasterId('MON_GRASS_001'),
    displayName:                 `Support-${sourceId}`,
    worldId:                     WorldId.Forest,
    role:                        RoleType.Attack,
    level:                       3,
    personality:                 PersonalityType.Brave,
    skillIds:                    [],
    registeredAt:                new Date().toISOString(),
  };
}

async function seedSave(
  ownedMonsters: OwnedMonster[] = [],
  supportMonsters: SupportMonster[] = [],
  qrReceiveHistory: Array<{ sourceUniqueMonsterIdFromQr: string; receivedAt: string }> = [],
): Promise<void> {
  const tx = resetAll();
  await tx.saveMultiple({
    ...createEmptyMainSave(),
    player: {
      playerId:      toPlayerId('p-1'),
      playerName:    'Tester',
      worldId:       toWorldId(WorldId.Forest),
      mainMonsterId: ownedMonsters[0]?.uniqueId ?? null,
    },
    ownedMonsters,
    supportMonsters,
    qrReceiveHistory,
  });
}

// ---------------------------------------------------------------------------
// テスト
// ---------------------------------------------------------------------------

describe('ValidateQrVersionUseCase', () => {
  it('正しいバージョンなら ok', async () => {
    const payload = await makeValidPayload();
    const result = new ValidateQrVersionUseCase().execute(payload);
    expect(result.ok).toBe(true);
  });

  it('バージョン不一致なら VersionMismatch エラー', async () => {
    const payload = await makeValidPayload({ payloadVersion: 'QR_V0' as typeof GameConstants.QR_PAYLOAD_VERSION });
    const result = new ValidateQrVersionUseCase().execute(payload);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorCode).toBe(QrErrorCode.VersionMismatch);
  });
});

describe('ValidateQrChecksumUseCase', () => {
  it('改ざんなし payload なら ok', async () => {
    const payload = await makeValidPayload();
    const result = await new ValidateQrChecksumUseCase().execute(payload);
    expect(result.ok).toBe(true);
  });

  it('displayName を改ざんすると ChecksumMismatch エラー', async () => {
    const payload = await makeValidPayload({ displayName: 'ハッキング済み' });
    const result = await new ValidateQrChecksumUseCase().execute(payload);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorCode).toBe(QrErrorCode.ChecksumMismatch);
  });

  it('level を改ざんすると ChecksumMismatch エラー', async () => {
    const payload = await makeValidPayload({ level: 999 });
    const result = await new ValidateQrChecksumUseCase().execute(payload);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorCode).toBe(QrErrorCode.ChecksumMismatch);
  });
});

describe('ValidateQrDuplicateUseCase', () => {
  it('重複なし・上限未満なら ok', async () => {
    const payload = await makeValidPayload();
    const result = new ValidateQrDuplicateUseCase().execute({
      payload,
      destination: 'owned',
      owned: [],
      supports: [],
      history: [],
    });
    expect(result.ok).toBe(true);
  });

  it('仲間として同一 sourceId が存在する場合 Duplicate エラー', async () => {
    const payload = await makeValidPayload();
    const owned = [makeOwnedMonster(payload.sourceUniqueMonsterIdFromQr)];
    const result = new ValidateQrDuplicateUseCase().execute({
      payload,
      destination: 'owned',
      owned,
      supports: [],
      history: [],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorCode).toBe(QrErrorCode.Duplicate);
  });

  it('助っ人として同一 sourceId が存在する場合 Duplicate エラー（横断チェック）', async () => {
    const payload = await makeValidPayload();
    const supports = [makeSupportMonster(payload.sourceUniqueMonsterIdFromQr)];
    const result = new ValidateQrDuplicateUseCase().execute({
      payload,
      destination: 'owned',  // 仲間として受取しようとしても助っ人側で重複検知
      owned: [],
      supports,
      history: [],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorCode).toBe(QrErrorCode.Duplicate);
  });

  it('受取履歴に同一 sourceId がある場合 Duplicate エラー', async () => {
    const payload = await makeValidPayload();
    const history = [{ sourceUniqueMonsterIdFromQr: payload.sourceUniqueMonsterIdFromQr, receivedAt: '' }];
    const result = new ValidateQrDuplicateUseCase().execute({
      payload,
      destination: 'owned',
      owned: [],
      supports: [],
      history,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorCode).toBe(QrErrorCode.Duplicate);
  });

  it('仲間上限10体で OwnedCapacityFull エラー（単純拒否・入替画面なし）', async () => {
    const payload = await makeValidPayload();
    const owned = Array.from({ length: 10 }, (_, i) => makeOwnedMonster(`mon-${i}`));
    const result = new ValidateQrDuplicateUseCase().execute({
      payload,
      destination: 'owned',
      owned,
      supports: [],
      history: [],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorCode).toBe(QrErrorCode.OwnedCapacityFull);
  });

  it('助っ人上限10体で SupportCapacityFull エラー（単純拒否）', async () => {
    const payload = await makeValidPayload();
    const supports = Array.from({ length: 10 }, (_, i) => makeSupportMonster(`support-src-${i}`));
    const result = new ValidateQrDuplicateUseCase().execute({
      payload,
      destination: 'support',
      owned: [],
      supports,
      history: [],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorCode).toBe(QrErrorCode.SupportCapacityFull);
  });

  it('見送り（dismiss）は重複・上限に関わらず ok', async () => {
    const payload = await makeValidPayload();
    const owned = Array.from({ length: 5 }, (_, i) => makeOwnedMonster(`mon-${i}`));
    const result = new ValidateQrDuplicateUseCase().execute({
      payload,
      destination: 'dismiss',
      owned,
      supports: [],
      history: [],
    });
    expect(result.ok).toBe(true);
  });
});

describe('AcceptQrAsOwnedMonsterUseCase', () => {
  beforeEach(() => { resetAll(); });

  it('仲間として受取成功 → ownedMonsters 追加 + 履歴更新', async () => {
    await seedSave();
    const payload = await makeValidPayload();

    const result = await new AcceptQrAsOwnedMonsterUseCase().execute(payload);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.addedMonster.uniqueId).toBe(payload.sourceUniqueMonsterIdFromQr);

    const loaded = await new SaveTransactionService().load();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value?.ownedMonsters).toHaveLength(1);
    expect(loaded.value?.qrReceiveHistory).toHaveLength(1);
    expect(loaded.value?.qrReceiveHistory[0].sourceUniqueMonsterIdFromQr)
      .toBe(payload.sourceUniqueMonsterIdFromQr);
  });

  it('仲間上限10体で OwnedCapacityFull エラー（DB は変更しない）', async () => {
    const owned = Array.from({ length: 10 }, (_, i) => makeOwnedMonster(`mon-${i}`));
    await seedSave(owned);
    const payload = await makeValidPayload();

    const result = await new AcceptQrAsOwnedMonsterUseCase().execute(payload);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorCode).toBe(QrErrorCode.OwnedCapacityFull);

    // DB は変わらない
    const loaded = await new SaveTransactionService().load();
    if (!loaded.ok) return;
    expect(loaded.value?.ownedMonsters).toHaveLength(10);
    expect(loaded.value?.qrReceiveHistory).toHaveLength(0);
  });
});

describe('AcceptQrAsSupportMonsterUseCase', () => {
  beforeEach(() => { resetAll(); });

  it('助っ人として受取成功 → supportMonsters 追加 + 履歴更新', async () => {
    await seedSave();
    const payload = await makeValidPayload();

    const result = await new AcceptQrAsSupportMonsterUseCase().execute(payload);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.addedSupport.sourceUniqueMonsterIdFromQr)
      .toBe(payload.sourceUniqueMonsterIdFromQr);

    const loaded = await new SaveTransactionService().load();
    if (!loaded.ok) return;
    expect(loaded.value?.supportMonsters).toHaveLength(1);
    expect(loaded.value?.qrReceiveHistory).toHaveLength(1);
  });

  it('助っ人上限10体で SupportCapacityFull エラー（DB は変更しない）', async () => {
    const supports = Array.from({ length: 10 }, (_, i) => makeSupportMonster(`src-${i}`));
    await seedSave([], supports);
    const payload = await makeValidPayload();

    const result = await new AcceptQrAsSupportMonsterUseCase().execute(payload);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorCode).toBe(QrErrorCode.SupportCapacityFull);

    const loaded = await new SaveTransactionService().load();
    if (!loaded.ok) return;
    expect(loaded.value?.supportMonsters).toHaveLength(10);
    expect(loaded.value?.qrReceiveHistory).toHaveLength(0);
  });

  it('仲間に同じ sourceId が存在すると Duplicate エラー（横断チェック）', async () => {
    const payload = await makeValidPayload();
    const owned = [makeOwnedMonster(payload.sourceUniqueMonsterIdFromQr)];
    await seedSave(owned);

    const result = await new AcceptQrAsSupportMonsterUseCase().execute(payload);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorCode).toBe(QrErrorCode.Duplicate);
  });
});

describe('SkipQrReceiveUseCase', () => {
  it('見送りは DB 書き込みなし（履歴更新しない）', async () => {
    await seedSave();

    new SkipQrReceiveUseCase().execute();

    const loaded = await new SaveTransactionService().load();
    if (!loaded.ok) return;
    // 履歴は空のまま
    expect(loaded.value?.qrReceiveHistory).toHaveLength(0);
  });

  it('SkipQrReceiveUseCase は常に ok を返す', () => {
    const result = new SkipQrReceiveUseCase().execute();
    expect(result.ok).toBe(true);
  });
});
