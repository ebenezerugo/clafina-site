import { describe, expect, it } from 'vitest';
import { checkContent, translationGaps } from '../../scripts/check-content';

describe('checkContent', () => {
  const problems = checkContent('test/fixtures/content', 'preview');
  it('catches banned words', () => {
    expect(problems).toContain('en/bad.json hero.title uses banned word "seamless"');
  });
  it('catches exclamation marks', () => {
    expect(problems).toContain('en/bad.json hero.lede has an exclamation mark');
  });
  it('catches figures and compliance words outside a claim switch', () => {
    expect(problems).toContain('en/bad.json features[0].text says "99.9%" outside a claim');
    expect(problems.some((p) => p.includes('features[1]'))).toBe(false);
  });
  it('requires a labelled illustrative business on every story', () => {
    expect(problems).toContain('en/story.json has no labelled illustrative business');
  });
  it('catches the dropped taglines', () => {
    expect(checkContent('test/fixtures/content-taglines', 'preview')).toEqual(['en/home.json hero.title uses a dropped tagline']);
  });
  it('passes the real content', () => {
    expect(checkContent('content', 'preview')).toEqual([]);
  });
  it('lists keys a translation is missing', () => {
    expect(translationGaps('test/fixtures/content')).toContain('fr/bad.json is missing hero.lede');
    expect(translationGaps('test/fixtures/content')).toContain('fr/story.json is missing');
  });
});
