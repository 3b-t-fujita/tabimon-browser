/**
 * バトル画面 パターンB — 臨場感強化型（確定版）
 * ワールド背景画像をバトルフィールドとして上部に表示し、
 * そのエリアで戦っている臨場感を演出する。
 * 下部：味方コンパクトカード + 光るスキルボタン。
 */
'use client';

import Image from 'next/image';
import type { BattleState } from '@/domain/battle/BattleState';
import type { BattleActor, BattleSkillState } from '@/domain/battle/BattleActor';
import { getMonsterStandUrl } from '@/infrastructure/assets/monsterImageService';
import type { BattleScreenProps } from './BattleScreenPatternA';

// ── ステージID → ワールド ──────────────────────────────────────
function getWorld(stageId: string): 'forest' | 'fire' | 'ice' {
  if (stageId.includes('_w1')) return 'forest';
  if (stageId.includes('_w2')) return 'fire';
  return 'ice';
}

const WORLD_THEME = {
  forest: {
    bgImage:   '/assets/backgrounds/world_forest_bg_v1.webp',
    // 背景画像下端 → ダーク下部へのオーバーレイ
    overlay:   'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(5,46,22,0.55) 55%, rgba(10,17,30,1) 100%)',
    accent:    '#22c55e',
    accentDim: '#064e3b',
    headerBg:  'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
    ctaBg:     'linear-gradient(135deg, #064e3b 0%, #16a34a 100%)',
    glow:      'rgba(34,197,94,0.35)',
    icon:      '🌿',
    label:     'ミドリの森',
  },
  fire: {
    bgImage:   '/assets/backgrounds/world_desert_bg_v1.webp',
    overlay:   'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(67,20,7,0.60) 55%, rgba(10,17,30,1) 100%)',
    accent:    '#f97316',
    accentDim: '#7c2d12',
    headerBg:  'linear-gradient(135deg, #7c2d12 0%, #9a3412 100%)',
    ctaBg:     'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
    glow:      'rgba(249,115,22,0.35)',
    icon:      '🔥',
    label:     'ほのおの山',
  },
  ice: {
    bgImage:   '/assets/backgrounds/world_snow_bg_v1.webp',
    overlay:   'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(8,47,73,0.60) 55%, rgba(10,17,30,1) 100%)',
    accent:    '#38bdf8',
    accentDim: '#0c4a6e',
    headerBg:  'linear-gradient(135deg, #0c4a6e 0%, #075985 100%)',
    ctaBg:     'linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)',
    glow:      'rgba(56,189,248,0.35)',
    icon:      '❄️',
    label:     'こおりの地',
  },
} as const;

function hpColor(ratio: number): string {
  if (ratio > 0.5) return '#22c55e';
  if (ratio > 0.25) return '#eab308';
  return '#ef4444';
}

