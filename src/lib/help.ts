import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Locale } from '@/config/locales';
import { isOn } from '@/config/switches';
import { loadContent } from '@/content/load';
import { HelpCatalogue, HelpModuleGuide, type HelpArticle, type HelpModuleEntry } from '@/content/help';
import { appUrl, openInAppUrl } from '@/lib/links';
import { visible } from '@/lib/visible';

export const helpCatalogue = (locale: Locale) => loadContent(locale, 'help/catalogue', HelpCatalogue);

export function helpModules(locale: Locale): (HelpModuleEntry & { section: string })[] {
  return helpCatalogue(locale).sections.flatMap((s) => s.modules.map((m) => ({ ...m, section: s.title })));
}

/** A module's hand-written guide, when it has one (English when the language has none yet). */
export function helpGuide(locale: Locale, module: string): HelpModuleGuide | null {
  if (!existsSync(join('content', 'en', 'help', 'guides', `${module}.json`)) && !existsSync(join('content', locale, 'help', 'guides', `${module}.json`))) return null;
  return loadContent(locale, `help/guides/${module}`, HelpModuleGuide);
}

/** A guide's how-tos that may show: a pre-launch one only while its switch is on. */
export const helpArticles = (guide: HelpModuleGuide | null): HelpArticle[] => (guide ? guide.articles.filter(visible) : []);

/** Where "Open in Clafina" goes: the phone app when deep links are on, else the web app. */
export const openPage = (path: string) => (isOn('features.deepLinks') ? openInAppUrl(path) : appUrl(path));

export const helpModulePath = (module: string) => `/help/${module}/`;
export const helpArticlePath = (module: string, article: string) => `/help/${module}/${article}/`;

/** Every help address below /help/, for the sitemap and static params. */
export function helpPaths(locale: Locale = 'en'): string[] {
  return helpModules(locale).flatMap((m) => [helpModulePath(m.slug), ...helpArticles(helpGuide(locale, m.slug)).map((a) => helpArticlePath(m.slug, a.slug))]);
}

/** Module guides on disk, for the content check. */
export function guideFiles(root = 'content'): { locale: string; file: string }[] {
  if (!existsSync(root)) return [];
  return readdirSync(root).flatMap((locale) => {
    const dir = join(root, locale, 'help', 'guides');
    return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).map((file) => ({ locale, file })) : [];
  });
}
