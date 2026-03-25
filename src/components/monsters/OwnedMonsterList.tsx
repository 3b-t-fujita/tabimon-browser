/**
 * 仲間一覧 component。
 * 仲間カードをワールドカラーで色分けして一覧表示する。
 */
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { OwnedMonsterListViewModel } from '@/application/viewModels/ownedMonsterListViewModel';
import { getMonsterIconUrl } from '@/infrastructure/assets/monsterImageService';

// ── ワールドカラー ────────────────────────────────────────────
const WORLD_COLOR: Record<string, { accent: string; light: string; icon: string }> = {
  'ミドリの森': { accent: '#10b981', light: '#f0fdf4', icon: '🌿' },
  'ホノオ火山': { accent: '#f97316', light: '#fff7ed', icon: '🔥' },
  'コオリ氷原': { accent: '#38bdf8', light: '#f0f9ff', icon: '❄️' },
};
const DEFAULT_WORLD = { accent: '#6b7280', light: '#f9fafb', icon: '🌍' };

// ── ロールバッジ ─────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { icon: string; bg: string; text: string }> = {
  'アタック': { icon: '⚔️', bg: '#fee2e2', text: '#991b1b' },
  'ガード':   { icon: '🛡️', bg: '#dbeafe', text: '#1e40af' },
  'サポート': { icon: '💚', bg: '#dcfce7', text: '#166534' },
};

interface Props {
  vm: OwnedMonsterListViewModel;
}

export function OwnedMonsterList({ vm }: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col" style={{ background: '#f8fafc' }}>

      {/* ── ヘッダー ── */}
      <header className="shrink-0 border-b border-stone-200 bg-white px-4 py-3.5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1.5 text-sm font-semibold text-stone-600"
          >
            ← 戻る
          </button>
          <button
            type="button"
            onClick={() => router.push('/monsters/gallery')}
            className="rounded-full px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 bg-emerald-50"
          >
            📖 図鑑
          </button>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <h1 className="text-xl font-black text-stone-900">仲間一覧</h1>
          <span className="text-sm font-bold text-stone-400">
            {vm.count} <span className="text-stone-300">/</span> {vm.capacity}体
          </span>
        </div>
      </header>

      {/* ── リスト ── */}
      {vm.monsters.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
          <span className="text-5xl">🐾</span>
          <p className="text-sm font-bold text-stone-400">まだ仲間がいません</p>
          <p className="text-xs text-stone-300">冒険で仲間を増やしましょう！</p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
          {vm.monsters.map((m) => {
            const wConf   = WORLD_COLOR[m.worldLabel] ?? DEFAULT_WORLD;
            const rConf   = ROLE_CONFIG[m.roleLabel] ?? { icon: '❓', bg: '#f1f5f9', text: '#475569' };
            const iconUrl = getMonsterIconUrl(m.monsterMasterId);

            return (
              <li key={m.uniqueId}>
                <button
                  type="button"
                  onClick={() => router.push(`/monsters/${m.uniqueId}`)}
                  className="flex w-full items-center gap-3 rounded-2xl border bg-white px-3.5 py-3 text-left shadow-sm transition active:scale-95"
                  style={{ borderColor: `${wConf.accent}30` }}
                >
                  {/* アイコン */}
                  <div
                    className="shrink-0 flex items-center justify-center rounded-xl overflow-hidden"
                    style={{ width: 52, height: 52, background: wConf.light, border: `1.5px solid ${wConf.accent}30` }}
                  >
                    {iconUrl ? (
                      <Image src={iconUrl} alt={m.displayName} width={44} height={44} className="object-cover" />
                    ) : (
                      <span className="text-2xl">🐾</span>
                    )}
                  </div>

                  {/* テキスト */}
                  <div className="flex flex-1 min-w-0 flex-col gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-stone-900 truncate">{m.displayName}</span>
                      {m.isMain && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">
                          ★ 相棒
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: wConf.light, color: wConf.accent }}
                      >
                        {wConf.icon} {m.worldLabel}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: rConf.bg, color: rConf.text }}
                      >
                        {rConf.icon} {m.roleLabel}
                      </span>
                    </div>
                  </div>

                  {/* レベル + シェブロン */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className="text-xs font-black" style={{ color: wConf.accent }}>
                      Lv.{m.level}
                    </span>
                    <span className="text-stone-300 text-base">›</span>
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
