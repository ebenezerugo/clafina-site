import { getTranslations } from 'next-intl/server';
import { Logo } from '@/brand/Logo';
import { LOCALES, type Locale } from '@/config/locales';
import { routeById } from '@/config/routes';
import { isOn, localeEnabled, pageAvailable } from '@/config/switches';
import { signupUrl } from '@/lib/links';
import { localePath } from '@/lib/paths';
import { CountrySwitcher } from '@/components/switchers/CountrySwitcher';
import { LanguageSwitcher } from '@/components/switchers/LanguageSwitcher';
import { footerModel, type FooterColumnId } from './footer-model';

/**
 * The footer's link area, laid out by weight: Product (in its groups) and Industries take wide columns of their own,
 * the shorter sections share a column two by two, and Legal sits in the bottom bar where people look for it.
 */
const STACKS: FooterColumnId[][] = [['solutions', 'partners'], ['resources', 'developers'], ['company', 'trust']];

export async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale });
  const model = footerModel();
  const languages = LOCALES.filter((l) => localeEnabled(l.code)).map((l) => ({ code: l.code, endonym: l.endonym, hreflang: l.hreflang, dir: l.dir }));
  const countries = (['global', 'ng', 'latam'] as const).filter((c) => isOn(`countries.${c}`)).map((code) => ({ code, name: t(`switcher.countries.${code}`) }));
  const badges = Object.entries(model.top.appBadges) as [('appStore' | 'googlePlay'), string][];
  const column = (id: FooterColumnId) => model.columns.find((c) => c.id === id);
  const href = (id: string) => localePath(locale, routeById(id)!.path);
  const name = (id: string) => t(`routes.${id}` as never);
  const industries = column('industries');
  const legal = column('legal');
  const stacks = STACKS.map((s) => s.map(column).filter((c) => c !== undefined)).filter((s) => s.length);
  const demo = pageAvailable('demo') ? href('demo') : null;

  const Heading = ({ id, children }: { id: string; children: string }) => <h2 id={id} className="text-[13px] font-semibold text-ink">{children}</h2>;
  const Links = ({ items, labelledBy }: { items: string[]; labelledBy: string }) => (
    <ul aria-labelledby={labelledBy} className="mt-3 grid gap-2.5 text-[14px] leading-snug">
      {items.map((id) => <li key={id}><a href={href(id)} className="text-muted transition-colors hover:text-ink">{name(id)}</a></li>)}
    </ul>
  );

  return (
    <footer aria-label={t('footer.label')} className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-8 py-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-md">
            <Logo />
            <p className="mt-4 text-[15px] leading-relaxed text-muted">{t('footer.tagline')}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={signupUrl({ locale })} data-signup="" className="inline-flex min-h-11 items-center rounded-control bg-primary px-5 text-[15px] font-semibold text-on-primary hover:bg-primary-hover">{t('nav.startFree')}</a>
              {demo && <a href={demo} className="inline-flex min-h-11 items-center rounded-control border border-line bg-raised px-5 text-[15px] font-semibold hover:border-ink">{name('demo')}</a>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {badges.length > 0 && (
              <ul aria-label={t('footer.getTheApps')} className="flex gap-2">
                {badges.map(([store, url]) => (
                  <li key={store}><a href={url} className="inline-flex min-h-11 items-center rounded-control border border-line bg-raised px-4 text-sm font-medium hover:border-ink">{t(`footer.${store}`)}</a></li>
                ))}
              </ul>
            )}
            <LanguageSwitcher current={locale} options={languages} label={t('switcher.language')} />
            {isOn('features.countrySwitcher') && countries.length > 1 && <CountrySwitcher label={t('switcher.country')} options={countries} />}
          </div>
        </div>

        {model.columns.length > 0 && (
          <nav aria-label={t('footer.label')} className="grid grid-cols-2 gap-x-6 gap-y-12 border-t border-line py-12 sm:gap-x-8 lg:grid-cols-[2fr_1.5fr_1fr] xl:grid-cols-[2.1fr_1.6fr_1fr_1fr_1fr]">
            {model.productGroups.length > 0 && (
              <section aria-labelledby="footer-product" className="col-span-2 min-w-0 lg:col-span-1">
                <h2 id="footer-product" className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{t('footer.columns.product')}</h2>
                <div className="mt-5 columns-2 gap-x-6">
                  {model.productGroups.map((g) => (
                    <div key={g.id} className="mb-7 min-w-0 break-inside-avoid">
                      <Heading id={`footer-group-${g.id}`}>{t(g.id === 'plans' ? 'footer.plansAndApps' : (`nav.groups.${g.id}` as never))}</Heading>
                      <Links items={g.items} labelledBy={`footer-group-${g.id}`} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {industries && (
              <section aria-labelledby="footer-industries" className="col-span-2 min-w-0 sm:col-span-1">
                <h2 id="footer-industries" className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{t('footer.columns.industries')}</h2>
                <ul aria-labelledby="footer-industries" className="mt-5 columns-2 gap-x-6 text-[14px] leading-snug">
                  {industries.items.map((id) => <li key={id} className={`mb-2.5 break-inside-avoid ${id === 'industries' ? 'font-semibold [column-span:all] mb-3.5' : ''}`}><a href={href(id)} className={id === 'industries' ? 'text-ink hover:underline' : 'text-muted transition-colors hover:text-ink'}>{name(id)}</a></li>)}
                </ul>
              </section>
            )}

            {stacks.map((stack) => (
              <div key={stack.map((c) => c.id).join('-')} className="grid min-w-0 content-start gap-9">
                {stack.map((c) => (
                  <section key={c.id} aria-labelledby={`footer-${c.id}`}>
                    <h2 id={`footer-${c.id}`} className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{t(`footer.columns.${c.id}`)}</h2>
                    <ul aria-labelledby={`footer-${c.id}`} className="mt-5 grid gap-2.5 text-[14px] leading-snug">
                      {c.items.map((id) => <li key={id}><a href={href(id)} className="text-muted transition-colors hover:text-ink">{name(id)}</a></li>)}
                    </ul>
                  </section>
                ))}
              </div>
            ))}
          </nav>
        )}

        <div className="flex flex-col gap-5 border-t border-line py-8 text-sm text-muted lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-4">
            <span>{t('footer.copyright', { year: model.bottom.year })}</span>
            {(model.bottom.legalName || model.bottom.address) && <span>{[model.bottom.legalName, model.bottom.address].filter(Boolean).join(' · ')}</span>}
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
            {legal && (
              <ul aria-label={t('footer.columns.legal')} className="flex flex-wrap gap-x-5 gap-y-2">
                {legal.items.map((id) => <li key={id}><a href={href(id)} className="hover:text-ink">{name(id)}</a></li>)}
              </ul>
            )}
            {model.bottom.socials.length > 0 && (
              <ul aria-label={t('footer.socials')} className="flex flex-wrap gap-x-4 gap-y-2">
                {model.bottom.socials.map((s) => <li key={s.name}><a href={s.url} className="capitalize hover:text-ink">{s.name}</a></li>)}
              </ul>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
