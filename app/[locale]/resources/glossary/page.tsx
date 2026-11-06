import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { loadContent } from '@/content/load';
import { GlossaryContent } from '@/content/pages';
import { glossaryTerms } from '@/lib/glossary';
import { localePath } from '@/lib/paths';
import { enabledLocales, pageLocale, pageMetadata } from '@/lib/simple-page';

type Props = { params: Promise<{ locale: string }> };
export const generateStaticParams = enabledLocales;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await pageLocale(params);
  return pageMetadata(locale, '/resources/glossary/', loadContent(locale, 'glossary', GlossaryContent).meta);
}

const letterOf = (w: string) => { const c = w.normalize('NFKD')[0]!.toUpperCase(); return /[A-Z]/.test(c) ? c : '#'; };

export default async function GlossaryPage({ params }: Props) {
  const locale = await pageLocale(params);
  setRequestLocale(locale);
  const c = loadContent(locale, 'glossary', GlossaryContent);
  const terms = glossaryTerms(locale, c.terms);
  const letters = [...new Set(terms.map((t) => letterOf(t.word)))];
  const ld = { '@context': 'https://schema.org', '@type': 'DefinedTermSet', name: c.hero.title, hasDefinedTerm: terms.map((t) => ({ '@type': 'DefinedTerm', name: t.word, description: t.meaning })) };

  return (
    <main>
      <section id="hero" aria-labelledby="glossary-title" className="bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{c.hero.eyebrow}</p>
          <h1 id="glossary-title" className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{c.hero.title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">{c.hero.lede}</p>
          <nav aria-label={c.jumpTo} className="mt-8"><ul className="flex flex-wrap gap-1">{letters.map((l) => <li key={l}><a href={`#letter-${l === '#' ? 'other' : l}`} className="inline-flex size-11 items-center justify-center rounded-control border border-line bg-raised font-bold hover:border-ink">{l}</a></li>)}</ul></nav>
        </div>
      </section>
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        {letters.map((l) => (
          <section key={l} id={`letter-${l === '#' ? 'other' : l}`} aria-labelledby={`letter-${l}-title`} className="mt-10 scroll-mt-24 first:mt-0">
            <h2 id={`letter-${l}-title`} className="text-3xl font-extrabold">{l}</h2>
            <dl className="mt-4 divide-y divide-line border-y border-line">
              {terms.filter((t) => letterOf(t.word) === l).map((t) => (
                <div key={t.word} className="py-4">
                  <dt className="text-lg font-bold">{t.word}</dt>
                  <dd className="mt-1">{t.meaning}{t.see && <> <span className="text-sm text-muted">{c.seeIn} <a href={localePath(locale, t.see.path)} className="hover:underline">{t.see.label}</a></span></>}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </main>
  );
}
