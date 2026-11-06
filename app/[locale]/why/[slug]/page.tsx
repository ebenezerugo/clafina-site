import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LOCALES, isLocale, type Locale } from '@/config/locales';
import { ROUTES, routeById } from '@/config/routes';
import { localeEnabled, pageAvailable } from '@/config/switches';
import { loadContent } from '@/content/load';
import { ExplainerContent } from '@/content/pages';
import { signupUrl } from '@/lib/links';
import { localePath } from '@/lib/paths';
import { alternates, robotsFor, SITE_ORIGIN } from '@/lib/seo';
import { visible } from '@/lib/visible';
import { OneRecordDiagram } from '@/components/sections/OneRecordDiagram';
import { ClaimText, CtaButtons } from '@/components/sections/ui';
import { Paragraphs } from '@/components/sections/Prose';

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

const whyRoutes = () => ROUTES.filter((r) => r.group === 'why' && pageAvailable(r.id));
const slugOf = (path: string) => path.split('/').filter(Boolean).pop()!;

export function generateStaticParams() {
  return LOCALES.filter((l) => localeEnabled(l.code)).flatMap((l) => whyRoutes().map((r) => ({ locale: l.code, slug: slugOf(r.path) })));
}

async function resolve(params: Props['params']) {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'en';
  const route = whyRoutes().find((r) => slugOf(r.path) === slug);
  if (!route) notFound();
  return { locale, route, c: loadContent(locale, `why/${slug}`, ExplainerContent) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, route, c } = await resolve(params);
  const alt = alternates(locale, route.path);
  return { metadataBase: new URL(SITE_ORIGIN), title: c.meta.title, description: c.meta.description, alternates: { canonical: alt.canonical, languages: alt.languages }, robots: robotsFor(locale), openGraph: { title: c.meta.title, description: c.meta.description, url: alt.canonical, siteName: 'Clafina', type: 'article' } };
}

export default async function WhyPage({ params }: Props) {
  const { locale, route, c } = await resolve(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const demo = pageAvailable('demo') ? localePath(locale, routeById('demo')!.path) : null;
  const others = whyRoutes().filter((r) => r.id !== route.id);
  const faq = c.faq.filter(visible);
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };

  return (
    <main>
      <section id="hero" aria-labelledby="why-title" className="bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{c.hero.eyebrow}</p>
          <h1 id="why-title" className="mt-4 text-5xl font-extrabold leading-[1.05] tracking-tight">{c.hero.title}</h1>
          <p className="mt-6 text-xl text-muted">{c.hero.lede}</p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-3">
            {c.points.map((p) => <li key={p.title} className="border-t border-line pt-4"><p className="font-bold">{p.title}</p><p className="mt-1 text-muted">{p.body}</p></li>)}
          </ul>
        </div>
      </section>

      {c.diagram && (
        <section id="diagram" aria-label={c.diagram.label}>
          <div className="mx-auto max-w-4xl px-4 pt-16 sm:px-6"><OneRecordDiagram label={c.diagram.label} centre={c.diagram.centre} spokes={c.diagram.spokes} /></div>
        </section>
      )}

      <div id="explainer">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          {c.sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="mt-12 first:mt-0 scroll-mt-24">
              <h2 id={`${s.id}-title`} className="text-2xl font-extrabold tracking-tight sm:text-3xl">{s.heading}</h2>
              <Paragraphs paragraphs={s.paragraphs} list={s.list} />
            </section>
          ))}
        </div>
      </div>

      <section id="faq" aria-labelledby="faq-title" className="bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 id="faq-title" className="text-3xl font-extrabold tracking-tight">{c.faqTitle}</h2>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {faq.map((f) => <details key={f.q} className="group py-4" data-prelaunch={f.prelaunch}><summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 font-semibold">{f.q}<span aria-hidden="true" className="transition-transform group-open:rotate-45">+</span></summary><p className="mt-2 text-muted"><ClaimText text={f.a} claim={f.claim} /></p></details>)}
          </div>
          {others.length > 0 && (
            <nav aria-label={t('nav.groups.why')} className="mt-12">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{t('nav.groups.why')}</p>
              <ul className="mt-3 flex flex-wrap gap-3">{others.map((r) => <li key={r.id}><a href={localePath(locale, r.path)} className="inline-flex min-h-11 items-center rounded-full border border-line bg-raised px-4 font-medium hover:border-ink">{t(`routes.${r.id}` as never)}</a></li>)}</ul>
            </nav>
          )}
        </div>
      </section>

      <section id="cta" aria-labelledby="cta-title" className="bg-ink text-page">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h2 id="cta-title" className="max-w-3xl text-4xl font-extrabold tracking-tight">{c.cta.title}</h2>
          <p className="mt-4 max-w-2xl text-lg opacity-80">{c.cta.body}</p>
          <div className="mt-8"><CtaButtons primary={{ href: signupUrl({ locale }), label: t('nav.startFree') }} secondary={demo ? { href: demo, label: t('routes.demo') } : null} /></div>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </main>
  );
}
