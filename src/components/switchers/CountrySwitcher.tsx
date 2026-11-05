'use client';

import { useId, useSyncExternalStore } from 'react';

export type CountryCode = 'global' | 'ng' | 'latam';
export const COUNTRY_STORAGE_KEY = 'clafina.country';

export function readCountry(): CountryCode {
  if (memory) return memory;
  try {
    const v = localStorage.getItem(COUNTRY_STORAGE_KEY);
    return v === 'ng' || v === 'latam' ? v : 'global';
  } catch {
    return 'global';
  }
}

export function subscribeCountry(onChange: () => void): () => void {
  window.addEventListener('clafina:country', onChange);
  window.addEventListener('storage', onChange);
  return () => { window.removeEventListener('clafina:country', onChange); window.removeEventListener('storage', onChange); };
}

let memory: CountryCode | null = null;

/** Saves the country (in memory too, so it still works when storage is blocked) and tells every listener. */
export function setCountry(value: CountryCode): void {
  memory = value;
  try { localStorage.setItem(COUNTRY_STORAGE_KEY, value); } catch { /* storage blocked: the in-memory choice holds for this page */ }
  window.dispatchEvent(new CustomEvent('clafina:country', { detail: value }));
}

/** Country changes currency and prices only; it never changes the page address. */
export function useCountry(): CountryCode {
  return useSyncExternalStore(subscribeCountry, readCountry, () => 'global' as CountryCode);
}

export function CountrySwitcher({ label, options }: { label: string; options: { code: CountryCode; name: string }[] }) {
  const id = useId();
  const country = useCountry();

  const change = setCountry;

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
