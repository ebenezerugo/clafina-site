import '../globals.css';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale, getMessages } from 'next-intl/server';
import { LOCALES, isLocale, localeInfo } from '@/config/locales';
import { localeEnabled } from '@/config/switches';
import { fontClassFor } from '@/theme/fonts';
import { scriptFontFor } from '@/theme/script-fonts';
import type { CSSProperties } from 'react';
import { Header } from '@/components/header/Header';
import { SkipLink } from '@/components/SkipLink';
import { Footer } from '@/components/footer/Footer';
import { CampaignLinks } from '@/components/CampaignLinks';
import { ProfileSwapper } from '@/profiles/ProfileSwapper';

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.filter((l) => localeEnabled(l.code)).map((l) => ({ locale: l.code }));
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale) || !localeEnabled(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const scriptFont = scriptFontFor(locale);
  const fontStyle = scriptFont ? ({ '--font-script': `'${scriptFont.family}'` } as CSSProperties) : undefined;
  return (
    <html lang={locale} dir={localeInfo(locale).dir} className={fontClassFor(locale)} style={fontStyle}>
      <body className="bg-page text-ink antialiased">
        {scriptFont && <link rel="stylesheet" href={scriptFont.href} precedence="default" />}
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SkipLink label={String((messages as { nav: { skip: string } }).nav.skip)} />
          <Header locale={locale} />
          <div id="main" tabIndex={-1}>{children}</div>
          <Footer locale={locale} />
          <CampaignLinks />
        </NextIntlClientProvider>
        <ProfileSwapper />
      </body>
    </html>
  );
}
