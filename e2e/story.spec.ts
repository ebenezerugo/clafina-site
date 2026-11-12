import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const URL = '/en/stories/journey-of-a-quote/';

test('the story opens on its first chapter and steps through by button and keyboard', async ({ page }) => {
  await page.goto(URL);
  await expect(page.getByRole('heading', { level: 2, name: 'Ada writes a quote' })).toBeVisible();
  await expect(page.locator('.ill svg')).toHaveAttribute('aria-label', 'Ada writes a quote');
  await page.getByRole('button', { name: 'Next chapter' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Sealed, and on its way' })).toBeVisible();
  await expect(page.locator('.ill svg')).toHaveAttribute('aria-label', 'Sealed, and on its way');
  await page.getByRole('button', { name: 'Next chapter' }).press('ArrowRight');
  await expect(page.getByRole('heading', { level: 2, name: 'Tunde names his own price' })).toBeVisible();
});

test('the delivery chapter can go by bike, and the paper trail jumps to a paper', async ({ page }) => {
  await page.goto(URL);
  await page.getByRole('button', { name: /Waybill/ }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Musa takes the road' })).toBeVisible();
  await page.getByRole('button', { name: 'Send it on a bike' }).click();
  await expect(page.getByRole('button', { name: 'Send it in the van' })).toBeVisible();
  await expect(page.locator('.ill svg')).toHaveAttribute('aria-label', 'Musa takes the road');
});

test('the story page has no accessibility violations and fits a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(URL);
  await expect(page.locator('.ill svg')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('the home page shows the story poster and links to the story', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('#one-record .ill svg')).toBeVisible();
  await expect(page.locator('#one-record').getByRole('link', { name: 'Follow one sale, start to finish' })).toHaveAttribute('href', URL);
});
