'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const platform = () => (/iPhone|iPad|iPod/.test(navigator.userAgent) ? 'ios' : /Android/.test(navigator.userAgent) ? 'android' : 'other');

/** On a phone, the store for that phone first; on a computer, nothing (the QR code is shown instead). */
export function DeviceStore({ ios, android, label }: { ios?: { href: string; text: string }; android?: { href: string; text: string }; label: string }) {
  const p = useSyncExternalStore(subscribe, platform, () => 'other');
  const store = p === 'ios' ? ios : p === 'android' ? android : undefined;
  if (!store) return null;
  return (
    <p className="mt-6 rounded-xl border border-line bg-raised p-4">
      <span className="block text-sm text-muted">{label}</span>
      <a href={store.href} className="mt-2 inline-flex min-h-12 items-center rounded-control bg-primary px-6 font-semibold text-on-primary hover:bg-primary-hover">{store.text}</a>
    </p>
  );
}
