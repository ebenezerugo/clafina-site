import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { LOCALES, isLocale, type Locale } from '@/config/locales';
import { localeEnabled } from '@/config/switches';
import { loadContent } from '@/content/load';
import { HelpHome } from '@/content/help';
import { helpArticles, helpCatalogue, helpGuide, helpModulePath } from '@/lib/help';
import { HELP_LOCALES, localePath } from '@/lib/paths';
import { alternates, robotsFor, SITE_ORIGIN } from '@/lib/seo';
import { HelpSearch } from '@/components/help/HelpSearch';
import { Eyebrow, HeroAura } from '@/components/sections/ui';

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return LOCALES.filter((l) => localeEnabled(l.code) && HELP_LOCALES.includes(l.code)).map((l) => ({ locale: l.code }));
}

const localeOf = async (params: Props['params']): Promise<Locale> => {
  const { locale } = await params;
  return isLocale(locale) ? locale : 'en';
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeOf(params);
  const c = loadContent(locale, 'help', HelpHome);
  const alt = alternates(locale, '/help/');
  return { metadataBase: new URL(SITE_ORIGIN), title: c.meta.title, description: c.meta.description, alternates: { canonical: alt.canonical, languages: alt.languages }, robots: robotsFor(locale), openGraph: { title: c.meta.title, description: c.meta.description, url: alt.canonical, siteName: 'Clafina' } };
}

/** The module in the catalogue that holds an app address, for linking a question to its page. */
function moduleOf(sections: ReturnType<typeof helpCatalogue>['sections'], path: string) {
  for (const s of sections) for (const m of s.modules) for (const g of m.groups) for (const p of g.pages) if (path === p.href || path.startsWith(`${p.href}/`)) return { module: m.slug, anchor: p.anchor };
  return null;
}

export default async function HelpPage({ params }: Props) {
  const locale = await localeOf(params);
  setRequestLocale(locale);
  const c = loadContent(locale, 'help', HelpHome);
  const cat = helpCatalogue(locale);
  const path = (p: string) => localePath(locale, p);

  return (
    <main>
      <section id="hero" aria-labelledby="help-title" className="isolate relative bg-surface">
        <HeroAura />
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-24">
          <Eyebrow>{c.hero.eyebrow}</Eyebrow>
          <h1 id="help-title" className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{c.hero.title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">{c.hero.lede}</p>
          <div className="mt-8"><HelpSearch index={path('/help/search.json')} placeholder={c.hero.search} empty={c.noResults} /></div>
        </div>
      </section>

      <section id="start" aria-labelledby="start-title">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <h2 id="start-title" className="text-2xl font-extrabold tracking-tight sm:text-3xl">{c.startTitle}</h2>
          <ol className="mt-6 grid gap-4">
            {c.start.map((s, i) => (
              <li key={s} className="flex gap-4">
                <span aria-hidden="true" className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">{i + 1}</span>
                <span className="pt-1">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="sections" aria-labelledby="sections-title" className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 id="sections-title" className="text-2xl font-extrabold tracking-tight sm:text-3xl">{c.sectionsTitle}</h2>
          <div className="mt-10 grid gap-12">
            {cat.sections.map((s) => (
              <div key={s.slug}>
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{s.title}</h3>
                <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {s.modules.map((m) => {
                    const pages = m.groups.reduce((n, g) => n + g.pages.length, 0);
                    const howTos = helpArticles(helpGuide(locale, m.slug)).length;
                    return (
                      <li key={m.slug}>
                        <a href={path(helpModulePath(m.slug))} className="lift shadow-sm block h-full rounded-xl border border-line bg-raised p-5 hover:border-ink">
                          <span className="font-bold">{m.title}</span>
                          <span className="mt-1 block text-sm text-muted">{pages} {c.pagesLabel}{howTos ? ` · ${howTos} ${c.articlesLabel}` : ''}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="questions" aria-labelledby="questions-title">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <h2 id="questions-title" className="text-2xl font-extrabold tracking-tight sm:text-3xl">{c.questionsTitle}</h2>
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {cat.questions.map((q) => {
              const at = moduleOf(cat.sections, q.path);
              return (
                <li key={q.key} id={`q-${q.key}`} className="scroll-mt-24 py-4">
                  {at ? <a href={`${path(helpModulePath(at.module))}#${at.anchor}`} className="font-semibold hover:underline">{q.title}</a> : <span className="font-semibold">{q.title}</span>}
                  <p className="mt-1 text-muted">{q.summary}</p>
                  <p className="mt-1 text-sm text-muted">{q.where}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section id="stuck" aria-labelledby="stuck-title" className="bg-ink text-page">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <h2 id="stuck-title" className="text-3xl font-extrabold tracking-tight">{c.stillStuck.title}</h2>
          <p className="mt-4 text-lg opacity-80">{c.stillStuck.body}</p>
        </div>
      </section>
    </main>
  );
}
