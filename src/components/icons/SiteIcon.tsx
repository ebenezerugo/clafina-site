/** Line icons for the site, drawn on a 24-unit grid with round caps, in the app's icon style. */
const PATHS = {
  ledger: 'M4 4h12a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3zM4 17a3 3 0 0 1 3-3h12M8 8h7M8 11h5',
  wallet: 'M3 7a2 2 0 0 1 2-2h12v4M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3M3 7h16a1 1 0 0 1 1 1v3M20 11h-4a2 2 0 0 0 0 4h4z',
  percent: 'M19 5 5 19M7 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4M17 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4',
  pulse: 'M3 12h4l3-8 4 16 3-8h4',
  invoice: 'M6 2h9l5 5v15H6zM14 2v6h6M9 13h6M9 17h6M9 9h2',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  till: 'M4 4h16v9H4zM8 8h3M2 17h20v4H2zM6 13v4M18 13v4',
  bag: 'M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2',
  network: 'M12 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6M5 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6M19 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6M10.5 8.6 6.5 15.4M13.5 8.6l4 6.8M8 18h8',
  boxes: 'M3 11h8v10H3zM13 11h8v10h-8zM8 3h8v8H8z',
  truck: 'M2 6h11v10H2zM13 9h4l4 4v3h-8zM6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4',
  factory: 'M2 21h20M3 21V10l6 4V10l6 4V6l6 3v12M7 17h2M12 17h2M17 17h2',
  calendar: 'M4 5h16v16H4zM4 10h16M9 3v4M15 3v4M8 14h2M14 14h2M8 17h2',
  kanban: 'M4 4h16v16H4zM9 4v16M15 4v16M6 8h1M11 8h2M17 8h1M11 12h2',
  wrench: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z',
  badge: 'M4 4h16v16H4zM9 9a3 3 0 1 0 6 0 3 3 0 0 0-6 0M7.5 17a4.5 4.5 0 0 1 9 0',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12zM8 11h.01M12 11h.01M16 11h.01',
  mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
  phone: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2M11 18h2',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
  scan: 'M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3M7 12h10',
  plug: 'M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0zM12 17v5',
  wifiOff: 'M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5.2-2.8M19 13a10 10 0 0 0-2-1.6M2 8.8a15 15 0 0 1 4.2-2.7M22 8.8A15 15 0 0 0 10.7 5M12 20h.01',
  coins: 'M9 6a6 3 0 1 0 12 0 6 3 0 0 0-12 0M9 6v4c0 1.7 2.7 3 6 3s6-1.3 6-3V6M3 12a6 3 0 1 0 12 0M3 12v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20',
  live: 'M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19.1 4.9a10 10 0 0 1 0 14.2M4.9 19.1a10 10 0 0 1 0-14.2',
  shield: 'M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5zM9 12l2 2 4-4',
  check: 'M20 6 9 17l-5-5',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  web: 'M3 4h18v14H3zM8 21h8M12 18v3',
  store: 'M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 20v-6h6v6',
  video: 'M3 6h12v12H3zM15 10l6-3v10l-6-3z',
} as const;

export type SiteIconName = keyof typeof PATHS;

export function SiteIcon({ name, size = 20, className }: { name: SiteIconName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={{ flexShrink: 0 }}>
      <path d={PATHS[name]} />
    </svg>
  );
}

/** The icon for each product page. */
export const MODULE_ICONS: Record<string, SiteIconName> = {
  'product-finance': 'ledger', 'product-payments': 'wallet', 'product-tax': 'percent', 'product-business-health': 'pulse',
  'product-sales': 'invoice', 'product-crm': 'users', 'product-pos': 'till', 'product-online-shop': 'bag', 'product-trading-network': 'network',
  'product-stock': 'boxes', 'product-purchasing': 'truck', 'product-manufacturing': 'factory', 'product-bookings': 'calendar', 'product-projects': 'kanban', 'product-assets': 'wrench',
  'product-hr': 'badge', 'product-communication': 'chat', 'product-email': 'mail',
  'product-mobile': 'phone', 'product-assistant': 'sparkle', 'product-capture': 'scan', 'product-integrations': 'plug',
};

/** The icon for each surface and each "works where you work" point on Home. */
export const POINT_ICONS: Record<string, SiteIconName> = {
  web: 'web', till: 'till', phone: 'phone', shop: 'store', assistant: 'sparkle', meet: 'video',
  offline: 'wifiOff', currencies: 'coins', languages: 'globe', live: 'live',
};

/** An icon on a soft tinted tile: the river's colour at low strength. */
export function IconTile({ name, size = 20, tone = 'river' }: { name: SiteIconName; size?: number; tone?: 'river' | 'night' }) {
  return (
    <span aria-hidden="true" className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl ${tone === 'night' ? 'bg-white/8 text-[#7dd3fc] ring-1 ring-white/10' : 'bg-[color-mix(in_srgb,var(--c-river-2)_9%,transparent)] text-primary ring-1 ring-[color-mix(in_srgb,var(--c-river-2)_18%,transparent)]'}`}>
      <SiteIcon name={name} size={size} />
    </span>
  );
}
