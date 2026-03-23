/**
 * QR UI 状態 Zustand Store。
 * フェーズ9指示書 §5.2, §5.3 に準拠。
 *
 * QrPhase:
 *   QR_IDLE          → 初期状態
 *   QR_SCANNING      → 画像読取中
 *   QR_DECODE_TEXT   → 文字列復号中
 *   QR_PARSE_JSON    → JSON解析中
 *   QR_VALIDATE_VERSION   → version確認中
 *   QR_VALIDATE_CHECKSUM  → checksum確認中
 *   QR_VALIDATE_DUPLICATE → 重複確認中
 *   QR_RECEIVE_CONFIRM    → 受取確認待ち（仲間 / 助っ人 / 見送り選択）
 *   QR_SAVING        → 保存中
 *   QR_COMPLETED     → 完了
 *   QR_ERROR         → エラー
 */
import { create } from 'zustand';
import type { QrPayloadV1 } from '@/domain/entities/QrPayload';

export type QrPhase =
  | 'QR_IDLE'
  | 'QR_SCANNING'
  | 'QR_DECODE_TEXT'
  | 'QR_PARSE_JSON'
  | 'QR_VALIDATE_VERSION'
  | 'QR_VALIDATE_CHECKSUM'
  | 'QR_VALIDATE_DUPLICATE'
  | 'QR_RECEIVE_CONFIRM'
  | 'QR_SAVING'
  | 'QR_COMPLETED'
  | 'QR_ERROR';

interface QrStoreState {
  phase:          QrPhase;
  parsedPayload:  QrPayloadV1 | null;
  errorMessage:   string | null;
  completedMsg:   string | null;
  showSkipConfirm: boolean;
}

interface QrStoreActions {
  setPhase(p: QrPhase): void;
  setParsedPayload(payload: QrPayloadV1 | null): void;
  setError(msg: string): void;
  setCompleted(msg: string): void;
  openSkipConfirm(): void;
  closeSkipConfirm(): void;
  reset(): void;
}

const INITIAL: QrStoreState = {
  phase:          'QR_IDLE',
  parsedPayload:  null,
  errorMessage:   null,
  completedMsg:   null,
  showSkipConfirm: false,
};

export const useQrStore = create<QrStoreState & QrStoreActions>((set) => ({
  ...INITIAL,

  setPhase:        (p)       => set({ phase: p }),
  setParsedPayload:(payload) => set({ parsedPayload: payload }),
  setError:        (msg)     => set({ errorMessage: msg, phase: 'QR_ERROR' }),
  setCompleted:    (msg)     => set({ completedMsg: msg, phase: 'QR_COMPLETED' }),
  openSkipConfirm: ()        => set({ showSkipConfirm: true }),
  closeSkipConfirm:()        => set({ showSkipConfirm: false }),
  reset:           ()        => set(INITIAL),
}));
