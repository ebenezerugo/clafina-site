import { ROUTES, type RouteDef, type RouteId } from '../../config/routes';
import { SITE, fact } from '../../config/site';
import { isOn, type SwitchKey } from '../../config/switches';
import { buildMode, type BuildMode } from '../../lib/build-mode';

export type FooterColumnId = 'product' | 'industries' | 'solutions' | 'resources' | 'partners' | 'developers' | 'company' | 'trust' | 'legal';

const byGroup = (group: RouteDef['group']) => ROUTES.filter((r) => r.group === group).map((r) => r.id);

const COLUMNS: { id: FooterColumnId; items: RouteId[] }[] = [
  { id: 'product', items: ['platform', ...byGroup('product'), 'pricing', 'pricing-compare', 'download'] },
  { id: 'industries', items: byGroup('industry') },
  { id: 'solutions', items: byGroup('solution') },
  { id: 'resources', items: [...byGroup('resource'), ...byGroup('why')] },
  { id: 'partners', items: byGroup('partner') },
  { id: 'developers', items: byGroup('developer') },
  { id: 'company', items: ['about', 'careers', 'press', 'contact', 'contact-sales', 'demo'] },
  { id: 'trust', items: byGroup('trust') },
  { id: 'legal', items: byGroup('legal') },
];

export interface FooterModel {
  top: { newsletter: boolean; appBadges: { appStore?: string; googlePlay?: string } };
  columns: { id: FooterColumnId; items: string[] }[];
  bottom: { socials: { name: string; url: string }[]; legalName?: string; address?: string; year: number };
}

/** What the footer shows: only pages that exist, and only facts that are set. */
export function footerModelFor(routes: readonly RouteDef[], mode: BuildMode): FooterModel {
  const available = (id: string) => {
    const r = routes.find((x) => x.id === id);
    return !!r && r.built && isOn(`pages.${id}` as SwitchKey, mode);
  };
  const deepLinks = isOn('features.deepLinks', mode);
  const appStore = deepLinks ? fact(SITE.stores.appStore) : undefined;
  const googlePlay = deepLinks ? fact(SITE.stores.googlePlay) : undefined;
  return {
    // The newsletter form arrives in phase 2; until then the slot stays closed.
    top: { newsletter: false, appBadges: { ...(appStore && { appStore }), ...(googlePlay && { googlePlay }) } },
    columns: COLUMNS.map((c) => ({ id: c.id, items: c.items.filter(available) })).filter((c) => c.items.length),
    bottom: {
      socials: Object.entries(SITE.socials).flatMap(([name, f]) => { const url = fact(f); return url ? [{ name, url }] : []; }),
      legalName: fact(SITE.legalName),
      address: fact(SITE.address),
      year: new Date().getFullYear(),
    },
  };
}

export function footerModel(mode: BuildMode = buildMode()): FooterModel {
  return footerModelFor(ROUTES, mode);
}
