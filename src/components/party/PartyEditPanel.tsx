/**
 * 編成パネル component。
 * 主役表示 + 助っ人候補一覧 + 選択中助っ人表示。
 * 最大2体・重複不可の制御ロジックは UseCase に閉じており、
 * このコンポーネントは表示とイベント発火のみ担当する。
 */
'use client';

import type { PartyEditViewModel, PartySupportCandidateViewModel } from '@/application/viewModels/partyEditViewModel';
import { getMonsterIconUrl } from '@/infrastructure/assets/monsterImageService';

interface Props {
  vm:             PartyEditViewModel;
  onAddSupport:   (supportId: string) => void;
  onRemoveSupport:(supportId: string) => void;
  onBack:         () => void;
}

export function PartyEditPanel({ vm, onAddSupport, onRemoveSupport, onBack }: Props) {
  return (
    <div className="flex flex-1 flex-col">
      {/* ヘッダー */}
      <header className="bg-stone-700 px-5 py-4">
        <button type="button" onClick={onBack} className="mb-1 text-sm text-stone-300">
          ← 戻る
        </button>
        <h1 className="text-xl font-bold text-white">編成</h1>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        {/* 主役 */}
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">主役</p>
          {vm.main ? (
            <div className="flex items-center gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3">
              {(() => {
                const url = getMonsterIconUrl(vm.main.monsterMasterId);
                return url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={url} alt={vm.main.displayName} className="h-10 w-10 object-contain" />
                  : <span className="text-2xl">⭐</span>;
              })()}
              <div>
                <p className="font-bold text-stone-800">{vm.main.displayName}</p>
                <p className="text-sm text-stone-500">Lv.{vm.main.level} ／ {vm.main.roleLabel}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-stone-300 px-4 py-3 text-center text-sm text-stone-400">
              主役未設定（仲間一覧から設定してください）
            </div>
          )}
        </section>

        {/* 選択中助っ人スロット */}
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
            助っ人 ({vm.selectedSupports.length} / 2)
          </p>
          <div className="flex flex-col gap-2">
            {vm.selectedSupports.map((s) => (
              <div key={s.supportId} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3">
                {(() => {
                  const url = getMonsterIconUrl(s.monsterMasterId);
                  return url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={url} alt={s.displayName} className="h-10 w-10 object-contain" />
                    : <span className="text-xl">🤝</span>;
                })()}
                <div className="flex-1">
                  <p className="font-semibold text-stone-800">{s.displayName}</p>
                  <p className="text-sm text-stone-500">Lv.{s.level}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveSupport(s.supportId)}
                  className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-500 transition hover:bg-red-50"
                >
                  外す
                </button>
              </div>
            ))}
            {Array.from({ length: 2 - vm.selectedSupports.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="rounded-xl border border-dashed border-stone-200 px-4 py-3 text-center text-sm text-stone-300"
              >
                空きスロット
              </div>
            ))}
          </div>
        </section>

        {/* 助っ人候補一覧 */}
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">助っ人候補</p>
          {vm.supportCandidates.length === 0 ? (
            <p className="text-sm text-stone-400">助っ人がいません（QRで仲間を受け取ってください）</p>
          ) : (
            <ul className="flex flex-col gap-2">
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
        </section>
      </div>
    </div>
  );
}

// 候補行
function SupportCandidateRow({
  support,
  canAdd,
  onAdd,
}: {
  support: PartySupportCandidateViewModel;
  canAdd:  boolean;
  onAdd:   () => void;
}) {
  const selected = support.isSelected;
  const iconUrl = getMonsterIconUrl(support.monsterMasterId);
  return (
    <li className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${selected ? 'border-stone-200 bg-stone-50' : 'border-stone-200 bg-white'}`}>
      {selected ? (
        <span className="text-xl">✅</span>
      ) : iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={iconUrl} alt={support.displayName} className="h-10 w-10 object-contain" />
      ) : (
        <span className="text-xl">🐾</span>
      )}
      <div className="flex-1">
        <p className="font-semibold text-stone-800">{support.displayName}</p>
        <p className="text-sm text-stone-500">Lv.{support.level} ／ {support.roleLabel} ／ {support.worldLabel}</p>
      </div>
      {!selected && (
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            canAdd
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-stone-100 text-stone-400'
          }`}
        >
          追加
        </button>
      )}
    </li>
  );
}
