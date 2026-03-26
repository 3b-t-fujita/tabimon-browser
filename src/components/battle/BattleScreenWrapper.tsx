'use client';

/**
 * バトル画面の正式エントリ。
 * 正式版は PatternB を使用する。
 * PatternA は旧案としてファイルを保持するが、この導線では使用しない。
 */
import type { BattleScreenProps } from './BattleScreenPatternA';
import { BattleScreenPatternB } from './BattleScreenPatternB';

export function BattleScreenWrapper(props: BattleScreenProps) {
  return <BattleScreenPatternB {...props} />;
}
