'use client';

/**
 * 仲間入替パネル。
 * 上限時に仲間一覧を表示し、手放す対象を選ばせる。
 * 主役は選択不可。
 */
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';

interface CapacityReplacePanelProps {
  owned:        OwnedMonster[];
  onSelect:     (uniqueId: string) => void;
  disabled:     boolean;
}

export default function CapacityReplacePanel({
  owned, onSelect, disabled,
}: CapacityReplacePanelProps) {
  const releasable = owned.filter((m) => !m.isMain);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-stone-600">
        仲間が上限（{owned.length}/{owned.length}）です。
        手放す仲間を選んでください（主役は選択できません）。
      </p>
      {releasable.length === 0 && (
        <p className="text-sm text-red-500">手放せる仲間がいません（全員主役に設定されています）。</p>
      )}
      {releasable.map((m) => (
        <button
          key={m.uniqueId as string}
          type="button"
          onClick={() => onSelect(m.uniqueId as string)}
          disabled={disabled}
          className="flex justify-between items-center rounded-lg border border-stone-200 bg-white p-3 text-sm hover:bg-red-50 hover:border-red-300 disabled:opacity-50 transition"
        >
          <span className="font-medium">{m.displayName}</span>
          <span className="text-stone-400">Lv.{m.level}</span>
        </button>
      ))}
    </div>
  );
}
