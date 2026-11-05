import { expect, test } from '@playwright/test';

test('English pages load no fonts for other scripts', async ({ page }) => {
  const fonts: string[] = [];
  page.on('request', (r) => { if (r.url().includes('/fonts/')) fonts.push(r.url()); });
  await page.goto('/en/');
  await expect(page.locator('link[href^="/fonts/"]')).toHaveCount(0);
  expect(fonts).toEqual([]);
});

test('Arabic pages link the Arabic font only', async ({ page }) => {
  await page.goto('/ar/');
  await expect(page.locator('link[href^="/fonts/"]')).toHaveAttribute('href', '/fonts/arabic.css');
});

test('the page CSS is small', async ({ page }) => {
  let bytes = 0;
  page.on('response', async (r) => { if (r.url().endsWith('.css') && !r.url().includes('/fonts/')) bytes += (await r.body()).length; });
  await page.goto('/en/');
  await page.waitForLoadState('networkidle');
  expect(bytes).toBeLessThan(60_000);
});
