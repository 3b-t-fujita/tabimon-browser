# タビモン ブラウザ版 — 技術仕様書

> バージョン: 2026-03-25
> 対象: tabimon-browser（Next.js App Router 実装）

---

## 1. 技術スタック

| 区分 | 技術 | バージョン |
|---|---|---|
| フレームワーク | Next.js (App Router) | 16.2.1 |
| UI ライブラリ | React | 19.2.4 |
| 言語 | TypeScript | 5.x |
| スタイリング | Tailwind CSS | 4.x |
| 状態管理 | Zustand | 5.0.12 |
| スキーマ検証 | Zod | 4.3.6 |
| ローカル DB | Dexie (IndexedDB ラッパー) | 4.3.0 |
| QR 生成 | qrcode | 1.5.4 |
| QR 読取 | jsqr | 1.4.0 |
| テスト | Vitest | 4.1.0 |
| デプロイ | Netlify (GitHub `main` 自動デプロイ) | — |

---

## 2. アーキテクチャ概要

クリーンアーキテクチャに基づき、**Domain / Application / Infrastructure / UI** の 4 層で構成する。
各層は内側方向にのみ依存し、外側への依存は禁止。

```
UI (components, app/)
    ↓ 呼び出し
Application (UseCases, ViewModels, Stores)
    ↓ 呼び出し
Domain (Entities, ValueObjects, Policies, BattleEngine)
    ↓ 呼び出し（リポジトリ経由）
Infrastructure (IndexedDB, MasterData JSON)
```

---

## 3. ディレクトリ構成

```
src/
├── app/                          # Next.js ページ（App Router）
├── components/                   # React コンポーネント
├── stores/                       # Zustand Store
├── application/
│   ├── adventure/                # 冒険系 UseCase
│   ├── result/                   # リザルト系 UseCase
│   ├── monsters/                 # モンスター系 UseCase
│   ├── qr/                       # QR 系 UseCase
│   ├── setup/                    # 初期設定系 UseCase
│   ├── shared/                   # 共通ヘルパー（labelHelpers 等）
│   └── viewModels/               # UI 向け ViewModel 定義
├── domain/
│   ├── entities/                 # エンティティ定義
│   ├── valueObjects/             # 値オブジェクト
│   ├── policies/                 # ビジネスルール
│   └── battle/                   # 戦闘エンジン
├── infrastructure/
│   ├── persistence/transaction/  # SaveTransactionService
│   ├── master/                   # マスターデータリポジトリ
│   └── assets/                   # 画像 URL 解決
├── common/
│   ├── constants/                # enums.ts, GameConstants.ts
│   ├── errors/                   # AppErrorCode.ts
│   └── results/                  # Result<T,E> 型
└── types/
    └── ids.ts                    # ブランド型 ID
```

---

## 4. ルーティング一覧

| URL | ページ | 役割 |
|---|---|---|
| `/` | Boot | セーブデータ確認・初期化処理・振り分け |
| `/setup` | InitialSetup | ワールド選択・相棒選択・プレイヤー名設定 |
| `/home` | Home | ホーム画面（冒険・編成・QR への入口） |
| `/monsters` | MonsterList | 仲間一覧・図鑑 |
| `/monsters/[id]` | MonsterDetail | 仲間詳細・相棒変更・手放し |
| `/party` | PartyEdit | 編成画面（助っ人選択） |
| `/adventure/stages` | StageSelect | ステージ選択 |
| `/adventure/confirm` | AdventureConfirm | 冒険開始確認 |
| `/adventure/play` | AdventurePlay | 冒険進行（ノード移動） |
| `/adventure/battle` | AdventureBattle | 戦闘画面 |
| `/adventure/result` | AdventureResult | リザルト・経験値・仲間候補 |
| `/adventure/candidate` | CandidateSelect | 候補受取・見送り |
| `/adventure/candidate/replace` | CandidateReplace | 仲間入替受取 |
| `/qr` | QrMenu | QR 機能メニュー |
| `/qr/generate` | QrGenerate | QR 生成 |
| `/qr/scan` | QrScan | QR 読取 |
| `/qr/confirm` | QrConfirm | QR 受取確認 |

---

## 5. エンティティ定義

### 5.1 Player

