import { expect, test } from '@playwright/test';

test('仲間一覧から詳細画面を開ける', async ({ page }) => {
  await page.goto('/setup');

  await page.getByRole('radio', { name: 'ミドリの森' }).check();
  await page.getByRole('button', { name: /ぼうけんを はじめる/ }).click();

  await expect(page).toHaveURL(/\/home$/);

  await page.goto('/monsters');
  await expect(page.getByRole('heading', { name: '仲間一覧' })).toBeVisible();

  const firstMonster = page.locator('button').filter({ hasText: 'Lv.' }).first();
  await expect(firstMonster).toBeVisible();
  await firstMonster.click();

  await expect(page).toHaveURL(/\/monsters\/.+/);
  await expect(page.getByRole('heading', { name: 'グリーニョ' })).toBeVisible();
  await expect(page.getByText('EXP', { exact: true })).toBeVisible();
  await expect(page.getByText('きずな', { exact: true })).toBeVisible();
  await expect(page.getByText('スキル', { exact: true })).toBeVisible();
});
