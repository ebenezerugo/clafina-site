import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import type { Locale } from '@/config/locales';

// Placeholder brand face. Inter covers every Latin and Cyrillic letter the 20 languages need
// (Yoruba and Igbo dotted letters, Hausa hooked letters, Turkish, Russian, ₦ and ₵).
// Arabic, Devanagari, Ethiopic, Chinese and Japanese use self-hosted Noto faces (src/theme/script-fonts.ts),
// linked only on their own language so other pages never download them.
const inter = Inter({ subsets: ['latin', 'latin-ext', 'cyrillic'], variable: '--font-inter', display: 'swap' });

// The till and shop screens on the home page: crisper numbers, a product's own voice. Not preloaded: the
// showcase sits below the fold and is only drawn near the screen, so the top of the page never waits for it.
const till = Plus_Jakarta_Sans({ subsets: ['latin', 'latin-ext'], variable: '--font-till', display: 'swap', preload: false });

export function fontClassFor(_locale: Locale): string {
  return `${inter.variable} ${till.variable}`;
}
