import { expect, test } from '@playwright/test';

test('home renders in English', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Run the whole business from one place.');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('Start free carries the language into sign-up', async ({ page }) => {
  await page.goto('/fr/');
  await expect(page.locator('#hero').getByRole('link', { name: 'Start free' })).toHaveAttribute('href', 'https://app.clafina.com/signup?lang=fr');
});

test('the language switcher keeps the page', async ({ page }) => {
  await page.goto('/en/');
  await page.getByRole('button', { name: /Language/ }).click();
  await page.getByRole('link', { name: 'Français' }).click();
  await expect(page).toHaveURL(/\/fr\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
});

test('Escape closes the language list and returns focus', async ({ page }) => {
  await page.goto('/en/');
  const button = page.getByRole('button', { name: /Language/ });
  await button.click();
  await expect(page.getByRole('link', { name: 'Deutsch' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('link', { name: 'Deutsch' })).toBeHidden();
  await expect(button).toBeFocused();
});

test('draft languages are kept out of search, English is indexed', async ({ page }) => {
  await page.goto('/yo/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await page.goto('/en/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index/);
  await expect(page.locator('link[rel="alternate"][hreflang="zh-Hans"]')).toHaveAttribute('href', 'https://clafina.com/zh/');
});

test('the root address offers every language without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Yorùbá' })).toHaveAttribute('href', '/yo/');
  await expect(page.getByRole('listitem')).toHaveCount(20);
  await context.close();
});

test('home looks the same above the fold', async ({ page }) => {
  // The first screen only: across machines a long page can gain a line where text sits near a wrap point,
  // so full-page pixel comparisons fail on font rendering rather than on real layout changes.
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const l of ['en', 'ar']) {
    await page.goto(`/${l}/`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`home-${l}.png`, { maxDiffPixelRatio: 0.03 });
  }
});
