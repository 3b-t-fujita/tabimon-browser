'use client';

import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  tone?: 'white' | 'soft' | 'muted';
}

const TONE_CLASS: Record<NonNullable<Props['tone']>, string> = {
  white: 'bg-white shadow-sm',
  soft: 'bg-[#f5f7f0] shadow-sm',
  muted: 'bg-[#e6e9e1] shadow-sm',
};

export function SoftCard({ children, className = '', tone = 'white' }: Props) {
  return (
    <section className={`rounded-[28px] ${TONE_CLASS[tone]} ${className}`.trim()}>
      {children}
    </section>
  );
}
