import { expect, test } from '@playwright/test';

test('home shows its sections in order', async ({ page }) => {
  await page.goto('/en/');
  const ids = await page.locator('main > section').evaluateAll((s) => s.map((x) => x.id));
  expect(ids).toEqual(['hero', 'one-record', 'surfaces', 'modules', 'industries', 'works-where-you-work', 'trust', 'cta']);
});

test('every screen on the home page is labelled illustrative', async ({ page }) => {
  await page.goto('/en/');
  const screens = page.locator('[data-screen]');
  expect(await screens.count()).toBeGreaterThanOrEqual(4);
  for (const s of await screens.all()) await expect(s).toHaveAttribute('aria-label', /^Illustrative example/);
  await expect(page.getByText('Illustrative example', { exact: false }).first()).toBeVisible();
});

test('the one-record steps are all visible with reduced motion', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/en/');
  const steps = page.locator('#one-record [data-step]');
  await expect(steps).toHaveCount(4);
  for (const s of await steps.all()) await expect(s).toHaveCSS('opacity', '1');
  await ctx.close();
});

test('module links open pages that exist, and the rest are plain text', async ({ page, request }) => {
  await page.goto('/en/');
  await expect(page.locator('#modules li')).toHaveCount(21);
  for (const href of await page.locator('#modules a').evaluateAll((as) => as.map((a) => a.getAttribute('href')!))) {
    expect((await request.get(href)).status(), href).toBe(200);
  }
});

test('switched claims show in preview', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('#trust [data-claim="claims.uptime"]')).toBeVisible();
});

test('the home page fits a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
