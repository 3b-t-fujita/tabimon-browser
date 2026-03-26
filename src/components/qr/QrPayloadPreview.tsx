'use client';

import type { QrPayloadV1 } from '@/domain/entities/QrPayload';
import { personalityLabel } from '@/application/shared/labelHelpers';
import { SoftCard } from '@/components/common/SoftCard';
import { UiChip } from '@/components/common/UiChip';

const WORLD_LABEL: Record<string, string> = {
  WORLD_FOREST: '🌿 ミドリの森',
  WORLD_VOLCANO: '🔥 ホノオ火山',
  WORLD_ICE: '❄️ コオリ氷原',
};

const ROLE_LABEL: Record<string, string> = {
  ROLE_ATTACK: '⚔️ アタック',
  ROLE_GUARD: '🛡️ ガード',
  ROLE_SUPPORT: '💚 サポート',
};

export default function QrPayloadPreview({ payload }: { payload: QrPayloadV1 }) {
  return (
    <SoftCard className="overflow-hidden">
      <div className="bg-[#eff2ea] px-5 py-4">
        <p className="text-[10px] font-black tracking-[0.14em] text-[#6c4324]/70">モンスターデータ</p>
        <p className="mt-2 text-2xl font-black text-[#2c302b]">{payload.displayName}</p>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="flex flex-wrap gap-2">
          <UiChip background="#b9f9d6" color="#0a4f36">
            {WORLD_LABEL[payload.worldId] ?? payload.worldId}
          </UiChip>
          <UiChip background="#e6e9e1" color="#595c57">
            {ROLE_LABEL[payload.roleId] ?? payload.roleId}
          </UiChip>
          <UiChip background="#fac097" color="#4a280a">
            {personalityLabel(payload.personalityId)}
          </UiChip>
          <UiChip background="#eef7f8" color="#1e4f57">
            Lv.{payload.level}
          </UiChip>
        </div>

        <div className="rounded-[22px] bg-[#f5f7f0] px-4 py-4">
          <p className="text-[10px] font-black tracking-[0.12em] text-[#6c4324]/70">確認コード</p>
          <p className="mt-2 break-all font-mono text-xs text-[#757872]">{payload.checksumHash}</p>
        </div>
      </div>
    </SoftCard>
  );
}
