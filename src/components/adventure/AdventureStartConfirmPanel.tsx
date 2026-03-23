/**
 * 冒険開始確認パネル component。
 * 詳細設計 v4 §11 冒険開始確認画面の最低限仕様に準拠。
 *
 * - 選択ステージ / 現在主役 / 選択助っ人一覧 / 冒険開始ボタン / 戻る
 * - バリデーション NG なら開始ボタン押下時に理由を表示する
 */
'use client';

import type { AdventureConfirmViewModel } from '@/application/viewModels/adventureConfirmViewModel';

interface Props {
  vm:        AdventureConfirmViewModel;
  onStart:   () => void;
  onBack:    () => void;
  isStarting:boolean;
  startError:string | null;
}

export function AdventureStartConfirmPanel({ vm, onStart, onBack, isStarting, startError }: Props) {
  return (
    <div className="flex flex-1 flex-col">
      {/* ヘッダー */}
      <header className="bg-emerald-600 px-5 py-4">
        <button type="button" onClick={onBack} className="mb-1 text-sm text-emerald-100">
          ← 戻る
        </button>
        <h1 className="text-xl font-bold text-white">冒険確認</h1>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        {/* ステージ情報 */}
        <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">ステージ</p>
          <p className="text-lg font-bold text-stone-800">{vm.stageName}</p>
          <p className="text-sm text-stone-500">
            難易度: {vm.difficulty} ／ 推奨Lv.{vm.recommendedLevel}
          </p>
        </section>

        {/* 主役 */}
        <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">主役</p>
          {vm.main ? (
            <div className="flex items-center gap-2">
              <span className="text-xl">⭐</span>
              <div>
                <p className="font-bold text-stone-800">{vm.main.displayName}</p>
                <p className="text-sm text-stone-500">Lv.{vm.main.level}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-red-500">主役が設定されていません</p>
          )}
        </section>

        {/* 助っ人 */}
        <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">
            助っ人 ({vm.supports.length} / 2)
          </p>
          {vm.supports.length === 0 ? (
            <p className="text-sm text-stone-400">助っ人なし（0体でも開始できます）</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {vm.supports.map((s) => (
                <li key={s.supportId} className="flex items-center gap-2 text-sm text-stone-700">
                  <span>🤝</span>
                  <span className="font-medium">{s.displayName}</span>
                  <span className="text-stone-400">Lv.{s.level}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* バリデーション NG 理由 */}
        {!vm.canStart && vm.cannotStartReason && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-600">⚠️ {vm.cannotStartReason}</p>
          </div>
        )}

        {/* 開始失敗エラー */}
        {startError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-600">❌ {startError}</p>
          </div>
        )}
      </div>

      {/* フッター：開始ボタン */}
      <div className="border-t border-stone-100 p-5">
        <button
          type="button"
          onClick={onStart}
          disabled={isStarting || !vm.canStart}
          className={`w-full rounded-xl py-4 text-base font-bold shadow transition active:scale-95 ${
            vm.canStart && !isStarting
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-stone-200 text-stone-400'
          }`}
        >
          {isStarting ? '冒険を開始中...' : vm.canStart ? '🗺️ 冒険を開始する' : '開始できません'}
        </button>
      </div>
    </div>
  );
}
