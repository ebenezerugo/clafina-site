import { describe, expect, it } from 'vitest';
import { formatMoney } from '@/screens/kit/money';

describe('formatMoney', () => {
  it('formats naira without decimals in English', () => {
    expect(formatMoney(2486500, 'NGN', 'en')).toBe('₦2,486,500');
  });
  it('formats dollars with cents', () => {
    expect(formatMoney(18240, 'USD', 'en')).toBe('$18,240.00');
  });
  it('follows the page language', () => {
    expect(formatMoney(2486500, 'NGN', 'de')).toMatch(/^2\.486\.500\s?₦$/);
  });
  it('refuses a missing number', () => {
    expect(() => formatMoney(Number.NaN, 'NGN', 'en')).toThrow('formatMoney needs a finite amount');
  });
});
