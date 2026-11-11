import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LOCALES, isLocale, type Locale } from '@/config/locales';
import { routeById } from '@/config/routes';
import { localeEnabled, pageAvailable } from '@/config/switches';
import { loadContent } from '@/content/load';
import { IndustriesIndex, IndustryStory } from '@/content/industry';
import { signupUrl } from '@/lib/links';
import { localePath } from '@/lib/paths';
import { alternates, robotsFor, SITE_ORIGIN } from '@/lib/seo';
import { CtaBand, Eyebrow, HeroAura, Section } from '@/components/sections/ui';

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return LOCALES.filter((l) => localeEnabled(l.code)).map((l) => ({ locale: l.code }));
}

const slugOf = (path: string) => path.split('/').filter(Boolean).pop()!;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'en';
  const c = loadContent(locale, 'industries', IndustriesIndex);
  const alt = alternates(locale, '/industries/');
  return { metadataBase: new URL(SITE_ORIGIN), title: c.meta.title, description: c.meta.description, alternates: { canonical: alt.canonical, languages: alt.languages }, robots: robotsFor(locale), openGraph: { title: c.meta.title, description: c.meta.description, url: alt.canonical, siteName: 'Clafina' } };
}

export default async function IndustriesPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'en';
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const c = loadContent(locale, 'industries', IndustriesIndex);
  const demo = pageAvailable('demo') ? localePath(locale, routeById('demo')!.path) : null;
  // Only built, switched-on stories appear; a group with none left is dropped.
  const groups = c.groups
    .map((g) => ({ ...g, items: g.items.filter((id) => pageAvailable(id)) }))
    .filter((g) => g.items.length > 0);

  return (
    <main>
      <section id="hero" aria-labelledby="industries-title" className="relative isolate">
        <HeroAura />
        <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:pt-24">
          <Eyebrow>{c.hero.eyebrow}</Eyebrow>
          <h1 id="industries-title" className="mt-4 max-w-4xl text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl">{c.hero.title}</h1>
          <p className="mt-6 max-w-2xl text-xl text-muted">{c.hero.lede}</p>
        </div>
      </section>

      {groups.map((g, i) => (
        <Section key={g.title} id={`group-${i + 1}`} title={g.title} intro={g.body} tone={i % 2 ? 'surface' : 'page'}>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-group={g.title}>
            {g.items.map((id) => {
              const route = routeById(id)!;
              const story = loadContent(locale, `industries/${slugOf(route.path)}`, IndustryStory);
              return (
                <li key={id} className="lift shadow-sm flex flex-col rounded-xl border border-line bg-raised p-6">
                  <p className="text-xs font-semibold text-muted">{story.core ? c.coreLabel : c.packLabel}</p>
                  <h3 className="mt-2 text-xl font-bold">{t(`routes.${id}` as never)}</h3>
                  <p className="mt-2 flex-1 text-muted">{story.meta.description}</p>
                  <a href={localePath(locale, route.path)} className="mt-5 inline-flex min-h-11 items-center font-semibold hover:underline" aria-label={`${t('industry.open')}: ${t(`routes.${id}` as never)}`}>{t('industry.open')}</a>
                </li>
              );
            })}
          </ul>
        </Section>
      ))}

      <CtaBand title={c.cta.title} body={c.cta.body} primary={{ href: signupUrl({ locale }), label: t('nav.startFree') }} secondary={demo ? { href: demo, label: t('routes.demo') } : null} />
    </main>
  );
}
