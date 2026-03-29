# タビモン V2 技術仕様書

> バージョン: V2（UI 一新版）
> 更新日: 2026-03-27
> 対象: `tabimon-browser`

## 1. この文書の位置づけ

本書は、タビモン V2 の現行実装を前提とした技術仕様書です。  
画面体験や企画意図は [spec_v2_overview.md](./spec_v2_overview.md) を参照してください。

## 2. 技術スタック

| 区分 | 技術 | バージョン |
|---|---|---|
| フレームワーク | Next.js App Router | 16.2.1 |
| UI | React | 19.2.4 |
| 言語 | TypeScript | 5.x |
| スタイリング | Tailwind CSS | 4.x |
| 状態管理 | Zustand | 5.0.12 |
| スキーマ検証 | Zod | 4.3.6 |
| ローカル永続化 | Dexie / IndexedDB | 4.3.0 |
| コード作成 | qrcode | 1.5.4 |
| コード読取 | jsqr | 1.4.0 |
| テスト | Vitest | 4.1.0 |

## 3. アーキテクチャ

V2 はクリーンアーキテクチャ寄りの 4 層構成を維持する。

```text
UI
  - src/app
  - src/components
  - src/stores

Application
  - UseCase
  - ViewModel
  - label / mapper

Domain
  - Entity
  - ValueObject
  - Policy
  - BattleEngine

Infrastructure
  - IndexedDB
  - master data
  - asset resolver
```

依存方向は `UI -> Application -> Domain` を基本とし、永続化やアセット参照は `Infrastructure` が担当する。

## 4. ディレクトリ責務

| パス | 責務 |
|---|---|
| `src/app` | ページ単位のルーティング |
| `src/components` | 画面部品、画面パターン、共通 UI |
| `src/stores` | Zustand による UI 状態 |
| `src/application` | UseCase、ViewModel、変換ロジック |
| `src/domain` | ゲームルール、バトル、エンティティ |
| `src/infrastructure` | 保存、マスターデータ、画像 URL 解決 |
| `src/common` | 定数、エラー、Result 型 |
| `docs` | 仕様、運用ルール、テスト観点 |

## 5. V2 の UI 実装方針

### 5.1 正式 UI

V2 では、主要画面は新 UI を正式導線として使用する。

- ホーム
- ステージ選択
- 冒険確認
- 探索
- バトル
- リザルト
- 候補受取
- 仲間一覧 / 詳細
- 編成
- コード交換一式
- 初期設定

### 5.2 旧 UI の扱い

- `PatternA / PatternB` は一部ファイルを残す
- 現行導線では参照しない
- 復帰用の保管資産として扱う
- 詳細は [legacy_ui_archive.md](./legacy_ui_archive.md) を参照する

### 5.3 共通 UI 部品

V2 では共通部品の利用を前提とする。

| コンポーネント | 役割 |
|---|---|
| `AppScreenHeader` | 上部ヘッダー |
| `SoftCard` | 情報のまとまり |
| `UiChip` | 小さな状態表示 |
| `PrimaryButton` | 主 CTA |

運用ルールは [ui_design_system.md](./ui_design_system.md) を参照する。

## 6. 主要ルート

| URL | 実装上の役割 |
|---|---|
| `/` | ブートと初期振り分け |
| `/setup` | 初期設定 |
| `/home` | ホーム |
| `/monsters` | 仲間一覧 |
| `/monsters/[id]` | 仲間詳細 |
| `/party` | 編成 |
| `/adventure/stages` | ステージ選択 |
| `/adventure/confirm` | 冒険確認 |
| `/adventure/play` | 探索進行 |
| `/adventure/battle` | バトル |
| `/adventure/result` | リザルト |
| `/adventure/candidate` | 候補受取 |
| `/adventure/candidate/replace` | 候補入替 |
| `/qr` | コード交換メニュー |
| `/qr/generate` | コード作成 |
| `/qr/scan` | コード読取 |
| `/qr/confirm` | 受取確認 |
| `/preview/ui` | 静的 UI プレビュー |

## 7. 主要データモデル

