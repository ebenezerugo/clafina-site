import type { Locale } from '../config/locales';

/** Self-hosted Noto faces for scripts the brand face does not cover. Each loads only on its own language. */
export const SCRIPT_FONTS: Partial<Record<Locale, { pkg: string; family: string; file: string }>> = {
  ar: { pkg: 'noto-sans-arabic', family: 'Noto Sans Arabic', file: 'arabic' },
  hi: { pkg: 'noto-sans-devanagari', family: 'Noto Sans Devanagari', file: 'devanagari' },
  am: { pkg: 'noto-sans-ethiopic', family: 'Noto Sans Ethiopic', file: 'ethiopic' },
  zh: { pkg: 'noto-sans-sc', family: 'Noto Sans SC', file: 'chinese' },
  ja: { pkg: 'noto-sans-jp', family: 'Noto Sans JP', file: 'japanese' },
};

export const SCRIPT_FONT_WEIGHTS = [400, 600, 700] as const;

export function scriptFontFor(locale: Locale): { href: string; family: string } | null {
  const font = SCRIPT_FONTS[locale];
  return font ? { href: `/fonts/${font.file}.css`, family: font.family } : null;
}
