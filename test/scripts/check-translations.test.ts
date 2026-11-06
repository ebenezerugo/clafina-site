import { describe, expect, it } from 'vitest';
import { compare } from '../../scripts/check-translations';

const run = (en: unknown, tr: unknown) => { const out: string[] = []; compare(en as never, tr as never, '', out); return out; };

describe('a translation against its English file', () => {
  it('accepts translated words with the same shape', () => {
    expect(run({ title: 'Start free', items: ['product-sales'] }, { title: 'Commencer gratuitement', items: ['product-sales'] })).toEqual([]);
  });
  it('lets a missing key fall back to English', () => {
    expect(run({ a: 'One', b: 'Two' }, { a: 'Un' })).toEqual([]);
  });
  it('refuses new keys, changed identifiers, lost placeholders and lost names', () => {
    expect(run({ a: 'x' }, { a: 'y', b: 'z' })).toEqual(['b is not in English']);
    expect(run({ route: 'product-sales' }, { route: 'produit-ventes' })).toEqual(['route is an identifier and must stay "product-sales"']);
    expect(run({ c: '© {year} Clafina' }, { c: '© Clafina' })).toEqual(['c must keep the placeholders {year}']);
    expect(run({ c: 'Use Clafina' }, { c: 'Utilisez Clafine' })).toEqual(['c must keep "Clafina" as it is']);
    expect(run({ l: ['a', 'b'] }, { l: ['a'] })).toEqual(['l has 1 items; English has 2']);
    expect(run({ n: 3 }, { n: 4 })).toEqual(['n must stay 3']);
  });
});
