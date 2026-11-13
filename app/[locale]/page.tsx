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
import { PhoneHome } from '@/screens/PhoneHome';
import { SalesHome } from '@/screens/SalesHome';
import { ShopPhone } from '@/screens/ShopPhone';
import { TillSell } from '@/screens/TillSell';
import { Scene } from '@/illustrations/Scene';
import { readFrame } from '@/illustrations/frames';
import { Tk } from '@/profiles/Tk';
import { resolveText } from '@/profiles/tokens';
import { AskBand } from '@/components/sections/AskBand';
import { FloatingCards, FLOAT_CARD, Mark } from '@/components/sections/FloatingCards';
import { PhoneDevice, ReceiptPrinter, TillTerminal } from '@/components/devices/Devices';
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
  const storyHref = link(locale, 'story-quo-0221');
  const product = NAV.menus.find((m) => m.id === 'product')!;
  const industries = navItemIds(NAV.menus.find((m) => m.id === 'industries')!).filter((id) => id !== 'industries');


  return (
    <main data-local-money="">
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
            <FloatingCards cards={{ ...c.hero.cards, paid: { ...c.hero.cards.paid, amount: formatMoney(c.hero.cards.paid.amount, c.oneRecord.currency, locale) }, trend: { ...c.hero.cards.trend, value: formatMoney(c.hero.cards.trend.value, c.oneRecord.currency, locale) } }} />
            <div className="overflow-hidden rounded-t-xl lg:absolute lg:inset-y-0 lg:start-0 lg:w-[62rem] lg:overflow-visible">
              <div className="rounded-xl bg-surface p-2 shadow-[0_0_0_1px_rgb(255_255_255/0.18),0_40px_80px_-30px_rgb(0_0_0/0.6)] sm:p-3 lg:mt-14"><SalesHome locale={locale} /></div>
            </div>
            <PhoneDevice className="!absolute end-4 top-[12rem] hidden w-[13.5rem] lg:block xl:end-0"><PhoneHome locale={locale} /></PhoneDevice>
          </div>
        </div>
      </section>

      <Section id="one-record" eyebrow={c.oneRecord.eyebrow} title={c.oneRecord.title} intro={c.oneRecord.intro} tone="surface" align="center">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <figure className="min-w-0">
            <a href={storyHref ?? undefined} className="group block overflow-hidden rounded-2xl border border-line shadow-[0_30px_60px_-36px_rgb(11_16_32/0.55)] transition-transform hover:-translate-y-0.5">
              <Scene markup={readFrame('quo-0221', 'agree')} label={resolveText(c.oneRecord.story.poster)} />
            </a>
            <IllustrativeLabel text={c.illustrative} />
          </figure>
          <div className="min-w-0">
            <ol className="grid gap-5">
              {c.oneRecord.steps.map((step, i) => (
                <li key={step.id} data-step={step.id} className="grid grid-cols-[auto_1fr] gap-x-4">
                  <span aria-hidden="true" className="dot-river row-span-2 inline-flex size-9 items-center justify-center rounded-full text-sm font-bold text-white">{i + 1}</span>
                  <h3 className="text-lg font-bold"><Tk text={step.title} /></h3>
                  <p className="text-muted"><Tk text={step.body} /></p>
                </li>
              ))}
            </ol>
            {storyHref && <a href={storyHref} className="group mt-8 inline-flex min-h-12 items-center gap-2 rounded-control bg-primary px-6 font-semibold text-on-primary transition-colors hover:bg-primary-hover">{c.oneRecord.story.link}<span className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100"><SiteIcon name="arrow" size={18} /></span></a>}
          </div>
        </div>
      </Section>

      <Section id="surfaces" eyebrow={c.surfaces.eyebrow} title={c.surfaces.title} intro={c.surfaces.intro} tone="band">
        <div className="grid items-end gap-x-12 gap-y-14 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)]">
          <div className="relative min-w-0">
            <div aria-hidden="true" className={`${FLOAT_CARD} !z-30 -top-8 start-[34%] hidden sm:flex`}>
              <Mark icon="wifiOff" tone="bg-[#dcfce7] text-[#15803d]" />
              <div><p className="text-sm font-semibold">{c.surfaces.moment.title}</p><p className="text-xs text-muted">{c.surfaces.moment.detail}</p></div>
            </div>
            <TillTerminal printer={<ReceiptPrinter title={c.surfaces.receipt.title} lines={c.surfaces.receipt.lines.map((l) => ({ label: l.label, amount: money(String(l.amount)) }))} total={{ label: c.surfaces.receipt.total.label, amount: money(String(c.surfaces.receipt.total.amount)) }} footer={c.surfaces.receipt.footer} />}>
              <TillSell locale={locale} />
            </TillTerminal>
          </div>
          <PhoneDevice className="mx-auto w-full max-w-[230px] min-w-0 sm:max-w-[290px]"><ShopPhone locale={locale} /></PhoneDevice>
        </div>
        <IllustrativeLabel text={c.illustrative} />
      </Section>
      {/* The six screens, on the light page under the band: what each is for, and one live moment from it. */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {c.surfaces.items.map((s) => (
              <li key={s.id} className="lift group flex min-w-0 flex-col rounded-2xl border border-line bg-raised p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-tint-sky text-primary"><SiteIcon name={POINT_ICONS[s.id] ?? 'check'} size={20} /></span>
                  <h3 className="text-lg font-bold">{s.title}</h3>
                </div>
                <p className="mt-4 flex-1 text-muted">{s.body}</p>
                <p className="mt-6 flex items-center gap-2.5 rounded-xl bg-surface px-3.5 py-2.5 text-sm font-medium text-ink">
                  <span aria-hidden="true" className="relative flex size-2 shrink-0"><span className="absolute inset-0 rounded-full bg-[#22c55e] opacity-60 motion-safe:animate-ping" /><span className="relative size-2 rounded-full bg-[#22c55e]" /></span>
                  <span className="min-w-0">{s.moment}</span>
                </p>
              </li>
            ))}
          </ul>
      </div>

      <Section id="modules" eyebrow={c.modules.eyebrow} title={c.modules.title} intro={c.modules.intro} align="center">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {product.groups.map((g, i) => {
            const items = g.items.filter((id) => mentionable(id));
            const wide = i === product.groups.length - 1 && product.groups.length % 3 === 2;
            return (
              <div key={g.id} className={`lift min-w-0 rounded-2xl p-7 ${BENTO_TINTS[i % BENTO_TINTS.length]} ${wide ? 'md:col-span-2' : ''}`}>
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
        <ul className="flex flex-wrap gap-3">
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
            <li key={w.id} className="lift min-w-0 rounded-xl border border-line bg-raised p-6 shadow-sm">
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
              <li key={item.text} className="flex gap-4 rounded-xl border border-night-line bg-night-raised/70 p-5">
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
