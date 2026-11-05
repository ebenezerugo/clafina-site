import { describe, expect, it } from 'vitest';
import { PLANS, planPrice } from '@/config/plans';
import { productionProblems, isOn } from '@/config/switches';

describe('plans', () => {
  it('lists the four proposed tiers in order', () => {
    expect(PLANS.map((p) => p.id)).toEqual(['free', 'growth', 'business', 'enterprise']);
  });
  it('prices Growth and Business in dollars for the global edition', () => {
    expect(planPrice('growth', 'global')).toEqual({ amount: 29, currency: 'USD' });
    expect(planPrice('business', 'latam')).toEqual({ amount: 99, currency: 'USD' });
    expect(planPrice('free', 'global')).toEqual({ amount: 0, currency: 'USD' });
  });
  it('prices the Nigeria edition in naira', () => {
    expect(planPrice('growth', 'ng').currency).toBe('NGN');
  });
  it('sends Enterprise to sales', () => {
    expect(planPrice('enterprise', 'ng').amount).toBeNull();
  });
  it('keeps the prices out of production until confirmed', () => {
    expect(isOn('pricing.plans', 'preview')).toBe(true);
    expect(productionProblems()).toContain('pricing.plans is on with a sample value');
    expect(productionProblems()).toContain('pricing.plans is on without confirmedBy and confirmedAt');
  });
});
