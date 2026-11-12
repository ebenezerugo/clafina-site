/** Cloudflare Pages Function: the visitor's country, so stories and prices can be local. Nothing is stored. */
export const onRequestGet = ({ request }: { request: Request & { cf?: { country?: string } } }): Response =>
  new Response(JSON.stringify({ country: request.cf?.country ?? null }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
  });
