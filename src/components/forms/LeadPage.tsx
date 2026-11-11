import { getTranslations } from 'next-intl/server';
import Script from 'next/script';
import { localeInfo, type Locale } from '@/config/locales';
import { ROUTES } from '@/config/routes';
import { SITE, fact } from '@/config/site';
import { loadContent } from '@/content/load';
import { LeadPageContent } from '@/content/lead-page';
import { Eyebrow, HeroAura } from '@/components/sections/ui';
import { IconTile } from '@/components/icons/SiteIcon';
import { LeadForm } from './LeadForm';

const COUNTRIES = ['NG', 'GH', 'KE', 'ZA', 'EG', 'MA', 'SN', 'CI', 'CM', 'ET', 'TZ', 'UG', 'RW', 'AE', 'SA', 'IN', 'ID', 'TR', 'CN', 'JP', 'RU', 'GB', 'FR', 'DE', 'ES', 'PT', 'US', 'CA', 'BR', 'MX', 'CO', 'AR', 'CL', 'PE'];

/** The Book a demo and Contact sales pages: the same form with different words around it. */
export async function LeadPage({ locale, id, kind }: { locale: Locale; id: 'demo' | 'contact-sales' | 'partners-apply' | 'developers-signup'; kind: 'demo' | 'sales' | 'partner' | 'developer' }) {
  const t = await getTranslations({ locale });
  const c = loadContent(locale, id, LeadPageContent);
  const names = new Intl.DisplayNames([localeInfo(locale).hreflang, 'en'], { type: 'region' });
  const countries = COUNTRIES.map((code) => ({ code, name: names.of(code) ?? code })).sort((a, b) => a.name.localeCompare(b.name, localeInfo(locale).hreflang));
  const industries = ROUTES.filter((r) => r.group === 'industry' && r.id !== 'industries').map((r) => ({ id: r.id, label: t(`routes.${r.id}` as never) }));
  const siteKey = fact(SITE.turnstileSiteKey);

  return (
    <main className="relative isolate overflow-hidden">
      <HeroAura />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:py-24">
      <div>
        <Eyebrow>{c.eyebrow}</Eyebrow>
        <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{c.title}</h1>
        <p className="mt-5 text-lg text-muted">{c.lede}</p>
        <ul className="mt-10 grid gap-6">
          {c.expect.map((e) => <li key={e.title} className="flex gap-4"><span className="mt-1"><IconTile name="check" size={18} /></span><div><h2 className="text-lg font-bold">{e.title}</h2><p className="mt-1 text-muted">{e.body}</p></div></li>)}
        </ul>
      </div>
      <div className="lit-frame relative rounded-2xl bg-raised p-6 sm:p-8">
        <LeadForm kind={kind} locale={locale} text={c.form} industries={industries} countries={countries} salesEmail={fact(SITE.emails.sales)} turnstileSiteKey={siteKey} />
      </div>
      {siteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />}
      </div>
    </main>
  );
}
