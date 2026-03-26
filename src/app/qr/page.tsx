'use client';

/**
 * QR 機能メニュー。
 * QR生成・QR読取への入口。
 */
import { GameLayout } from '@/components/common/GameLayout';
import { QrMenuPatternStitch } from '@/components/qr/QrMenuPatternStitch';

export default function QrMenuPage() {
  return (
    <GameLayout>
      <QrMenuPatternStitch />
    </GameLayout>
  );
}
