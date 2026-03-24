'use client';

/**
 * リザルト概要表示コンポーネント。
 * 結果種別・獲得経験値・レベルアップ・ステータス上昇・ステージ解放を表示する。
 */
import Image from 'next/image';
import { AdventureResultType } from '@/common/constants/enums';
import type { StatGains } from '@/application/result/finalizeAdventureResultUseCase';

interface ResultSummaryViewProps {
  resultType:    AdventureResultType;
  stageId:       string;
  expGained:     number;
  newLevel:      number;
  leveledUp:     boolean;
  stageUnlocked: boolean;
  statGains:     StatGains | null;
  evolved:       boolean;
  evolvedName:   string | null;
}

const RESULT_CONFIG: Record<AdventureResultType, { label: string; color: string; banner: string }> = {
  [AdventureResultType.Success]: { label: '冒険成功！', color: 'text-emerald-600', banner: '/assets/result/ui_result_banner_success_v1.webp' },
  [AdventureResultType.Failure]: { label: '冒険失敗...', color: 'text-red-500',     banner: '/assets/result/ui_result_banner_fail_v1.webp'    },
  [AdventureResultType.Retire]:  { label: 'リタイア',   color: 'text-gray-500',    banner: '/assets/result/ui_result_banner_retire_v1.webp'  },
};

export default function ResultSummaryView({
  resultType, stageId, expGained, newLevel, leveledUp, stageUnlocked, statGains, evolved, evolvedName,
}: ResultSummaryViewProps) {
  const cfg = RESULT_CONFIG[resultType];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white overflow-hidden">
      {/* リザルトバナー画像 */}
      <div className="relative w-full" style={{ height: 120 }}>
        <Image src={cfg.banner} alt={cfg.label} fill className="object-contain" sizes="100vw" />
      </div>

      <div className="flex flex-col gap-3 p-4">
      {/* 結果見出し */}
      <div className="flex items-center justify-center">
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
        <div className="flex flex-col gap-2 bg-yellow-50 rounded p-3 text-sm">
          <div className="flex items-center gap-2">
            <span>⬆️</span>
            <span className="font-bold text-yellow-700">Lv. {newLevel} にレベルアップ！</span>
          </div>
          {statGains && (
            <div className="grid grid-cols-4 gap-1 mt-1">
              {([
                { key: 'HP',  val: statGains.hp,  color: 'text-emerald-600' },
                { key: 'ATK', val: statGains.atk, color: 'text-red-600'     },
                { key: 'DEF', val: statGains.def, color: 'text-blue-600'    },
                { key: 'SPD', val: statGains.spd, color: 'text-yellow-600'  },
              ] as const).map(({ key, val, color }) => (
                <div key={key} className="flex flex-col items-center rounded bg-white py-1 px-0.5 border border-yellow-200">
                  <span className="text-xs text-stone-400">{key}</span>
                  <span className={`text-xs font-bold ${color}`}>+{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 進化 */}
      {evolved && evolvedName && (
        <div className="flex flex-col gap-1 bg-purple-50 rounded p-3 text-sm border border-purple-200">
          <div className="flex items-center gap-2">
            <span>✨</span>
            <span className="font-bold text-purple-700">進化！</span>
          </div>
          <p className="text-purple-600 text-xs font-medium">→ {evolvedName} に進化しました！</p>
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
    </div>
  );
}
