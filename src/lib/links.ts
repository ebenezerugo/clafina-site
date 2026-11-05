import type { Locale } from '../config/locales';
import { PREVIEW_APP_URL, PREVIEW_SIGNUP_URL, SITE, fact } from '../config/site';
import { CAMPAIGN_KEYS, type Campaign } from './campaign';

export type Country = 'global' | 'ng' | 'latam';

const MARKETING_ORIGIN = 'https://clafina.com';

/** The one place sign-up links are built, so every page sends the same context into the app. */
export function signupUrl(o: { locale: Locale; pack?: string; plan?: string; country?: Country; campaign?: Campaign }): string {
  const url = new URL(fact(SITE.signupUrl) ?? PREVIEW_SIGNUP_URL);
  const params = new URLSearchParams();
  if (o.pack) params.set('pack', o.pack);
  if (o.plan) params.set('plan', o.plan);
  params.set('lang', o.locale);
  if (o.country) params.set('country', o.country);
  for (const key of CAMPAIGN_KEYS) {
    const value = o.campaign?.[key];
    if (value) params.set(key, value);
  }
  url.search = params.toString();
  return url.toString();
}

export function appUrl(path: string): string {
  return new URL(path.replace(/^\//, ''), fact(SITE.appUrl) ?? PREVIEW_APP_URL).toString();
}

/** A link the phone app claims through Universal Links and App Links; elsewhere it opens the web app. */
export function openInAppUrl(path: string): string {
  return `${MARKETING_ORIGIN}/open${path.startsWith('/') ? path : `/${path}`}`;
}
