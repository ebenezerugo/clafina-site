import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, LOCALES, isLocale, localeInfo } from '@/config/locales';

describe('locales', () => {
  it('lists the 20 launch languages in order', () => {
    expect(LOCALES.map((l) => l.code)).toEqual(['en','es','pt','fr','ha','yo','ig','pcm','sw','ar','zh','hi','de','id','tr','ja','ru','am','zu','tw']);
    expect(DEFAULT_LOCALE).toBe('en');
  });
  it('makes Arabic the only right-to-left language', () => {
    expect(LOCALES.filter((l) => l.dir === 'rtl').map((l) => l.code)).toEqual(['ar']);
  });
  it('tags Simplified Chinese for search engines', () => {
    expect(localeInfo('zh').hreflang).toBe('zh-Hans');
    expect(localeInfo('pcm').hreflang).toBe('pcm');
  });
  it('treats English as reviewed and every other language as a draft', () => {
    expect(localeInfo('en').status).toBe('reviewed');
    expect(LOCALES.filter((l) => l.code !== 'en').every((l) => l.status === 'draft')).toBe(true);
  });
  it('recognises locale codes', () => {
    expect(isLocale('yo')).toBe(true);
    expect(isLocale('xx')).toBe(false);
  });
  it('records each script', () => {
    expect(localeInfo('am').script).toBe('ethiopic');
    expect(localeInfo('ru').script).toBe('cyrillic');
    expect(localeInfo('hi').script).toBe('devanagari');
  });
});
