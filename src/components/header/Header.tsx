import { getTranslations } from 'next-intl/server';
import { Logo } from '@/brand/Logo';
import { visibleNav } from '@/config/nav';
import type { Locale } from '@/config/locales';
import { appUrl, signupUrl } from '@/lib/links';
import { localePath } from '@/lib/paths';
import { routeById } from '@/config/routes';
import { MegaMenu, type Menu, type MenuItem } from './MegaMenu';
import { MobileMenu } from './MobileMenu';

export async function Header({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale });
  const nav = visibleNav();
  const item = (id: string): MenuItem => ({ id, href: localePath(locale, routeById(id)!.path), label: t(`routes.${id}` as never) });
  const menus: Menu[] = nav.menus.map((m) => ({
    id: m.id,
    label: t(`nav.${m.id}` as never),
    groups: m.groups.map((g) => ({ id: g.id, label: t(`nav.groups.${g.id}` as never), items: g.items.map(item) })),
  }));
  const links = nav.links.map(item);
  const signIn = appUrl('/');
  const startFree = signupUrl({ locale });

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/90 backdrop-blur supports-[backdrop-filter]:bg-page/80">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <a href={localePath(locale, '/')} className="inline-flex min-h-11 items-center rounded-md text-ink">
          <Logo />
        </a>
        <div className="flex-1">
          <MegaMenu menus={menus} links={links} label={t('nav.label')} />
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <a href={signIn} className="inline-flex min-h-11 items-center rounded-md px-3 text-[15px] font-medium text-ink hover:bg-surface">{t('nav.signIn')}</a>
          <a href={startFree} data-signup="" className="inline-flex min-h-11 items-center rounded-control bg-primary px-5 text-[15px] font-semibold text-on-primary hover:bg-primary-hover">{t('nav.startFree')}</a>
        </div>
        <MobileMenu
          menus={menus}
          links={links}
          labels={{ open: t('nav.openMenu'), close: t('nav.closeMenu'), nav: t('nav.label') }}
          actions={
            <>
              <a href={signIn} className="inline-flex min-h-11 items-center justify-center rounded-control border border-line font-medium">{t('nav.signIn')}</a>
              <a href={startFree} data-signup="" className="inline-flex min-h-11 items-center justify-center rounded-control bg-primary font-semibold text-on-primary">{t('nav.startFree')}</a>
            </>
          }
        />
      </div>
    </header>
  );
}
