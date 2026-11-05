import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { isLocale, localeInfo, type Locale } from '@/config/locales';
import { loadContent } from '@/content/load';
import { CompareContent, PricingContent } from '@/content/pricing';
import { ALL_FEATURES, PLANS, plansVisible } from '@/lib/pricing-page';
import { alternates, robotsFor, SITE_ORIGIN } from '@/lib/seo';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ locale: string }> };
const localeOf = async (p: Props['params']): Promise<Locale> => { const { locale } = await p; return isLocale(locale) ? locale : 'en'; };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeOf(params);
  const c = loadContent(locale, 'pricing-compare', CompareContent);
  const alt = alternates(locale, '/pricing/compare/');
  return { metadataBase: new URL(SITE_ORIGIN), title: c.meta.title, description: c.meta.description, alternates: { canonical: alt.canonical, languages: alt.languages }, robots: robotsFor(locale) };
}

const Yes = ({ label }: { label: string }) => <><svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto text-good"><path d="M20 6 9 17l-5-5" /></svg><span className="sr-only">{label}</span></>;
const No = ({ label }: { label: string }) => <><span aria-hidden="true" className="text-muted">—</span><span className="sr-only">{label}</span></>;

export default async function Compare({ params }: Props) {
  const locale = await localeOf(params);
  setRequestLocale(locale);
  if (!plansVisible()) notFound();
  const c = loadContent(locale, 'pricing-compare', CompareContent);
  const p = loadContent(locale, 'pricing', PricingContent);
  const number = (n: number | null) => (n === null ? p.limits.unlimited : new Intl.NumberFormat(localeInfo(locale).hreflang).format(n));
  const limitRows = (['users', 'locations', 'tills'] as const).map((k) => ({ label: p.limits[k], cells: PLANS.map((plan) => number(plan.limits[k])) }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{c.title}</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">{c.lede}</p>
      <div className="relative mt-10 max-h-[80vh] overflow-auto rounded-xl border border-line" tabIndex={0} role="region" aria-label={c.title}>
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <caption className="sr-only">{c.title}</caption>
          <thead className="sticky top-0 z-10 bg-raised">
            <tr>
              <th scope="col" className="p-4 text-start font-semibold">{c.feature}</th>
              {PLANS.map((plan) => <th key={plan.id} scope="col" className="p-4 text-center text-base font-bold">{p.plans[plan.id].name}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr><th colSpan={PLANS.length + 1} scope="colgroup" className="bg-surface px-4 py-2 text-start text-xs font-bold uppercase tracking-[0.12em] text-muted">{c.limitsGroup}</th></tr>
            {limitRows.map((row) => (
              <tr key={row.label} className="border-t border-line">
                <th scope="row" className="p-4 text-start font-medium">{row.label}</th>
                {row.cells.map((cell, i) => <td key={i} className="p-4 text-center tabular">{cell}</td>)}
              </tr>
            ))}
            <tr><th colSpan={PLANS.length + 1} scope="colgroup" className="bg-surface px-4 py-2 text-start text-xs font-bold uppercase tracking-[0.12em] text-muted">{c.featuresGroup}</th></tr>
            {ALL_FEATURES.map((f) => (
              <tr key={f} className="border-t border-line">
                <th scope="row" className="p-4 text-start font-medium">{p.features[f]}</th>
                {PLANS.map((plan) => <td key={plan.id} className="p-4 text-center">{plan.features.includes(f) ? <Yes label={c.included} /> : <No label={c.notIncluded} />}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-sm text-muted">{p.samples}</p>
    </main>
  );
}
