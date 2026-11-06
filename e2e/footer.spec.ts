import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('on a phone the footer folds into sections you open one at a time', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/');
  const footer = page.locator('footer').last();
  const product = footer.locator('details:has(#footer-product)');
  await expect(product).not.toHaveAttribute('open', /.*/);
  await expect(footer.getByRole('link', { name: 'Tax engine' })).toBeHidden();
  await footer.locator('#footer-product').click();
  await expect(footer.getByRole('link', { name: 'Tax engine' })).toBeVisible();
  // Legal stays in view in the bottom bar.
  await expect(footer.getByRole('link', { name: 'Terms', exact: true })).toBeVisible();
  expect((await new AxeBuilder({ page }).include('footer').analyze()).violations.map((v) => v.id)).toEqual([]);
});

test('on a wide screen every footer section is open, in the menu groups', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/en/');
  const footer = page.locator('footer').last();
  expect(await footer.locator('details:not([open])').count()).toBe(0);
  await expect(footer.getByRole('link', { name: 'Tax engine' })).toBeVisible();
  await expect(footer.locator('#footer-group-money')).toHaveText('Money');
});
