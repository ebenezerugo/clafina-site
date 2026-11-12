import { describe, expect, it } from 'vitest';
import { PROFILES, profileFor, pricingCountryFor, type ProfileId } from '../../src/profiles/profiles';
import { resolve, resolveText, tokenMarkup } from '../../src/profiles/tokens';

const ids = Object.keys(PROFILES) as ProfileId[];
const amount = (s: string) => Number(s.replace(/[^\d.-]/g, ''));

describe('country profiles', () => {
  it('gives every country a full cast, in its own currency', () => {
    for (const id of ids) for (const name of Object.values(PROFILES[id].names)) expect(name.trim().length).toBeGreaterThan(1);
    expect(profileFor('NG')).toBe('ng');
    expect(profileFor('gb')).toBe('gb');
    expect(profileFor('CH')).toBe('global'); // no profile in Swiss francs, so never a neighbour's money
    expect(profileFor(null)).toBe('global');
    expect(pricingCountryFor('ng')).toBe('ng');
    expect(pricingCountryFor('mx')).toBe('latam');
  });

  it('keeps every story total equal to its lines in every currency', () => {
    for (const id of ids) {
      const sub = amount(resolve('m', 'quo.subtotal', id)), tax = amount(resolve('m', 'quo.tax', id)), total = amount(resolve('m', 'quo.total', id));
      expect(Math.round((sub + tax) * 100)).toBe(Math.round(total * 100));
      expect(Math.round(amount(resolve('m', 'quo.offer', id)) * 40 * 100)).toBe(Math.round(sub * 100));
      const maize = amount(resolve('m', 'farm.maize', id)), seed = amount(resolve('m', 'farm.seed', id)), fert = amount(resolve('m', 'farm.fertiliser', id));
      expect(Math.round((maize + seed + fert) * 100)).toBe(Math.round(amount(resolve('m', 'farm.net', id)) * 100));
    }
  });

  it('builds Nigeria with the original figures', () => {
    expect(resolveText('⟦n:sales⟧ · ⟦n:shop⟧ · ⟦m:quo.offer⟧ · ⟦t:label⟧ ⟦t:rate⟧ · ⟦m:quo.total⟧', 'ng')).toBe('Ada · Lagoon Foods · ₦29,000 · VAT 7.5% · ₦1,247,000');
  });

  it('wraps tokens so the browser can swap them, and shows unknown tokens rather than hiding them', () => {
    expect(tokenMarkup('Hi ⟦n:sales⟧', 'span')).toBe('Hi <span data-tk="n:sales">Maya</span>');
    expect(resolveText('⟦n:nobody⟧')).toBe('⟦n:nobody⟧');
  });
});
