import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('the screen kit fits a phone without sideways scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/screens/');
  await expect(page.locator('[data-screen]').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const box = (await page.locator('[data-screen]').first().boundingBox())!;
  expect(box.width).toBeLessThanOrEqual(390);
});

test('screens describe themselves once and hide their contents', async ({ page }) => {
  await page.goto('/en/screens/');
  const screen = page.locator('[data-screen]').first();
  await expect(screen).toHaveAttribute('role', 'img');
  await expect(screen).toHaveAttribute('aria-label', /Illustrative example/);
  await expect(screen.locator('> div')).toHaveAttribute('aria-hidden', 'true');
});

test('the screen kit has no accessibility violations', async ({ page }) => {
  await page.goto('/en/screens/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});

test('Arabic money and layout on screens', async ({ page }) => {
  await page.goto('/ar/screens/');
  await expect(page.locator('[data-screen] .s-root').first()).toHaveAttribute('dir', 'rtl');
});
