'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Menu, MenuItem } from './MegaMenu';

/** Below 1024 px: one toggle, a panel from the start side, focus kept inside while open, Escape closes. */
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
    if (!open) return;
    const first = panel.current?.querySelector<HTMLElement>('a, button, select');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); toggle.current?.focus(); return; }
      if (e.key !== 'Tab' || !panel.current) return;
      const focusable = [...panel.current.querySelectorAll<HTMLElement>('a, button, select')].filter((el) => !el.closest('[hidden]'));
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl?.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl?.focus(); }
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
      <div
        id="mobile-menu"
        ref={panel}
        hidden={!open}
        data-testid="mobile-menu"
        className="fixed inset-y-0 start-0 top-16 z-40 w-full max-w-sm overflow-y-auto border-e border-line bg-raised px-4 pb-10 shadow-lg"
      >
        <nav aria-label={labels.nav} className="py-4">
          {menus.map((menu) => (
            <details key={menu.id} className="border-b border-line py-2">
              <summary className="flex min-h-11 cursor-pointer items-center font-medium">{menu.label}</summary>
              {menu.groups.map((group) => (
                <div key={group.id} className="pb-3">
                  <p className="px-2 pt-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">{group.label}</p>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item.id}><a href={item.href} className="block rounded-md px-2 py-2 hover:bg-surface">{item.label}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </details>
          ))}
          <ul>
            {links.map((link) => (
              <li key={link.id}><a href={link.href} className="flex min-h-11 items-center border-b border-line font-medium">{link.label}</a></li>
            ))}
          </ul>
        </nav>
        <div className="grid gap-3">{actions}</div>
      </div>
    </div>
  );
}
