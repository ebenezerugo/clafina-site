import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Locale } from '../config/locales';
import type en from '../../messages/en.json';

export type Messages = typeof en;
type Tree = { [k: string]: string | Tree };

function read(locale: Locale): Tree {
  return JSON.parse(readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf8')) as Tree;
}

function merge(base: Tree, over: Tree): Tree {
  const out: Tree = { ...base };
  for (const [k, v] of Object.entries(over)) {
    const b = base[k];
    out[k] = typeof v === 'object' && typeof b === 'object' ? merge(b, v) : v;
  }
  return out;
}

function keys(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
}

/** The locale's interface strings, with English filling any key it does not have yet. */
export async function loadMessages(locale: Locale): Promise<Messages> {
  const en = read('en');
  return (locale === 'en' ? en : merge(en, read(locale))) as unknown as Messages;
}

/** Dotted keys English has and this locale does not. */
export function missingKeys(locale: Locale): string[] {
  const have = new Set(keys(read(locale)));
  return keys(read('en')).filter((k) => !have.has(k));
}
