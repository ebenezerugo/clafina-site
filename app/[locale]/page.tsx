import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale, type Locale } from '@/config/locales';
import { NAV, navItemIds } from '@/config/nav';
import { routeById } from '@/config/routes';
import { mentionable, pageAvailable } from '@/config/switches';
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
import { AskBand } from '@/components/sections/AskBand';
import { FloatingCards } from '@/components/sections/FloatingCards';
import { ClaimText, CtaBand, CtaButtons, Eyebrow, IllustrativeLabel, Section } from '@/components/sections/ui';
import { IconTile, MODULE_ICONS, POINT_ICONS, SiteIcon } from '@/components/icons/SiteIcon';

type Props = { params: Promise<{ locale: string }> };

/** The soft panels of the product grid, one family each. */
const BENTO_TINTS = ['bg-tint-sky', 'bg-tint-mint', 'bg-tint-lilac', 'bg-tint-sand', 'bg-tint-sky'];

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

      <section id="hero" aria-labelledby="hero-title" className="band relative isolate overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-x-14 gap-y-16 px-4 pt-14 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:pt-20">
          <div className="lg:pb-20">
            <Eyebrow tone="band">{c.hero.eyebrow}</Eyebrow>
            <h1 id="hero-title" className="mt-6 text-5xl font-extrabold leading-[1.02] sm:text-6xl lg:text-[4.25rem]">{c.hero.title}</h1>
            <p className="band-muted mt-6 max-w-xl text-xl">{c.hero.lede}</p>
            <div className="mt-10"><CtaButtons primary={start} secondary={demoCta} tone="colour" /></div>
            <ul className="band-muted mt-8 grid max-w-md grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
              {c.works.items.map((w) => (
                <li key={w.id} className="inline-flex items-center gap-2"><SiteIcon name={POINT_ICONS[w.id] ?? 'check'} size={16} />{w.title}</li>
              ))}
            </ul>
            <IllustrativeLabel text={c.illustrative} />
          </div>
          <div className="relative max-h-[22rem] sm:max-h-[30rem] lg:h-[38rem] lg:max-h-none">
            <FloatingCards cards={{ ...c.hero.cards, paid: { ...c.hero.cards.paid, amount: formatMoney(c.hero.cards.paid.amount, c.oneRecord.currency, locale) } }} />
            <div className="overflow-hidden rounded-t-xl lg:absolute lg:inset-y-0 lg:start-0 lg:w-[62rem] lg:overflow-visible">
              <div className="rounded-xl bg-surface p-2 shadow-[0_0_0_1px_rgb(255_255_255/0.18),0_40px_80px_-30px_rgb(0_0_0/0.6)] sm:p-3 lg:mt-14"><SalesHome locale={locale} /></div>
            </div>
            <div className="absolute end-4 top-[13rem] hidden w-[13rem] rounded-[28px] bg-raised p-2 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.55)] ring-1 ring-black/10 lg:block xl:end-0"><PhoneHome locale={locale} /></div>
          </div>
        </div>
      </section>

      <Section id="one-record" eyebrow={c.oneRecord.eyebrow} title={c.oneRecord.title} intro={c.oneRecord.intro} tone="surface" align="center">
        <OneRecord steps={c.oneRecord.steps} visuals={Object.fromEntries(c.oneRecord.steps.map((s) => [s.id, stepVisual(s.id)]))} />
        <div className="lit-frame relative mx-auto mt-12 max-w-4xl bg-raised p-2"><LedgerEntry locale={locale} /></div>
        <div className="text-center"><IllustrativeLabel text={c.illustrative} /></div>
      </Section>

      <Section id="surfaces" eyebrow={c.surfaces.eyebrow} title={c.surfaces.title} intro={c.surfaces.intro} tone="band">
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="relative min-w-0 rounded-xl bg-surface p-2 shadow-[0_0_0_1px_rgb(255_255_255/0.18),0_40px_80px_-30px_rgb(0_0_0/0.6)] sm:p-3">{surfaceScreens.till}</div>
          <div className="min-w-0 self-center">{surfaceScreens.shop}</div>
        </div>
        <IllustrativeLabel text={c.illustrative} />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {c.surfaces.items.map((s) => (
            <li key={s.id} className="reveal flex min-w-0 gap-4 rounded-xl border border-white/20 bg-white/10 p-6">
              <IconTile name={POINT_ICONS[s.id] ?? 'check'} tone="night" />
              <div><h3 className="text-lg font-bold">{s.title}</h3><p className="band-muted mt-1.5">{s.body}</p></div>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="modules" eyebrow={c.modules.eyebrow} title={c.modules.title} intro={c.modules.intro} align="center">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {product.groups.map((g, i) => {
            const items = g.items.filter((id) => mentionable(id));
            const wide = i === product.groups.length - 1 && product.groups.length % 3 === 2;
            return (
              <div key={g.id} className={`reveal lift min-w-0 rounded-2xl p-7 ${BENTO_TINTS[i % BENTO_TINTS.length]} ${wide ? 'md:col-span-2' : ''}`}>
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{t(`nav.groups.${g.id}` as never)}</h3>
                <ul className={`mt-5 grid gap-1 ${wide ? 'sm:grid-cols-2' : ''}`}>
                  {items.map((id) => {
                    const href = link(locale, id);
                    const name = t(`routes.${id}` as never);
                    const inner = (
                      <>
                        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-raised text-primary shadow-sm ring-1 ring-line"><SiteIcon name={MODULE_ICONS[id] ?? 'check'} size={18} /></span>
                        <span className="min-w-0"><span className="block font-semibold">{name}</span><span className="mt-0.5 block text-sm text-muted">{c.modules.items[id]}</span></span>
                      </>
                    );
                    return <li key={id} className="min-w-0">{href ? <a href={href} className="flex gap-3 rounded-xl p-2.5 transition-colors hover:bg-raised/70">{inner}</a> : <span className="flex gap-3 p-2.5">{inner}</span>}</li>;
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </Section>

      <Section id="industries" eyebrow={c.industries.eyebrow} title={c.industries.title} intro={c.industries.intro}>
        <ul className="reveal flex flex-wrap gap-3">
          {industries.map((id) => {
            const href = link(locale, id);
            const name = t(`routes.${id}` as never);
            return <li key={id}>{href ? <a href={href} className="lift group inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-raised px-5 font-medium shadow-sm">{name}<span className="text-muted transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100"><SiteIcon name="arrow" size={16} /></span></a> : <span className="inline-flex min-h-11 items-center rounded-full border border-line bg-raised px-5 font-medium">{name}</span>}</li>;
          })}
        </ul>
      </Section>

      <Section id="works-where-you-work" eyebrow={c.works.eyebrow} title={c.works.title} tone="surface" align="center">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {c.works.items.map((w) => (
            <li key={w.id} className="reveal lift min-w-0 rounded-xl border border-line bg-raised p-6 shadow-sm">
              <IconTile name={POINT_ICONS[w.id] ?? 'check'} />
              <h3 className="mt-5 text-lg font-bold">{w.title}</h3><p className="mt-2 text-muted">{w.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <AskBand {...c.ask} href={link(locale, 'product-assistant')} />

      <Section id="trust" eyebrow={c.trust.eyebrow} title={c.trust.title} tone="night">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.trust.items.map((item) => {
            const text = <ClaimText text={item.text} claim={item.claim} />;
            return text ? (
              <li key={item.text} className="reveal flex gap-4 rounded-xl border border-night-line bg-night-raised/70 p-5">
                <IconTile name="shield" tone="night" />
                <span className="pt-2.5">{text}</span>
              </li>
            ) : null;
          })}
        </ul>
      </Section>

      <CtaBand title={c.cta.title} body={c.cta.body} primary={start} secondary={demoCta} />
    </main>
  );
}
