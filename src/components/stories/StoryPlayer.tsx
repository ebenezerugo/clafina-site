'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Scene } from '@/illustrations/Scene';

type Paper = { id: string; name: string; number: string; stamp: string };
type Chapter = {
  frame: string; time: string; place: string; short: string; paper: string; done: string[];
  title: string; text: string; did: { kind: 'record' | 'books' | 'stock' | 'people'; text: string }[]; vehicle?: true;
};
type Controls = { list: string; play: string; pause: string; prev: string; next: string; chapter: string; bike: string; van: string };

const DID_TONE = { record: 'bg-tint-sky', books: 'bg-tint-lilac', stock: 'bg-tint-sand', people: 'bg-tint-mint' } as const;
const PAPER_ICON: Record<string, string> = {
  quote: 'M6 2h9l5 5v15H6zM14 2v6h6M9 13h6M9 17h4', invoice: 'M6 2h9l5 5v15H6zM14 2v6h6M9 13h6M9 17h6M9 9h2', order: 'M5 3h14v18H5zM9 8h6M9 12h6M9 16h4',
  waybill: 'M2 6h11v10H2zM13 9h4l4 4v3h-8zM6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4',
  payment: 'M3 7a2 2 0 0 1 2-2h12v4M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3M3 7h16a1 1 0 0 1 1 1v3M20 11h-4a2 2 0 0 0 0 4h4z', receipt: 'M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h4',
};
const STEP_MS = 6500;

/**
 * Plays an illustrated story chapter by chapter. The first frame arrives with the page; later frames are fetched
 * as they are reached (and one ahead), so the page stays light. Everything works by keyboard; nothing plays by itself.
 */
