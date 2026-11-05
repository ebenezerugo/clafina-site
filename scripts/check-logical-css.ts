import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPLACE: [RegExp, string][] = [
  [/^ml-/, 'ms-'], [/^mr-/, 'me-'], [/^pl-/, 'ps-'], [/^pr-/, 'pe-'],
  [/^left-/, 'start-'], [/^right-/, 'end-'],
  [/^rounded-l(?=$|-)/, 'rounded-s'], [/^rounded-r(?=$|-)/, 'rounded-e'],
  [/^border-l(?=$|-)/, 'border-s'], [/^border-r(?=$|-)/, 'border-e'],
  [/^text-left$/, 'text-start'], [/^text-right$/, 'text-end'],
];

const CLASS_ATTR = /className=(?:"([^"]*)"|\{`([^`]*)`\}|\{'([^']*)'\}|\{"([^"]*)"\})/g;

/** Physical-direction Tailwind classes in className attributes; Arabic needs logical ones. */
export function checkLogicalCss(files: string[]): string[] {
  const problems: string[] = [];
  for (const file of files) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      for (const m of line.matchAll(CLASS_ATTR)) {
        const value = m.slice(1).find((g) => g !== undefined) ?? '';
        for (const cls of value.split(/\s+/).filter(Boolean)) {
          const parts = cls.split(':');
          const base = (parts.pop() ?? '').replace(/^-/, '');
          const rule = REPLACE.find(([re]) => re.test(base));
          if (rule) {
            const prefix = parts.length ? `${parts.join(':')}:` : '';
            problems.push(`${file}:${i + 1} uses ${cls}; use ${prefix}${cls.slice(prefix.length).replace(base, base.replace(rule[0], rule[1]))}`);
          }
        }
      }
    });
  }
  return problems;
}

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.(tsx|ts)$/.test(name) ? [path] : [];
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = checkLogicalCss(['app', 'src'].flatMap(sources));
  for (const p of problems) console.error(p);
  if (problems.length) process.exit(1);
  console.log('No physical-direction classes.');
}
