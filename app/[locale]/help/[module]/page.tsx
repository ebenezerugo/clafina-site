import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LOCALES, isLocale, type Locale } from '@/config/locales';
import { localeEnabled } from '@/config/switches';
import { loadContent } from '@/content/load';
import { HelpHome } from '@/content/help';
import { helpArticlePath, helpArticles, helpGuide, helpModulePath, helpModules, openPage } from '@/lib/help';
import { HELP_LOCALES, localePath } from '@/lib/paths';
import { alternates, robotsFor, SITE_ORIGIN } from '@/lib/seo';

type Props = { params: Promise<{ locale: string; module: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.filter((l) => localeEnabled(l.code) && HELP_LOCALES.includes(l.code)).flatMap((l) => helpModules('en').map((m) => ({ locale: l.code, module: m.slug })));
}

async function resolve(params: Props['params']) {
  const { locale: raw, module } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'en';
  const m = helpModules(locale).find((x) => x.slug === module);
  if (!m) notFound();
  return { locale, m, guide: helpGuide(locale, m.slug), c: loadContent(locale, 'help', HelpHome) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, m, guide, c } = await resolve(params);
  const alt = alternates(locale, helpModulePath(m.slug));
  const title = `${m.title} · ${c.hero.eyebrow} · Clafina`;
  const description = (guide?.intro ?? m.groups[0]!.pages[0]!.description).slice(0, 160);
  return { metadataBase: new URL(SITE_ORIGIN), title, description, alternates: { canonical: alt.canonical, languages: alt.languages }, robots: robotsFor(locale), openGraph: { title, description, url: alt.canonical, siteName: 'Clafina' } };
}

export default async function HelpModulePage({ params }: Props) {
  const { locale, m, guide, c } = await resolve(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const articles = helpArticles(guide);
  const path = (p: string) => localePath(locale, p);
  const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: t('routes.help'), item: `${SITE_ORIGIN}${path('/help/')}` },
    { '@type': 'ListItem', position: 2, name: m.title, item: `${SITE_ORIGIN}${path(helpModulePath(m.slug))}` },
  ] };

  return (
    <main>
      <section id="hero" aria-labelledby="module-title" className="bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <nav aria-label="Breadcrumb" className="text-sm text-muted"><a href={path('/help/')} className="hover:underline">{t('routes.help')}</a> <span aria-hidden="true">›</span> {m.section}</nav>
          <h1 id="module-title" className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{m.title}</h1>
          {guide && <p className="mt-5 max-w-2xl text-lg text-muted">{guide.intro}</p>}
          <nav aria-labelledby="toc-title" className="mt-8">
            <h2 id="toc-title" className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{c.onThisPage}</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {articles.length > 0 && <li><a href="#how-to" className="inline-flex min-h-11 items-center rounded-full border border-line bg-raised px-4 text-sm font-medium hover:border-ink">{c.howTo}</a></li>}
              {m.groups.map((g, i) => <li key={g.heading}><a href={`#group-${i + 1}`} className="inline-flex min-h-11 items-center rounded-full border border-line bg-raised px-4 text-sm font-medium hover:border-ink">{g.heading}</a></li>)}
            </ul>
          </nav>
        </div>
      </section>

      {guide && (
        <section id="start" aria-labelledby="start-title">
          <div className="mx-auto max-w-4xl px-4 pt-14 sm:px-6">
            <h2 id="start-title" className="text-2xl font-extrabold tracking-tight">{c.moduleStart}</h2>
            <ol className="mt-5 grid list-decimal gap-3 ps-6">{guide.start.map((s) => <li key={s}>{s}</li>)}</ol>
          </div>
        </section>
      )}

      {articles.length > 0 && (
        <section id="how-to" aria-labelledby="how-to-title">
          <div className="mx-auto max-w-4xl px-4 pt-14 sm:px-6">
            <h2 id="how-to-title" className="text-2xl font-extrabold tracking-tight">{c.howTo}</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {articles.map((a) => (
                <li key={a.slug} data-prelaunch={a.prelaunch}>
                  <a href={path(helpArticlePath(m.slug, a.slug))} className="block h-full rounded-xl border border-line bg-raised p-4 hover:border-ink">
                    <span className="font-semibold">{a.title}</span>
                    <span className="mt-1 block text-sm text-muted">{a.summary}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section id="pages" aria-labelledby="pages-title">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <h2 id="pages-title" className="text-2xl font-extrabold tracking-tight">{c.everyPage}</h2>
          {m.groups.map((g, i) => (
            <div key={g.heading} id={`group-${i + 1}`} className="mt-10 scroll-mt-24">
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{g.heading}</h3>
              <div className="mt-4 divide-y divide-line border-y border-line">
                {g.pages.map((p) => (
                  <article key={p.href} id={p.anchor} aria-labelledby={`${p.anchor}-title`} className="scroll-mt-24 py-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 id={`${p.anchor}-title`} className="text-xl font-bold">{p.title}</h4>
                        <p className="mt-1 text-sm text-muted">{p.where}</p>
                      </div>
                      <a href={openPage(p.href)} className="inline-flex min-h-11 shrink-0 items-center rounded-control border border-line px-4 text-sm font-semibold hover:bg-surface" aria-label={`${c.openInApp}: ${p.title}`}>{c.openInApp}</a>
                    </div>
                    <p className="mt-3">{p.help?.purpose ?? p.description}</p>
                    {p.help?.tasks?.map((task) => (
                      <div key={task.label} className="mt-5">
                        <h5 className="font-semibold">{task.label}</h5>
                        <ol className="mt-2 grid list-decimal gap-1.5 ps-6">{task.steps.map((s, k) => <li key={k}><strong>{s.lead}</strong>{s.rest ? ` ${s.rest}` : ''}</li>)}</ol>
                      </div>
                    ))}
                    {p.help?.terms && p.help.terms.length > 0 && (
                      <div className="mt-5">
                        <h5 className="font-semibold">{c.words}</h5>
                        <dl className="mt-2 grid gap-2">{p.help.terms.map((x) => <div key={x.word}><dt className="inline font-semibold">{x.word}: </dt><dd className="inline text-muted">{x.meaning}{x.example ? ` ${x.example}` : ''}</dd></div>)}</dl>
                      </div>
                    )}
                    {p.help?.numbers && p.help.numbers.length > 0 && (
                      <div className="mt-5">
                        <h5 className="font-semibold">{c.numbers}</h5>
                        <dl className="mt-2 grid gap-2">{p.help.numbers.map((x) => <div key={x.name}><dt className="inline font-semibold">{x.name}: </dt><dd className="inline text-muted">{x.how}</dd></div>)}</dl>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="stuck" aria-labelledby="stuck-title" className="bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <h2 id="stuck-title" className="text-2xl font-extrabold tracking-tight">{c.stillStuck.title}</h2>
          <p className="mt-3 text-muted">{c.stillStuck.body}</p>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
    </main>
  );
}
