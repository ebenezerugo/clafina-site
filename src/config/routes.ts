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
  r('start', '/start/', 'core', true),
  r('download', '/download/', 'core', true),
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
  r('industry-restaurant', '/industries/restaurant/', 'industry', true),
  r('industry-accommodation', '/industries/accommodation/', 'industry', true),
  r('industry-events', '/industries/events/', 'industry', true),
  r('industry-memberships', '/industries/memberships/', 'industry', true),
  r('industry-classes', '/industries/classes/', 'industry', true),
  r('industry-courses', '/industries/courses/', 'industry', true),
  r('industry-client-records', '/industries/clinics-and-salons/', 'industry', true),
  r('industry-property', '/industries/property/', 'industry', true),
  r('industry-construction', '/industries/construction/', 'industry', true),
  r('industry-field-service', '/industries/field-service/', 'industry', true),
  r('industry-rentals', '/industries/rentals/', 'industry', true),
  r('industry-distribution', '/industries/distribution/', 'industry', true),
  r('industry-farm', '/industries/farm/', 'industry', true),
  r('industry-manufacturing', '/industries/manufacturing/', 'industry', true),
  r('industry-fundraising', '/industries/fundraising/', 'industry', true),
  r('industry-configurator', '/industries/product-configurator/', 'industry', true),

  r('solution-small-business', '/solutions/small-business/', 'solution', true),
  r('solution-growing', '/solutions/growing-business/', 'solution', true),
  r('solution-enterprise', '/solutions/enterprise/', 'solution', true),
  r('solution-multi-branch', '/solutions/multi-branch/', 'solution', true),
  r('solution-owners', '/solutions/owners/', 'solution', true),
  r('solution-finance-teams', '/solutions/finance-teams/', 'solution', true),
  r('solution-operations', '/solutions/operations/', 'solution', true),
  r('solution-sales-teams', '/solutions/sales-teams/', 'solution', true),
  r('solution-hr', '/solutions/hr-and-people/', 'solution', true),

  r('why-one-record', '/why/one-record/', 'why', true),
  r('why-switching', '/why/switching/', 'why', true),
  r('why-offline', '/why/offline/', 'why', true),
  r('why-languages', '/why/languages-and-currencies/', 'why', true),

  r('story-quo-0221', '/stories/journey-of-a-quote/', 'resource', true),
  r('resources-guides', '/resources/guides/', 'resource', true),
  r('resources-templates', '/resources/templates/', 'resource', true),
  r('resources-glossary', '/resources/glossary/', 'resource', true),
  r('help', '/help/', 'resource', true),
  r('whats-new', '/whats-new/', 'resource', true),

  r('partners-accountants', '/partners/accountants/', 'partner', true),
  r('partners-implementation', '/partners/implementation/', 'partner', true),
  r('partners-apply', '/partners/apply/', 'partner', true),

  r('developers', '/developers/', 'developer', true),
  r('developers-webhooks', '/developers/webhooks/', 'developer', true),
  r('developers-signup', '/developers/sign-up/', 'developer', true),

  r('trust-security', '/trust/security/', 'trust', true),
  r('trust-privacy', '/trust/privacy/', 'trust', true),
  r('trust-reliability', '/trust/reliability/', 'trust', true),
  r('trust-accessibility', '/trust/accessibility/', 'trust', true),

  r('about', '/about/', 'company', true),
  r('careers', '/careers/', 'company', true),
  r('press', '/press/', 'company', true),
  r('contact', '/contact/', 'company', true),

  r('legal-privacy', '/legal/privacy/', 'legal', true),
  r('legal-terms', '/legal/terms/', 'legal', true),
  r('legal-cookies', '/legal/cookies/', 'legal', true),
  r('legal-acceptable-use', '/legal/acceptable-use/', 'legal', true),
  r('legal-dpa', '/legal/data-processing/', 'legal', true),
] as const satisfies readonly RouteDef[];

export type RouteId = (typeof ROUTES)[number]['id'];

export function routeById(id: string): RouteDef | undefined {
  return ROUTES.find((route) => route.id === id);
}
