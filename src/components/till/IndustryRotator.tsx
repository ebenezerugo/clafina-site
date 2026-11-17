'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { PhoneDevice, TillTerminal } from '@/components/devices/Devices';
import { FLOAT_CARD } from '@/components/sections/FloatingCards';
import { fitScale } from '@/screens/kit/scale';
import './till-showcase.css';

type Slide = { id: string; chip: string; headline: string; images: string[] };
type Part = 'notice' | 'till' | 'printer' | 'phone';
const PARTS: Part[] = ['notice', 'till', 'printer', 'phone'];

const EVERY_MS = 4500;
const FADE_MS = 700;

/**
 * Draws a fetched screen the way ScaledScreenFrame does in the page: takes it out of its inert <template> and shrinks
 * it to fit its column, again whenever the column changes size.
 */
function activate(root: HTMLElement): () => void {
  const watchers: ResizeObserver[] = [];
  root.querySelectorAll<HTMLElement>('[data-screen]').forEach((outer) => {
    const body = outer.firstElementChild as HTMLElement | null;
    if (!body) return;
    const t = body.querySelector('template');
    if (t) body.replaceChildren(t.content.cloneNode(true));
    const width = parseFloat(body.style.width);
    const fit = () => { body.style.transform = `scale(${fitScale(outer.clientWidth, width)})`; body.style.visibility = 'visible'; };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(outer); watchers.push(ro);
  });
  return () => watchers.forEach((w) => w.disconnect());
}

/**
 * Shows one business at a time on the till, receipt and phone, moving on by itself every few seconds. It pauses while
 * the pointer or keyboard is on it, while it is off screen, and for anyone who prefers less motion; the chips choose a
 * business directly. The first business comes with the page; each other one is fetched (with its pictures) just
 * before its turn, so the page starts light and every change is instant.
 */
export function IndustryRotator({ locale, lead, chooser, slides, first }: { locale: string; lead: string; chooser: string; slides: Slide[]; first: Record<Part, ReactNode> }) {
  const [at, setAt] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [held, setHeld] = useState(false);
  const [seen, setSeen] = useState(false);
  const [still, setStill] = useState(true);
  // The first business is drawn finished; the arrival animations start with the first change.
  const [moved, setMoved] = useState(false);
  const [ready, setReady] = useState<Set<number>>(() => new Set([0]));
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const holders = useRef(new Map<string, HTMLDivElement>());
  const loading = useRef(new Map<number, Promise<void>>());

  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setStill(mq.matches);
    on(); mq.addEventListener('change', on);
    const io = new IntersectionObserver(([e]) => setSeen(!!e?.isIntersecting), { threshold: 0.25 });
    if (root.current) io.observe(root.current);
    return () => { mq.removeEventListener('change', on); io.disconnect(); };
  }, []);

  /** Fetches a business's screens (once) and puts them in place, still hidden. */
  const load = useCallback((i: number): Promise<void> => {
    if (i === 0) return Promise.resolve();
    const known = loading.current.get(i);
    if (known) return known;
    const s = slides[i]!;
    // Same site only: the address is this site's own fragment page (app/(fragments)).
    const p = fetch(`/fragments/till/${locale}/${s.id}/`).then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status))))).then((html) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      for (const part of PARTS) {
        const into = holders.current.get(`${i}:${part}`); const from = doc.querySelector(`[data-part="${part}"]`);
        if (into && from) into.replaceChildren(...[...from.childNodes].map((n) => document.importNode(n, true)));
      }
      for (const src of s.images) { const img = new Image(); img.src = src; }
      setReady((r) => new Set(r).add(i));
    }).catch((e) => { loading.current.delete(i); throw e; });
    loading.current.set(i, p);
    return p;
  }, [slides, locale]);

  const atRef = useRef(0);
  useEffect(() => { atRef.current = at; }, [at]);
  const go = useCallback((i: number) => {
    load(i).then(() => {
      const cur = atRef.current;
      if (cur === i) return;
      setMoved(true); setLeaving(cur); setAt(i);
    }).catch(() => {});
  }, [load]);

  // Fetched screens are drawn when their business comes up (they need a visible column to measure).
  useEffect(() => {
    if (at === 0 || !ready.has(at)) return;
    const undo = PARTS.map((part) => { const el = holders.current.get(`${at}:${part}`); return el ? activate(el) : () => {}; });
    return () => undo.forEach((u) => u());
  }, [at, ready]);

  useEffect(() => {
    if (leaving === null) return;
    const t = setTimeout(() => setLeaving(null), FADE_MS);
    return () => clearTimeout(t);
  }, [leaving, at]);

  // The next business is fetched as soon as the showcase is on screen, ready for its turn.
  useEffect(() => { if (seen) load((at + 1) % slides.length).catch(() => {}); }, [seen, at, load, slides.length]);

  // Moves on by itself only while on screen, not held, and not asked to keep still.
  useEffect(() => {
    if (still || held || !seen) return;
    const t = setTimeout(() => go((at + 1) % slides.length), EVERY_MS);
    return () => clearTimeout(t);
  }, [at, still, held, seen, go, slides.length]);

  // On a phone the chips scroll sideways: keep the current one in view without moving the page.
  useEffect(() => {
    const row = bar.current; const chip = row?.children[at] as HTMLElement | undefined;
    if (!row || !chip || row.scrollWidth <= row.clientWidth) return;
    row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: still ? 'auto' : 'smooth' });
  }, [at, still]);

  const state = (i: number) => (i === at ? 'on' : i === leaving ? 'off' : 'gone');
  const stack = (part: Part, extra = '') => (
    <div className={`ts-stack ${extra}`}>
      {slides.map((s, i) => (
        <div key={s.id} className={`ts-slide${part === 'notice' ? ' flex items-center gap-3' : ''}`} data-state={state(i)} aria-hidden={i !== at}
          ref={(el) => { if (el) holders.current.set(`${i}:${part}`, el); else holders.current.delete(`${i}:${part}`); }}
          suppressHydrationWarning>
          {i === 0 ? first[part] : null}
        </div>
      ))}
    </div>
  );

  return (
    <div ref={root} className="ts" data-moved={moved ? '' : undefined}
      onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}>
      <p className="ts-lead" aria-live="polite">
        {lead} <span className="ts-word"><span key={slides[at]!.id}>{slides[at]!.headline}</span></span>
      </p>
      <div ref={bar} role="group" aria-label={chooser} className="ts-chips">
        {slides.map((s, i) => (
          <button key={s.id} type="button" aria-pressed={i === at} onClick={() => go(i)} onPointerEnter={() => { load(i).catch(() => {}); }}>{s.chip}</button>
        ))}
      </div>
      <div className="grid items-end gap-x-12 gap-y-14 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)]">
        <div className="relative min-w-0">
          <div aria-hidden="true" className={`${FLOAT_CARD} !z-30 -top-8 start-[34%] hidden min-w-[18rem] sm:flex`}>{stack('notice', 'w-full')}</div>
          <TillTerminal printer={stack('printer')}>{stack('till')}</TillTerminal>
        </div>
        <PhoneDevice className="mx-auto w-full max-w-[230px] min-w-0 sm:max-w-[290px]">{stack('phone')}</PhoneDevice>
      </div>
    </div>
  );
}
