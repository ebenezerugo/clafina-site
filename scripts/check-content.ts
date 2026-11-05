import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTENT_SCHEMAS } from '../src/content/schema';
import { LOCALE_CODES, isLocale } from '../src/config/locales';
import { localeIndexed } from '../src/config/switches';
import { buildMode, type BuildMode } from '../src/lib/build-mode';

const BANNED = ['leverage', 'seamless', 'world-class', 'revolutionary', 'synergy', 'cutting-edge', 'best-in-class'];
const TAGLINES = ['business operating system', 'clarity in every operation'];
const NOT_COPY = new Set(['kind', 'claim', 'prelaunch', 'sources', 'id', 'slug', 'screen', 'surface', 'href']);
const CLAIM_PATTERN = /\d+(?:[.,]\d+)?\s?%|\b(?:certified|compliant)\b/i;

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function files(root: string, locale: string): string[] {
  const dir = join(root, locale);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.json') && statSync(join(dir, f)).isFile()).sort();
}

function read(root: string, locale: string, file: string): Json {
  return JSON.parse(readFileSync(join(root, locale, file), 'utf8')) as Json;
}

function textProblems(where: string, node: Json, path: string, inClaim: boolean, out: string[]): void {
  if (typeof node === 'string') {
    const lower = node.toLowerCase();
    for (const word of BANNED) {
      if (new RegExp(`(^|[^\\w-])${word}([^\\w-]|$)`, 'i').test(node)) out.push(`${where} ${path} uses banned word "${word}"`);
    }
    if (node.includes('!')) out.push(`${where} ${path} has an exclamation mark`);
    if (TAGLINES.some((t) => lower.includes(t))) out.push(`${where} ${path} uses a dropped tagline`);
    const claim = node.match(CLAIM_PATTERN);
    if (claim && !inClaim) out.push(`${where} ${path} says "${claim[0]}" outside a claim`);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((child, i) => textProblems(where, child, `${path}[${i}]`, inClaim, out));
    return;
  }
  if (node && typeof node === 'object') {
    const claimed = inClaim || typeof node.claim === 'string';
    for (const [k, v] of Object.entries(node)) {
      if (NOT_COPY.has(k)) continue;
      textProblems(where, v, path ? `${path}.${k}` : k, claimed, out);
    }
  }
}

function dotted(node: Json, prefix = ''): string[] {
  if (Array.isArray(node)) return node.flatMap((v, i) => dotted(v, `${prefix}[${i}]`));
  if (node && typeof node === 'object') return Object.entries(node).flatMap(([k, v]) => dotted(v, prefix ? `${prefix}.${k}` : k));
  return [prefix];
}

/** Keys and files a translation is missing, compared with English. */
export function translationGaps(root: string): string[] {
  const gaps: string[] = [];
  const english = files(root, 'en');
  for (const locale of LOCALE_CODES.filter((c) => c !== 'en')) {
    if (!existsSync(join(root, locale))) continue;
    for (const file of english) {
      if (!existsSync(join(root, locale, file))) { gaps.push(`${locale}/${file} is missing`); continue; }
      const have = new Set(dotted(read(root, locale, file)));
      for (const key of dotted(read(root, 'en', file))) if (!have.has(key)) gaps.push(`${locale}/${file} is missing ${key}`);
    }
  }
  return gaps;
}

/** Problems that must fail the build. In production, gaps in indexed languages count too. */
export function checkContent(root: string, mode: BuildMode = buildMode()): string[] {
  const problems: string[] = [];
  for (const locale of readdirSync(root).filter((d) => isLocale(d)).sort((a, b) => LOCALE_CODES.indexOf(a as never) - LOCALE_CODES.indexOf(b as never))) {
    for (const file of files(root, locale)) {
      const where = `${locale}/${file}`;
      const data = read(root, locale, file);
      const schema = CONTENT_SCHEMAS[file.replace(/\.json$/, '')];
      if (schema && !schema.safeParse(data).success) problems.push(`${where} does not match its schema`);
      textProblems(where, data, '', false, problems);
      if (data && typeof data === 'object' && !Array.isArray(data) && data.kind === 'industry-story') {
        const b = data.illustrativeBusiness;
        if (!b || typeof b !== 'object' || Array.isArray(b) || b.label !== true) problems.push(`${where} has no labelled illustrative business`);
      }
    }
  }
  if (mode === 'production') {
    problems.push(...translationGaps(root).filter((g) => isLocale(g.split('/')[0] ?? '') && localeIndexed(g.split('/')[0] as never)));
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = checkContent('content');
  const gaps = translationGaps('content');
  if (gaps.length) console.warn(`${gaps.length} translation gaps (draft languages fall back to English).`);
  for (const p of problems) console.error(p);
  if (problems.length) process.exit(1);
  console.log('Content checks passed.');
}
