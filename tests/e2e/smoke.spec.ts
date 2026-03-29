import { expect, test } from '@playwright/test';

test.describe('tabimon smoke', () => {
  test('setup から開始できる', async ({ page }) => {
    await page.goto('/setup');

    await expect(page.getByText('タビモンへようこそ')).toBeVisible();

    await page.getByRole('radio', { name: /ミドリの森/ }).check();
    await page.getByRole('button', { name: /ぼうけんを はじめる/ }).click();

    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/setup\?/);
  });

  test('ステージ選択でタブを切り替えられる', async ({ page }) => {
    await page.goto('/adventure/stages');

    await expect(page.getByRole('heading', { name: 'ステージを えらぼう' })).toBeVisible();
    await expect(page.getByText('ものがたりを すすめよう')).toBeVisible();
    await page.getByRole('button', { name: 'そだてる' }).click();
    await expect(page.getByText('そだてて つよくなろう')).toBeVisible();
    await expect(page.getByText('けいけんちの草原・前半')).toBeVisible();
    await expect(page.getByText('きずなの広場・前半')).toBeVisible();
    await expect(page.getByText('わざみがきの丘・前半')).toBeVisible();
    await page.getByRole('button', { name: 'ものがたり' }).click();
    await expect(page.getByText('ものがたりを すすめよう')).toBeVisible();
  });

  test('静的プレビューで主要画面を確認できる', async ({ page }) => {
    await page.goto('/preview/ui');
    await expect(page.getByRole('heading', { name: 'タビモン UI プレビュー' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ホーム' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ステージ選択' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'モンスター詳細' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'リザルト' })).toBeVisible();
  });
});
