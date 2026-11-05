import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SCRIPT_FONTS, buildScriptFonts } from '../../scripts/script-fonts';
import { makeTempDir } from '../helpers/tmp';

describe('script fonts', () => {
  const out = makeTempDir({});
  buildScriptFonts('node_modules/@fontsource', out);

  it('covers the five non-Latin scripts', () => {
    expect(Object.keys(SCRIPT_FONTS).sort()).toEqual(['am', 'ar', 'hi', 'ja', 'zh']);
  });
  it('writes one stylesheet per script with woff2 only, in three weights', () => {
    const css = readFileSync(join(out, 'arabic.css'), 'utf8');
    expect(css).not.toContain('.woff)');
    expect(new Set([...css.matchAll(/font-weight: (\d+)/g)].map((m) => m[1]))).toEqual(new Set(['400', '600', '700']));
    expect(css).toContain("font-family: 'Noto Sans Arabic'");
  });
  it('copies every font file a stylesheet names', () => {
    for (const { file } of Object.values(SCRIPT_FONTS)) {
      const css = readFileSync(join(out, `${file}.css`), 'utf8');
      const urls = [...css.matchAll(/url\(\/fonts\/([^)]+)\)/g)].map((m) => m[1]!);
      expect(urls.length).toBeGreaterThan(0);
      expect(urls.filter((u) => !existsSync(join(out, u)))).toEqual([]);
    }
  });
});
