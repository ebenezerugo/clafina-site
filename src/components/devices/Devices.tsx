import type { ReactNode } from 'react';

/**
 * Hardware frames for the illustrative screens, so a till looks like a till and a phone like a phone.
 * Only the frame is drawn here: the screen inside keeps its own label for assistive technology.
 */

/** A counter-top till: a screen in a dark bezel on a swivel stand, with an optional receipt printer beside it. */
export function TillTerminal({ children, printer }: { children: ReactNode; printer?: ReactNode }) {
  return (
    <div className="relative">
      <div className="relative z-10 rounded-[28px] bg-[#15171d] p-[1.6%] shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_50px_90px_-35px_rgb(0_0_0/0.75)]">
        <div aria-hidden="true" className="absolute start-1/2 top-[0.6%] size-1.5 -translate-x-1/2 rounded-full bg-[#2c303a] rtl:translate-x-1/2" />
        <div className="overflow-hidden rounded-[14px] bg-surface">{children}</div>
      </div>
      <div aria-hidden="true">
        <div className="mx-auto h-10 w-[16%] bg-[linear-gradient(90deg,#1b1e25,#3a3f4b_50%,#1b1e25)] [clip-path:polygon(18%_0,82%_0,100%_100%,0_100%)] sm:h-16" />
        <div className="mx-auto h-3 w-[40%] rounded-b-[18px] rounded-t-md bg-[linear-gradient(180deg,#3a3f4b,#1b1e25)] shadow-[0_18px_30px_-12px_rgb(0_0_0/0.6)] sm:h-4" />
      </div>
      {printer && <div aria-hidden="true" className="absolute bottom-0 start-[2%] z-20 hidden w-[28%] sm:block">{printer}</div>}
    </div>
  );
}

/** A receipt coming out of a small printer. */
export function ReceiptPrinter({ title, lines, total, footer }: { title: string; lines: { label: string; amount: string }[]; total: { label: string; amount: string }; footer: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="receipt-paper w-[86%] rounded-t-sm bg-white px-[7%] pb-4 pt-3.5 font-mono text-[9px] leading-[1.5] text-[#1c1f26] shadow-[0_10px_24px_-10px_rgb(0_0_0/0.4)] lg:text-[10.5px]">
        <p className="text-center font-bold tracking-wide">{title}</p>
        <div className="my-2 border-t border-dashed border-[#c5c9d2]" />
        {lines.map((l) => <p key={l.label} className="flex justify-between gap-2"><span className="whitespace-nowrap">{l.label}</span><span className="tabular">{l.amount}</span></p>)}
        <div className="my-2 border-t border-dashed border-[#c5c9d2]" />
        <p className="flex justify-between gap-2 font-bold"><span>{total.label}</span><span className="tabular">{total.amount}</span></p>
        <p className="mt-2 text-center text-[#5b6170]">{footer}</p>
      </div>
      <div className="relative h-14 w-full rounded-2xl bg-[linear-gradient(180deg,#3a3f4b,#1d2027)] shadow-[0_0_0_1px_rgb(255_255_255/0.06),0_24px_40px_-16px_rgb(0_0_0/0.7)]">
        <div className="absolute inset-x-[8%] top-2 h-1.5 rounded-full bg-[#0d0f13]" />
        <div className="absolute bottom-3 end-4 size-2 rounded-full bg-[#34d399] shadow-[0_0_8px_#34d399]" />
      </div>
    </div>
  );
}

/**
 * A phone: a slim dark body with a camera pill, the screen inside. Every size is a share of the phone's own width
 * (container units), so the bezel and corners keep their proportions from a small hero phone to a large one.
 */
export function PhoneDevice({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`@container ${className}`}>
      <div className="relative rounded-[15cqw] bg-[#15171d] p-[2.2cqw] shadow-[0_0_0_1px_rgb(255_255_255/0.1),0_40px_80px_-30px_rgb(0_0_0/0.7)]">
        <div aria-hidden="true" className="absolute start-1/2 top-[4.4cqw] z-10 h-[5.4cqw] w-[26cqw] -translate-x-1/2 rounded-full bg-[#0b0c10] rtl:translate-x-1/2" />
        {/* The status bar either side of the camera pill: what makes a drawn phone read as a real one. */}
        <div aria-hidden="true" className="absolute inset-x-[11cqw] top-[4.6cqw] z-10 flex items-center justify-between text-[#0b0c10]" dir="ltr">
          <span className="text-[3.9cqw] font-semibold leading-none tracking-tight">9:41</span>
          <span className="flex items-center gap-[1.3cqw]">
            <svg viewBox="0 0 18 12" className="h-[2.9cqw] w-auto" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx=".8" /><rect x="5" y="5.5" width="3" height="6.5" rx=".8" /><rect x="10" y="3" width="3" height="9" rx=".8" /><rect x="15" y="0" width="3" height="12" rx=".8" /></svg>
            <svg viewBox="0 0 16 12" className="h-[2.9cqw] w-auto" fill="currentColor"><path d="M8 2.6c2.3 0 4.4.9 6 2.4l1.4-1.5A10.4 10.4 0 0 0 8 .5 10.4 10.4 0 0 0 .6 3.5L2 5c1.6-1.5 3.7-2.4 6-2.4zm0 4c1.2 0 2.3.5 3.2 1.2l1.4-1.5A6.7 6.7 0 0 0 8 4.5c-1.8 0-3.4.7-4.6 1.8l1.4 1.5C5.7 7.1 6.8 6.6 8 6.6zm0 4.9 2-2.1A2.9 2.9 0 0 0 8 8.6c-.8 0-1.5.3-2 .8z" /></svg>
            <svg viewBox="0 0 27 13" className="h-[3cqw] w-auto"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" strokeOpacity=".4" /><rect x="2" y="2" width="18" height="9" rx="2" fill="currentColor" /><path d="M25 4.5v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2z" fill="currentColor" fillOpacity=".45" /></svg>
          </span>
        </div>
        <div className="overflow-hidden rounded-[12.8cqw] bg-white pb-[3.5cqw] pt-[11cqw] [&_[data-screen]]:!rounded-none">{children}</div>
      </div>
    </div>
  );
}
