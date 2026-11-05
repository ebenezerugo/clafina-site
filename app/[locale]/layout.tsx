import '../globals.css';
import type { ReactNode } from 'react';

export function generateStaticParams() {
  return [{ locale: 'en' }];
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
