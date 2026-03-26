'use client';

import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  background?: string;
  color?: string;
}

export function UiChip({ children, className = '', background = '#e6e9e1', color = '#595c57' }: Props) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black ${className}`.trim()}
      style={{ background, color }}
    >
      {children}
    </span>
  );
}
