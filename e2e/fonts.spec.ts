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
  // Every stylesheet the home page loads, read in full before measuring, and judged by what travels over the
  // network: compressed size. Raw size is a weak guide (repeated class names compress well).
  const bodies: Promise<Buffer>[] = [];
  page.on('response', (r) => { if (r.url().endsWith('.css') && !r.url().includes('/fonts/')) bodies.push(r.body()); });
  await page.goto('/en/');
  await page.waitForLoadState('networkidle');
  const { gzipSync } = await import('node:zlib');
  const files = await Promise.all(bodies);
  expect(files.length).toBeGreaterThan(0);
  const compressed = files.reduce((sum, b) => sum + gzipSync(b, { level: 9 }).length, 0);
  expect(compressed).toBeLessThan(24_000);
});
