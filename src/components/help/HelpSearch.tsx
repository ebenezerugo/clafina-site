'use client';

import { useId, useRef, useState } from 'react';

/** One thing the help centre can find: a module, a page of the app, a how-to or a question. */
export interface HelpIndexEntry {
  /** Title */ t: string;
  /** Summary */ s: string;
  /** Where in the app, "Sell › Sales › Invoices" */ w: string;
  /** Link on this site */ u: string;
  /** Other words people type */ k: string;
}

const words = (q: string) => q.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 1);

/** Scores an entry: words in the title count most, then other names, then the summary. Every word must match. */
export function rank(entries: HelpIndexEntry[], query: string, limit = 12): HelpIndexEntry[] {
  const qs = words(query);
  if (!qs.length) return [];
  const scored: [number, HelpIndexEntry][] = [];
  for (const e of entries) {
    const t = e.t.toLowerCase(), k = e.k.toLowerCase(), s = `${e.s} ${e.w}`.toLowerCase();
    let score = 0;
    for (const q of qs) {
      const here = (t.includes(q) ? 3 : 0) + (k.includes(q) ? 2 : 0) + (s.includes(q) ? 1 : 0);
      if (!here) { score = 0; break; }
      score += here;
    }
    if (score) scored.push([score + (t.startsWith(qs[0]!) ? 2 : 0), e]);
  }
  // The same title from two places (a how-to and a question) shows once, the better match.
  const seen = new Set<string>();
  return scored
    .sort((a, b) => b[0] - a[0] || a[1].t.length - b[1].t.length)
    .filter(([, e]) => { const key = e.t.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; })
    .slice(0, limit)
    .map(([, e]) => e);
}

export function HelpSearch({ index, placeholder, empty }: { index: string; placeholder: string; empty: string }) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<HelpIndexEntry[] | null>(null);
  const loading = useRef(false);
  const load = () => {
    if (entries || loading.current) return;
    loading.current = true;
    fetch(index).then((r) => r.json()).then((d: HelpIndexEntry[]) => setEntries(d)).catch(() => { loading.current = false; });
  };
  const results = entries ? rank(entries, query) : [];
  const searching = query.trim().length > 1;

  return (
    <div role="search">
      <label htmlFor={`${id}-q`} className="sr-only">{placeholder}</label>
      <input
        id={`${id}-q`}
        type="search"
        value={query}
        onFocus={load}
        onChange={(e) => { load(); setQuery(e.target.value); }}
        placeholder={placeholder}
        autoComplete="off"
        className="min-h-14 w-full rounded-control border border-line bg-raised px-5 text-lg shadow-sm outline-none focus:border-ink"
      />
      <p aria-live="polite" className="sr-only">{searching && entries ? `${results.length}` : ''}</p>
      {searching && entries && (
        results.length ? (
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-raised">
            {results.map((r) => (
              <li key={r.u}>
                <a href={r.u} className="block px-5 py-3 hover:bg-surface">
                  <span className="font-semibold">{r.t}</span>
                  <span className="mt-0.5 block text-sm text-muted">{r.w}</span>
                  <span className="mt-0.5 block text-sm text-muted">{r.s}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : <p className="mt-3 text-muted">{empty}</p>
      )}
    </div>
  );
}
