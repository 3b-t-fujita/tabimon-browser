/**
 * バトル画面 パターンA — 視認性重視型
 * 敵 / ログ / 味方 / スキルを4層に明確分離したクリアなレイアウト。
 * 状況を瞬時に把握でき、スキル操作を迷わず行えることを最優先とする。
 */
'use client';

import Image from 'next/image';
import type { BattleState } from '@/domain/battle/BattleState';
import type { BattleActor, BattleSkillState } from '@/domain/battle/BattleActor';
import { getMonsterStandUrl } from '@/infrastructure/assets/monsterImageService';

export interface BattleScreenProps {
  battleState: BattleState;
  isRunning:   boolean;
  onSkillSelect: (skillId: string) => void;
}

// ── ワールド属性 → アクセントカラー ──────────────────────────
const WORLD_ACCENT: Record<number, string> = {
  0: '#94a3b8',
  1: '#22c55e',   // Forest
  2: '#f97316',   // Fire
  3: '#38bdf8',   // Ice
};
const WORLD_BADGE: Record<number, { icon: string; label: string }> = {
  0: { icon: '⚪', label: '無' },
  1: { icon: '🌿', label: '森' },
  2: { icon: '🔥', label: '火' },
  3: { icon: '❄️', label: '氷' },
};

function accent(worldId: number): string { return WORLD_ACCENT[worldId] ?? '#94a3b8'; }

function hpColor(ratio: number): string {
  if (ratio > 0.5) return '#22c55e';
  if (ratio > 0.25) return '#eab308';
  return '#ef4444';
}

