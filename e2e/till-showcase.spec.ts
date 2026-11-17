import { expect, test } from '@playwright/test';

test('the home till shows one business after another, and a chip chooses one', async ({ page }) => {
  await page.goto('/en/');
  const showcase = page.locator('#surfaces');
  await showcase.locator('.ts-lead').scrollIntoViewIfNeeded();
  await expect(showcase.locator('.ts-lead')).toContainText('restaurants');
  // It moves on by itself while on screen.
  await expect(showcase.locator('.ts-lead')).toContainText('supermarkets', { timeout: 8_000 });

  await showcase.getByRole('button', { name: 'Pharmacy', exact: true }).click();
  await expect(showcase.getByRole('button', { name: 'Pharmacy', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const on = showcase.locator('.ts-slide[data-state="on"]');
  await expect(on.getByText('Batch and expiry tracked')).toBeVisible();
  await expect(on.getByText('CAREPOINT PHARMACY', { exact: true })).toBeVisible();
  await expect(on.locator('img[src="/products/pharmacy/vitamin-c.webp"]').first()).toBeVisible();
});

test('the home till keeps still for anyone who prefers less motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/');
  const lead = page.locator('#surfaces .ts-lead');
  await lead.scrollIntoViewIfNeeded();
  await page.waitForTimeout(6_000);
  await expect(lead).toContainText('restaurants');
});

test('the till prices follow the visitor\'s country', async ({ page }) => {
  await page.goto('/en/?country=GB');
  const on = page.locator('#surfaces .ts-slide[data-state="on"]');
  await on.first().scrollIntoViewIfNeeded();
  await expect(on.getByText('£3.60').first()).toBeVisible();
});

test('the phone\'s status bar shows the visitor\'s own local time', async ({ browser }) => {
  const context = await browser.newContext({ timezoneId: 'Africa/Lagos', locale: 'en-GB' });
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date('2026-11-17T13:07:00Z'));
  await page.goto('/en/');
  const phone = page.locator('#surfaces .ts-slide[data-state="on"]').last();
  await phone.scrollIntoViewIfNeeded();
  await expect(page.locator('#surfaces').getByText('14:07', { exact: true })).toBeVisible();
  await context.close();
});
