/**
 * 仲間詳細画面用 ViewModel。
 */

export interface MonsterStatsViewModel {
  readonly hp:  number;
  readonly atk: number;
  readonly def: number;
  readonly spd: number;
}

/** スキル表示用 ViewModel */
export interface MonsterSkillViewModel {
  readonly skillId:     string;
  readonly displayName: string;
  /** 'SKILL_ATTACK' | 'SKILL_HEAL' | 'SKILL_BUFF' | 'SKILL_DEBUFF' | 'SKILL_NORMAL' */
  readonly skillType:   string;
}

export interface OwnedMonsterDetailViewModel {
  readonly uniqueId:         string;
  readonly displayName:      string;
  readonly monsterMasterId:  string;
  readonly level:            number;
  readonly exp:              number;
  readonly worldLabel:       string;
  readonly roleLabel:        string;
  readonly personalityLabel: string;
  readonly skillIds:         readonly string[];
  /** skillIds に対応する表示情報（名前・タイプ付き） */
  readonly skills:           readonly MonsterSkillViewModel[];
  readonly isMain:           boolean;
  /** 手放し可否（相棒は false） */
  readonly canRelease:       boolean;
  /** 現在レベルのステータス */
  readonly stats:            MonsterStatsViewModel;
}
