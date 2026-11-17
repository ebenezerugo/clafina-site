/* eslint-disable @next/next/no-img-element -- static export: the device photos are already sized WebP files. */
import type { ReactNode } from 'react';
import { PhoneClock } from './PhoneClock';

/**
 * Hardware frames for the illustrative screens, so a till looks like a till and a phone like a phone.
 * Only the frame is drawn here: the screen inside keeps its own label for assistive technology.
 */

/** A counter-top till: photographed hardware (public/devices) with the live screen set into its display. */
export function TillTerminal({ children, printer, show = true }: { children: ReactNode; printer?: ReactNode; show?: boolean }) {
  return (
    <div className="relative">
      <div className="relative aspect-[1100/831] drop-shadow-[0_40px_45px_rgb(0_0_0/0.45)]">
        {/* The screen sits under the photo; the photo's display is cut out, so its bezel frames the screen exactly. */}
        <div className="absolute overflow-hidden bg-surface" style={{ left: '3.07%', top: '4.38%', width: '93.86%', height: '68.33%' }}>{children}</div>
        {/* Until show, the photo is not requested: the page can hold it back until it is nearly in view. */}
        {show && <img src="/devices/monitor.webp" alt="" width={1100} height={831} decoding="async" className="pointer-events-none absolute inset-0 size-full" />}
      </div>
      {printer && <div aria-hidden="true" className="absolute bottom-[3%] start-[-1%] z-20 hidden w-[32%] sm:block">{printer}</div>}
    </div>
  );
}

/** A receipt coming out of the slot of a photographed thermal printer. */
export function ReceiptPrinter({ title, lines, total, footer }: { title: string; lines: { label: string; amount: string }[]; total: { label: string; amount: string }; footer: string }) {
  return (
    <div className="relative">
      <div className="receipt-paper absolute z-10 bottom-[63.5%] start-[14%] w-[72%] rounded-t-sm bg-white px-[7%] pb-3 pt-3.5 font-mono text-[9px] leading-[1.5] text-[#1c1f26] shadow-[0_10px_24px_-10px_rgb(0_0_0/0.4)] lg:text-[10.5px]">
        <p className="text-center font-bold tracking-wide">{title}</p>
        <div className="my-2 border-t border-dashed border-[#c5c9d2]" />
        {lines.map((l) => <p key={l.label} className="flex justify-between gap-2"><span className="whitespace-nowrap">{l.label}</span><span className="tabular">{l.amount}</span></p>)}
        <div className="my-2 border-t border-dashed border-[#c5c9d2]" />
        <p className="flex justify-between gap-2 font-bold"><span>{total.label}</span><span className="tabular">{total.amount}</span></p>
        <p className="mt-2 text-center text-[#5b6170]">{footer}</p>
      </div>
      <img src="/devices/printer.webp" alt="" width={520} height={414} loading="lazy" decoding="async" className="relative block h-auto w-full drop-shadow-[0_24px_24px_rgb(0_0_0/0.45)]" />
    </div>
  );
}

/**
 * A phone: photographed hardware (public/devices) with the live screen set into its display, and a status bar beside
 * the photo's camera pill. Sizes are shares of the phone's own width (container units), so it scales as one piece.
 */
export function PhoneDevice({ children, className = '', show = true }: { children: ReactNode; className?: string; show?: boolean }) {
  return (
    <div className={`@container ${className}`}>
      <div className="relative aspect-[560/1171] drop-shadow-[0_40px_40px_rgb(0_0_0/0.45)]">
        <div className="absolute overflow-hidden rounded-[11cqw] bg-white" style={{ left: '4.46%', top: '2.01%', width: '91.21%', height: '96.15%' }}>
          <div aria-hidden="true" className="absolute inset-x-[7cqw] top-0 z-10 flex h-[11cqw] items-center justify-between text-[#0b0c10]" dir="ltr">
            <PhoneClock />
            <span className="flex items-center gap-[1.3cqw]">
              <svg viewBox="0 0 18 12" className="h-[2.9cqw] w-auto" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx=".8" /><rect x="5" y="5.5" width="3" height="6.5" rx=".8" /><rect x="10" y="3" width="3" height="9" rx=".8" /><rect x="15" y="0" width="3" height="12" rx=".8" /></svg>
              <svg viewBox="0 0 16 12" className="h-[2.9cqw] w-auto" fill="currentColor"><path d="M8 2.6c2.3 0 4.4.9 6 2.4l1.4-1.5A10.4 10.4 0 0 0 8 .5 10.4 10.4 0 0 0 .6 3.5L2 5c1.6-1.5 3.7-2.4 6-2.4zm0 4c1.2 0 2.3.5 3.2 1.2l1.4-1.5A6.7 6.7 0 0 0 8 4.5c-1.8 0-3.4.7-4.6 1.8l1.4 1.5C5.7 7.1 6.8 6.6 8 6.6zm0 4.9 2-2.1A2.9 2.9 0 0 0 8 8.6c-.8 0-1.5.3-2 .8z" /></svg>
              <svg viewBox="0 0 27 13" className="h-[3cqw] w-auto"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" strokeOpacity=".4" /><rect x="2" y="2" width="18" height="9" rx="2" fill="currentColor" /><path d="M25 4.5v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2z" fill="currentColor" fillOpacity=".45" /></svg>
            </span>
          </div>
          <div className="pt-[12.5cqw] [&_[data-screen]]:!rounded-none">{children}</div>
        </div>
        {show && <img src="/devices/phone.webp" alt="" width={560} height={1171} loading="lazy" decoding="async" className="pointer-events-none absolute inset-0 size-full" />}
      </div>
    </div>
  );
}
