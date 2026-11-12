import { SiteIcon, type SiteIconName } from '@/components/icons/SiteIcon';

type Cards = {
  paid: { title: string; detail: string; amount: string };
  low: { title: string; detail: string; action: string };
  insight: { title: string; detail: string };
};

const CARD = 'absolute z-10 flex items-center gap-3 rounded-2xl bg-raised p-3.5 text-ink shadow-[0_24px_48px_-20px_rgb(11_16_32/0.45)] ring-1 ring-black/5';
const Mark = ({ icon, tone }: { icon: SiteIconName; tone: string }) => (
  <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${tone}`}><SiteIcon name={icon} size={18} /></span>
);

/**
 * Three moments that float over the hero's product screen: a payment landing, stock running low, the assistant
 * noticing a trend. Decorative and illustrative, so hidden from assistive technology; the screen carries the label.
 */
export function FloatingCards({ cards }: { cards: Cards }) {
  return (
    <div aria-hidden="true">
      <div className={`${CARD} -top-5 start-3 max-w-[92%] sm:start-6 lg:start-[-2.5rem] lg:top-[13rem]`}>
        <Mark icon="check" tone="bg-[#dcfce7] text-[#15803d]" />
        <div className="min-w-0"><p className="text-sm font-semibold">{cards.paid.title}</p><p className="truncate text-xs text-muted">{cards.paid.detail}</p></div>
        <p className="ms-2 text-base font-bold tabular">{cards.paid.amount}</p>
      </div>
      <div className={`${CARD} hidden flex-col items-start gap-2 lg:flex lg:bottom-12 lg:start-[-1rem]`}>
        <div className="flex items-center gap-3"><Mark icon="boxes" tone="bg-[#fef3c7] text-[#b45309]" /><p className="text-sm font-semibold">{cards.low.title}</p></div>
        <p className="text-xs text-muted">{cards.low.detail}</p>
        <span className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-page">{cards.low.action}</span>
      </div>
      <div className={`${CARD} hidden lg:flex lg:end-6 lg:top-4`}>
        <Mark icon="sparkle" tone="bg-[#ede9fe] text-[#6d28d9]" />
        <div><p className="text-sm font-semibold">{cards.insight.title}</p><p className="text-xs text-muted">{cards.insight.detail}</p></div>
      </div>
    </div>
  );
}
