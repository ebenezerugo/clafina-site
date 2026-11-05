import { isOn } from './switches';

/** A checkable fact: either its real value or a note on what to put there. */
export type Fact<T> = { value: T } | { placeholder: string };

export function fact<T>(f: Fact<T>): T | undefined {
  return 'value' in f ? f.value : undefined;
}

const todo = <T>(placeholder: string): Fact<T> => ({ placeholder });

/**
 * Facts someone can check and act on. Fill these in before go-live; production refuses placeholders.
 * Moves into the CMS later.
 */
export const SITE = {
  legalName: todo<string>('Registered company name, e.g. "Clafina Technologies Ltd"'),
  address: todo<string>('Registered office address, one line'),
  emails: {
    hello: todo<string>('General enquiries inbox'),
    sales: todo<string>('Sales inbox'),
    support: todo<string>('Support inbox'),
    privacy: todo<string>('Privacy and data-protection inbox'),
    security: todo<string>('Security reports inbox'),
    press: todo<string>('Press inbox'),
  },
  appUrl: todo<string>('Web app address, e.g. https://app.clafina.com/'),
  signupUrl: todo<string>('Sign-up address, e.g. https://app.clafina.com/signup'),
  stores: {
    appStore: todo<string>('App Store listing URL'),
    googlePlay: todo<string>('Google Play listing URL'),
    tillDesktop: todo<string>('Desktop till download URL'),
    tillAndroid: todo<string>('Android till download URL'),
  },
  ios: {
    teamId: todo<string>('Apple developer team ID'),
    bundleId: todo<string>('iOS bundle ID, e.g. com.clafina.app'),
  },
  android: {
    packageName: todo<string>('Android package name'),
    sha256Fingerprints: todo<string[]>('Release signing certificate SHA-256 fingerprints'),
  },
  socials: {
    x: todo<string>('X profile URL'),
    linkedin: todo<string>('LinkedIn page URL'),
    instagram: todo<string>('Instagram profile URL'),
    facebook: todo<string>('Facebook page URL'),
    youtube: todo<string>('YouTube channel URL'),
    tiktok: todo<string>('TikTok profile URL'),
  },
  crmEndpoint: todo<string>('Where form leads are sent (CRM endpoint or webhook)'),
  turnstileSiteKey: todo<string>('Cloudflare Turnstile site key'),
};

/** Fallbacks preview builds use while the app addresses are placeholders. */
export const PREVIEW_APP_URL = 'https://app.clafina.com/';
export const PREVIEW_SIGNUP_URL = 'https://app.clafina.com/signup';

function placeholders(prefix: string, node: unknown): string[] {
  if (node && typeof node === 'object' && 'placeholder' in node) return [`${prefix} is a placeholder`];
  if (node && typeof node === 'object' && !('value' in node)) {
    return Object.entries(node).flatMap(([k, v]) => placeholders(`${prefix}.${k}`, v));
  }
  return [];
}

/** Placeholders a production build cannot ship with, given the switches as stored. */
export function settingsProblems(): string[] {
  const required: [string, unknown][] = [
    ['SITE.legalName', SITE.legalName],
    ['SITE.address', SITE.address],
    ['SITE.emails', SITE.emails],
    ['SITE.appUrl', SITE.appUrl],
    ['SITE.signupUrl', SITE.signupUrl],
  ];
  if (isOn('features.deepLinks', 'production')) {
    required.push(['SITE.stores', SITE.stores], ['SITE.ios', SITE.ios], ['SITE.android', SITE.android]);
  }
  if (isOn('features.demoBooking', 'production') || isOn('features.newsletter', 'production')) {
    required.push(['SITE.crmEndpoint', SITE.crmEndpoint], ['SITE.turnstileSiteKey', SITE.turnstileSiteKey]);
  }
  return required.flatMap(([name, node]) => placeholders(name, node));
}
