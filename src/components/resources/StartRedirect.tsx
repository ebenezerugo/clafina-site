'use client';

import { useEffect } from 'react';
import type { Locale } from '@/config/locales';
import { campaignFrom } from '@/lib/campaign';
import { signupUrl } from '@/lib/links';

const PLANS = ['free', 'growth', 'business', 'enterprise'];

/** /start/?plan=growth&pack=restaurant&utm_source=… goes straight on to sign-up with what it was given, nothing else. */
export function StartRedirect({ locale, packs }: { locale: Locale; packs: string[] }) {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const plan = q.get('plan') ?? undefined;
    const pack = q.get('pack') ?? undefined;
    window.location.replace(signupUrl({ locale, plan: plan && PLANS.includes(plan) ? plan : undefined, pack: pack && packs.includes(pack) ? pack : undefined, campaign: campaignFrom(window.location.search) }));
  }, [locale, packs]);
  return null;
}
