'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { switcherPath } from '@/lib/paths';

export interface LanguageOption { code: string; endonym: string; hreflang: string; dir: 'ltr' | 'rtl' }

export function LanguageSwitcher({ current, options, label }: { current: string; options: LanguageOption[]; label: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const pathname = usePathname() ?? `/${current}/`;
  const rest = switcherPath(pathname);
  const button = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const currentName = options.find((o) => o.code === current)?.endonym ?? current;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); button.current?.focus(); } };
    const onClick = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, [open]);

  return (
    <div className="relative" ref={box}>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-muted hover:text-ink"
      >
        <span className="sr-only">{label}: </span>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" /></svg>
        <span>{currentName}</span>
      </button>
      <ul
        id={id}
        hidden={!open}
        className="absolute end-0 bottom-full z-40 mb-2 grid max-h-80 w-64 grid-cols-2 gap-1 overflow-y-auto rounded-lg border border-line bg-raised p-2 shadow-lg"
      >
        {options.map((o) => (
          <li key={o.code}>
            <a
              href={`/${o.code}${rest}`}
              hrefLang={o.hreflang}
              lang={o.code}
              dir={o.dir}
              aria-current={o.code === current ? 'true' : undefined}
              className="block rounded-md px-2 py-2 text-sm hover:bg-surface aria-[current=true]:font-semibold"
            >
              {o.endonym}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
