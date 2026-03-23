/**
 * BuildHomeViewModelUseCase テスト。
 *
 * 確認観点:
 *   - プレイヤー名が ViewModel に反映される
 *   - 主役名 / 仲間数 / 助っ人数が正しい
 *   - AdventureSession なし → canContinue=false
 *   - AdventureSession あり (SESSION_ACTIVE) → canContinue=true, reason='ACTIVE'
 *   - AdventureSession あり (SESSION_PENDING_RESULT) → canContinue=true, reason='PENDING_RESULT'
 */
import { describe, it, expect } from 'vitest';
import { BuildHomeViewModelUseCase } from './buildHomeViewModelUseCase';
import { createEmptyMainSave } from '@/infrastructure/storage/models';
import { AdventureSessionStatus, WorldId, RoleType, PersonalityType } from '@/common/constants/enums';
import { toPlayerId, toWorldId, toMonsterId, toMonsterMasterId, toSessionId, toStageId } from '@/types/ids';
import type { MainSaveSnapshot } from '@/infrastructure/storage/models';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import type { PartySnapshot } from '@/domain/valueObjects/PartySnapshot';

const useCase = new BuildHomeViewModelUseCase();

function makeParty(): PartySnapshot {
  return {
    main: {
      uniqueId:        toMonsterId('mon-1'),
      monsterMasterId: toMonsterMasterId('MON_001'),
      displayName:     'テストモン',
      personality:     PersonalityType.Brave,
      stats:           { maxHp: 100, atk: 10, def: 5, spd: 8 },
      skills:          [],
      isMain:          true,
    },
    supporters: [],
  };
}

function makeSession(status: AdventureSession['status']): AdventureSession {
  return {
    sessionId:                 toSessionId('s-1'),
    stageId:                   toStageId('STAGE_FOREST_01'),
    currentNodeIndex:          2,
    partySnapshot:             makeParty(),
    battleCheckpointNodeIndex: -1,
    resultPendingFlag:         status === AdventureSessionStatus.PendingResult,
    status,
    pendingResultType:         null,
    nextBattleBuffMultiplier:  1.0,
    randomEventBattle:         false,
  };
}

const BASE_PLAYER = {
  playerId:      toPlayerId('p-1'),
  playerName:    'ハナコ',
  worldId:       toWorldId('WORLD_FOREST'),
  mainMonsterId: null as null | ReturnType<typeof toMonsterId>,
};

describe('BuildHomeViewModelUseCase', () => {
  it('プレイヤー名が反映される', () => {
    const save: MainSaveSnapshot = { ...createEmptyMainSave(), player: BASE_PLAYER };
    const vm = useCase.execute(save);
    expect(vm.playerName).toBe('ハナコ');
  });

  it('仲間数 / 助っ人数が反映される', () => {
    const monster = {
      uniqueId:        toMonsterId('m-1'),
      monsterMasterId: toMonsterMasterId('MON_001'),
      displayName:     'グリーニョ',
      worldId:         WorldId.Forest,
      role:            RoleType.Attack,
      level:           1,
      exp:             0,
      personality:     PersonalityType.Brave,
      skillIds:        [] as never[],
      isMain:          true,
    };
    const save: MainSaveSnapshot = {
      ...createEmptyMainSave(),
      player:        { ...BASE_PLAYER, mainMonsterId: toMonsterId('m-1') },
      ownedMonsters: [monster],
    };
    const vm = useCase.execute(save);
    expect(vm.ownedCount).toBe(1);
    expect(vm.ownedCapacity).toBe(5);
    expect(vm.supportCount).toBe(0);
    expect(vm.supportCapacity).toBe(10);
  });

  it('主役名が反映される', () => {
    const uniqueId = toMonsterId('main-mon');
    const save: MainSaveSnapshot = {
      ...createEmptyMainSave(),
      player: { ...BASE_PLAYER, mainMonsterId: uniqueId },
      ownedMonsters: [{
        uniqueId,
        monsterMasterId: toMonsterMasterId('MON_001'),
        displayName:     'グリーニョ',
        worldId:         WorldId.Forest,
        role:            RoleType.Attack,
        level:           1,
        exp:             0,
        personality:     PersonalityType.Brave,
        skillIds:        [] as never[],
        isMain:          true,
      }],
    };
    const vm = useCase.execute(save);
    expect(vm.mainMonsterName).toBe('グリーニョ');
    expect(vm.mainMonsterId).toBe(uniqueId);
  });

  it('AdventureSession なし → canContinue=false', () => {
    const save: MainSaveSnapshot = { ...createEmptyMainSave(), player: BASE_PLAYER };
    const vm = useCase.execute(save);
    expect(vm.canContinue).toBe(false);
    expect(vm.continueType).toBeNull();
  });

  it('SESSION_ACTIVE → canContinue=true, continueType=ACTIVE', () => {
    const save: MainSaveSnapshot = {
      ...createEmptyMainSave(),
      player:           BASE_PLAYER,
      adventureSession: makeSession(AdventureSessionStatus.Active),
    };
    const vm = useCase.execute(save);
    expect(vm.canContinue).toBe(true);
    expect(vm.continueType).toBe('ACTIVE');
    expect(vm.continueStageId).toBe('STAGE_FOREST_01');
  });

  it('SESSION_PENDING_RESULT → canContinue=true, continueType=PENDING_RESULT', () => {
    const save: MainSaveSnapshot = {
      ...createEmptyMainSave(),
      player:           BASE_PLAYER,
      adventureSession: makeSession(AdventureSessionStatus.PendingResult),
    };
    const vm = useCase.execute(save);
    expect(vm.canContinue).toBe(true);
    expect(vm.continueType).toBe('PENDING_RESULT');
  });

  it('player なし → playerName が（未設定）', () => {
    const vm = useCase.execute(createEmptyMainSave());
    expect(vm.playerName).toBe('（未設定）');
  });
});
