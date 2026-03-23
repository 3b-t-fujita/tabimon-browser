/**
 * ゲーム全体の固定定数。詳細設計 v4 §14 主要定数に準拠。
 * 独断変更禁止。設計書の確定値と一致させること。
 */
export const GameConstants = {
  // --- 所持・編成上限 ---
  OWNED_MONSTER_CAPACITY:   5,    // 仲間上限
  SUPPORT_MONSTER_CAPACITY: 10,   // 助っ人上限
  PARTY_MAX_SUPPORTS:       2,    // 編成助っ人上限
  MAX_LEVEL:                30,   // レベル上限

  // --- 戦闘 ---
  BATTLE_TICK_SEC:    0.5,  // 戦闘内部処理tick（秒）
  DEFENSE_COEFF:      0.5,  // 防御係数
  DAMAGE_RAND_MIN:    0.95, // ダメージ乱数下限
  DAMAGE_RAND_MAX:    1.05, // ダメージ乱数上限
  MIN_DAMAGE:         1,    // 最低保証ダメージ
  MIN_HEAL:           1,    // 最低保証回復量
  HEAL_THRESHOLD:     0.5,  // 回復AIが発火するHP割合閾値（50%未満）
  BUFF_MULTIPLIER_UP: 1.2,  // バフ上昇係数
  BUFF_MULTIPLIER_DOWN: 0.8,// デバフ低下係数
  BUFF_DURATION_TURNS: 3,   // バフ持続ターン数相当

  // --- リザルト経験値補正係数 ---
  EXP_COEFF_SUCCESS: 1.0,
  EXP_COEFF_FAILURE: 0.5,
  EXP_COEFF_RETIRE:  0.3,

  // --- スキル解放レベル ---
  SKILL_UNLOCK_LEVEL_2: 10, // 2つ目スキル解放
  SKILL_UNLOCK_LEVEL_3: 20, // 3つ目スキル解放

  // --- QR ---
  QR_PAYLOAD_VERSION:     'QR_V1',
  QR_CHECKSUM_SEPARATOR:  '|',  // checksum連結区切り文字

  // --- プレイヤー名 ---
  PLAYER_NAME_MAX_LENGTH: 10,
} as const;

export type GameConstants = typeof GameConstants;
