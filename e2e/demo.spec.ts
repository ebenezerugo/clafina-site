import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function fillAll(page: import('@playwright/test').Page) {
  await page.getByLabel('Your name').fill('Ada Example');
  await page.getByLabel('Work email').fill('ada@example.com');
  await page.getByLabel('Business name').fill('Example Stores');
  await page.getByRole('main').getByLabel('Country').selectOption('NG');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Restaurants').check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('6 to 20').check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

test('the demo form never claims success when it is not connected', async ({ page }) => {
  await page.goto('/en/demo/');
  await fillAll(page);
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('not connected yet');
  await expect(page.getByText('Thanks.')).toHaveCount(0);
});

test('field errors show in place and take focus', async ({ page }) => {
  await page.goto('/en/demo/');
  await page.getByRole('button', { name: 'Continue' }).click();
  const name = page.getByLabel('Your name');
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(name).toBeFocused();
  const describedBy = await name.getAttribute('aria-describedby');
  await expect(page.locator(`[id="${describedBy}"]`)).toHaveText('Please fill this in.');
  await page.getByLabel('Your name').fill('Ada');
  await page.getByLabel('Work email').fill('not-an-email');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByLabel('Work email')).toBeFocused();
});

test('the industry comes from the link', async ({ page }) => {
  await page.goto('/en/demo/?industry=industry-farm');
  await page.getByLabel('Your name').fill('Ada Example');
  await page.getByLabel('Work email').fill('ada@example.com');
  await page.getByLabel('Business name').fill('Example Farms');
  await page.getByRole('main').getByLabel('Country').selectOption('GH');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByLabel('Farms')).toBeChecked();
});

test('the forms have no accessibility violations', async ({ page }) => {
  for (const path of ['/en/demo/', '/en/contact-sales/']) {
    await page.goto(path);
    expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id)).toEqual([]);
  }
});

test('Book a demo now shows on the home page', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('#hero').getByRole('link', { name: 'Book a demo' })).toHaveAttribute('href', '/en/demo/');
});
