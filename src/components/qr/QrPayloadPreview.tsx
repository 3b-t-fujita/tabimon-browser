'use client';

/**
 * QrPayloadV1 の内容をプレビュー表示するコンポーネント。
 */
import type { QrPayloadV1 } from '@/domain/entities/QrPayload';

const WORLD_LABEL: Record<string, string> = {
  WORLD_FOREST:  '🌿 ミドリの森',
  WORLD_VOLCANO: '🔥 ホノオ火山',
  WORLD_ICE:     '❄️ コオリ氷原',
};
const ROLE_LABEL: Record<string, string> = {
  ROLE_ATTACK:  '⚔️ アタック',
  ROLE_GUARD:   '🛡️ ガード',
  ROLE_SUPPORT: '💚 サポート',
};

interface QrPayloadPreviewProps {
  payload: QrPayloadV1;
}

export default function QrPayloadPreview({ payload }: QrPayloadPreviewProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      {/* ヘッダー帯 */}
      <div className="flex items-center gap-2 border-b border-stone-100 px-4 py-2.5 bg-stone-50">
        <span className="text-base">🐾</span>
        <span className="text-xs font-black uppercase tracking-widest text-stone-400">モンスター情報</span>
      </div>

      {/* メイン */}
      <div className="px-4 py-3.5 flex flex-col gap-2.5">
        {/* 名前 + レベル */}
        <div className="flex items-baseline gap-3">
          <span className="text-xl font-black text-stone-900">{payload.displayName}</span>
          <span className="text-sm font-bold text-stone-400">Lv.{payload.level}</span>
        </div>

        {/* バッジ行 */}
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-bold text-stone-600">
            {WORLD_LABEL[payload.worldId] ?? payload.worldId}
          </span>
          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-bold text-stone-600">
            {ROLE_LABEL[payload.roleId] ?? payload.roleId}
          </span>
          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-bold text-stone-600">
            {payload.personalityId}
          </span>
        </div>

        {/* チェックサム（サブ情報） */}
        <div className="flex items-center justify-between border-t border-stone-100 pt-2.5 mt-0.5">
          <span className="text-[10px] text-stone-400">checksum</span>
          <span className="font-mono text-[10px] text-stone-300">{payload.checksumHash.slice(0, 16)}…</span>
        </div>
      </div>
    </div>
  );
}
