import { expect, test } from '@playwright/test';

test('setup から world 選択で home へ進める', async ({ page }) => {
  await page.goto('/setup');

  await expect(page.getByText('タビモンへようこそ')).toBeVisible();
  await page.getByRole('radio', { name: 'ミドリの森' }).check();
  await page.getByRole('button', { name: /ぼうけんを はじめる/ }).click();

  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole('button', { name: /ぼうけんへ いく/ })).toBeVisible();
  await expect(page.getByRole('button', { name: '成長サマリー' })).toBeVisible();
  await expect(page.getByText('EXP')).toBeVisible();
  await expect(page.getByText(/^きずな$/)).toBeVisible();
});

test('setup?worldId=... の GET 復帰でも home へ進める', async ({ page }) => {
  await page.goto('/setup?worldId=WORLD_FOREST');

  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole('button', { name: /ぼうけんへ いく/ })).toBeVisible();
});
