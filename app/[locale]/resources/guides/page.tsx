import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { loadContent } from '@/content/load';
import { GuidesContent } from '@/content/pages';
import { helpArticlePath, helpArticles, helpGuide, helpModules } from '@/lib/help';
import { localePath } from '@/lib/paths';
import { enabledLocales, pageLocale, pageMetadata } from '@/lib/simple-page';
import { Eyebrow, HeroAura } from '@/components/sections/ui';

type Props = { params: Promise<{ locale: string }> };
export const generateStaticParams = enabledLocales;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await pageLocale(params);
  return pageMetadata(locale, '/resources/guides/', loadContent(locale, 'guides', GuidesContent).meta);
}

export default async function GuidesPage({ params }: Props) {
  const locale = await pageLocale(params);
  setRequestLocale(locale);
  const c = loadContent(locale, 'guides', GuidesContent);
  const modules = new Map(helpModules('en').map((m) => [m.slug, m]));
  const article = (module: string, slug: string) => helpArticles(helpGuide('en', module)).find((a) => a.slug === slug);

  return (
    <main>
      <section id="hero" aria-labelledby="guides-title" className="isolate relative bg-surface">
        <HeroAura />
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-20">
          <Eyebrow>{c.hero.eyebrow}</Eyebrow>
          <h1 id="guides-title" className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{c.hero.title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">{c.hero.lede}</p>
          <nav aria-label={c.hero.eyebrow} className="mt-8"><ul className="flex flex-wrap gap-2">{c.paths.map((p) => <li key={p.id}><a href={`#${p.id}`} className="inline-flex min-h-11 items-center rounded-full border border-line bg-raised px-4 text-sm font-medium hover:border-ink">{p.title}</a></li>)}</ul></nav>
        </div>
      </section>
      <div className="mx-auto grid max-w-4xl gap-14 px-4 py-16 sm:px-6">
        {c.paths.map((p) => (
          <section key={p.id} id={p.id} aria-labelledby={`${p.id}-title`} className="scroll-mt-24">
            <h2 id={`${p.id}-title`} className="text-2xl font-extrabold tracking-tight">{p.title}</h2>
            <p className="mt-2 text-lg text-muted">{p.intro}</p>
            <ol className="mt-6 grid gap-3">
              {p.steps.map((s, i) => {
                const a = article(s.module, s.article);
                if (!a) return null;
                return (
                  <li key={`${s.module}/${s.article}`} className="flex gap-4">
                    <span aria-hidden="true" className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">{i + 1}</span>
                    <a href={localePath(locale, helpArticlePath(s.module, s.article))} className="lift shadow-sm block flex-1 rounded-xl border border-line bg-raised p-4 hover:border-ink">
                      <span className="font-semibold">{a.title}</span>
                      <span className="mt-1 block text-sm text-muted">{modules.get(s.module)?.title} · {a.summary}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
        <p><a href={localePath(locale, '/help/')} className="font-semibold hover:underline">{c.helpLink}</a></p>
      </div>
    </main>
  );
}
