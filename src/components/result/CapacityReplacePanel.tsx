'use client';

/**
 * 仲間入替パネル。
 * 上限時に仲間一覧を表示し、手放す対象を選ばせる。
 * 相棒は選択不可。
 */
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';
import { SoftCard } from '@/components/common/SoftCard';
import { UiChip } from '@/components/common/UiChip';

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
    <SoftCard className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black tracking-[0.14em] text-[#6c4324]/70">手放す仲間</p>
        <UiChip background="#fff1ec" color="#b02500">上限 {owned.length}/{owned.length}</UiChip>
      </div>
      <p className="text-sm leading-6 text-[#595c57]">
        仲間が上限に達しています。
        手放す仲間を選んでください（相棒は選択できません）。
      </p>
      {releasable.length === 0 && (
        <p className="text-sm text-[#b02500]">手放せる仲間がいません（全員相棒に設定されています）。</p>
      )}
      {releasable.map((m) => (
        <button
          key={m.uniqueId as string}
          type="button"
          onClick={() => onSelect(m.uniqueId as string)}
          disabled={disabled}
          className="flex items-center justify-between rounded-[22px] border border-stone-200 bg-[#f5f7f0] p-4 text-sm transition hover:bg-[#fff1ec] hover:border-[#fac097] disabled:opacity-50"
        >
          <span className="font-medium text-[#2c302b]">{m.displayName}</span>
          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-[#595c57]">Lv.{m.level}</span>
        </button>
      ))}
    </SoftCard>
  );
}
