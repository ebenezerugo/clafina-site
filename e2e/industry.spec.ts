import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/** Every industry story that is built. Each one gets the same checks. */
const STORIES = ['retail'];

for (const slug of STORIES) {
  test.describe(`industry story: ${slug}`, () => {
    test('has its sections in order and one heading', async ({ page }) => {
      const res = await page.goto(`/en/industries/${slug}/`);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      const ids = await page.locator('main > section').evaluateAll((s) => s.map((x) => x.id));
      expect(ids.filter((id) => id !== 'related')).toEqual(['hero', 'day', 'words', 'switches', 'shares', 'modules', 'faq', 'cta']);
    });
    test('labels the day and every screen illustrative', async ({ page }) => {
      await page.goto(`/en/industries/${slug}/`);
      await expect(page.locator('#day [data-illustrative]')).toContainText('Illustrative example');
      const times = await page.locator('#day time').allTextContents();
      expect(times.length).toBeGreaterThanOrEqual(6);
      expect([...times].sort()).toEqual(times);
      const screens = page.locator('[data-screen]');
      expect(await screens.count()).toBeGreaterThanOrEqual(3);
      for (const s of await screens.all()) await expect(s).toHaveAttribute('aria-label', /^Illustrative example/);
    });
    test('links only to pages that exist, and carries FAQ data', async ({ page }) => {
      await page.goto(`/en/industries/${slug}/`);
      for (const href of await page.locator('#shares a, #modules a, #related a').evaluateAll((as) => as.map((a) => a.getAttribute('href')!))) {
        expect((await page.request.get(href)).status(), href).toBe(200);
      }
      const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(ld.some((x) => x.includes('"FAQPage"'))).toBe(true);
    });
    test('has no accessibility violations and fits a phone', async ({ page }) => {
      await page.goto(`/en/industries/${slug}/`);
      expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.reload();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    });
  });
}

test.describe('industries index', () => {
  test('lists every built story and nothing else', async ({ page }) => {
    await page.goto('/en/industries/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    const hrefs = await page.locator('main [data-group] a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(hrefs.sort()).toEqual(STORIES.map((s) => `/en/industries/${s}/`).sort());
    expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id)).toEqual([]);
  });
});
