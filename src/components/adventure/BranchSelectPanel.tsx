/**
 * 分岐選択パネル。
 * BRANCH_SELECTING 状態で表示する。
 */
'use client';

import type { NodeBranchOption } from '@/domain/entities/NodePattern';

interface Props {
  options:   readonly NodeBranchOption[];
  onSelect:  (nextNodeIndex: number) => void;
  isSaving:  boolean;
}

const BRANCH_EMOJIS = ['⬅️', '➡️', '⬆️', '⬇️', '📍'];

export function BranchSelectPanel({ options, onSelect, isSaving }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-[28px] bg-white p-4 shadow-sm">
      <p className="text-center text-[11px] font-black uppercase tracking-widest text-[#6c4324]/70">
        道を選んでください
      </p>
      <div className="flex flex-col gap-2">
        {options.map((opt, i) => (
          <button
            key={opt.nextNodeIndex}
            type="button"
            onClick={() => onSelect(opt.nextNodeIndex)}
            disabled={isSaving}
            className="group relative w-full overflow-hidden rounded-[24px] border-2 py-4 text-sm font-black transition active:scale-95 disabled:opacity-50"
            style={{ borderColor: '#d8b4fe', color: '#6b21a8', background: '#f6efff' }}
          >
            {/* hover overlay */}
            <span
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              style={{ background: '#faf5ff' }}
            />
            {/* shine line */}
            <span
              className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-[24px] opacity-60"
              style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)' }}
            />
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span>{BRANCH_EMOJIS[i] ?? '📍'}</span>
              <span>{opt.label}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
