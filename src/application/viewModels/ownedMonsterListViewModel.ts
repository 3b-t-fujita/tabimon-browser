/**
 * 仲間一覧画面用 ViewModel。
 * UI が Domain オブジェクトを直接知らなくて済むよう整形する。
 */
export interface OwnedMonsterListItemViewModel {
  readonly uniqueId:        string;
  readonly displayName:     string;
  readonly level:           number;
  readonly worldLabel:      string;
  readonly roleLabel:       string;
  readonly isMain:          boolean;
  readonly monsterMasterId: string;
}

export interface OwnedMonsterListViewModel {
  readonly monsters:   OwnedMonsterListItemViewModel[];
  readonly count:      number;
  readonly capacity:   number;
}