```typescript
interface Player {
  playerId:       PlayerId;      // UUID
  playerName:     string;        // 最大 10 文字
  worldId:        WorldId;       // 初期設定で選択・以降変更不可
  mainMonsterId:  MonsterId | null;
}
```

### 5.2 OwnedMonster（仲間）

```typescript
interface OwnedMonster {
  uniqueId:          MonsterId;
  monsterMasterId:   MonsterMasterId;
  displayName:       string;
  worldId:           WorldId;
  role:              RoleType;
  level:             number;          // 1 〜 30
  exp:               number;
  personality:       PersonalityType; // 入手時ランダム付与
  skillIds:          SkillId[];       // 最大 3 つ
  isMain:            boolean;
}
```

**制約**
- 上限 5 体
- 相棒設定中は手放し不可
- レベルアップ・進化あり
- QR 生成可

### 5.3 SupportMonster（助っ人）

```typescript
interface SupportMonster {
  supportId:                      string;
  sourceUniqueMonsterIdFromQr:    string;   // 重複判定キー
  monsterMasterId:                MonsterMasterId;
  displayName:                    string;
  worldId:                        WorldId;
  role:                           RoleType;
  level:                          number;   // 育成不可（固定）
  personality:                    PersonalityType;
  skillIds:                       SkillId[];
  registeredAt:                   string;   // ISO 8601
}
```

**制約**
- 上限 10 体
- 育成・相棒設定不可
- QR 生成不可

### 5.4 AdventureSession

```typescript
interface AdventureSession {
  sessionId:                    SessionId;
  stageId:                      StageId;
  currentNodeIndex:             number;
  partySnapshot:                PartySnapshot;
  battleCheckpointNodeIndex:    number;    // -1 = なし
  resultPendingFlag:            boolean;   // true = 報酬未反映
  status:                       AdventureSessionStatus;
  pendingResultType:            AdventureResultType | null;
  nextBattleBuffMultiplier:     number;    // 1.0 = 通常
  randomEventBattle:            boolean;
}
```

### 5.5 PendingCandidate（候補モンスター）

```typescript
interface PendingCandidate {
  candidateId:                          CandidateId;
  monsterMasterId:                      MonsterMasterId;
  sourceUniqueMonsterIdFromCandidate:   MonsterId;
  personalityId:                        PersonalityType;
  originSessionId:                      SessionId;
}
```

### 5.6 QrPayloadV1

```typescript
interface QrPayloadV1 {
  payloadVersion:                   'QR_V1';
  sourceUniqueMonsterIdFromQr:      string;
  monsterMasterId:                  string;
  displayName:                      string;
  worldId:                          string;
  roleId:                           string;
  personalityId:                    string;
  level:                            number;
  skillSnapshot:                    string;   // スキル ID を "|" 区切りで連結
  checksumHash:                     string;
}
```

---

## 6. 列挙型（enums.ts）

```typescript
enum WorldId {
  Forest  = 'WORLD_FOREST',
  Volcano = 'WORLD_VOLCANO',
  Ice     = 'WORLD_ICE',
}

enum RoleType {
  Attack  = 'ROLE_ATTACK',
  Guard   = 'ROLE_GUARD',
  Support = 'ROLE_SUPPORT',
}

enum PersonalityType {
  Brave    = 'PERSONALITY_BRAVE',
  Cautious = 'PERSONALITY_CAUTIOUS',
  Kind     = 'PERSONALITY_KIND',
  Hasty    = 'PERSONALITY_HASTY',
  Calm     = 'PERSONALITY_CALM',
  Whimsy   = 'PERSONALITY_WHIMSY',
}

enum NodeType {
  Pass   = 'NODE_PASS',
  Branch = 'NODE_BRANCH',
  Event  = 'NODE_EVENT',
  Battle = 'NODE_BATTLE',
  Boss   = 'NODE_BOSS',
  Goal   = 'NODE_GOAL',
}

enum AdventureResultType {
  Success = 'SUCCESS',
  Failure = 'FAILURE',
  Retire  = 'RETIRE',
}

enum AdventureSessionStatus {
  Idle               = 'IDLE',
  Active             = 'SESSION_ACTIVE',
  ActiveBattle       = 'SESSION_ACTIVE_BATTLE',
  PendingResult      = 'SESSION_PENDING_RESULT',
  Completed          = 'SESSION_COMPLETED',
}
```

