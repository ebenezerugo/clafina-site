import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('help centre', () => {
  test('the home lists every module and searches the guide', async ({ page }) => {
    await page.goto('/en/help/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    expect(await page.locator('#sections a').count()).toBeGreaterThanOrEqual(40);
    const box = page.getByRole('searchbox');
    await box.fill('send invoice');
    const first = page.locator('[role="search"] li a').first();
    await expect(first).toContainText(/invoice/i);
    await box.fill('zzqx nothing');
    await expect(page.getByText('Nothing matches yet')).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id)).toEqual([]);
  });

  test('a module guide shows every page of the menu, with links into the app', async ({ page }) => {
    await page.goto('/en/help/sales/');
    await expect(page.getByRole('heading', { level: 1, name: 'Sales' })).toBeVisible();
    await expect(page.locator('#pages article')).toHaveCount(15);
    await expect(page.locator('#sales-invoices')).toContainText('Sell › Sales › Invoices');
    await expect(page.locator('#sales-invoices ol li').first()).toBeVisible();
    expect(await page.locator('#how-to li').count()).toBeGreaterThanOrEqual(5);
    expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id)).toEqual([]);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test('a module without a written guide still documents its pages', async ({ page }) => {
    const res = await page.goto('/en/help/drive/');
    expect(res?.status()).toBe(200);
    expect(await page.locator('#pages article').count()).toBeGreaterThan(5);
  });

  test('a how-to has numbered steps, HowTo data and a link into the app', async ({ page }) => {
    await page.goto('/en/help/sales/send-an-invoice/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Send an invoice and get paid');
    expect(await page.locator('#steps ol > li').count()).toBeGreaterThanOrEqual(3);
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.some((x) => x.includes('"HowTo"'))).toBe(true);
    await expect(page.getByRole('link', { name: 'Open in Clafina' })).toHaveAttribute('href', /sales\/invoices/);
    expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id)).toEqual([]);
  });

  test('help never names a payment, messaging or tax-authority service', async ({ request }) => {
    const body = await (await request.get('/en/help/search.json')).text();
    expect(body).not.toMatch(/WhatsApp|Paystack|Flutterwave|FIRS|Remita|Telegram|TikTok/);
    expect(body).not.toMatch(/\bCommerce\b/);
  });
});

test('other languages read the English guide until it is translated', async ({ page, request }) => {
  expect((await request.get('/fr/help/')).status()).toBe(404);
  await page.goto('/fr/');
  const links = await page.locator('a[href*="/help/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(links.length).toBeGreaterThan(0);
  expect(links.every((h) => h!.startsWith('/en/help/'))).toBe(true);
});