// ── ActorCard ────────────────────────────────────────────────
function ActorCard({ actor }: { actor: BattleActor }) {
  const ratio    = Math.max(0, actor.currentHp / actor.maxHp);
  const pct      = Math.round(ratio * 100);
  const dead     = actor.currentHp <= 0;
  const standUrl = getMonsterStandUrl(actor.monsterId ?? null);
  const ac       = accent(actor.worldId);
  const badge    = WORLD_BADGE[actor.worldId] ?? WORLD_BADGE[0];

  return (
    <div
      className={`relative flex flex-col items-center rounded-2xl px-1.5 pb-2 pt-3 transition-opacity ${dead ? 'opacity-30' : ''}`}
      style={{
        background:  '#1e293b',
        border:      actor.isMain ? `2px solid ${ac}` : '1px solid #334155',
        boxShadow:   actor.isMain ? `0 0 10px ${ac}40` : 'none',
        minWidth:    68,
      }}
    >
      {/* 相棒バッジ */}
      {actor.isMain && (
        <span
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 text-[9px] font-black text-white"
          style={{ background: ac, lineHeight: '16px' }}
        >
          相棒
        </span>
      )}

      {/* 立ち絵 */}
      <div className="relative mb-1" style={{ width: 52, height: 52 }}>
        {standUrl ? (
          <Image src={standUrl} alt={actor.displayName} fill className="object-contain" sizes="52px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">
            {actor.isEnemy ? '👾' : '🐾'}
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-900/75 text-xl">💀</div>
        )}
        {/* 属性バッジ */}
        <span
          className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[8px]"
          style={{ background: `${ac}25`, border: `1px solid ${ac}60` }}
        >
          {badge.icon}
        </span>
      </div>

      {/* 名前 */}
      <p className="mb-1 max-w-[70px] truncate text-center text-[9px] font-bold text-slate-200">
        {actor.displayName}
      </p>

      {/* HP バー */}
      <div className="w-full overflow-hidden rounded-full bg-slate-700" style={{ height: 4 }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: hpColor(ratio) }}
        />
      </div>
      <p className="mt-0.5 text-[8px] text-slate-500">
        {actor.currentHp}<span className="text-slate-700">/{actor.maxHp}</span>
      </p>

      {/* バフ・デバフ・シールド */}
      {(actor.buffTurnsRemaining > 0 || actor.shieldHitsRemaining > 0) && (
        <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">
          {actor.atkMultiplier > 1  && <span className="rounded bg-yellow-400/10 px-0.5 text-[8px] text-yellow-400">↑ATK</span>}
          {actor.defMultiplier > 1  && <span className="rounded bg-blue-400/10  px-0.5 text-[8px] text-blue-400">↑DEF</span>}
          {actor.atkMultiplier < 1  && <span className="rounded bg-red-400/10   px-0.5 text-[8px] text-red-400">↓ATK</span>}
          {actor.defMultiplier < 1  && <span className="rounded bg-orange-400/10 px-0.5 text-[8px] text-orange-400">↓DEF</span>}
          {actor.shieldHitsRemaining > 0 && (
            <span className="rounded bg-cyan-400/10 px-0.5 text-[8px] text-cyan-400">🛡{actor.shieldHitsRemaining}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── SkillButton ──────────────────────────────────────────────
function SkillButton({
  skill, disabled, isPending, ac, onSelect,
}: {
  skill: BattleSkillState;
  disabled: boolean;
  isPending: boolean;
  ac: string;
  onSelect: () => void;
}) {
  const onCD      = skill.cooldownRemaining > 0;
  const isOff     = disabled || onCD;
  const cdProg    = onCD ? (skill.cooldownSec - skill.cooldownRemaining) / skill.cooldownSec : 1;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isOff}
      className="relative w-full overflow-hidden rounded-2xl py-3.5 text-left transition active:scale-[0.98] disabled:cursor-not-allowed"
      style={{
        background:  isOff ? '#1e293b' : `linear-gradient(135deg, ${ac}2a, ${ac}0f)`,
        border:      `2px solid ${isOff ? '#334155' : ac}`,
        boxShadow:   (!isOff && !isPending) ? `0 4px 16px ${ac}30` : 'none',
      }}
    >
      {/* CD 回復バー */}
      {onCD && (
        <div
          className="absolute inset-y-0 left-0 rounded-2xl transition-all duration-300"
          style={{ width: `${cdProg * 100}%`, background: `${ac}18` }}
        />
      )}

      <div className="relative flex items-center gap-3 px-4">
        <span className="shrink-0 text-xl">
          {isPending ? '⏳' : onCD ? '⌛' : '⚡'}
        </span>
        <div className="flex-1">
          <p className="text-sm font-black" style={{ color: isOff ? '#64748b' : 'white' }}>
            {skill.displayName}
          </p>
          {onCD && (
            <p className="mt-0.5 text-[10px] text-slate-400">
              CT残り {skill.cooldownRemaining.toFixed(1)}秒
              <span className="ml-1 text-slate-600">({Math.round(cdProg * 100)}%回復)</span>
            </p>
          )}
          {isPending && <p className="mt-0.5 text-[10px] text-yellow-400">発動待機中...</p>}
          {!onCD && !isPending && <p className="mt-0.5 text-[10px]" style={{ color: ac }}>タップで発動</p>}
        </div>
        {!isOff && !isPending && (
          <span className="shrink-0 text-lg font-black" style={{ color: ac }}>→</span>
        )}
      </div>
    </button>
  );
}

// ── Pattern A メインコンポーネント ─────────────────────────────
export function BattleScreenPatternA({ battleState, isRunning, onSkillSelect }: BattleScreenProps) {
  const party      = battleState.actors.filter((a) => !a.isEnemy);
  const enemies    = battleState.actors.filter((a) =>  a.isEnemy);
  const mainActor  = party.find((a) => a.isMain);
  const ac         = accent(mainActor?.worldId ?? 0);
  const mainSkills = mainActor?.skills ?? [];
  const recentLog  = battleState.log.slice(-4);

  const headerBg = battleState.isBoss
    ? 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)'
    : 'linear-gradient(135deg, #0c4a6e 0%, #1e3a5f 100%)';

  return (
    <div className="flex flex-1 flex-col overflow-hidden" style={{ background: '#0f172a' }}>

      {/* ══ ① ヘッダー ══ */}
      <header className="shrink-0 flex items-center justify-between px-4 py-2.5" style={{ background: headerBg }}>
        <span className="text-sm font-black text-white">
          {battleState.isBoss ? '🔥 BOSS 戦！' : '⚔️ バトル中'}
        </span>
        <div className="flex items-center gap-2">
          {battleState.outcome !== 'NONE' && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-black ${
              battleState.outcome === 'WIN' ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white'
            }`}>
              {battleState.outcome === 'WIN' ? '🎉 勝利！' : '💀 敗北'}
            </span>
          )}
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
            tick {battleState.tickCount}
          </span>
        </div>
      </header>

      {/* ══ ② 敵ゾーン ══ */}
      <section
        className="shrink-0 px-3 py-3"
        style={{ borderBottom: '1px solid #1e3a5f' }}
      >
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-red-400/50">Enemy</p>
        <div className="flex justify-center gap-2 flex-wrap">
          {enemies.map((e) => <ActorCard key={e.id} actor={e} />)}
        </div>
      </section>

      {/* ══ ③ 戦闘ログ（4行コンパクト） ══ */}
      <section
        className="shrink-0 px-4 py-2"
        style={{ background: '#090f1e', borderBottom: '1px solid #1e3a5f', minHeight: 64 }}
      >
        {recentLog.length === 0 ? (
          <p className="py-2 text-center text-xs text-slate-600">戦闘開始を待っています...</p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {recentLog.map((entry, i) => (
              <p
                key={`${entry.tick}-${i}`}
                className="text-[10px] leading-[18px]"
                style={{ opacity: 0.35 + (i / recentLog.length) * 0.65 }}
              >
                <span className="text-slate-600">[{entry.tick}]</span>
                {' '}
                <span className="font-semibold text-slate-200">{entry.actorName}</span>
                {' の '}
                <span className="text-yellow-300">{entry.action}</span>
                {entry.targetName && <> → <span className="text-slate-200">{entry.targetName}</span></>}
                {entry.value !== undefined && (
                  <span className="text-orange-400 ml-1">({entry.value})</span>
                )}
              </p>
            ))}
          </div>
        )}
      </section>

      {/* ══ ④ 味方ゾーン ══ */}
      <section className="shrink-0 px-3 pt-3 pb-2" style={{ borderBottom: '1px solid #1e3a5f' }}>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-blue-400/50">Ally</p>
        <div className="flex justify-center gap-2 flex-wrap">
          {party.map((a) => <ActorCard key={a.id} actor={a} />)}
        </div>
      </section>

      {/* ══ ⑤ スキルパネル ══ */}
      <section className="flex flex-1 flex-col justify-end gap-2 overflow-y-auto px-4 pb-4 pt-3">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${ac}90` }}>
          ★ 相棒スキル
        </p>
        {mainSkills.length === 0 ? (
          <p className="text-center text-xs text-slate-600">使用可能なスキルがありません</p>
        ) : (
          mainSkills.map((skill) => (
            <SkillButton
              key={skill.skillId}
              skill={skill}
              disabled={!isRunning}
              isPending={battleState.pendingMainSkillId === skill.skillId}
              ac={ac}
              onSelect={() => onSkillSelect(skill.skillId)}
            />
          ))
        )}
        <p className="text-center text-[9px] text-slate-700">助っ人・敵は自動行動（0.5秒/tick）</p>
      </section>

    </div>
  );
}
