import { describe, expect, it } from 'vitest';
import { localePath, switcherPath } from '@/lib/paths';

describe('paths', () => {
  it('prefixes the language', () => {
    expect(localePath('fr', '/pricing/')).toBe('/fr/pricing/');
    expect(localePath('fr', '/')).toBe('/fr/');
  });
  it('keeps the page when switching language', () => {
    expect(switcherPath('/en/pricing/')).toBe('/pricing/');
    expect(switcherPath('/en/')).toBe('/');
  });
  it('sends the 404 page to the other language home page', () => {
    expect(switcherPath('/zu/not-found-page/')).toBe('/');
  });
});

describe('the help centre language', () => {
  it('sends languages without their own guide to the English one', async () => {
    const { localePath, helpLocale } = await import('../../src/lib/paths');
    expect(localePath('fr', '/help/')).toBe('/en/help/');
    expect(localePath('ar', '/help/sales/send-an-invoice/')).toBe('/en/help/sales/send-an-invoice/');
    expect(localePath('fr', '/pricing/')).toBe('/fr/pricing/');
    expect(localePath('en', '/help/')).toBe('/en/help/');
    expect(helpLocale('yo')).toBe('en');
  });
  it('lists only the published help languages as alternates', async () => {
    const { alternates } = await import('../../src/lib/seo');
    expect(Object.keys(alternates('fr', '/help/').languages).sort()).toEqual(['en', 'x-default']);
    expect(Object.keys(alternates('fr', '/pricing/').languages).length).toBeGreaterThan(10);
  });
});
