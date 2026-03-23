/**
 * 仲間一覧 component。
 * 仲間一覧を表示し、行タップで詳細へ遷移する。
 */
'use client';

import { useRouter } from 'next/navigation';
import type { OwnedMonsterListViewModel } from '@/application/viewModels/ownedMonsterListViewModel';
import { getMonsterIconUrl } from '@/infrastructure/assets/monsterImageService';

interface Props {
  vm: OwnedMonsterListViewModel;
}

export function OwnedMonsterList({ vm }: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col">
      {/* ヘッダー */}
      <header className="bg-emerald-500 px-5 py-4">
        <button type="button" onClick={() => router.back()} className="mb-1 text-sm text-emerald-100">
          ← 戻る
        </button>
        <h1 className="text-xl font-bold text-white">仲間一覧</h1>
        <p className="text-sm text-emerald-100">
          {vm.count} / {vm.capacity} 体
        </p>
      </header>

      {vm.monsters.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-stone-400">仲間がいません</p>
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-stone-100 overflow-y-auto">
          {vm.monsters.map((m) => (
            <li key={m.uniqueId}>
              <button
                type="button"
                onClick={() => router.push(`/monsters/${m.uniqueId}`)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-stone-50 active:bg-stone-100"
              >
                {/* モンスターアイコン */}
                {(() => {
                  const iconUrl = getMonsterIconUrl(m.monsterMasterId);
                  return iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={iconUrl} alt={m.displayName} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-200 text-xl">🐾</div>
                  );
                })()}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-800">{m.displayName}</span>
                    {m.isMain && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                        主役
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-sm text-stone-500">
                    Lv.{m.level} ／ {m.roleLabel} ／ {m.worldLabel}
                  </div>
                </div>
                <span className="text-stone-300">›</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
