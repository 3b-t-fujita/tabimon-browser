'use client';

import Image from 'next/image';
import type { OwnedMonsterDetailViewModel } from '@/application/viewModels/ownedMonsterDetailViewModel';
import { AppScreenHeader } from '@/components/common/AppScreenHeader';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SoftCard } from '@/components/common/SoftCard';
import { UiChip } from '@/components/common/UiChip';
import { getMonsterStandUrl } from '@/infrastructure/assets/monsterImageService';

interface Props {
  vm: OwnedMonsterDetailViewModel;
  onSetMain: () => void;
  onRelease: () => void;
  onBack: () => void;
  onQrGenerate: () => void;
  isSaving: boolean;
}

const WORLD_THEME: Record<string, { shell: string; chip: string; accentText: string; panel: string }> = {
  'ミドリの森': { shell: 'linear-gradient(135deg, #29664c 0%, #246147 100%)', chip: '#b9f9d6', accentText: '#0a4f36', panel: '#eff2ea' },
  'ホノオ火山': { shell: 'linear-gradient(135deg, #7d5231 0%, #6c4324 100%)', chip: '#fac097', accentText: '#4a280a', panel: '#f6ebe3' },
  'コオリ氷原': { shell: 'linear-gradient(135deg, #4c7b83 0%, #2f6c77 100%)', chip: '#d6f0f3', accentText: '#1e4f57', panel: '#eef7f8' },
};

export function OwnedMonsterDetailPatternStitch({ vm, onSetMain, onRelease, onBack, onQrGenerate, isSaving }: Props) {
  const standUrl = getMonsterStandUrl(vm.monsterMasterId);
  const theme = WORLD_THEME[vm.worldLabel] ?? WORLD_THEME['ミドリの森'];

  return (
    <div className="flex flex-1 flex-col bg-[#f5f7f0] text-[#2c302b]">
      <AppScreenHeader onBack={onBack} title="" />

      <div className="flex flex-1 flex-col overflow-y-auto pb-6">
        <section className="px-5 pt-5">
          <div className="overflow-hidden rounded-[32px] shadow-sm">
            <div className="px-5 pb-5 pt-5 text-white" style={{ background: theme.shell }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/70">{vm.worldLabel}</p>
                  <h1 className="mt-2 text-[clamp(26px,7vw,30px)] font-black leading-tight tracking-tight">{vm.displayName}</h1>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-black">
                      Lv.{vm.level}
                    </span>
                    <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-black">
                      EXP {vm.exp}
                    </span>
                    {vm.isMain && (
                      <span className="rounded-full bg-[#ffc972] px-3 py-1 text-xs font-black text-[#482f00]">
                        ★ 相棒
                      </span>
                    )}
                  </div>
                </div>
                <div className="rounded-full bg-white/14 px-4 py-2 text-center">
                  <p className="text-[10px] font-black tracking-[0.12em] text-white/70">やくわり</p>
                  <p className="mt-1 text-sm font-black">{vm.roleLabel}</p>
                </div>
              </div>

              <div className="mt-5 flex items-end gap-4 rounded-[28px] bg-white/10 px-4 py-4 backdrop-blur-sm">
                <div className="relative h-44 w-40 shrink-0">
                  {standUrl ? (
                    <Image
                      src={standUrl}
                      alt={vm.displayName}
                      fill
                      sizes="160px"
                      className="object-contain object-bottom"
                      style={{ filter: 'drop-shadow(0 18px 28px rgba(0,0,0,0.28))' }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-7xl">🐾</div>
                  )}
                </div>
                <div className="min-w-0 flex-1 pb-2">
                  <UiChip background={theme.chip} color={theme.accentText}>
                    {vm.personalityLabel}
                  </UiChip>
                  <p className="mt-3 text-sm leading-6 text-white/82">
                    この子の成長や役割を見ながら、相棒設定やQR共有をすぐに行えます。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 flex flex-col gap-4 px-5">
          <SoftCard className="p-5" tone="soft" >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black tracking-[0.14em] text-[#6c4324]/70">つよさ</p>
              <UiChip background={theme.chip} color={theme.accentText}>
                育成確認
              </UiChip>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ['HP', vm.stats.hp],
                ['ATK', vm.stats.atk],
                ['DEF', vm.stats.def],
                ['SPD', vm.stats.spd],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[22px] bg-white px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6c4324]/70">{label}</p>
                  <p className="mt-2 text-2xl font-black text-[#2c302b]">{value}</p>
                </div>
              ))}
            </div>
          </SoftCard>

          <section className="rounded-[28px] bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#6c4324]/70">スキル</p>
            <div className="mt-4 flex flex-col gap-3">
              {vm.skills.map((skill) => (
                <div key={skill.skillId} className="rounded-[22px] bg-[#f5f7f0] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-black text-[#2c302b]">{skill.displayName}</p>
                    <span className="rounded-full bg-[#e6e9e1] px-3 py-1 text-[11px] font-black text-[#595c57]">
                      {skill.skillType}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-3">
            {!vm.isMain && (
              <PrimaryButton
                onClick={onSetMain}
                disabled={isSaving}
                className="py-4 text-sm"
                background={theme.shell}
              >
                {isSaving ? '設定中...' : '相棒に設定する'}
              </PrimaryButton>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onQrGenerate}
                disabled={isSaving}
                className="rounded-[24px] bg-white px-4 py-4 text-sm font-black text-[#2c302b] shadow-sm transition active:scale-[0.99]"
              >
                📤 コードを作る
              </button>
              <button
                type="button"
                onClick={onRelease}
                disabled={isSaving || !vm.canRelease}
                className="rounded-[24px] bg-[#fff1ec] px-4 py-4 text-sm font-black text-[#b02500] shadow-sm transition active:scale-[0.99] disabled:opacity-50"
              >
                {vm.canRelease ? '🗑️ 手放す' : '手放し不可'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
