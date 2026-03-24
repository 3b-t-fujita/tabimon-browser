/**
 * モンスター画像 URL 解決サービス。
 *
 * monsterId → 画像パスのマッピングをここで一元管理する。
 * 新しいモンスター画像が追加されたら STAND_MAP / ICON_MAP に追記するだけでよい。
 */

// ---------------------------------------------------------------------------
// マッピング定義
// ---------------------------------------------------------------------------

/** 立ち絵（フルボディ）マップ */
const STAND_MAP: Record<string, string> = {
  // 初期主役候補
  MON_GRASS_001: '/assets/monsters/stands/monster_stand_initial_01_v1.webp',
  MON_FIRE_001:  '/assets/monsters/stands/monster_stand_initial_02_v1.webp',
  MON_ICE_001:   '/assets/monsters/stands/monster_stand_initial_03_v1.webp',
  // 森ワールド
  mon_001: '/assets/monsters/stands/monster_stand_mon001_v1.webp', // モリドラゴン
  mon_002: '/assets/monsters/stands/monster_stand_mon002_v1.webp', // ミドリウルフ
  mon_003: '/assets/monsters/stands/monster_stand_mon003_v1.webp', // コケゴーレム
  // 砂漠ワールド
  mon_004: '/assets/monsters/stands/monster_stand_mon004_v1.webp', // ホムラサラマンダ
  mon_005: '/assets/monsters/stands/monster_stand_mon005_v1.webp', // バーンフェニックス
  mon_006: '/assets/monsters/stands/monster_stand_mon006_v1.webp', // マグマロック
  // 雪原ワールド
  mon_007: '/assets/monsters/stands/monster_stand_mon007_v1.webp', // コオリウィング
  mon_008: '/assets/monsters/stands/monster_stand_mon008_v1.webp', // フリーズベア
  mon_009: '/assets/monsters/stands/monster_stand_mon009_v1.webp', // ブリザードフォックス
  // レアキャラ（Aランク）
  mon_010: '/assets/monsters/stands/monster_stand_mon010_v1.webp', // ヴァインドレイク
  mon_011: '/assets/monsters/stands/monster_stand_mon011_v1.webp', // インフェルノリザード
  mon_012: '/assets/monsters/stands/monster_stand_mon012_v1.webp', // グラシャルタイタン
  // レアキャラ（Bランク）
  mon_013: '/assets/monsters/stands/monster_stand_mon013_v1.webp', // エンシェントドラゴン
  mon_014: '/assets/monsters/stands/monster_stand_mon014_v1.webp', // マグナフェニックス
  mon_015: '/assets/monsters/stands/monster_stand_mon015_v1.webp', // グレイシャーキング
  // 進化形（森ワールド）
  'mon_001_e':       '/assets/monsters/stands/monster_stand_mon001e_v1.webp',
  'mon_002_e':       '/assets/monsters/stands/monster_stand_mon002e_v1.webp',
  'mon_003_e':       '/assets/monsters/stands/monster_stand_mon003e_v1.webp',
  'MON_GRASS_001_e': '/assets/monsters/stands/monster_stand_initial_01e_v1.webp',
  // 進化形（火山ワールド）
  'mon_004_e':       '/assets/monsters/stands/monster_stand_mon004e_v1.webp',
  'mon_005_e':       '/assets/monsters/stands/monster_stand_mon005e_v1.webp',
  'mon_006_e':       '/assets/monsters/stands/monster_stand_mon006e_v1.webp',
  'MON_FIRE_001_e':  '/assets/monsters/stands/monster_stand_initial_02e_v1.webp',
  // 進化形（雪原ワールド）
  'mon_007_e':       '/assets/monsters/stands/monster_stand_mon007e_v1.webp',
  'mon_008_e':       '/assets/monsters/stands/monster_stand_mon008e_v1.webp',
  'mon_009_e':       '/assets/monsters/stands/monster_stand_mon009e_v1.webp',
  'MON_ICE_001_e':   '/assets/monsters/stands/monster_stand_initial_03e_v1.webp',
  // 進化形（レアA）
  'mon_010_e':       '/assets/monsters/stands/monster_stand_mon010e_v1.webp',
  'mon_011_e':       '/assets/monsters/stands/monster_stand_mon011e_v1.webp',
  'mon_012_e':       '/assets/monsters/stands/monster_stand_mon012e_v1.webp',
  // 進化形（レアB）
  'mon_013_e':       '/assets/monsters/stands/monster_stand_mon013e_v1.webp',
  'mon_014_e':       '/assets/monsters/stands/monster_stand_mon014e_v1.webp',
  'mon_015_e':       '/assets/monsters/stands/monster_stand_mon015e_v1.webp',
};

