/**
 * モンスターマスタ読込。public/masters/monsters.json をフェッチしてキャッシュする。
 * ステータス計算（レベル適用）も提供する。
 */
import type { MonsterStats } from '@/domain/valueObjects/MonsterStats';

export interface MonsterMasterData {
  readonly monsterId:      string;
  readonly displayName:    string;   // 表示名
  readonly worldId:        number;   // 1=Forest, 2=Volcano, 3=Ice
  readonly role:           number;   // 1=Attack, 2=Guard, 3=Support
  readonly baseHp:         number;
  readonly baseAtk:        number;
  readonly baseDef:        number;
  readonly baseSpd:        number;
  readonly hpGrowth:       number;
  readonly atkGrowth:      number;
  readonly defGrowth:      number;
  readonly spdGrowth:      number;
  readonly initialSkillId: string;
  readonly evolvesTo?:      string;   // 進化先のモンスターマスタID (Lv15進化)
}

// monsters.json の生データ（MonsterMasterData のスーパーセット）
interface RawMonsterMaster extends MonsterMasterData {
  dropRate: number;
}

let cache: MonsterMasterData[] | null = null;

export async function getAllMonsterMasters(): Promise<MonsterMasterData[]> {
  if (cache) return cache;
  const res  = await fetch('/masters/monsters.json');
  const data = await res.json() as { items: RawMonsterMaster[] };
  cache = data.items;
  return cache;
}

export async function getMonsterMasterById(monsterId: string): Promise<MonsterMasterData | null> {
  const all = await getAllMonsterMasters();
  return all.find((m) => m.monsterId === monsterId) ?? null;
}

/**
 * レベルを適用したステータスを返す。
 * マスタが見つからない場合は汎用デフォルト値（Lv1基準）を返す。
 */
export function computeStats(master: MonsterMasterData | null, level: number): MonsterStats {
  if (!master) {
    // フォールバック（スターターモンスター "MON_*" など、masters に存在しない ID 向け）
    return {
      maxHp: 100 + (level - 1) * 8,
      atk:   15  + (level - 1) * 2,
      def:   10  + (level - 1) * 1,
      spd:   10  + (level - 1) * 1,
    };
  }
  const lv = Math.max(1, level);
  return {
    maxHp: master.baseHp  + master.hpGrowth  * (lv - 1),
    atk:   master.baseAtk + master.atkGrowth  * (lv - 1),
    def:   master.baseDef + master.defGrowth  * (lv - 1),
    spd:   master.baseSpd + master.spdGrowth  * (lv - 1),
  };
}

/** テスト用キャッシュクリア */
export function _resetMonsterMasterCache(): void {
  cache = null;
}
