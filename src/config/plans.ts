/**
 * Clafina's own plans. The tiers and the dollar prices are the PRD's proposal (13 Oct), not final;
 * the Nigeria prices and every limit are samples for the layout. All of it sits behind pricing.plans,
 * which production refuses until the owner confirms it. Moves into the CMS later.
 */
export type PlanId = 'free' | 'growth' | 'business' | 'enterprise';
export type Edition = 'global' | 'ng' | 'latam';
export type PlanCurrency = 'USD' | 'NGN';
export type PlanFeature = 'books' | 'sales' | 'stock' | 'till' | 'shop' | 'payroll' | 'packs' | 'approvals' | 'api' | 'sso' | 'audit' | 'priority-support' | 'onboarding';

export interface Plan {
  id: PlanId;
  price: Record<Edition, { amount: number | null; currency: PlanCurrency }>;
  limits: { users: number | null; locations: number | null; tills: number | null };
  features: PlanFeature[];
  highlighted?: boolean;
}

const usd = (amount: number | null) => ({ amount, currency: 'USD' as const });
const ngn = (amount: number | null) => ({ amount, currency: 'NGN' as const });

export const PLANS: Plan[] = [
  { id: 'free', price: { global: usd(0), ng: ngn(0), latam: usd(0) }, limits: { users: 2, locations: 1, tills: 1 }, features: ['books', 'sales', 'stock', 'till'] },
  { id: 'growth', price: { global: usd(29), ng: ngn(25000), latam: usd(29) }, limits: { users: 10, locations: 3, tills: 3 }, features: ['books', 'sales', 'stock', 'till', 'shop', 'payroll', 'packs'], highlighted: true },
  { id: 'business', price: { global: usd(99), ng: ngn(75000), latam: usd(99) }, limits: { users: 50, locations: 10, tills: null }, features: ['books', 'sales', 'stock', 'till', 'shop', 'payroll', 'packs', 'approvals', 'api', 'audit'] },
  { id: 'enterprise', price: { global: usd(null), ng: ngn(null), latam: usd(null) }, limits: { users: null, locations: null, tills: null }, features: ['books', 'sales', 'stock', 'till', 'shop', 'payroll', 'packs', 'approvals', 'api', 'audit', 'sso', 'priority-support', 'onboarding'] },
];

export const ALL_FEATURES: PlanFeature[] = ['books', 'sales', 'stock', 'till', 'shop', 'payroll', 'packs', 'approvals', 'api', 'audit', 'sso', 'priority-support', 'onboarding'];

export function planPrice(id: PlanId, edition: Edition): { amount: number | null; currency: PlanCurrency } {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan.price[edition];
}
