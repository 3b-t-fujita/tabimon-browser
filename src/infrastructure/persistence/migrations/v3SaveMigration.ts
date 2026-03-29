import type { MainSaveSnapshot } from '@/infrastructure/storage/models';
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';
import type { TabimonDatabase } from '@/infrastructure/persistence/db/tabimonDb';

export const SAVE_META_KEY_VERSION = 'save_version';
export const SAVE_META_KEY_V2_BACKUP = 'backup_v2_main_payload';
export const SAVE_VERSION_V2 = 1;
export const SAVE_VERSION_V3 = 2;

function toV3OwnedMonster(monster: OwnedMonster): OwnedMonster {
  const skillProficiency = monster.skillProficiency ?? Object.fromEntries(
    (monster.skillIds ?? []).map((skillId) => [skillId as string, { useCount: 0, stage: 0 as const }]),
  );

  return {
    ...monster,
    currentExp: monster.currentExp ?? monster.exp ?? 0,
    bondPoints: monster.bondPoints ?? 0,
    bondRank: monster.bondRank ?? 0,
    skillProficiency,
    evolutionBranchId: monster.evolutionBranchId ?? null,
    bondMilestoneRead: monster.bondMilestoneRead ?? [],
  };
}

export function migrateMainSaveSnapshotToV3(snapshot: MainSaveSnapshot): MainSaveSnapshot {
  return {
    ...snapshot,
    dailyRecord: snapshot.dailyRecord ?? null,
    ownedMonsters: snapshot.ownedMonsters.map(toV3OwnedMonster),
  };
}

export async function getStoredSaveVersion(db: TabimonDatabase): Promise<number> {
  const record = await db.saveMeta.get(SAVE_META_KEY_VERSION);
  const parsed = record ? Number.parseInt(record.value, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : SAVE_VERSION_V2;
}

export async function setStoredSaveVersion(db: TabimonDatabase, version: number): Promise<void> {
  await db.saveMeta.put({
    key: SAVE_META_KEY_VERSION,
    value: String(version),
    updatedAt: new Date().toISOString(),
  });
}

export async function backupV2PayloadIfNeeded(db: TabimonDatabase, payload: string): Promise<void> {
  const exists = await db.saveMeta.get(SAVE_META_KEY_V2_BACKUP);
  if (exists) return;

  await db.saveMeta.put({
    key: SAVE_META_KEY_V2_BACKUP,
    value: payload,
    updatedAt: new Date().toISOString(),
  });
}
