'use client';

import { useSyncExternalStore, type ReactNode } from 'react';

const WIDE = '(min-width: 1024px)';
const subscribe = (cb: () => void) => { const m = window.matchMedia(WIDE); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); };
const isWide = () => window.matchMedia(WIDE).matches;

/**
 * One footer section. On a wide screen it is always open, a plain heading over its links. Narrower, it folds:
 * the heading is a row you tap to open. The page is built open, so crawlers and visitors without scripts get every link.
 */
export function FooterSection({ id, title, children, className = '' }: { id: string; title: string; children: ReactNode; className?: string }) {
  const wide = useSyncExternalStore(subscribe, isWide, () => true);
  return (
    <details
      key={wide ? 'wide' : 'narrow'}
      open={wide || undefined}
      className={`group min-w-0 border-b border-line lg:border-0 ${className}`}
    >
      <summary
        id={`footer-${id}`}
        tabIndex={wide ? -1 : undefined}
        className="flex min-h-12 cursor-pointer list-none items-center justify-between text-xs font-bold uppercase tracking-[0.12em] text-muted lg:pointer-events-none lg:min-h-0 [&::-webkit-details-marker]:hidden"
      >
        {title}
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-open:rotate-180 lg:hidden"><path d="m6 9 6 6 6-6" /></svg>
      </summary>
      <div className="pb-6 lg:pb-0">{children}</div>
    </details>
  );
}
