import { expect, test } from '@playwright/test';

test('Arabic is right to left', async ({ page }) => {
  await page.goto('/ar/');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

test('the mobile menu opens from the start side in Arabic and English', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [locale, side] of [['ar', 'right'], ['en', 'left']] as const) {
    await page.goto(`/${locale}/`);
    await page.getByRole('button', { name: 'Open menu' }).click();
    const box = (await page.getByTestId('mobile-menu').boundingBox())!;
    if (side === 'right') expect(Math.round(box.x + box.width)).toBe(390);
    else expect(Math.round(box.x)).toBe(0);
  }
});

test('Escape closes the mobile menu and returns focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByTestId('mobile-menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('mobile-menu')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
});

test('Tab stays inside the open mobile menu, including its close button', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/');
  const toggle = page.getByRole('button', { name: 'Open menu' });
  await toggle.click();
  const panel = page.getByTestId('mobile-menu');
  await expect(panel.locator(':focus')).toHaveCount(1);
  let reachedToggle = false;
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    reachedToggle ||= await page.evaluate(() => document.activeElement?.getAttribute('aria-controls') === 'mobile-menu');
    const inside = await page.evaluate(() => {
      const el = document.activeElement;
      return !!el && (!!el.closest('#mobile-menu') || el.getAttribute('aria-controls') === 'mobile-menu');
    });
    expect(inside).toBe(true);
  }
  expect(reachedToggle).toBe(true);
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('header'))).toBe(true);
});
