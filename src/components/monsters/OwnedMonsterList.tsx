'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { OwnedMonsterListViewModel } from '@/application/viewModels/ownedMonsterListViewModel';
import { getMonsterIconUrl } from '@/infrastructure/assets/monsterImageService';

const WORLD_COLOR: Record<string, { chip: string; text: string; icon: string; panel: string }> = {
  'ミドリの森': { chip: '#b9f9d6', text: '#0a4f36', icon: '🌿', panel: '#eff2ea' },
  'ホノオ火山': { chip: '#fac097', text: '#4a280a', icon: '🔥', panel: '#f6ebe3' },
  'コオリ氷原': { chip: '#d6f0f3', text: '#1e4f57', icon: '❄️', panel: '#eef7f8' },
};

export function OwnedMonsterList({ vm }: { vm: OwnedMonsterListViewModel }) {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col bg-[#f5f7f0] text-[#2c302b]">
      <header className="sticky top-0 z-20 border-b border-emerald-950/5 bg-white/70 px-5 py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full bg-[#e6e9e1] px-4 py-2 text-sm font-semibold text-[#29664c]"
          >
            ← 戻る
          </button>
          <button
            type="button"
            onClick={() => router.push('/monsters/gallery')}
            className="rounded-full bg-[#eff2ea] px-4 py-2 text-xs font-black text-[#29664c]"
          >
            図鑑
          </button>
        </div>
        <div className="mt-4">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#6c4324]/70">Buddy Collection</p>
          <h1 className="mt-1 text-[30px] font-black leading-tight text-[#1f3528]">仲間一覧</h1>
          <p className="mt-2 text-sm text-[#595c57]">{vm.count} / {vm.capacity}体の仲間が集まっています。</p>
        </div>
      </header>

      {vm.monsters.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
          <span className="text-6xl">🐾</span>
          <p className="text-base font-black text-[#595c57]">まだ仲間がいません</p>
          <p className="text-sm text-[#757872]">冒険に出て、新しい出会いを増やしましょう。</p>
        </div>
      ) : (
        <ul className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
          {vm.monsters.map((m) => {
            const tone = WORLD_COLOR[m.worldLabel] ?? WORLD_COLOR['ミドリの森'];
            const iconUrl = getMonsterIconUrl(m.monsterMasterId);

            return (
              <li key={m.uniqueId}>
                <button
                  type="button"
                  onClick={() => router.push(`/monsters/${m.uniqueId}`)}
                  className="w-full overflow-hidden rounded-[28px] bg-white text-left shadow-sm transition active:scale-[0.99]"
                >
                  <div className="flex items-center gap-4 px-5 py-5" style={{ background: tone.panel }}>
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-white shadow-sm">
                      {iconUrl ? (
                        <Image src={iconUrl} alt={m.displayName} width={52} height={52} className="object-contain" />
                      ) : (
                        <span className="text-3xl">🐾</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-lg font-black text-[#2c302b]">{m.displayName}</p>
                        {m.isMain && (
                          <span className="rounded-full bg-[#ffc972] px-3 py-1 text-[11px] font-black text-[#482f00]">
                            ★ 相棒
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full px-3 py-1 text-[11px] font-black" style={{ background: tone.chip, color: tone.text }}>
                          {tone.icon} {m.worldLabel}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-[#595c57]">
                          {m.roleLabel}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-[#595c57]">
                          Lv.{m.level}
                        </span>
                      </div>
                    </div>

                    <span className="text-xl text-[#757872]">›</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
