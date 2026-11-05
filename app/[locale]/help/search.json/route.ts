import { LOCALES, isLocale, type Locale } from '@/config/locales';
import { localeEnabled } from '@/config/switches';
import type { HelpIndexEntry } from '@/components/help/HelpSearch';
import { helpArticlePath, helpArticles, helpCatalogue, helpGuide, helpModulePath } from '@/lib/help';
import { localePath } from '@/lib/paths';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return LOCALES.filter((l) => localeEnabled(l.code)).map((l) => ({ locale: l.code }));
}

/** The help centre's search index, one file per language, read by the search box when someone types. */
export async function GET(_: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'en';
  const cat = helpCatalogue(locale);
  const at = (p: string) => localePath(locale, p);
  const entries: HelpIndexEntry[] = [];
  for (const s of cat.sections) {
    for (const m of s.modules) {
      const guide = helpGuide(locale, m.slug);
      entries.push({ t: m.title, s: guide?.intro ?? m.groups[0]!.pages[0]!.description, w: s.title, u: at(helpModulePath(m.slug)), k: '' });
      for (const g of m.groups) for (const p of g.pages) entries.push({ t: p.title, s: p.description, w: p.where, u: `${at(helpModulePath(m.slug))}#${p.anchor}`, k: [...p.aliases, ...(p.help?.tasks ?? []).map((x) => x.label)].join(' ') });
      for (const a of helpArticles(guide)) {
        const where = m.groups.flatMap((g) => g.pages).find((p) => p.href === a.page)?.where ?? m.title;
        entries.push({ t: a.title, s: a.summary, w: where, u: at(helpArticlePath(m.slug, a.slug)), k: '' });
      }
    }
  }
  for (const q of cat.questions) entries.push({ t: q.title, s: q.summary, w: q.where, u: at('/help/') + `#q-${q.key}`, k: q.words.join(' ') });
  return Response.json(entries);
}
