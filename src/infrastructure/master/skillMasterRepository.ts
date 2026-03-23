/**
 * スキルマスタ読込。public/masters/skills.json をフェッチしてキャッシュする。
 * SkillSnapshot への変換も提供する。
 */
import type { SkillSnapshot } from '@/domain/valueObjects/SkillSnapshot';
import { SkillType } from '@/common/constants/enums';
import type { SkillId } from '@/types/ids';

interface RawSkillMaster {
  skillId:      string;
  displayName:  string;
  skillType:    number;  // 1=ATTACK / 2=ATTACK(AoE) / 3=HEAL / 4=BUFF / 5=DEBUFF
  power:        number;
  cooldownSec:  number;
  targetCount:  number;
}

let cache: RawSkillMaster[] | null = null;

async function getAllSkillMasters(): Promise<RawSkillMaster[]> {
  if (cache) return cache;
  const res  = await fetch('/masters/skills.json');
  const data = await res.json() as { items: RawSkillMaster[] };
  cache = data.items;
  return cache;
}

async function getRawSkillById(skillId: string): Promise<RawSkillMaster | null> {
  const all = await getAllSkillMasters();
  return all.find((s) => s.skillId === skillId) ?? null;
}

function mapSkillType(raw: number): SkillType {
  switch (raw) {
    case 1: case 2: return SkillType.Attack;
    case 3:         return SkillType.Heal;
    case 4:         return SkillType.Buff;
    case 5:         return SkillType.Debuff;
    default:        return SkillType.Normal;
  }
}

export async function buildSkillSnapshot(skillId: SkillId): Promise<SkillSnapshot | null> {
  const raw = await getRawSkillById(skillId as string);
  if (!raw) return null;
  return {
    skillId,
    displayName: raw.displayName,
    skillType:   mapSkillType(raw.skillType),
    cooldownSec: raw.cooldownSec,
    power:       raw.power,
    targetCount: raw.targetCount,
  };
}

/** テスト用キャッシュクリア */
export function _resetSkillMasterCache(): void {
  cache = null;
}
