import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCRIPT_FONTS, SCRIPT_FONT_WEIGHTS } from '../src/theme/script-fonts';

export { SCRIPT_FONTS };

/** Copies each script's woff2 files and writes one stylesheet per script pointing at /fonts/. */
export function buildScriptFonts(fontsourceDir: string, outDir: string): void {
  mkdirSync(outDir, { recursive: true });
  for (const font of Object.values(SCRIPT_FONTS)) {
    const pkg = join(fontsourceDir, font.pkg);
    const css = SCRIPT_FONT_WEIGHTS.map((w) => readFileSync(join(pkg, `${w}.css`), 'utf8'))
      .join('\n')
      .replace(/src: url\(\.\/files\/([^)]+\.woff2)\) format\('woff2'\)(?:, url\([^)]+\) format\('woff'\))?/g, (_m, name: string) => {
        copyFileSync(join(pkg, 'files', name), join(outDir, name));
        return `src: url(/fonts/${name}) format('woff2')`;
      });
    writeFileSync(join(outDir, `${font.file}.css`), css);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildScriptFonts(join('node_modules', '@fontsource'), join('public', 'fonts'));
  console.log('Wrote script fonts to public/fonts.');
}
