import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Page not found · Clafina', robots: { index: false, follow: false } };

/** For addresses outside any language, such as /xx/. */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="bg-page text-ink">
        <main className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
          <h1 className="text-4xl font-extrabold tracking-tight">We can&apos;t find that page</h1>
          <p className="mt-4 text-lg text-muted">The address may be mistyped, or the page may have moved.</p>
          <a href="/" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-primary px-6 font-semibold text-on-primary">Choose your language</a>
        </main>
      </body>
    </html>
  );
}
