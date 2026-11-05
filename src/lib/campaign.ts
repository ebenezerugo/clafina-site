export const CAMPAIGN_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref'] as const;
export type Campaign = Partial<Record<(typeof CAMPAIGN_KEYS)[number], string>>;

/** Campaign tags from a query string: known keys only, trimmed, at most 100 characters each. */
export function campaignFrom(search: string): Campaign {
  const params = new URLSearchParams(search);
  const out: Campaign = {};
  for (const key of CAMPAIGN_KEYS) {
    const value = params.get(key)?.trim().slice(0, 100);
    if (value) out[key] = value;
  }
  return out;
}

/** A sign-up link with the visitor's campaign tags added after its own parameters. */
export function withCampaign(href: string, campaign: Campaign): string {
  const url = new URL(href);
  for (const key of CAMPAIGN_KEYS) {
    const value = campaign[key];
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

export const CAMPAIGN_STORAGE_KEY = 'clafina.campaign';
