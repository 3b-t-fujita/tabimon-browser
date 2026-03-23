/**
 * 編成画面用 ViewModel。
 */
export interface PartyMainViewModel {
  readonly uniqueId:      string;
  readonly displayName:   string;
  readonly level:         number;
  readonly roleLabel:     string;
}

export interface PartySupportCandidateViewModel {
  readonly supportId:     string;
  readonly displayName:   string;
  readonly level:         number;
  readonly roleLabel:     string;
  readonly worldLabel:    string;
  /** 既に編成選択済みか */
  readonly isSelected:    boolean;
}

export interface SelectedSupportViewModel {
  readonly supportId:     string;
  readonly displayName:   string;
  readonly level:         number;
}

export interface PartyEditViewModel {
  /** 現在の主役（null = 未設定） */
  readonly main:               PartyMainViewModel | null;
  /** 助っ人候補一覧（全助っ人） */
  readonly supportCandidates:  PartySupportCandidateViewModel[];
  /** 現在選択中の助っ人（最大2） */
  readonly selectedSupports:   SelectedSupportViewModel[];
  /** 助っ人は最大2体まで選択可能か */
  readonly canAddSupport:      boolean;
}
