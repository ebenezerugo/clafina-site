import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routeById } from '@/config/routes';
import { mentionable, pageAvailable } from '@/config/switches';
import { loadContent } from '@/content/load';
import { WhatsNewContent } from '@/content/pages';
import { localePath } from '@/lib/paths';
import { enabledLocales, pageLocale, pageMetadata } from '@/lib/simple-page';
import { visible } from '@/lib/visible';
import { ClaimText, Eyebrow, HeroAura } from '@/components/sections/ui';

type Props = { params: Promise<{ locale: string }> };
export const generateStaticParams = enabledLocales;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await pageLocale(params);
  return pageMetadata(locale, '/whats-new/', loadContent(locale, 'whats-new', WhatsNewContent).meta);
}

export default async function WhatsNewPage({ params }: Props) {
  const locale = await pageLocale(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const c = loadContent(locale, 'whats-new', WhatsNewContent);
  const date = (d: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`));
  const entries = c.entries.filter(visible).filter((e) => !e.route || mentionable(e.route)).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main>
      <section id="hero" aria-labelledby="new-title" className="isolate relative bg-surface">
        <HeroAura />
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <Eyebrow>{c.hero.eyebrow}</Eyebrow>
          <h1 id="new-title" className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{c.hero.title}</h1>
          <p className="mt-5 text-lg text-muted">{c.hero.lede}</p>
        </div>
      </section>
      <ol className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        {entries.map((e) => {
          const href = e.route && pageAvailable(e.route) ? localePath(locale, routeById(e.route)!.path) : null;
          return (
            <li key={`${e.date}-${e.title}`} data-prelaunch={e.prelaunch} className="border-s-2 border-line ps-6 pb-10">
              <time dateTime={e.date} className="text-sm font-semibold text-muted">{date(e.date)}</time>
              <h2 className="mt-1 text-xl font-bold">{e.title}</h2>
              <p className="mt-2"><ClaimText text={e.body} claim={e.claim} /></p>
              {href && <a href={href} className="mt-2 inline-block font-semibold hover:underline" aria-label={`${c.readMore}: ${t(`routes.${e.route}` as never)}`}>{c.readMore}</a>}
            </li>
          );
        })}
      </ol>
    </main>
  );
}
