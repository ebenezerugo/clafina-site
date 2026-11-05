import type { ReactNode } from 'react';
import { isOn, type SwitchKey } from '@/config/switches';

export function Section({ id, eyebrow, title, intro, children, tone = 'page' }: { id: string; eyebrow?: string; title: string; intro?: string; children: ReactNode; tone?: 'page' | 'surface' }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={tone === 'surface' ? 'bg-surface' : ''}>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="max-w-3xl">
          {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{eyebrow}</p>}
          <h2 id={`${id}-title`} className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{title}</h2>
          {intro && <p className="mt-4 text-lg text-muted">{intro}</p>}
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

/** A sentence that makes a switched claim: shown only while its switch is on. */
export function ClaimText({ text, claim }: { text: string; claim?: string }) {
  if (claim && !isOn(claim as SwitchKey)) return null;
  return <span data-claim={claim}>{text}</span>;
}

export function IllustrativeLabel({ text }: { text: string }) {
  return (
    <p data-illustrative="" className="mt-3 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">
      <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></svg>
      {text}
    </p>
  );
}

export function CtaButtons({ primary, secondary }: { primary: { href: string; label: string }; secondary?: { href: string; label: string } | null }) {
  return (
    <div className="flex flex-wrap gap-3">
      <a href={primary.href} data-signup="" className="inline-flex min-h-12 items-center rounded-control bg-primary px-6 font-semibold text-on-primary hover:bg-primary-hover">{primary.label}</a>
      {secondary && <a href={secondary.href} className="inline-flex min-h-12 items-center rounded-control border border-line px-6 font-semibold hover:bg-surface">{secondary.label}</a>}
    </div>
  );
}
