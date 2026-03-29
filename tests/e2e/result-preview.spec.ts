import { expect, test } from '@playwright/test';

test('リザルト見本で主要セクションが見える', async ({ page }) => {
  await page.goto('/preview/ui');

  const resultFrame = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'リザルト' }) })
    .first();

  await expect(resultFrame.getByText('けいけんち', { exact: true })).toBeVisible();
  await expect(resultFrame.getByText('わざが みがかれてきた！')).toBeVisible();
  await expect(resultFrame.getByTestId('result-bond-section')).toBeVisible();
  await expect(resultFrame.getByTestId('result-skill-section')).toBeVisible();
  await expect(resultFrame.getByTestId('result-stage-unlock-section')).toBeVisible();
});
