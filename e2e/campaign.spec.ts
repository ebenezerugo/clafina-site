import { expect, test } from '@playwright/test';

test('campaign tags on the landing address reach every Start free link', async ({ page }) => {
  await page.goto('/en/?utm_source=x%20y&utm_campaign=a%26b%22c&foo=bar');
  for (const link of await page.getByRole('link', { name: 'Start free' }).all()) {
    await expect(link).toHaveAttribute('href', 'https://app.clafina.com/signup?lang=en&utm_source=x+y&utm_campaign=a%26b%22c');
  }
});

test('campaign tags survive moving to another page', async ({ page }) => {
  await page.goto('/en/?utm_source=news');
  // Wait until this page has saved the tags (its link is rewritten) before leaving it.
  await expect(page.locator('#hero').getByRole('link', { name: 'Start free' })).toHaveAttribute('href', /utm_source=news/);
  await page.goto('/fr/');
  await expect(page.locator('#hero').getByRole('link', { name: 'Start free' })).toHaveAttribute('href', 'https://app.clafina.com/signup?lang=fr&utm_source=news');
});
