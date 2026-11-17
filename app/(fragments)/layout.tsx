import type { ReactNode } from 'react';

/** Pieces of pages fetched by the site itself (never visited): no header, no footer, kept out of search. */
export default function FragmentsLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><meta name="robots" content="noindex, nofollow" /></head>
      <body>{children}</body>
    </html>
  );
}
