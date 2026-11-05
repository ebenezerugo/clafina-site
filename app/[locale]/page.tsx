import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale, type Locale } from '@/config/locales';
import { NAV, navItemIds } from '@/config/nav';
import { routeById } from '@/config/routes';
import { pageAvailable } from '@/config/switches';
import { HomeContent } from '@/content/schema';
import { loadContent } from '@/content/load';
import { signupUrl } from '@/lib/links';
import { localePath } from '@/lib/paths';
import { alternates, organizationJsonLd, robotsFor, SITE_ORIGIN } from '@/lib/seo';
import { formatMoney } from '@/screens/kit/money';
import { LedgerEntry } from '@/screens/LedgerEntry';
import { PhoneHome } from '@/screens/PhoneHome';
import { SalesHome } from '@/screens/SalesHome';
import { ShopPhone } from '@/screens/ShopPhone';
import { TillSell } from '@/screens/TillSell';
import { OneRecord } from '@/components/sections/OneRecord';
import { ClaimText, CtaButtons, IllustrativeLabel, Section } from '@/components/sections/ui';

type Props = { params: Promise<{ locale: string }> };

async function localeOf(params: Props['params']): Promise<Locale> {
  const { locale } = await params;
  return isLocale(locale) ? locale : 'en';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeOf(params);
  const content = loadContent(locale, 'home', HomeContent);
  const alt = alternates(locale, '/');
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: content.meta.title,
    description: content.meta.description,
    alternates: { canonical: alt.canonical, languages: alt.languages },
    robots: robotsFor(locale),
    openGraph: { title: content.meta.title, description: content.meta.description, url: alt.canonical, siteName: 'Clafina', type: 'website' },
    twitter: { card: 'summary_large_image', title: content.meta.title, description: content.meta.description },
  };
}

function link(locale: Locale, id: string): string | null {
  return pageAvailable(id) ? localePath(locale, routeById(id)!.path) : null;
}

