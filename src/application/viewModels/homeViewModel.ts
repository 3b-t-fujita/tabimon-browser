/**
 * Home 画面用 ViewModel。
 * buildHomeViewModelUseCase が生成する。
 * UI 層は Domain オブジェクトを直接知らない。
 */
export interface HomeViewModel {
  /** プレイヤー名 */
  readonly playerName:          string;
  /** 相棒表示名（未設定時は空文字） */
  readonly mainMonsterName:     string;
  /** 相棒レベル（未設定時は null） */
  readonly mainMonsterLevel:    number | null;
  /** 相棒EXP（現レベル帯の進捗値） */
  readonly mainMonsterCurrentExp: number | null;
  /** 次のレベルまでに必要な残りEXP */
  readonly mainMonsterExpToNextLevel: number | null;
  /** レベル内EXP進捗率（0〜1） */
  readonly mainMonsterExpProgressRatio: number | null;
  /** 相棒きずなポイント */
  readonly mainMonsterBondPoints: number | null;
  /** 相棒きずなランク */
  readonly mainMonsterBondRank: 0 | 1 | 2 | 3 | 4 | null;
  /** 次のきずなランクまでに必要な残りpt */
  readonly mainMonsterBondToNextRank: number | null;
  /** 現在ランク帯のきずな進捗率（0〜1） */
  readonly mainMonsterBondProgressRatio: number | null;
  /** 相棒 monsterId（未設定時は null） */
  readonly mainMonsterId:       string | null;
  /** 相棒 monsterMasterId（画像取得用。未設定時は null） */
  readonly mainMonsterMasterId: string | null;
  /** 仲間数 */
  readonly ownedCount:          number;
  /** 仲間上限 */
  readonly ownedCapacity:       number;
  /** 助っ人数 */
  readonly supportCount:        number;
  /** 助っ人上限 */
  readonly supportCapacity:     number;
  /** 続きから可否 */
  readonly canContinue:         boolean;
  /** 続きから時のステージ名/ID（表示用） */
  readonly continueStageId:     string | null;
  /** 続きから理由（PENDING_RESULT / ACTIVE）*/
  readonly continueType:        'PENDING_RESULT' | 'ACTIVE' | null;
}
