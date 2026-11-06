import { readdirSync } from 'node:fs';
import type { Locale } from '@/config/locales';
import { ROUTES } from '@/config/routes';
import { pageAvailable } from '@/config/switches';
import { loadContent } from '@/content/load';
import { IndustryStory } from '@/content/industry';
import { helpCatalogue, helpModulePath } from '@/lib/help';

export interface GlossaryTerm { word: string; meaning: string; see?: { label: string; path: string } }

/** Every word the site explains: the app's page help, the industry stories' trade words, then any written here. Each word once. */
export function glossaryTerms(locale: Locale, extra: { word: string; meaning: string }[]): GlossaryTerm[] {
  const terms: GlossaryTerm[] = [...extra];
  for (const m of helpCatalogue('en').sections.flatMap((s) => s.modules))
    for (const p of m.groups.flatMap((g) => g.pages))
      for (const x of p.help?.terms ?? []) terms.push({ word: x.word, meaning: x.meaning, see: { label: p.where, path: `${helpModulePath(m.slug)}#${p.anchor}` } });
  for (const r of ROUTES.filter((r) => r.group === 'industry' && r.id !== 'industries' && pageAvailable(r.id))) {
    const slug = r.path.split('/').filter(Boolean).pop()!;
    if (!readdirSync('content/en/industries').includes(`${slug}.json`)) continue;
    const story = loadContent(locale, `industries/${slug}`, IndustryStory);
    for (const w of story.words) terms.push({ word: w.word, meaning: w.meaning, see: { label: story.hero.eyebrow, path: r.path } });
  }
  const seen = new Set<string>();
  return terms
    .filter((t) => { const k = t.word.toLowerCase().trim(); if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => a.word.localeCompare(b.word, locale, { sensitivity: 'base' }));
}
