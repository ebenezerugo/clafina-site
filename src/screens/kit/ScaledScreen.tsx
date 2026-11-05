'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { fitScale } from './scale';
import './screen.css';

/**
 * A product screen drawn at its design size and shrunk to fit its column.
 * Assistive technology gets one description instead of the screen's contents.
 */
export function ScaledScreen({ width, height, label, dir, children }: { width: number; height: number; label: string; dir?: 'ltr' | 'rtl'; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

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
        aria-hidden="true"
        inert
        dir={dir}
        className="s-root"
        style={{ width, height, transform: `scale(${s})`, transformOrigin: dir === 'rtl' ? 'top right' : 'top left', position: 'absolute', insetInlineStart: 0, top: 0, visibility: scale === null ? 'hidden' : 'visible' }}
      >
        {children}
      </div>
    </div>
  );
}
