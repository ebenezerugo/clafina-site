import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale } from '@/config/locales';
import { localePath } from '@/lib/paths';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const t = await getTranslations({ locale: isLocale(raw) ? raw : 'en' });
  return { title: `${t('notFound.title')} · Clafina`, robots: { index: false, follow: false } };
}

/** Built per language, then copied to /<locale>/404.html after the build so Cloudflare serves it for missing pages. */
export default async function NotFoundPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'en';
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  return (
    <main className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
      <h1 className="text-4xl font-extrabold tracking-tight">{t('notFound.title')}</h1>
      <p className="mt-4 text-lg text-muted">{t('notFound.body')}</p>
      <a href={localePath(locale, '/')} className="mt-8 inline-flex min-h-12 items-center rounded-full bg-primary px-6 font-semibold text-on-primary">{t('notFound.home')}</a>
    </main>
  );
}
