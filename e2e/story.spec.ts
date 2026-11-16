import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const URL = '/en/stories/journey-of-a-quote/';

test('the story opens on its first chapter and steps through by button and keyboard', async ({ page }) => {
  await page.goto(URL);
  await expect(page.getByRole('heading', { level: 2, name: 'Maya writes a quote' })).toBeVisible();
  await expect(page.locator('.ps')).toHaveAttribute('aria-label', 'Maya writes a quote');
  await expect(page.locator('.ps img.f.on').first()).toHaveAttribute('src', /office-typing-1280\.avif$/);
  await page.getByRole('button', { name: 'Next chapter' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Sealed, and on its way' })).toBeVisible();
  await expect(page.locator('.ps')).toHaveAttribute('aria-label', 'Sealed, and on its way');
  await page.getByRole('button', { name: 'Next chapter' }).press('ArrowRight');
  await expect(page.getByRole('heading', { level: 2, name: 'Leo names his own price' })).toBeVisible();
});

test('each chapter plays its scene: poses change and the paperwork updates', async ({ page }) => {
  await page.goto(URL);
  await page.getByRole('button', { name: /Sales order/ }).click();
  await expect(page.locator('.ps-card')).toContainText('needs Priya');
  await expect(page.locator('.ps-card')).toContainText('Approved by Priya', { timeout: 12_000 });
  await expect(page.locator('.ps img.f.on').first()).toHaveAttribute('src', /meeting-nod-1280\.avif$/);
});

test('the van drives through the delivery chapter, and the paper trail jumps to a paper', async ({ page }) => {
  await page.goto(URL);
  await page.getByRole('button', { name: /Waybill/ }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Omar takes the road' })).toBeVisible();
  await expect(page.locator('.ps-van img')).toBeVisible();
  await expect(page.locator('.ps-card')).toContainText('In transit');
});

test('the story page has no accessibility violations and fits a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // Contrast is judged on the finished card, not halfway through its fade-in.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(URL);
  await expect(page.locator('.ps img.f.on').first()).toBeVisible();
  await expect(page.locator('.ps-card')).toContainText('worked out for you');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('the home page shows the story poster and links to the story', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('#one-record .ill svg')).toBeVisible();
  await expect(page.locator('#one-record').getByRole('link', { name: 'Follow one sale, start to finish' })).toHaveAttribute('href', URL);
});

test('each moment on the Farm page shows its drawn scene as it scrolls into view', async ({ page }) => {
  await page.goto('/en/industries/farm/');
  const scenes = page.locator('#day .ill > svg');
  const moments = page.locator('#day ol > li');
  for (let i = 0; i < await moments.count(); i++) {
    await moments.nth(i).scrollIntoViewIfNeeded();
    await expect(moments.nth(i).locator('.ill > svg')).toBeVisible();
  }
  await expect(scenes).toHaveCount(8);
  await expect(scenes.first()).toHaveAttribute('aria-label', /^06:00\. /);
  await expect(page.locator('#day').getByText('Greenvale Family Farms', { exact: false }).first()).toBeVisible();
});

test('names, money and tax follow the visitor\'s country', async ({ page }) => {
  await page.goto('/en/stories/journey-of-a-quote/?country=NG');
  await expect(page.getByRole('heading', { level: 2, name: 'Ada writes a quote' })).toBeVisible();
  await expect(page.locator('aside dl')).toContainText('₦1,247,000');
  await page.getByRole('button', { name: 'Next chapter' }).click();
  await page.getByRole('button', { name: 'Next chapter' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Tunde names his own price' })).toBeVisible();
  await expect(page.locator('.ps-card')).toContainText('₦31,000');
  await expect(page.locator('.ps-card')).toContainText('₦29,000', { timeout: 12_000 });

  await page.goto('/en/industries/farm/?country=GB');
  await expect(page.locator('#day h2')).toHaveText('A day at Cotswold Family Farms');
});

for (const [slug, first] of [['accommodation', '03:00'], ['restaurant', '10:00'], ['retail', '08:30']] as const) {
  test(`every moment on the ${slug} page shows its drawn scene`, async ({ page }) => {
    await page.goto(`/en/industries/${slug}/`);
    const moments = page.locator('#day ol > li');
    for (let i = 0; i < await moments.count(); i++) {
      await moments.nth(i).scrollIntoViewIfNeeded();
      await expect(moments.nth(i).locator('.ill > svg')).toBeVisible();
    }
    await expect(page.locator('#day .ill > svg').first()).toHaveAttribute('aria-label', new RegExp(`^${first}\\. `));
    expect(await page.locator('main').textContent()).not.toContain('⟦');
  });
}
