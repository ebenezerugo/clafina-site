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
