import { ALL_FEATURES, PLANS, type Plan, type PlanId } from '../config/plans';
import { SWITCHES, isOn } from '../config/switches';
import type { PricingContent } from '../content/pricing';

/** Whether plans may be shown: preview always, production only once pricing.plans is on. */
export function plansVisible(): boolean {
  return isOn('pricing.plans');
}

/** Whether prices are confirmed, so they may go into structured data for search engines. */
export function pricesConfirmed(): boolean {
  const s = SWITCHES.pricing.plans;
  return s.on && !s.sample && !!s.confirmedBy && !!s.confirmedAt;
}

export function limitLines(plan: Plan, c: PricingContent, number: (n: number) => string): string[] {
  const one = (label: string, v: number | null) => `${label}: ${v === null ? c.limits.unlimited : number(v)}`;
  return [one(c.limits.users, plan.limits.users), one(c.limits.locations, plan.limits.locations), one(c.limits.tills, plan.limits.tills)];
}

export function featureLines(plan: Plan, c: PricingContent): string[] {
  return ALL_FEATURES.filter((f) => plan.features.includes(f)).map((f) => c.features[f] ?? f);
}

export { PLANS, ALL_FEATURES, type PlanId };
