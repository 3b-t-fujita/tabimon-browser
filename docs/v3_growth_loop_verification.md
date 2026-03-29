# タビモン V3 成長ループ通し確認

## 目的

ホーム単体の表示確認ではなく、以下が通しで成立しているかを確認する。

- 冒険結果の EXP がホームへ反映される
- 冒険結果の きずながホームへ反映される
- `ものがたり / そだてる` の分離が UI とデータの両方で成立している

## 自動確認

### 1. リザルト -> ホーム 成長反映

対象:
- [result-home-growth.spec.ts](/C:/Users/tk061/OneDrive/デスクトップ/claude%20code/game/tabimon/tabimon-browser/tests/e2e/result-home-growth.spec.ts)

確認方法:
- リザルト直前の save を IndexedDB に投入
- `/adventure/result?type=FAILURE` を開く
- 報酬反映後に `ホームへ戻る` を押す
- ホームの成長サマリーで更新後の値を確認

確認結果:
- `つぎのLvまで あと 35` を表示
- `つぎのきずなまで あと 47` を表示
- `きずな ★0` を表示

前提:
- `stage_w1_1`
- 初期 EXP `0`
- 初期 きずな `0`
- `FAILURE` のため EXP は `30 * 0.5 = 15`
- きずなは `+3`

### 2. setup -> home 基本導線

対象:
- [setup-flow.spec.ts](/C:/Users/tk061/OneDrive/デスクトップ/claude%20code/game/tabimon/tabimon-browser/tests/e2e/setup-flow.spec.ts)

確認結果:
- setup から home へ遷移できる
- home に `成長サマリー / EXP / きずな` が表示される

### 3. ステージ分離 UI

対象:
- [smoke.spec.ts](/C:/Users/tk061/OneDrive/デスクトップ/claude%20code/game/tabimon/tabimon-browser/tests/e2e/smoke.spec.ts)

確認結果:
- `/adventure/stages` で `ものがたり / そだてる` が切り替わる
- ガイド文がタブに応じて変わる

## 手動確認手順

### 成長ループ

1. `/setup` から初期設定を完了する
2. `/adventure/stages` から任意のステージへ進む
3. リザルト画面を完了し、`ホームへ戻る` を押す
4. ホームの成長サマリーを見る

期待結果:
- リザルトの EXP 増加がホームの EXP バーと残量へ反映される
- リザルトの きずな増加がホームの きずなバーと残量へ反映される
- 最大 Lv / 最大きずな時は満タン表示になり、残量表示が破綻しない

### ステージ分離

1. `/adventure/stages` を開く
2. `ものがたり` を開く
3. `そだてる` を開く

期待結果:
- STORY は `初回ぼーなす +X EXP` が表示される
- FARM は `EXP / BOND / SKILL` のいずれかが表示される
- FARM は `前半向け / 後半向け` が表示される
- 推奨レベル、所要分数、説明文が表示される

## 実装状況まとめ

### 冒険 -> リザルト -> ホーム

- リザルト確定処理で相棒の `exp/currentExp` を保存している
- リザルト確定処理で相棒の `bondPoints/bondRank` を保存している
- ホーム ViewModel は保存済みの `currentExp/bondPoints` をもとに進捗率を再計算する
- そのため、ホーム再表示時に古い値ではなく保存後の値が見える

### `ものがたり / そだてる`

- UI 上で 2 タブに分離済み
- `stageType` と `farmCategory` を使って表示文法を変更済み
- STORY は `firstClearBonusExp` を表示
- FARM は 6 ステージ構成で、カテゴリ・前半後半・主な効果・補助文言を表示

## 懸念点

- 通し E2E は「実冒険プレイそのもの」ではなく「リザルト直前セーブ投入」による準 E2E
- 実冒険フルプレイの E2E はまだ未整備
