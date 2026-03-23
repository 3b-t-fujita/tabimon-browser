# タビモン ブラウザ版 フェーズ1 完了メモ

## 起動方法

```bash
cd tabimon-browser
npm install
npm run dev
# → http://localhost:3000 で Next.js のデフォルト画面が表示されます
```

## フェーズ1 時点で何が動くか

フェーズ1 はコア型の土台作成フェーズです。
画面は Next.js のデフォルト画面のみです。
以下の TypeScript 型定義が完成しており、`npx tsc --noEmit` でコンパイルエラーゼロを確認済みです。

### 完成しているもの

| カテゴリ | ファイル |
|---|---|
| 共通型 | `src/common/results/Result.ts` |
| エラーコード | `src/common/errors/AppErrorCode.ts` |
| ゲーム定数 | `src/common/constants/GameConstants.ts` |
| Enum定義 | `src/common/constants/enums.ts` |
| ID型 | `src/types/ids.ts` |
| AdventureSession | `src/domain/entities/AdventureSession.ts` |
| AdventureResult | `src/domain/entities/AdventureResult.ts` |
| Player | `src/domain/entities/Player.ts` |
| OwnedMonster | `src/domain/entities/OwnedMonster.ts` |
| SupportMonster | `src/domain/entities/SupportMonster.ts` |
| PendingCandidate | `src/domain/entities/PendingCandidate.ts` |
| QrPayload | `src/domain/entities/QrPayload.ts` |
| MonsterStats | `src/domain/valueObjects/MonsterStats.ts` |
| SkillSnapshot | `src/domain/valueObjects/SkillSnapshot.ts` |
| PartyMemberSnapshot | `src/domain/valueObjects/PartyMemberSnapshot.ts` |
| PartySnapshot | `src/domain/valueObjects/PartySnapshot.ts` |
| MainMonsterPolicy | `src/domain/policies/MainMonsterPolicy.ts` |
| OwnedCapacityPolicy | `src/domain/policies/OwnedCapacityPolicy.ts` |
| SupportCapacityPolicy | `src/domain/policies/SupportCapacityPolicy.ts` |
| QrReceivePolicy | `src/domain/policies/QrReceivePolicy.ts` |
| StageUnlockPolicy | `src/domain/policies/StageUnlockPolicy.ts` |
| SaveConsistencyChecker | `src/domain/services/SaveConsistencyChecker.ts` |
| QrChecksumService | `src/domain/services/QrChecksumService.ts` |
| SaveTransactionPort | `src/application/ports/SaveTransactionPort.ts` |
| SaveRepositoryPort | `src/application/ports/SaveRepositoryPort.ts` |
| SaveModels（main/temp） | `src/infrastructure/storage/models.ts` |
| Dexieスキーマ雛形 | `src/infrastructure/db/schema.ts` |
| マスタJSONデータ | `public/masters/*.json`（7ファイル） |

### 守られている仕様

- `AdventureSession` に `battleCheckpointNodeIndex` / `resultPendingFlag` / `partySnapshot` が揃っている
- `QrReceivePolicy` が上限時に**単純拒否**（`QR_OWNED_CAPACITY_FULL` / `QR_SUPPORT_CAPACITY_FULL`）
- `SaveTransactionPort` が temp書き込み → 検証 → main反映 → temp削除 の4段階をインターフェースで表現している
- QR検証順: version → checksum → duplicate がコメントで明示されている
- `domain/` は React・Zustand に依存していない

## まだ未実装のもの

- IndexedDB（Dexie）の CRUD 本実装 → フェーズ2
- Repository の Dexie 実装 → フェーズ2
- SaveTransactionService の本実装 → フェーズ2
- 復旧判定ロジック（RecoveryJudge） → フェーズ2
- 画面コンポーネント（タイトル/ホーム/冒険/リザルト等） → フェーズ3以降
- Zustand store → フェーズ3以降
- QRカメラ読取 → フェーズ9
- 戦闘エンジン（BattleEngine） → フェーズ7

## フェーズ2で最初にやること

`claude_code_browser_migration_phase2_instruction.md` を読んで着手する。

- `infrastructure/db/` に Dexie CRUD 実装を追加する
- `infrastructure/storage/SaveTransactionService.ts` を実装する
  - temp_save 書込 → 検証 → main_save 反映 → temp 削除 の4段階フローを実装
  - 失敗時は main_save を汚さない
- 各 Repository の Dexie 実装を追加する
- 起動時の復旧判定ロジックを実装する（`SaveConsistencyChecker` を使用）

## ファイル構成

```
tabimon-browser/
  browser_migration_inventory.md  ← 棚卸し表
  browser_phase1_scope.md         ← 作業範囲定義書
  README_browser_phase1.md        ← 本ファイル
  src/
    common/
      results/Result.ts
      errors/AppErrorCode.ts
      constants/GameConstants.ts
      constants/enums.ts
    types/ids.ts
    domain/
      entities/
        AdventureSession.ts
        AdventureResult.ts
        Player.ts
        OwnedMonster.ts
        SupportMonster.ts
        PendingCandidate.ts
        QrPayload.ts
      valueObjects/
        MonsterStats.ts
        SkillSnapshot.ts
        PartyMemberSnapshot.ts
        PartySnapshot.ts
      policies/
        MainMonsterPolicy.ts
        OwnedCapacityPolicy.ts
        SupportCapacityPolicy.ts
        QrReceivePolicy.ts
        StageUnlockPolicy.ts
      services/
        SaveConsistencyChecker.ts
        QrChecksumService.ts
    application/
      ports/
        SaveTransactionPort.ts
        SaveRepositoryPort.ts
    infrastructure/
      storage/models.ts
      db/schema.ts
  public/
    masters/
      monsters.json
      skills.json
      stages.json
      level_exp.json
      skill_learn_conditions.json
      events.json
      drop_candidates.json
```
