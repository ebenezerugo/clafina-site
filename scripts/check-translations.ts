import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCALE_CODES } from '../src/config/locales';

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

/** Keys whose values are identifiers, not words: a translation must leave them exactly as in English. */
const FIXED = new Set(['kind', 'sources', 'screen', 'route', 'routes', 'id', 'slug', 'page', 'module', 'article', 'href', 'claim', 'prelaunch', 'currency', 'core', 'illustrative', 'email', 'status', 'updated', 'modules', 'related', 'industries', 'surfaces', 'items', 'plan', 'taxRate', 'qty', 'price', 'number', 'frame']);
const placeholders = (s: string) => [...s.matchAll(/\{[a-zA-Z]+\}/g)].map((m) => m[0]).sort().join(',');
const protectedTerms: string[] = JSON.parse(readFileSync('content/protected-terms.json', 'utf8')).neverTranslate;

/** Compares a translation with its English file: same shape, no new keys, identifiers and placeholders untouched. */
export function compare(en: Json, tr: Json, path: string, out: string[]): void {
  if (tr === undefined) return; // a missing key falls back to English
  const key = path.split('.').pop()!.replace(/\[\d+\]$/, '');
  if (typeof en === 'string') {
    if (typeof tr !== 'string') { out.push(`${path} should be text`); return; }
    if (FIXED.has(key) && tr !== en) out.push(`${path} is an identifier and must stay "${en}"`);
    if (placeholders(en) !== placeholders(tr)) out.push(`${path} must keep the placeholders ${placeholders(en) || '(none)'}`);
    for (const term of protectedTerms) if (en.includes(term) && !tr.includes(term)) out.push(`${path} must keep "${term}" as it is`);
    return;
  }
  if (typeof en !== 'object' || en === null) { if (tr !== en) out.push(`${path} must stay ${JSON.stringify(en)}`); return; }
  if (Array.isArray(en)) {
    if (!Array.isArray(tr)) { out.push(`${path} should be a list`); return; }
    if (tr.length !== en.length) out.push(`${path} has ${tr.length} items; English has ${en.length}`);
    en.forEach((v, i) => compare(v, tr[i] as Json, `${path}[${i}]`, out));
    return;
  }
  if (typeof tr !== 'object' || tr === null || Array.isArray(tr)) { out.push(`${path} should be an object`); return; }
  for (const k of Object.keys(tr)) if (!(k in en)) out.push(`${path ? `${path}.` : ''}${k} is not in English`);
  for (const [k, v] of Object.entries(en)) compare(v, (tr as Record<string, Json>)[k], path ? `${path}.${k}` : k, out);
}

function files(dir: string, rel = ''): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? files(join(dir, d.name), `${rel}${d.name}/`) : d.name.endsWith('.json') ? [`${rel}${d.name}`] : []));
}

export function checkTranslations(): string[] {
  const problems: string[] = [];
  const read = (p: string) => JSON.parse(readFileSync(p, 'utf8')) as Json;
  for (const locale of LOCALE_CODES.filter((l) => l !== 'en')) {
    const msg = join('messages', `${locale}.json`);
    if (existsSync(msg)) { const out: string[] = []; compare(read('messages/en.json'), read(msg), '', out); problems.push(...out.map((p) => `messages/${locale}.json ${p}`)); }
    for (const f of files(join('content', locale))) {
      const en = join('content', 'en', f);
      if (!existsSync(en)) { problems.push(`content/${locale}/${f} has no English file`); continue; }
      const out: string[] = [];
      compare(read(en), read(join('content', locale, f)), '', out);
      problems.push(...out.map((p) => `content/${locale}/${f} ${p}`));
    }
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = checkTranslations();
  for (const p of problems) console.error(p);
  if (problems.length) process.exit(1);
  console.log('Translations match their English files.');
}
