export type StitchPreviewScreen = 'home' | 'stages' | 'qr' | 'monster-detail';

export interface StitchPreviewData {
  status: 'live' | 'fallback';
  source: string;
  headline: string;
  summary: string;
  highlights: string[];
  rawPreview?: string;
  html?: string;
  screenshotUrl?: string;
  projectId?: string;
  sessionId?: string;
  screenId?: string;
}

interface StitchPreviewDefinition {
  projectTitle: string;
  prompt: string;
  fallback: StitchPreviewData;
}

const SCREEN_DEFINITIONS: Record<StitchPreviewScreen, StitchPreviewDefinition> = {
  home: {
    projectTitle: 'Tabimon Browser Stitch Home',
    prompt: [
      'タビモンのホーム画面を日本語のスマホ向けゲームUIとして1画面生成してください。',
      '相棒モンスターを画面上部の主役にし、続きから、冒険へ出発、仲間一覧、編成、QR交換の導線を入れてください。',
      'かわいいが子どもっぽすぎず、大人が見ても洗練された雰囲気にしてください。',
      '森ワールドを基調にした明るい配色で、丸みのあるカードと大きなCTAを中心にしてください。',
    ].join('\n'),
    fallback: {
      status: 'fallback',
      source: 'local-skill',
      headline: '相棒が主役のモダンホーム',
      summary: 'STITCH未接続でも比較できるよう、スキル文書の原則に沿ったホーム案を表示しています。',
      highlights: [
        '相棒を最上段の主役にして、旅に出る気分を強める',
        '続きから・冒険・仲間・QRの優先度を視線順で整理する',
        '森テーマの空気感を使いつつ、子どもにも読みやすい情報量に抑える',
      ],
    },
  },
  stages: {
    projectTitle: 'Tabimon Browser Stitch Stages',
    prompt: [
      'タビモンのステージ選択画面を日本語のスマホ向けゲームUIとして1画面生成してください。',
      '3ワールドと難易度を直感的に選べて、解放状況とおすすめステージがひと目で分かるようにしてください。',
      '森、火山、氷原のテーマ差を明確にしつつ、大きなカードと片手操作しやすいレイアウトにしてください。',
      '旅先を選ぶ高揚感と、情報整理の分かりやすさを両立してください。',
    ].join('\n'),
    fallback: {
      status: 'fallback',
      source: 'local-skill',
      headline: 'ワールド選択のワクワク感を強める',
      summary: '現在の一覧型を保ちつつ、選択の高揚感と解放状況の見やすさを高める比較案です。',
      highlights: [
        'ワールドごとの大きな入口カードで雰囲気を先に伝える',
        '推奨レベルと解放状態をカード右側に整理する',
        '次に挑むべきステージを視線誘導で分かりやすくする',
      ],
    },
  },
  qr: {
    projectTitle: 'Tabimon Browser Stitch QR',
    prompt: [
      'タビモンのQR交換メニュー画面を日本語のスマホ向けゲームUIとして1画面生成してください。',
      'QR生成とQR読取の2択を迷わせず、機能説明よりも友達とつながる遊びとして魅せてください。',
      'あたたかい空気感、交換したくなる雰囲気、大きく押しやすいCTAを重視してください。',
      '背景にやさしい世界観を感じさせつつ、カード構造は明快にしてください。',
    ].join('\n'),
    fallback: {
      status: 'fallback',
      source: 'local-skill',
      headline: 'QRをつながり体験として見せる',
      summary: '生成と読取の二択を保ちながら、友達と見せ合う温度感を足した比較案です。',
      highlights: [
        '機能説明よりも「友達と交換する楽しさ」を先に見せる',
        '生成と読取を同格の大きなカードで迷わせない',
        '空や光のような背景でやさしいコミュニケーション感を出す',
      ],
    },
  },
  'monster-detail': {
    projectTitle: 'Tabimon Browser Stitch Monster Detail',
    prompt: [
      'タビモンのモンスター詳細画面を日本語のスマホ向けゲームUIとして1画面生成してください。',
      '相棒への愛着を深めつつ、レベル、性格、ステータス、スキル、相棒設定、QR生成の操作を整理してください。',
      '大きなビジュアルと育成情報の見やすさを両立し、片手操作しやすい構成にしてください。',
      '世界観カラーは所属ワールドに自然に合うようにし、かわいいが本格感もある見た目にしてください。',
    ].join('\n'),
    fallback: {
      status: 'fallback',
      source: 'local-skill',
      headline: '愛着と育成確認を両立する詳細画面',
      summary: 'うちの子感を残しつつ、育成データとアクション導線を整理した比較案です。',
      highlights: [
        '立ち絵と名前の存在感を強めて愛着を高める',
        'ステータスとスキルを1スクロールで把握しやすくする',
        '相棒設定とQR生成を迷わない位置に固定する',
      ],
    },
  },
};

export function getStitchPreviewDefinition(screen: StitchPreviewScreen): StitchPreviewDefinition {
  return SCREEN_DEFINITIONS[screen];
}

export function getStitchPreviewFallback(screen: StitchPreviewScreen): StitchPreviewData {
  return SCREEN_DEFINITIONS[screen].fallback;
}
