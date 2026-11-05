import { getRequestConfig } from 'next-intl/server';
import { isLocale, DEFAULT_LOCALE } from '@/config/locales';
import { loadMessages } from './messages';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isLocale(requested) ? requested : DEFAULT_LOCALE;
  return { locale, messages: await loadMessages(locale) };
});
