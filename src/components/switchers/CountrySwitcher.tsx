'use client';

import { useId, useSyncExternalStore } from 'react';

export type CountryCode = 'global' | 'ng' | 'latam';
export const COUNTRY_STORAGE_KEY = 'clafina.country';

function read(): CountryCode {
  try {
    const v = localStorage.getItem(COUNTRY_STORAGE_KEY);
    return v === 'ng' || v === 'latam' ? v : 'global';
  } catch {
    return 'global';
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('clafina:country', onChange);
  window.addEventListener('storage', onChange);
  return () => { window.removeEventListener('clafina:country', onChange); window.removeEventListener('storage', onChange); };
}

/** Country changes currency and prices only; it never changes the page address. */
export function CountrySwitcher({ label, options }: { label: string; options: { code: CountryCode; name: string }[] }) {
  const id = useId();
  const country = useSyncExternalStore(subscribe, read, () => 'global' as CountryCode);

  const change = (value: CountryCode) => {
    try { localStorage.setItem(COUNTRY_STORAGE_KEY, value); } catch { /* storage blocked: keep the choice for this page only */ }
    window.dispatchEvent(new CustomEvent('clafina:country', { detail: value }));
  };

  return (
    <div className="inline-flex items-center gap-2 text-sm">
      <label htmlFor={id} className="text-muted">{label}</label>
      <select
        id={id}
        value={country}
        onChange={(e) => change(e.target.value as CountryCode)}
        className="min-h-11 rounded-md border border-line bg-raised px-2 text-ink"
      >
        {options.map((o) => <option key={o.code} value={o.code}>{o.name}</option>)}
      </select>
    </div>
  );
}
