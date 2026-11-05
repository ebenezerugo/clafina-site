export type RouteGroup = 'core' | 'product' | 'industry' | 'solution' | 'why' | 'resource' | 'partner' | 'developer' | 'trust' | 'company' | 'legal';

export interface RouteDef {
  id: string;
  path: string;
  group: RouteGroup;
  built: boolean;
  /** Internal pages built only in preview, never in production, menus, footer or sitemaps. */
  previewOnly?: true;
  /** A whole page that is built before go-live: shown only while pre-launch features and its own area are on. */
  prelaunch?: true;
}

const r = <const I extends string>(id: I, path: string, group: RouteGroup, built = false) => ({ id, path, group, built });
const pre = <const I extends string>(id: I, path: string, group: RouteGroup) => ({ id, path, group, built: true, prelaunch: true as const });
const internal = <const I extends string>(id: I, path: string) => ({ id, path, group: 'core' as RouteGroup, built: true, previewOnly: true as const });

/** Every page in the site map (spec section 3). A page appears only when it is built and its switch is on. */
export const ROUTES = [
  r('home', '/', 'core', true),
  r('platform', '/platform/', 'core', true),
  r('pricing', '/pricing/', 'core', true),
  r('pricing-compare', '/pricing/compare/', 'core', true),
  r('demo', '/demo/', 'core', true),
  r('contact-sales', '/contact-sales/', 'core', true),
  r('start', '/start/', 'core'),
  r('download', '/download/', 'core'),
  internal('screens', '/screens/'),

  r('product-finance', '/product/finance/', 'product', true),
  r('product-payments', '/product/payments/', 'product', true),
  r('product-tax', '/product/tax/', 'product', true),
  r('product-business-health', '/product/business-health/', 'product', true),
  r('product-sales', '/product/sales/', 'product', true),
  r('product-crm', '/product/crm/', 'product', true),
  r('product-pos', '/product/pos/', 'product', true),
  r('product-online-shop', '/product/online-shop/', 'product', true),
  r('product-trading-network', '/product/trading-network/', 'product', true),
  r('product-stock', '/product/stock/', 'product', true),
  r('product-purchasing', '/product/purchasing/', 'product', true),
  r('product-manufacturing', '/product/manufacturing/', 'product', true),
  r('product-bookings', '/product/bookings/', 'product', true),
  r('product-projects', '/product/projects/', 'product', true),
  r('product-assets', '/product/assets/', 'product', true),
  r('product-hr', '/product/hr/', 'product', true),
  r('product-communication', '/product/communication/', 'product', true),
  pre('product-email', '/product/business-email/', 'product'),
  r('product-mobile', '/product/mobile/', 'product', true),
  r('product-assistant', '/product/assistant/', 'product', true),
  r('product-capture', '/product/capture/', 'product', true),
  r('product-integrations', '/product/integrations/', 'product', true),

  r('industries', '/industries/', 'industry', true),
  r('industry-retail', '/industries/retail/', 'industry', true),
  r('industry-restaurant', '/industries/restaurant/', 'industry'),
  r('industry-accommodation', '/industries/accommodation/', 'industry'),
  r('industry-events', '/industries/events/', 'industry'),
  r('industry-memberships', '/industries/memberships/', 'industry'),
  r('industry-classes', '/industries/classes/', 'industry'),
  r('industry-courses', '/industries/courses/', 'industry'),
  r('industry-client-records', '/industries/clinics-and-salons/', 'industry'),
  r('industry-property', '/industries/property/', 'industry'),
  r('industry-construction', '/industries/construction/', 'industry'),
  r('industry-field-service', '/industries/field-service/', 'industry'),
  r('industry-rentals', '/industries/rentals/', 'industry'),
  r('industry-distribution', '/industries/distribution/', 'industry'),
  r('industry-farm', '/industries/farm/', 'industry'),
  r('industry-manufacturing', '/industries/manufacturing/', 'industry'),
  r('industry-fundraising', '/industries/fundraising/', 'industry'),
  r('industry-configurator', '/industries/product-configurator/', 'industry'),

  r('solution-small-business', '/solutions/small-business/', 'solution'),
  r('solution-growing', '/solutions/growing-business/', 'solution'),
  r('solution-enterprise', '/solutions/enterprise/', 'solution'),
  r('solution-multi-branch', '/solutions/multi-branch/', 'solution'),
  r('solution-owners', '/solutions/owners/', 'solution'),
  r('solution-finance-teams', '/solutions/finance-teams/', 'solution'),
  r('solution-operations', '/solutions/operations/', 'solution'),
  r('solution-sales-teams', '/solutions/sales-teams/', 'solution'),
  r('solution-hr', '/solutions/hr-and-people/', 'solution'),

  r('why-one-record', '/why/one-record/', 'why'),
  r('why-switching', '/why/switching/', 'why'),
  r('why-offline', '/why/offline/', 'why'),
  r('why-languages', '/why/languages-and-currencies/', 'why'),

  r('resources-guides', '/resources/guides/', 'resource'),
  r('resources-templates', '/resources/templates/', 'resource'),
  r('resources-glossary', '/resources/glossary/', 'resource'),
  r('help', '/help/', 'resource'),
  r('whats-new', '/whats-new/', 'resource'),

  r('partners-accountants', '/partners/accountants/', 'partner'),
  r('partners-implementation', '/partners/implementation/', 'partner'),
  r('partners-apply', '/partners/apply/', 'partner'),

  r('developers', '/developers/', 'developer'),
  r('developers-webhooks', '/developers/webhooks/', 'developer'),
  r('developers-signup', '/developers/sign-up/', 'developer'),

  r('trust-security', '/trust/security/', 'trust'),
  r('trust-privacy', '/trust/privacy/', 'trust'),
  r('trust-reliability', '/trust/reliability/', 'trust'),
  r('trust-accessibility', '/trust/accessibility/', 'trust'),

  r('about', '/about/', 'company'),
  r('careers', '/careers/', 'company'),
  r('press', '/press/', 'company'),
  r('contact', '/contact/', 'company'),

  r('legal-privacy', '/legal/privacy/', 'legal'),
  r('legal-terms', '/legal/terms/', 'legal'),
  r('legal-cookies', '/legal/cookies/', 'legal'),
  r('legal-acceptable-use', '/legal/acceptable-use/', 'legal'),
  r('legal-dpa', '/legal/data-processing/', 'legal'),
] as const satisfies readonly RouteDef[];

export type RouteId = (typeof ROUTES)[number]['id'];

export function routeById(id: string): RouteDef | undefined {
  return ROUTES.find((route) => route.id === id);
}
