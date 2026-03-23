/**
 * アプリ UI 状態 Zustand Store。
 * 詳細設計 v4 / フェーズ3 指示書 §15 に準拠。
 *
 * 持ってよいもの:
 *   - isBooting / currentRouteState / isRecoveryPromptOpen / lastUiError
 *
 * 持ってはいけないもの:
 *   - IndexedDB 直接操作
 *   - 保存トランザクション本体
 *   - AdventureSession 永続実体
 *   - SaveTransactionService 実体
 */
import { create } from 'zustand';
import type { BootViewModel } from '@/application/viewModels/bootViewModel';
import type { HomeViewModel } from '@/application/viewModels/homeViewModel';

/** 現在のルート状態 */
export const RouteState = {
  Booting:       'BOOTING',
  InitialSetup:  'INITIAL_SETUP',
  Home:          'HOME',
  RecoveryPrompt:'RECOVERY_PROMPT',
  LoadFailed:    'LOAD_FAILED',
} as const;
export type RouteState = (typeof RouteState)[keyof typeof RouteState];

interface AppUiState {
  /** 起動中フラグ */
  isBooting:             boolean;
  /** 現在のルート */
  currentRouteState:     RouteState;
  /** 復旧プロンプト表示中 */
  isRecoveryPromptOpen:  boolean;
  /** 最後の UI エラー */
  lastUiError:           string | null;

  /** Boot 結果 ViewModel（遷移判断用） */
  bootViewModel:         BootViewModel | null;
  /** Home 表示用 ViewModel（UI 一時キャッシュ） */
  homeViewModel:         HomeViewModel | null;
}

interface AppUiActions {
  setBooting(v: boolean): void;
  setRouteState(r: RouteState): void;
  setRecoveryPromptOpen(v: boolean): void;
  setLastUiError(msg: string | null): void;
  setBootViewModel(vm: BootViewModel | null): void;
  setHomeViewModel(vm: HomeViewModel | null): void;
}

export const useAppUiStore = create<AppUiState & AppUiActions>((set) => ({
  // --- 初期状態 ---
  isBooting:             true,
  currentRouteState:     RouteState.Booting,
  isRecoveryPromptOpen:  false,
  lastUiError:           null,
  bootViewModel:         null,
  homeViewModel:         null,

  // --- アクション ---
  setBooting:            (v)   => set({ isBooting: v }),
  setRouteState:         (r)   => set({ currentRouteState: r }),
  setRecoveryPromptOpen: (v)   => set({ isRecoveryPromptOpen: v }),
  setLastUiError:        (msg) => set({ lastUiError: msg }),
  setBootViewModel:      (vm)  => set({ bootViewModel: vm }),
  setHomeViewModel:      (vm)  => set({ homeViewModel: vm }),
}));
