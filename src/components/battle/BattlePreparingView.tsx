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
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-[32px] bg-white p-8 text-center shadow-sm">
      <div className="rounded-full bg-[#fff1ec] p-5 text-4xl">
        {isBoss ? '🔥' : '⚔️'}
      </div>
      <div className="text-2xl font-bold animate-pulse text-[#2c302b]">
        {isBoss ? '⚔️ ボス戦！' : '⚔️ 戦闘開始準備中...'}
      </div>
      <div className="text-sm text-[#595c57]">しばらくお待ちください</div>
    </div>
  );
}