/** アイコン（小サイズ正方形）マップ */
const ICON_MAP: Record<string, string> = {
  // 初期主役候補
  MON_GRASS_001: '/assets/monsters/icons/monster_icon_initial_01_v1.webp',
  MON_FIRE_001:  '/assets/monsters/icons/monster_icon_initial_02_v1.webp',
  MON_ICE_001:   '/assets/monsters/icons/monster_icon_initial_03_v1.webp',
  // 森ワールド
  mon_001: '/assets/monsters/icons/monster_icon_mon001_v1.webp',
  mon_002: '/assets/monsters/icons/monster_icon_mon002_v1.webp',
  mon_003: '/assets/monsters/icons/monster_icon_mon003_v1.webp',
  // 砂漠ワールド
  mon_004: '/assets/monsters/icons/monster_icon_mon004_v1.webp',
  mon_005: '/assets/monsters/icons/monster_icon_mon005_v1.webp',
  mon_006: '/assets/monsters/icons/monster_icon_mon006_v1.webp',
  // 雪原ワールド
  mon_007: '/assets/monsters/icons/monster_icon_mon007_v1.webp',
  mon_008: '/assets/monsters/icons/monster_icon_mon008_v1.webp',
  mon_009: '/assets/monsters/icons/monster_icon_mon009_v1.webp',
  // レアキャラ（Aランク）
  mon_010: '/assets/monsters/icons/monster_icon_mon010_v1.webp', // ヴァインドレイク
  mon_011: '/assets/monsters/icons/monster_icon_mon011_v1.webp', // インフェルノリザード
  mon_012: '/assets/monsters/icons/monster_icon_mon012_v1.webp', // グラシャルタイタン
  // レアキャラ（Bランク）
  mon_013: '/assets/monsters/icons/monster_icon_mon013_v1.webp', // エンシェントドラゴン
  mon_014: '/assets/monsters/icons/monster_icon_mon014_v1.webp', // マグナフェニックス
  mon_015: '/assets/monsters/icons/monster_icon_mon015_v1.webp', // グレイシャーキング
  // 進化形（森ワールド）
  'mon_001_e':       '/assets/monsters/icons/monster_icon_mon001e_v1.webp',
  'mon_002_e':       '/assets/monsters/icons/monster_icon_mon002e_v1.webp',
  'mon_003_e':       '/assets/monsters/icons/monster_icon_mon003e_v1.webp',
  'MON_GRASS_001_e': '/assets/monsters/icons/monster_icon_initial_01e_v1.webp',
  // 進化形（火山ワールド）
  'mon_004_e':       '/assets/monsters/icons/monster_icon_mon004e_v1.webp',
  'mon_005_e':       '/assets/monsters/icons/monster_icon_mon005e_v1.webp',
  'mon_006_e':       '/assets/monsters/icons/monster_icon_mon006e_v1.webp',
  'MON_FIRE_001_e':  '/assets/monsters/icons/monster_icon_initial_02e_v1.webp',
  // 進化形（雪原ワールド）
  'mon_007_e':       '/assets/monsters/icons/monster_icon_mon007e_v1.webp',
  'mon_008_e':       '/assets/monsters/icons/monster_icon_mon008e_v1.webp',
  'mon_009_e':       '/assets/monsters/icons/monster_icon_mon009e_v1.webp',
  'MON_ICE_001_e':   '/assets/monsters/icons/monster_icon_initial_03e_v1.webp',
  // 進化形（レアA）
  'mon_010_e':       '/assets/monsters/icons/monster_icon_mon010e_v1.webp',
  'mon_011_e':       '/assets/monsters/icons/monster_icon_mon011e_v1.webp',
  'mon_012_e':       '/assets/monsters/icons/monster_icon_mon012e_v1.webp',
  // 進化形（レアB）
  'mon_013_e':       '/assets/monsters/icons/monster_icon_mon013e_v1.webp',
  'mon_014_e':       '/assets/monsters/icons/monster_icon_mon014e_v1.webp',
  'mon_015_e':       '/assets/monsters/icons/monster_icon_mon015e_v1.webp',
};

// ---------------------------------------------------------------------------
// 公開 API
// ---------------------------------------------------------------------------

/**
 * 立ち絵 URL を返す。マッピングにない場合は null。
 * null の場合は呼び出し元でフォールバック表示（絵文字など）を行う。
 */
export function getMonsterStandUrl(monsterId?: string | null): string | null {
  if (!monsterId) return null;
  return STAND_MAP[monsterId] ?? null;
}

/**
 * アイコン URL を返す。マッピングにない場合は null。
 * null の場合は呼び出し元でフォールバック表示（絵文字など）を行う。
 */
export function getMonsterIconUrl(monsterId?: string | null): string | null {
  if (!monsterId) return null;
  return ICON_MAP[monsterId] ?? null;
}
