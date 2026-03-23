/**
 * ID系ブランド型。
 * string との混同を防ぎ、型安全に ID を扱う。
 */

declare const _brand: unique symbol;
type Brand<T, B> = T & { readonly [_brand]: B };

export type WorldId    = Brand<string, 'WorldId'>;
export type MonsterId  = Brand<string, 'MonsterId'>;   // 個体固有ID (unique per instance)
export type MonsterMasterId = Brand<string, 'MonsterMasterId'>; // 種別マスタID
export type SessionId  = Brand<string, 'SessionId'>;
export type StageId    = Brand<string, 'StageId'>;
export type SkillId    = Brand<string, 'SkillId'>;
export type CandidateId = Brand<string, 'CandidateId'>;
export type PlayerId   = Brand<string, 'PlayerId'>;

/** ブランド型ファクトリ（型キャスト用。外部入力には使用しないこと） */
export const toWorldId    = (s: string): WorldId    => s as WorldId;
export const toMonsterId  = (s: string): MonsterId  => s as MonsterId;
export const toMonsterMasterId = (s: string): MonsterMasterId => s as MonsterMasterId;
export const toSessionId  = (s: string): SessionId  => s as SessionId;
export const toStageId    = (s: string): StageId    => s as StageId;
export const toSkillId    = (s: string): SkillId    => s as SkillId;
export const toCandidateId = (s: string): CandidateId => s as CandidateId;
export const toPlayerId   = (s: string): PlayerId   => s as PlayerId;
