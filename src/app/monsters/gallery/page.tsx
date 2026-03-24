'use client';

/**
 * キャラクター図鑑ページ。
 * 全モンスターの立ち絵・アイコン・名前・属性を一覧表示する。
 * レアキャラ（mon_010〜015）はシルエット表示で隠しキャラとして扱う。
 */
import { useRouter } from 'next/navigation';
import { getMonsterStandUrl, getMonsterIconUrl } from '@/infrastructure/assets/monsterImageService';

// ---------------------------------------------------------------------------
// モンスターマスタ（表示用スナップショット）
// ---------------------------------------------------------------------------

type WorldLabel = '森' | '砂漠' | '雪原';
type RoleLabel  = 'アタッカー' | 'タンク' | 'サポーター';

interface MonsterEntry {
  monsterId:   string;
  displayName: string;
  world:        WorldLabel;
  role:         RoleLabel;
  isInitial:    boolean;
  isHidden?:    boolean;
  isEvolved?:   boolean;
}

const MONSTERS: MonsterEntry[] = [
  // 初期主役
  { monsterId: 'MON_GRASS_001', displayName: 'グリーニョ',        world: '森',   role: 'アタッカー',   isInitial: true  },
  { monsterId: 'MON_FIRE_001',  displayName: 'フレイム',          world: '砂漠', role: 'アタッカー',   isInitial: true  },
  { monsterId: 'MON_ICE_001',   displayName: 'フロスト',          world: '雪原', role: 'サポーター',   isInitial: true  },
  // 森ワールド
  { monsterId: 'mon_001',       displayName: 'モリドラゴン',      world: '森',   role: 'サポーター',   isInitial: false },
  { monsterId: 'mon_002',       displayName: 'ミドリウルフ',      world: '森',   role: 'アタッカー',   isInitial: false },
  { monsterId: 'mon_003',       displayName: 'コケゴーレム',      world: '森',   role: 'タンク',       isInitial: false },
  // 砂漠ワールド
  { monsterId: 'mon_004',       displayName: 'ホムラサラマンダ',  world: '砂漠', role: 'アタッカー',   isInitial: false },
  { monsterId: 'mon_005',       displayName: 'バーンフェニックス',world: '砂漠', role: 'アタッカー',   isInitial: false },
  { monsterId: 'mon_006',       displayName: 'マグマロック',      world: '砂漠', role: 'タンク',       isInitial: false },
  // 雪原ワールド
  { monsterId: 'mon_007',       displayName: 'コオリウィング',    world: '雪原', role: 'タンク',       isInitial: false },
  { monsterId: 'mon_008',       displayName: 'フリーズベア',      world: '雪原', role: 'タンク',       isInitial: false },
  { monsterId: 'mon_009',       displayName: 'ブリザードフォックス',world:'雪原', role: 'サポーター',   isInitial: false },
  // 隠しキャラ（レアA）
  { monsterId: 'mon_010',       displayName: 'ヴァインドレイク',    world: '森',   role: 'アタッカー',   isInitial: false, isHidden: true },
  { monsterId: 'mon_011',       displayName: 'インフェルノリザード',world: '砂漠', role: 'アタッカー',   isInitial: false, isHidden: true },
  { monsterId: 'mon_012',       displayName: 'グラシャルタイタン',  world: '雪原', role: 'タンク',       isInitial: false, isHidden: true },
  // 隠しキャラ（レアB）
  { monsterId: 'mon_013',       displayName: 'エンシェントドラゴン',world: '森',   role: 'アタッカー',   isInitial: false, isHidden: true },
  { monsterId: 'mon_014',       displayName: 'マグナフェニックス',  world: '砂漠', role: 'アタッカー',   isInitial: false, isHidden: true },
  { monsterId: 'mon_015',       displayName: 'グレイシャーキング',  world: '雪原', role: 'タンク',       isInitial: false, isHidden: true },
  // 進化形（森ワールド）
  { monsterId: 'mon_001_e',       displayName: 'グランドラゴン',         world: '森',   role: 'サポーター', isInitial: false, isEvolved: true },
  { monsterId: 'mon_002_e',       displayName: 'エメラルドウルフ',       world: '森',   role: 'アタッカー', isInitial: false, isEvolved: true },
  { monsterId: 'mon_003_e',       displayName: 'ジャイアントゴーレム',   world: '森',   role: 'タンク',     isInitial: false, isEvolved: true },
  { monsterId: 'MON_GRASS_001_e', displayName: 'グランドグリーニョ',     world: '森',   role: 'アタッカー', isInitial: false, isEvolved: true },
  // 進化形（火山ワールド）
  { monsterId: 'mon_004_e',       displayName: 'ブレイズサラマンダ',     world: '砂漠', role: 'アタッカー', isInitial: false, isEvolved: true },
  { monsterId: 'mon_005_e',       displayName: 'インフェルノフェニックス',world: '砂漠', role: 'アタッカー', isInitial: false, isEvolved: true },
  { monsterId: 'mon_006_e',       displayName: 'マグマタイタン',         world: '砂漠', role: 'タンク',     isInitial: false, isEvolved: true },
  { monsterId: 'MON_FIRE_001_e',  displayName: 'フレイムアーム',         world: '砂漠', role: 'アタッカー', isInitial: false, isEvolved: true },
  // 進化形（雪原ワールド）
  { monsterId: 'mon_007_e',       displayName: 'フロストウィング',       world: '雪原', role: 'タンク',     isInitial: false, isEvolved: true },
  { monsterId: 'mon_008_e',       displayName: 'グレイシャーベア',       world: '雪原', role: 'タンク',     isInitial: false, isEvolved: true },
  { monsterId: 'mon_009_e',       displayName: 'ポーラーフォックス',     world: '雪原', role: 'サポーター', isInitial: false, isEvolved: true },
  { monsterId: 'MON_ICE_001_e',   displayName: 'フロストアーマー',       world: '雪原', role: 'サポーター', isInitial: false, isEvolved: true },
  // 進化形（レアA）
  { monsterId: 'mon_010_e',       displayName: 'ヴァインオーバーロード',  world: '森',   role: 'アタッカー', isInitial: false, isEvolved: true, isHidden: true },
  { monsterId: 'mon_011_e',       displayName: 'インフェルノタイラント',  world: '砂漠', role: 'アタッカー', isInitial: false, isEvolved: true, isHidden: true },
  { monsterId: 'mon_012_e',       displayName: 'ブリザードコロッサス',   world: '雪原', role: 'タンク',     isInitial: false, isEvolved: true, isHidden: true },
  // 進化形（レアB）
  { monsterId: 'mon_013_e',       displayName: 'プライマルドラゴン',     world: '森',   role: 'アタッカー', isInitial: false, isEvolved: true, isHidden: true },
  { monsterId: 'mon_014_e',       displayName: 'アポカリプスフェニックス',world: '砂漠', role: 'アタッカー', isInitial: false, isEvolved: true, isHidden: true },
  { monsterId: 'mon_015_e',       displayName: 'グレイシャーエンペラー',  world: '雪原', role: 'タンク',     isInitial: false, isEvolved: true, isHidden: true },
];

