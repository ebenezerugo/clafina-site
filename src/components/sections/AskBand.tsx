import { SiteIcon } from '@/components/icons/SiteIcon';
import { Eyebrow } from './ui';

/**
 * The assistant, shown as a question box with suggested questions. It is not a live form: the box and the
 * suggestions are links to the assistant's page (or plain text while that page is switched off).
 */
export function AskBand({ eyebrow, title, intro, placeholder, suggestions, href }: {
  eyebrow: string; title: string; intro: string; placeholder: string; suggestions: string[]; href: string | null;
}) {
  const Box = href ? 'a' : 'div';
  return (
    <section id="ask" aria-labelledby="ask-title" className="px-4 py-20 sm:px-6 lg:py-28">
      <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-2xl bg-[linear-gradient(135deg,var(--c-tint-lilac),var(--c-tint-sky)_55%,var(--c-tint-mint))] px-6 py-16 text-center sm:px-12 lg:py-20">
        <div className="reveal mx-auto max-w-3xl">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 id="ask-title" className="mt-5 text-3xl font-extrabold leading-[1.08] sm:text-4xl lg:text-5xl">{title}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">{intro}</p>
          <Box {...(href ? { href } : {})} className="mx-auto mt-10 flex min-h-16 max-w-2xl items-center gap-3 rounded-2xl bg-raised px-5 text-start shadow-[0_20px_40px_-24px_rgb(37_99_235/0.5)] ring-1 ring-line transition-shadow hover:ring-primary/40">
            <SiteIcon name="sparkle" size={22} className="text-[var(--c-river-3)]" />
            <span className="flex-1 text-muted">{placeholder}</span>
            <span aria-hidden="true" className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-on-primary rtl:-scale-x-100"><SiteIcon name="arrow" size={18} /></span>
          </Box>
          <ul className="mt-5 flex flex-wrap justify-center gap-2.5">
            {suggestions.map((q) => (
              <li key={q}>{href ? <a href={href} className="inline-flex min-h-11 items-center rounded-full border border-line bg-raised/80 px-4 text-sm font-medium transition-colors hover:border-primary/40">{q}</a> : <span className="inline-flex min-h-11 items-center rounded-full border border-line bg-raised/80 px-4 text-sm font-medium">{q}</span>}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
