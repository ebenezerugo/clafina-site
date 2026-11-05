import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LOCALES, isLocale, type Locale } from '@/config/locales';
import { ROUTES, routeById } from '@/config/routes';
import { localeEnabled, mentionable, pageAvailable } from '@/config/switches';
import { loadContent } from '@/content/load';
import { IndustryStory } from '@/content/industry';
import { signupUrl } from '@/lib/links';
import { localePath } from '@/lib/paths';
import { alternates, robotsFor, SITE_ORIGIN } from '@/lib/seo';
import { visible } from '@/lib/visible';
import { Screen, isPhoneScreen } from '@/screens/Screen';
import { ClaimText, CtaButtons, IllustrativeLabel, Section } from '@/components/sections/ui';

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

const storyRoutes = () => ROUTES.filter((r) => r.group === 'industry' && r.id !== 'industries' && pageAvailable(r.id));
const slugOf = (path: string) => path.split('/').filter(Boolean).pop()!;

export function generateStaticParams() {
  return LOCALES.filter((l) => localeEnabled(l.code)).flatMap((l) => storyRoutes().map((r) => ({ locale: l.code, slug: slugOf(r.path) })));
}

async function resolve(params: Props['params']) {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'en';
  const route = storyRoutes().find((r) => slugOf(r.path) === slug);
  if (!route) notFound();
  return { locale, route, c: loadContent(locale, `industries/${slug}`, IndustryStory) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, route, c } = await resolve(params);
  const alt = alternates(locale, route.path);
  return { metadataBase: new URL(SITE_ORIGIN), title: c.meta.title, description: c.meta.description, alternates: { canonical: alt.canonical, languages: alt.languages }, robots: robotsFor(locale), openGraph: { title: c.meta.title, description: c.meta.description, url: alt.canonical, siteName: 'Clafina' } };
}

const Tick = () => <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0 text-good"><path d="M20 6 9 17l-5-5" /></svg>;

