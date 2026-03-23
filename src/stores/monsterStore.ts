/**
 * 仲間一覧 / 編成 UI 状態 Zustand Store。
 * フェーズ4指示書 §5.2 に準拠。
 *
 * 持ってよいもの: 表示用一時状態・選択状態・ダイアログ状態・保存中フラグ
 * 持ってはいけないもの: 永続セーブ本体・SaveTransactionService実体
 */
import { create } from 'zustand';
import type { OwnedMonsterListViewModel } from '@/application/viewModels/ownedMonsterListViewModel';
import type { OwnedMonsterDetailViewModel } from '@/application/viewModels/ownedMonsterDetailViewModel';
import type { PartyEditViewModel } from '@/application/viewModels/partyEditViewModel';

interface MonsterUiState {
  /** 仲間一覧 ViewModel（キャッシュ） */
  monsterList:           OwnedMonsterListViewModel | null;
  /** 仲間詳細 ViewModel（キャッシュ） */
  monsterDetail:         OwnedMonsterDetailViewModel | null;
  /** 編成 ViewModel（キャッシュ） */
  partyEdit:             PartyEditViewModel | null;
  /** 編成で選択中の助っ人 ID リスト */
  selectedSupportIds:    string[];
  /** 保存処理中フラグ */
  isSaving:              boolean;
  /** 保存失敗メッセージ */
  saveError:             string | null;
  /** 確認ダイアログ（仲間手放し用） */
  confirmDialog:         ConfirmDialogState | null;
  /** エラーダイアログ */
  errorDialog:           ErrorDialogState | null;
}

export interface ConfirmDialogState {
  readonly title:     string;
  readonly message:   string;
  readonly onConfirm: () => void;
  readonly onCancel:  () => void;
}

export interface ErrorDialogState {
  readonly title:   string;
  readonly message: string;
}

interface MonsterUiActions {
  setMonsterList(vm: OwnedMonsterListViewModel | null): void;
  setMonsterDetail(vm: OwnedMonsterDetailViewModel | null): void;
  setPartyEdit(vm: PartyEditViewModel | null): void;
  setSelectedSupportIds(ids: string[]): void;
  setIsSaving(v: boolean): void;
  setSaveError(msg: string | null): void;
  openConfirmDialog(state: ConfirmDialogState): void;
  closeConfirmDialog(): void;
  openErrorDialog(title: string, message: string): void;
  closeErrorDialog(): void;
  clearMonsterCache(): void;
}

export const useMonsterStore = create<MonsterUiState & MonsterUiActions>((set) => ({
  monsterList:        null,
  monsterDetail:      null,
  partyEdit:          null,
  selectedSupportIds: [],
  isSaving:           false,
  saveError:          null,
  confirmDialog:      null,
  errorDialog:        null,

  setMonsterList:        (vm)    => set({ monsterList: vm }),
  setMonsterDetail:      (vm)    => set({ monsterDetail: vm }),
  setPartyEdit:          (vm)    => set({ partyEdit: vm }),
  setSelectedSupportIds: (ids)   => set({ selectedSupportIds: ids }),
  setIsSaving:           (v)     => set({ isSaving: v }),
  setSaveError:          (msg)   => set({ saveError: msg }),
  openConfirmDialog:     (state) => set({ confirmDialog: state }),
  closeConfirmDialog:    ()      => set({ confirmDialog: null }),
  openErrorDialog:       (title, message) => set({ errorDialog: { title, message } }),
  closeErrorDialog:      ()      => set({ errorDialog: null }),
  clearMonsterCache:     ()      => set({ monsterList: null, monsterDetail: null, partyEdit: null }),
}));
