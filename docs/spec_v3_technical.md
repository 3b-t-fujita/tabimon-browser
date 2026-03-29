# タビモン V3 技術仕様書

> バージョン: V3（初回リリース）
> 更新日: 2026-03-29
> 対象: `tabimon-browser`

## 1. この文書の位置づけ

本書は、V3 初回リリースの実装仕様を技術的にまとめた正本です。  
企画・画面・体験側の仕様は [spec_v3_overview.md](./spec_v3_overview.md) を参照してください。

## 2. 実装方針

- V2 の UI トーンとクリーンアーキテクチャを維持する
- ゲームルールは `Domain / Application` 側に寄せる
- UI にルールを散らさない
- 既存セーブデータを壊さない
- 新規ページを増やしすぎず、既存画面の改修で完結させる

## 3. 技術スタック

V3 でも基盤は V2 を継続する。

| 区分 | 技術 |
|---|---|
| Framework | Next.js App Router 16.2.1 |
| UI | React 19.2.4 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Store | Zustand |
| Validation | Zod |
| Persistence | Dexie / IndexedDB |
| Unit Test | Vitest |
| E2E | Playwright |

## 4. データモデル変更

### 4.1 OwnedMonster V3

V3 では `OwnedMonster` に以下の項目を追加する。

```ts
interface OwnedMonsterV3 extends OwnedMonster {
  currentExp?: number;
  bondPoints?: number;
  bondRank?: 0 | 1 | 2 | 3 | 4;
  skillProficiency?: Record<string, {
    useCount: number;
    stage: 0 | 1 | 2 | 3;
  }>;
  evolutionBranchId?: string | null;
  bondMilestoneRead?: number[];
}
```

注意:

- 後方互換のため optional で受ける
- ロード時に安全な初期値へ補完する
- `bondRank` は `bondPoints` から再計算可能
- 熟練の主データは `useCount`

### 4.2 StageMaster V3

```ts
interface StageMasterV3 extends StageMaster {
  stageType: 'STORY' | 'FARM';
  farmCategory?: 'EXP' | 'BOND' | 'SKILL';
  difficultyTier?: 'EARLY' | 'LATE';
  recommendedLevel?: number;
  estimatedMinutes: number;
  firstClearBonusExp?: number;
}
```

用途:

- `STORY/FARM` の分離
- `FARM` 6 ステージ構成の識別
- `FARM` ステージの用途表示
- 初回クリアボーナス表示と反映

### 4.3 DailyRecord

```ts
interface DailyRecord {
  date: string;
  homeTapCount: number;
}
```

用途:

- ホームタップの 1 日 3 回制限

## 5. 保存とマイグレーション

### 5.1 保存対象

`MainSaveSnapshot` に `dailyRecord` を追加し、`OwnedMonster` の V3 項目を許容する。

### 5.2 マイグレーション

実装ファイル:

- [v3SaveMigration.ts](/C:/Users/tk061/OneDrive/デスクトップ/claude%20code/game/tabimon/tabimon-browser/src/infrastructure/persistence/migrations/v3SaveMigration.ts)

ルール:

- V2 読込時に V3 へ補完
- バックアップを `saveMeta` に保存
- バージョン情報を `saveMeta` に保存
- V3 済みなら再移行しない

補完内容:

- `currentExp = exp`
- `bondPoints = 0`
- `bondRank = 0`
- `skillProficiency = skillIds から 0 初期化`
- `evolutionBranchId = null`
- `bondMilestoneRead = []`
- `dailyRecord = null`

## 6. ドメインルール

### 6.1 きずな

ポリシー実装:

- [bondPolicy.ts](/C:/Users/tk061/OneDrive/デスクトップ/claude%20code/game/tabimon/tabimon-browser/src/domain/policies/bondPolicy.ts)

閾値:

- 0 → 0
- 1 → 50
- 2 → 150
- 3 → 400
- 4 → 1000

加算:

- ホームタップ: +1、1 日 3 回まで
- 冒険結果: 成功 / 失敗 / リタイアごとに定数加算
- BOND 前半: 成功 +18 / 失敗 +9 / リタイア +4
- BOND 後半: 成功 +30 / 失敗 +15 / リタイア +7

### 6.2 熟練

ポリシー実装:

- [skillProficiencyPolicy.ts](/C:/Users/tk061/OneDrive/デスクトップ/claude%20code/game/tabimon/tabimon-browser/src/domain/policies/skillProficiencyPolicy.ts)

閾値:

- 0 → 0
- 1 → 5
- 2 → 15
- 3 → 30

補正:

- 通常ステージ: 実使用回数そのまま
- SKILL 前半: 実使用回数 ×2、1 冒険あたり上限 +6
- SKILL 後半: 実使用回数 ×3、1 冒険あたり上限 +9

### 6.3 定数管理

V3 の育成定数は [GameConstants.ts](/C:/Users/tk061/OneDrive/デスクトップ/claude%20code/game/tabimon/tabimon-browser/src/common/constants/GameConstants.ts) に集約する。

## 7. バトルからリザルトへの反映

### 7.1 スキル使用回数

- `BattleState.usedMainSkillCounts` で相棒スキル使用回数を保持
- `BattleTickEngine` で行動時に加算
- `applyBattleResultUseCase` で `AdventureSession.resultSkillUsageCounts` に保存

