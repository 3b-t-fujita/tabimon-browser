'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { HomeViewModel } from '@/application/viewModels/homeViewModel';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SoftCard } from '@/components/common/SoftCard';
import { getMonsterStandUrl } from '@/infrastructure/assets/monsterImageService';
import { MainMonsterGrowthSummaryCard } from './MainMonsterGrowthSummaryCard';

interface Props {
  vm: HomeViewModel;
  onContinue?: () => void;
  onBuddyTap?: () => void;
}

const QUICK_ACTIONS = [
  { icon: '🐾', label: 'なかま', sub: 'なかまを みる', path: '/monsters', tone: 'bg-[#ffffff]' },
  { icon: '🛡️', label: 'へんせい', sub: 'おたすけを えらぶ', path: '/party', tone: 'bg-[#ffffff]' },
  { icon: '📷', label: 'こうかん', sub: 'ともだちと こうかん', path: '/qr', tone: 'bg-[#eff2ea]' },
] as const;

const BOTTOM_NAV = [
  { icon: '🏠', label: 'ホーム', path: '/home', active: true },
  { icon: '🐾', label: 'なかま', path: '/monsters', active: false },
  { icon: '🗺️', label: 'ぼうけん', path: '/adventure/stages', active: false },
  { icon: '🛡️', label: 'へんせい', path: '/party', active: false },
  { icon: '📷', label: 'こうかん', path: '/qr', active: false },
] as const;

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'TB';
  return trimmed.slice(0, 2).toUpperCase();
}

