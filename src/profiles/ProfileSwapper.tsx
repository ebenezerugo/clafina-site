'use client';

import { useEffect } from 'react';
import { COUNTRY_STORAGE_KEY, setCountry } from '@/components/switchers/CountrySwitcher';
import { PROFILES, pricingCountryFor, profileFor, type ProfileId } from './profiles';
import { resolve } from './tokens';

const KEY = 'clafina.profile';
const store = { get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } } };

/** Which profile this visitor sees: ?country=XX first (for previews), then what we found before, then the edge. */
async function findProfile(): Promise<ProfileId> {
  const asked = new URLSearchParams(location.search).get('country');
  if (asked) return profileFor(asked);
  const saved = store.get(KEY);
  if (saved && saved in PROFILES) return saved as ProfileId;
  try {
    const r = await fetch('/api/where', { cache: 'no-store' });
    if (!r.ok) return 'global';
    const { country } = (await r.json()) as { country?: string | null };
    const id = profileFor(country);
    store.set(KEY, id);
    // Prices follow the visitor's country too, unless they chose one in the footer.
    if (store.get(COUNTRY_STORAGE_KEY) === null) setCountry(pricingCountryFor(id));
    return id;
  } catch {
    return 'global';
  }
}

function swap(root: ParentNode, id: ProfileId) {
  root.querySelectorAll<HTMLElement | SVGElement>('[data-tk]').forEach((el) => {
    const [kind, key] = (el.getAttribute('data-tk') ?? '').split(':');
    if (!kind || !key) return;
    const text = resolve(kind, key, id);
    // Edit React's own text node in place, so later renders keep reaching the node that is on the page.
    const only = el.childNodes.length === 1 ? el.firstChild : null;
    if (only && only.nodeType === Node.TEXT_NODE) { if (only.nodeValue !== text) only.nodeValue = text; }
    else if (el.textContent !== text) el.textContent = text;
  });
}

/**
 * Turns every name and money token on the page into the visitor's country's, now and as new parts of the page
 * appear (story frames, scenes that load on scroll). Pages are built with the global profile, so nothing is lost
 * if this never runs.
 */
export function ProfileSwapper() {
  useEffect(() => {
    let id: ProfileId = 'global';
    let alive = true;
    const observer = new MutationObserver((records) => {
      if (id === 'global') return;
      for (const r of records) {
        const target = r.target instanceof Element ? r.target : r.target.parentElement;
        const tk = target?.closest('[data-tk]');
        if (tk) swap(tk.parentElement ?? document, id);
        r.addedNodes.forEach((n) => { if (n instanceof Element) swap(n.matches('[data-tk]') ? (n.parentElement ?? n) : n, id); });
      }
    });
    findProfile().then((found) => {
      if (!alive) return;
      id = found;
      document.documentElement.dataset.profile = id;
      if (id === 'global') return;
      swap(document, id);
      observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['data-tk'] });
    });
    return () => { alive = false; observer.disconnect(); };
  }, []);
  return null;
}
