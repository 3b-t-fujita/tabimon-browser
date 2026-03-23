'use client';

/**
 * QrPayloadV1 の内容をプレビュー表示するコンポーネント。
 * QrGeneratePage で使用。
 */
import type { QrPayloadV1 } from '@/domain/entities/QrPayload';

interface QrPayloadPreviewProps {
  payload: QrPayloadV1;
}

export default function QrPayloadPreview({ payload }: QrPayloadPreviewProps) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm space-y-1">
      <div className="flex justify-between">
        <span className="text-stone-500">バージョン</span>
        <span className="font-mono text-xs text-stone-700">{payload.payloadVersion}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-stone-500">モンスター</span>
        <span className="font-medium">{payload.displayName}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-stone-500">Lv.</span>
        <span>{payload.level}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-stone-500">ワールド</span>
        <span className="text-xs text-stone-600">{payload.worldId}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-stone-500">ロール</span>
        <span className="text-xs text-stone-600">{payload.roleId}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-stone-500">性格</span>
        <span className="text-xs text-stone-600">{payload.personalityId}</span>
      </div>
      <div className="flex justify-between items-center border-t border-stone-100 pt-1 mt-1">
        <span className="text-stone-500">checksum</span>
        <span className="font-mono text-xs text-stone-400 truncate max-w-32">{payload.checksumHash.slice(0, 16)}…</span>
      </div>
    </div>
  );
}
