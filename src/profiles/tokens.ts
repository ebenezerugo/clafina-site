import { PROFILES, type Part, type Profile, type ProfileId } from './profiles';

/**
 * Tokens in content and drawings: ⟦n:part⟧ a name (⟦u:part⟧ in capitals), ⟦m:story.amount⟧ money, ⟦c:symbol⟧ the
 * currency sign, ⟦t:label⟧ / ⟦t:rate⟧ the sales tax, ⟦k:part⟧ a name with a capital first letter (a sentence's
 * first word), ⟦x:23400⟧ an amount first written in naira, in local money.
 * Pages are built with the global profile; the browser swaps every token to the visitor's profile.
 */
export const TOKEN = /⟦([nmtuckx]):([a-zA-Z0-9.]+)⟧/g;

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
/** Currencies people quote without minor units in daily trade. */
/** Dollars other than the US's show their country (CA$, MX$), so a price is never read as US dollars. */
const display = (p: Profile) => (p.currency === 'CAD' || p.currency === 'MXN' ? 'symbol' : 'narrowSymbol');
const digits = (p: Profile) => (p.currency === 'NGN' || p.currency === 'INR' || p.currency === 'KES' ? 0 : 2);
function roundMoney(v: number, p: Profile): number { const f = 10 ** digits(p); return Math.round(v * f) / f; }

export function money(v: number, p: Profile): string {
  return new Intl.NumberFormat(p.currency === 'INR' ? 'en-IN' : p.currency === 'KES' ? 'en-KE' : 'en', { style: 'currency', currency: p.currency, currencyDisplay: display(p), minimumFractionDigits: digits(p), maximumFractionDigits: digits(p) }).format(v);
}

/** The text for one token under a profile. Unknown tokens come back as they are, so a typo shows rather than hides. */
export function resolve(kind: string, key: string, id: ProfileId): string {
  const p = PROFILES[id];
  if (kind === 'n' || kind === 'u' || kind === 'k') {
    const n = p.names[key as Part];
    if (n === undefined) return `⟦${kind}:${key}⟧`;
    return kind === 'u' ? n.toLocaleUpperCase() : kind === 'k' ? n.charAt(0).toLocaleUpperCase() + n.slice(1) : n;
  }
  if (kind === 'x') return convertNaira(`₦${Number(key).toLocaleString('en')}`, id);
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

/**
 * Money already written in naira (the app screens and a few page lines), converted to the visitor's currency at
 * the same price levels as the stories. "₦842,000" in a UK visit becomes "£673.60"; "₦1.2m" becomes "£960".
 */
export const NAIRA = /(−|-)?₦\s?(\d[\d,]*(?:\.\d+)?)(?:\s?(k|m|bn)(?![\w]))?/gi;
const NAIRA_SCALE = PROFILES.ng.scale;
export function convertNaira(text: string, id: ProfileId): string {
  if (id === 'ng') return text;
  const p = PROFILES[id];
  return text.replace(NAIRA, (_, sign: string | undefined, num: string, suffix: string | undefined) => {
    const mult = suffix ? { k: 1e3, m: 1e6, bn: 1e9 }[suffix.toLowerCase() as 'k' | 'm' | 'bn'] : 1;
    const local = (Number(num.replace(/,/g, '')) * mult / NAIRA_SCALE) * p.scale;
    const out = suffix
      ? new Intl.NumberFormat(p.currency === 'KES' ? 'en-KE' : 'en', { style: 'currency', currency: p.currency, currencyDisplay: display(p), notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(local)
      : money(local, p);
    return (sign ? '−' : '') + out;
  });
}

/** The story names as built (global profile), longest first, as whole-word patterns. */
const capital = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);
const GLOBAL_NAMES = (Object.entries(PROFILES.global.names) as [Part, string][])
  .flatMap(([part, name]) => (capital(name) === name ? [[part, name, false]] : [[part, name, false], [part, capital(name), true]]) as [Part, string, boolean][])
  .sort((a, b) => b[1].length - a[1].length)
  .map(([part, name, cap]) => [part, cap, new RegExp(`(?<![\\p{L}])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'gu')] as const);

/** Text inside an app screen or a marked part of a page: story names and naira, both in the visitor's version. */
export function localiseText(text: string, id: ProfileId): string {
  let out = convertNaira(text, id);
  if (id === 'global') return out;
  for (const [part, cap, re] of GLOBAL_NAMES) out = out.replace(re, cap ? capital(PROFILES[id].names[part]) : PROFILES[id].names[part]);
  return out;
}
