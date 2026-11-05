import { expect, test } from '@playwright/test';

test('an unknown language shows the 404 page', async ({ page }) => {
  const response = await page.goto('/xx/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('We can’t find that page'.replace('’', "'"));
});

test('a missing page in a language shows that language’s 404 page', async ({ page }) => {
  const response = await page.goto('/fr/does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '/fr/');
});
