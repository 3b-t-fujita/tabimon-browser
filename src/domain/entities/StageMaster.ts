/**
 * ステージマスタデータ型。public/masters/stages.json と対応。
 * 詳細設計 v4 §6.3 ステージ構成に準拠。
 */

export type FarmCategory = 'EXP' | 'BOND' | 'SKILL';
export type FarmDifficultyTier = 'EARLY' | 'LATE';

export interface StageMaster {
  readonly stageId:              string;
  readonly worldId:              number;         // 1=Forest / 2=Volcano / 3=Ice
  readonly stageNo:              number;         // 1, 2, 3
  readonly stageType:            'STORY' | 'FARM';
  readonly farmCategory?:        FarmCategory;
  readonly difficultyTier?:      FarmDifficultyTier;
  readonly difficulty:           'Easy' | 'Normal' | 'Hard';
  readonly recommendedLevel:     number;
  readonly estimatedMinutes:     number;
  readonly firstClearBonusExp?:  number;
  readonly nodePatternId:            string;
  readonly enemyGroupPoolId:         string;          // 通常戦闘敵グループプールID
  readonly bossEnemyGroupId:         string;          // ボス敵グループID
  readonly candidateMonsterPoolId:   string;          // 成功時候補抽選プールID
  readonly unlockStageId:            string | null;  // クリア時に解放する次ステージID
  readonly baseExp:                  number;
  readonly rareAPoolId?:             string;          // レアエンカウント Aプール（任意）
  readonly rareBPoolId?:             string;          // レアエンカウント Bプール（任意）
}