### 7.2 リザルト確定

中心実装:

- [finalizeAdventureResultUseCase.ts](/C:/Users/tk061/OneDrive/デスクトップ/claude%20code/game/tabimon/tabimon-browser/src/application/result/finalizeAdventureResultUseCase.ts)

反映内容:

- EXP
- 初回クリアボーナス EXP
- きずな
- 熟練
- 進化
- 次ステージ解放

戻り値:

- `expGained`
- `firstClearBonusExp`
- `bondPointsGained`
- `bondRankBefore/After`
- `skillUpdates`
- `evolved/evolvedName`

## 8. 画面実装

### 8.1 ホーム

中心:

- [buildHomeViewModelUseCase.ts](/C:/Users/tk061/OneDrive/デスクトップ/claude%20code/game/tabimon/tabimon-browser/src/application/home/buildHomeViewModelUseCase.ts)
- [HomeScreenPatternStitch.tsx](/C:/Users/tk061/OneDrive/デスクトップ/claude%20code/game/tabimon/tabimon-browser/src/components/home/HomeScreenPatternStitch.tsx)
- [page.tsx](/C:/Users/tk061/OneDrive/デスクトップ/claude%20code/game/tabimon/tabimon-browser/src/app/home/page.tsx)

追加点:

- 相棒の `currentExp`
- `bondPoints`
- `bondRank`
- 相棒タップによるきずな加算

### 8.2 仲間詳細

中心:

- [getOwnedMonsterDetailUseCase.ts](/C:/Users/tk061/OneDrive/デスクトップ/claude%20code/game/tabimon/tabimon-browser/src/application/monsters/getOwnedMonsterDetailUseCase.ts)
- [OwnedMonsterDetailPatternStitch.tsx](/C:/Users/tk061/OneDrive/デスクトップ/claude%20code/game/tabimon/tabimon-browser/src/components/monsters/OwnedMonsterDetailPatternStitch.tsx)

追加点:

- `EXP`
- `きずな`
- スキルごとの熟練表示

### 8.3 ステージ選択

中心:

- [getAvailableStagesUseCase.ts](/C:/Users/tk061/OneDrive/デスクトップ/claude%20code/game/tabimon/tabimon-browser/src/application/adventure/getAvailableStagesUseCase.ts)
- [StageListPatternStitch.tsx](/C:/Users/tk061/OneDrive/デスクトップ/claude%20code/game/tabimon/tabimon-browser/src/components/adventure/StageListPatternStitch.tsx)

追加点:

- `storyStages`
- `farmStages`
- `stageType`
- `farmCategory`
- `difficultyTier`
- `estimatedMinutes`
- `firstClearBonusExp`
- `recommendedBandLabel`
- `primaryEffectLabel`
- `supportText`

### 8.4 リザルト

中心:

- [page.tsx](/C:/Users/tk061/OneDrive/デスクトップ/claude%20code/game/tabimon/tabimon-browser/src/app/adventure/result/page.tsx)
- [ResultSummaryView.tsx](/C:/Users/tk061/OneDrive/デスクトップ/claude%20code/game/tabimon/tabimon-browser/src/components/result/ResultSummaryView.tsx)
- [resultStore.ts](/C:/Users/tk061/OneDrive/デスクトップ/claude%20code/game/tabimon/tabimon-browser/src/stores/resultStore.ts)

要件:

- 何が進んだか一目で分かる
- 自動遷移に頼りすぎず CTA を明示
- 進化はリザルト内の軽量演出で完結

## 9. テスト方針

### 9.1 単体 / 統合

- `finalizeAdventureResultUseCase.test.ts`
- `saveTransactionService.test.ts`
- `buildHomeViewModelUseCase.test.ts`
- `getAvailableStagesUseCase.test.ts`

主な確認:

- EXP 反映
- FARM の EXP 前半 / 後半値
- FARM の BOND 前半 / 後半値
- FARM の SKILL 前半 / 後半補正
- 初回クリアボーナス反映
- 熟練反映
- V2→V3 マイグレーション
- STORY/FARM 分離

### 9.2 E2E

Playwright による主要スモーク:

- `setup -> home`
- `setup?worldId=... -> home`
- `stages` タブ切替
- `monster detail`
- `result preview`
- `preview/ui`

設定:

- [playwright.config.ts](/C:/Users/tk061/OneDrive/デスクトップ/claude%20code/game/tabimon/tabimon-browser/playwright.config.ts)

## 10. リリース条件

V3 初回リリースは以下を満たしたときに完了とする。

- `npm test` 通過
- `npx playwright test` または `npm run test:e2e` 通過
- `npm run build` 通過
- `setup/home` の開始導線が安定
- `EXP / きずな / 熟練 / story-farm / migration` が確認済み

## 11. 関連資料

- [spec_v3_overview.md](./spec_v3_overview.md)
- [spec_v2_overview.md](./spec_v2_overview.md)
- [spec_v2_technical.md](./spec_v2_technical.md)
- [v3_execution_plan.md](./v3_execution_plan.md)
- [v3_release_ticket_plan.md](./v3_release_ticket_plan.md)
- [v3_manual_verification_checklist.md](./v3_manual_verification_checklist.md)
