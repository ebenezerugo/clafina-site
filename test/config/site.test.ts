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

describe('app links per environment', () => {
  it('take the addresses set for the environment, and stay placeholders otherwise', async () => {
    const { vi } = await import('vitest');
    vi.resetModules();
    vi.stubEnv('CLAFINA_APP_URL', 'https://app.staging.example/');
    vi.stubEnv('CLAFINA_SIGNUP_URL', 'https://app.staging.example/signup');
    const withEnv = await import('../../src/config/site');
    expect(withEnv.fact(withEnv.SITE.appUrl)).toBe('https://app.staging.example/');
    expect(withEnv.fact(withEnv.SITE.signupUrl)).toBe('https://app.staging.example/signup');
    vi.unstubAllEnvs();
    vi.resetModules();
    const without = await import('../../src/config/site');
    expect(without.fact(without.SITE.appUrl)).toBeUndefined();
  });

  it('accept addresses written without https:// and fail clearly on nonsense', async () => {
    const { vi } = await import('vitest');
    vi.resetModules();
    vi.stubEnv('CLAFINA_APP_URL', 'staging.app.example.com');
    vi.stubEnv('CLAFINA_SIGNUP_URL', 'staging.app.example.com/signup');
    const bare = await import('../../src/config/site');
    expect(bare.fact(bare.SITE.appUrl)).toBe('https://staging.app.example.com/');
    expect(bare.fact(bare.SITE.signupUrl)).toBe('https://staging.app.example.com/signup');
    vi.stubEnv('CLAFINA_APP_URL', 'https://app.example.com/web');
    vi.resetModules();
    const sub = await import('../../src/config/site');
    expect(sub.fact(sub.SITE.appUrl)).toBe('https://app.example.com/web/');
    vi.stubEnv('CLAFINA_APP_URL', 'not a url');
    vi.resetModules();
    await expect(import('../../src/config/site')).rejects.toThrow(/CLAFINA_APP_URL must be a web address/);
    vi.unstubAllEnvs();
    vi.resetModules();
  });
});
