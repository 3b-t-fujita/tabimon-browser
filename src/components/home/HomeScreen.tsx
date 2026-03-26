'use client';

/**
 * ホーム画面の正式エントリ。
 * 現在の正式版デザインは Stitch ベース実装を使用する。
 * 旧 PatternA / PatternB は比較・復帰用にファイルを残しているが、この導線では使わない。
 */
import type { HomeViewModel } from '@/application/viewModels/homeViewModel';
import { HomeScreenPatternStitch } from './HomeScreenPatternStitch';

interface Props {
  vm: HomeViewModel;
  onContinue?: () => void;
}

export function HomeScreen({ vm, onContinue }: Props) {
  return <HomeScreenPatternStitch vm={vm} onContinue={onContinue} />;
}
