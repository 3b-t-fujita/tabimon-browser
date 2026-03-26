'use client';

import Image from 'next/image';
import type { BattleActor, BattleSkillState } from '@/domain/battle/BattleActor';
import { getMonsterStandUrl } from '@/infrastructure/assets/monsterImageService';
import type { BattleScreenProps } from './BattleScreenPatternA';

function getWorld(stageId: string): 'forest' | 'fire' | 'ice' {
  if (stageId.includes('_w1')) return 'forest';
  if (stageId.includes('_w2')) return 'fire';
  return 'ice';
}

const WORLD_THEME = {
  forest: {
    shell: '#e9efe6',
    accent: '#29664c',
    accentSoft: '#b9f9d6',
    accentText: '#0a4f36',
    panel: 'rgba(255,255,255,0.76)',
    panelStrong: 'rgba(255,255,255,0.88)',
    fog: 'linear-gradient(to bottom, rgba(233,239,230,0.22) 0%, rgba(233,239,230,0.12) 26%, rgba(233,239,230,0.62) 72%, rgba(233,239,230,0.92) 100%)',
    fieldGlow: 'radial-gradient(circle at 50% 78%, rgba(185,249,214,0.80), rgba(185,249,214,0.08) 60%, transparent 78%)',
    bgImage: '/assets/backgrounds/world_forest_bg_v1.webp',
    badge: '🌿 ミドリの森',
  },
  fire: {
    shell: '#f3ece3',
    accent: '#9f4b18',
    accentSoft: '#fac097',
    accentText: '#5d2d0d',
    panel: 'rgba(255,255,255,0.76)',
    panelStrong: 'rgba(255,255,255,0.88)',
    fog: 'linear-gradient(to bottom, rgba(243,236,227,0.20) 0%, rgba(243,236,227,0.10) 26%, rgba(243,236,227,0.60) 72%, rgba(243,236,227,0.92) 100%)',
    fieldGlow: 'radial-gradient(circle at 50% 78%, rgba(250,192,151,0.76), rgba(250,192,151,0.10) 60%, transparent 78%)',
    bgImage: '/assets/backgrounds/world_desert_bg_v1.webp',
    badge: '🔥 ホノオ火山',
  },
  ice: {
    shell: '#eaf2f4',
    accent: '#2f6c77',
    accentSoft: '#c9edf2',
    accentText: '#17434a',
    panel: 'rgba(255,255,255,0.76)',
    panelStrong: 'rgba(255,255,255,0.88)',
    fog: 'linear-gradient(to bottom, rgba(234,242,244,0.18) 0%, rgba(234,242,244,0.10) 26%, rgba(234,242,244,0.58) 72%, rgba(234,242,244,0.92) 100%)',
    fieldGlow: 'radial-gradient(circle at 50% 78%, rgba(201,237,242,0.76), rgba(201,237,242,0.10) 60%, transparent 78%)',
    bgImage: '/assets/backgrounds/world_snow_bg_v1.webp',
    badge: '❄️ コオリ氷原',
  },
} as const;

function hpColor(ratio: number): string {
  if (ratio > 0.5) return '#22c55e';
  if (ratio > 0.25) return '#eab308';
  return '#ef4444';
}

function actorScale(actor: BattleActor, isEnemy: boolean, isBossBattle: boolean): { size: number; y: string; x: string } {
  if (isEnemy) {
    return { size: isBossBattle ? 112 : 88, y: isBossBattle ? 'top-[16%]' : 'top-[20%]', x: '0%' };
  }
  if (actor.isMain) {
    return { size: 156, y: 'bottom-[16%]', x: '0%' };
  }
  return { size: 86, y: 'bottom-[18%]', x: '0%' };
}

function compactName(name: string): string {
  return name.length > 7 ? `${name.slice(0, 7)}…` : name;
}

