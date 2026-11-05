import { LOCALES, localeInfo, type Locale } from '../config/locales';
import { SITE, fact } from '../config/site';
import { localeEnabled, localeIndexed } from '../config/switches';
import { localePath } from './paths';

export const SITE_ORIGIN = 'https://clafina.com';

const url = (locale: Locale, path: string) => `${SITE_ORIGIN}${localePath(locale, path)}`;

/** Canonical address for this language, and every enabled language version plus an English default. */
export function alternates(locale: Locale, path: string): { canonical: string; languages: Record<string, string> } {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) if (localeEnabled(l.code)) languages[l.hreflang] = url(l.code, path);
  languages['x-default'] = url('en', path);
  return { canonical: url(locale, path), languages };
}

/** Draft languages stay out of search until a native speaker reviews them. */
export function robotsFor(locale: Locale): { index: boolean; follow: true } {
  return { index: localeIndexed(locale), follow: true };
}

/** Organization structured data, only once the company facts are real. */
export function organizationJsonLd(): Record<string, unknown> | null {
  const legalName = fact(SITE.legalName);
  if (!legalName) return null;
  const sameAs = Object.values(SITE.socials).map(fact).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Clafina',
    legalName,
    url: SITE_ORIGIN,
    ...(fact(SITE.address) && { address: fact(SITE.address) }),
    ...(sameAs.length && { sameAs }),
  };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/** One language's sitemap: each page with links to its versions in the indexed languages. */
export function sitemapXml(locale: Locale, paths: string[], indexed: Locale[]): string {
  const entries = paths.map((path) => {
    const links = [...indexed.map((l) => `<xhtml:link rel="alternate" hreflang="${localeInfo(l).hreflang}" href="${esc(url(l, path))}"/>`),
      `<xhtml:link rel="alternate" hreflang="x-default" href="${esc(url('en', path))}"/>`];
    return `  <url>\n    <loc>${esc(url(locale, path))}</loc>\n    ${links.join('\n    ')}\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`;
}
