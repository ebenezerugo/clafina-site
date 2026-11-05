import '../globals.css';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale, getMessages } from 'next-intl/server';
import { LOCALES, isLocale, localeInfo } from '@/config/locales';
import { localeEnabled } from '@/config/switches';
import { fontClassFor } from '@/theme/fonts';
import { Header } from '@/components/header/Header';
import { SkipLink } from '@/components/SkipLink';
import { Footer } from '@/components/footer/Footer';

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.filter((l) => localeEnabled(l.code)).map((l) => ({ locale: l.code }));
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale) || !localeEnabled(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <html lang={locale} dir={localeInfo(locale).dir} className={fontClassFor(locale)}>
      <body className="bg-page text-ink antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SkipLink label={String((messages as { nav: { skip: string } }).nav.skip)} />
          <Header locale={locale} />
          <div id="main" tabIndex={-1}>{children}</div>
          <Footer locale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
