'use client';

/**
 * 仲間詳細画面の正式エントリ。
 * 正式版は Stitch ベース実装を使用する。
 * 旧 PatternA / PatternB は復帰用に残すが、このラッパーからは切り離している。
 */
import type { OwnedMonsterDetailViewModel } from '@/application/viewModels/ownedMonsterDetailViewModel';
import { OwnedMonsterDetailPatternStitch } from './OwnedMonsterDetailPatternStitch';

interface Props {
  vm: OwnedMonsterDetailViewModel;
  onSetMain: () => void;
  onRelease: () => void;
  onBack: () => void;
  onQrGenerate: () => void;
  isSaving: boolean;
}

export function OwnedMonsterDetailWrapper(props: Props) {
  return <OwnedMonsterDetailPatternStitch {...props} />;
}
