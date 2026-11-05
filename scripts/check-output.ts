import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

/** Problems with the built site folder; an empty list means it is safe to deploy. */
export function checkOutput(dir: string): string[] {
  if (!existsSync(dir)) return ['out/ does not exist: run the build first'];
  const problems: string[] = [];
  for (const forbidden of ['docs', 'brand']) {
    if (existsSync(join(dir, forbidden))) problems.push(`out/ must not contain ${forbidden}/`);
  }
  const markdown = walk(dir).map((f) => relative(dir, f)).filter((f) => f.endsWith('.md')).sort();
  if (markdown.length) problems.push(`out/ must not contain Markdown files: ${markdown.join(', ')}`);
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = checkOutput(process.argv[2] ?? 'out');
  for (const p of problems) console.error(p);
  if (problems.length) process.exit(1);
  console.log('out/ is clean');
}
