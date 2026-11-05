import { describe, expect, it } from 'vitest';
import { onRequest, onRequestPost } from '../../functions/api/lead';
import { validLead } from '../helpers/lead';

const req = (body: unknown, init: RequestInit = {}) =>
  new Request('https://clafina.com/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body), ...init });

type Call = { url: string; body: unknown; headers: Headers };
function fakeFetch(turnstileOk: boolean, crmStatus = 202) {
  const calls: Call[] = [];
  const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, body: init?.body instanceof FormData ? Object.fromEntries(init.body) : JSON.parse(String(init?.body ?? 'null')), headers: new Headers(init?.headers) });
    if (url.includes('challenges.cloudflare.com')) return new Response(JSON.stringify({ success: turnstileOk }));
    return new Response(null, { status: crmStatus });
  };
  return { fetch, calls };
}
const full = (f: ReturnType<typeof fakeFetch>) => ({ TURNSTILE_SECRET: 'secret', CRM_ENDPOINT: 'https://crm.example/leads', CRM_TOKEN: 'crm-token', fetch: f.fetch });

describe('lead function', () => {
  it('says it is not connected when the CRM or Turnstile is not set up', async () => {
    const res = await onRequestPost({ request: req(validLead), env: {} });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'not_connected' });
  });
  it('refuses an invalid lead with field errors', async () => {
    const res = await onRequestPost({ request: req({ ...validLead, email: 'x' }), env: full(fakeFetch(true)) });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'invalid', fields: { email: expect.any(String) } });
  });
  it('refuses a body that is not JSON', async () => {
    expect((await onRequestPost({ request: req('{nope'), env: full(fakeFetch(true)) })).status).toBe(400);
  });
  it('refuses a body over 16 KB', async () => {
    expect((await onRequestPost({ request: req({ ...validLead, message: 'x'.repeat(20000) }), env: full(fakeFetch(true)) })).status).toBe(413);
  });
  it('refuses a failed bot check', async () => {
    expect((await onRequestPost({ request: req(validLead), env: full(fakeFetch(false)) })).status).toBe(403);
  });
  it('reports a CRM failure', async () => {
    expect((await onRequestPost({ request: req(validLead), env: full(fakeFetch(true, 500)) })).status).toBe(502);
  });
  it('forwards the lead without the bot token, with the CRM key', async () => {
    const f = fakeFetch(true);
    const res = await onRequestPost({ request: req(validLead), env: full(f) });
    expect(res.status).toBe(202);
    const crm = f.calls.find((c) => c.url === 'https://crm.example/leads')!;
    expect(crm.body).not.toHaveProperty('turnstileToken');
    expect(crm.body).toMatchObject({ email: 'ada@example.com', source: 'website' });
    expect(crm.headers.get('authorization')).toBe('Bearer crm-token');
  });
  it('answers other methods with 405', async () => {
    const res = await onRequest({ request: new Request('https://clafina.com/api/lead'), env: {} });
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('POST');
  });
});
