import { createRequire } from 'node:module';
import { join } from 'node:path';
import type { ReactNode } from 'react';
import { ScaledScreenFrame } from './ScaledScreenFrame';

/* The static renderer, loaded at build time from the project's own React. Screens are pure markup (no state, no
   effects), so rendering them to a string is safe; Next.js does not allow importing it directly in a page. */
const load = createRequire(join(process.cwd(), 'package.json'));
const toHtml = (node: ReactNode): string => (load('react-dom/server') as typeof import('react-dom/server')).renderToStaticMarkup(node);

/**
 * A product screen drawn at its design size and shrunk to fit its column. Its contents never change, so they are
 * rendered to HTML here on the server and handed to the frame as one block: the browser does not hydrate them.
 */
export function ScaledScreen({ width, height, label, dir, children }: { width: number; height: number; label: string; dir?: 'ltr' | 'rtl'; children: ReactNode }) {
  return <ScaledScreenFrame width={width} height={height} label={label} dir={dir} html={toHtml(<>{children}</>)} />;
}
