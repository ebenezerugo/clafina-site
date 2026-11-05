import { describe, expect, it } from 'vitest';
import { ROUTES } from '@/config/routes';

describe('routes', () => {
  it('has the 22 product pages', () => {
    expect(ROUTES.filter((r) => r.group === 'product')).toHaveLength(22);
  });
  it('has the industries index and 17 stories', () => {
    expect(ROUTES.filter((r) => r.group === 'industry')).toHaveLength(18);
  });
  it('gives every page its own path and id', () => {
    expect(new Set(ROUTES.map((r) => r.path)).size).toBe(ROUTES.length);
    expect(new Set(ROUTES.map((r) => r.id)).size).toBe(ROUTES.length);
  });
  it('lists the pages built so far', () => {
    const built = ROUTES.filter((r) => r.built && !('previewOnly' in r)).map((r) => r.id);
    expect(built.filter((id) => !id.startsWith('product-'))).toEqual(['home', 'platform', 'pricing', 'pricing-compare', 'demo', 'contact-sales', ...ROUTES.filter((r) => r.group === 'industry').map((r) => r.id)]);
    expect(built.filter((id) => id.startsWith('product-'))).toHaveLength(22);
  });
  it('writes paths with leading and trailing slashes', () => {
    expect(ROUTES.every((r) => r.path.startsWith('/') && r.path.endsWith('/'))).toBe(true);
  });
});
