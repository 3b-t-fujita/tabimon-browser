'use client';

/**
 * 初期設定ページ。
 * InitialSetupForm を表示する。
 * IndexedDB を直接触らない（UseCase 経由）。
 */
import { Suspense } from 'react';
import { GameLayout } from '@/components/common/GameLayout';
import { InitialSetupForm } from '@/components/setup/InitialSetupForm';

export default function SetupPage() {
  return (
    <GameLayout>
      <Suspense fallback={null}>
        <InitialSetupForm />
      </Suspense>
    </GameLayout>
  );
}