### 7.1 HomeViewModel

V2 ホームでは、相棒情報表示のため以下を持つ。

```ts
interface HomeViewModel {
  playerName: string;
  mainMonsterName: string;
  mainMonsterLevel: number | null;
  mainMonsterId: string | null;
  mainMonsterMasterId: string | null;
  ownedCount: number;
  ownedCapacity: number;
  supportCount: number;
  supportCapacity: number;
  canContinue: boolean;
  continueStageId: string | null;
  continueType: 'PENDING_RESULT' | 'ACTIVE' | null;
}
```

### 7.2 永続化対象

永続化は `MainSaveSnapshot` を中心に扱う。

- player
- ownedMonsters
- supportMonsters
- progress
- adventureSession
- pendingCandidate
- qrReceiveHistory
- settings

### 7.3 保存方式

保存は IndexedDB ベースで、`SaveTransactionService` を経由する。  
一時保存から検証、コミットまでを一貫して扱い、途中失敗時の破損を防ぐ。

## 8. 主要 UseCase

| UseCase | 役割 |
|---|---|
| `LoadHomeDataUseCase` | ホーム表示用データ読込 |
| `BuildHomeViewModelUseCase` | ホーム用 ViewModel 生成 |
| `CompleteInitialSetupUseCase` | 初期設定完了 |
| 冒険系 UseCase 群 | セッション開始、探索進行、結果反映 |
| QR 系 UseCase 群 | コード作成、読取、検証 |

## 9. 状態管理

Zustand を画面横断の UI 状態保持に使用する。

主な Store:

- `appUiStore`
- `adventureStore`
- `adventurePlayStore`
- `battleStore`
- `monsterStore`
- `qrStore`
- `resultStore`

責務:

- 画面内状態の保持
- ページ間受け渡し
- 進行中フローの UI 状態管理

## 10. バトル実装方針

### 10.1 ロジック

- リアルタイム tick ベースで進行
- プレイヤーは相棒のスキル選択を担当
- 助っ人と敵は AI 挙動

### 10.2 V2 UI での方針

- スマホ 1 画面に収める
- 背景にステージ画像を置く
- 奥に敵、手前に味方を置く
- 中央手前の相棒を最も大きく表示する
- 情報は半透明パネルにまとめる

## 11. コード交換機能

### 11.1 送信側

- 仲間を選択
- `BuildMonsterQrPayloadUseCase`
- `GenerateQrImageUseCase`
- 生成画像と内容確認を表示

### 11.2 受信側

- 画像選択
- `ScanQrImageUseCase`
- `ParseQrPayloadUseCase`
- `ValidateQrVersionUseCase`
- `ValidateQrChecksumUseCase`
- 受取確認へ遷移

### 11.3 V2 表示方針

- 画面上の表記は子ども向けに `コードを作る / コードを読む / コード交換` を使う
- 内部名称としての `QR` は実装上そのまま残してよい

## 12. STITCH の扱い

V2 開発過程では STITCH 比較導線を使用したが、現行版では新 UI を本実装として採用している。

- STITCH は比較・試作の履歴として残る
- 正式導線は React/Tailwind 実装を使用する
- 本番 UI は STITCH 生成 HTML 依存ではない

## 13. テストと確認

### 13.1 自動確認

- `npm test`
- `npm run build`

### 13.2 手動確認

主要導線の確認観点は [playtest_checklist.md](./playtest_checklist.md) を参照する。

## 14. リリース運用

V2 を GitHub 本番へ反映する際は次を前提とする。

- 旧 UI は削除しない
- 正式導線に比較用 UI を混在させない
- テストとビルド通過を必須にする
- ドキュメントを現行状態へ更新する

## 15. 関連資料

- [spec_v2_overview.md](./spec_v2_overview.md)
- [ui_design_system.md](./ui_design_system.md)
- [playtest_checklist.md](./playtest_checklist.md)
- [legacy_ui_archive.md](./legacy_ui_archive.md)
- [spec_concept.md](./spec_concept.md)
- [spec_technical.md](./spec_technical.md)
