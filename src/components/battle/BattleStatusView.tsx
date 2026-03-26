'use client';

/**
 * 戦闘ステータス表示コンポーネント。
 * パーティメンバー・敵の HP バーと名前を表示する。
 * キャラ画像は HP バーの上に表示する（画像がない場合は絵文字フォールバック）。
 */
import Image from 'next/image';
import type { BattleActor } from '@/domain/battle/BattleActor';
import { getMonsterStandUrl } from '@/infrastructure/assets/monsterImageService';

// ---------------------------------------------------------------------------
// ActorStatus コンポーネント
// ---------------------------------------------------------------------------

interface ActorStatusProps {
  actor: BattleActor;
}

function ActorStatus({ actor }: ActorStatusProps) {
  const hpRatio    = actor.currentHp / actor.maxHp;
  const hpPercent  = Math.max(0, Math.round(hpRatio * 100));
  const barColor   = hpRatio > 0.5 ? 'bg-green-500' : hpRatio > 0.25 ? 'bg-yellow-500' : 'bg-red-500';
  const isDead     = actor.currentHp <= 0;
  const imageUrl   = getMonsterStandUrl(actor.monsterId);

  return (
    <div className={`rounded-[20px] bg-white p-3 shadow-sm ${isDead ? 'opacity-40' : ''}`}>
      {/* キャラクター画像 */}
      <div className="flex justify-center mb-1 h-14">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={actor.displayName}
            width={56}
            height={56}
            className="object-contain"
          />
        ) : (
          <div className="h-14 w-14 flex items-center justify-center text-3xl select-none">
            {actor.isEnemy ? '👾' : '❓'}
          </div>
        )}
      </div>

      {/* 名前 + HP数値 */}
      <div className="flex justify-between items-center mb-1 text-sm">
        <span className="font-medium truncate max-w-[80px]">
          {actor.isMain ? '★ ' : ''}{actor.displayName}
        </span>
        <span className="text-xs text-[#757872]">
          {actor.currentHp}/{actor.maxHp}
        </span>
      </div>

      {/* HP バー */}
      <div className="h-2 overflow-hidden rounded-full bg-[#e6e9e1]">
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${hpPercent}%` }}
        />
      </div>

      {/* バフ/デバフ表示 */}
      {actor.buffTurnsRemaining > 0 && (
        <div className="mt-1 text-xs text-[#7d5231]">
          {actor.atkMultiplier > 1 ? '↑ATK' : actor.defMultiplier > 1 ? '↑DEF' : actor.atkMultiplier < 1 ? '↓ATK' : '↓DEF'}
          {` (${actor.buffTurnsRemaining})`}
        </div>
      )}
    </div>
  );
}

interface BattleStatusViewProps {
  actors: BattleActor[];
}

export default function BattleStatusView({ actors }: BattleStatusViewProps) {
  const party   = actors.filter((a) => !a.isEnemy);
  const enemies = actors.filter((a) =>  a.isEnemy);

  return (
    <div className="grid grid-cols-2 gap-4 rounded-[28px] bg-[#f5f7f0] p-4">
      {/* パーティ */}
      <div>
        <div className="mb-2 text-xs font-bold text-[#29664c]">味方</div>
        <div className="flex flex-col gap-2">
          {party.map((a) => <ActorStatus key={a.id} actor={a} />)}
        </div>
      </div>

      {/* 敵 */}
      <div>
        <div className="mb-2 text-xs font-bold text-[#b02500]">敵</div>
        <div className="flex flex-col gap-2">
          {enemies.map((a) => <ActorStatus key={a.id} actor={a} />)}
        </div>
      </div>
    </div>
  );
}
