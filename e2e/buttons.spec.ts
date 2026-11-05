import { expect, test } from '@playwright/test';

/** Buttons use the app's radius (8px); tags and badges stay round. */
test('buttons share the app button radius', async ({ page }) => {
  for (const path of ['/en/', '/en/pricing/', '/en/demo/', '/en/product/sales/', '/en/industries/retail/']) {
    await page.goto(path);
    const buttons = page.locator('main a.min-h-12, main button.min-h-12, header a[data-signup]');
    expect(await buttons.count(), path).toBeGreaterThan(0);
    for (const b of await buttons.all()) {
      if (!(await b.isVisible())) continue;
      await expect(b, path).toHaveCSS('border-radius', '8px');
    }
  }
});
