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
  it('has every page of the site map built', () => {
    expect(ROUTES.filter((r) => !r.built).map((r) => r.id)).toEqual([]);
    expect(ROUTES.filter((r) => r.group === 'product')).toHaveLength(22);
  });
  it('writes paths with leading and trailing slashes', () => {
    expect(ROUTES.every((r) => r.path.startsWith('/') && r.path.endsWith('/'))).toBe(true);
  });
});
