import { describe, expect, it } from 'vitest';
import { loadMessages, missingKeys } from '@/i18n/messages';

describe('messages', () => {
  it('falls back to English for a key a language does not have yet', async () => {
    const en = await loadMessages('en');
    const yo = await loadMessages('yo');
    expect(yo.nav.product).toBe(en.nav.product);
  });
  it('lists the keys a language is missing', () => {
    expect(missingKeys('yo')).toContain('nav.product');
    expect(missingKeys('en')).toEqual([]);
  });
});
