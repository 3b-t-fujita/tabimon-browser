'use client';

/**
 * 戦闘準備中表示コンポーネント。
 * BATTLE_PREPARING フェーズ（initializeBattle 呼び出し中）に表示する。
 */

interface BattlePreparingViewProps {
  isBoss?: boolean;
}

export default function BattlePreparingView({ isBoss }: BattlePreparingViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 gap-4">
      <div className="text-2xl font-bold animate-pulse">
        {isBoss ? '⚔️ ボス戦！' : '⚔️ 戦闘開始準備中...'}
      </div>
      <div className="text-gray-400 text-sm">しばらくお待ちください</div>
    </div>
  );
}
