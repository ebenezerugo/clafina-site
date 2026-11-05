import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('prices follow the chosen country', async ({ page }) => {
  await page.goto('/en/pricing/');
  await expect(page.getByTestId('price-growth')).toHaveText(/\$29/);
  await page.getByLabel('Prices for').selectOption('ng');
  await expect(page.getByTestId('price-growth')).toContainText('₦');
});

test('the country chosen in the footer changes the prices too', async ({ page }) => {
  await page.goto('/en/pricing/');
  await page.locator('footer').getByLabel('Country').selectOption('ng');
  await expect(page.getByTestId('price-growth')).toContainText('₦');
});

test('pricing works with storage blocked', async ({ browser }) => {
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
  const page = await ctx.newPage();
  await page.goto('/en/pricing/');
  await expect(page.getByTestId('price-growth')).toHaveText(/\$29/);
  await page.getByLabel('Prices for').selectOption('ng');
  await expect(page.getByTestId('price-growth')).toContainText('₦');
  await ctx.close();
});

test('Start on a plan carries the plan into sign-up', async ({ page }) => {
  await page.goto('/en/pricing/');
  await expect(page.getByTestId('cta-growth')).toHaveAttribute('href', /plan=growth/);
});

test('the compare table scrolls inside its box on phones', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/pricing/compare/');
  await expect(page.getByRole('table')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('pricing pages have no accessibility violations', async ({ page }) => {
  for (const path of ['/en/pricing/', '/en/pricing/compare/']) {
    await page.goto(path);
    expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id)).toEqual([]);
  }
});

test('Pricing appears in the header once it exists', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('header').getByRole('link', { name: 'Pricing' })).toHaveAttribute('href', '/en/pricing/');
});