---

## 7. ゲーム定数（GameConstants）

| 定数名 | 値 | 説明 |
|---|---|---|
| `OWNED_MONSTER_CAPACITY` | 5 | 仲間上限 |
| `SUPPORT_MONSTER_CAPACITY` | 10 | 助っ人上限 |
| `PARTY_MAX_SUPPORTS` | 2 | 編成時の助っ人最大数 |
| `MAX_LEVEL` | 30 | モンスター最大レベル |
| `BATTLE_TICK_SEC` | 0.5 | 戦闘 tick 間隔（秒） |
| `DEFENSE_COEFF` | 0.5 | 防御計算係数 |
| `DAMAGE_RAND_MIN` | 0.95 | ダメージ乱数下限 |
| `DAMAGE_RAND_MAX` | 1.05 | ダメージ乱数上限 |
| `MIN_DAMAGE` | 1 | 最低保証ダメージ |
| `HEAL_THRESHOLD` | 0.5 | 回復 AI 発火 HP 閾値 |
| `BUFF_MULTIPLIER_UP` | 1.2 | バフ上昇係数 |
| `BUFF_MULTIPLIER_DOWN` | 0.8 | デバフ低下係数 |
| `BUFF_DURATION_TURNS` | 3 | バフ持続ターン数 |
| `BATTLE_TIMEOUT_TICKS` | 200 | 戦闘タイムアウト（100 秒） |
| `EXP_COEFF_SUCCESS` | 1.0 | 成功時経験値係数 |
| `EXP_COEFF_FAILURE` | 0.5 | 失敗時経験値係数 |
| `EXP_COEFF_RETIRE` | 0.3 | リタイア時経験値係数 |
| `SKILL_UNLOCK_LEVEL_2` | 10 | 2 つ目スキル解放レベル |
| `SKILL_UNLOCK_LEVEL_3` | 20 | 3 つ目スキル解放レベル |
| `PLAYER_NAME_MAX_LENGTH` | 10 | プレイヤー名最大文字数 |

---

## 8. 戦闘エンジン（BattleTickEngine）

### 8.1 処理フロー

```
setInterval(0.5 秒)
└─ tick()
    ├─ 各 actor の actionTimer += 0.5
    ├─ actionTimer >= (1.0 / spd) に達した actor が行動
    ├─ プレイヤー指示スキル（pendingMainSkillId）優先
    ├─ AI 判定（下記優先順）
    └─ 勝敗判定 → outcome 更新
```

### 8.2 AI 優先順位

1. 回復スキル：味方に HP < 50% の者がいる場合
2. バフスキル：自分未バフ かつ シールド未展開の場合
3. デバフスキル：対象が未デバフの場合
4. 全体攻撃スキル
5. 単体攻撃スキル
6. 通常攻撃（スキルなし）

### 8.3 属性相性（3すくみ）

| 攻撃側 | 有利対象 | 倍率 |
|---|---|---|
| 森（Forest） | 氷（Ice） | ×1.1 |
| 氷（Ice） | 火（Volcano） | ×1.1 |
| 火（Volcano） | 森（Forest） | ×1.1 |
| 不利 | （上記の逆） | ×0.9 |

### 8.4 ダメージ計算式

```
rawDamage = max(1, (atk × atkMult - def × defMult × DEFENSE_COEFF) × typeMult × rand)
finalDamage = shieldActive ? floor(rawDamage × (1 - shieldReduction)) : rawDamage
```

### 8.5 シールド軽減率一覧

| スキル ID | スキル名 | 軽減率 |
|---|---|---|
| `skill_buff_001` | まもりのたて | 55% |
| `skill_def_001` | いわのよろい | 55% |
| `skill_def_002` | ブリザードアーマー | 65% |
| `skill_def_003` | グレイシャーウォール | 75% |

---

## 9. 永続化アーキテクチャ

### 9.1 IndexedDB スキーマ（`main_save` DB）

| ストア名 | キー | 説明 |
|---|---|---|
| `player` | playerId | プレイヤー情報（1 件） |
| `ownedMonsters` | uniqueId | 仲間モンスター（最大 5 件） |
| `supportMonsters` | supportId | 助っ人モンスター（最大 10 件） |
| `adventureSession` | sessionId | 冒険セッション（0〜1 件） |
| `progress` | — | ステージ解放・クリア履歴 |

