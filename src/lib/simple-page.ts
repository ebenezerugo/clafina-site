import type { Metadata } from 'next';
import { LOCALES, isLocale, type Locale } from '@/config/locales';
import { localeEnabled } from '@/config/switches';
import { alternates, robotsFor, SITE_ORIGIN } from '@/lib/seo';

/** The locale of a one-path page, English when unknown. */
export async function pageLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  return isLocale(locale) ? locale : 'en';
}

export const enabledLocales = () => LOCALES.filter((l) => localeEnabled(l.code)).map((l) => ({ locale: l.code }));

/** Metadata for a one-path page from its meta block. */
export function pageMetadata(locale: Locale, path: string, meta: { title: string; description: string }, index = true): Metadata {
  const alt = alternates(locale, path);
  return { metadataBase: new URL(SITE_ORIGIN), title: meta.title, description: meta.description, alternates: { canonical: alt.canonical, languages: alt.languages }, robots: index ? robotsFor(locale) : { index: false, follow: true }, openGraph: { title: meta.title, description: meta.description, url: alt.canonical, siteName: 'Clafina' } };
}
