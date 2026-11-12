import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** A drawn frame, read at build time from public/illustrations (written by scripts/draw-illustrations.mjs). */
export function readFrame(story: string, frame: string): string {
  return readFileSync(join(process.cwd(), 'public', 'illustrations', story, `${frame}.svgf`), 'utf8');
}

/** Where the browser fetches a frame from, for the story player. */
export const frameUrl = (story: string) => `/illustrations/${story}`;
