import { describe, expect, it } from 'vitest';
import { NAV, navItemIds, visibleNavFor } from '@/config/nav';
import { ROUTES } from '@/config/routes';

const allBuilt = ROUTES.map((r) => ({ ...r, built: true }));

describe('navigation', () => {
  it('puts all 22 product pages in the Product menu, in five groups', () => {
    const product = NAV.menus.find((m) => m.id === 'product')!;
    expect(navItemIds(product)).toHaveLength(22);
    expect(product.groups.map((g) => g.id)).toEqual(['money', 'selling', 'operations', 'people', 'everywhere']);
  });
  it('lists the menus in order', () => {
    expect(NAV.menus.map((m) => m.id)).toEqual(['product', 'industries', 'solutions', 'resources']);
    expect(NAV.links).toEqual(['pricing']);
  });
  it('only names real pages', () => {
    const ids = new Set(ROUTES.map((r) => r.id));
    expect(NAV.menus.flatMap(navItemIds).every((id) => ids.has(id as never))).toBe(true);
  });
  it('drops pages, groups and menus that are not available', () => {
    const some = ROUTES.map((r) => ({ ...r, built: r.group === 'product' || r.group === 'industry' || r.id === 'pricing' }));
    const visible = visibleNavFor(some, 'preview');
    expect(visible.menus.map((m) => m.id)).toEqual(['product', 'industries']);
    expect(visible.links).toEqual(['pricing']);
    const full = visibleNavFor(allBuilt, 'preview');
    expect(full.menus.map((m) => m.id)).toEqual(['product', 'industries', 'solutions', 'resources']);
    expect(full.links).toEqual(['pricing']);
  });
});
