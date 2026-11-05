import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { isLocale, localeInfo } from '@/config/locales';
import { pageAvailable } from '@/config/switches';
import { ScaledScreen } from '@/screens/kit/ScaledScreen';
import { AppFrame, PhoneFrame } from '@/screens/kit/frames';
import { AttentionRow, Avatar, Card, DataTable, KitButton, Pill, Progress, StatCard } from '@/screens/kit/parts';
import { formatMoney } from '@/screens/kit/money';
import { SalesHome } from '@/screens/SalesHome';
import { PhoneHome } from '@/screens/PhoneHome';
import { TillSell } from '@/screens/TillSell';
import { ShopPhone } from '@/screens/ShopPhone';
import { LedgerEntry } from '@/screens/LedgerEntry';

export const metadata: Metadata = { title: 'Screen kit · Clafina', robots: { index: false, follow: false } };

const org = { initials: 'BH', name: 'Bright Harbour Traders (example)', place: 'Main store' };

/** Internal: every part of the product screen kit. Built in preview only. */
export default async function ScreenGallery({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw) || !pageAvailable('screens')) notFound();
  setRequestLocale(raw);
  const m = (n: number) => formatMoney(n, 'NGN', raw);
  const dir = localeInfo(raw).dir;

  return (
    <main className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold">Screen kit</h1>
      <p className="text-muted">Internal preview of the product screen parts. Illustrative examples only.</p>

      <section aria-labelledby="desktop" className="grid gap-4">
        <h2 id="desktop" className="text-xl font-bold">Web app</h2>
        <ScaledScreen width={1280} height={800} dir={dir} label="Illustrative example: the Sales home page in the web app, with totals and items that need attention.">
          <AppFrame
            org={org}
            goTo="Go to page…"
            search="Search customers, invoices, products…"
            title="Sales"
            subtitle="Everything between a customer asking for a price and the money reaching your bank."
            actions={<><KitButton>New quotation</KitButton><KitButton variant="primary" icon="plus">New invoice</KitButton></>}
            nav={[
              { items: [{ label: 'Dashboard' }, { label: 'Inbox', badge: '9' }] },
              { label: 'Sell', items: [{ label: 'Sales', active: true }, { label: 'Quotations' }, { label: 'Invoices', badge: '7' }, { label: 'Receipts' }] },
              { label: 'Money', items: [{ label: 'Accounts' }, { label: 'Reports' }] },
            ]}
          >
            <div className="s-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <StatCard icon="sales" label="Sales today" value={m(2486500)} change={{ tone: 'good', text: '+12.4%', dir: 'up' }} note="So far today, VAT included." />
              <StatCard icon="bank" label="Cash in bank" value={m(8914250)} change={{ tone: 'neutral', text: '−₦281k', dir: 'down' }} note="Across 3 bank accounts." />
              <StatCard icon="receipt" label="Owed to you" value={m(6730400)} change={{ tone: 'warn', text: '7 overdue' }} note="Customers pay in 31 days." />
            </div>
            <div className="s-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
              <Card title="Needs your attention">
                <AttentionRow tone="bad" icon="alert" title="3 invoices are 30+ days overdue" body={`${m(1120000)} from 3 customers. A reminder brings money in sooner.`} action="Send reminders" />
                <AttentionRow tone="warn" icon="check" title="4 requests need your approval" body={`Oldest: a ${m(3200000)} purchase order, 2 days old.`} action="Review requests" />
              </Card>
              <Card title="Set up your business">
                <Progress value={50} />
                <p className="s-sub">3 of 6 done. Next: connect your bank accounts.</p>
              </Card>
            </div>
            <Card title="Latest invoices">
              <DataTable
                columns={[{ key: 'no', label: 'Number' }, { key: 'customer', label: 'Customer' }, { key: 'status', label: 'Status' }, { key: 'amount', label: 'Amount', numeric: true }]}
                rows={[
                  { no: 'INV-0412', customer: <span className="s-row" style={{ alignItems: 'center', gap: 8 }}><Avatar initials="TS" />Tide Street Stores</span>, status: <Pill tone="good">Paid</Pill>, amount: m(420000) },
                  { no: 'INV-0411', customer: <span className="s-row" style={{ alignItems: 'center', gap: 8 }}><Avatar initials="KM" />Kite Market Co.</span>, status: <Pill tone="bad">Overdue</Pill>, amount: m(1120000) },
                  { no: 'INV-0410', customer: <span className="s-row" style={{ alignItems: 'center', gap: 8 }}><Avatar initials="LV" />Lantern Valley Foods</span>, status: <Pill tone="info">Sent</Pill>, amount: m(86500) },
                ]}
              />
            </Card>
          </AppFrame>
        </ScaledScreen>
      </section>

      <section aria-labelledby="phone" className="grid gap-4">
        <h2 id="phone" className="text-xl font-bold">Phone app</h2>
        <div className="max-w-[390px]">
          <ScaledScreen width={390} height={844} dir={dir} label="Illustrative example: the phone app home page with today's sales and two items that need attention.">
            <PhoneFrame org={org} tabs={[{ label: 'Home', icon: 'home', active: true }, { label: 'Sales', icon: 'sales' }, { label: 'New', icon: 'plus' }, { label: 'Money', icon: 'money' }, { label: 'More', icon: 'more' }]}>
              <div className="s-title">Good morning</div>
              <StatCard icon="sales" label="Sales today" value={m(2486500)} change={{ tone: 'good', text: '+12.4%', dir: 'up' }} />
              <Card title="Needs your attention">
                <AttentionRow tone="bad" icon="alert" title="3 invoices are overdue" body={`${m(1120000)} from 3 customers.`} action="Send reminders" />
              </Card>
            </PhoneFrame>
          </ScaledScreen>
        </div>
      </section>
      <section aria-labelledby="screens-real" className="grid gap-6">
        <h2 id="screens-real" className="text-xl font-bold">Screens used on the site</h2>
        <SalesHome locale={raw} />
        <TillSell locale={raw} />
        <LedgerEntry locale={raw} />
        <div className="grid gap-6 sm:grid-cols-2">
          <PhoneHome locale={raw} />
          <ShopPhone locale={raw} />
        </div>
      </section>
    </main>
  );
}
