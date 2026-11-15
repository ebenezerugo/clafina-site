'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { fitScale } from './scale';
import './screen.css';

/**
 * A product screen drawn at its design size and shrunk to fit its column.
 * Assistive technology gets one description instead of the screen's contents.
 */
export function ScaledScreenFrame({ width, height, label, dir, html }: { width: number; height: number; label: string; dir?: 'ltr' | 'rtl'; html: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  // The screen waits in an inert <template> (never styled or laid out) until it nears the viewport, so a page
  // with several screens starts as quickly as one without.
  useEffect(() => {
    const el = outer.current, inner = body.current;
    if (!el || !inner) return;
    const show = () => { const t = inner.querySelector('template'); if (t) inner.replaceChildren(t.content.cloneNode(true)); };
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { show(); io.disconnect(); } }, { rootMargin: '400px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = outer.current;
    if (!el) return;
    const update = () => setScale(fitScale(el.clientWidth, width));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);

  // Before measuring, fall back to CSS: the box keeps the screen's proportions so nothing jumps.
  const s = scale ?? 0;
  return (
    <div
      ref={outer}
      role="img"
      aria-label={label}
      data-screen=""
      style={{ width: '100%', maxWidth: width, aspectRatio: `${width} / ${height}`, position: 'relative', overflow: 'hidden', borderRadius: 12 }}
    >
      <div
        ref={body}
        aria-hidden="true"
        inert
        dir={dir}
        className="s-root"
        style={{ width, height, transform: `scale(${s})`, transformOrigin: dir === 'rtl' ? 'top right' : 'top left', position: 'absolute', insetInlineStart: 0, top: 0, visibility: scale === null ? 'hidden' : 'visible' }}
        // The screen arrives as finished HTML: React places it and never walks it, so pages start faster.
        dangerouslySetInnerHTML={{ __html: `<template>${html}</template>` }}
      />
    </div>
  );
}
