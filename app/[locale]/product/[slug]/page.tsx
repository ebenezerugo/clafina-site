import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LOCALES, isLocale, type Locale } from '@/config/locales';
import { ROUTES, routeById } from '@/config/routes';
import { localeEnabled, mentionable, pageAvailable } from '@/config/switches';
import { visible } from '@/lib/visible';
import { loadContent } from '@/content/load';
import { ProductContent } from '@/content/product';
import { signupUrl } from '@/lib/links';
import { localePath } from '@/lib/paths';
import { alternates, robotsFor, SITE_ORIGIN } from '@/lib/seo';
import { Screen, isPhoneScreen } from '@/screens/Screen';
import { ClaimText, CtaBand, CtaButtons, Eyebrow, HeroAura, IllustrativeLabel, Section } from '@/components/sections/ui';

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

const productRoutes = () => ROUTES.filter((r) => r.group === 'product' && pageAvailable(r.id));
const slugOf = (path: string) => path.split('/').filter(Boolean).pop()!;

export function generateStaticParams() {
  return LOCALES.filter((l) => localeEnabled(l.code)).flatMap((l) => productRoutes().map((r) => ({ locale: l.code, slug: slugOf(r.path) })));
}

async function resolve(params: Props['params']) {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'en';
  const route = productRoutes().find((r) => slugOf(r.path) === slug);
  if (!route) notFound();
  return { locale, route, c: loadContent(locale, `product/${slug}`, ProductContent) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, route, c } = await resolve(params);
  const alt = alternates(locale, route.path);
  return { metadataBase: new URL(SITE_ORIGIN), title: c.meta.title, description: c.meta.description, alternates: { canonical: alt.canonical, languages: alt.languages }, robots: robotsFor(locale), openGraph: { title: c.meta.title, description: c.meta.description, url: alt.canonical, siteName: 'Clafina' } };
}

export default async function ProductPage({ params }: Props) {
  const { locale, c } = await resolve(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const link = (id: string) => (pageAvailable(id) ? localePath(locale, routeById(id)!.path) : null);
  const demo = link('demo');
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: c.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };

  return (
    <main>
      <section id="hero" aria-labelledby="product-title" className="isolate relative overflow-hidden">
        <HeroAura />
        <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:pt-24">
          <Eyebrow>{c.hero.eyebrow}</Eyebrow>
          <h1 id="product-title" className="mt-4 max-w-4xl text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl">{c.hero.title}</h1>
          <p className="mt-6 max-w-2xl text-xl text-muted">{c.hero.lede}</p>
          <div className="mt-10"><CtaButtons primary={{ href: signupUrl({ locale }), label: t('nav.startFree') }} secondary={demo ? { href: demo, label: t('routes.demo') } : null} /></div>
          <div className="mt-14 lit-frame relative bg-surface p-2 sm:p-3"><Screen id={c.hero.screen} locale={locale} /></div>
          <IllustrativeLabel text={c.illustrative} />
        </div>
      </section>

      <Section id="jobs" title={c.jobsTitle}>
        <ul className="grid gap-6 md:grid-cols-3">
          {c.jobs.map((j) => <li key={j.title} className="lift shadow-sm rounded-xl border border-line bg-raised p-6"><h3 className="text-xl font-bold">{j.title}</h3><p className="mt-2 text-muted">{j.body}</p></li>)}
        </ul>
      </Section>

      <Section id="tour" title={c.tourTitle} tone="surface">
        <div className="grid gap-20">
          {c.tour.map((step, i) => (
            <div key={step.screen} className={`grid items-center gap-10 ${isPhoneScreen(step.screen) ? 'lg:grid-cols-[1fr_320px]' : 'lg:grid-cols-[1fr_2fr]'}`}>
              <div className={i % 2 && !isPhoneScreen(step.screen) ? 'lg:order-2' : ''}>
                <h3 className="text-2xl font-bold">{step.title}</h3>
                <p className="mt-3 text-lg text-muted">{step.body}</p>
                {step.points.length > 0 && <ul className="mt-5 grid gap-2">{step.points.map((p) => <li key={p} className="flex gap-2"><svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0 text-good"><path d="M20 6 9 17l-5-5" /></svg>{p}</li>)}</ul>}
              </div>
              <div className={`min-w-0 ${isPhoneScreen(step.screen) ? 'mx-auto w-full max-w-[320px]' : ''}`}><Screen id={step.screen} locale={locale} /></div>
            </div>
          ))}
        </div>
        <IllustrativeLabel text={c.illustrative} />
      </Section>

      <Section id="features" title={c.featuresTitle}>
        <div className="grid gap-10 md:grid-cols-2">
          {c.features.map((group) => {
            const items = group.items.filter(visible);
            return items.length ? (
              <div key={group.title}>
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{group.title}</h3>
                <ul className="mt-4 grid gap-3">
                  {items.map((item) => <li key={item.text} className="flex gap-3 border-t border-line pt-3" data-prelaunch={item.prelaunch}><svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0 text-good"><path d="M20 6 9 17l-5-5" /></svg><ClaimText text={item.text} claim={item.claim} /></li>)}
                </ul>
              </div>
            ) : null;
          })}
        </div>
      </Section>

      <Section id="connects" title={c.connectsTitle} tone="surface">
        <ul className="grid gap-4 md:grid-cols-2">
          {c.connects.filter((x) => mentionable(x.route)).map((x) => {
            const href = link(x.route);
            const name = t(`routes.${x.route}` as never);
            return <li key={x.route} className="lift shadow-sm rounded-xl border border-line bg-raised p-5">{href ? <a href={href} className="font-bold hover:underline">{name}</a> : <span className="font-bold">{name}</span>}<p className="mt-1 text-muted">{x.text}</p></li>;
          })}
        </ul>
      </Section>

      <Section id="surfaces" title={c.surfacesTitle}>
        <ul className="flex flex-wrap gap-3">{c.surfaces.map((s) => <li key={s} className="inline-flex min-h-11 items-center rounded-full border border-line px-4 font-semibold">{t(`surfaces.${s}`)}</li>)}</ul>
      </Section>

      <Section id="industries" title={c.industriesTitle} tone="surface">
        <ul className="flex flex-wrap gap-3">
          {c.industries.filter((id) => mentionable(id)).map((id) => {
            const href = link(id);
            const name = t(`routes.${id}` as never);
            return <li key={id}>{href ? <a href={href} className="inline-flex min-h-11 items-center rounded-full border border-line bg-raised px-4 font-medium hover:bg-surface">{name}</a> : <span className="inline-flex min-h-11 items-center rounded-full border border-line bg-raised px-4 font-medium">{name}</span>}</li>;
          })}
        </ul>
      </Section>

      <section id="faq" aria-labelledby="faq-title">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h2 id="faq-title" className="text-3xl font-extrabold tracking-tight">{c.faqTitle}</h2>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {c.faq.map((f) => <details key={f.q} className="group py-4"><summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 font-semibold">{f.q}<span aria-hidden="true" className="transition-transform group-open:rotate-45">+</span></summary><p className="mt-2 text-muted">{f.a}</p></details>)}
          </div>
        </div>
      </section>

      <CtaBand title={c.cta.title} body={c.cta.body} primary={{ href: signupUrl({ locale }), label: t('nav.startFree') }} secondary={demo ? { href: demo, label: t('routes.demo') } : null} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </main>
  );
}
