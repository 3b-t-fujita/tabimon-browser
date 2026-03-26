# Legacy UI Archive

> 更新日: 2026-03-27

## 方針

旧 `PatternA / PatternB` は削除せず、復帰用バックアップとして残します。  
ただし、正式導線からは切り離し、通常の画面遷移では使いません。

## 残している理由

- デザイン比較の履歴を残すため
- もし現行デザインから一部表現を戻したくなったときに参照できるようにするため
- 将来、限定的に再利用したい要素が出たときの素材として使えるため

## 現在の正式版

- ホーム: `HomeScreenPatternStitch`
- ステージ選択: `StageListPatternStitch`
- QR メニュー: `QrMenuPatternStitch`
- 仲間詳細: `OwnedMonsterDetailPatternStitch`
- 冒険確認: `AdventureConfirmPanelB`
- バトル: `BattleScreenPatternB`

## 旧案として残している主なファイル

- `src/components/home/HomeScreenPatternA.tsx`
- `src/components/home/HomeScreenPatternB.tsx`
- `src/components/monsters/OwnedMonsterDetailPatternA.tsx`
- `src/components/monsters/OwnedMonsterDetailPatternB.tsx`
- `src/components/battle/BattleScreenPatternA.tsx`
- `src/components/adventure/AdventureConfirmPanelA.tsx`

## 運用ルール

1. 新しい画面から旧 Pattern を直接 import しない
2. 正式導線のラッパーは正式版実装だけを呼ぶ
3. 旧 Pattern を再利用したい場合は、そのまま戻すのではなく必要部分を抽出して再設計する
