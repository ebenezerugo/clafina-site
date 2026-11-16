'use client';
/* eslint-disable @next/next/no-img-element -- static export: the frames are already compressed AVIF in two sizes, chosen by srcset. */

import { useEffect, useRef, useState } from 'react';
import type { StoryCard } from '@/content/schema';
import { Tk } from '@/profiles/Tk';
import './photo-story.css';

export type Shot = { frame: string; ms: number; card?: number; blink?: string; fx?: 'envelope' | 'van'; chip?: string; zoom?: true };
export type SceneChapter = { title: string; cardAt: [number, number, number]; zoom?: [number, number, number]; cards: StoryCard[]; shots: Shot[] };

/** Frames a chapter shows, its blink frames included. */
export const framesOf = (c: SceneChapter) => [...new Set(c.shots.flatMap((s) => (s.blink ? [s.frame, s.blink] : [s.frame])))];

/**
 * One chapter of a picture story. The frames stay stacked and dissolve into one another, so a change of pose reads
 * as movement. The paperwork is drawn here, not in the pictures, so its names and money follow the visitor.
 */
export function PhotoScene({ base, chapter, shot, show, keep, label, eager, paused, chapterKey, poster, play }: {
  poster?: boolean; play?: string; base: string; chapter: SceneChapter; shot: number; show: string; keep: string[]; label: string; eager: boolean; paused: boolean; chapterKey: number;
}) {
  const s = chapter.shots[shot]!;
  const card = s.card === undefined ? null : chapter.cards[s.card]!;
  // A poster stands still: its card is drawn finished, with nothing fading in.
  const firstCard = !poster && s.card === chapter.shots.find((x) => x.card !== undefined)?.card;
  const [l, t, w] = chapter.cardAt;
  const zoom = chapter.zoom;

  return (
    <div className={`ps-wrap${poster ? ' poster' : ''}`}>
      <div className={`ps${paused ? ' paused' : ''}`} role="img" aria-label={label}>
        <div className={`ps-cam${s.zoom ? ' zoom' : ''}`}
          style={zoom ? { ['--ps-ox' as string]: `${zoom[0]}%`, ['--ps-oy' as string]: `${zoom[1]}%`, ['--ps-z' as string]: zoom[2] } : undefined}>
          {keep.map((f) => (
            <img key={f} className={`f${f === s.frame || f === show ? ' on' : ''}${f === s.blink ? ' snap' : ''}`}
              src={`${base}/${f}-1280.avif`} srcSet={`${base}/${f}-640.avif 640w, ${base}/${f}-1280.avif 1280w`} sizes="(min-width: 1024px) 60vw, 100vw"
              width={1280} height={720} alt="" decoding="async" loading={eager && f === keep[0] ? 'eager' : 'lazy'} fetchPriority={eager && f === keep[0] ? 'high' : 'auto'} />
          ))}
        </div>
  
        {s.fx === 'van' && (
          <div key={`van-${chapterKey}`} aria-hidden="true">
            <div className="ps-van"><img src={`${base}/van.webp`} alt="" width={560} height={280} /></div>
            <img className="ps-fg" src={`${base}/bush.webp`} alt="" width={300} height={201} />
          </div>
        )}
        {s.fx === 'envelope' && (
          <svg key={`env-${chapterKey}`} className="ps-env" viewBox="0 0 64 44" aria-hidden="true">
            <rect x="2" y="2" width="60" height="40" rx="4" fill="#fff" stroke="#0f766e" strokeWidth="3" />
            <path d="M4 5 L32 26 L60 5" fill="none" stroke="#0f766e" strokeWidth="3" strokeLinejoin="round" />
          </svg>
        )}
  
        {play && <span className="ps-play" aria-hidden="true"><i><svg viewBox="0 0 12 14"><path d="M1 1l10 6-10 6z" fill="currentColor" /></svg></i>{play}</span>}
      {s.chip && <p key={`chip-${chapterKey}`} className="ps-chip" style={{ left: `${l - 4}%`, top: '10%' }} aria-hidden="true"><span className="tick">✓</span><span><Tk text={s.chip} /></span></p>}
      </div>

        {card && (
          <div key={`${chapterKey}-${s.card}`} className={`ps-card${s.zoom ? ' away' : ''}${card.stamp ? ' stamped' : ''}`} style={{ left: `${l}%`, top: `${t}%`, width: `${w}%` }} aria-hidden="true">
            <p className="k"><span>{card.kicker}</span><span>{card.number}</span></p>
            {card.rows.map((r, i) => (
              <p key={r.label} className={`r${r.big ? ' big' : ''}${r.count ? ' count' : ''}${firstCard ? ' rise' : ''}`} style={firstCard ? { animationDelay: `${0.3 + i * 0.4}s` } : undefined}>
                <span><Tk text={r.label} /></span>
                <b>{r.was && <span className="was"><Tk text={r.was} /></span>}{r.count ? <Count from={r.count[0]} to={r.count[1]} /> : <span className={r.was ? 'good' : undefined}><Tk text={r.value} /></span>}</b>
              </p>
            ))}
            {card.note && <p className={`note ${card.note.tone}${poster ? '' : ' rise'}`} style={{ animationDelay: firstCard ? `${0.4 + card.rows.length * 0.4}s` : '.3s' }}>{card.note.tone === 'ok' ? <span className="tick">✓</span> : <span aria-hidden="true">{card.note.tone === 'info' ? '→' : '•'}</span>}<span><Tk text={card.note.text} /></span></p>}
            {card.button && <p className={`btn${poster ? '' : ' rise'}`} style={{ animationDelay: '1s' }}>{card.button}</p>}
            {card.stamp && <p className={`stamp${poster ? ' still' : ''}`}>{card.stamp}</p>}
          </div>
        )}
    </div>
  );
}

/** A number that counts down (or up) once, the way stock leaves a shelf. */
function Count({ from, to }: { from: number; to: number }) {
  const [n, setN] = useState(from);
  const raf = useRef(0);
  useEffect(() => {
    const instant = from === to || matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    const step = (t: number) => { const p = instant ? 1 : Math.min(1, (t - t0) / 1600); setN(Math.round(from + (to - from) * p)); if (p < 1) raf.current = requestAnimationFrame(step); };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [from, to]);
  return <span>{n}</span>;
}
