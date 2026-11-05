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

type Props = { params: Promise<{ locale: string; module: string; article: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.filter((l) => localeEnabled(l.code) && HELP_LOCALES.includes(l.code)).flatMap((l) =>
    helpModules('en').flatMap((m) => helpArticles(helpGuide('en', m.slug)).map((a) => ({ locale: l.code, module: m.slug, article: a.slug }))),
  );
}

async function resolve(params: Props['params']) {
  const { locale: raw, module, article } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'en';
  const m = helpModules(locale).find((x) => x.slug === module);
  const articles = m ? helpArticles(helpGuide(locale, m.slug)) : [];
  const a = articles.find((x) => x.slug === article);
  if (!m || !a) notFound();
  const page = m.groups.flatMap((g) => g.pages).find((p) => p.href === a.page);
  return { locale, m, a, articles, page, c: loadContent(locale, 'help', HelpHome) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, m, a, c } = await resolve(params);
  const alt = alternates(locale, helpArticlePath(m.slug, a.slug));
  const title = `${a.title} · ${m.title} · ${c.hero.eyebrow}`;
  return { metadataBase: new URL(SITE_ORIGIN), title, description: a.summary, alternates: { canonical: alt.canonical, languages: alt.languages }, robots: robotsFor(locale), openGraph: { title, description: a.summary, url: alt.canonical, siteName: 'Clafina' } };
}

export default async function HelpArticlePage({ params }: Props) {
  const { locale, m, a, articles, page, c } = await resolve(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const path = (p: string) => localePath(locale, p);
  const related = (a.related ?? []).map((slug) => articles.find((x) => x.slug === slug)).filter((x) => x !== undefined);
  const howTo = { '@context': 'https://schema.org', '@type': 'HowTo', name: a.title, description: a.summary, step: a.steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, text: `${s.lead}${s.rest ? ` ${s.rest}` : ''}` })) };

  return (
    <main>
      <article aria-labelledby="article-title">
        <section id="hero" aria-labelledby="article-title" className="bg-surface">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
            <nav aria-label="Breadcrumb" className="text-sm text-muted">
              <a href={path('/help/')} className="hover:underline">{t('routes.help')}</a> <span aria-hidden="true">›</span> <a href={path(helpModulePath(m.slug))} className="hover:underline">{m.title}</a>
            </nav>
            <h1 id="article-title" className="mt-4 text-4xl font-extrabold tracking-tight">{a.title}</h1>
            <p className="mt-4 text-lg text-muted">{a.summary}</p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              {page && <p className="text-sm font-semibold">{page.where}</p>}
              <a href={openPage(a.page)} className="inline-flex min-h-11 items-center rounded-control bg-primary px-5 font-semibold text-on-primary hover:bg-primary-hover">{c.openInApp}</a>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          {a.before && a.before.length > 0 && (
            <section id="before" aria-labelledby="before-title" className="mb-10">
              <h2 id="before-title" className="text-xl font-bold">{c.beforeTitle}</h2>
              <ul className="mt-3 grid list-disc gap-1.5 ps-6">{a.before.map((b) => <li key={b}>{b}</li>)}</ul>
            </section>
          )}
          <section id="steps" aria-labelledby="steps-title">
            <h2 id="steps-title" className="text-xl font-bold">{c.stepsTitle}</h2>
            <ol className="mt-4 grid gap-4">
              {a.steps.map((s, i) => (
                <li key={i} className="flex gap-4">
                  <span aria-hidden="true" className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">{i + 1}</span>
                  <p className="pt-1"><strong>{s.lead}</strong>{s.rest ? ` ${s.rest}` : ''}</p>
                </li>
              ))}
            </ol>
            {a.after && <p className="mt-6 rounded-xl bg-surface p-4">{a.after}</p>}
          </section>
          {a.tips && a.tips.length > 0 && (
            <section id="tips" aria-labelledby="tips-title" className="mt-10">
              <h2 id="tips-title" className="text-xl font-bold">{c.tipsTitle}</h2>
              <ul className="mt-3 grid list-disc gap-1.5 ps-6">{a.tips.map((x) => <li key={x}>{x}</li>)}</ul>
            </section>
          )}
          {related.length > 0 && (
            <section id="related" aria-labelledby="related-title" className="mt-10">
              <h2 id="related-title" className="text-xl font-bold">{c.relatedTitle}</h2>
              <ul className="mt-3 grid gap-2">{related.map((r) => <li key={r.slug}><a href={path(helpArticlePath(m.slug, r.slug))} className="font-semibold hover:underline">{r.title}</a></li>)}</ul>
            </section>
          )}
          <p className="mt-12 border-t border-line pt-6 text-muted"><strong className="text-ink">{c.stillStuck.title}</strong> {c.stillStuck.body}</p>
        </div>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }} />
    </main>
  );
}