export function StoryPlayer({ chapters, papers, trailTitle, totals, didLabel, controls, frameBase, firstFrame }: {
  chapters: Chapter[]; papers: Paper[]; trailTitle: string; totals: { lines: { label: string; amount: string }[]; totalLabel: string; total: string };
  didLabel: string; controls: Controls; frameBase: string; firstFrame: string;
}) {
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [vehicle, setVehicle] = useState<'van' | 'bike'>('van');
  const [frames, setFrames] = useState<Record<string, string>>(() => ({ [chapters[0]!.frame]: firstFrame }));
  const asked = useRef(new Set<string>([chapters[0]!.frame]));
  const chapter = chapters[at]!;
  const frameOf = useCallback((c: Chapter) => (c.vehicle && vehicle === 'bike' ? `${c.frame}-bike` : c.frame), [vehicle]);

  const want = useCallback((name: string) => {
    if (asked.current.has(name)) return;
    asked.current.add(name);
    fetch(`${frameBase}/${name}.svgf`).then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((svg) => setFrames((f) => ({ ...f, [name]: svg })))
      .catch(() => asked.current.delete(name));
  }, [frameBase]);

  useEffect(() => {
    want(frameOf(chapter));
    const next = chapters[at + 1];
    if (next) want(frameOf(next));
  }, [at, chapter, chapters, frameOf, want]);

  // Playing stops by itself on the last chapter: it is derived, not stored.
  const running = playing && at < chapters.length - 1;
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setAt((i) => Math.min(i + 1, chapters.length - 1)), STEP_MS);
    return () => clearTimeout(t);
  }, [running, at, chapters.length]);

  const go = (i: number) => { setPlaying(false); setAt((i + chapters.length) % chapters.length); };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(at + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(at - 1); }
  };
  const markup = frames[frameOf(chapter)];
  const label = controls.chapter.replace('{n}', String(at + 1)).replace('{total}', String(chapters.length));
  const firstOf = (paper: string) => chapters.findIndex((c) => c.paper === paper);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]" onKeyDown={onKey}>
      <article aria-roledescription="story" className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_30px_60px_-40px_rgb(11_16_32/0.5)]">
        <div className="relative">
          <p className="absolute start-3 top-3 z-10 inline-flex -rotate-1 items-center gap-2 rounded-md border-2 border-[#1b2033] bg-[#fde68a] px-2.5 py-1 text-xs font-bold text-[#0b1020] sm:text-sm">
            <span>{at + 1}/{chapters.length}</span><span>{chapter.place}</span><time className="font-medium tabular">{chapter.time}</time>
          </p>
          {chapter.vehicle && (
            <button type="button" onClick={() => setVehicle((v) => (v === 'van' ? 'bike' : 'van'))} className="absolute end-3 top-3 z-10 min-h-11 rounded-lg border-2 border-[#1b2033] bg-white px-3 text-sm font-semibold text-[#0b1020]">
              {vehicle === 'van' ? controls.bike : controls.van}
            </button>
          )}
          {markup ? <Scene key={frameOf(chapter)} markup={markup} label={chapter.title} /> : <div className="ill" aria-busy="true" />}
        </div>
        <div className="grid gap-3 p-5 sm:p-6" aria-live="polite">
          <h2 className="text-2xl font-extrabold sm:text-[1.65rem]">{chapter.title}</h2>
          <p className="max-w-[70ch] text-muted">{chapter.text}</p>
          <p className="flex flex-wrap items-center gap-2 pt-1">
            <span className="me-1 text-xs font-bold uppercase tracking-[0.08em] text-primary">{didLabel}</span>
            {chapter.did.map((d) => <span key={d.text} className={`rounded-full px-3 py-1 text-sm font-semibold ${DID_TONE[d.kind]}`}>{d.text}</span>)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 px-5 pb-5 sm:px-6">
          <button type="button" onClick={() => go(at - 1)} aria-label={controls.prev} className="inline-flex size-11 items-center justify-center rounded-control border border-line bg-raised rtl:-scale-x-100">←</button>
          <button type="button" onClick={() => { if (!running && at === chapters.length - 1) setAt(0); setPlaying(!running); }} aria-pressed={running} className="inline-flex min-h-11 items-center gap-2 rounded-control bg-primary px-5 font-semibold text-on-primary">
            {running ? `❚❚ ${controls.pause}` : `▶ ${controls.play}`}
          </button>
          <button type="button" onClick={() => go(at + 1)} aria-label={controls.next} className="inline-flex size-11 items-center justify-center rounded-control border border-line bg-raised rtl:-scale-x-100">→</button>
          <span className="sr-only" aria-live="polite">{label}</span>
          <span aria-hidden="true" className="h-1.5 min-w-32 flex-1 overflow-hidden rounded-full bg-line">
            <span className="block h-full bg-[linear-gradient(90deg,var(--c-river-1),var(--c-river-2),var(--c-river-3))] transition-[width] duration-500" style={{ width: `${((at + 1) / chapters.length) * 100}%` }} />
          </span>
        </div>
      </article>

      <aside aria-label={trailTitle} className="grid gap-2.5 lg:sticky lg:top-24">
        <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-muted">{trailTitle}</h2>
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {papers.map((p) => {
            const state = chapter.done.includes(p.id) ? 'done' : chapter.paper === p.id ? 'now' : firstOf(p.id) < at ? 'sent' : 'todo';
            return (
              <li key={p.id}>
                <button type="button" onClick={() => go(firstOf(p.id))} aria-current={state === 'now' ? 'step' : undefined}
                  className={`relative grid w-full grid-cols-[auto_1fr] items-center gap-x-3 rounded-xl border bg-raised px-3.5 py-2.5 text-start transition ${state === 'now' ? 'border-primary shadow-[0_0_0_1px_var(--c-primary)]' : 'border-line'} ${state === 'todo' ? 'border-dashed bg-surface' : ''}`}>
                  <span aria-hidden="true" className={`row-span-2 inline-flex size-9 items-center justify-center rounded-lg bg-tint-sky text-primary ${state === 'todo' ? 'opacity-40' : ''}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={PAPER_ICON[p.id]} /></svg>
                  </span>
                  <b className="text-sm">{p.name}</b>
                  <span className="font-mono text-xs text-muted">{p.number}</span>
                  {state === 'done' && <span className="absolute end-2.5 top-1/2 -translate-y-1/2 -rotate-6 rounded border-2 border-current bg-raised px-1.5 text-[10px] font-extrabold uppercase tracking-wide text-good">{p.stamp}</span>}
                </button>
              </li>
            );
          })}
        </ol>
        <dl className="mt-1 grid gap-1 rounded-xl bg-surface p-3.5 text-sm text-muted tabular">
          {totals.lines.map((l) => <div key={l.label} className="flex justify-between gap-3"><dt>{l.label}</dt><dd>{l.amount}</dd></div>)}
          <div className="flex justify-between gap-3 font-bold text-ink"><dt>{totals.totalLabel}</dt><dd>{totals.total}</dd></div>
        </dl>
      </aside>

      <nav aria-label={controls.list} className="lg:col-span-2">
        <ol className="flex gap-2 overflow-x-auto pb-2">
          {chapters.map((c, i) => (
            <li key={c.frame + i} className="shrink-0">
              <button type="button" onClick={() => go(i)} aria-current={i === at ? 'step' : undefined}
                className={`grid min-h-11 w-32 gap-0.5 rounded-xl border px-3 py-2 text-start ${i === at ? 'border-primary bg-tint-sky' : 'border-line bg-raised'}`}>
                <span className="font-mono text-[11px] text-muted">{String(i + 1).padStart(2, '0')} · {c.time}</span>
                <b className="text-[13px] leading-tight">{c.short}</b>
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
