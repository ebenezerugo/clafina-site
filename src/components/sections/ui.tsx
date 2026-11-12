import type { ReactNode } from 'react';
import { isOn, type SwitchKey } from '@/config/switches';
import { SiteIcon } from '@/components/icons/SiteIcon';

/** A small label over a heading: a pill with a dot of the river's colour. */
const EYEBROW = {
  page: 'border border-line bg-raised text-muted shadow-sm',
  night: 'border border-night-line bg-night-raised text-on-night-muted',
  band: 'border border-white/25 bg-white/10 text-white',
} as const;

export function Eyebrow({ children, tone = 'page' }: { children: ReactNode; tone?: keyof typeof EYEBROW }) {
  return (
    <p className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] ${EYEBROW[tone]}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${tone === 'band' ? 'bg-white' : 'dot-river'}`} />
      {children}
    </p>
  );
}

const TONES = { page: '', surface: 'bg-surface', night: 'night relative isolate overflow-hidden', band: 'band relative isolate overflow-hidden' } as const;

export function Section({ id, eyebrow, title, intro, children, tone = 'page', align = 'start' }: {
  id: string; eyebrow?: string; title: string; intro?: string; children: ReactNode;
  tone?: keyof typeof TONES; align?: 'start' | 'center';
}) {
  const centred = align === 'center';
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={TONES[tone]}>
      {tone === 'night' && <div aria-hidden="true" className="night-glow" />}
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className={`reveal max-w-3xl ${centred ? 'mx-auto text-center' : ''}`}>
          {eyebrow && <Eyebrow tone={tone === 'night' || tone === 'band' ? tone : 'page'}>{eyebrow}</Eyebrow>}
          <h2 id={`${id}-title`} className="mt-5 text-3xl font-extrabold leading-[1.08] sm:text-4xl lg:text-[3.25rem]">{title}</h2>
          {intro && <p className={`mt-5 text-lg sm:text-xl ${tone === 'night' ? 'night-muted' : tone === 'band' ? 'band-muted' : 'text-muted'} ${centred ? 'mx-auto max-w-2xl' : 'max-w-2xl'}`}>{intro}</p>}
        </div>
        <div className="mt-12 lg:mt-16">{children}</div>
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
    <p data-illustrative="" className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-raised px-3 py-1 text-xs font-semibold text-muted">
      <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></svg>
      {text}
    </p>
  );
}

const PRIMARY = 'group inline-flex min-h-12 items-center gap-2 rounded-control bg-primary px-6 font-semibold text-on-primary shadow-[0_8px_24px_-8px_color-mix(in_srgb,var(--c-primary)_70%,transparent)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-primary-hover hover:shadow-[0_12px_28px_-8px_color-mix(in_srgb,var(--c-primary)_80%,transparent)]';
const SECONDARY = 'inline-flex min-h-12 items-center rounded-control border border-line bg-raised px-6 font-semibold shadow-sm transition-colors hover:border-ink/30 hover:bg-surface';
const Arrow = () => <span className="transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"><SiteIcon name="arrow" size={18} /></span>;

const ON_COLOUR_PRIMARY = 'group inline-flex min-h-12 items-center gap-2 rounded-control bg-white px-6 font-semibold text-[#0b1020] shadow-[0_10px_30px_-10px_rgb(0_0_0/0.45)] transition-transform duration-200 hover:-translate-y-px';
const ON_COLOUR_SECONDARY = 'inline-flex min-h-12 items-center rounded-control border border-white/40 px-6 font-semibold text-white transition-colors hover:bg-white/10';

/** Start free and an optional second action. On a band or night panel ("colour"), the primary turns white. */
export function CtaButtons({ primary, secondary, tone = 'page' }: { primary: { href: string; label: string }; secondary?: { href: string; label: string } | null; tone?: 'page' | 'colour' }) {
  const onColour = tone === 'colour';
  return (
    <div className="flex flex-wrap gap-3">
      <a href={primary.href} data-signup="" className={onColour ? ON_COLOUR_PRIMARY : PRIMARY}>{primary.label}<Arrow /></a>
      {secondary && <a href={secondary.href} className={onColour ? ON_COLOUR_SECONDARY : SECONDARY}>{secondary.label}</a>}
    </div>
  );
}

/** The soft glow behind a hero. Put it first inside a `relative isolate` hero. */
export function HeroAura() {
  return <div aria-hidden="true" className="aura" />;
}

/**
 * The closing call to action on every page: a night panel with the river's glow, the page's own words, Start free
 * and Book a demo. Rendered as the page's `#cta` section.
 */
export function CtaBand({ title, body, primary, secondary }: { title: string; body: string; primary: { href: string; label: string }; secondary?: { href: string; label: string } | null }) {
  return (
    <section id="cta" aria-labelledby="cta-title" className="px-4 pb-20 pt-4 sm:px-6 lg:pb-28">
      <div className="night relative isolate mx-auto max-w-7xl overflow-hidden rounded-2xl px-6 py-16 sm:px-12 lg:py-20">
        <div aria-hidden="true" className="night-glow" />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--c-river-1),var(--c-river-2),var(--c-river-3),transparent)]" />
        <div className="relative reveal">
          <h2 id="cta-title" className="max-w-3xl text-4xl font-extrabold leading-[1.08] text-on-night sm:text-5xl">{title}</h2>
          <p className="night-muted mt-5 max-w-2xl text-lg">{body}</p>
          <div className="mt-9"><CtaButtons primary={primary} secondary={secondary} tone="colour" /></div>
        </div>
      </div>
    </section>
  );
}
