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
  MON_GRASS_001: '/assets/monsters/stands/monster_stand_initial_01_v1.png',
  MON_FIRE_001:  '/assets/monsters/stands/monster_stand_initial_02_v1.png',
  MON_ICE_001:   '/assets/monsters/stands/monster_stand_initial_03_v1.png',
  // 森ワールド
  mon_001: '/assets/monsters/stands/monster_stand_mon001_v1.png', // モリドラゴン
  mon_002: '/assets/monsters/stands/monster_stand_mon002_v1.png', // ミドリウルフ
  mon_003: '/assets/monsters/stands/monster_stand_mon003_v1.png', // コケゴーレム
  // 砂漠ワールド
  mon_004: '/assets/monsters/stands/monster_stand_mon004_v1.png', // ホムラサラマンダ
  mon_005: '/assets/monsters/stands/monster_stand_mon005_v1.png', // バーンフェニックス
  mon_006: '/assets/monsters/stands/monster_stand_mon006_v1.png', // マグマロック
  // 雪原ワールド
  mon_007: '/assets/monsters/stands/monster_stand_mon007_v1.png', // コオリウィング
  mon_008: '/assets/monsters/stands/monster_stand_mon008_v1.png', // フリーズベア
  mon_009: '/assets/monsters/stands/monster_stand_mon009_v1.png', // ブリザードフォックス
  // レアキャラ（Aランク）
  mon_010: '/assets/monsters/stands/monster_stand_mon010_v1.png', // ヴァインドレイク
  mon_011: '/assets/monsters/stands/monster_stand_mon011_v1.png', // インフェルノリザード
  mon_012: '/assets/monsters/stands/monster_stand_mon012_v1.png', // グラシャルタイタン
  // レアキャラ（Bランク）
  mon_013: '/assets/monsters/stands/monster_stand_mon013_v1.png', // エンシェントドラゴン
  mon_014: '/assets/monsters/stands/monster_stand_mon014_v1.png', // マグナフェニックス
  mon_015: '/assets/monsters/stands/monster_stand_mon015_v1.png', // グレイシャーキング
  // 進化形（森ワールド）
  'mon_001_e':       '/assets/monsters/stands/monster_stand_mon001e_v1.png',
  'mon_002_e':       '/assets/monsters/stands/monster_stand_mon002e_v1.png',
  'mon_003_e':       '/assets/monsters/stands/monster_stand_mon003e_v1.png',
  'MON_GRASS_001_e': '/assets/monsters/stands/monster_stand_initial_01e_v1.png',
  // 進化形（火山ワールド）
  'mon_004_e':       '/assets/monsters/stands/monster_stand_mon004e_v1.png',
  'mon_005_e':       '/assets/monsters/stands/monster_stand_mon005e_v1.png',
  'mon_006_e':       '/assets/monsters/stands/monster_stand_mon006e_v1.png',
  'MON_FIRE_001_e':  '/assets/monsters/stands/monster_stand_initial_02e_v1.png',
  // 進化形（雪原ワールド）
  'mon_007_e':       '/assets/monsters/stands/monster_stand_mon007e_v1.png',
  'mon_008_e':       '/assets/monsters/stands/monster_stand_mon008e_v1.png',
  'mon_009_e':       '/assets/monsters/stands/monster_stand_mon009e_v1.png',
  'MON_ICE_001_e':   '/assets/monsters/stands/monster_stand_initial_03e_v1.png',
  // 進化形（レアA）
  'mon_010_e':       '/assets/monsters/stands/monster_stand_mon010e_v1.png',
  'mon_011_e':       '/assets/monsters/stands/monster_stand_mon011e_v1.png',
  'mon_012_e':       '/assets/monsters/stands/monster_stand_mon012e_v1.png',
  // 進化形（レアB）
  'mon_013_e':       '/assets/monsters/stands/monster_stand_mon013e_v1.png',
  'mon_014_e':       '/assets/monsters/stands/monster_stand_mon014e_v1.png',
  'mon_015_e':       '/assets/monsters/stands/monster_stand_mon015e_v1.png',
};

