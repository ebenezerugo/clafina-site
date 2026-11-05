import { describe, expect, it } from 'vitest';
import { alternates, organizationJsonLd, robotsFor, sitemapXml } from '@/lib/seo';

describe('seo', () => {
  it('points the canonical at the page in its own language', () => {
    expect(alternates('fr', '/pricing/').canonical).toBe('https://clafina.com/fr/pricing/');
  });
  it('lists every enabled language and an English default', () => {
    const langs = alternates('en', '/').languages;
    expect(langs['x-default']).toBe('https://clafina.com/en/');
    expect(langs['zh-Hans']).toBe('https://clafina.com/zh/');
    expect(Object.keys(langs)).toHaveLength(21);
  });
  it('keeps draft languages out of search', () => {
    expect(robotsFor('yo')).toEqual({ index: false, follow: true });
    expect(robotsFor('en')).toEqual({ index: true, follow: true });
  });
  it('leaves out organisation data until the company facts are set', () => {
    expect(organizationJsonLd()).toBeNull();
  });
  it('writes a sitemap of the given pages with their language links', () => {
    const xml = sitemapXml('en', ['/'], ['en']);
    expect(xml).toContain('<loc>https://clafina.com/en/</loc>');
    expect(xml).toContain('hreflang="x-default" href="https://clafina.com/en/"');
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });
});
