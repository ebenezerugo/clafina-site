import { describe, expect, it } from 'vitest';
import { checkScreenSpec } from '@/content/screen-spec';

const base = {
  spec: 1, illustrative: true, label: 'Illustrative example: a list of invoices.', currency: 'NGN', frame: 'app',
  org: { initials: 'BH', name: 'Bright Harbour Traders', place: 'Main store' },
  nav: [{ items: [{ label: 'Invoices', active: true }] }], title: 'Invoices',
  blocks: [
    { type: 'stats', items: [{ icon: 'receipt', label: 'Owed to you', value: { money: 6730400 } }] },
    { type: 'table', columns: [{ label: 'Number' }, { label: 'Amount', numeric: true }], rows: [['INV-1', { money: 420000 }], ['INV-2', { pill: 'bad', text: 'Overdue' }]] },
    { type: 'row', blocks: [{ type: 'progress', label: 'Set up', value: 50 }, { type: 'kv', items: [{ label: 'Period', value: 'October' }] }] },
  ],
};

describe('screen specs', () => {
  it('accepts a valid spec', () => {
    expect(checkScreenSpec(base)).toEqual([]);
  });
  it('rejects an unknown block type', () => {
    expect(checkScreenSpec({ ...base, blocks: [{ type: 'chart' }] }).join()).toContain('blocks.0');
  });
  it('rejects an unknown icon', () => {
    const blocks = [{ type: 'stats', items: [{ icon: 'rocket', label: 'x', value: '1' }] }];
    expect(checkScreenSpec({ ...base, blocks }).join()).toContain('blocks.0.items.0.icon');
  });
  it('rejects a table row with the wrong number of cells', () => {
    const blocks = [{ type: 'table', columns: [{ label: 'A' }, { label: 'B' }], rows: [['only one']] }];
    expect(checkScreenSpec({ ...base, blocks })).toEqual(['blocks.0.rows.0 has 1 cells for 2 columns']);
  });
  it('rejects a label that does not say illustrative', () => {
    expect(checkScreenSpec({ ...base, label: 'A list of invoices.' }).join()).toContain('label');
  });
  it('checks tables nested in a row', () => {
    const blocks = [{ type: 'row', blocks: [{ type: 'table', columns: [{ label: 'A' }], rows: [['a', 'b']] }] }];
    expect(checkScreenSpec({ ...base, blocks })).toEqual(['blocks.0.blocks.0.rows.0 has 2 cells for 1 columns']);
  });
});
