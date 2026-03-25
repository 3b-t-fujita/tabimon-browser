/**
 * Initial Setup 画面用 ViewModel / 入力 DTO。
 */

/** 選択可能なワールド（表示用） */
export interface WorldOption {
  readonly id:    string;
  readonly label: string;
}

/** 仮の初期相棒候補（ワールド別固定） */
export interface StarterMonsterOption {
  readonly monsterMasterId: string;
  readonly displayName:     string;
  readonly worldId:         string;
}

/** Setup 画面の入力値 */
export interface InitialSetupInput {
  readonly playerName:          string;
  readonly worldId:             string;
  readonly starterMonsterId:    string;  // monsterMasterId
}

export interface InitialSetupViewModel {
  readonly worldOptions:          WorldOption[];
  readonly starterMonsterOptions: StarterMonsterOption[];
  readonly isSubmitting:          boolean;
  readonly errorMessage:          string | null;
}
