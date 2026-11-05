/**
 * Copies the app's own map of pages into the help centre, so the guide follows the app's menu exactly.
 *
 * Reads, from local clones of the app repositories:
 * - commerce-web: the menu layout, every page's sentence and old names, and the page help (tasks, words, numbers);
 * - commerce-api: the guide's questions ("Send an invoice and get paid").
 * Writes content/en/help/catalogue.json. Run it when the app's menu changes:
 *   COMMERCE_WEB=../commerce-web COMMERCE_API=../commerce-api npm run sync:help
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { neutral, slugify, type HelpCatalogue } from '../src/content/help';

type Entry = string | { href: string; title?: string };
interface Exported {
  layout: { title?: string; modules: { title: string; href?: string; groups?: { heading?: string; items: Entry[] }[] }[] }[];
  user: Entry[];
  searchOnly: { trail: string; items: Entry[] }[];
  text: Record<string, { description: string; aliases?: string[] }>;
  pageHelp: Record<string, unknown>;
  titles: Record<string, string>;
  questions: { key: string; title: string; summary: string; path: string; where: string; words: string[] }[];
}

const web = resolve(process.env.COMMERCE_WEB ?? '../commerce-web');
const api = resolve(process.env.COMMERCE_API ?? '../commerce-api');
const tsx = resolve('node_modules/.bin/tsx');

// The app's files import with its own path aliases, so they are read from inside its folder.
const probe = join(web, '.clafina-help-export.ts');
writeFileSync(
  probe,
  `import { NAV_LAYOUT, NAV_USER_MENU, NAV_SEARCH_ONLY, catalogueEntry } from './src/app/@core/constants/nav-layout';
import { NAV_PAGE_TEXT } from './src/app/@core/constants/nav-page-text';
import { PAGE_HELP } from './src/app/@core/constants/page-help';
import { GUIDE_ARTICLES } from ${JSON.stringify(join(api, 'src/modules/support/guide/guide-articles'))};
const titles = Object.fromEntries(Object.keys(NAV_PAGE_TEXT).map((h) => [h, catalogueEntry(h).title]));
process.stdout.write(JSON.stringify({ layout: NAV_LAYOUT, user: NAV_USER_MENU, searchOnly: NAV_SEARCH_ONLY, text: NAV_PAGE_TEXT, pageHelp: PAGE_HELP, titles, questions: GUIDE_ARTICLES }));
`,
);
let data: Exported;
try {
  data = JSON.parse(execFileSync(tsx, [probe], { cwd: web, encoding: 'utf8', maxBuffer: 1 << 26 })) as Exported;
} finally {
  rmSync(probe, { force: true });
}
const sha = (dir: string) => execFileSync('git', ['-C', dir, 'log', '-1', '--format=%h %cs'], { encoding: 'utf8' }).trim();

const page = (e: Entry, trail: string[]) => {
  const href = typeof e === 'string' ? e : e.href;
  const text = data.text[href];
  if (!text) throw new Error(`${href} has no sentence in nav-page-text.ts`);
  const title = (typeof e === 'string' ? undefined : e.title) ?? data.titles[href];
  if (!title) throw new Error(`${href} has no title in the catalogue`);
  return {
    href,
    anchor: slugify(href),
    title: neutral(title),
    where: [...trail, neutral(title)].join(' › '),
    description: neutral(text.description),
    aliases: (text.aliases ?? []).map(neutral),
    ...(data.pageHelp[href] ? { help: JSON.parse(neutral(JSON.stringify(data.pageHelp[href]))) } : {}),
  };
};

// Pages reached only from search (single reports) join their module under "Insights".
const searchOnly = new Map(data.searchOnly.map((s) => [s.trail.split(' › ')[0]!, s.items]));
const used = new Set<string>();
const slugs = new Set<string>();
const uniqueSlug = (title: string) => {
  let s = slugify(title === 'Help' ? 'Getting help' : title);
  while (slugs.has(s)) s = `${s}-more`;
  slugs.add(s);
  return s;
};

const catalogue: HelpCatalogue = {
  synced: { web: sha(web), api: sha(api) },
  sections: [
    ...data.layout.map((s) => ({
      title: s.title ?? 'Home',
      slug: slugify(s.title ?? 'Home'),
      modules: s.modules.map((m) => {
        const trail = s.title ? [s.title, m.title] : [m.title];
        const groups = m.groups
          ? m.groups.map((g) => ({ heading: g.heading ?? m.title, pages: g.items.map((e) => page(e, g.heading ? trail : trail)) }))
          : [{ heading: m.title, pages: [page({ href: m.href!, title: m.title }, s.title ? [s.title] : [])] }];
        const extra = searchOnly.get(m.title);
        if (extra) groups.push({ heading: 'Insights', pages: extra.map((e) => page(e, [...trail, 'Insights'])) });
        groups.forEach((g) => g.pages.forEach((p) => used.add(p.href)));
        return { title: m.title, slug: uniqueSlug(m.title), groups };
      }),
    })),
    {
      title: 'Your account',
      slug: 'your-account',
      modules: [{ title: 'Your account', slug: uniqueSlug('Your account'), groups: [{ heading: 'Your own pages', pages: data.user.map((e) => page(e, ['Your menu'])) }] }],
    },
  ],
  questions: data.questions.map((q) => ({ key: q.key, title: neutral(q.title), summary: neutral(q.summary), path: q.path, where: neutral(q.where), words: q.words.map(neutral) })),
};

const missing = Object.keys(data.text).filter((h) => !used.has(h) && !data.user.some((e) => (typeof e === 'string' ? e : e.href) === h));
if (missing.length) console.warn(`Not in the menu, left out: ${missing.join(', ')}`);
mkdirSync('content/en/help', { recursive: true });
writeFileSync('content/en/help/catalogue.json', `${JSON.stringify(catalogue, null, 2)}\n`);
const pages = catalogue.sections.flatMap((s) => s.modules).reduce((n, m) => n + m.groups.reduce((k, g) => k + g.pages.length, 0), 0);
console.log(`Help catalogue: ${catalogue.sections.length} sections, ${catalogue.sections.flatMap((s) => s.modules).length} modules, ${pages} pages, ${catalogue.questions.length} questions (web ${catalogue.synced.web}, api ${catalogue.synced.api}).`);
