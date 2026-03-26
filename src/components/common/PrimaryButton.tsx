'use client';

import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  background?: string;
  textColor?: string;
  type?: 'button' | 'submit';
}

export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  className = '',
  background = 'linear-gradient(135deg, #29664c 0%, #246147 100%)',
  textColor = '#ffffff',
  type = 'button',
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-full px-6 py-5 text-lg font-black shadow-[0_16px_36px_rgba(41,102,76,0.24)] transition active:scale-[0.98] disabled:opacity-50 ${className}`.trim()}
      style={{ background, color: textColor }}
    >
      {children}
    </button>
  );
}
