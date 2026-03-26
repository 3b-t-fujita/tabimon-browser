'use client';

import Image from 'next/image';
import type { PartyEditViewModel, PartySupportCandidateViewModel } from '@/application/viewModels/partyEditViewModel';
import { AppScreenHeader } from '@/components/common/AppScreenHeader';
import { SoftCard } from '@/components/common/SoftCard';
import { UiChip } from '@/components/common/UiChip';
import { getMonsterIconUrl } from '@/infrastructure/assets/monsterImageService';

interface Props {
  vm: PartyEditViewModel;
  onAddSupport: (supportId: string) => void;
  onRemoveSupport: (supportId: string) => void;
  onBack: () => void;
}

export function PartyEditPanel({ vm, onAddSupport, onRemoveSupport, onBack }: Props) {
  return (
    <div className="flex flex-1 flex-col bg-[#f5f7f0] text-[#2c302b]">
      <AppScreenHeader
        onBack={onBack}
        eyebrow="へんせい"
        title="編成"
        description="相棒と助っ人を整えて、次の冒険に備えよう。"
      />

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
        <SoftCard tone="soft" className="p-5">
          <p className="text-[10px] font-black tracking-[0.14em] text-[#6c4324]/70">相棒</p>
          {vm.main ? (
            <div className="mt-4 flex items-center gap-4 rounded-[24px] bg-white px-4 py-4">
              {(() => {
                const url = getMonsterIconUrl(vm.main.monsterMasterId);
                return url
                  ? <Image src={url} alt={vm.main.displayName} width={52} height={52} className="object-contain" />
                  : <span className="text-3xl">⭐</span>;
              })()}
              <div>
                <p className="text-lg font-black text-[#2c302b]">{vm.main.displayName}</p>
                <p className="mt-1 text-sm text-[#595c57]">Lv.{vm.main.level} ・ {vm.main.roleLabel}</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-[24px] border border-dashed border-[#abaea8] bg-white px-4 py-4 text-sm text-[#757872]">
              相棒未設定です。仲間一覧から設定してください。
            </div>
          )}
        </SoftCard>

        <SoftCard className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#6c4324]/70">助っ人</p>
            <UiChip background="#eff2ea" color="#29664c">
              {vm.selectedSupports.length} / 2
            </UiChip>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {vm.selectedSupports.map((s) => (
              <div key={s.supportId} className="flex items-center gap-4 rounded-[24px] bg-[#f5f7f0] px-4 py-4">
                {(() => {
                  const url = getMonsterIconUrl(s.monsterMasterId);
                  return url
                    ? <Image src={url} alt={s.displayName} width={48} height={48} className="object-contain" />
                    : <span className="text-2xl">🤝</span>;
                })()}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-[#2c302b]">{s.displayName}</p>
                  <p className="mt-1 text-sm text-[#595c57]">Lv.{s.level}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveSupport(s.supportId)}
                  className="rounded-full bg-[#fff1ec] px-4 py-2 text-xs font-black text-[#b02500]"
                >
                  外す
                </button>
              </div>
            ))}

            {Array.from({ length: 2 - vm.selectedSupports.length }).map((_, i) => (
              <div key={`empty-${i}`} className="rounded-[24px] border border-dashed border-[#abaea8] px-4 py-4 text-sm text-[#757872]">
                空きスロット
              </div>
            ))}
          </div>
        </SoftCard>

        <SoftCard className="p-5">
          <p className="text-[10px] font-black tracking-[0.14em] text-[#6c4324]/70">助っ人候補</p>
          {vm.supportCandidates.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-[#757872]">助っ人がまだいません。コード交換で新しい仲間を受け取ると、ここに編成候補が並びます。</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {vm.supportCandidates.map((s) => (
                <SupportCandidateRow
                  key={s.supportId}
                  support={s}
                  canAdd={vm.canAddSupport}
                  onAdd={() => onAddSupport(s.supportId)}
                />
              ))}
            </ul>
          )}
        </SoftCard>
      </div>
    </div>
  );
}

function SupportCandidateRow({
  support,
  canAdd,
  onAdd,
}: {
  support: PartySupportCandidateViewModel;
  canAdd: boolean;
  onAdd: () => void;
}) {
  const iconUrl = getMonsterIconUrl(support.monsterMasterId);
  const selected = support.isSelected;

  return (
    <li className="flex items-center gap-4 rounded-[24px] bg-[#f5f7f0] px-4 py-4">
      {selected ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#b9f9d6] text-[#0a4f36]">✓</div>
      ) : iconUrl ? (
        <Image src={iconUrl} alt={support.displayName} width={48} height={48} className="object-contain" />
      ) : (
        <span className="text-2xl">🐾</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-black text-[#2c302b]">{support.displayName}</p>
        <p className="mt-1 text-sm text-[#595c57]">Lv.{support.level} ・ {support.roleLabel} ・ {support.worldLabel}</p>
      </div>
      {!selected && (
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          className={`rounded-full px-4 py-2 text-xs font-black ${
            canAdd ? 'bg-[#29664c] text-white' : 'bg-[#e6e9e1] text-[#757872]'
          }`}
        >
          追加
        </button>
      )}
    </li>
  );
}
