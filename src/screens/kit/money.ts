import { localeInfo, type Locale } from '../../config/locales';

export type Currency = 'NGN' | 'USD' | 'GHS' | 'KES' | 'EUR';

/** Money on product screens, formatted for the page's language. Naira shows no kobo, as in the product. */
export function formatMoney(amount: number, currency: Currency, locale: Locale): string {
  if (!Number.isFinite(amount)) throw new Error('formatMoney needs a finite amount');
  const digits = currency === 'NGN' ? 0 : 2;
  return new Intl.NumberFormat(localeInfo(locale).hreflang, {
    style: 'currency', currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(amount);
}
