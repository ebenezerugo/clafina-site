import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LOCALES, isLocale, type Locale } from '@/config/locales';
import { routeById } from '@/config/routes';
import { SITE, fact } from '@/config/site';
import { localeEnabled, mentionable, pageAvailable } from '@/config/switches';
import { loadContent } from '@/content/load';
import { DocContent, DocWords } from '@/content/pages';
import { docRoutes } from '@/lib/docs';
import { localePath } from '@/lib/paths';
import { alternates, robotsFor, SITE_ORIGIN } from '@/lib/seo';
import { Paragraphs } from '@/components/sections/Prose';
import { Eyebrow, HeroAura } from '@/components/sections/ui';

type Props = { params: Promise<{ locale: string; doc: string[] }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.filter((l) => localeEnabled(l.code)).flatMap((l) => docRoutes().map((r) => ({ locale: l.code, doc: r.path.split('/').filter(Boolean) })));
}

async function resolve(params: Props['params']) {
  const { locale: raw, doc } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'en';
  const path = `/${doc.join('/')}/`;
  const route = docRoutes().find((r) => r.path === path);
  if (!route) notFound();
  return { locale, route, c: loadContent(locale, `docs/${route.id}`, DocContent), w: loadContent(locale, 'doc-words', DocWords) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, route, c } = await resolve(params);
  const alt = alternates(locale, route.path);
  return { metadataBase: new URL(SITE_ORIGIN), title: c.meta.title, description: c.meta.description, alternates: { canonical: alt.canonical, languages: alt.languages }, robots: robotsFor(locale), openGraph: { title: c.meta.title, description: c.meta.description, url: alt.canonical, siteName: 'Clafina' } };
}

const EMAILS = ['hello', 'sales', 'support', 'privacy', 'security', 'press'] as const;

export default async function DocPage({ params }: Props) {
  const { locale, route, c, w } = await resolve(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const updated = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${c.updated}T00:00:00Z`));
  const email = c.contact.email ? fact(SITE.emails[c.contact.email]) : undefined;
  const roles = route.id === 'careers' ? (fact(SITE.openRoles) ?? []) : [];
  const inboxes = route.id === 'contact' ? EMAILS.map((k) => [k, fact(SITE.emails[k])] as const).filter(([, v]) => v) : [];

  return (
    <main>
      <section id="hero" aria-labelledby="doc-title" className="isolate relative bg-surface">
        <HeroAura />
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <Eyebrow>{c.hero.eyebrow}</Eyebrow>
          <h1 id="doc-title" className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{c.hero.title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">{c.hero.lede}</p>
          <p className="mt-6 text-sm text-muted">{w.updated} <time dateTime={c.updated}>{updated}</time></p>
          {c.status === 'draft' && (
            <div role="note" data-draft="" className="mt-6 max-w-2xl rounded-xl border border-warn bg-warn-fill p-4">
              <p className="font-bold">{w.draft.title}</p>
              <p className="mt-1">{w.draft.body}</p>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[220px_1fr]">
        <nav aria-labelledby="toc-title" className="lg:sticky lg:top-24 lg:self-start">
          <h2 id="toc-title" className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{w.contents}</h2>
          <ol className="mt-3 grid gap-2 text-sm">{c.sections.map((s) => <li key={s.id}><a href={`#${s.id}`} className="hover:underline">{s.heading}</a></li>)}</ol>
        </nav>
        <div className="min-w-0 max-w-3xl">
          {c.sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="mt-12 scroll-mt-24 first:mt-0">
              <h2 id={`${s.id}-title`} className="text-2xl font-extrabold tracking-tight">{s.heading}</h2>
              <Paragraphs paragraphs={s.paragraphs} list={s.list} />
            </section>
          ))}

          {roles.length > 0 && (
            <ul id="roles" className="mt-10 divide-y divide-line border-y border-line">
              {roles.map((r) => <li key={r.href} className="flex flex-wrap items-center justify-between gap-3 py-4"><span><span className="font-bold">{r.title}</span> <span className="text-muted">· {r.place}</span></span><a href={r.href} className="font-semibold hover:underline" aria-label={`${w.apply}: ${r.title}`}>{w.apply}</a></li>)}
            </ul>
          )}

          {inboxes.length > 0 && (
            <dl id="inboxes" className="mt-10 grid gap-3 sm:grid-cols-2">
              {inboxes.map(([k, v]) => <div key={k} className="rounded-xl border border-line p-4"><dt className="text-sm text-muted">{w.emailUs}</dt><dd><a href={`mailto:${v}`} className="font-semibold hover:underline">{v}</a></dd></div>)}
            </dl>
          )}

          <section id="contact" aria-labelledby="contact-title" className="mt-14 rounded-2xl bg-surface p-6">
            <h2 id="contact-title" className="text-xl font-bold">{c.contact.title}</h2>
            <p className="mt-2 text-muted">{c.contact.body}</p>
            {c.contact.email && <p className="mt-3">{email ? <a href={`mailto:${email}`} className="font-semibold hover:underline">{email}</a> : <span className="text-muted">{w.emailPending}</span>}</p>}
            {c.contact.routes.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-3">
                {c.contact.routes.filter((id) => mentionable(id) && pageAvailable(id)).map((id) => <li key={id}><a href={localePath(locale, routeById(id)!.path)} className="inline-flex min-h-11 items-center rounded-control border border-line bg-raised px-4 font-semibold hover:border-ink">{t(`routes.${id}` as never)}</a></li>)}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
