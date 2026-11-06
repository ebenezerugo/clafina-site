import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ROUTES } from '@/config/routes';
import { loadContent } from '@/content/load';
import { StartContent } from '@/content/pages';
import { signupUrl } from '@/lib/links';
import { enabledLocales, pageLocale, pageMetadata } from '@/lib/simple-page';
import { StartRedirect } from '@/components/resources/StartRedirect';

type Props = { params: Promise<{ locale: string }> };
export const generateStaticParams = enabledLocales;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await pageLocale(params);
  return pageMetadata(locale, '/start/', loadContent(locale, 'start', StartContent).meta, false);
}

/** A hand-off: campaigns and other sites link here, and the visitor goes straight on to sign-up. */
export default async function StartPage({ params }: Props) {
  const locale = await pageLocale(params);
  setRequestLocale(locale);
  const c = loadContent(locale, 'start', StartContent);
  const packs = ROUTES.filter((r) => r.group === 'industry' && r.id !== 'industries').map((r) => r.path.split('/').filter(Boolean).pop()!);
  return (
    <main>
      <section id="hero" aria-labelledby="start-title">
        <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
          <h1 id="start-title" className="text-4xl font-extrabold tracking-tight">{c.title}</h1>
          <p className="mt-4 text-lg text-muted">{c.body}</p>
          <a href={signupUrl({ locale })} data-signup="" className="mt-8 inline-flex min-h-12 items-center rounded-control bg-primary px-6 font-semibold text-on-primary hover:bg-primary-hover">{c.button}</a>
        </div>
      </section>
      <StartRedirect locale={locale} packs={packs} />
    </main>
  );
}