export default async function IndustryPage({ params }: Props) {
  const { locale, c } = await resolve(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const link = (id: string) => (pageAvailable(id) ? localePath(locale, routeById(id)!.path) : null);
  const name = (id: string) => t(`routes.${id}` as never);
  const demo = link('demo');
  const moments = c.moments.filter(visible);
  const faq = c.faq.filter(visible);
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
  const chip = 'inline-flex min-h-11 items-center rounded-full border border-line bg-raised px-4 font-medium';

  return (
    <main>
      <section id="hero" aria-labelledby="story-title" className="overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:pt-24">
          <p className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.12em] text-muted">
            <span>{c.hero.eyebrow}</span>
            <span className="rounded-full border border-line px-2 py-0.5 tracking-normal normal-case">{t(c.core ? 'industry.core' : 'industry.pack')}</span>
          </p>
          <h1 id="story-title" className="mt-4 max-w-4xl text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl">{c.hero.title}</h1>
          <p className="mt-6 max-w-2xl text-xl text-muted">{c.hero.lede}</p>
          <div className="mt-10"><CtaButtons primary={{ href: signupUrl({ locale }), label: t('nav.startFree') }} secondary={demo ? { href: demo, label: t('routes.demo') } : null} /></div>
          <div className={`mt-14 rounded-2xl border border-line bg-surface p-2 shadow-lg sm:p-3 ${isPhoneScreen(c.hero.screen) ? 'mx-auto max-w-[340px]' : ''}`}><Screen id={c.hero.screen} locale={locale} /></div>
          <IllustrativeLabel text={c.illustrative} />
        </div>
      </section>

      <Section id="day" title={c.dayTitle} intro={`${c.business.name}, ${c.business.place}. ${c.business.about}`} tone="surface">
        <IllustrativeLabel text={c.illustrative} />
        <ol className="mt-10 grid gap-14">
          {moments.map((m) => (
            <li key={m.time} data-prelaunch={m.prelaunch} className={`grid gap-6 border-s-2 border-line ps-6 ${m.screen ? (isPhoneScreen(m.screen) ? 'lg:grid-cols-[1fr_300px]' : 'lg:grid-cols-[1fr_1.4fr]') : ''} lg:gap-10`}>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-3">
                  <time className="text-2xl font-extrabold tabular-nums">{m.time}</time>
                  <span className="rounded-full border border-line bg-raised px-3 py-0.5 text-sm font-semibold">{t(`surfaces.${m.surface}`)}</span>
                </p>
                <h3 className="mt-3 text-2xl font-bold">{m.title}</h3>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-muted">{t('industry.moment')}</p>
                <p className="mt-1 text-lg">{m.problem}</p>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-muted">{t('industry.handles')}</p>
                <p className="mt-1 text-lg text-muted">{m.handles}</p>
              </div>
              {m.screen && <div className={`min-w-0 ${isPhoneScreen(m.screen) ? 'mx-auto w-full max-w-[300px]' : ''}`}><Screen id={m.screen} locale={locale} /></div>}
            </li>
          ))}
        </ol>
      </Section>

      <Section id="words" title={c.wordsTitle}>
        <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {c.words.map((w) => <div key={w.word} className="border-t border-line pt-3"><dt className="text-lg font-bold">{w.word}</dt><dd className="mt-1 text-muted">{w.meaning}</dd></div>)}
        </dl>
      </Section>

      <Section id="switches" title={c.switchesTitle} tone="surface">
        <ul className="grid gap-3 md:grid-cols-2">
          {c.switchesOn.filter(visible).map((item) => <li key={item.text} data-prelaunch={item.prelaunch} className="flex gap-3 border-t border-line pt-3"><Tick /><ClaimText text={item.text} claim={item.claim} /></li>)}
        </ul>
      </Section>

      <Section id="shares" title={c.sharesTitle}>
        <ul className="grid gap-4 md:grid-cols-2">
          {c.shares.filter((x) => mentionable(x.route)).map((x) => {
            const href = link(x.route);
            return <li key={x.route} className="rounded-xl border border-line bg-raised p-5">{href ? <a href={href} className="font-bold hover:underline">{name(x.route)}</a> : <span className="font-bold">{name(x.route)}</span>}<p className="mt-1 text-muted">{x.text}</p></li>;
          })}
        </ul>
      </Section>

      <Section id="modules" title={c.modulesTitle} tone="surface">
        <ul className="flex flex-wrap gap-3">
          {c.modules.filter((id) => mentionable(id)).map((id) => { const href = link(id); return <li key={id}>{href ? <a href={href} className={`${chip} hover:bg-surface`}>{name(id)}</a> : <span className={chip}>{name(id)}</span>}</li>; })}
        </ul>
      </Section>

      <section id="faq" aria-labelledby="faq-title">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h2 id="faq-title" className="text-3xl font-extrabold tracking-tight">{c.faqTitle}</h2>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {faq.map((f) => <details key={f.q} className="group py-4" data-prelaunch={f.prelaunch}><summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 font-semibold">{f.q}<span aria-hidden="true" className="transition-transform group-open:rotate-45">+</span></summary><p className="mt-2 text-muted">{f.a}</p></details>)}
          </div>
        </div>
      </section>

      {c.related.length > 0 && (
        <Section id="related" title={c.relatedTitle} tone="surface">
          <ul className="flex flex-wrap gap-3">
            {c.related.filter((id) => mentionable(id)).map((id) => { const href = link(id); return <li key={id}>{href ? <a href={href} className={`${chip} hover:bg-surface`}>{name(id)}</a> : <span className={chip}>{name(id)}</span>}</li>; })}
          </ul>
        </Section>
      )}

      <section id="cta" aria-labelledby="cta-title" className="bg-ink text-page">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h2 id="cta-title" className="max-w-3xl text-4xl font-extrabold tracking-tight">{c.cta.title}</h2>
          <p className="mt-4 max-w-2xl text-lg opacity-80">{c.cta.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={signupUrl({ locale })} data-signup="" className="inline-flex min-h-12 items-center rounded-control bg-page px-6 font-semibold text-ink">{t('nav.startFree')}</a>
            {demo && <a href={demo} className="inline-flex min-h-12 items-center rounded-control border border-page/40 px-6 font-semibold">{t('routes.demo')}</a>}
          </div>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </main>
  );
}
