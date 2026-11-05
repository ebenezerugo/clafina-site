import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

function exists(outDir: string, href: string): boolean {
  const clean = decodeURIComponent(href.split(/[?#]/)[0] ?? '/');
  const target = join(outDir, clean);
  if (existsSync(target) && statSync(target).isFile()) return true;
  return existsSync(join(target, 'index.html'));
}

/** Internal links in the built site that point at nothing. */
export function checkLinks(outDir: string): string[] {
  const problems: string[] = [];
  for (const file of htmlFiles(outDir).sort()) {
    const html = readFileSync(file, 'utf8');
    for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
      const href = m[1]!;
      if (!href.startsWith('/') || href.startsWith('//')) continue;
      if (!exists(outDir, href)) problems.push(`${relative(outDir, file)} links to ${href}, which does not exist`);
    }
  }
  return [...new Set(problems)];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = checkLinks(process.argv[2] ?? 'out');
  for (const p of problems) console.error(p);
  if (problems.length) process.exit(1);
  console.log('No broken internal links.');
}
