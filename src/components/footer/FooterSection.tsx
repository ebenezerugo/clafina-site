import type { ReactNode } from 'react';

/**
 * One footer section. Built open, so crawlers and visitors without scripts get every link. On a wide screen it is a
 * plain heading over its links; narrower, FooterFold closes it and the heading becomes a row you tap to open.
 * Server-rendered: one small FooterFold script handles every section, so the footer adds no islands to hydrate.
 */
export function FooterSection({ id, title, children, className = '' }: { id: string; title: string; children: ReactNode; className?: string }) {
  return (
    <details open data-footer-fold="" className={`group min-w-0 border-b border-line lg:border-0 ${className}`}>
      <summary
        id={`footer-${id}`}
        className="flex min-h-12 cursor-pointer list-none items-center justify-between text-xs font-bold uppercase tracking-[0.12em] text-muted lg:pointer-events-none lg:min-h-0 [&::-webkit-details-marker]:hidden"
      >
        {title}
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-open:rotate-180 lg:hidden"><path d="m6 9 6 6 6-6" /></svg>
      </summary>
      <div className="pb-6 lg:pb-0">{children}</div>
    </details>
  );
}