// ---------------------------------------------------------------------------
// スタイルヘルパー
// ---------------------------------------------------------------------------

const WORLD_COLOR: Record<WorldLabel, string> = {
  '森':   'bg-emerald-100 text-emerald-700 border-emerald-200',
  '砂漠': 'bg-orange-100  text-orange-700  border-orange-200',
  '雪原': 'bg-sky-100     text-sky-700     border-sky-200',
};

const ROLE_COLOR: Record<RoleLabel, string> = {
  'アタッカー': 'text-red-500',
  'タンク':     'text-blue-500',
  'サポーター': 'text-green-500',
};

// ---------------------------------------------------------------------------
// MonsterCard
// ---------------------------------------------------------------------------

function MonsterCard({ m }: { m: MonsterEntry }) {
  const standUrl = getMonsterStandUrl(m.monsterId);
  const iconUrl  = getMonsterIconUrl(m.monsterId);

  if (m.isHidden) {
    return (
      <div className="rounded-2xl border-2 border-stone-300 bg-stone-100 shadow-sm overflow-hidden flex flex-col">
        {/* シルエットエリア */}
        <div className="flex items-center justify-center bg-stone-200 py-4" style={{ minHeight: 140 }}>
          {standUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={standUrl}
              alt="???"
              className="h-32 w-32 object-contain"
              style={{ filter: 'brightness(0)' }}
            />
          ) : (
            <div className="h-32 w-32 rounded-full bg-stone-400" />
          )}
        </div>

        {/* 情報エリア */}
        <div className="flex items-center gap-2 px-3 py-3">
          {/* シルエットアイコン */}
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-stone-300">
            {iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={iconUrl}
                alt="???"
                className="h-10 w-10 rounded-full object-cover"
                style={{ filter: 'brightness(0)' }}
              />
            ) : (
              <span className="text-stone-500 text-sm font-bold">?</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-stone-400 text-sm leading-tight">???</p>
            <p className="text-xs text-stone-400 mt-0.5">隠しキャラ</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border-2 bg-white shadow-sm overflow-hidden flex flex-col ${WORLD_COLOR[m.world].split(' ').find(c => c.startsWith('border')) ?? 'border-stone-200'}`}>
      {/* 立ち絵エリア */}
      <div className="flex items-center justify-center bg-stone-50 py-4" style={{ minHeight: 140 }}>
        {standUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={standUrl} alt={m.displayName} className="h-32 w-32 object-contain" />
        ) : (
          <span className="text-5xl">🐾</span>
        )}
      </div>

      {/* 情報エリア */}
      <div className="flex items-center gap-2 px-3 py-3">
        {/* アイコン */}
        {iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={iconUrl} alt={m.displayName} className="h-10 w-10 rounded-full border border-stone-200 object-cover flex-shrink-0" />
        ) : (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-stone-200 text-xl">🐾</div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <p className="font-bold text-stone-800 text-sm leading-tight truncate">{m.displayName}</p>
            {m.isInitial && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-700">初期</span>
            )}
            {m.isEvolved && (
              <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-xs font-bold text-purple-700">進化</span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className={`rounded-full border px-1.5 py-0.5 text-xs font-medium ${WORLD_COLOR[m.world]}`}>
              {m.world}
            </span>
            <span className={`text-xs font-medium ${ROLE_COLOR[m.role]}`}>
              {m.role}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ページ本体
// ---------------------------------------------------------------------------

const SECTIONS: { label: string; world?: WorldLabel; initial?: boolean; hidden?: boolean; filter?: (m: MonsterEntry) => boolean }[] = [
  { label: '初期主役',     initial: true  },
  { label: '森ワールド',   world:  '森'   },
  { label: '砂漠ワールド', world:  '砂漠' },
  { label: '雪原ワールド', world:  '雪原' },
  { label: '隠しキャラ',   hidden: true   },
  { label: '進化形（森）',   filter: (m) => m.isEvolved === true && m.world === '森'   && !m.isHidden },
  { label: '進化形（砂漠）', filter: (m) => m.isEvolved === true && m.world === '砂漠' && !m.isHidden },
  { label: '進化形（雪原）', filter: (m) => m.isEvolved === true && m.world === '雪原' && !m.isHidden },
  { label: '進化形（隠し）', filter: (m) => m.isEvolved === true && m.isHidden === true },
];

export default function MonsterGalleryPage() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-stone-50">
      {/* ヘッダー */}
      <header className="bg-emerald-600 px-5 py-4 sticky top-0 z-10 shadow">
        <button type="button" onClick={() => router.back()} className="mb-1 text-sm text-emerald-100">
          ← 戻る
        </button>
        <h1 className="text-xl font-bold text-white">キャラクター図鑑</h1>
        <p className="text-xs text-emerald-200 mt-0.5">全 {MONSTERS.length} 体</p>
      </header>

      <div className="flex flex-col gap-8 p-5 pb-10">
        {SECTIONS.map((sec) => {
          let items: MonsterEntry[];
          if (sec.filter) {
            items = MONSTERS.filter(sec.filter);
          } else if (sec.initial) {
            items = MONSTERS.filter((m) => m.isInitial);
          } else if (sec.hidden) {
            items = MONSTERS.filter((m) => m.isHidden && !m.isEvolved);
          } else {
            items = MONSTERS.filter((m) => m.world === sec.world && !m.isInitial && !m.isHidden && !m.isEvolved);
          }
          return (
            <section key={sec.label}>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-stone-400">{sec.label}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {items.map((m) => (
                  <MonsterCard key={m.monsterId} m={m} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
