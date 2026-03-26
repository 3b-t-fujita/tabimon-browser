'use client';

import type { ReactNode } from 'react';

interface Props {
  backLabel?: string;
  onBack?: () => void;
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function AppScreenHeader({
  backLabel = '戻る',
  onBack,
  eyebrow,
  title,
  description,
  action,
}: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-emerald-950/5 bg-white/70 px-5 py-4 backdrop-blur-xl">
      {(onBack || action) && (
        <div className="flex items-center justify-between gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="rounded-full bg-[#e6e9e1] px-4 py-2 text-sm font-semibold text-[#29664c] transition active:scale-95"
            >
              ← {backLabel}
            </button>
          ) : (
            <div />
          )}
          {action}
        </div>
      )}

      <div className={onBack || action ? 'mt-4' : ''}>
        {eyebrow && (
          <p className="text-[10px] font-black tracking-[0.14em] text-[#6c4324]/70">
            {eyebrow}
          </p>
        )}
        {title && <h1 className="mt-1 text-[clamp(26px,7vw,30px)] font-black leading-tight tracking-tight text-[#1f3528]">{title}</h1>}
        {description && (
          <p className="mt-2 text-sm text-[#595c57]">{description}</p>
        )}
      </div>
    </header>
  );
}
