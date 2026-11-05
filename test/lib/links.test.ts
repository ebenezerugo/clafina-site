import { describe, expect, it } from 'vitest';
import { campaignFrom } from '@/lib/campaign';
import { appUrl, openInAppUrl, signupUrl } from '@/lib/links';

describe('signupUrl', () => {
  it('carries pack, plan, language, country and campaign in a fixed order, encoded', () => {
    expect(signupUrl({ locale: 'yo', pack: 'restaurant', plan: 'growth', country: 'ng', campaign: { utm_source: 'x y', utm_campaign: 'a&b"c' } }))
      .toBe('https://app.clafina.com/signup?pack=restaurant&plan=growth&lang=yo&country=ng&utm_source=x+y&utm_campaign=a%26b%22c');
  });
  it('needs only the language', () => {
    expect(signupUrl({ locale: 'en' })).toBe('https://app.clafina.com/signup?lang=en');
  });
});

describe('campaignFrom', () => {
  it('keeps only campaign keys', () => {
    expect(campaignFrom('?utm_source=g&foo=bar&ref=abc')).toEqual({ utm_source: 'g', ref: 'abc' });
  });
  it('caps long values at 100 characters and trims', () => {
    expect(campaignFrom('?utm_source=' + 'a'.repeat(300)).utm_source).toHaveLength(100);
    expect(campaignFrom('?utm_medium=%20email%20').utm_medium).toBe('email');
  });
  it('drops empty values', () => {
    expect(campaignFrom('?utm_source=')).toEqual({});
  });
});

describe('app links', () => {
  it('builds app and open-in-app addresses', () => {
    expect(appUrl('/restaurant/floor')).toBe('https://app.clafina.com/restaurant/floor');
    expect(openInAppUrl('/restaurant/floor')).toBe('https://clafina.com/open/restaurant/floor');
  });
});

describe('withCampaign', () => {
  it('adds campaign tags to a sign-up link, encoded, keeping its own parameters', async () => {
    const { withCampaign } = await import('@/lib/campaign');
    expect(withCampaign('https://app.clafina.com/signup?lang=fr', { utm_source: 'x y', utm_campaign: 'a&b"c' }))
      .toBe('https://app.clafina.com/signup?lang=fr&utm_source=x+y&utm_campaign=a%26b%22c');
  });
  it('leaves a link alone when there is no campaign', async () => {
    const { withCampaign } = await import('@/lib/campaign');
    expect(withCampaign('https://app.clafina.com/signup?lang=fr', {})).toBe('https://app.clafina.com/signup?lang=fr');
  });
});
