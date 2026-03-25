'use client';

/**
 * 相棒スキルボタンコンポーネント。
 * プレイヤーが操作できる相棒のスキル一覧を表示する。
 * クールダウン中は無効化する。
 */
import type { BattleSkillState } from '@/domain/battle/BattleActor';

interface MainSkillButtonProps {
  skills:   BattleSkillState[];
  disabled: boolean;
  onSelect: (skillId: string) => void;
}

export default function MainSkillButton({ skills, disabled, onSelect }: MainSkillButtonProps) {
  if (skills.length === 0) {
    return (
      <div className="text-gray-500 text-sm text-center p-2">
        使用可能なスキルがありません
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => {
        const onCooldown = skill.cooldownRemaining > 0;
        const isDisabled = disabled || onCooldown;

        return (
          <button
            key={skill.skillId}
            onClick={() => !isDisabled && onSelect(skill.skillId)}
            disabled={isDisabled}
            className={[
              'px-3 py-2 rounded text-sm font-medium border transition-colors',
              isDisabled
                ? 'border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'border-blue-500 bg-blue-800 text-white hover:bg-blue-700 active:bg-blue-900',
            ].join(' ')}
          >
            <div>{skill.displayName}</div>
            {onCooldown && (
              <div className="text-xs text-gray-400 mt-0.5">
                CT: {skill.cooldownRemaining.toFixed(1)}s
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
