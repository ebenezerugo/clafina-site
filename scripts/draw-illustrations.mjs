/**
 * Draws the illustrated stories into finished SVG, so pages ship pictures and no drawing code.
 * Names and amounts are tokens: each is drawn with the global profile inside a <tspan data-tk>, which the browser
 * swaps for the visitor's country. Run: npx tsx scripts/draw-illustrations.mjs (also part of prebuild). Output: public/illustrations/<story>/<frame>.svgf.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { LIGHT, lightFor } from '../illustrations/kit.mjs';
import { tokenMarkup } from '../src/profiles/tokens';
import { SCENES as QUO } from '../illustrations/stories/quo-0221.mjs';
import { SCENES as FARM } from '../illustrations/stories/farm.mjs';

/** The scenes of each story, in order, with the clock time each one shows. */
const STORIES = {
  'quo-0221': {
    scenes: QUO,
    frames: [
      ['write', 'Mon 09:02'], ['envelope', 'Mon 09:04'], ['counter', 'Mon 09:15'], ['agree', 'Mon 09:20'], ['invoice', 'Mon 09:22'],
      ['approve', 'Mon 10:05'], ['pick', 'Mon 13:30'], ['road', 'Tue 14:30'], ['road-bike', 'Tue 14:30'], ['sign', 'Tue 16:05'],
      ['pay', 'Wed 10:12'], ['receipt', 'Wed 10:12'],
    ],
  },
  farm: {
    scenes: FARM,
    // Outdoors the sky already carries the hour, so these frames take no extra light wash.
    light: false,
    frames: [['dawn', 'Wed 06:00'], ['scout', 'Wed 08:20'], ['rain', 'Wed 09:00'], ['harvest', 'Wed 10:00'], ['broilers', 'Wed 12:00'], ['pickers', 'Wed 15:00'], ['outgrowers', 'Wed 16:00'], ['trace', 'Wed 17:30']],
  },
};

/** Gradients and filters get ids unique to their frame, so many frames can share a page. */
function scopeIds(svg, prefix) {
  const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  for (const id of new Set(ids)) {
    svg = svg.replaceAll(`id="${id}"`, `id="${prefix}-${id}"`).replaceAll(`url(#${id})`, `url(#${prefix}-${id})`);
  }
  return svg;
}
const squeeze = (svg) => svg.replace(/\n\s*/g, ' ').replace(/\s{2,}/g, ' ').replace(/> </g, '><').trim();

for (const [name, story] of Object.entries(STORIES)) {
  const dir = `public/illustrations/${name}`;
  mkdirSync(dir, { recursive: true });
  let total = 0;
  for (const [frame, time] of story.frames) {
    const [scene, variant] = frame.split('-');
    const svg = story.scenes[scene](time, variant === 'bike' ? 'bike' : 'van') + (story.light === false ? '' : LIGHT[lightFor(time)]);
    const body = tokenMarkup(squeeze(scopeIds(svg, `${name}-${frame}`)), 'tspan').replaceAll('JetBrains Mono, monospace', 'ui-monospace, SFMono-Regular, Menlo, monospace');
    // A fragment, not a document: the page puts it inside its own <svg> so the page's motion styles reach it.
    writeFileSync(`${dir}/${frame}.svgf`, body);
    total += body.length;
  }
  console.log(`${name}: ${story.frames.length} frames, ${Math.round(total / 1024)} KB`);
}
