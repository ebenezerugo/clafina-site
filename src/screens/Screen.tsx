import type { Locale } from '@/config/locales';
import { LedgerEntry } from './LedgerEntry';
import { PhoneHome } from './PhoneHome';
import { SalesHome } from './SalesHome';
import { ShopPhone } from './ShopPhone';
import { SpecScreen } from './SpecScreen';
import { TillSell } from './TillSell';

const CUSTOM: Record<string, (p: { locale: Locale }) => React.ReactNode> = {
  'sales-home': SalesHome, 'phone-home': PhoneHome, 'till-sell': TillSell, 'shop-phone': ShopPhone, 'ledger-entry': LedgerEntry,
};
const PHONE = new Set(['phone-home', 'shop-phone']);

/** Any product screen by id: a hand-built one, or a spec in content/<locale>/screens/<id>.json. */
export function Screen({ id, locale }: { id: string; locale: Locale }) {
  const Custom = CUSTOM[id];
  return Custom ? <Custom locale={locale} /> : <SpecScreen id={id} locale={locale} />;
}

/** Whether a screen is drawn as a phone, so layouts can give it a narrow column. */
export function isPhoneScreen(id: string): boolean {
  return PHONE.has(id) || id.endsWith('-phone');
}
