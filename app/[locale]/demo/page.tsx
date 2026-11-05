import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { isLocale, type Locale } from '@/config/locales';
import { loadContent } from '@/content/load';
import { LeadPageContent } from '@/content/lead-page';
import { LeadPage } from '@/components/forms/LeadPage';
import { alternates, robotsFor, SITE_ORIGIN } from '@/lib/seo';

type Props = { params: Promise<{ locale: string }> };
const localeOf = async (p: Props['params']): Promise<Locale> => { const { locale } = await p; return isLocale(locale) ? locale : 'en'; };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeOf(params);
  const c = loadContent(locale, 'demo', LeadPageContent);
  const alt = alternates(locale, '/demo/');
  return { metadataBase: new URL(SITE_ORIGIN), title: c.meta.title, description: c.meta.description, alternates: { canonical: alt.canonical, languages: alt.languages }, robots: robotsFor(locale) };
}

export default async function Page({ params }: Props) {
  const locale = await localeOf(params);
  setRequestLocale(locale);
  return <LeadPage locale={locale} id="demo" kind="demo" />;
}
