import type { Metadata } from 'next';
import { LOCALES } from '@/config/locales';
import { localeEnabled } from '@/config/switches';

export const metadata: Metadata = { title: 'Clafina', robots: { index: false, follow: true } };

/** Shown at "/" only when the language redirect does not run. Works without JavaScript. */
export default function LanguagePicker() {
  const enabled = LOCALES.filter((l) => localeEnabled(l.code));
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-semibold">Choose your language</h1>
      <ul className="mt-6 grid grid-cols-2 gap-2">
        {enabled.map((l) => (
          <li key={l.code}>
            <a href={`/${l.code}/`} lang={l.code} dir={l.dir} hrefLang={l.hreflang} className="block rounded px-3 py-2 underline-offset-4 hover:underline">
              {l.endonym}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
