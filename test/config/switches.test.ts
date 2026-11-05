import { afterEach, describe, expect, it } from 'vitest';
import { SWITCHES, isOn, mentionable, localeEnabled, localeIndexed, pageAvailable, productionProblems, type SwitchKey } from '@/config/switches';
import { buildMode } from '@/lib/build-mode';

afterEach(() => { delete process.env.CLAFINA_BUILD; });

describe('switches', () => {
  it('turns every switch on in preview', () => {
    expect(isOn('claims.uptime', 'preview')).toBe(true);
    expect(isOn('features.deepLinks', 'preview')).toBe(true);
  });
  it('reads the stored value in production', () => {
    expect(isOn('features.deepLinks', 'production')).toBe(false);
    expect(isOn('prelaunch.features', 'production')).toBe(true);
  });
  it('fails loudly on a misspelt switch', () => {
    expect(() => isOn('claims.uptme' as SwitchKey)).toThrow('Unknown switch: claims.uptme');
    expect(() => isOn('sections.nothing' as SwitchKey)).toThrow('Unknown switch: sections.nothing');
  });
  it('only shows pages that are built and switched on', () => {
    expect(pageAvailable('solution-owners', 'preview')).toBe(false);
    expect(pageAvailable('home', 'production')).toBe(true);
    expect(() => pageAvailable('nope', 'preview')).toThrow('Unknown page: nope');
  });
  it('hides a pre-launch page with its pre-launch switch', () => {
    expect(pageAvailable('product-email', 'production')).toBe(true);
    SWITCHES.prelaunch['product-email'].on = false;
    try {
      expect(pageAvailable('product-email', 'production')).toBe(false);
      expect(pageAvailable('product-email', 'preview')).toBe(true);
      expect(mentionable('product-email', 'production')).toBe(false);
      expect(mentionable('industry-farm', 'production')).toBe(true);
    } finally {
      SWITCHES.prelaunch['product-email'].on = true;
    }
    SWITCHES.prelaunch.features.on = false;
    try { expect(pageAvailable('product-email', 'production')).toBe(false); } finally { SWITCHES.prelaunch.features.on = true; }
  });
  it('indexes only reviewed languages that are on', () => {
    expect(localeEnabled('yo')).toBe(true);
    expect(localeIndexed('yo')).toBe(false);
    expect(localeIndexed('en')).toBe(true);
  });
  it('lists what blocks a production build', () => {
    const problems = productionProblems();
    expect(problems).toContain('claims.uptime is on with a sample value');
    expect(problems).toContain('claims.uptime is on without confirmedBy and confirmedAt');
    expect(problems).toContain('prelaunch.features is on without confirmedBy and confirmedAt');
    expect(problems.some((p) => p.startsWith('features.'))).toBe(false);
  });
});

describe('buildMode', () => {
  it('defaults to preview', () => { expect(buildMode()).toBe('preview'); });
  it('reads production', () => { process.env.CLAFINA_BUILD = 'production'; expect(buildMode()).toBe('production'); });
  it('refuses anything else', () => { process.env.CLAFINA_BUILD = 'staging'; expect(() => buildMode()).toThrow('CLAFINA_BUILD must be preview or production, got staging'); });
});
