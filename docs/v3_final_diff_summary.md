# Tabimon V3 GitHub反映前 最終差分整理

> 更新日: 2026-03-30

## 目的

GitHub へ反映する前に、今回の V3 差分が何を含み、何を含まないかを整理するためのメモです。

## 差分の主軸

### 1. V3 成長ループ実装

- `EXP`
- `きずな`
- `じゅくれん`
- `軽量進化演出`
- `V2 -> V3 マイグレーション`

主なファイル:
- `src/application/result/*`
- `src/application/home/*`
- `src/application/monsters/*`
- `src/domain/entities/OwnedMonster.ts`
- `src/infrastructure/persistence/*`

### 2. ステージ分離と 6 ステージ FARM

- `ものがたり / そだてる` 分離
- `EXP / BOND / SKILL`
- `前半 / 後半`
- FARM 解放条件調整
- FARM 候補モンスターの整理
- FARM 敵強さ補正

主なファイル:
- `public/masters/stages.json`
- `public/masters/drop_candidates.json`
- `src/application/adventure/getAvailableStagesUseCase.ts`
- `src/domain/policies/farmStagePolicy.ts`
- `src/domain/policies/farmStageUnlockPolicy.ts`
- `src/application/battle/initializeBattleUseCase.ts`

### 3. UI 一新版の定着

- ホーム成長サマリー
- 子ども向け文言
- `ステージ / かんたん / おたすけ` 表記統一
- バトルの被ダメージリアクション

主なファイル:
- `src/components/home/*`
- `src/components/adventure/*`
- `src/components/battle/*`
- `src/components/result/*`
- `src/components/setup/*`

### 4. テストと確認資料

- Vitest 拡張
- Playwright 拡張
- V3 仕様・確認資料追加

主なファイル:
- `tests/e2e/*`
- `src/application/**/*.test.ts`
- `docs/spec_v3_overview.md`
- `docs/spec_v3_technical.md`
- `docs/v3_*`

## 差分規模

`git diff --stat` 時点の目安:

- 64 files changed
- 1643 insertions
- 285 deletions

## GitHub に含める想定

- `src/`
- `public/masters/`
- `tests/`
- `docs/`
- `playwright.config.ts`
- `package.json`
- `package-lock.json`
- `README.md`

## GitHub に含めない想定

生成物・ローカル作業物:

- `.playwright-cli/`
- `playwright-report/`
- `test-results/`
- `.codex-next-start-*.log`

注意:
- `.codex-next-start-4301.*` のようなログは、起動中プロセスが掴んでいると削除できないことがあります
- GitHub 反映前に対象サーバーを停止し、生成物を掃除してから push するのが安全です

## ローカル専用・要確認

- `.claude/launch.json`

これはローカル開発補助設定の可能性があるため、GitHub へ含めるかは push 前に再確認することを推奨します。

## リリース前の確認結果

- `npm test`: 通過
- `npm run build`: 通過
- `npx playwright test --reporter=list`: 通過

## 残る整理ポイント

- 生成ログが残っていないか
- `.claude/launch.json` を含めるか
- ドキュメントの参照先が README からたどれるか
