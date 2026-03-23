/**
 * 仲間詳細画面用 ViewModel。
 */
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
  /** 手放し可否（主役は false） */
  readonly canRelease:       boolean;
}
