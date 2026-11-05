import { defineRouting } from 'next-intl/routing';
import { LOCALE_CODES } from '@/config/locales';

export const routing = defineRouting({ locales: [...LOCALE_CODES], defaultLocale: 'en', localePrefix: 'always' });
