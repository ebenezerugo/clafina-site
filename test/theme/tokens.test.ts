import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrast } from '../helpers/contrast';

const css = readFileSync('src/theme/tokens.css', 'utf8');

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`No block for ${selector}`);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1]!, m[2]!]));
}

const light = block(':root');
const dark = block(':root[data-theme="dark"]');

describe('placeholder theme', () => {
  for (const [name, t] of [['light', light], ['dark', dark]] as const) {
    it(`keeps text readable in the ${name} theme`, () => {
      expect(contrast(t['c-ink']!, t['c-page']!)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t['c-muted']!, t['c-page']!)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t['c-muted']!, t['c-surface']!)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t['c-on-primary']!, t['c-primary']!)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t['c-primary']!, t['c-page']!)).toBeGreaterThanOrEqual(4.5);
      for (const band of ['c-band-1', 'c-band-2', 'c-band-3']) expect(contrast('#ffffff', t[band]!)).toBeGreaterThanOrEqual(4.5);
      for (const tint of ['c-tint-mint', 'c-tint-sky', 'c-tint-lilac', 'c-tint-sand']) {
        expect(contrast(t['c-ink']!, t[tint]!)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(t['c-muted']!, t[tint]!)).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
  it('redefines every colour for dark mode, both ways', () => {
    expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort());
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain(':root:not([data-theme="light"])');
  });
});