function Figure({
  actor,
  isEnemy,
  align,
  accent,
  accentSoft,
  isBossBattle = false,
}: {
  actor: BattleActor;
  isEnemy: boolean;
  align: 'left' | 'center' | 'right';
  accent: string;
  accentSoft: string;
  isBossBattle?: boolean;
}) {
  const standUrl = getMonsterStandUrl(actor.monsterId ?? null);
  const ratio = Math.max(0, actor.currentHp / actor.maxHp);
  const dead = actor.currentHp <= 0;
  const scale = actorScale(actor, isEnemy, isBossBattle);
  const alignClass =
    align === 'left'
      ? isEnemy ? 'left-[11%]' : 'left-[4%]'
      : align === 'right'
        ? isEnemy ? 'right-[11%]' : 'right-[4%]'
        : isEnemy ? 'left-1/2 -translate-x-1/2' : 'left-1/2 -translate-x-1/2';

  return (
    <div className={`absolute ${scale.y} ${alignClass} flex flex-col items-center`}>
      {!isEnemy && actor.isMain && (
        <div
          className="absolute left-1/2 top-1/2 -z-10 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
          style={{ background: `${accentSoft}cc` }}
        />
      )}
      <div className="relative" style={{ width: scale.size, height: scale.size }}>
        {standUrl ? (
          <Image
            src={standUrl}
            alt={actor.displayName}
            fill
            className="object-contain"
            sizes={`${scale.size}px`}
            style={{
              filter: dead
                ? 'grayscale(1) brightness(0.76)'
                : actor.isMain
                  ? `drop-shadow(0 18px 34px rgba(0,0,0,0.24)) drop-shadow(0 0 18px ${accentSoft})`
                  : `drop-shadow(0 10px 22px rgba(0,0,0,0.20)) drop-shadow(0 2px 10px ${accentSoft})`,
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">
            {isEnemy ? '👾' : '🐾'}
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/55 text-3xl">💤</div>
        )}
      </div>

      <div
        className="mt-1 min-w-[82px] max-w-[118px] rounded-[20px] border px-2.5 py-2 shadow-sm backdrop-blur-md"
        style={{
          background: 'rgba(255,255,255,0.82)',
          borderColor: actor.isMain ? accent : isEnemy ? '#ead7cf' : accentSoft,
        }}
      >
        <div className="flex items-center justify-center gap-1">
          {!isEnemy && actor.isMain && (
            <span className="rounded-full px-1.5 py-0.5 text-[8px] font-black text-white" style={{ background: accent }}>
              相棒
            </span>
          )}
          <p className={`truncate text-center font-black text-[#2c302b] ${actor.isMain ? 'text-[12px]' : 'text-[11px]'}`}>{compactName(actor.displayName)}</p>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e6e9e1]">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.round(ratio * 100)}%`, background: hpColor(ratio) }}
          />
        </div>
        <p className="mt-1 text-center text-[9px] text-[#757872]">
          {actor.currentHp}/{actor.maxHp}
        </p>
      </div>
    </div>
  );
}

function StatusPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'accent';
}) {
  return (
    <div
      className="rounded-full px-3 py-1.5 text-center"
      style={{ background: tone === 'accent' ? 'rgba(255,255,255,0.92)' : 'rgba(245,247,240,0.88)' }}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#6c4324]/70">{label}</p>
      <p className="mt-0.5 text-[11px] font-bold text-[#2c302b]">{value}</p>
    </div>
  );
}

function SkillButton({
  skill,
  accent,
  accentSoft,
  accentText,
  disabled,
  isPending,
  onSelect,
}: {
  skill: BattleSkillState;
  accent: string;
  accentSoft: string;
  accentText: string;
  disabled: boolean;
  isPending: boolean;
  onSelect: () => void;
}) {
  const onCooldown = skill.cooldownRemaining > 0;
  const canUse = !disabled && !onCooldown && !isPending;
  const progress = onCooldown ? ((skill.cooldownSec - skill.cooldownRemaining) / skill.cooldownSec) * 100 : 100;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!canUse}
      className="relative min-w-0 flex-1 overflow-hidden rounded-[22px] border px-3 py-3 text-left transition active:scale-[0.98] disabled:opacity-60"
      style={{
        background: 'rgba(255,255,255,0.92)',
        borderColor: canUse || isPending ? accentSoft : '#e7e5e4',
      }}
    >
      {onCooldown && (
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: `${progress}%`, background: `${accentSoft}88` }}
        />
      )}
      <div className="relative z-10 flex items-center gap-2">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black"
          style={{ background: canUse ? accentSoft : '#f5f5f4', color: canUse ? accentText : '#78716c' }}
        >
          {isPending ? '⏳' : onCooldown ? '⌛' : '⚡'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-black text-[#2c302b]">{skill.displayName}</p>
          <p className="mt-0.5 truncate text-[10px] text-[#757872]">
            {isPending ? '発動待機中' : onCooldown ? `CT ${skill.cooldownRemaining.toFixed(1)}秒` : 'タップで発動'}
          </p>
        </div>
      </div>
      {canUse && (
        <div className="relative z-10 mt-2 rounded-full px-2 py-1 text-center text-[10px] font-black text-white" style={{ background: accent }}>
          発動
        </div>
      )}
    </button>
  );
}

