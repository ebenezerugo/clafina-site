import { describe, expect, it } from 'vitest';
import { parseLead } from '@/lib/lead';
import { validLead } from '../helpers/lead';



describe('parseLead', () => {
  it('accepts a complete lead', () => {
    expect(parseLead(validLead)).toMatchObject({ ok: true, lead: { email: 'ada@example.com' } });
  });
  it('refuses fields it does not know', () => {
    expect(parseLead({ ...validLead, extra: 1 }).ok).toBe(false);
  });
  it('names the field that is wrong', () => {
    expect(parseLead({ ...validLead, email: 'nope' })).toMatchObject({ ok: false, errors: { email: expect.any(String) } });
    expect(parseLead({ ...validLead, name: '' })).toMatchObject({ ok: false, errors: { name: expect.any(String) } });
  });
  it('refuses an unknown industry or team size', () => {
    expect(parseLead({ ...validLead, industry: 'industry-nope' }).ok).toBe(false);
    expect(parseLead({ ...validLead, teamSize: '7' }).ok).toBe(false);
  });
  it('accepts other as an industry and leaves out optional fields', () => {
    const { message: _m, slot: _s, campaign: _c, ...rest } = validLead;
    expect(parseLead({ ...rest, industry: 'other' }).ok).toBe(true);
  });
  it('refuses something that is not an object', () => {
    expect(parseLead('x').ok).toBe(false);
    expect(parseLead(null).ok).toBe(false);
  });
});
