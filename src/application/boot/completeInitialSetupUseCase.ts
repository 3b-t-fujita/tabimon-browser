/**
 * 初期設定完了 UseCase。
 * プレイヤー名 / ワールド / 初期主役を受け取り保存する。
 *
 * 保存は必ず SaveTransactionService 経由（temp → validate → main）。
 * component 内で IndexedDB を直接触らない。
 */
import { type Result, ok, fail } from '@/common/results/Result';
import { SaveErrorCode, GeneralErrorCode } from '@/common/errors/AppErrorCode';
import { GameConstants } from '@/common/constants/GameConstants';
import { WorldId, RoleType, PersonalityType } from '@/common/constants/enums';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { createEmptyMainSave } from '@/infrastructure/storage/models';
import { toPlayerId, toWorldId, toMonsterId, toMonsterMasterId } from '@/types/ids';
import type { InitialSetupInput } from '@/application/viewModels/initialSetupViewModel';
import type { WorldId as WorldIdEnum } from '@/common/constants/enums';

// ワールドごとの初期主役マスタ（フェーズ3 仮定義）
const STARTER_MONSTERS: Record<string, { monsterMasterId: string; displayName: string; worldId: WorldIdEnum }> = {
  MON_GRASS_001: { monsterMasterId: 'MON_GRASS_001', displayName: 'グリーニョ', worldId: WorldId.Forest   },
  MON_FIRE_001:  { monsterMasterId: 'MON_FIRE_001',  displayName: 'フレイム',   worldId: WorldId.Volcano  },
  MON_ICE_001:   { monsterMasterId: 'MON_ICE_001',   displayName: 'フロスト',   worldId: WorldId.Ice      },
};

/**
 * 制御文字・改行・タブ禁止パターン（詳細設計 §4.2）。
 * 絵文字の完全禁止は実装コストが高いため、制御文字のみ禁止する。
 */
const FORBIDDEN_CHARS = /[\x00-\x1F\x7F]/;

/** 入力バリデーション（詳細設計 v4 §4.2 準拠） */
function validate(input: InitialSetupInput): string | null {
  const trimmed = input.playerName.trim();
  if (!trimmed)
    return 'プレイヤー名を入力してください';
  if (trimmed.length > GameConstants.PLAYER_NAME_MAX_LENGTH)
    return `プレイヤー名は${GameConstants.PLAYER_NAME_MAX_LENGTH}文字以内にしてください`;
  if (FORBIDDEN_CHARS.test(trimmed))
    return 'プレイヤー名に使用できない文字が含まれています';
  if (!input.worldId)
    return 'ワールドを選択してください';
  if (!input.starterMonsterId)
    return '初期主役を選択してください';
  if (!STARTER_MONSTERS[input.starterMonsterId])
    return '無効な初期主役です';
  if (STARTER_MONSTERS[input.starterMonsterId].worldId !== input.worldId)
    return '選択したワールドと主役が一致しません';
  return null;
}

export class CompleteInitialSetupUseCase {
  private readonly tx: SaveTransactionService;

  constructor() {
    this.tx = new SaveTransactionService();
  }

  async execute(input: InitialSetupInput): Promise<Result<void, SaveErrorCode | typeof GeneralErrorCode[keyof typeof GeneralErrorCode]>> {
    // 入力バリデーション
    const validationError = validate(input);
    if (validationError) {
      return fail(GeneralErrorCode.InvalidInput, validationError);
    }

    const starter       = STARTER_MONSTERS[input.starterMonsterId];
    const monsterUniqueId = toMonsterId(`starter-${Date.now()}`);
    const playerId        = toPlayerId(`player-${Date.now()}`);

    const base = createEmptyMainSave();
    const snapshot = {
      ...base,
      player: {
        playerId,
        playerName:    input.playerName.trim(),
        worldId:       toWorldId(input.worldId),
        mainMonsterId: monsterUniqueId,
      },
      ownedMonsters: [
        {
          uniqueId:        monsterUniqueId,
          monsterMasterId: toMonsterMasterId(starter.monsterMasterId),
          displayName:     starter.displayName,
          worldId:         starter.worldId,
          role:            RoleType.Attack,
          level:           1,
          exp:             0,
          personality:     PersonalityType.Brave,
          skillIds:        [] as ReturnType<typeof import('@/types/ids').toSkillId>[],
          isMain:          true,
        },
      ],
      progress: {
        // stageNo===1 の3ステージは初期から解放済み（詳細設計 v4 §6.3）
        unlockedStageIds: ['stage_w1_1', 'stage_w2_1', 'stage_w3_1'],
        clearedStageIds:  [],
      },
    };

    return this.tx.saveMultiple(snapshot);
  }
}
