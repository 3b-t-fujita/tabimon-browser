# タビモン ゲームシステム仕様書

> バージョン: 2026-03-25
> 対象: tabimon-browser（Next.js 16.2.1 / App Router）

---

## 目次

1. [システム概要](#1-システム概要)
2. [技術スタック](#2-技術スタック)
3. [エンティティ仕様](#3-エンティティ仕様)
4. [マスタデータ仕様](#4-マスタデータ仕様)
5. [戦闘システム仕様](#5-戦闘システム仕様)
6. [冒険システム仕様](#6-冒険システム仕様)
7. [リザルトシステム仕様](#7-リザルトシステム仕様)
8. [進化システム仕様](#8-進化システム仕様)
9. [画像リソース仕様](#9-画像リソース仕様)
10. [定数一覧](#10-定数一覧)

---

## 1. システム概要

タビモン（TabiMon）はブラウザ上で動作するモンスター育成・冒険RPGである。
QRコードによるモンスター交換機能を持ち、プレイヤーは仲間モンスターを育成しながらステージを攻略する。

### 1.1 主要機能

| 機能 | 概要 |
|------|------|
| 初期設定 | プレイヤー名・出身ワールド・主役モンスター選択 |
| 冒険 | ステージ選択 → ノード進行 → 戦闘 → リザルト |
| 仲間管理 | 一覧・詳細・主役設定・手放し |
| 編成 | 主役 + 助っ人最大2体のパーティ編成 |
| QRコード | モンスターをQRコードとして出力し他プレイヤーへ共有 |
| 図鑑 | 全モンスターの閲覧（未入手はシルエット） |

### 1.2 ワールド構成

| worldId | 名称 | 特徴 |
|---------|------|------|
| 1 | 森ワールド | 緑・草・自然系 |
| 2 | 砂漠（火山）ワールド | 火・炎系 |
| 3 | 雪原ワールド | 氷・雪系 |

---

## 2. 技術スタック

| 分類 | 技術 |
|------|------|
| フレームワーク | Next.js 16.2.1（App Router） |
| 言語 | TypeScript |
| 状態管理 | Zustand（UI state）|
| 永続化 | IndexedDB / Dexie |
| スタイリング | Tailwind CSS |
| 画像形式 | WebP（Pillow変換済み、95枚） |
| デプロイ | Netlify（GitHub連携） |

### 2.1 アーキテクチャ方針

- **Clean Architecture**：Domain → Application → Infrastructure の層構造
- UseCaseはドメインロジックを持ち、コンポーネントはUI・イベント発火のみ担当
- マスタデータはJSONファイル（`/public/masters/`）で管理

---

## 3. エンティティ仕様

### 3.1 Player

```
playerId       : PlayerId (UUID)
playerName     : string (最大10文字)
worldId        : WorldId (初期設定後不変)
mainMonsterId  : MonsterId | null
```

### 3.2 OwnedMonster

```
uniqueId         : MonsterId (UUID)
monsterMasterId  : MonsterMasterId
displayName      : string
worldId          : WorldId (進化時に更新される場合あり)
role             : RoleType
level            : number (1〜MAX_LEVEL=30)
exp              : number
personality      : PersonalityType (入手時ランダム、変更不可)
skillIds         : SkillId[] (最大3つ、Lv1/10/20で解放)
isMain           : boolean
```

### 3.3 AdventureSession

```
sessionId                  : SessionId (UUID)
stageId                    : StageId
currentNodeIndex           : number
partySnapshot              : PartySnapshot (開始時に固定)
battleCheckpointNodeIndex  : number (-1=非戦闘中)
resultPendingFlag          : boolean
status                     : AdventureSessionStatus
pendingResultType          : AdventureResultType | null
nextBattleBuffMultiplier   : number (通常1.0、BOOST時1.2)
randomEventBattle          : boolean (イベント起因の戦闘フラグ)
```

#### AdventureSessionStatus

| 値 | 意味 |
|----|------|
| `IDLE` | セッションなし |
| `SESSION_ACTIVE` | 冒険進行中 |
| `SESSION_ACTIVE_BATTLE` | 戦闘中 |
| `SESSION_PENDING_RESULT` | リザルト確定待ち |
| `SESSION_COMPLETED` | 完了 |

### 3.4 BattleActor

```
id                   : string
monsterId            : MonsterMasterId
displayName          : string
isEnemy              : boolean
isMain               : boolean
worldId              : number (属性相性計算用)
currentHp            : number
maxHp                : number
baseAtk / baseDef / baseSpd
atkMultiplier        : number (バフ/デバフ適用後)
defMultiplier        : number
buffTurnsRemaining   : number (999=シールドのセンチネル値)
shieldHitsRemaining  : number
damageReductionRate  : number
actionTimer          : number
skills               : BattleSkill[]
```

### 3.5 PartyMemberSnapshot

冒険開始時に OwnedMonster の状態を固定化したオブジェクト。

```
uniqueId         : MonsterId
monsterMasterId  : MonsterMasterId
displayName      : string
personality      : PersonalityType
stats            : { maxHp, atk, def, spd }
skills           : SkillId[]
isMain           : boolean
worldId          : number
```

---

## 4. マスタデータ仕様

### 4.1 モンスターマスタ（`/public/masters/monsters.json`）

全36体（通常18体 + 進化形18体）

#### 通常形態（初期3体・森3体・火3体・氷3体・レアA3体・レアB3体）

| monsterMasterId | displayName | worldId | role | baseHp | baseAtk | baseDef | baseSpd | hpG | atkG | defG | spdG | dropRate | evolvesTo |
|-----------------|-------------|---------|------|--------|---------|---------|---------|-----|------|------|------|----------|-----------|
| MON_GRASS_001 | グリーニョ | 1 | Support | 90 | 16 | 12 | 14 | 7 | 2 | 2 | 1 | 0.4 | MON_GRASS_001_e |
| MON_FIRE_001 | フレイム | 2 | Attack | 80 | 22 | 9 | 15 | 6 | 3 | 1 | 1 | 0.4 | MON_FIRE_001_e |
| MON_ICE_001 | フロスト | 3 | Guard | 100 | 14 | 17 | 11 | 8 | 1 | 3 | 0 | 0.4 | MON_ICE_001_e |
| mon_001 | モリドラゴン | 1 | Support | 100 | 20 | 15 | 12 | 8 | 2 | 2 | 1 | 0.4 | mon_001_e |
| mon_002 | ミドリウルフ | 1 | Attack | 85 | 25 | 10 | 16 | 7 | 3 | 1 | 1 | 0.45 | mon_002_e |
| mon_003 | コケゴーレム | 1 | Guard | 115 | 13 | 20 | 8 | 10 | 1 | 3 | 0 | 0.5 | mon_003_e |
| mon_004 | ホムラサラマンダ | 2 | Attack | 90 | 28 | 9 | 14 | 7 | 4 | 1 | 1 | 0.4 | mon_004_e |
| mon_005 | バーンフェニックス | 2 | Attack | 80 | 35 | 8 | 16 | 6 | 5 | 1 | 1 | 0.45 | mon_005_e |
| mon_006 | マグマロック | 2 | Guard | 120 | 11 | 22 | 7 | 11 | 1 | 4 | 0 | 0.5 | mon_006_e |
| mon_007 | コオリウィング | 3 | Attack | 85 | 26 | 11 | 17 | 7 | 3 | 1 | 1 | 0.4 | mon_007_e |
| mon_008 | フリーズベア | 3 | Guard | 110 | 14 | 19 | 9 | 9 | 1 | 3 | 0 | 0.45 | mon_008_e |
| mon_009 | ブリザードフォックス | 3 | Support | 95 | 18 | 13 | 15 | 8 | 2 | 2 | 1 | 0.5 | mon_009_e |
| mon_010 | ヴァインドレイク | 1 | Attack | 110 | 40 | 14 | 18 | 9 | 5 | 2 | 1 | 0.05 | mon_010_e |
| mon_011 | インフェルノリザード | 2 | Attack | 100 | 45 | 12 | 20 | 8 | 6 | 1 | 1 | 0.05 | mon_011_e |
| mon_012 | グラシャルタイタン | 3 | Guard | 135 | 17 | 38 | 10 | 12 | 1 | 5 | 0 | 0.05 | mon_012_e |
| mon_013 | エンシェントドラゴン | 1 | Attack | 125 | 46 | 18 | 20 | 10 | 6 | 2 | 1 | 0.05 | mon_013_e |
| mon_014 | マグナフェニックス | 2 | Attack | 115 | 50 | 14 | 22 | 9 | 7 | 1 | 1 | 0.05 | mon_014_e |
| mon_015 | グレイシャーキング | 3 | Guard | 150 | 16 | 39 | 12 | 14 | 1 | 5 | 0 | 0.05 | mon_015_e |

> G = Growth（レベルアップ時の増加量）

#### 進化形態（ベースステータス × 1.1、端数四捨五入）

| monsterMasterId | displayName |
|-----------------|-------------|
| MON_GRASS_001_e | グランドグリーニョ |
| MON_FIRE_001_e | フレイムアーム |
| MON_ICE_001_e | フロストアーマー |
| mon_001_e | グランドラゴン |
| mon_002_e | エメラルドウルフ |
| mon_003_e | ジャイアントゴーレム |
| mon_004_e | ブレイズサラマンダ |
| mon_005_e | インフェルノフェニックス |
| mon_006_e | マグマタイタン |
| mon_007_e | フロストウィング |
| mon_008_e | グレイシャーベア |
| mon_009_e | ポーラーフォックス |
| mon_010_e | ヴァインオーバーロード |
| mon_011_e | インフェルノタイラント |
| mon_012_e | ブリザードコロッサス |
| mon_013_e | プライマルドラゴン |
| mon_014_e | アポカリプスフェニックス |
| mon_015_e | グレイシャーエンペラー |

### 4.2 スキルマスタ（`/public/masters/skills.json`）

| skillId | displayName | skillType | power | cooldown(秒) | 対象 | 効果 |
|---------|-------------|-----------|-------|------------|------|------|
| skill_atk_001 | かみつく | ATTACK | 1.2 | 4.0 | 単体 | — |
| skill_atk_002 | ファイアブレス | ATTACK | 1.5 | 5.0 | 単体 | — |
| skill_atk_003 | こおりのツメ | ATTACK | 1.3 | 4.5 | 単体 | — |
| skill_atk_004 | たいあたり | ATTACK | 1.1 | 3.5 | 単体 | — |
| skill_atk_005 | ドラゴンバイト | ATTACK | 1.6 | 5.5 | 単体 | — |
| skill_atk_006 | マグマストライク | ATTACK | 1.65 | 5.5 | 単体 | — |
| skill_atk_007 | ブリザードクロー | ATTACK | 1.58 | 5.0 | 単体 | — |
| skill_atk_008 | ドラゴンクロー | ATTACK | 1.73 | 5.0 | 単体 | — |
| skill_atk_009 | インフェルノバースト | ATTACK | 1.88 | 5.5 | 単体 | — |
| skill_atk_010 | エンシェントファング | ATTACK | 1.95 | 5.0 | 単体 | 最強単体攻撃 |
| skill_atk_all_001 | ほのおのたつまき | ATTACK_ALL | 0.8 | 7.0 | 全体 | 敵全体 |
| skill_heal_001 | いやしのひかり | HEAL | 0.8 | 6.0 | 単体 | 味方回復 |
| skill_heal_002 | だいかいふく | HEAL | 1.5 | 10.0 | 単体 | 強力回復 |
| skill_buff_001 | まもりのたて | BUFF | — | 12.0 | 自分 | DEFシールド(軽減率45%、2被弾) |
| skill_buff_002 | ちからだめ | BUFF | — | 8.0 | 自分 | ATK×1.2 (3ターン) |
| skill_buff_003 | こうそくいどう | BUFF | — | 8.0 | 自分 | SPDバフ |
| skill_debuff_001 | こおりのいき | DEBUFF | — | 6.0 | 単体 | 敵ATK×0.8 (3ターン) |
| skill_def_001 | いわのよろい | BUFF | — | 14.0 | 自分 | DEFシールド(軽減率45%、2被弾) |
| skill_def_002 | ブリザードアーマー | BUFF | — | 16.0 | 自分 | DEFシールド(軽減率55%、2被弾) |
| skill_def_003 | グレイシャーウォール | BUFF | — | 20.0 | 自分 | DEFシールド(軽減率65%、2被弾) |

### 4.3 ステージマスタ（`/public/masters/stages.json`）

| stageId | worldId | No | 難易度 | 推奨Lv | baseExp | 解放先 |
|---------|---------|----|---------|---------|---------|----|
| stage_w1_1 | 1 | 1 | Easy | 1 | 30 | stage_w1_2 |
| stage_w1_2 | 1 | 2 | Normal | 8 | 70 | stage_w1_3 |
| stage_w1_3 | 1 | 3 | Hard | 16 | 120 | — |
| stage_w2_1 | 2 | 1 | Easy | 1 | 30 | stage_w2_2 |
| stage_w2_2 | 2 | 2 | Normal | 8 | 70 | stage_w2_3 |
| stage_w2_3 | 2 | 3 | Hard | 16 | 120 | — |
| stage_w3_1 | 3 | 1 | Easy | 1 | 30 | stage_w3_2 |
| stage_w3_2 | 3 | 2 | Normal | 8 | 70 | stage_w3_3 |
| stage_w3_3 | 3 | 3 | Hard | 16 | 120 | — |

### 4.4 ノードパターン（`/public/masters/node_patterns.json`）

| パターンID | stageNo | ノード構成 | ノード数 |
|-----------|---------|-----------|---------|
| w*_1 (Easy) | 1 | PASS → EVENT → BATTLE → EVENT → EVENT → BOSS | 6 |
| w*_2 (Normal) | 2 | PASS → EVENT → BATTLE → EVENT → BATTLE → EVENT → BOSS | 7 |
| w*_3 (Hard) | 3 | PASS → EVENT → BATTLE → EVENT → BATTLE → EVENT → BATTLE → EVENT → BOSS | 9 |

#### ノード種別

| NodeType | 内容 |
|----------|------|
| NODE_PASS | 通過（自動） |
| NODE_EVENT | ランダムイベント（HEAL/NOTHING/BOOST/BATTLE） |
| NODE_BATTLE | 通常戦闘 |
| NODE_BOSS | ボス戦（クリアでリザルトへ） |

---

## 5. 戦闘システム仕様

### 5.1 基本定数

| 定数 | 値 | 説明 |
|------|-----|------|
| TICK_SEC | 0.5秒 | 1ティックの長さ |
| BUFF_TURNS | 3 | バフ/デバフ継続ターン数 |
| BUFF_MULTIPLIER | 1.2 | ATKバフ倍率 |
| DEBUFF_MULTIPLIER | 0.8 | ATKデバフ倍率 |
| HEAL_THRESHOLD | 0.5 | HP50%未満で回復優先 |
| SHIELD_HITS | 2 | シールド耐久回数 |
| BATTLE_TIMEOUT_TICKS | 200 | 強制終了（100秒） |

### 5.2 属性相性（3すくみ）

```
森(1) → 氷(3)  ：攻撃側有利、ダメージ × 1.1
氷(3) → 火(2)  ：攻撃側有利、ダメージ × 1.1
火(2) → 森(1)  ：攻撃側有利、ダメージ × 1.1
逆方向         ：攻撃側不利、ダメージ × 0.9
同属性 or 無関係：ダメージ × 1.0
```

### 5.3 ダメージ計算式

```
base   = attackerATK × power − defenderDEF × 0.5
rand   = 0.95 + Math.random() × 0.1          // ±5%乱数
dmg    = floor(max(1, base) × rand × typeMult)

シールド適用時:
  dmg    = floor(dmg × (1.0 − damageReductionRate))
  shieldHitsRemaining -= 1
  shieldHitsRemaining == 0 のとき: シールド全フィールドリセット
```

#### 通常攻撃の power = 1.0

### 5.4 回復計算式

```
heal = max(1, floor(healerATK × power))
対象HP += heal（上限: maxHp）
```

### 5.5 シールドシステム

| スキル | 軽減率 | 耐久 | センチネル |
|--------|--------|------|-----------|
| まもりのたて / いわのよろい | 45% | 2被弾 | buffTurnsRemaining=999 |
| ブリザードアーマー | 55% | 2被弾 | buffTurnsRemaining=999 |
| グレイシャーウォール | 65% | 2被弾 | buffTurnsRemaining=999 |

- `buffTurnsRemaining=999` はシールド専用センチネル値（tick経過によるデクリメント対象外）
- AIは `buffTurnsRemaining==0 AND shieldHitsRemaining==0` のとき防御スキルを再使用する

### 5.6 行動順序

```
行動タイマー加算: actionTimer += TICK_SEC (0.5秒/tick)
行動閾値:        threshold = 20.0 / SPD
行動可能条件:    actionTimer >= threshold

同一tick内の発動順:
  1. SPD 降順
  2. 主役（isMain=true）優先
  3. パーティ → 敵
```

### 5.7 AI 行動優先順位

1. 回復スキル保有 AND 味方HP < HEAL_THRESHOLD（CAUTIOUS性格は 0.6）→ 最低HPの味方を回復
2. バフスキル保有 AND `buffTurnsRemaining==0 AND shieldHitsRemaining==0` → 自分にバフ
3. デバフスキル保有 AND 敵にデバフなし → 最低HPの敵にデバフ
4. 全体攻撃スキル保有 AND クールダウン済 → 敵全体攻撃
5. 単体攻撃スキル保有 AND クールダウン済 → 最低HPの敵を攻撃
6. 通常攻撃（デフォルト）

### 5.8 敵ステータス算出

```
ENEMY_STRENGTH_MULTIPLIER = 0.95（基準）

adjHp  = max(1, round(baseHp × strengthMult))
adjAtk = max(1, round(baseAtk × strengthMult))
adjDef = max(1, round(baseDef × strengthMult))
spd    = maseterのbaseSpd（倍率適用なし）

レアエンカウント補正:
  通常戦闘 × 0.95
  イベント起因戦闘 × 0.95 × 0.7 = 0.665
```

### 5.9 レアエンカウント確率

| stageNo | レアA率 | レアB率 |
|---------|---------|---------|
| 1 (Easy) | 5% | 1% |
| 2 (Normal) | 10% | 3% |
| 3 (Hard) | 15% | 5% |

---

## 6. 冒険システム仕様

### 6.1 冒険開始条件

- 主役モンスターが設定されていること
- 進行中のセッションがないこと（またはリタイア済み）

### 6.2 パーティ編成

```
構成: 主役(1体) + 助っ人(最大2体) = 最大3体
ステータス: OwnedMonsterのlevel × マスタgrowthで計算
固定化: 冒険開始時にPartySnapshotとして保存（冒険中は変更不可）
```

### 6.3 ノード進行フロー

```
SESSION_ACTIVE（冒険中）
  ↓ ノード種別判定
  ├─ NODE_PASS    → 自動通過 → 次ノードへ
  ├─ NODE_EVENT   → resolveAdventureEventUseCase
  │   ├─ HEAL (30%)   → テキスト表示 → 次ノードへ
  │   ├─ NOTHING (30%) → テキスト表示 → 次ノードへ
  │   ├─ BOOST (20%)  → nextBattleBuffMultiplier=1.2 → 次ノードへ
  │   └─ BATTLE (20%) → randomEventBattle=true → SESSION_ACTIVE_BATTLE
  ├─ NODE_BATTLE  → SESSION_ACTIVE_BATTLE
  └─ NODE_BOSS    → SESSION_ACTIVE_BATTLE（isBoss=true）

SESSION_ACTIVE_BATTLE（戦闘中）
  ↓ applyBattleResultUseCase
  ├─ WIN
  │   ├─ randomEventBattle=true → EVENT後のノードへ
  │   ├─ isBoss=true → SESSION_PENDING_RESULT (SUCCESS)
  │   └─ 通常 → 次ノードへ → SESSION_ACTIVE
  └─ LOSE → SESSION_PENDING_RESULT (FAILURE)

SESSION_PENDING_RESULT
  ↓ finalizeAdventureResultUseCase
  → SESSION_COMPLETED
```

### 6.4 BOOST効果の適用

```
nextBattleBuffMultiplier = 1.2 のとき:
  パーティ全員の HP/ATK/DEF/SPD × 1.2（小数切り捨て）
  適用後リセット: nextBattleBuffMultiplier = 1.0
```

---

## 7. リザルトシステム仕様

### 7.1 経験値計算

```
finalExp = baseExp × 結果補正係数

結果補正係数:
  SUCCESS : 1.0
  FAILURE : 0.5
  RETIRE  : 0.3

baseExp（ステージ別）:
  Easy   : 30
  Normal : 70
  Hard   : 120
```

### 7.2 レベルアップ

```
必要経験値: level × 10（例: Lv1→2 は10EXP必要）

レベルアップ時のステータス上昇:
  hpGain  = hpGrowth（モンスター種別固有）
  atkGain = atkGrowth
  defGain = defGrowth
  spdGain = spdGrowth

上限: MAX_LEVEL = 30
```

### 7.3 ステージ解放

- SUCCESS時のみ解放
- `stage.unlockStageId` に指定されたステージを解放

---

## 8. 進化システム仕様

### 8.1 進化条件

```
oldLevel < 15 AND newLevel >= 15
（レベルアップによってLv15に到達した瞬間に一度だけ発動）
```

### 8.2 進化処理

```
1. monsters.json の evolvesTo フィールドで進化先IDを取得
2. OwnedMonster の monsterMasterId を進化先IDに更新
3. displayName を進化先の名前に更新
4. worldId を進化先の worldId に更新
5. リザルト画面に進化演出を表示
```

### 8.3 ステータス変化

```
進化形のベースステータス = 進化前のベースステータス × 1.1（四捨五入）
growthは進化形のマスタ値を使用（同様に1.1倍）
```

---

## 9. 画像リソース仕様

### 9.1 ファイル形式

全画像はWebP形式（PNGから変換済み）。平均96%のファイルサイズ削減。

### 9.2 ディレクトリ構成

```
public/assets/
  ├─ backgrounds/          # 背景画像（6枚）
  │   ├─ bg_home_main_v1.webp
  │   ├─ bg_result_retire_v1.webp
  │   ├─ bg_title_main_v1.webp
  │   ├─ world_desert_bg_v1.webp
  │   ├─ world_forest_bg_v1.webp
  │   └─ world_snow_bg_v1.webp
  ├─ monsters/
  │   ├─ stands/           # 立ち絵（36枚、命名: monster_stand_{id}_v1.webp）
  │   └─ icons/            # アイコン（36枚、命名: monster_icon_{id}_v1.webp）
  ├─ result/               # リザルトUI（4枚）
  └─ ui/
      └─ icons/            # UIアイコン（13枚）
```

### 9.3 命名規則

| 種類 | 命名パターン | 例 |
|------|------------|-----|
| 立ち絵（通常） | `monster_stand_{masterId}_v1.webp` | `monster_stand_mon001_v1.webp` |
| 立ち絵（初期モン） | `monster_stand_initial_{01-03}_v1.webp` | `monster_stand_initial_01_v1.webp` |
| 立ち絵（進化形） | `monster_stand_{masterId}e_v1.webp` | `monster_stand_mon001e_v1.webp` |
| アイコン | 同上（`stands` → `icons`、`stand` → `icon`） | `monster_icon_mon001_v1.webp` |

### 9.4 next/image 運用方針

- 全コンポーネントで `next/image` の `<Image>` を使用
- `next.config.ts` に `images.unoptimized: true` を設定（静的WebPを直接配信）
- ヒーローバナーのモンスター立ち絵には `priority` を設定（LCPの早期読み込み）

---

## 10. 定数一覧

### 10.1 ゲーム定数（`GameConstants.ts`）

| 定数名 | 値 | 説明 |
|--------|-----|------|
| OWNED_MONSTER_CAPACITY | 5 | 仲間の所持上限 |
| SUPPORT_MONSTER_CAPACITY | 10 | 助っ人の所持上限 |
| PARTY_MAX_SUPPORTS | 2 | パーティ助っ人上限 |
| MAX_LEVEL | 30 | 最大レベル |
| SKILL_UNLOCK_LEVEL_2 | 10 | 2番目のスキル解放レベル |
| SKILL_UNLOCK_LEVEL_3 | 20 | 3番目のスキル解放レベル |
| BATTLE_TICK_SEC | 0.5 | バトルティック秒数 |
| DEFENSE_COEFF | 0.5 | 防御力係数 |
| DAMAGE_RAND_MIN | 0.95 | ダメージ乱数最小 |
| DAMAGE_RAND_MAX | 1.05 | ダメージ乱数最大 |
| MIN_DAMAGE | 1 | 最低ダメージ |
| MIN_HEAL | 1 | 最低回復量 |
| BUFF_MULTIPLIER_UP | 1.2 | バフ倍率 |
| BUFF_MULTIPLIER_DOWN | 0.8 | デバフ倍率 |
| BUFF_DURATION_TURNS | 3 | バフ継続ターン数 |
| EXP_COEFF_SUCCESS | 1.0 | 成功時EXP補正 |
| EXP_COEFF_FAILURE | 0.5 | 失敗時EXP補正 |
| EXP_COEFF_RETIRE | 0.3 | リタイア時EXP補正 |

### 10.2 列挙型（`enums.ts`）

```typescript
WorldId:        WORLD_FOREST(1), WORLD_VOLCANO(2), WORLD_ICE(3)
RoleType:       ROLE_ATTACK(1), ROLE_GUARD(2), ROLE_SUPPORT(3)
SkillType:      ATTACK(1), ATTACKALL(2), HEAL(3), BUFF(4), DEBUFF(5)
PersonalityType: BRAVE, CAUTIOUS, KIND, HASTY, CALM, WHIMSY
NodeType:       NODE_PASS, NODE_EVENT, NODE_BATTLE, NODE_BOSS
AdventureResultType: SUCCESS, FAILURE, RETIRE
AdventureSessionStatus: IDLE, SESSION_ACTIVE, SESSION_ACTIVE_BATTLE,
                        SESSION_PENDING_RESULT, SESSION_COMPLETED
```