### 9.2 SaveTransactionService

3 フェーズコミットで書き込み信頼性を確保。

```
Phase 1: TEMP_WRITING    — 一時領域に書き込み
Phase 2: TEMP_VALIDATING — 書き込み内容の検証
Phase 3: COMMITTING      — メイン領域へ原子的コミット
（失敗時）ROLLING_BACK   — 前状態へロールバック
```

---

## 10. QR 仕様

### 10.1 ペイロード形式

```
JSON → Base64 エンコード → QR コード（qrcode ライブラリ）
```

### 10.2 checksum 計算

以下フィールドを `|` 区切りで連結し、ハッシュ化。

```
payload_version | source_unique_monster_id | monster_master_id |
display_name | world_id | role_id | personality_id | level |
skill_snapshot | FIXED_SALT
```

### 10.3 受取検証順序（固定）

```
1. バージョン確認   (QR_VERSION_MISMATCH)
2. checksum 確認    (QR_CHECKSUM_INVALID)
3. 重複判定         (QR_DUPLICATE)
4. 容量チェック     (QR_OWNED_CAPACITY_FULL / QR_SUPPORT_CAPACITY_FULL)
```

---

## 11. ビジネスルール（Policies）

| Policy | 主要ルール |
|---|---|
| `OwnedCapacityPolicy` | 仲間上限 5 体。超過時は受取不可 |
| `SupportCapacityPolicy` | 助っ人上限 10 体。超過時は受取不可 |
| `MainMonsterPolicy` | 相棒設定中は手放し不可。仲間のみ相棒可 |
| `StageUnlockPolicy` | stageNo=1 は初期解放。前ステージクリアで次解放 |
| `QrReceivePolicy` | 同一 `sourceUniqueMonsterIdFromQr` の重複登録を仲間・助っ人横断で禁止 |

---

## 12. マスターデータ構成（`public/masters/`）

| ファイル | 内容 |
|---|---|
| `stages.json` | 9 ステージ定義（3 ワールド × 3 難度） |
| `monsters.json` | モンスター種別マスタ |
| `skills.json` | スキルマスタ |
| `node_patterns.json` | ステージのノード構成 |
| `enemy_groups.json` | 敵グループプール |
| `drop_candidates.json` | ドロップ候補プール |
| `level_exp.json` | レベル別経験値テーブル |
| `skill_learn_conditions.json` | スキル習得条件 |
| `events.json` | イベント定義 |

### ステージ構成

| stageId | ワールド | 難度 | 推奨 Lv | ベース経験値 |
|---|---|---|---|---|
| `stage_w1_1` | ミドリの森 | Easy | 1 | 30 |
| `stage_w1_2` | ミドリの森 | Normal | 8 | 70 |
| `stage_w1_3` | ミドリの森 | Hard | 16 | 120 |
| `stage_w2_1` | ホノオ火山 | Easy | 1 | 30 |
| `stage_w2_2` | ホノオ火山 | Normal | 8 | 70 |
| `stage_w2_3` | ホノオ火山 | Hard | 16 | 120 |
| `stage_w3_1` | コオリ氷原 | Easy | 1 | 30 |
| `stage_w3_2` | コオリ氷原 | Normal | 8 | 70 |
| `stage_w3_3` | コオリ氷原 | Hard | 16 | 120 |

---

## 13. ID 型（ブランド型）

型の取り違えを防ぐため TypeScript ブランド型を使用。

```typescript
type MonsterId         = string & { __brand: 'MonsterId' };
type MonsterMasterId   = string & { __brand: 'MonsterMasterId' };
type SessionId         = string & { __brand: 'SessionId' };
type StageId           = string & { __brand: 'StageId' };
type SkillId           = string & { __brand: 'SkillId' };
type CandidateId       = string & { __brand: 'CandidateId' };
type PlayerId          = string & { __brand: 'PlayerId' };
type WorldId           = string & { __brand: 'WorldId' };
```

変換は `toMonsterId(s: string): MonsterId` 等のファクトリ関数を使用。

---

## 14. Result 型

