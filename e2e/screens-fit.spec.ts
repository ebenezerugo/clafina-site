import { expect, test } from '@playwright/test';

/**
 * Every illustrative screen must hold its content: nothing may cross a card's edge or be cut off by a box,
 * in either direction of writing. A row that scrolls sideways (a phone's category chips) is allowed.
 */
for (const locale of ['en', 'ar']) {
  test(`every screen holds its content (${locale})`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/${locale}/screens/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const problems = await page.evaluate(() => {
      const out: string[] = [];
      const name = (s: Element) => (s.getAttribute('aria-label') ?? '').replace(/^Illustrative example: /, '').slice(0, 60);
      const scrolls = (el: Element) => {
        for (let a = el.parentElement; a; a = a.parentElement) if (['auto', 'scroll'].includes(getComputedStyle(a).overflowX)) return true;
        return false;
      };
      for (const screen of document.querySelectorAll('[data-screen]')) {
        for (const card of screen.querySelectorAll('.s-card')) {
          const c = card.getBoundingClientRect();
          for (const el of card.querySelectorAll('*')) {
            const r = el.getBoundingClientRect();
            if (!r.width || scrolls(el)) continue;
            const over = Math.max(r.right - c.right, c.left - r.left);
            if (over > 1.5) { out.push(`${name(screen)}: "${el.textContent?.trim().slice(0, 40)}" crosses its card by ${Math.round(over)}px`); break; }
          }
        }
        for (const el of screen.querySelectorAll('*')) {
          const cs = getComputedStyle(el);
          if (cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) out.push(`${name(screen)}: "${el.textContent?.trim().slice(0, 40)}" is cut short`);
        }
      }
      return out;
    });
    expect(problems).toEqual([]);
  });
}
