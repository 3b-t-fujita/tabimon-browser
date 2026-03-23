'use client';

/**
 * キャラクター図鑑ページ。
 * 全モンスターの立ち絵・アイコン・名前・属性を一覧表示する。
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

const SECTIONS: { label: string; world?: WorldLabel; initial?: boolean }[] = [
  { label: '初期主役',     initial: true  },
  { label: '森ワールド',   world:  '森'   },
  { label: '砂漠ワールド', world:  '砂漠' },
  { label: '雪原ワールド', world:  '雪原' },
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
          const items = sec.initial
            ? MONSTERS.filter((m) => m.isInitial)
            : MONSTERS.filter((m) => m.world === sec.world && !m.isInitial);
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