```typescript
type Result<T, E> =
  | { ok: true;  value: T }
  | { ok: false; errorCode: E; message?: string };
```

全 UseCase の戻り値は `Result<T, E>` で統一し、例外スローを排除。

---

## 15. ViewModel 一覧

| ViewModel | 主要フィールド | 生成 UseCase |
|---|---|---|
| `HomeViewModel` | playerName, mainMonster, ownedCount, canContinue | GetHomeViewModelUseCase |
| `BootViewModel` | destination, recoveryInfo, errorMessage | BootUseCase |
| `StageSelectViewModel` | stages[]: StageListItemViewModel | GetAvailableStagesUseCase |
| `AdventureConfirmViewModel` | stageId, difficulty, main, supports, canStart | GetAdventureConfirmViewStateUseCase |
| `OwnedMonsterListViewModel` | monsters[], count, capacity | GetOwnedMonstersUseCase |
| `OwnedMonsterDetailViewModel` | uniqueId, labels, stats, skills, isMain, canRelease | GetOwnedMonsterDetailUseCase |
| `PartyEditViewModel` | main, supportCandidates, selectedSupports | GetPartyEditViewModelUseCase |
| `InitialSetupViewModel` | worldOptions, starterMonsterOptions | GetInitialSetupViewModelUseCase |

---

## 16. Zustand Store 一覧

| Store | 主要状態 |
|---|---|
| `appUiStore` | isBooting, homeViewModel, bootViewModel |
| `monsterStore` | monsterList, monsterDetail, partyEdit, isSaving |
| `adventureStore` | stageSelect, adventureConfirm, isStarting |
| `adventurePlayStore` | session, currentNode, explorePhase, branchOptions |
| `battleStore` | battleState, battlePhase |
| `resultStore` | resultType, resultPhase, expGained, leveledUp |
| `qrStore` | phase, parsedPayload, errorMessage |

---

## 17. UI コンポーネント設計方針

### A/B パターン切替

一部の画面は `DESIGN_PATTERN: 'A' | 'B' | 'COMPARE'` による切替を実装。

| コンポーネント | 採用パターン |
|---|---|
| `OwnedMonsterDetailWrapper` | A（確定） |
| `BattleScreenWrapper` | B（確定） |
| `HomeScreenWrapper` | A（確定） |
| `AdventureConfirmWrapper` | A（確定） |

### ワールドテーマ

stageId の文字列から導出。

```typescript
const world =
  stageId.includes('_w1') ? 'forest' :
  stageId.includes('_w2') ? 'fire'   : 'ice';
```

| ワールド | アクセントカラー | 背景ダーク |
|---|---|---|
| ミドリの森 | `#10b981` | `#064e3b` |
| ホノオ火山 | `#f97316` | `#7c2d12` |
| コオリ氷原 | `#38bdf8` | `#0c4a6e` |

---

## 18. ゲームフロー（状態遷移）

```
Boot
 ├─ セーブなし     → /setup
 ├─ 復旧対象あり   → /home（Recovery Prompt 表示）
 └─ 通常           → /home

/home
 ├─ 冒険           → /adventure/stages → /adventure/confirm
 │                    → /adventure/play
 │                    ├─ Battle ノード → /adventure/battle → /adventure/play
 │                    └─ Goal/Retire  → /adventure/result
 │                                      ├─ 候補あり → /adventure/candidate
 │                                      └─ 候補なし → /home
 ├─ 図鑑           → /monsters → /monsters/[id]
 ├─ 編成           → /party
 └─ QR             → /qr → /qr/generate | /qr/scan → /qr/confirm
```

---

## 19. 二重反映防止設計

リザルト処理は以下の仕組みで二重反映を防止する。

1. セッションに `resultPendingFlag: true` をセット（冒険終了時）
2. `GetResultPendingStateUseCase` でフラグ確認
3. `FinalizeAdventureResultUseCase` 実行後に `resultPendingFlag: false` に更新
4. 再アクセス時に `resultPendingFlag: false` を検出 → `ResultAlreadyFinal` エラー → `/home` へリダイレクト

---

## 20. テスト構成

```
vitest + fake-indexeddb
├── domain/        — ビジネスロジック単体テスト
├── application/   — UseCase 単体テスト（IndexedDB モック）
└── infrastructure/— リポジトリテスト
```
