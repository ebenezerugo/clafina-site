import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale, type Locale } from '@/config/locales';
import { routeById } from '@/config/routes';
import { pageAvailable } from '@/config/switches';
import { loadContent } from '@/content/load';
import { StoryContent } from '@/content/schema';
import { frameUrl, readFrame } from '@/illustrations/frames';
import { signupUrl } from '@/lib/links';
import { localePath } from '@/lib/paths';
import { alternates, robotsFor, SITE_ORIGIN } from '@/lib/seo';
import { StoryPlayer } from '@/components/stories/StoryPlayer';
import { Tk } from '@/profiles/Tk';
import { CtaBand, Eyebrow, IllustrativeLabel } from '@/components/sections/ui';

const STORY = 'quo-0221';
type Props = { params: Promise<{ locale: string }> };
const localeOf = async (p: Props['params']): Promise<Locale> => { const { locale } = await p; return isLocale(locale) ? locale : 'en'; };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeOf(params);
  const c = loadContent(locale, `stories/${STORY}`, StoryContent);
  const alt = alternates(locale, routeById('story-quo-0221')!.path);
  return { metadataBase: new URL(SITE_ORIGIN), title: c.meta.title, description: c.meta.description, alternates: { canonical: alt.canonical, languages: alt.languages }, robots: robotsFor(locale) };
}

export default async function JourneyOfAQuote({ params }: Props) {
  const locale = await localeOf(params);
  setRequestLocale(locale);
  const c = loadContent(locale, `stories/${STORY}`, StoryContent);
  const t = await getTranslations({ locale });
  const demo = pageAvailable('demo') ? { href: localePath(locale, routeById('demo')!.path), label: t('routes.demo') } : null;

  return (
    <main>
      <section aria-labelledby="story-title" className="band relative isolate overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-14 sm:px-6 lg:py-20">
          <Eyebrow tone="band">{c.hero.eyebrow}</Eyebrow>
          <h1 id="story-title" className="max-w-4xl text-5xl font-extrabold leading-[1.03] sm:text-6xl">{c.hero.title}</h1>
          <p className="band-muted max-w-2xl text-xl"><Tk text={c.hero.lede} /></p>
          <ul className="mt-2 flex flex-wrap gap-2 text-sm">
            {c.cast.map((p) => <li key={p.id} className="rounded-full bg-white/12 px-3 py-1.5"><b><Tk text={p.name} /></b> · <Tk text={p.role} /></li>)}
          </ul>
        </div>
      </section>

      <section aria-label={c.controls.list} className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <StoryPlayer
          chapters={c.chapters} papers={c.papers} trailTitle={c.trailTitle} didLabel={c.didLabel} controls={c.controls}
          totals={c.totals}
          frameBase={frameUrl(STORY)} firstFrame={readFrame(STORY, c.chapters[0]!.frame)}
        />
        <IllustrativeLabel text={c.illustrative} />
      </section>

      <CtaBand title={c.cta.title} body={c.cta.body} primary={{ href: signupUrl({ locale }), label: t('nav.startFree') }} secondary={demo} />
    </main>
  );
}