export default async function Home({ params }: Props) {
  const locale = await localeOf(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const c = loadContent(locale, 'home', HomeContent);
  const org = organizationJsonLd();
  const demo = link(locale, 'demo');
  const start = { href: signupUrl({ locale }), label: c.hero.primaryCta };
  const demoCta = demo ? { href: demo, label: c.hero.secondaryCta } : null;
  const money = (v: string) => (/^\d+$/.test(v) ? formatMoney(Number(v), c.oneRecord.currency, locale) : v);
  const product = NAV.menus.find((m) => m.id === 'product')!;
  const industries = navItemIds(NAV.menus.find((m) => m.id === 'industries')!).filter((id) => id !== 'industries');

  const stepVisual = (id: string) => {
    const step = c.oneRecord.steps.find((s) => s.id === id)!;
    return (
      <dl className="grid gap-1 rounded-lg bg-surface p-3 text-sm tabular">
        {step.visual.map((v) => (
          <div key={v.label} className="flex justify-between gap-3"><dt className="text-muted">{v.label}</dt><dd className="font-semibold">{money(v.value)}</dd></div>
        ))}
      </dl>
    );
  };

  const surfaceScreens: Record<string, React.ReactNode> = {
    till: <TillSell locale={locale} />,
    shop: <div className="mx-auto max-w-[300px]"><ShopPhone locale={locale} /></div>,
  };

  return (
    <main>
      {org && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }} />}

      <section id="hero" aria-labelledby="hero-title" className="overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:pt-24">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{c.hero.eyebrow}</p>
          <h1 id="hero-title" className="mt-4 max-w-4xl text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">{c.hero.title}</h1>
          <p className="mt-6 max-w-2xl text-xl text-muted">{c.hero.lede}</p>
          <div className="mt-10"><CtaButtons primary={start} secondary={demoCta} /></div>
          <div className="relative mt-16 pb-10">
            <div className="rounded-2xl border border-line bg-surface p-2 shadow-lg sm:p-3"><SalesHome locale={locale} /></div>
            <div className="absolute -bottom-2 end-2 hidden w-[200px] rounded-[28px] border border-line bg-raised p-2 shadow-lg md:block lg:end-8 lg:w-[240px]"><PhoneHome locale={locale} /></div>
          </div>
          <IllustrativeLabel text={c.illustrative} />
        </div>
      </section>

      <Section id="one-record" eyebrow={c.oneRecord.eyebrow} title={c.oneRecord.title} intro={c.oneRecord.intro} tone="surface">
        <OneRecord steps={c.oneRecord.steps} visuals={Object.fromEntries(c.oneRecord.steps.map((s) => [s.id, stepVisual(s.id)]))} />
        <div className="mt-10 max-w-4xl"><LedgerEntry locale={locale} /></div>
        <IllustrativeLabel text={c.illustrative} />
      </Section>

      <Section id="surfaces" eyebrow={c.surfaces.eyebrow} title={c.surfaces.title} intro={c.surfaces.intro}>
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="min-w-0">{surfaceScreens.till}</div>
          <div className="min-w-0">{surfaceScreens.shop}</div>
        </div>
        <IllustrativeLabel text={c.illustrative} />
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {c.surfaces.items.map((s) => (
            <li key={s.id} className="min-w-0 border-t border-line pt-5"><h3 className="text-lg font-bold">{s.title}</h3><p className="mt-2 text-muted">{s.body}</p></li>
          ))}
        </ul>
      </Section>

      <Section id="modules" eyebrow={c.modules.eyebrow} title={c.modules.title} intro={c.modules.intro} tone="surface">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-5">
          {product.groups.map((g) => (
            <div key={g.id} className="min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{t(`nav.groups.${g.id}` as never)}</h3>
              <ul className="mt-4 grid gap-4">
                {g.items.map((id) => {
                  const href = link(locale, id);
                  const name = t(`routes.${id}` as never);
                  return (
                    <li key={id} className="min-w-0">
                      {href ? <a href={href} className="font-semibold hover:underline">{name}</a> : <span className="font-semibold">{name}</span>}
                      <p className="mt-1 text-sm text-muted">{c.modules.items[id]}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section id="industries" eyebrow={c.industries.eyebrow} title={c.industries.title} intro={c.industries.intro}>
        <ul className="flex flex-wrap gap-3">
          {industries.map((id) => {
            const href = link(locale, id);
            const name = t(`routes.${id}` as never);
            return <li key={id}>{href ? <a href={href} className="inline-flex min-h-11 items-center rounded-full border border-line px-4 font-medium hover:bg-surface">{name}</a> : <span className="inline-flex min-h-11 items-center rounded-full border border-line px-4 font-medium">{name}</span>}</li>;
          })}
        </ul>
      </Section>

      <Section id="works-where-you-work" eyebrow={c.works.eyebrow} title={c.works.title} tone="surface">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {c.works.items.map((w) => (
            <li key={w.id} className="min-w-0 rounded-xl border border-line bg-raised p-6"><h3 className="text-lg font-bold">{w.title}</h3><p className="mt-2 text-muted">{w.body}</p></li>
          ))}
        </ul>
      </Section>

      <Section id="trust" eyebrow={c.trust.eyebrow} title={c.trust.title}>
        <ul className="grid gap-4 sm:grid-cols-2">
          {c.trust.items.map((item) => {
            const text = <ClaimText text={item.text} claim={item.claim} />;
            return text ? (
              <li key={item.text} className="flex gap-3 border-t border-line pt-4">
                <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="mt-1 shrink-0 text-good"><path d="M20 6 9 17l-5-5" /></svg>
                {text}
              </li>
            ) : null;
          })}
        </ul>
      </Section>

      <section id="cta" aria-labelledby="cta-title" className="bg-ink text-page">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h2 id="cta-title" className="max-w-3xl text-4xl font-extrabold tracking-tight">{c.cta.title}</h2>
          <p className="mt-4 max-w-2xl text-lg opacity-80">{c.cta.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={start.href} data-signup="" className="inline-flex min-h-12 items-center rounded-control bg-page px-6 font-semibold text-ink">{start.label}</a>
            {demoCta && <a href={demoCta.href} className="inline-flex min-h-12 items-center rounded-control border border-page/40 px-6 font-semibold">{demoCta.label}</a>}
          </div>
        </div>
      </section>
    </main>
  );
}
