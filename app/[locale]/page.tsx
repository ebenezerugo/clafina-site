import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { isLocale, type Locale } from '@/config/locales';
import { pageAvailable } from '@/config/switches';
import { routeById } from '@/config/routes';
import { HomeContent } from '@/content/schema';
import { loadContent } from '@/content/load';
import { signupUrl } from '@/lib/links';
import { localePath } from '@/lib/paths';
import { alternates, organizationJsonLd, robotsFor, SITE_ORIGIN } from '@/lib/seo';

type Props = { params: Promise<{ locale: string }> };

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

export default async function Home({ params }: Props) {
  const locale = await localeOf(params);
  setRequestLocale(locale);
  const { hero } = loadContent(locale, 'home', HomeContent);
  const org = organizationJsonLd();
  const demo = pageAvailable('demo') ? localePath(locale, routeById('demo')!.path) : null;

  return (
    <main>
      {org && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }} />}
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 lg:pt-28">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{hero.eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">{hero.title}</h1>
        <p className="mt-6 max-w-2xl text-xl text-muted">{hero.lede}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <a href={signupUrl({ locale })} data-signup="" className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 font-semibold text-on-primary hover:bg-primary-hover">{hero.primaryCta}</a>
          {demo && <a href={demo} className="inline-flex min-h-12 items-center rounded-full border border-line px-6 font-semibold hover:bg-surface">{hero.secondaryCta}</a>}
        </div>
      </section>
    </main>
  );
}