export function BattleScreenPatternB({ battleState, isRunning, onSkillSelect }: BattleScreenProps) {
  const world = getWorld(battleState.stageId);
  const theme = WORLD_THEME[world];
  const party = battleState.actors.filter((actor) => !actor.isEnemy);
  const enemies = battleState.actors.filter((actor) => actor.isEnemy);
  const mainActor = party.find((actor) => actor.isMain);
  const supportActors = party.filter((actor) => !actor.isMain).slice(0, 2);
  const mainSkills = mainActor?.skills ?? [];
  const latestLog = battleState.log.at(-1);
  const totalEnemyHp = enemies.reduce((sum, actor) => sum + Math.max(0, actor.currentHp), 0);
  const totalEnemyMaxHp = enemies.reduce((sum, actor) => sum + actor.maxHp, 0);
  const totalEnemyRatio = totalEnemyMaxHp > 0 ? totalEnemyHp / totalEnemyMaxHp : 0;
  const enemySlots = [enemies[0], enemies[1], enemies[2]];
  const allySlots = [supportActors[0], mainActor, supportActors[1]];

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] flex-1 flex-col overflow-hidden" style={{ background: theme.shell }}>
      <header className="px-3 pb-2 pt-3">
        <div
          className="rounded-[28px] border px-4 py-3 shadow-sm backdrop-blur-xl"
          style={{ background: theme.panelStrong, borderColor: 'rgba(255,255,255,0.7)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span
                className="inline-flex rounded-full px-3 py-1 text-[10px] font-black"
                style={{ background: theme.accentSoft, color: theme.accentText }}
              >
                {theme.badge}
              </span>
              <h1 className="mt-2 text-lg font-black text-[#1f3528]">
                {battleState.isBoss ? 'ボスバトル' : 'エンカウント'}
              </h1>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <StatusPill label="経過" value={String(battleState.tickCount)} />
              {battleState.outcome !== 'NONE' && (
                <span
                  className="rounded-full px-3 py-1 text-[10px] font-black text-white"
                  style={{ background: battleState.outcome === 'WIN' ? theme.accent : '#9e3120' }}
                >
                  {battleState.outcome === 'WIN' ? '勝利' : '敗北'}
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-[#595c57]">
                <span>敵全体HP</span>
                <span>{totalEnemyHp}/{totalEnemyMaxHp}</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#e6e9e1]">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(totalEnemyRatio * 100)}%`, background: hpColor(totalEnemyRatio) }}
                />
              </div>
            </div>
            <StatusPill label="main" value={mainActor?.displayName ?? '未設定'} tone="accent" />
          </div>
        </div>
      </header>

      <section className="relative mx-3 flex-1 overflow-hidden rounded-[34px] border border-white/70 shadow-sm">
        <Image src={theme.bgImage} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0" style={{ background: theme.fog }} />
        <div className="absolute inset-0" style={{ background: theme.fieldGlow }} />
        <div className="absolute inset-x-0 top-[43%] h-px bg-white/30" />
        <div className="absolute left-1/2 top-[57%] h-24 w-48 -translate-x-1/2 rounded-full bg-white/20 blur-3xl" />

        <div className="absolute inset-x-4 top-3 flex justify-center">
          <div
            className="rounded-full border px-4 py-2 text-[10px] font-black shadow-sm backdrop-blur-md"
            style={{ background: theme.panelStrong, borderColor: 'rgba(255,255,255,0.7)', color: theme.accentText }}
          >
            奥が敵、手前が味方
          </div>
        </div>

        {enemySlots.map((actor, index) =>
          actor ? (
            <Figure
              key={actor.id}
              actor={actor}
              isEnemy
              align={index === 0 ? 'left' : index === 1 ? 'center' : 'right'}
              accent={theme.accent}
              accentSoft={theme.accentSoft}
              isBossBattle={battleState.isBoss}
            />
          ) : null,
        )}

        {allySlots.map((actor, index) =>
          actor ? (
            <Figure
              key={actor.id}
              actor={actor}
              isEnemy={false}
              align={index === 0 ? 'left' : index === 1 ? 'center' : 'right'}
              accent={theme.accent}
              accentSoft={theme.accentSoft}
            />
          ) : null,
        )}

        {latestLog && (
          <div className="absolute bottom-3 left-3 right-3">
            <div
              className="rounded-[22px] border px-4 py-3 shadow-sm backdrop-blur-xl"
              style={{ background: theme.panel, borderColor: 'rgba(255,255,255,0.75)' }}
            >
              <p className="truncate text-[12px] text-[#2c302b]">
                <span className="font-black">{latestLog.actorName}</span>
                {' の '}
                <span className="font-black" style={{ color: theme.accent }}>{latestLog.action}</span>
                {latestLog.targetName && <> → <span className="font-bold">{latestLog.targetName}</span></>}
                {latestLog.value !== undefined && <span className="ml-1 font-bold text-[#9f4b18]">({latestLog.value})</span>}
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="px-3 pb-3 pt-2">
        <div
          className="rounded-[28px] border px-3 py-3 shadow-sm backdrop-blur-xl"
          style={{ background: theme.panelStrong, borderColor: 'rgba(255,255,255,0.72)' }}
        >
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black tracking-[0.14em] text-[#29664c]/70">相棒スキル</p>
              <p className="mt-0.5 text-[11px] text-[#757872]">中央の相棒が次に使う行動を選びます</p>
            </div>
            <span
              className="rounded-full px-3 py-1 text-[10px] font-black"
              style={{ background: theme.accentSoft, color: theme.accentText }}
            >
              相棒が主役
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {mainSkills.length === 0 ? (
              <div className="col-span-2 rounded-[22px] bg-[#f5f7f0] px-4 py-4 text-center text-sm text-[#757872]">
                使用できるスキルがありません。
              </div>
            ) : (
              mainSkills.slice(0, 4).map((skill) => (
                <SkillButton
                  key={skill.skillId}
                  skill={skill}
                  accent={theme.accent}
                  accentSoft={theme.accentSoft}
                  accentText={theme.accentText}
                  disabled={!isRunning}
                  isPending={battleState.pendingMainSkillId === skill.skillId}
                  onSelect={() => onSkillSelect(skill.skillId)}
                />
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
