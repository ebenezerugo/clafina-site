'use client';

import { useEffect, useState } from 'react';

/** "7:05" or "19:05": the visitor's own clock style, without AM/PM, the way a phone's status bar shows it. */
function now(): string {
  const parts = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).formatToParts(new Date());
  return parts.filter((p) => p.type !== 'dayPeriod').map((p) => p.value).join('').trim();
}

/**
 * The time in a drawn phone's status bar. The page is built ahead of time, so it starts at 9:41 (the time phones are
 * pictured at); in the browser it turns to the visitor's own local time and keeps up, minute by minute.
 */
export function PhoneClock() {
  const [time, setTime] = useState('9:41');
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const tick = () => { setTime(now()); t = setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50); };
    tick();
    return () => clearTimeout(t);
  }, []);
  return <span className="text-[3.9cqw] font-semibold leading-none tracking-tight tabular" suppressHydrationWarning>{time}</span>;
}
