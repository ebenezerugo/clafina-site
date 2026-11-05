import type { Locale } from '../config/locales';

/**
 * The languages the help centre is published in. It is large (every page of the app), so a language gets its own
 * copy only once it is translated; until then its visitors read the English guide. Add a code here with its
 * content/<code>/help/ files.
 */
export const HELP_LOCALES: readonly Locale[] = ['en'];
export const isHelpPath = (path: string) => path === '/help/' || path.startsWith('/help/');
export const helpLocale = (locale: Locale): Locale => (HELP_LOCALES.includes(locale) ? locale : 'en');

/** "/pricing/" in French is "/fr/pricing/"; the home page "/" is "/fr/". The help centre is "/en/help/" until translated. */
export function localePath(locale: Locale, path: string): string {
  const l = isHelpPath(path) ? helpLocale(locale) : locale;
  return `/${l}${path === '/' ? '/' : path}`;
}

/** The page path without its language prefix, so a switcher can keep the visitor on the same page. */
export function stripLocale(pathname: string): string {
  const rest = pathname.replace(/^\/[^/]+/, '');
  return rest === '' ? '/' : rest;
}

/** Where the language switcher points: the same page, or the home page from the build-only 404 path. */
export function switcherPath(pathname: string): string {
  const rest = stripLocale(pathname);
  return rest.startsWith('/not-found-page/') ? '/' : rest;
}
