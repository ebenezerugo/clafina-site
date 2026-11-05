import type { Locale } from '../config/locales';

/** "/pricing/" in French is "/fr/pricing/"; the home page "/" is "/fr/". */
export function localePath(locale: Locale, path: string): string {
  return `/${locale}${path === '/' ? '/' : path}`;
}

/** The page path without its language prefix, so a switcher can keep the visitor on the same page. */
export function stripLocale(pathname: string): string {
  const rest = pathname.replace(/^\/[^/]+/, '');
  return rest === '' ? '/' : rest;
}
