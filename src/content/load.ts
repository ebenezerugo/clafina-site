import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { z } from 'zod';
import type { Locale } from '@/config/locales';

/** Reads content/<locale>/<id>.json, falling back to English, and checks its shape. */
export function loadContent<T>(locale: Locale, id: string, schema: z.ZodType<T>, root = 'content'): T {
  const own = join(root, locale, `${id}.json`);
  const path = existsSync(own) ? own : join(root, 'en', `${id}.json`);
  if (!existsSync(path)) throw new Error(`Missing content: ${path}`);
  const parsed = schema.safeParse(JSON.parse(readFileSync(path, 'utf8')));
  if (!parsed.success) throw new Error(`Invalid content in ${path}: ${parsed.error.message}`);
  return parsed.data;
}
