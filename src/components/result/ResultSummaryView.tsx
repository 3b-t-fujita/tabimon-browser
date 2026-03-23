'use client';

/**
 * リザルト概要表示コンポーネント。
 * 結果種別・獲得経験値・レベルアップ・ステージ解放を表示する。
 */
import { AdventureResultType } from '@/common/constants/enums';

interface ResultSummaryViewProps {
  resultType:    AdventureResultType;
  stageId:       string;
  expGained:     number;
  newLevel:      number;
  leveledUp:     boolean;
  stageUnlocked: boolean;
}

const RESULT_CONFIG: Record<AdventureResultType, { label: string; icon: string; color: string }> = {
  [AdventureResultType.Success]: { label: '冒険成功！',  icon: '🎉', color: 'text-emerald-600' },
  [AdventureResultType.Failure]: { label: '冒険失敗...',  icon: '💀', color: 'text-red-500' },
  [AdventureResultType.Retire]:  { label: 'リタイア',    icon: '🏳️', color: 'text-gray-500' },
};

export default function ResultSummaryView({
  resultType, stageId, expGained, newLevel, leveledUp, stageUnlocked,
}: ResultSummaryViewProps) {
  const cfg = RESULT_CONFIG[resultType];

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-stone-200 bg-white">
      {/* 結果見出し */}
      <div className="flex items-center gap-2">
        <span className="text-3xl">{cfg.icon}</span>
        <span className={`text-xl font-bold ${cfg.color}`}>{cfg.label}</span>
      </div>

      <div className="text-xs text-stone-400">ステージ: {stageId}</div>

      {/* 経験値 */}
      <div className="flex justify-between items-center text-sm border-t border-stone-100 pt-2">
        <span className="text-stone-600">獲得経験値</span>
        <span className="font-bold text-yellow-600">+{expGained} EXP</span>
      </div>

      {/* レベルアップ */}
      {leveledUp && (
        <div className="flex items-center gap-2 bg-yellow-50 rounded p-2 text-sm">
          <span>⬆️</span>
          <span className="font-bold text-yellow-700">Lv. {newLevel} にレベルアップ！</span>
        </div>
      )}

      {/* ステージ解放 */}
      {stageUnlocked && (
        <div className="flex items-center gap-2 bg-blue-50 rounded p-2 text-sm">
          <span>🔓</span>
          <span className="font-bold text-blue-700">新ステージが解放されました！</span>
        </div>
      )}
    </div>
  );
}
