import { describe, expect, it } from 'vitest';
import { onRequestGet } from '../../functions/api/where';

describe('/api/where', () => {
  it("answers with the visitor's country and is never cached", async () => {
    const request = Object.assign(new Request('https://clafina.example/api/where'), { cf: { country: 'GB' } });
    const res = onRequestGet({ request });
    expect(await res.json()).toEqual({ country: 'GB' });
    expect(res.headers.get('Cache-Control')).toContain('no-store');
  });
  it('answers null where the edge does not know', async () => {
    expect(await onRequestGet({ request: new Request('https://clafina.example/api/where') }).json()).toEqual({ country: null });
  });
});
