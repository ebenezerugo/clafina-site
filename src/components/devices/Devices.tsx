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
      <div className="w-[86%] rounded-t-sm bg-white px-[7%] pb-4 pt-3.5 font-mono text-[9px] leading-[1.5] text-[#1c1f26] shadow-[0_10px_24px_-10px_rgb(0_0_0/0.4)] lg:text-[10.5px]">
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

/** A phone: a dark rounded body with a camera pill, the screen inside. */
export function PhoneDevice({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-[44px] bg-[#15171d] p-[3.2%] shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_40px_80px_-30px_rgb(0_0_0/0.75)] ${className}`}>
      <div aria-hidden="true" className="absolute start-1/2 top-[2.4%] z-10 h-[2.6%] w-[28%] -translate-x-1/2 rounded-full bg-[#0b0c10] rtl:translate-x-1/2" />
      <div className="overflow-hidden rounded-[36px] bg-white pt-[9%] [&_[data-screen]]:!rounded-none">{children}</div>
    </div>
  );
}
