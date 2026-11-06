'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Menu, MenuItem } from './MegaMenu';

const FOCUSABLE = 'a[href], button, select, summary';

/**
 * Below 1024 px: one toggle and a sheet under the header (full width on a phone, a side panel with the page dimmed
 * behind it on a tablet). Tab cycles through the toggle and the sheet while open; Escape or the dimmed page closes it.
 * The sheet is drawn at the end of <body>: inside the header, whose backdrop blur makes a new containing block, a
 * fixed panel would be squeezed into the header's own height.
 */
export function MobileMenu({ menus, links, labels, actions }: {
  menus: Menu[];
  links: MenuItem[];
  labels: { open: string; close: string; nav: string };
  actions: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !panel.current) return;
    const focusables = (): HTMLElement[] => {
      const inPanel = [...panel.current!.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => !el.closest('[hidden]') && !(el.tagName !== 'SUMMARY' && el.closest('details:not([open])')),
      );
      return toggle.current ? [toggle.current, ...inPanel] : inPanel;
    };
    focusables()[1]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); toggle.current?.focus(); return; }
      if (e.key !== 'Tab') return;
      const list = focusables();
      const index = list.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (index <= 0 ? list.length - 1 : index - 1) : (index === list.length - 1 || index < 0 ? 0 : index + 1);
      e.preventDefault();
      list[next]?.focus();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? labels.close : labels.open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-11 items-center justify-center rounded-md text-ink hover:bg-surface"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          {open ? <path d="M5 5l14 14M19 5L5 19" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
        </svg>
      </button>
      {open && createPortal(
        <>
          <div aria-hidden="true" onClick={() => setOpen(false)} className="fixed inset-x-0 bottom-0 top-16 z-40 hidden bg-ink/30 sm:block lg:hidden" />
          <div
            id="mobile-menu"
            ref={panel}
            data-testid="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={labels.nav}
            className="fixed bottom-0 start-0 top-16 z-50 flex w-full flex-col bg-page sm:max-w-md sm:border-e sm:border-line sm:shadow-lg lg:hidden"
          >
            <nav aria-label={labels.nav} className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
              {menus.map((menu) => (
                <details key={menu.id} className="group border-b border-line">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-lg font-semibold [&::-webkit-details-marker]:hidden">
                    {menu.label}
                    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted transition-transform group-open:rotate-180"><path d="m6 9 6 6 6-6" /></svg>
                  </summary>
                  <div className="grid gap-5 pb-5">
                    {menu.groups.map((group) => (
                      <div key={group.id}>
                        {menu.groups.length > 1 && <p className="pb-1 text-xs font-bold uppercase tracking-[0.12em] text-muted">{group.label}</p>}
                        <ul className={group.items.length > 8 ? 'grid grid-cols-2 gap-x-4' : 'grid'}>
                          {group.items.map((item) => (
                            <li key={item.id}><a href={item.href} className="flex min-h-11 items-center rounded-md text-[15px] text-ink hover:text-primary">{item.label}</a></li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
              <ul>
                {links.map((link) => (
                  <li key={link.id}><a href={link.href} className="flex min-h-14 items-center border-b border-line text-lg font-semibold">{link.label}</a></li>
                ))}
              </ul>
            </nav>
            <div className="grid grid-cols-2 gap-3 border-t border-line bg-page p-4">{actions}</div>
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}