// ── 敵カード（立ち絵フォーカス・背景上に浮かぶ） ───────────────
function EnemyCard({ actor }: { actor: BattleActor }) {
  const ratio    = Math.max(0, actor.currentHp / actor.maxHp);
  const pct      = Math.round(ratio * 100);
  const dead     = actor.currentHp <= 0;
  const standUrl = getMonsterStandUrl(actor.monsterId ?? null);

  return (
    <div
      className={`flex flex-col items-center transition-opacity ${dead ? 'opacity-25' : ''}`}
      style={{ minWidth: 84 }}
    >
      {/* 立ち絵（大・ドロップシャドウで地面に立っている感） */}
      <div className="relative mb-2" style={{ width: 88, height: 88 }}>
        {standUrl ? (
          <Image
            src={standUrl}
            alt={actor.displayName}
            fill
            className="object-contain"
            sizes="88px"
            style={{
              filter: dead
                ? 'grayscale(1) brightness(0.5)'
                : 'drop-shadow(0 6px 16px rgba(0,0,0,0.7)) drop-shadow(0 2px 4px rgba(0,0,0,0.9))',
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">
            {dead ? '💀' : '👾'}
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-900/70 text-3xl">
            💀
          </div>
        )}
      </div>

      {/* 名前（テキストシャドウで背景に埋もれない） */}
      <p
        className="mb-1.5 max-w-[92px] truncate text-center text-[11px] font-black text-white"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.8)' }}
      >
        {actor.displayName}
      </p>

      {/* 個別 HP バー */}
      <div className="w-full overflow-hidden rounded-full bg-black/40" style={{ height: 5 }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: hpColor(ratio) }}
        />
      </div>
      <p className="mt-0.5 text-[9px] text-white/50" style={{ textShadow: '0 1px 3px rgba(0,0,0,1)' }}>
        {actor.currentHp} <span className="text-white/25">/ {actor.maxHp}</span>
      </p>

      {/* バフ表示 */}
      {(actor.buffTurnsRemaining > 0 || actor.shieldHitsRemaining > 0) && (
        <div className="mt-0.5 flex justify-center gap-0.5">
          {actor.atkMultiplier > 1  && <span className="rounded bg-black/40 px-0.5 text-[8px] text-yellow-300">↑ATK</span>}
          {actor.defMultiplier > 1  && <span className="rounded bg-black/40 px-0.5 text-[8px] text-blue-300">↑DEF</span>}
          {actor.atkMultiplier < 1  && <span className="rounded bg-black/40 px-0.5 text-[8px] text-red-400">↓ATK</span>}
          {actor.defMultiplier < 1  && <span className="rounded bg-black/40 px-0.5 text-[8px] text-orange-400">↓DEF</span>}
          {actor.shieldHitsRemaining > 0 && (
            <span className="rounded bg-black/40 px-0.5 text-[8px] text-cyan-400">🛡{actor.shieldHitsRemaining}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── 味方カード（下部コンパクト） ──────────────────────────────
function AllyCard({ actor }: { actor: BattleActor }) {
  const ratio    = Math.max(0, actor.currentHp / actor.maxHp);
  const pct      = Math.round(ratio * 100);
  const dead     = actor.currentHp <= 0;
  const standUrl = getMonsterStandUrl(actor.monsterId ?? null);

  return (
    <div
      className={`flex flex-1 flex-col items-center rounded-2xl p-2 transition-opacity ${dead ? 'opacity-30' : ''}`}
      style={{
        background:     'rgba(10,17,30,0.90)',
        border:         actor.isMain ? '2px solid rgba(255,255,255,0.22)' : '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div className="relative mb-1" style={{ width: 40, height: 40 }}>
        {standUrl ? (
          <Image src={standUrl} alt={actor.displayName} fill className="object-contain" sizes="40px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl">
            {dead ? '💀' : '🐾'}
          </div>
        )}
      </div>
      <p className="mb-1 max-w-[56px] truncate text-center text-[9px] font-bold text-white/70">
        {actor.isMain && '★'}{actor.displayName}
      </p>
      <div className="w-full overflow-hidden rounded-full bg-slate-700" style={{ height: 3 }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: hpColor(ratio) }}
        />
      </div>
      <p className="mt-0.5 text-[8px] text-white/30">{actor.currentHp}</p>
    </div>
  );
}

// ── Pattern B メインコンポーネント ─────────────────────────────
export function BattleScreenPatternB({ battleState, isRunning, onSkillSelect }: BattleScreenProps) {
  const world    = getWorld(battleState.stageId);
  const theme    = WORLD_THEME[world];
  const party    = battleState.actors.filter((a) => !a.isEnemy);
  const enemies  = battleState.actors.filter((a) =>  a.isEnemy);
  const mainActor  = party.find((a) => a.isMain);
  const mainSkills = mainActor?.skills ?? [];
  const lastLog    = battleState.log.slice(-2);

  // 全敵の合算 HP
  const totalMaxHp = enemies.reduce((s, e) => s + e.maxHp, 0);
  const totalCurHp = enemies.reduce((s, e) => s + Math.max(0, e.currentHp), 0);
  const enemyHpRatio = totalMaxHp > 0 ? totalCurHp / totalMaxHp : 0;

  return (
    <div className="flex flex-1 flex-col overflow-hidden" style={{ background: '#0a111e' }}>

      {/* ══ ① ヘッダー（ワールドカラー） ══ */}
      <header
        className="shrink-0 flex items-center justify-between px-4 py-2.5"
        style={{ background: theme.headerBg }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{theme.icon}</span>
          <span className="text-sm font-black text-white">
            {battleState.isBoss ? '🔥 BOSS 戦！' : 'バトル中'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {battleState.outcome !== 'NONE' && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
              battleState.outcome === 'WIN' ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white'
            }`}>
              {battleState.outcome === 'WIN' ? '🎉 勝利！' : '💀 敗北'}
            </span>
          )}
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/55">
            {battleState.tickCount}
          </span>
        </div>
      </header>

      {/* ══ ② バトルフィールド（ワールド背景 + 敵） ══ */}
      <section className="relative flex-1 overflow-hidden">

        {/* ワールド背景画像 */}
        <Image
          src={theme.bgImage}
          alt={theme.label}
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />

        {/* グラデーションオーバーレイ（上は透明・下でダーク下部へ溶ける） */}
        <div className="absolute inset-0" style={{ background: theme.overlay }} />

        {/* フィールド内コンテンツ */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 px-4">

          {/* 全敵合算 HP バー（上部） */}
          {enemies.length > 0 && (
            <div
              className="absolute top-3 left-1/2 -translate-x-1/2 w-52"
              style={{ zIndex: 10 }}
            >
              <div className="mb-1 flex items-center justify-between text-[9px]">
                <span
                  className="font-bold text-red-300"
                  style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
                >
                  ENEMY HP
                </span>
                <span
                  className="text-white/50"
                  style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
                >
                  {totalCurHp} / {totalMaxHp}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-black/50">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(enemyHpRatio * 100)}%`, background: hpColor(enemyHpRatio) }}
                />
              </div>
            </div>
          )}

          {/* 敵モンスター立ち絵（フィールド中央に配置） */}
          <div className="flex items-end justify-center gap-8 mb-4" style={{ zIndex: 10 }}>
            {enemies.map((e) => (
              <EnemyCard key={e.id} actor={e} />
            ))}
          </div>

          {/* フローティングバトルログ */}
          <div className="w-full space-y-0.5 px-2" style={{ zIndex: 10 }}>
            {lastLog.map((entry, i) => (
              <p
                key={`${entry.tick}-${i}`}
                className="text-center text-xs leading-5"
                style={{
                  opacity: lastLog.length > 1 && i === 0 ? 0.45 : 0.90,
                  textShadow: '0 1px 6px rgba(0,0,0,1), 0 0 12px rgba(0,0,0,0.8)',
                }}
              >
                <span className="font-bold text-white">{entry.actorName}</span>
                {' の '}
                <span style={{ color: theme.accent }}>{entry.action}</span>
                {entry.targetName && (
                  <> → <span className="font-semibold text-white">{entry.targetName}</span></>
                )}
                {entry.value !== undefined && (
                  <span className="ml-1 text-orange-300"> 💥{entry.value}</span>
                )}
              </p>
            ))}
          </div>

        </div>
      </section>

      {/* ══ ③ 味方コンパクトバー ══ */}
      <section className="shrink-0 px-3 py-2" style={{ background: '#0a111e' }}>
        <div className="flex gap-2">
          {party.map((a) => <AllyCard key={a.id} actor={a} />)}
        </div>
      </section>

      {/* ══ ④ スキルボタン（大・グロー） ══ */}
      <section className="shrink-0 px-4 pb-5 pt-1" style={{ background: '#0a111e' }}>
        {mainSkills.length === 0 ? (
          <p className="text-center text-sm text-slate-500">スキルなし</p>
        ) : (
          <div className="flex flex-col gap-2">
            {mainSkills.map((skill) => {
              const onCD      = skill.cooldownRemaining > 0;
              const isPending = battleState.pendingMainSkillId === skill.skillId;
              const canUse    = isRunning && !onCD && !isPending;
              const cdPct     = onCD
                ? ((skill.cooldownSec - skill.cooldownRemaining) / skill.cooldownSec) * 100
                : 100;

              return (
                <button
                  key={skill.skillId}
                  type="button"
                  onClick={() => onSkillSelect(skill.skillId)}
                  disabled={!canUse}
                  className="relative w-full overflow-hidden rounded-2xl py-4 text-center font-black text-white transition active:scale-[0.97] disabled:opacity-55"
                  style={{
                    background: canUse ? theme.ctaBg : '#1e293b',
                    border:     `2px solid ${canUse ? theme.accent : '#334155'}`,
                    boxShadow:  canUse ? `0 6px 24px ${theme.glow}` : 'none',
                  }}
                >
                  {/* CT 回復オーバーレイ */}
                  {onCD && (
                    <div
                      className="absolute inset-y-0 left-0 rounded-2xl transition-all duration-300"
                      style={{ width: `${cdPct}%`, background: `${theme.accent}20` }}
                    />
                  )}
                  {/* 光沢（発動可能時） */}
                  {canUse && (
                    <span
                      className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl"
                      style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)' }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2 text-base">
                    {isPending ? (
                      <><span>⏳</span><span>{skill.displayName}</span><span className="text-sm font-normal opacity-65">発動待機中...</span></>
                    ) : onCD ? (
                      <><span>⌛</span><span>{skill.displayName}</span><span className="text-sm font-normal opacity-65">CT {skill.cooldownRemaining.toFixed(1)}s</span></>
                    ) : (
                      <><span>⚡</span><span>{skill.displayName}</span><span className="text-sm font-normal opacity-80">発動！</span></>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
