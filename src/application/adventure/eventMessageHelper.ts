/**
 * ランダムイベント種別とメッセージ変換ヘルパー。
 * 4種類のランダムイベントを確率で選択する。
 */

export type RandomEventType = 'HEAL' | 'BOOST' | 'NOTHING' | 'BATTLE';

export function rollRandomEvent(): RandomEventType {
  const r = Math.random();
  if (r < 0.30) return 'HEAL';
  if (r < 0.60) return 'NOTHING';
  if (r < 0.80) return 'BOOST';
  return 'BATTLE';
}

export function getEventMessageForType(type: RandomEventType): string {
  switch (type) {
    case 'HEAL':    return '☀️ 清らかな泉を発見した！　仲間のコンディションが整った気がする。';
    case 'NOTHING': return '🍃 あたりをしばらく探索したが、何も起きなかった。';
    case 'BOOST':   return '⚡ 不思議なオーラに包まれた！　次の戦いは力がみなぎる！！（次の戦闘のみ全ステータス×1.2）';
    case 'BATTLE':  return '⚠️ 強敵が現れた！　突然の遭遇戦が始まる！';
  }
}

/** legacy fallback */
export function getEventMessage(eventId: string): string {
  return getEventMessageForType(rollRandomEvent());
}
