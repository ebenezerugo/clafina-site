import { PROFILES, type Part, type Profile, type ProfileId } from './profiles';

/**
 * Tokens in content and drawings: ⟦n:part⟧ a name (⟦u:part⟧ in capitals), ⟦m:story.amount⟧ money, ⟦c:symbol⟧ the
 * currency sign, ⟦t:label⟧ / ⟦t:rate⟧ the sales tax.
 * Pages are built with the global profile; the browser swaps every token to the visitor's profile.
 */
export const TOKEN = /⟦([nmtuc]):([a-z0-9.]+)⟧/g;

/** Each story's amounts, in base units (US dollars), and how its totals follow from them. */
const LEDGERS: Record<string, (p: Profile) => Record<string, number>> = {
  quo: (p) => {
    const price = 31 * p.scale, offer = 29 * p.scale, subtotal = 40 * offer;
    const tax = roundMoney((subtotal * p.tax.rate) / 100, p);
    return { price, offer, subtotal, tax, total: subtotal + tax, zero: 0 };
  },
  farm: (p) => {
    const maize = 1240 * p.scale, seed = 180 * p.scale, fertiliser = 260 * p.scale;
    return { maize, seed: -seed, fertiliser: -fertiliser, net: maize - seed - fertiliser };
  },
};
const digits = (p: Profile) => (p.currency === 'NGN' ? 0 : 2);
function roundMoney(v: number, p: Profile): number { const f = 10 ** digits(p); return Math.round(v * f) / f; }

export function money(v: number, p: Profile): string {
  return new Intl.NumberFormat(p.currency === 'INR' ? 'en-IN' : 'en', { style: 'currency', currency: p.currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: digits(p), maximumFractionDigits: digits(p) }).format(v);
}

/** The text for one token under a profile. Unknown tokens come back as they are, so a typo shows rather than hides. */
export function resolve(kind: string, key: string, id: ProfileId): string {
  const p = PROFILES[id];
  if (kind === 'n' || kind === 'u') { const n = p.names[key as Part]; return n === undefined ? `⟦${kind}:${key}⟧` : kind === 'u' ? n.toLocaleUpperCase() : n; }
  if (kind === 'c') return money(0, p).replace(/[\d.,\s]/g, '');
  if (kind === 't') return key === 'rate' ? `${p.tax.rate}%` : key === 'label' ? p.tax.label : `⟦t:${key}⟧`;
  const [story, amount] = key.split('.');
  const ledger = LEDGERS[story ?? '']?.(p);
  const v = amount ? ledger?.[amount] : undefined;
  return v === undefined ? `⟦m:${key}⟧` : money(v, p);
}

/** Plain text with every token resolved (for labels and alt text). */
export const resolveText = (text: string, id: ProfileId = 'global') => text.replace(TOKEN, (_, k: string, key: string) => resolve(k, key, id));

/** Markup with every token wrapped so the browser can swap it: <span> in HTML, <tspan> inside SVG. */
export const tokenMarkup = (text: string, tag: 'span' | 'tspan', id: ProfileId = 'global') =>
  text.replace(TOKEN, (_, k: string, key: string) => `<${tag} data-tk="${k}:${key}">${resolve(k, key, id)}</${tag}>`);

/** Text split into plain parts and tokens, for React. */
export function splitTokens(text: string): (string | { kind: string; key: string })[] {
  const out: (string | { kind: string; key: string })[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push({ kind: m[1]!, key: m[2]! });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
