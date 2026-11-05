import { describe, expect, it } from 'vitest';
import { LOCALE_CODES, type Locale } from '@/config/locales';
import { pickLocale } from '@/lib/negotiate';

const all: Locale[] = [...LOCALE_CODES];

describe('pickLocale', () => {
  it('matches a region tag to its language', () => {
    expect(pickLocale('yo-NG,yo;q=0.9,en;q=0.5', all)).toBe('yo');
    expect(pickLocale('pt-BR', all)).toBe('pt');
  });
  it('sends any Chinese variant to Simplified Chinese', () => {
    expect(pickLocale('zh-CN,zh;q=0.9', all)).toBe('zh');
    expect(pickLocale('zh-Hans-SG', all)).toBe('zh');
  });
  it('follows the weights, not the order', () => {
    expect(pickLocale('fr;q=0.2,de;q=0.8', all)).toBe('de');
  });
  it('falls back to English', () => {
    expect(pickLocale('', all)).toBe('en');
    expect(pickLocale(null, all)).toBe('en');
    expect(pickLocale('*', all)).toBe('en');
    expect(pickLocale('xx-YY', all)).toBe('en');
  });
  it('skips a language that is switched off', () => {
    expect(pickLocale('yo,fr', all.filter((c) => c !== 'yo'))).toBe('fr');
  });
  it('gives Akan speakers Twi', () => {
    expect(pickLocale('ak', all)).toBe('tw');
  });
  it('ignores a weight of zero', () => {
    expect(pickLocale('yo;q=0,fr', all)).toBe('fr');
  });
});
