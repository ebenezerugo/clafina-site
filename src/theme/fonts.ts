import { Inter } from 'next/font/google';
import type { Locale } from '@/config/locales';

// Placeholder brand face. Inter covers every Latin and Cyrillic letter the 20 languages need
// (Yoruba and Igbo dotted letters, Hausa hooked letters, Turkish, Russian, ₦ and ₵).
// Arabic, Devanagari, Ethiopic, Chinese and Japanese use self-hosted Noto faces (src/theme/script-fonts.ts),
// linked only on their own language so other pages never download them.
const inter = Inter({ subsets: ['latin', 'latin-ext', 'cyrillic'], variable: '--font-inter', display: 'swap' });

export function fontClassFor(_locale: Locale): string {
  return inter.variable;
}
