import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale, localeInfo, type Locale } from '@/config/locales';
import { routeById } from '@/config/routes';
import { isOn, pageAvailable } from '@/config/switches';
import { loadContent } from '@/content/load';
import { PricingContent } from '@/content/pricing';
import { PlanCards } from '@/components/pricing/PlanCards';
import { signupUrl } from '@/lib/links';
import { localePath } from '@/lib/paths';
import { PLANS, featureLines, limitLines, plansVisible, pricesConfirmed, type PlanId } from '@/lib/pricing-page';
import { alternates, robotsFor, SITE_ORIGIN } from '@/lib/seo';
import { Eyebrow, HeroAura } from '@/components/sections/ui';

type Props = { params: Promise<{ locale: string }> };
const localeOf = async (p: Props['params']): Promise<Locale> => { const { locale } = await p; return isLocale(locale) ? locale : 'en'; };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeOf(params);
  const c = loadContent(locale, 'pricing', PricingContent);
  const alt = alternates(locale, '/pricing/');
  return { metadataBase: new URL(SITE_ORIGIN), title: c.meta.title, description: c.meta.description, alternates: { canonical: alt.canonical, languages: alt.languages }, robots: robotsFor(locale) };
}

export default async function Pricing({ params }: Props) {
  const locale = await localeOf(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const c = loadContent(locale, 'pricing', PricingContent);
  const lang = localeInfo(locale).hreflang;
  const number = (n: number) => new Intl.NumberFormat(lang).format(n);
  const contactSales = pageAvailable('contact-sales') ? localePath(locale, routeById('contact-sales')!.path) : null;
  const compare = pageAvailable('pricing-compare') ? localePath(locale, routeById('pricing-compare')!.path) : null;
  const countries = (['global', 'ng', 'latam'] as const).filter((code) => isOn(`countries.${code}`)).map((code) => ({ code, name: t(`switcher.countries.${code}`) }));
  const text = Object.fromEntries(PLANS.map((p) => [p.id, {
    ...c.plans[p.id],
    href: p.id === 'enterprise' ? (contactSales ?? signupUrl({ locale })) : signupUrl({ locale, plan: p.id }),
    features: featureLines(p, c),
    limits: limitLines(p, c, number),
  }])) as Record<PlanId, { name: string; tagline: string; cta: string; href: string; features: string[]; limits: string[] }>;
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: c.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
  const appLd = pricesConfirmed() ? { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Clafina', applicationCategory: 'BusinessApplication', offers: PLANS.filter((p) => p.price.global.amount !== null).map((p) => ({ '@type': 'Offer', name: c.plans[p.id].name, price: p.price.global.amount, priceCurrency: 'USD' })) } : null;

  return (
    <main className="relative isolate">
      <HeroAura />
      <section aria-labelledby="pricing-title" className="mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 lg:pt-24">
        <Eyebrow>{c.hero.eyebrow}</Eyebrow>
        <h1 id="pricing-title" className="mt-4 max-w-4xl text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl">{c.hero.title}</h1>
        <p className="mt-6 max-w-2xl text-xl text-muted">{c.hero.lede}</p>
      </section>

      {plansVisible() ? (
        <section aria-label={c.hero.eyebrow} className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <PlanCards plans={PLANS} text={text} lang={lang} countries={countries} labels={{ pricesFor: c.pricesFor, perMonth: c.perMonth, free: c.free, talkToUs: c.talkToUs, mostChosen: c.mostChosen, notes: c.editionNote }} />
          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-muted">
            {compare && <a href={compare} className="font-semibold text-ink underline underline-offset-4">{c.compareLink}</a>}
            {!pricesConfirmed() && <span>{c.samples}</span>}
          </div>
        </section>
      ) : (
        <section aria-labelledby="pricing-fallback" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <h2 id="pricing-fallback" className="text-2xl font-bold">{c.fallback.title}</h2>
          <p className="mt-2 text-muted">{c.fallback.body}</p>
          {contactSales && <a href={contactSales} className="mt-6 inline-flex min-h-12 items-center rounded-control bg-primary px-6 font-semibold text-on-primary">{c.fallback.cta}</a>}
        </section>
      )}

      <section aria-labelledby="faq-title" className="bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h2 id="faq-title" className="text-3xl font-extrabold tracking-tight">{c.faqTitle}</h2>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {c.faq.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 font-semibold">{f.q}<span aria-hidden="true" className="transition-transform group-open:rotate-45">+</span></summary>
                <p className="mt-2 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      {appLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />}
    </main>
  );
}
