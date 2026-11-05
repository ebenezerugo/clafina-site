import { LOCALES } from '../src/config/locales';
import { SWITCHES } from '../src/config/switches';
import { pickLocale } from '../src/lib/negotiate';

const enabled = LOCALES.filter((l) => SWITCHES.languages[l.code].on).map((l) => l.code);

/** Cloudflare Pages Function for "/" only: send visitors to their browser's language. */
export const onRequest = ({ request }: { request: Request }): Response => {
  const url = new URL(request.url);
  const locale = pickLocale(request.headers.get('Accept-Language'), enabled);
  return new Response(null, {
    status: 302,
    headers: { Location: `/${locale}/${url.search}`, Vary: 'Accept-Language', 'Cache-Control': 'private, max-age=0' },
  });
};
