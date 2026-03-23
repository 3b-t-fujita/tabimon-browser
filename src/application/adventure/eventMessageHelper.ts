/**
 * イベントID → 表示メッセージの変換ヘルパー。
 * フェーズ6簡易版: 静的マップで返す。
 * フェーズ7以降でマスタデータからの動的取得へ置換予定。
 */
export function getEventMessage(eventId: string): string {
  const messages: Record<string, string> = {
    evt_heal_001:    'いやしの泉を発見した！ HP が少し回復した気がする。',
    evt_gather_001:  '木の実を拾った！ 役に立つかもしれない。',
    evt_trap_001:    '足元が崩れた！ バランスを崩してしまった。',
    evt_chest_001:   '古びた宝箱を発見した！ 中に何かが入っていた。',
    evt_special_001: '不思議な光に包まれた……何かが変わったような気がする。',
  };
  return messages[eventId] ?? `不思議なことが起きた（${eventId}）。`;
}
