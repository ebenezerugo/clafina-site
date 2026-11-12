'use client';

import { useEffect, useRef, useState } from 'react';
import { Scene } from '@/illustrations/Scene';

/**
 * An illustrated frame that loads as it nears the screen, so a page with many scenes stays light.
 * Until then it holds its place at the frame's shape; the label describes the picture either way.
 */
export function LazyScene({ src, label }: { src: string; label: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [markup, setMarkup] = useState<string | null>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let done = false;
    const load = () => {
      if (done) return;
      done = true;
      fetch(src).then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status))))).then(setMarkup).catch(() => { done = false; });
    };
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { load(); io.disconnect(); } }, { rootMargin: '600px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [src]);
  return (
    <div ref={box} className="overflow-hidden rounded-2xl border border-line shadow-[0_24px_48px_-32px_rgb(11_16_32/0.55)]">
      {markup ? <Scene markup={markup} label={label} /> : <div className="ill bg-surface" role="img" aria-label={label} />}
    </div>
  );
}
