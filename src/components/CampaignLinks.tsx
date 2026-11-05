'use client';

import { useEffect } from 'react';
import { CAMPAIGN_STORAGE_KEY, campaignFrom, withCampaign, type Campaign } from '@/lib/campaign';

function remembered(): Campaign {
  try {
    return JSON.parse(sessionStorage.getItem(CAMPAIGN_STORAGE_KEY) ?? '{}') as Campaign;
  } catch {
    return {};
  }
}

/**
 * Keeps the campaign tags a visitor arrived with (utm_*, ref) for the visit, and adds them to every
 * sign-up link (marked data-signup), so the app knows where the sign-up came from.
 */
export function CampaignLinks() {
  useEffect(() => {
    const landed = campaignFrom(window.location.search);
    const campaign = Object.keys(landed).length ? landed : remembered();
    if (Object.keys(landed).length) {
      try { sessionStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(landed)); } catch { /* storage blocked: use it on this page only */ }
    }
    if (!Object.keys(campaign).length) return;
    document.querySelectorAll<HTMLAnchorElement>('a[data-signup]').forEach((a) => {
      a.href = withCampaign(a.getAttribute('href') ?? a.href, campaign);
    });
  }, []);
  return null;
}
