export const LOCALE_CODES = ['en','es','pt','fr','ha','yo','ig','pcm','sw','ar','zh','hi','de','id','tr','ja','ru','am','zu','tw'] as const;
export type Locale = (typeof LOCALE_CODES)[number];

export type Script = 'latin' | 'cyrillic' | 'arabic' | 'han' | 'japanese' | 'devanagari' | 'ethiopic';

export interface LocaleInfo {
  code: Locale;
  endonym: string;
  englishName: string;
  hreflang: string;
  dir: 'ltr' | 'rtl';
  script: Script;
  status: 'draft' | 'reviewed';
  reviewer?: string;
  reviewedAt?: string;
}

export const DEFAULT_LOCALE = 'en' satisfies Locale;

const draft = (code: Locale, endonym: string, englishName: string, script: Script = 'latin', extra: Partial<LocaleInfo> = {}): LocaleInfo => ({
  code, endonym, englishName, hreflang: code, dir: 'ltr', script, status: 'draft', ...extra,
});

/** The 20 launch languages. English is the master text; the rest stay drafts until a native speaker reviews them. */
export const LOCALES: readonly LocaleInfo[] = [
  draft('en', 'English', 'English', 'latin', { status: 'reviewed' }),
  draft('es', 'Español', 'Spanish'),
  draft('pt', 'Português', 'Portuguese'),
  draft('fr', 'Français', 'French'),
  draft('ha', 'Hausa', 'Hausa'),
  draft('yo', 'Yorùbá', 'Yoruba'),
  draft('ig', 'Igbo', 'Igbo'),
  draft('pcm', 'Naijá', 'Nigerian Pidgin'),
  draft('sw', 'Kiswahili', 'Swahili'),
  draft('ar', 'العربية', 'Arabic', 'arabic', { dir: 'rtl' }),
  draft('zh', '中文（简体）', 'Chinese (Simplified)', 'han', { hreflang: 'zh-Hans' }),
  draft('hi', 'हिन्दी', 'Hindi', 'devanagari'),
  draft('de', 'Deutsch', 'German'),
  draft('id', 'Bahasa Indonesia', 'Indonesian'),
  draft('tr', 'Türkçe', 'Turkish'),
  draft('ja', '日本語', 'Japanese', 'japanese'),
  draft('ru', 'Русский', 'Russian', 'cyrillic'),
  draft('am', 'አማርኛ', 'Amharic', 'ethiopic'),
  draft('zu', 'isiZulu', 'Zulu'),
  draft('tw', 'Twi', 'Twi'),
];

export function isLocale(x: string): x is Locale {
  return (LOCALE_CODES as readonly string[]).includes(x);
}

export function localeInfo(code: Locale): LocaleInfo {
  const info = LOCALES.find((l) => l.code === code);
  if (!info) throw new Error(`Unknown locale: ${code}`);
  return info;
}
