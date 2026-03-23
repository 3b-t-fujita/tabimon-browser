/**
 * ViewModel 用ラベル変換ヘルパー。
 * enum 値 → 日本語表示文字列。
 */
import { WorldId, RoleType, PersonalityType } from '@/common/constants/enums';

export function worldLabel(worldId: string): string {
  switch (worldId) {
    case WorldId.Forest:  return 'ミドリの森';
    case WorldId.Volcano: return 'ホノオ火山';
    case WorldId.Ice:     return 'コオリ氷原';
    default:              return worldId;
  }
}

export function roleLabel(role: string): string {
  switch (role) {
    case RoleType.Attack:  return 'アタック';
    case RoleType.Guard:   return 'ガード';
    case RoleType.Support: return 'サポート';
    default:               return role;
  }
}

export function personalityLabel(personality: string): string {
  switch (personality) {
    case PersonalityType.Brave:    return 'ゆうかん';
    case PersonalityType.Cautious: return 'しんちょう';
    case PersonalityType.Kind:     return 'やさしい';
    case PersonalityType.Hasty:    return 'せっかち';
    case PersonalityType.Calm:     return 'れいせい';
    case PersonalityType.Whimsy:   return 'きまぐれ';
    default:                       return personality;
  }
}
