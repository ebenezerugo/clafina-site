import { getTranslations } from 'next-intl/server';
import { Logo } from '@/brand/Logo';
import { LOCALES, type Locale } from '@/config/locales';
import { routeById } from '@/config/routes';
import { isOn, localeEnabled } from '@/config/switches';
import { localePath } from '@/lib/paths';
import { CountrySwitcher } from '@/components/switchers/CountrySwitcher';
import { LanguageSwitcher } from '@/components/switchers/LanguageSwitcher';
import { footerModel } from './footer-model';

export async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale });
  const model = footerModel();
  const languages = LOCALES.filter((l) => localeEnabled(l.code)).map((l) => ({ code: l.code, endonym: l.endonym, hreflang: l.hreflang, dir: l.dir }));
  const countries = (['global', 'ng', 'latam'] as const).filter((c) => isOn(`countries.${c}`)).map((code) => ({ code, name: t(`switcher.countries.${code}`) }));
  const badges = Object.entries(model.top.appBadges) as [('appStore' | 'googlePlay'), string][];

  return (
    <footer aria-label={t('footer.label')} className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 border-b border-line py-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-3 text-[15px] text-muted">{t('footer.tagline')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {badges.length > 0 && (
              <ul aria-label={t('footer.getTheApps')} className="flex gap-2">
                {badges.map(([store, url]) => (
                  <li key={store}><a href={url} className="inline-flex min-h-11 items-center rounded-md border border-line bg-raised px-4 text-sm font-medium">{t(`footer.${store}`)}</a></li>
                ))}
              </ul>
            )}
            <LanguageSwitcher current={locale} options={languages} label={t('switcher.language')} />
            {isOn('features.countrySwitcher') && countries.length > 1 && <CountrySwitcher label={t('switcher.country')} options={countries} />}
          </div>
        </div>

        {model.columns.length > 0 && (
          <nav aria-label={t('footer.label')} className="grid grid-cols-2 gap-x-6 gap-y-10 py-12 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
            {model.columns.map((col) => (
              <div key={col.id} className="min-w-0">
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{t(`footer.columns.${col.id}`)}</h2>
                <ul className="mt-4 grid gap-2 text-sm">
                  {col.items.map((id) => (
                    <li key={id}><a href={localePath(locale, routeById(id)!.path)} className="text-ink hover:underline">{t(`routes.${id}` as never)}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        )}

        <div className="flex flex-col gap-4 border-t border-line py-6 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <div className="grid gap-1">
            <span>{t('footer.copyright', { year: model.bottom.year })}</span>
            {(model.bottom.legalName || model.bottom.address) && (
              <span>{[model.bottom.legalName, model.bottom.address].filter(Boolean).join(' · ')}</span>
            )}
          </div>
          {model.bottom.socials.length > 0 && (
            <ul aria-label={t('footer.socials')} className="flex flex-wrap gap-4">
              {model.bottom.socials.map((s) => <li key={s.name}><a href={s.url} className="hover:text-ink">{s.name}</a></li>)}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
