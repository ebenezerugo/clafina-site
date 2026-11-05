import { describe, expect, it } from 'vitest';
import { rank, type HelpIndexEntry } from '../../src/components/help/HelpSearch';

const e = (t: string, s = '', k = '', u = t): HelpIndexEntry => ({ t, s, w: '', u, k });

describe('help search', () => {
  const entries = [e('Invoices', 'Invoices you have sent.'), e('Send an invoice and get paid', 'Make it, send it.', '', 'a'), e('Send an invoice and get paid', 'The question.', 'bill customer', 'b'), e('Stock levels', 'What you hold.', 'inventory')];
  it('needs every word to match, and ranks titles first', () => {
    expect(rank(entries, 'send invoice').map((r) => r.t)).toEqual(['Send an invoice and get paid']);
    expect(rank(entries, 'invoice')[0]!.t).toBe('Invoices');
  });
  it('finds other names people type', () => {
    expect(rank(entries, 'inventory').map((r) => r.t)).toEqual(['Stock levels']);
    expect(rank(entries, 'bill customer').map((r) => r.u)).toEqual(['b']);
  });
  it('shows a title once, and nothing for a one-letter query', () => {
    expect(rank(entries, 'paid')).toHaveLength(1);
    expect(rank(entries, 'a')).toEqual([]);
  });
});
