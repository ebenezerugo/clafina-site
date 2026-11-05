import { ROUTES, type RouteDef, type RouteId } from './routes';
import { isOn, type SwitchKey } from './switches';
import { buildMode, type BuildMode } from '../lib/build-mode';

export interface NavGroup { id: string; items: RouteId[] }
export interface NavMenu { id: 'product' | 'industries' | 'solutions' | 'resources'; groups: NavGroup[] }

/** The header's menus. Labels come from messages: nav.<menu>, nav.groups.<group>, routes.<id>. */
export const NAV: { menus: NavMenu[]; links: RouteId[] } = {
  menus: [
    {
      id: 'product',
      groups: [
        { id: 'money', items: ['product-finance', 'product-payments', 'product-tax', 'product-business-health'] },
        { id: 'selling', items: ['product-sales', 'product-crm', 'product-pos', 'product-online-shop', 'product-trading-network'] },
        { id: 'operations', items: ['product-stock', 'product-purchasing', 'product-manufacturing', 'product-bookings', 'product-projects', 'product-assets'] },
        { id: 'people', items: ['product-hr', 'product-communication'] },
        { id: 'everywhere', items: ['product-mobile', 'product-assistant', 'product-capture', 'product-integrations'] },
      ],
    },
    {
      id: 'industries',
      groups: [{ id: 'stories', items: ROUTES.filter((r) => r.group === 'industry').map((r) => r.id) }],
    },
    {
      id: 'solutions',
      groups: [
        { id: 'bySize', items: ['solution-small-business', 'solution-growing', 'solution-enterprise', 'solution-multi-branch'] },
        { id: 'byRole', items: ['solution-owners', 'solution-finance-teams', 'solution-operations', 'solution-sales-teams', 'solution-hr'] },
      ],
    },
    {
      id: 'resources',
      groups: [
        { id: 'learn', items: ['resources-guides', 'resources-templates', 'resources-glossary', 'help', 'whats-new'] },
        { id: 'why', items: ['why-one-record', 'why-switching', 'why-offline', 'why-languages'] },
      ],
    },
  ],
  links: ['pricing'],
};

export function navItemIds(menu: NavMenu): RouteId[] {
  return menu.groups.flatMap((g) => g.items);
}

/** The navigation with unavailable pages removed, and empty groups and menus dropped. */
export function visibleNavFor(routes: readonly RouteDef[], mode: BuildMode): { menus: NavMenu[]; links: RouteId[] } {
  const available = (id: string) => {
    const route = routes.find((r) => r.id === id);
    return !!route && route.built && isOn(`pages.${id}` as SwitchKey, mode);
  };
  const menus = NAV.menus
    .map((m) => ({ ...m, groups: m.groups.map((g) => ({ ...g, items: g.items.filter(available) })).filter((g) => g.items.length) }))
    .filter((m) => m.groups.length);
  return { menus, links: NAV.links.filter(available) };
}

export function visibleNav(mode: BuildMode = buildMode()) {
  return visibleNavFor(ROUTES, mode);
}
