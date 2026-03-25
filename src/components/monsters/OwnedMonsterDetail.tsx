/**
 * 仲間詳細 component。
 * 基本情報表示 + 相棒設定ボタン + 手放しボタン。
 */
'use client';

import Image from 'next/image';
import type { OwnedMonsterDetailViewModel } from '@/application/viewModels/ownedMonsterDetailViewModel';
import { getMonsterStandUrl } from '@/infrastructure/assets/monsterImageService';

interface Props {
  vm:              OwnedMonsterDetailViewModel;
  onSetMain:       () => void;
  onRelease:       () => void;
  onBack:          () => void;
  onQrGenerate:    () => void;
  isSaving:        boolean;
}

export function OwnedMonsterDetail({ vm, onSetMain, onRelease, onBack, onQrGenerate, isSaving }: Props) {
  const standUrl = getMonsterStandUrl(vm.monsterMasterId);
  return (
    <div className="flex flex-1 flex-col">
      {/* ヘッダー */}
      <header className="bg-emerald-500 px-5 py-4">
        <button type="button" onClick={onBack} className="mb-1 text-sm text-emerald-100">
          ← 戻る
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">{vm.displayName}</h1>
          {vm.isMain && (
            <span className="rounded-full bg-amber-300 px-2 py-0.5 text-xs font-bold text-amber-900">
              相棒
            </span>
          )}
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        {/* 立ち絵 */}
        <div className="flex justify-center">
          {standUrl ? (
            <Image src={standUrl} alt={vm.displayName} width={160} height={160} className="object-contain" />
          ) : (
            <div className="flex h-40 w-40 items-center justify-center text-6xl">🐾</div>
          )}
        </div>
        {/* 基本情報カード */}
        <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-stone-400">レベル</p>
              <p className="font-bold text-stone-800">Lv.{vm.level}</p>
            </div>
            <div>
              <p className="text-stone-400">経験値</p>
              <p className="font-bold text-stone-800">{vm.exp}</p>
            </div>
            <div>
              <p className="text-stone-400">ワールド</p>
              <p className="font-bold text-stone-800">{vm.worldLabel}</p>
            </div>
            <div>
              <p className="text-stone-400">ロール</p>
              <p className="font-bold text-stone-800">{vm.roleLabel}</p>
            </div>
            <div>
              <p className="text-stone-400">性格</p>
              <p className="font-bold text-stone-800">{vm.personalityLabel}</p>
            </div>
            <div>
              <p className="text-stone-400">種別ID</p>
              <p className="break-all font-mono text-xs text-stone-600">{vm.monsterMasterId}</p>
            </div>
          </div>
        </section>

        {/* ステータスカード */}
        <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-400">ステータス</p>
          <div className="flex flex-col gap-2">
            <StatRow label="HP"  value={vm.stats.hp}  max={300} color="bg-emerald-500" />
            <StatRow label="ATK" value={vm.stats.atk} max={100} color="bg-red-500"     />
            <StatRow label="DEF" value={vm.stats.def} max={100} color="bg-blue-500"    />
            <StatRow label="SPD" value={vm.stats.spd} max={50}  color="bg-yellow-500"  />
          </div>
        </section>

        {/* スキル */}
        <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">スキル</p>
          {vm.skillIds.length === 0 ? (
            <p className="text-sm text-stone-400">スキルなし</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {vm.skillIds.map((id) => (
                <li key={id} className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700">
                  {id}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* アクションボタン群 */}
      <div className="border-t border-stone-100 p-5 flex flex-col gap-3">
        {!vm.isMain && (
          <button
            type="button"
            onClick={onSetMain}
            disabled={isSaving}
            className="w-full rounded-xl bg-emerald-500 py-4 text-base font-bold text-white shadow transition hover:bg-emerald-600 disabled:bg-stone-200 disabled:text-stone-400 active:scale-95"
          >
            {isSaving ? '設定中...' : '相棒に設定する'}
          </button>
        )}
        <button
          type="button"
          onClick={onQrGenerate}
          disabled={isSaving}
          className="w-full rounded-xl bg-sky-500 py-3 text-sm font-bold text-white shadow transition hover:bg-sky-600 disabled:opacity-50 active:scale-95"
        >
          📤 QRコードを生成する
        </button>
        <button
          type="button"
          onClick={onRelease}
          disabled={isSaving || !vm.canRelease}
          className={`w-full rounded-xl border py-3 text-sm font-medium transition ${
            vm.canRelease
              ? 'border-red-200 text-red-500 hover:bg-red-50'
              : 'border-stone-200 text-stone-300'
          }`}
        >
          {vm.canRelease ? '手放す' : '手放し不可（相棒）'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatRow サブコンポーネント
// ---------------------------------------------------------------------------

function StatRow({
  label, value, max, color,
}: {
  label: string;
  value: number;
  max:   number;
  color: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-xs font-bold text-stone-500">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-stone-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-bold text-stone-700">{value}</span>
    </div>
  );
}
