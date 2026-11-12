import { SiteIcon, type SiteIconName } from '@/components/icons/SiteIcon';

type Cards = {
  paid: { title: string; detail: string; amount: string };
  low: { title: string; detail: string; action: string };
  insight: { title: string; detail: string };
  trend: { title: string; value: string; note: string; points: number[]; from: string; to: string };
};

/** The sales line, drawn in a 200 by 64 box: the line and a soft fill under it. */
function trendPaths(points: number[]) {
  const max = Math.max(...points), min = Math.min(...points);
  const xy = points.map((v, i) => [(i / (points.length - 1)) * 200, 58 - ((v - min) / (max - min || 1)) * 50] as const);
  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return { line, area: `${line} L200 64 L0 64 Z`, end: xy[xy.length - 1]! };
}

export const FLOAT_CARD = 'absolute z-10 flex items-center gap-3 rounded-2xl bg-raised p-3.5 text-ink shadow-[0_24px_48px_-20px_rgb(11_16_32/0.45)] ring-1 ring-black/5';
export const Mark = ({ icon, tone }: { icon: SiteIconName; tone: string }) => (
  <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${tone}`}><SiteIcon name={icon} size={18} /></span>
);

/**
 * Three moments that float over the hero's product screen: a payment landing, stock running low, the assistant
 * noticing a trend. Decorative and illustrative, so hidden from assistive technology; the screen carries the label.
 */
export function FloatingCards({ cards }: { cards: Cards }) {
  return (
    <div aria-hidden="true">
      <div className={`${FLOAT_CARD} -top-5 start-3 max-w-[92%] sm:start-6 lg:start-[-2.5rem] lg:top-[13rem]`}>
        <Mark icon="check" tone="bg-[#dcfce7] text-[#15803d]" />
        <div className="min-w-0"><p className="text-sm font-semibold">{cards.paid.title}</p><p className="truncate text-xs text-muted">{cards.paid.detail}</p></div>
        <p className="ms-2 text-base font-bold tabular">{cards.paid.amount}</p>
      </div>
      <div className={`${FLOAT_CARD} hidden flex-col items-start gap-2 lg:flex lg:bottom-12 lg:start-[-1rem]`}>
        <div className="flex items-center gap-3"><Mark icon="boxes" tone="bg-[#fef3c7] text-[#b45309]" /><p className="text-sm font-semibold">{cards.low.title}</p></div>
        <p className="text-xs text-muted">{cards.low.detail}</p>
        <span className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-page">{cards.low.action}</span>
      </div>
      <div className={`${FLOAT_CARD} hidden lg:flex lg:end-6 lg:top-4`}>
        <Mark icon="sparkle" tone="bg-[#ede9fe] text-[#6d28d9]" />
        <div><p className="text-sm font-semibold">{cards.insight.title}</p><p className="text-xs text-muted">{cards.insight.detail}</p></div>
      </div>
      <TrendCard trend={cards.trend} />
    </div>
  );
}

function TrendCard({ trend }: { trend: Cards['trend'] }) {
  const { line, area, end } = trendPaths(trend.points);
  return (
    <div className={`${FLOAT_CARD} hidden w-[13rem] flex-col items-stretch gap-2 xl:flex xl:bottom-[-1.25rem] xl:start-[14.25rem] min-[1720px]:!bottom-auto min-[1720px]:!start-[calc(100%+1.5rem)] min-[1720px]:!top-[19rem] min-[1720px]:!w-[17rem]`}>
      <p className="text-xs font-semibold text-muted">{trend.title}</p>
      <p className="text-xl font-bold tabular">{trend.value}</p>
      <svg viewBox="0 0 200 64" className="h-16 w-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--c-river-2)" stopOpacity="0.28" /><stop offset="1" stopColor="var(--c-river-2)" stopOpacity="0" /></linearGradient>
          <linearGradient id="trend-line" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="var(--c-river-1)" /><stop offset="0.55" stopColor="var(--c-river-2)" /><stop offset="1" stopColor="var(--c-river-3)" /></linearGradient>
        </defs>
        <path d={area} fill="url(#trend-fill)" />
        <path d={line} fill="none" stroke="url(#trend-line)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <circle cx={end[0]} cy={end[1]} r="3.5" fill="var(--c-river-3)" stroke="var(--c-raised)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between text-[11px] text-muted"><span>{trend.from}</span><span>{trend.to}</span></div>
      <p className="text-xs font-medium text-[var(--c-good)]">{trend.note}</p>
    </div>
  );
}
