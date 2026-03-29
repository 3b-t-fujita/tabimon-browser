import { expect, test, type Page } from '@playwright/test';

async function seedPendingResultSave(page: Page) {
  await page.goto('/setup');

  await page.evaluate(async () => {
    function deleteDatabase(name: string) {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        request.onblocked = () => resolve();
      });
    }

    function openDatabase(name: string) {
      return new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(name, 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('saves')) {
            db.createObjectStore('saves', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('saveMeta')) {
            db.createObjectStore('saveMeta', { keyPath: 'key' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    function putRecord<T>(db: IDBDatabase, storeName: string, value: T) {
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).put(value);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    }

    await deleteDatabase('TabimonDB');
    const db = await openDatabase('TabimonDB');
    const now = new Date().toISOString();

    const save = {
      player: {
        playerId: 'p-1',
        playerName: 'テスター',
        worldId: 'WORLD_FOREST',
        mainMonsterId: 'mon-1',
      },
      progress: {
        unlockedStageIds: ['stage_w1_1'],
        clearedStageIds: [],
      },
      settings: { bgmVolume: 1, sfxVolume: 1 },
      dailyRecord: null,
      ownedMonsters: [
        {
          uniqueId: 'mon-1',
          monsterMasterId: 'MON_GRASS_001',
          displayName: 'グリーニョ',
          worldId: 'WORLD_FOREST',
          role: 'ROLE_ATTACK',
          level: 1,
          exp: 0,
          currentExp: 0,
          bondPoints: 0,
          bondRank: 0,
          personality: 'PERSONALITY_BRAVE',
          skillIds: [],
          skillProficiency: {},
          evolutionBranchId: null,
          bondMilestoneRead: [],
          isMain: true,
        },
      ],
      supportMonsters: [],
      qrReceiveHistory: [],
      adventureSession: {
        sessionId: 'sess-1',
        stageId: 'stage_w1_1',
        currentNodeIndex: 4,
        partySnapshot: {
          main: {
            uniqueId: 'mon-1',
            monsterMasterId: 'MON_GRASS_001',
            displayName: 'グリーニョ',
            personality: 'PERSONALITY_BRAVE',
            stats: { maxHp: 100, atk: 15, def: 10, spd: 10 },
            skills: [],
            isMain: true,
            worldId: 1,
          },
          supporters: [],
        },
        battleCheckpointNodeIndex: -1,
        resultPendingFlag: true,
        status: 'SESSION_PENDING_RESULT',
        pendingResultType: 'FAILURE',
        nextBattleBuffMultiplier: 1,
        randomEventBattle: false,
        resultSkillUsageCounts: {},
      },
      pendingCandidate: null,
    };

    await putRecord(db, 'saves', {
      id: 'main',
      payload: JSON.stringify(save),
      updatedAt: now,
    });

    await putRecord(db, 'saveMeta', {
      key: 'save_version',
      value: '2',
      updatedAt: now,
    });

    db.close();
  });
}

test('リザルト反映後にホームで EXP ときずなが更新されて見える', async ({ page }) => {
  await seedPendingResultSave(page);

  await page.goto('/adventure/result?type=FAILURE');

  await expect(page.getByText('けいけんち', { exact: true })).toBeVisible();
  await expect(page.getByTestId('result-bond-section')).toBeVisible();
  await expect(page.getByRole('button', { name: 'ホームへ戻る' })).toBeVisible();

  await page.getByRole('button', { name: 'ホームへ戻る' }).click();

  await expect(page).toHaveURL(/\/home$/);

  const growthCard = page.getByRole('button', { name: /成長サマリー/ });
  await expect(growthCard).toBeVisible();
  await expect(growthCard).toContainText('Lv 1');
  await expect(growthCard).toContainText('つぎまで あと 35');
  await expect(growthCard).toContainText('きずな ★0');
  await expect(growthCard).toContainText('つぎまで あと 47');
});