/** アイコン（小サイズ正方形）マップ */
const ICON_MAP: Record<string, string> = {
  // 初期主役候補
  MON_GRASS_001: '/assets/monsters/icons/monster_icon_initial_01_v1.png',
  MON_FIRE_001:  '/assets/monsters/icons/monster_icon_initial_02_v1.png',
  MON_ICE_001:   '/assets/monsters/icons/monster_icon_initial_03_v1.png',
  // 森ワールド
  mon_001: '/assets/monsters/icons/monster_icon_mon001_v1.png',
  mon_002: '/assets/monsters/icons/monster_icon_mon002_v1.png',
  mon_003: '/assets/monsters/icons/monster_icon_mon003_v1.png',
  // 砂漠ワールド
  mon_004: '/assets/monsters/icons/monster_icon_mon004_v1.png',
  mon_005: '/assets/monsters/icons/monster_icon_mon005_v1.png',
  mon_006: '/assets/monsters/icons/monster_icon_mon006_v1.png',
  // 雪原ワールド
  mon_007: '/assets/monsters/icons/monster_icon_mon007_v1.png',
  mon_008: '/assets/monsters/icons/monster_icon_mon008_v1.png',
  mon_009: '/assets/monsters/icons/monster_icon_mon009_v1.png',
  // レアキャラ（Aランク）
  mon_010: '/assets/monsters/icons/monster_icon_mon010_v1.png', // ヴァインドレイク
  mon_011: '/assets/monsters/icons/monster_icon_mon011_v1.png', // インフェルノリザード
  mon_012: '/assets/monsters/icons/monster_icon_mon012_v1.png', // グラシャルタイタン
  // レアキャラ（Bランク）
  mon_013: '/assets/monsters/icons/monster_icon_mon013_v1.png', // エンシェントドラゴン
  mon_014: '/assets/monsters/icons/monster_icon_mon014_v1.png', // マグナフェニックス
  mon_015: '/assets/monsters/icons/monster_icon_mon015_v1.png', // グレイシャーキング
  // 進化形（森ワールド）
  'mon_001_e':       '/assets/monsters/icons/monster_icon_mon001e_v1.png',
  'mon_002_e':       '/assets/monsters/icons/monster_icon_mon002e_v1.png',
  'mon_003_e':       '/assets/monsters/icons/monster_icon_mon003e_v1.png',
  'MON_GRASS_001_e': '/assets/monsters/icons/monster_icon_initial_01e_v1.png',
  // 進化形（火山ワールド）
  'mon_004_e':       '/assets/monsters/icons/monster_icon_mon004e_v1.png',
  'mon_005_e':       '/assets/monsters/icons/monster_icon_mon005e_v1.png',
  'mon_006_e':       '/assets/monsters/icons/monster_icon_mon006e_v1.png',
  'MON_FIRE_001_e':  '/assets/monsters/icons/monster_icon_initial_02e_v1.png',
  // 進化形（雪原ワールド）
  'mon_007_e':       '/assets/monsters/icons/monster_icon_mon007e_v1.png',
  'mon_008_e':       '/assets/monsters/icons/monster_icon_mon008e_v1.png',
  'mon_009_e':       '/assets/monsters/icons/monster_icon_mon009e_v1.png',
  'MON_ICE_001_e':   '/assets/monsters/icons/monster_icon_initial_03e_v1.png',
  // 進化形（レアA）
  'mon_010_e':       '/assets/monsters/icons/monster_icon_mon010e_v1.png',
  'mon_011_e':       '/assets/monsters/icons/monster_icon_mon011e_v1.png',
  'mon_012_e':       '/assets/monsters/icons/monster_icon_mon012e_v1.png',
  // 進化形（レアB）
  'mon_013_e':       '/assets/monsters/icons/monster_icon_mon013e_v1.png',
  'mon_014_e':       '/assets/monsters/icons/monster_icon_mon014e_v1.png',
  'mon_015_e':       '/assets/monsters/icons/monster_icon_mon015e_v1.png',
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
