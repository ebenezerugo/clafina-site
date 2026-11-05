import { LOCALES, localeInfo, type Locale } from './locales';
import { ROUTES, routeById, type RouteId } from './routes';
import { buildMode, type BuildMode } from '@/lib/build-mode';

export interface Switch {
  on: boolean;
  note: string;
  sample?: boolean;
  value?: unknown;
  confirmedBy?: string;
  confirmedAt?: string;
}

export interface LanguageSwitch extends Switch {
  indexed: boolean;
}

const on = (note: string, extra: Partial<Switch> = {}): Switch => ({ on: true, note, ...extra });
const off = (note: string, extra: Partial<Switch> = {}): Switch => ({ on: false, note, ...extra });

type Keyed<K extends string, S = Switch> = Record<K, S>;

const prelaunchAreas = ROUTES.filter((r) => r.group === 'industry' || r.group === 'product').map((r) => r.id);
type PrelaunchArea = Extract<RouteId, `industry-${string}` | `product-${string}`>;

/**
 * Every switch on the site. Preview builds read them all as on; production reads the stored value.
 * Claim and pre-launch switches need confirmedBy and confirmedAt, and no sample value, to ship.
 * This file moves into the CMS later.
 */
export const SWITCHES = {
  claims: {
    livePayments: on('Named payment providers and countries.', { sample: true, value: ['Paystack', 'Flutterwave'] }),
    fiscalCertified: on('Tax-authority links stated as certified (FIRS, GRA, eTIMS).', { sample: true }),
    complianceLabels: on('GDPR, NDPA and HIPAA compliance lines and ISO 27001 / SOC 2 badges.', { sample: true }),
    uptime: on('Uptime figures on Trust, Pricing and Enterprise.', { sample: true, value: '99.9%' }),
    metrics: on('Customer counts, revenue processed and speed figures.', { sample: true, value: { businesses: '1,000+', languages: 20 } }),
  },
  prelaunch: {
    features: on('Features the product docs marked Not yet, built before go-live (spec Appendix A).'),
    ...(Object.fromEntries(prelaunchAreas.map((id) => [id, on(`Pre-launch features on ${id}.`)])) as Keyed<PrelaunchArea>),
  },
  pages: Object.fromEntries(ROUTES.map((r) => [r.id, on(`The ${r.id} page.`)])) as Keyed<RouteId>,
  sections: {} as Record<string, Switch>,
  languages: Object.fromEntries(LOCALES.map((l) => [l.code, { on: true, indexed: true, note: `${l.englishName}.` }])) as Keyed<Locale, LanguageSwitch>,
  countries: {
    global: on('Global edition, prices in US dollars.'),
    ng: on('Nigeria edition, prices in naira.'),
    latam: on('Latin America edition.'),
  },
  features: {
    newsletter: off('Newsletter sign-up in the footer.'),
    demoBooking: off('The Book a demo form.'),
    chatWidget: off('A chat widget.'),
    countrySwitcher: on('The country switcher.'),
    smartAppBanner: off('The phone smart app banner.'),
    deepLinks: off('Universal Links, App Links and store badges.'),
  },
};

type Groups = typeof SWITCHES;
export type SwitchKey = { [G in keyof Groups]: `${G & string}.${keyof Groups[G] & string}` }[keyof Groups];

function lookup(key: string): Switch {
  const [group, ...rest] = key.split('.');
  const name = rest.join('.');
  const bucket = (SWITCHES as Record<string, Record<string, Switch>>)[group ?? ''];
  const found = bucket && Object.prototype.hasOwnProperty.call(bucket, name) ? bucket[name] : undefined;
  if (!found) throw new Error(`Unknown switch: ${key}`);
  return found;
}

export function isOn(key: SwitchKey, mode: BuildMode = buildMode()): boolean {
  const found = lookup(key);
  return mode === 'preview' ? true : found.on;
}

export function pageAvailable(id: string, mode: BuildMode = buildMode()): boolean {
  const route = routeById(id);
  if (!route) throw new Error(`Unknown page: ${id}`);
  return route.built && isOn(`pages.${id}` as SwitchKey, mode);
}

export function localeEnabled(code: Locale): boolean {
  return SWITCHES.languages[code].on;
}

export function localeIndexed(code: Locale): boolean {
  const s = SWITCHES.languages[code];
  return s.on && s.indexed && localeInfo(code).status === 'reviewed';
}

const NEEDS_CONFIRMATION = new Set(['claims', 'prelaunch']);

/** Reasons a production build must not ship with the switches as stored. */
export function productionProblems(): string[] {
  const problems: string[] = [];
  for (const [group, bucket] of Object.entries(SWITCHES as Record<string, Record<string, Switch>>)) {
    for (const [name, s] of Object.entries(bucket)) {
      if (!s.on) continue;
      const key = `${group}.${name}`;
      if (s.sample) problems.push(`${key} is on with a sample value`);
      if (NEEDS_CONFIRMATION.has(group) && (!s.confirmedBy || !s.confirmedAt)) {
        problems.push(`${key} is on without confirmedBy and confirmedAt`);
      }
    }
  }
  return problems;
}
