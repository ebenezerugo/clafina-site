import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const SOLUTIONS = ['small-business', 'growing-business', 'enterprise', 'multi-branch', 'owners', 'finance-teams', 'operations', 'sales-teams', 'hr-and-people'];
const WHY = ['one-record', 'switching', 'offline', 'languages-and-currencies'];
const DOCS = ['/partners/accountants/', '/partners/implementation/', '/developers/', '/developers/webhooks/', '/trust/security/', '/trust/privacy/', '/trust/reliability/', '/trust/accessibility/', '/about/', '/careers/', '/press/', '/contact/', '/legal/privacy/', '/legal/terms/', '/legal/cookies/', '/legal/acceptable-use/', '/legal/data-processing/'];
const SIMPLE = ['/resources/guides/', '/resources/templates/', '/resources/glossary/', '/whats-new/', '/download/', '/partners/apply/', '/developers/sign-up/'];

const clean = async (page: import('@playwright/test').Page) => {
  expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
};

for (const slug of SOLUTIONS) {
  test(`solution: ${slug}`, async ({ page }) => {
    expect((await page.goto(`/en/solutions/${slug}/`))?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    const ids = await page.locator('main > section').evaluateAll((s) => s.map((x) => x.id));
    expect(ids).toEqual(['hero', 'pains', 'story', 'modules', 'plan', 'faq', 'cta']);
    await expect(page.locator('#story [data-illustrative]')).toContainText('Illustrative example');
    for (const s of await page.locator('[data-screen]').all()) await expect(s).toHaveAttribute('aria-label', /^Illustrative example/);
    await clean(page);
  });
}

for (const slug of WHY) {
  test(`why: ${slug}`, async ({ page }) => {
    expect((await page.goto(`/en/why/${slug}/`))?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    expect(await page.locator('#explainer h2').count()).toBeGreaterThanOrEqual(3);
    await clean(page);
  });
}

for (const path of DOCS) {
  test(`doc: ${path}`, async ({ page }) => {
    expect((await page.goto(`/en${path}`))?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    const toc = await page.locator('nav[aria-labelledby="toc-title"] a').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
    expect(toc.length).toBeGreaterThanOrEqual(2);
    for (const href of toc) await expect(page.locator(href)).toHaveCount(1);
    if (path.startsWith('/legal/')) await expect(page.locator('[data-draft]')).toBeVisible();
    await clean(page);
  });
}

for (const path of SIMPLE) {
  test(`page: ${path}`, async ({ page }) => {
    expect((await page.goto(`/en${path}`))?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await clean(page);
  });
}

test('the guides only link to how-tos that exist', async ({ page, request }) => {
  await page.goto('/en/resources/guides/');
  const links = await page.locator('main ol a').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
  expect(links.length).toBeGreaterThan(5);
  for (const href of links) expect((await request.get(href)).status(), href).toBe(200);
});

test('the templates print one document at a time', async ({ page }) => {
  await page.goto('/en/resources/templates/');
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => { document.body.dataset.printing = 'quotation'; });
  await expect(page.locator('[data-print="quotation"]')).toBeVisible();
  await expect(page.locator('[data-print="invoice"]')).toBeHidden();
  await expect(page.locator('header').first()).toBeHidden();
});

test('start hands the visitor on to sign-up with what it was given', async ({ page }) => {
  await page.route('https://app.clafina.com/**', (r) => r.fulfill({ status: 200, body: 'signup' }));
  await page.goto('/en/start/?plan=growth&pack=restaurant&utm_source=flyer&evil=1');
  await page.waitForURL(/app\.clafina\.com/);
  const u = new URL(page.url());
  expect(u.searchParams.get('plan')).toBe('growth');
  expect(u.searchParams.get('pack')).toBe('restaurant');
  expect(u.searchParams.get('utm_source')).toBe('flyer');
  expect(u.searchParams.get('evil')).toBeNull();
});

test('the glossary has words from the app and the trades', async ({ page }) => {
  await page.goto('/en/resources/glossary/');
  expect(await page.locator('main dt').count()).toBeGreaterThan(40);
  await expect(page.locator('main dt', { hasText: /^Folio$/ })).toHaveCount(1);
});
