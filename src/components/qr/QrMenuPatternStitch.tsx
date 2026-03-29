'use client';

import { useRouter } from 'next/navigation';
import { AppScreenHeader } from '@/components/common/AppScreenHeader';
import { SoftCard } from '@/components/common/SoftCard';
import { UiChip } from '@/components/common/UiChip';

const ACTIONS = [
  {
    icon: '📤',
    eyebrow: 'Share',
    title: 'コードを作る',
    description: 'コードを みせよう。',
    hint: 'みせて よんでもらう',
    path: '/qr/generate',
    shell: 'linear-gradient(135deg, #29664c 0%, #246147 100%)',
    pill: '#b9f9d6',
    pillText: '#0a4f36',
  },
  {
    icon: '📷',
    eyebrow: 'Receive',
    title: 'コードを読む',
    description: 'コードを よみこもう。',
    hint: 'がぞうを えらぶ',
    path: '/qr/scan',
    shell: 'linear-gradient(135deg, #7d5231 0%, #6c4324 100%)',
    pill: '#fac097',
    pillText: '#4a280a',
  },
] as const;

export function QrMenuPatternStitch() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col bg-[#f5f7f0] text-[#2c302b]">
      <AppScreenHeader
        onBack={() => router.back()}
        eyebrow="コードこうかん"
        title="コードこうかん"
        description="つくるか よむか えらぼう。"
      />

      <div className="flex flex-1 flex-col gap-5 px-5 pb-6 pt-5">
        <SoftCard className="overflow-hidden">
          <div className="bg-[linear-gradient(135deg,#ffffff_0%,#eff2ea_100%)] px-6 pb-6 pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black tracking-[0.14em] text-[#6c4324]/70">コードこうかん</p>
                <h2 className="mt-2 text-[26px] font-black leading-tight text-[#2c302b]">
                  かんたんに こうかん
                </h2>
                <p className="mt-3 max-w-[300px] text-sm leading-6 text-[#595c57]">
                  つくるか よむか えらぼう。
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
                🤝
              </div>
            </div>
          </div>
        </SoftCard>

        <div className="grid gap-4">
          {ACTIONS.map((action) => (
            <button
              key={action.path}
              type="button"
              onClick={() => router.push(action.path)}
              className="overflow-hidden rounded-[32px] bg-white text-left shadow-sm transition active:scale-[0.99]"
            >
              <div className="px-6 pb-5 pt-5 text-white" style={{ background: action.shell }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                      {action.title === 'コードを作る' ? 'わたす' : 'うけとる'}
                    </p>
                    <h3 className="mt-2 text-[clamp(24px,6vw,28px)] font-black leading-tight tracking-tight">{action.title}</h3>
                    <p className="mt-3 max-w-[280px] text-sm leading-6 text-white/80">
                      {action.description}
                    </p>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/14 text-3xl">
                    {action.icon}
                  </div>
                </div>
              </div>

              <div className="bg-[#f5f7f0] px-5 py-4">
                <div className="flex items-center justify-between gap-4 rounded-[24px] bg-white px-4 py-4">
                  <div>
                    <UiChip background={action.pill} color={action.pillText}>
                      {action.hint}
                    </UiChip>
                    <p className="mt-3 text-sm text-[#595c57]">
                      {action.title === 'コードを作る'
                        ? 'みせたい ときは こちら。'
                        : 'うけとる ときは こちら。'}
                    </p>
                  </div>
                  <div className="shrink-0 rounded-full bg-[#e6e9e1] px-4 py-2 text-xs font-black text-[#2c302b]">
                    いく
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <SoftCard tone="muted" className="p-5">
          <p className="text-[10px] font-black tracking-[0.16em] text-[#6c4324]/70">ヒント</p>
          <div className="mt-3 grid gap-3">
            <div className="rounded-[22px] bg-white px-4 py-4 text-sm text-[#595c57]">
              わたす なら <span className="font-black text-[#2c302b]">コードを作る</span>。
            </div>
            <div className="rounded-[22px] bg-white px-4 py-4 text-sm text-[#595c57]">
              うけとる なら <span className="font-black text-[#2c302b]">コードを読む</span>。
            </div>
          </div>
        </SoftCard>
      </div>
    </div>
  );
}
