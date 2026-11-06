import { describe, expect, it } from 'vitest';
import { footerModel, footerModelFor } from '@/components/footer/footer-model';
import { ROUTES } from '@/config/routes';

const allBuilt = ROUTES.map((r) => ({ ...r, built: true }));

describe('footer model', () => {
  it('has nine columns in order once every page exists', () => {
    expect(footerModelFor(allBuilt, 'preview').columns.map((c) => c.id)).toEqual(['product', 'industries', 'solutions', 'resources', 'partners', 'developers', 'company', 'trust', 'legal']);
  });
  it('lists every product and industry page', () => {
    const cols = footerModelFor(allBuilt, 'preview').columns;
    expect(cols.find((c) => c.id === 'product')!.items.filter((i) => i.startsWith('product-'))).toHaveLength(22);
    expect(cols.find((c) => c.id === 'industries')!.items).toHaveLength(18);
  });
  it('links every page except home somewhere', () => {
    const linked = new Set(footerModelFor(allBuilt, 'preview').columns.flatMap((c) => c.items));
    expect(ROUTES.filter((r) => r.id !== 'home' && r.id !== 'start' && !('previewOnly' in r) && !linked.has(r.id)).map((r) => r.id)).toEqual([]);
  });
  it('drops pages that do not exist yet, and empty columns', () => {
    // A site with only the core, product and company pages built: the other columns go.
    const some = ROUTES.map((r) => ({ ...r, built: ['core', 'product'].includes(r.group) || ['contact', 'about'].includes(r.id) }));
    const cols = footerModelFor(some, 'preview').columns;
    expect(cols.map((c) => c.id)).toEqual(['product', 'company']);
    expect(cols[1]!.items).toEqual(['about', 'contact', 'contact-sales', 'demo'].filter((id) => cols[1]!.items.includes(id)));
    expect(cols[1]!.items).not.toContain('careers');
  });
  it('shows every column once every page is built', () => {
    expect(footerModel('preview').columns.map((c) => c.id)).toEqual(['product', 'industries', 'solutions', 'resources', 'partners', 'developers', 'company', 'trust', 'legal']);
  });
  it('shows socials, badges and company lines only once they are set', () => {
    const m = footerModel('preview');
    expect(m.bottom.socials).toEqual([]);
    expect(m.top.appBadges).toEqual({});
    expect(m.bottom.legalName).toBeUndefined();
    expect(m.top.newsletter).toBe(false);
  });
});
