# Tabimon UI デザインシステム

> 更新日: 2026-03-27

## 目的

Tabimon の画面を、スマホ 1 画面前提で統一感のある見た目に保つための運用ルールです。  
新規画面や既存画面修正では、まず共通部品を優先して使います。

## 基本トーン

- 白ベース
- 淡いワールドカラーを補助色に使う
- 大きな角丸
- 強すぎない影
- CTA は丸い主ボタン
- 情報はカードに分け、視線の流れを明確にする

## 共通部品

### ヘッダー

- [AppScreenHeader.tsx](/C:/Users/tk061/OneDrive/デスクトップ/claude%20code/game/tabimon/tabimon-browser/src/components/common/AppScreenHeader.tsx)
- 画面上部の戻る、タイトル、説明文を統一する

### カード

- [SoftCard.tsx](/C:/Users/tk061/OneDrive/デスクトップ/claude%20code/game/tabimon/tabimon-browser/src/components/common/SoftCard.tsx)
- `white / soft / muted` の 3 トーンを使い分ける

### チップ

- [UiChip.tsx](/C:/Users/tk061/OneDrive/デスクトップ/claude%20code/game/tabimon/tabimon-browser/src/components/common/UiChip.tsx)
- 状態、属性、タグ、推奨レベルなどの短情報に使う

### 主ボタン

- [PrimaryButton.tsx](/C:/Users/tk061/OneDrive/デスクトップ/claude%20code/game/tabimon/tabimon-browser/src/components/common/PrimaryButton.tsx)
- 主要 CTA はこれを使う

## 実装ルール

1. 画面上部は `AppScreenHeader` を優先する
2. 情報のまとまりは `SoftCard` に寄せる
3. ラベルの丸チップは `UiChip` を使う
4. メイン CTA は `PrimaryButton` を使う
5. 新しい見た目を作る前に、既存共通部品で表現できないか確認する

## 画面ごとの特例

### ホーム

- ヒーロー画像の見せ場があるので、背景演出は個別実装を許容する

### バトル

- 戦場の臨場感を優先して背景演出は個別実装を許容する
- ただし情報パネル、ボタン、色トーンは共通ルールに合わせる

### QR / 結果 / 候補受取

- 状態説明が重要なため、補助文言は 1 行で曖昧にせず意図が分かる文にする

## 今後の方針

- 旧 `PatternA / PatternB` は新規利用しない
- 正式導線は Stitch ベース本実装のみを使う
- 追加画面はこのルールに沿って増やす
