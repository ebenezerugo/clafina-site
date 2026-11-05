import { parseLead } from '../../src/lib/lead';

export interface LeadEnv {
  TURNSTILE_SECRET?: string;
  CRM_ENDPOINT?: string;
  CRM_TOKEN?: string;
  /** Tests pass their own fetch; Cloudflare uses the global one. */
  fetch?: typeof fetch;
}

const MAX_BYTES = 16 * 1024;
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

/**
 * POST /api/lead: check the enquiry, check Turnstile, forward to the CRM.
 * Never says an enquiry was received unless the CRM accepted it.
 */
export async function onRequestPost({ request, env }: { request: Request; env: LeadEnv }): Promise<Response> {
  const doFetch = env.fetch ?? fetch;
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BYTES) return json(413, { error: 'too_large' });

  let body: unknown;
  try { body = JSON.parse(text); } catch { return json(400, { error: 'invalid', fields: { _: 'Not JSON' } }); }
  const result = parseLead(body);
  if (!result.ok) return json(400, { error: 'invalid', fields: result.errors });

  if (!env.CRM_ENDPOINT || !env.TURNSTILE_SECRET) return json(503, { error: 'not_connected' });

  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', result.lead.turnstileToken);
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) form.append('remoteip', ip);
  const verify = await doFetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  const verdict = (await verify.json().catch(() => ({ success: false }))) as { success?: boolean };
  if (!verdict.success) return json(403, { error: 'bot_check_failed' });

  const { turnstileToken: _token, ...lead } = result.lead;
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (env.CRM_TOKEN) headers.authorization = `Bearer ${env.CRM_TOKEN}`;
  const crm = await doFetch(env.CRM_ENDPOINT, { method: 'POST', headers, body: JSON.stringify({ ...lead, source: 'website', receivedAt: new Date().toISOString() }) });
  if (!crm.ok) return json(502, { error: 'crm_failed' });
  return json(202, { ok: true });
}

export async function onRequest(_context?: { request: Request; env: LeadEnv }): Promise<Response> {
  return new Response(null, { status: 405, headers: { allow: 'POST' } });
}