export function HomeScreenPatternStitch({ vm, onContinue, onBuddyTap }: Props) {
  const router = useRouter();
  const mainStandUrl = getMonsterStandUrl(vm.mainMonsterMasterId);
  const buddyLabel = vm.mainMonsterName || 'あいぼう なし';
  const buddyLevel = vm.mainMonsterLevel !== null ? `Lv.${vm.mainMonsterLevel}` : 'Lv.--';
  const canOpenBuddyDetail = Boolean(vm.mainMonsterId);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f5f7f0] font-sans text-[#2c302b]">
      <header className="sticky top-0 z-30 border-b border-emerald-950/5 bg-white/70 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e6e9e1] text-xs font-black tracking-[0.2em] text-[#29664c] ring-2 ring-[#29664c]/10">
              {getInitials(vm.playerName)}
            </div>
            <div>
              <p className="text-[10px] font-black tracking-[0.18em] text-[#6c4324]/70">ぼうけんのきろく</p>
              <h1 className="text-[clamp(26px,7vw,30px)] font-black tracking-tight text-[#1f3528]">タビモン</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push('/party')}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#29664c] transition hover:bg-emerald-100/60 active:scale-95"
            aria-label="へんせいへ"
          >
            <span className="text-lg">⚙️</span>
          </button>
        </div>
      </header>

      <main className="flex-1 pb-32 pt-0">
        <section className="relative flex h-[530px] items-center justify-center overflow-hidden">
          <Image
            src="/assets/backgrounds/bg_home_main_v1.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(245,247,240,0.02) 0%, rgba(245,247,240,0.16) 48%, rgba(245,247,240,0.92) 86%, #f5f7f0 100%)',
            }}
          />

          <div className="relative z-10 flex h-full w-full flex-col items-center px-6 pt-14">
            <button type="button" onClick={onBuddyTap} className="relative mt-10 h-64 w-64">
              {mainStandUrl ? (
                <Image
                  src={mainStandUrl}
                  alt={vm.mainMonsterName || '相棒モンスター'}
                  fill
                  priority
                  sizes="256px"
                  className="object-contain"
                  style={{ filter: 'drop-shadow(0 20px 50px rgba(41, 102, 76, 0.28))' }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[120px] opacity-30">🐾</div>
              )}

              <div className="absolute -bottom-10 left-1/2 flex w-[min(78vw,272px)] max-w-[272px] -translate-x-1/2 flex-col items-center rounded-[28px] border border-white/50 bg-white/45 px-4 py-3 shadow-[0_18px_40px_rgba(41,102,76,0.12)] backdrop-blur-xl">
                <span className="text-[10px] font-black tracking-[0.14em] text-[#6c4324]/80">
                  相棒
                </span>
                <p className="mt-1 w-full truncate px-2 text-center text-[clamp(15px,4vw,19px)] font-black leading-tight tracking-tight text-[#2c302b]">
                  {buddyLabel}
                </p>
                <p className="mt-1 text-[13px] font-black tracking-tight text-[#29664c]">
                  {buddyLevel}
                </p>
              </div>
            </button>
          </div>
        </section>

        <div className="-mt-1 px-6">
          <div className="mb-4">
            <MainMonsterGrowthSummaryCard
              monsterName={vm.mainMonsterName}
              level={vm.mainMonsterLevel}
              expProgressRatio={vm.mainMonsterExpProgressRatio}
              expToNextLevel={vm.mainMonsterExpToNextLevel}
              bondRank={vm.mainMonsterBondRank}
              bondProgressRatio={vm.mainMonsterBondProgressRatio}
              bondToNextRank={vm.mainMonsterBondToNextRank}
              onOpenDetail={() => {
                if (canOpenBuddyDetail) {
                  router.push(`/monsters/${vm.mainMonsterId}`);
                }
              }}
            />
          </div>

          <PrimaryButton onClick={() => router.push('/adventure/stages')}>
            <span className="flex items-center justify-center gap-3 text-white">
              <span className="text-[28px]">🗺️</span>
              <span className="text-xl font-black tracking-[0.12em]">ぼうけんへ いく</span>
            </span>
          </PrimaryButton>

          <div className="mt-4 space-y-4">
            {vm.canContinue && (
              <button
                type="button"
                onClick={onContinue}
                className="flex w-full items-center justify-between rounded-[28px] border border-white/60 bg-white/45 px-5 py-4 text-left shadow-sm backdrop-blur-xl transition active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffc972] text-xl text-[#614100]">
                    {vm.continueType === 'PENDING_RESULT' ? '📋' : '▶'}
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#2c302b]">つづき</p>
                    <p className="mt-1 text-xs text-[#595c57]">{vm.continueStageId ?? 'つづきが あるよ'}</p>
                  </div>
                </div>
                <span className="text-xl text-[#757872]">›</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-4">
              {QUICK_ACTIONS.slice(0, 2).map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => router.push(item.path)}
                  className={`${item.tone} group relative flex min-h-[162px] flex-col gap-4 overflow-hidden rounded-[28px] p-6 text-left shadow-sm transition hover:translate-y-[-1px] active:scale-[0.98]`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fac097]/30 text-2xl text-[#7d5231]">
                    <span>{item.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-[clamp(18px,4.8vw,20px)] font-black leading-tight tracking-tight text-[#2c302b]">{item.label}</h3>
                    <p className="mt-1 text-xs text-[#595c57]">{item.sub}</p>
                  </div>
                  <div className="pointer-events-none absolute -bottom-3 -right-3 opacity-10 transition-transform group-hover:rotate-0 group-hover:scale-105">
                    <span className="text-[86px]">{item.icon}</span>
                  </div>
                </button>
              ))}

              <button
                type="button"
                onClick={() => router.push(QUICK_ACTIONS[2].path)}
                className="col-span-2 flex items-center justify-between rounded-[28px] bg-[#eff2ea] px-6 py-5 text-left shadow-sm transition active:scale-[0.98]"
              >
                <div className="flex items-center gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[24px] bg-white text-[30px] text-[#2c302b] shadow-inner">
                    <span>{QUICK_ACTIONS[2].icon}</span>
                  </div>
                  <div>
                    <h3 className="text-[clamp(18px,4.8vw,20px)] font-black tracking-tight text-[#2c302b]">{QUICK_ACTIONS[2].label}</h3>
                    <p className="mt-1 text-sm text-[#595c57]">{QUICK_ACTIONS[2].sub}</p>
                  </div>
                </div>
                <span className="text-xl text-[#757872]">→</span>
              </button>
            </div>

            <SoftCard tone="muted" className="p-5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-[#595c57]">さいきん</h4>
                <button
                  type="button"
                  onClick={() => router.push('/monsters/gallery')}
                  className="text-xs font-black text-[#29664c]"
                >
                  ずかん
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-4 rounded-[22px] bg-white px-4 py-4">
                  <div className="h-2 w-2 rounded-full bg-[#29664c]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[clamp(13px,3.6vw,14px)] font-semibold leading-tight tracking-tight text-[#2c302b]">
                      {vm.mainMonsterName ? `${vm.mainMonsterName}と つぎへ いこう` : 'あいぼうを えらぼう'}
                    </p>
                    <p className="mt-1 text-[11px] text-[#757872]">
                      なかま {vm.ownedCount}/{vm.ownedCapacity} ・ おたすけ {vm.supportCount}/{vm.supportCapacity}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => router.push('/monsters')}
                    className="rounded-[22px] bg-white px-4 py-4 text-left"
                  >
                    <p className="text-[11px] font-black tracking-[0.12em] text-[#6c4324]/70">なかま</p>
                    <p className="mt-2 text-2xl font-black text-[#2c302b]">{vm.ownedCount}</p>
                    <p className="mt-1 text-xs text-[#595c57]">なかまの かず</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/party')}
                    className="rounded-[22px] bg-white px-4 py-4 text-left"
                  >
                    <p className="text-[11px] font-black tracking-[0.12em] text-[#6c4324]/70">おたすけ</p>
                    <p className="mt-2 text-2xl font-black text-[#2c302b]">{vm.supportCount}</p>
                    <p className="mt-1 text-xs text-[#595c57]">おたすけの かず</p>
                  </button>
                </div>
              </div>
            </SoftCard>
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 rounded-t-[3rem] bg-white/82 px-4 pb-4 pt-2 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] backdrop-blur-2xl">
        <div className="flex items-end justify-around">
          {BOTTOM_NAV.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center p-2 transition active:scale-90 ${
                item.active
                  ? 'mb-2 -translate-y-2 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-3 py-3 text-white shadow-lg shadow-emerald-200'
                  : 'text-zinc-400 hover:text-emerald-600'
              }`}
            >
              <span>{item.icon}</span>
              <span className="mt-1 text-[10px] font-semibold tracking-wide">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
