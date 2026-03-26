# Tabimon Browser

ブラウザで遊ぶスマホ向け育成 RPG「Tabimon」のフロントエンド実装です。  
Next.js App Router をベースに、`Domain / Application / Infrastructure / UI` の分離を保ちながら、スマホ 1 画面前提の UI で冒険からバトル、QR 交換まで遊べます。

## 現在の状態

- 正式 UI は新デザインへ統一済みです
- `home -> adventure/stages -> adventure/confirm -> adventure/play -> adventure/battle -> adventure/result` の主要導線は新デザイン基準です
- 静的確認用に `/preview/ui` も用意しています

## セットアップ

```bash
npm install
```

## 開発サーバー

```bash
npm run dev
```

既定では `http://localhost:3000` で起動します。  
別ポートで起動したい場合は次のように `next` を直接実行します。

```bash
npx next dev -H 0.0.0.0 -p 4100
```

## 主要 URL

- `/home`: ホーム
- `/adventure/stages`: ステージ選択
- `/adventure/confirm?stageId=...`: 冒険確認
- `/adventure/play`: 探索
- `/adventure/battle`: バトル
- `/adventure/result?type=SUCCESS`: リザルト確認
- `/qr`: QR メニュー
- `/monsters`
- `/monsters/[id]`
- `/party`
- `/setup`
- `/preview/ui`: セーブ不要の静的 UI プレビュー

## テスト

```bash
npm test
npm run build
```

現状、Vitest は通過しています。ビルドも通過しています。

## デザイン運用

共通 UI と運用ルールは以下を参照してください。

- [UI デザインシステム](docs/ui_design_system.md)
- [プレイテストチェックリスト](docs/playtest_checklist.md)
- [企画仕様](docs/spec_concept.md)
- [技術仕様](docs/spec_technical.md)

## 補足

- 旧比較 UI 用の `PatternA / PatternB` ファイルは一部残しています。主要導線では使用していませんが、復帰用バックアップとして保持しています
- Stitch 比較の役割はほぼ終了しており、現在は本実装 UI が正式版です
- 旧 UI の退避方針は [legacy_ui_archive.md](docs/legacy_ui_archive.md) を参照してください
