/**
 * 戦闘初期化 UseCase。
 * 現在の AdventureSession から初期 BattleState を構築して返す。
 * 詳細設計 v4 §7 戦闘仕様に準拠。
 *
 * 重要:
 * - session.status === SESSION_ACTIVE_BATTLE であること（prepareBattleUseCase 済みを前提）
 * - BattleState は IndexedDB に保存しない（ephemeral、UI state のみ）
 * - 敵グループは節タイプ（BATTLE / BOSS）に応じてステージマスタから選択
 */
import type { Result } from '@/common/results/Result';
import { ok, fail } from '@/common/results/Result';
import { AdventureErrorCode, SaveErrorCode } from '@/common/errors/AppErrorCode';
import { AdventureSessionStatus, NodeType } from '@/common/constants/enums';
import type { AdventureSession } from '@/domain/entities/AdventureSession';
import type { BattleActor, BattleSkillState } from '@/domain/battle/BattleActor';
import type { BattleState } from '@/domain/battle/BattleState';
import type { SkillSnapshot } from '@/domain/valueObjects/SkillSnapshot';
import { getStageMasterById } from '@/infrastructure/master/stageMasterRepository';
import { getNodePatternById } from '@/infrastructure/master/nodePatternRepository';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';
import { buildEnemyActors } from './buildEnemyActorsService';

export type InitializeBattleErrorCode =
  | typeof AdventureErrorCode.SessionNotFound
  | typeof AdventureErrorCode.SessionCorrupt
  | typeof AdventureErrorCode.StageNotFound
  | typeof SaveErrorCode.LoadFailed;

// ---------------------------------------------------------------------------
// SkillSnapshot → BattleSkillState 変換
// ---------------------------------------------------------------------------

function toSkillState(s: SkillSnapshot): BattleSkillState {
  return {
    skillId:           s.skillId as string,
    displayName:       s.displayName,
    skillType:         s.skillType,
    power:             s.power,
    cooldownSec:       s.cooldownSec,
    targetCount:       s.targetCount,
    cooldownRemaining: 0,
  };
}

// ---------------------------------------------------------------------------
// UseCase 実装
// ---------------------------------------------------------------------------

export class InitializeBattleUseCase {
  private readonly tx: SaveTransactionService;
  constructor() { this.tx = new SaveTransactionService(); }

  async execute(
    session: AdventureSession,
  ): Promise<Result<BattleState, InitializeBattleErrorCode>> {
    // ---- セッション状態確認 ----
    if (session.status !== AdventureSessionStatus.ActiveBattle) {
      return fail(
        AdventureErrorCode.SessionCorrupt,
        `戦闘中状態ではありません: ${session.status}`,
      );
    }

    // ---- ステージマスタ取得 ----
    const stageMaster = await getStageMasterById(session.stageId);
    if (!stageMaster) {
      return fail(AdventureErrorCode.StageNotFound, `ステージが見つかりません: ${session.stageId}`);
    }

    // ---- ノードパターン取得 ----
    const pattern = await getNodePatternById(stageMaster.nodePatternId);
    if (!pattern) {
      return fail(AdventureErrorCode.SessionCorrupt, 'ノードパターンが見つかりません');
    }

    // ---- 現在ノード確認 ----
    const currentNode = pattern.nodes.find((n) => n.nodeIndex === session.currentNodeIndex);
    if (!currentNode) {
      return fail(
        AdventureErrorCode.SessionCorrupt,
        `ノードが見つかりません: index=${session.currentNodeIndex}`,
      );
    }

    const isBoss = currentNode.nodeType === NodeType.Boss;
    if (currentNode.nodeType !== NodeType.Battle && !isBoss) {
      return fail(
        AdventureErrorCode.SessionCorrupt,
        `戦闘ノードではありません: type=${currentNode.nodeType}`,
      );
    }

    // ---- 敵グループ決定 ----
    const poolId = isBoss
      ? stageMaster.bossEnemyGroupId
      : stageMaster.enemyGroupPoolId;

    const enemyActors = await buildEnemyActors(poolId);
    if (enemyActors.length === 0) {
      return fail(
        AdventureErrorCode.SessionCorrupt,
        `敵グループが空です: poolId=${poolId}`,
      );
    }

    // ---- パーティアクター構築 ----
    const partyActors: BattleActor[] = [];
    const { main, supporters } = session.partySnapshot;
    const allMembers = [main, ...supporters];

    for (const member of allMembers) {
      const skills: BattleSkillState[] = member.skills.map(toSkillState);
      partyActors.push({
        id:                 member.uniqueId as string,
        displayName:        member.displayName,
        monsterId:          member.monsterMasterId as string,
        isMain:             member.isMain,
        isEnemy:            false,
        maxHp:              member.stats.maxHp,
        baseAtk:            member.stats.atk,
        baseDef:            member.stats.def,
        spd:                member.stats.spd,
        personality:        member.personality,
        skills,
        currentHp:          member.stats.maxHp,
        actionTimer:        0,
        atkMultiplier:      1.0,
        defMultiplier:      1.0,
        buffTurnsRemaining: 0,
      });
    }

    // ---- 初期 BattleState 構築 ----
    const initialState: BattleState = {
      sessionId:          session.sessionId as string,
      stageId:            session.stageId as string,
      isBoss,
      actors:             [...partyActors, ...enemyActors],
      log:                [],
      outcome:            'NONE',
      tickCount:          0,
      pendingMainSkillId: null,
    };

    return ok(initialState);
  }
}
