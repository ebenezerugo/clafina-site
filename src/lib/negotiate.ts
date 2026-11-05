import { DEFAULT_LOCALE, isLocale, type Locale } from '../config/locales';

const ALIASES: Record<string, Locale> = { ak: 'tw', twi: 'tw' };

function toLocale(tag: string): Locale | undefined {
  const lower = tag.toLowerCase();
  if (isLocale(lower)) return lower;
  const primary = lower.split('-')[0] ?? '';
  if (isLocale(primary)) return primary;
  return ALIASES[primary];
}

/** The best enabled language for an Accept-Language header, or English. */
export function pickLocale(acceptLanguage: string | null, enabled: readonly Locale[]): Locale {
  const ranked = (acceptLanguage ?? '')
    .split(',')
    .map((part, index) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      const weight = q ? Number(q.slice(2)) : 1;
      return { tag: tag.trim(), weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter((t) => t.tag && t.tag !== '*' && t.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  for (const { tag } of ranked) {
    const locale = toLocale(tag);
    if (locale && enabled.includes(locale)) return locale;
  }
  return DEFAULT_LOCALE;
}
