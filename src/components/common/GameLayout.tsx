/**
 * 全画面共通レイアウト。
 * スマホ縦持ち前提の最大幅制約付きセンタリング。
 */
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function GameLayout({ children }: Props) {
  return (
    <div className="flex min-h-screen items-start justify-center bg-stone-100">
      <div className="flex min-h-screen w-full max-w-sm flex-col bg-white shadow-sm">
        {children}
      </div>
    </div>
  );
}
