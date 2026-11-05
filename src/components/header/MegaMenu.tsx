'use client';

import { useEffect, useRef, useState } from 'react';

export interface MenuItem { id: string; href: string; label: string }
export interface MenuGroup { id: string; label: string; items: MenuItem[] }
export interface Menu { id: string; label: string; groups: MenuGroup[] }

/** Desktop menus: open on click or Enter/Space, close on Escape or a click outside, focus returns to the button. */
export function MegaMenu({ menus, links, label }: { menus: Menu[]; links: MenuItem[]; label: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { buttons.current[open]?.focus(); setOpen(null); }
    };
    const onClick = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(null); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, [open]);

  if (!menus.length && !links.length) return null;

  return (
    <nav aria-label={label} className="hidden lg:block" ref={root}>
      <ul className="flex items-center gap-1">
        {menus.map((menu) => (
          <li key={menu.id}>
            <button
              ref={(el) => { buttons.current[menu.id] = el; }}
              type="button"
              aria-expanded={open === menu.id}
              aria-controls={`menu-${menu.id}`}
              onClick={() => setOpen(open === menu.id ? null : menu.id)}
              className="inline-flex min-h-11 items-center gap-1 rounded-md px-3 text-[15px] font-medium text-ink hover:bg-surface aria-expanded:bg-surface"
            >
              {menu.label}
              <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" className="transition-transform duration-[var(--dur-fast)] [[aria-expanded=true]>&]:rotate-180"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            <div
              id={`menu-${menu.id}`}
              hidden={open !== menu.id}
              className="absolute inset-x-0 top-full z-40 border-b border-line bg-raised shadow-lg"
            >
              <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8" style={{ gridTemplateColumns: `repeat(${Math.min(menu.groups.length, 5)}, minmax(0, 1fr))` }}>
                {menu.groups.map((group) => (
                  <div key={group.id} className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{group.label}</p>
                    <ul className={`mt-3 grid gap-1 ${group.items.length > 8 ? 'grid-cols-3' : ''}`}>
                      {group.items.map((item) => (
                        <li key={item.id}>
                          <a href={item.href} className="block rounded-md px-2 py-2 text-[15px] text-ink hover:bg-surface" onClick={() => setOpen(null)}>
                            {item.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </li>
        ))}
        {links.map((link) => (
          <li key={link.id}>
            <a href={link.href} className="inline-flex min-h-11 items-center rounded-md px-3 text-[15px] font-medium text-ink hover:bg-surface">{link.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
