import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { isLocale, type Locale } from '@/config/locales';
import { routeById } from '@/config/routes';
import { pageAvailable } from '@/config/switches';
import { loadContent } from '@/content/load';
import { PlatformContent } from '@/content/platform';
import { signupUrl } from '@/lib/links';
import { localePath } from '@/lib/paths';
import { alternates, robotsFor, SITE_ORIGIN } from '@/lib/seo';
import { LedgerEntry } from '@/screens/LedgerEntry';
import { PhoneHome } from '@/screens/PhoneHome';
import { SalesHome } from '@/screens/SalesHome';
import { ShopPhone } from '@/screens/ShopPhone';
import { TillSell } from '@/screens/TillSell';
import { OneRecordDiagram } from '@/components/sections/OneRecordDiagram';
import { ClaimText, CtaButtons, IllustrativeLabel, Section } from '@/components/sections/ui';

type Props = { params: Promise<{ locale: string }> };
const localeOf = async (p: Props['params']): Promise<Locale> => { const { locale } = await p; return isLocale(locale) ? locale : 'en'; };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeOf(params);
  const c = loadContent(locale, 'platform', PlatformContent);
  const alt = alternates(locale, '/platform/');
  return { metadataBase: new URL(SITE_ORIGIN), title: c.meta.title, description: c.meta.description, alternates: { canonical: alt.canonical, languages: alt.languages }, robots: robotsFor(locale) };
}

export default async function Platform({ params }: Props) {
  const locale = await localeOf(params);
  setRequestLocale(locale);
  const c = loadContent(locale, 'platform', PlatformContent);
  const demo = pageAvailable('demo') ? localePath(locale, routeById('demo')!.path) : null;
  const screens: Record<string, React.ReactNode> = {
    web: <SalesHome locale={locale} />,
    till: <TillSell locale={locale} />,
    phone: <div className="mx-auto max-w-[280px]"><PhoneHome locale={locale} /></div>,
    shop: <div className="mx-auto max-w-[280px]"><ShopPhone locale={locale} /></div>,
  };

  return (
    <main>
      <section aria-labelledby="platform-title" className="mx-auto max-w-7xl px-4 pb-6 pt-16 sm:px-6 lg:pt-24">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{c.hero.eyebrow}</p>
        <h1 id="platform-title" className="mt-4 max-w-4xl text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl">{c.hero.title}</h1>
        <p className="mt-6 max-w-2xl text-xl text-muted">{c.hero.lede}</p>
      </section>

      <Section id="one-record" eyebrow={c.oneRecord.eyebrow} title={c.oneRecord.title} intro={c.oneRecord.intro}>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <OneRecordDiagram label={c.oneRecord.diagramLabel} centre={c.oneRecord.centre} spokes={c.oneRecord.spokes} />
          <ul className="grid gap-6">
            {c.oneRecord.points.map((p) => <li key={p.id} className="border-t border-line pt-4"><h3 className="text-lg font-bold">{p.title}</h3><p className="mt-1 text-muted">{p.body}</p></li>)}
          </ul>
        </div>
        <div className="mt-12 max-w-4xl"><LedgerEntry locale={locale} /></div>
        <IllustrativeLabel text={c.illustrative} />
      </Section>

      <Section id="surfaces" eyebrow={c.surfaces.eyebrow} title={c.surfaces.title} tone="surface">
        <div className="grid gap-16">
          {c.surfaces.items.map((s, i) => (
            <div key={s.id} className="grid items-center gap-8 lg:grid-cols-[1fr_2fr]">
              <div className={i % 2 ? 'lg:order-2' : ''}><h3 className="text-2xl font-bold">{s.title}</h3><p className="mt-3 text-lg text-muted">{s.body}</p></div>
              <div className="min-w-0">{screens[s.id]}</div>
            </div>
          ))}
        </div>
        <IllustrativeLabel text={c.illustrative} />
      </Section>

      <Section id="packs" eyebrow={c.packs.eyebrow} title={c.packs.title} intro={c.packs.intro}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {c.packs.examples.map((e) => <li key={e.pack} className="rounded-xl border border-line bg-raised p-5"><p className="text-sm text-muted">{e.pack}</p><p className="mt-1 text-xl font-bold">{e.words}</p></li>)}
        </ul>
        <p className="mt-6 max-w-3xl text-muted">{c.packs.note}</p>
      </Section>

      <Section id="everywhere" eyebrow={c.everywhere.eyebrow} title={c.everywhere.title} tone="surface">
        <ul className="grid gap-6 md:grid-cols-3">
          {c.everywhere.items.map((w) => <li key={w.id} className="rounded-xl border border-line bg-raised p-6"><h3 className="text-lg font-bold">{w.title}</h3><p className="mt-2 text-muted">{w.body}</p></li>)}
        </ul>
      </Section>

      <Section id="security" eyebrow={c.security.eyebrow} title={c.security.title}>
        <ul className="grid gap-4 md:grid-cols-2">
          {c.security.items.map((item) => (
            <li key={item.text} className="flex gap-3 border-t border-line pt-4">
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="mt-1 shrink-0 text-good"><path d="M20 6 9 17l-5-5" /></svg>
              <ClaimText text={item.text} claim={item.claim} />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="connect" eyebrow={c.connect.eyebrow} title={c.connect.title} tone="surface">
        <ul className="grid gap-6 md:grid-cols-3">
          {c.connect.items.map((w) => <li key={w.id} className="rounded-xl border border-line bg-raised p-6"><h3 className="text-lg font-bold">{w.title}</h3><p className="mt-2 text-muted">{w.body}</p></li>)}
        </ul>
      </Section>

      <section aria-labelledby="platform-cta" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 id="platform-cta" className="max-w-3xl text-4xl font-extrabold tracking-tight">{c.cta.title}</h2>
        <p className="mt-4 max-w-2xl text-lg text-muted">{c.cta.body}</p>
        <div className="mt-8"><CtaButtons primary={{ href: signupUrl({ locale }), label: c.cta.primary }} secondary={demo ? { href: demo, label: c.cta.secondary } : null} /></div>
      </section>
    </main>
  );
}
