# Tabimon V3 GitHub反映用 Claude Code 指示プロンプト

以下を、そのまま Claude Code への指示として使えます。

---

あなたは `tabimon-browser` プロジェクトのリリース担当です。  
対象リポジトリは以下です。

`C:\Users\tk061\OneDrive\デスクトップ\claude code\game\tabimon\tabimon-browser`

今回の目的は、**Tabimon V3 初回リリース相当の完成内容を GitHub へ安全に反映すること** です。

## 最初に必ず確認する資料

以下を正本として必ず先に読んでください。

1. V3 概要仕様  
`docs/spec_v3_overview.md`

2. V3 技術仕様  
`docs/spec_v3_technical.md`

3. V3 リリース前 最終チェックリスト  
`docs/v3_release_final_checklist.md`

4. V3 GitHub反映前 最終差分整理  
`docs/v3_final_diff_summary.md`

5. V3 完了報告  
`docs/v3_completion_report.md`

補助資料:

- V3 手動確認チェックリスト  
  `docs/v3_manual_verification_checklist.md`
- Playwright テスト計画  
  `docs/playwright_test_plan.md`
- 旧UIバックアップ方針  
  `docs/legacy_ui_archive.md`

## 絶対ルール

- スコープを勝手に広げない
- 既存セーブを壊さない
- 既存導線を壊さない
- 旧 `PatternA / PatternB` は削除しない
- 不要な比較導線や生成物を GitHub に混ぜない
- 破壊的な git 操作をしない
- ユーザーの既存変更を巻き戻さない

## 反映前に必ずやること

1. `git status` を確認する
2. GitHub に含めるべき差分と、含めないべき生成物を切り分ける
3. 以下の生成物が残っていたら除外する
   - `.playwright-cli/`
   - `playwright-report/`
   - `test-results/`
   - `.codex-next-start-*.log`
4. `.claude/launch.json` はローカル専用設定の可能性があるため、含めるべきか慎重に確認する

## 反映前の必須確認

以下をこの順で実施してください。

1. `npm test`
2. `npm run build`
3. `npx playwright test --reporter=list`

確認中に失敗したら:

- 原因を切り分ける
- 安全に修正できるなら修正する
- 危険なら止めて、何がブロッカーか明示する

## GitHub に含める想定

主に以下です。

- `src/`
- `public/masters/`
- `tests/`
- `docs/`
- `playwright.config.ts`
- `package.json`
- `package-lock.json`
- `README.md`

## GitHub に含めない想定

- `.playwright-cli/`
- `playwright-report/`
- `test-results/`
- `.codex-next-start-*.log`

## コミット方針

- コミットメッセージは日本語で簡潔にする
- 例:
  - `V3初回リリース対応を最終整理`
  - `V3仕様と確認資料を更新`
  - `V3リリース前の最終調整`

## 実施してほしいこと

1. 反映不要ファイルを除外する
2. テストとビルドを通す
3. GitHub に含める差分だけを最終確認する
4. 必要なら README や docs の参照漏れを最小限修正する
5. 変更をコミットする
6. 現在の作業ブランチへ push する
   - 新規ブランチが必要なら `codex/` プレフィックスを使う

## 完了時に必ず報告すること

1. 実施した確認内容
2. GitHub に含めたファイルの考え方
3. 除外したファイル
4. `npm test` の結果
5. `npm run build` の結果
6. `npx playwright test --reporter=list` の結果
7. コミットID
8. push 先ブランチ名
9. リリース時の注意点
10. 未解決事項があればその内容

---

短い依頼文で渡すなら、次でもOKです。

---

`docs/spec_v3_overview.md`、`docs/spec_v3_technical.md`、`docs/v3_release_final_checklist.md`、`docs/v3_final_diff_summary.md`、`docs/v3_completion_report.md` を先に確認してください。  
そのうえで、GitHub に含めるべき差分だけを最終確認し、生成物を除外し、`npm test`、`npm run build`、`npx playwright test --reporter=list` を通したうえで、安全にコミット・push してください。  
旧 PatternA/B は削除しないこと、既存変更を巻き戻さないこと、`.claude/launch.json` はローカル設定として扱いを慎重に確認すること。

---
