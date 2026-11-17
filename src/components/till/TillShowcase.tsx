import type React from 'react';
import type { Locale } from '@/config/locales';
import { loadContent } from '@/content/load';
import { TillIndustriesScreen } from '@/content/screens';
import { ReceiptPrinter } from '@/components/devices/Devices';
import { SiteIcon } from '@/components/icons/SiteIcon';
import { formatMoney } from '@/screens/kit/money';
import { ShopPhoneView } from '@/screens/ShopPhone';
import { TillSellView } from '@/screens/TillSell';
import { IndustryRotator } from './IndustryRotator';

const NOTICE_TONE = 'bg-[#dcfce7] text-[#15803d]';

export type SlideParts = { notice: React.ReactNode; till: React.ReactNode; printer: React.ReactNode; phone: React.ReactNode };

/** The four parts one business shows: the notice, the till, its receipt and its online shop. */
export function industryParts(locale: Locale, id: string): SlideParts {
  const c = loadContent(locale, 'screens/till-industries', TillIndustriesScreen);
  const ind = c.industries.find((x) => x.id === id);
  if (!ind) throw new Error(`No till content for ${id}`);
  const money = (n: number) => formatMoney(n, c.currency, locale);
  const label = c.label.replace('{industry}', ind.headline) as `Illustrative example${string}`;
  return {
    notice: (
      <>
        <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${NOTICE_TONE}`}><SiteIcon name={ind.notice.icon} size={18} /></span>
        <div><p className="text-sm font-semibold">{ind.notice.title}</p><p className="text-xs text-muted">{ind.notice.detail}</p></div>
      </>
    ),
    till: (
      <TillSellView locale={locale} c={{
        illustrative: true, label, currency: c.currency, search: ind.search, online: c.online, cashier: ind.cashier,
        categories: ind.categories, items: ind.items, order: { ...ind.order, pay: c.pay, charge: c.charge },
      }} />
    ),
    printer: (
      <ReceiptPrinter title={ind.receipt.title} lines={ind.receipt.lines.map((l) => ({ label: l.label, amount: money(l.amount) }))}
        total={{ label: ind.receipt.total.label, amount: money(ind.receipt.total.amount) }} footer={ind.receipt.footer} />
    ),
    phone: (
      <ShopPhoneView locale={locale} brand={ind.phone.brand} c={{
        illustrative: true, label, currency: c.currency, shop: ind.phone.shop, pickup: ind.phone.pickup, categories: ind.phone.categories,
        active: ind.phone.active, sectionCount: ind.phone.sectionCount, dishes: ind.phone.dishes, basket: ind.phone.basket,
      }} />
    ),
  };
}

/**
 * The till, its receipt printer and the business's online shop, shown for one kind of business after another, so
 * nobody reads the till as a restaurant till. Only the first business is in the page; each other one is a small
 * static file (app/(fragments)) fetched just before it is shown, so the page starts as light as before.
 */
export function TillShowcase({ locale }: { locale: Locale }) {
  const c = loadContent(locale, 'screens/till-industries', TillIndustriesScreen);
  const slides = c.industries.map((ind) => ({
    id: ind.id, chip: ind.chip, headline: ind.headline,
    images: [...new Set([...ind.items.map((i) => i.img), ...ind.phone.dishes.map((d) => d.img)])],
  }));
  return <IndustryRotator locale={locale} lead={c.lead} chooser={c.chooser} slides={slides} first={industryParts(locale, c.industries[0]!.id)} />;
}
