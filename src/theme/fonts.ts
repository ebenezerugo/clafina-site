import { Inter, Noto_Sans_Arabic, Noto_Sans_Devanagari, Noto_Sans_Ethiopic, Noto_Sans_JP, Noto_Sans_SC } from 'next/font/google';
import type { Locale } from '@/config/locales';

// Placeholder brand face. Inter covers every Latin and Cyrillic letter the 20 languages need
// (Yoruba and Igbo dotted letters, Hausa hooked letters, Turkish, Russian, ₦ and ₵).
const inter = Inter({ subsets: ['latin', 'latin-ext', 'cyrillic'], variable: '--font-inter', display: 'swap' });

const arabic = Noto_Sans_Arabic({ subsets: ['arabic'], weight: ['400', '600', '700'], variable: '--font-script', display: 'swap', preload: false });
const devanagari = Noto_Sans_Devanagari({ subsets: ['devanagari'], weight: ['400', '600', '700'], variable: '--font-script', display: 'swap', preload: false });
const ethiopic = Noto_Sans_Ethiopic({ subsets: ['ethiopic'], weight: ['400', '600', '700'], variable: '--font-script', display: 'swap', preload: false });
const chinese = Noto_Sans_SC({ weight: ['400', '600', '700'], variable: '--font-script', display: 'swap', preload: false });
const japanese = Noto_Sans_JP({ weight: ['400', '600', '700'], variable: '--font-script', display: 'swap', preload: false });

const script: Partial<Record<Locale, { variable: string }>> = { ar: arabic, hi: devanagari, am: ethiopic, zh: chinese, ja: japanese };

/** Class names that load the brand face plus, for non-Latin scripts, the matching Noto face. */
export function fontClassFor(locale: Locale): string {
  const extra = script[locale];
  return extra ? `${inter.variable} ${extra.variable}` : inter.variable;
}
