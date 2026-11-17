import { z } from 'zod';

const tone = z.enum(['good', 'warn', 'bad', 'info']);
const icon = z.enum(['home', 'sales', 'money', 'more', 'plus', 'bell', 'help', 'box', 'bank', 'alert', 'check', 'up', 'down', 'chevron', 'search', 'cart', 'users', 'chart', 'menu', 'phone', 'clock', 'receipt', 'table', 'leaf']);
const org = z.object({ initials: z.string(), name: z.string(), place: z.string() });
const nav = z.array(z.object({ label: z.string().optional(), items: z.array(z.object({ label: z.string(), badge: z.string().optional(), active: z.boolean().optional() })) }));
const base = { illustrative: z.literal(true), label: z.string().startsWith('Illustrative example'), currency: z.enum(['NGN', 'USD', 'GHS', 'KES', 'EUR']) };
const attention = z.object({ tone, icon, title: z.string(), body: z.string(), action: z.string().optional(), amount: z.number().optional() });

export const SalesHomeScreen = z.object({
  ...base, org, nav, goTo: z.string(), search: z.string(), title: z.string(), subtitle: z.string(), newQuote: z.string(), newInvoice: z.string(),
  pipelineTitle: z.string(), pipeline: z.array(z.object({ label: z.string(), amount: z.number(), note: z.string() })),
  attentionTitle: z.string(), attention: z.array(attention),
});

export const PhoneHomeScreen = z.object({
  ...base, org, tabs: z.array(z.object({ label: z.string(), icon, active: z.boolean().optional() })),
  greeting: z.string(), intro: z.string(),
  salesToday: z.object({ label: z.string(), amount: z.number(), change: z.string(), note: z.string() }),
  attentionTitle: z.string(), attention: z.array(attention),
});

export const TillSellScreen = z.object({
  ...base, search: z.string(), online: z.string(), cashier: z.object({ initials: z.string(), name: z.string(), role: z.string() }),
  categories: z.array(z.object({ name: z.string(), count: z.number(), active: z.boolean().optional() })),
  items: z.array(z.object({ name: z.string(), price: z.number(), stock: z.string(), initials: z.string().optional(), img: z.string().startsWith('/products/').optional(), flag: z.string().optional() })),
  order: z.object({
    title: z.string(), meta: z.string(), types: z.array(z.string()),
    lines: z.array(z.object({ name: z.string(), detail: z.string(), qty: z.number(), total: z.number() })),
    warning: z.string(), totals: z.array(z.object({ label: z.string(), amount: z.number() })), totalLabel: z.string(), total: z.number(),
    pay: z.array(z.string()), charge: z.string(),
  }),
});

export const ShopPhoneScreen = z.object({
  ...base, shop: z.object({ initials: z.string(), name: z.string() }), pickup: z.object({ title: z.string(), place: z.string() }),
  categories: z.array(z.string()), active: z.string(), sectionCount: z.string(),
  dishes: z.array(z.object({ name: z.string(), note: z.string(), price: z.number(), tag: z.string().optional(), img: z.string().startsWith('/products/').optional() })),
  basket: z.object({ count: z.number(), label: z.string(), amount: z.number() }),
});

export const LedgerEntryScreen = z.object({
  ...base, org, nav, goTo: z.string(), search: z.string(), title: z.string(), subtitle: z.string(), status: z.string(),
  steps: z.array(z.string()), current: z.number(), linesTitle: z.string(), balanced: z.string(),
  columns: z.object({ account: z.string(), description: z.string(), debit: z.string(), credit: z.string() }),
  lines: z.array(z.object({ account: z.string(), description: z.string(), debit: z.number().optional(), credit: z.number().optional() })),
  effectTitle: z.string(), effect: z.array(z.object({ label: z.string(), amount: z.number(), note: z.string() })),
  approve: z.string(), sendBack: z.string(), rule: z.string(),
});

/** The till as each kind of business uses it: the home page shows them one after another. */
const Money = z.number().int();
export const TillIndustriesScreen = z.object({
  illustrative: z.literal(true), currency: z.literal('NGN'), online: z.string(), pay: z.array(z.string()).length(4), charge: z.string(),
  lead: z.string(), chooser: z.string(), label: z.string().includes('{industry}'),
  industries: z.array(z.object({
    id: z.string().regex(/^[a-z-]+$/), chip: z.string(), headline: z.string(),
    cashier: z.object({ initials: z.string(), name: z.string(), role: z.string() }), search: z.string(),
    categories: z.array(z.object({ name: z.string(), count: z.number(), active: z.boolean().optional() })),
    items: z.array(z.object({ name: z.string(), img: z.string().startsWith('/products/'), price: Money, stock: z.string(), flag: z.string().optional() })).length(8),
    order: z.object({
      title: z.string(), meta: z.string(), types: z.array(z.string()).length(3),
      lines: z.array(z.object({ name: z.string(), detail: z.string(), qty: z.number(), total: Money })).min(1),
      warning: z.string(), totals: z.array(z.object({ label: z.string(), amount: Money })), totalLabel: z.string(), total: Money,
    }),
    receipt: z.object({ title: z.string(), lines: z.array(z.object({ label: z.string(), amount: Money })), total: z.object({ label: z.string(), amount: Money }), footer: z.string() }),
    notice: z.object({ title: z.string(), detail: z.string(), icon: z.enum(['wifiOff', 'boxes', 'calendar', 'check', 'scan']) }),
    phone: z.object({
      shop: z.object({ initials: z.string(), name: z.string() }), brand: z.string().regex(/^#[0-9a-f]{6}$/i),
      pickup: z.object({ title: z.string(), place: z.string() }), categories: z.array(z.string()), active: z.string(), sectionCount: z.string(),
      dishes: z.array(z.object({ name: z.string(), note: z.string(), price: Money, img: z.string().startsWith('/products/'), tag: z.string().optional() })).length(4),
      basket: z.object({ count: z.number(), label: z.string(), amount: Money }),
    }),
  })).min(2),
}).superRefine((c, ctx) => {
  for (const ind of c.industries) {
    const sub = ind.order.lines.reduce((s, l) => s + l.total, 0);
    if (ind.order.totals[0]?.amount !== sub) ctx.addIssue({ code: 'custom', message: `${ind.id}: subtotal is not the sum of the lines` });
    if (ind.order.totals.reduce((s, t) => s + t.amount, 0) !== ind.order.total) ctx.addIssue({ code: 'custom', message: `${ind.id}: total does not add up` });
    if (ind.receipt.total.amount !== ind.order.total) ctx.addIssue({ code: 'custom', message: `${ind.id}: receipt total differs from the order` });
  }
});
