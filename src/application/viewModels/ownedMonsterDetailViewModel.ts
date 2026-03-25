/**
 * 仲間詳細画面用 ViewModel。
 */

export interface MonsterStatsViewModel {
  readonly hp:  number;
  readonly atk: number;
  readonly def: number;
  readonly spd: number;
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
  readonly isMain:           boolean;
  /** 手放し可否（相棒は false） */
  readonly canRelease:       boolean;
  /** 現在レベルのステータス */
  readonly stats:            MonsterStatsViewModel;
}
