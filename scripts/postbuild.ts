import { copyFileSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LOCALES } from '../src/config/locales';
import { ROUTES } from '../src/config/routes';
import { localeEnabled, localeIndexed, pageAvailable } from '../src/config/switches';
import { SITE_ORIGIN, sitemapXml } from '../src/lib/seo';
import { helpPaths } from '../src/lib/help';
import { HELP_LOCALES, isHelpPath } from '../src/lib/paths';

const OUT = 'out';
const enabled = LOCALES.filter((l) => localeEnabled(l.code)).map((l) => l.code);
const indexed = enabled.filter(localeIndexed);

// Per-language 404 pages: Cloudflare Pages serves the nearest 404.html for a missing address.
for (const locale of enabled) {
  const built = join(OUT, locale, 'not-found-page', 'index.html');
  if (!existsSync(built)) throw new Error(`Missing ${built}`);
  copyFileSync(built, join(OUT, locale, '404.html'));
  rmSync(join(OUT, locale, 'not-found-page'), { recursive: true });
}

// One sitemap per indexed language, available pages only, plus the index and robots.txt.
const paths = ROUTES.filter((r) => !('previewOnly' in r) && pageAvailable(r.id) && !isHelpPath(r.path)).map((r) => r.path);
const help = pageAvailable('help') ? ['/help/', ...helpPaths()] : [];
// The help centre is listed only in the languages it is published in.
for (const locale of indexed) writeFileSync(join(OUT, `sitemap-${locale}.xml`), sitemapXml(locale, HELP_LOCALES.includes(locale) ? [...paths, ...help] : paths, indexed));
writeFileSync(
  join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexed.map((l) => `  <sitemap><loc>${SITE_ORIGIN}/sitemap-${l}.xml</loc></sitemap>`).join('\n')}\n</sitemapindex>\n`,
);
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`);
console.log(`Post-build: ${enabled.length} language 404 pages, ${indexed.length} sitemap(s).`);
