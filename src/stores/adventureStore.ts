/**
 * 冒険選択〜開始確認 UI 状態 Zustand Store。
 * フェーズ5指示書 §5.2 / §6 推奨技術に準拠。
 *
 * 持ってよいもの: 画面表示用 ViewModel・選択中ステージ・開始中フラグ・エラー
 * 持ってはいけないもの: AdventureSession 永続実体・IndexedDB 直接操作
 */
import { create } from 'zustand';
import type { StageSelectViewModel } from '@/application/viewModels/stageSelectViewModel';
import type { AdventureConfirmViewModel } from '@/application/viewModels/adventureConfirmViewModel';

interface AdventureUiState {
  stageSelect:      StageSelectViewModel | null;
  selectedStageId:  string | null;
  adventureConfirm: AdventureConfirmViewModel | null;
  isStarting:       boolean;
  startError:       string | null;
}

interface AdventureUiActions {
  setStageSelect(vm: StageSelectViewModel | null): void;
  setSelectedStageId(id: string | null): void;
  setAdventureConfirm(vm: AdventureConfirmViewModel | null): void;
  setIsStarting(v: boolean): void;
  setStartError(msg: string | null): void;
  clearAdventureState(): void;
}

export const useAdventureStore = create<AdventureUiState & AdventureUiActions>((set) => ({
  stageSelect:      null,
  selectedStageId:  null,
  adventureConfirm: null,
  isStarting:       false,
  startError:       null,

  setStageSelect:      (vm)  => set({ stageSelect: vm }),
  setSelectedStageId:  (id)  => set({ selectedStageId: id }),
  setAdventureConfirm: (vm)  => set({ adventureConfirm: vm }),
  setIsStarting:       (v)   => set({ isStarting: v }),
  setStartError:       (msg) => set({ startError: msg }),
  clearAdventureState: ()    => set({
    stageSelect:      null,
    selectedStageId:  null,
    adventureConfirm: null,
    isStarting:       false,
    startError:       null,
  }),
}));
