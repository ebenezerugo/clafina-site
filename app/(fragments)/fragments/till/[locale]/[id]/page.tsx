import type { Metadata } from 'next';
import { LOCALES, isLocale } from '@/config/locales';
import { localeEnabled } from '@/config/switches';
import { loadContent } from '@/content/load';
import { TillIndustriesScreen } from '@/content/screens';
import { industryParts } from '@/components/till/TillShowcase';

/**
 * One business's till, receipt, online shop and notice, for the home page to fetch when that business comes up.
 * Every business but the first lives here, so the home page itself stays light.
 */
type Props = { params: Promise<{ locale: string; id: string }> };

export const dynamicParams = false;
export const metadata: Metadata = { title: 'Till screens', robots: { index: false, follow: false } };

export function generateStaticParams() {
  return LOCALES.filter((l) => localeEnabled(l.code)).flatMap((l) =>
    loadContent(l.code, 'screens/till-industries', TillIndustriesScreen).industries.slice(1).map((ind) => ({ locale: l.code, id: ind.id })));
}

export default async function TillFragment({ params }: Props) {
  const { locale, id } = await params;
  if (!isLocale(locale)) throw new Error(`Unknown locale ${locale}`);
  const p = industryParts(locale, id);
  return (
    <main>
      <div data-part="notice">{p.notice}</div>
      <div data-part="till">{p.till}</div>
      <div data-part="printer">{p.printer}</div>
      <div data-part="phone">{p.phone}</div>
    </main>
  );
}
