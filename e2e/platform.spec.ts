import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('the platform page explains the whole product with real screens', async ({ page }) => {
  await page.goto('/en/platform/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  expect(await page.locator('[data-screen]').count()).toBeGreaterThanOrEqual(4);
  for (const id of ['one-record', 'surfaces', 'packs', 'everywhere', 'security', 'connect']) await expect(page.locator(`#${id}`)).toBeVisible();
  await expect(page.getByRole('img', { name: /One record/ })).toBeVisible();
});

test('the platform page has no accessibility violations and fits a phone', async ({ page }) => {
  await page.goto('/en/platform/');
  expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id)).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
