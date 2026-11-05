import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/** Every product page that is built. Each one gets the same checks. */
const PRODUCTS = ['finance', 'payments', 'tax', 'business-health', 'sales', 'crm', 'pos', 'online-shop', 'trading-network', 'stock', 'purchasing', 'manufacturing', 'bookings', 'projects', 'assets', 'hr', 'communication', 'mobile', 'assistant', 'capture', 'integrations'];

for (const slug of PRODUCTS) {
  test.describe(`product page: ${slug}`, () => {
    test('has its sections in order and one heading', async ({ page }) => {
      const res = await page.goto(`/en/product/${slug}/`);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      const ids = await page.locator('main > section').evaluateAll((s) => s.map((x) => x.id));
      expect(ids).toEqual(['hero', 'jobs', 'tour', 'features', 'connects', 'surfaces', 'industries', 'faq', 'cta']);
    });
    test('labels every screen illustrative', async ({ page }) => {
      await page.goto(`/en/product/${slug}/`);
      const screens = page.locator('[data-screen]');
      expect(await screens.count()).toBeGreaterThanOrEqual(2);
      for (const s of await screens.all()) await expect(s).toHaveAttribute('aria-label', /^Illustrative example/);
    });
    test('links only to pages that exist, and carries FAQ data', async ({ page }) => {
      await page.goto(`/en/product/${slug}/`);
      await expect(page.locator('#industries a[href*="/industries/"]')).toHaveCount(0);
      const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(ld.some((x) => x.includes('"FAQPage"'))).toBe(true);
    });
    test('has no accessibility violations and fits a phone', async ({ page }) => {
      await page.goto(`/en/product/${slug}/`);
      expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.reload();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    });
  });
}

test('pre-launch features show in preview builds', async ({ page }) => {
  await page.goto('/en/product/sales/');
  await expect(page.locator('#features [data-prelaunch="product-sales"]').first()).toBeVisible();
});
