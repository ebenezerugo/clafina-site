import { describe, expect, it } from 'vitest';
import { SITE, fact, settingsProblems } from '@/config/site';

describe('site settings', () => {
  it('reads a set fact and leaves a placeholder empty', () => {
    expect(fact({ value: 'x' })).toBe('x');
    expect(fact({ placeholder: 'y' })).toBeUndefined();
  });
  it('lists the facts production always needs', () => {
    const problems = settingsProblems();
    expect(problems).toContain('SITE.legalName is a placeholder');
    expect(problems).toContain('SITE.emails.support is a placeholder');
    expect(problems).toContain('SITE.signupUrl is a placeholder');
  });
  it('only asks for store and app IDs when deep links are on', () => {
    expect(settingsProblems().some((p) => p.startsWith('SITE.stores') || p.startsWith('SITE.ios') || p.startsWith('SITE.android'))).toBe(false);
  });
  it('only asks for the CRM and Turnstile when a form is on', () => {
    expect(settingsProblems().some((p) => p.startsWith('SITE.crmEndpoint') || p.startsWith('SITE.turnstileSiteKey'))).toBe(false);
  });
  it('starts every fact as a placeholder with a hint', () => {
    expect('placeholder' in SITE.legalName && SITE.legalName.placeholder.length).toBeGreaterThan(5);
  });
});
