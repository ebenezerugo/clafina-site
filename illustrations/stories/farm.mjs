/** A day at Greenvale Family Farms: fields at sunrise, scouting, a rain day, harvest, the broiler house, pickers, outgrowers, a traced lot. */
import { INK, C, O, B, person, callout, bubble, hand, handAt } from '../kit.mjs';

/** Where a person's phone is, for the callout's pointer. */
const at = (x, y, pose, flip = false) => { const [hx, hy] = handAt(x, y, pose, 'R', 1, flip); return [hx, hy - 16]; };

/* ---------- The farm world ---------- */
const SKIES = {
  dawn: ['#ffd8a8', '#ffeccf', '#fff6e6'], day: ['#8ec5ff', '#c3e0ff', '#eef6ff'], storm: ['#5b6b86', '#7d8ca6', '#a8b4c8'], dusk: ['#ff9a62', '#ffc58f', '#ffe6c4'],
};
function sky(kind, id) {
  const [a, b, c] = SKIES[kind];
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><rect width="800" height="450" fill="url(#${id})"/>`;
}
function sun(x, y, r, col = '#ffd166', rise = false) {
  return `<g transform="translate(${x} ${y})"><g class="${rise ? 'sunrise' : 'bob'}"><g class="rays">${Array.from({ length: 12 }, (_, i) => `<rect x="-3" y="${-r - 26}" width="6" height="16" rx="3" fill="${col}" opacity=".8" transform="rotate(${i * 30})"/>`).join('')}</g>
    <circle r="${r + 12}" fill="${col}" opacity=".25"/><circle r="${r}" fill="${col}" ${O}/></g></g>`;
}
const cloud = (x, y, s = 1, col = '#fff', cls = 'drift') => `<g class="${cls}"><g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 q8 -26 36 -16 q16 -24 44 -6 q28 -6 30 18 q2 18 -22 18 h-76 q-22 0 -12 -14z" fill="${col}" ${B}/></g></g>`;
/** Rolling hills with field stripes, back to front. */
function hills(tint = 0) {
  const g = (c) => tint ? shadeHex(c, tint) : c;
  return `<path d="M0 250 C120 205 230 225 330 215 C450 200 560 185 800 220 V450 H0Z" fill="${g('#a9d18e')}" ${B}/>
    <path d="M0 290 C160 250 300 270 420 262 C560 252 680 240 800 262 V450 H0Z" fill="${g('#86bf6a')}" ${B}/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${-20 + i * 140} 300 C${40 + i * 140} 286 ${90 + i * 140} 284 ${130 + i * 140} 292" fill="none" stroke="${g('#6aa654')}" stroke-width="3" stroke-linecap="round" opacity=".6"/>`).join('')}
    <path d="M0 340 C180 312 360 330 520 322 C640 316 720 312 800 322 V450 H0Z" fill="${g('#d9b26a')}" ${B}/>
    ${Array.from({ length: 9 }, (_, i) => `<path d="M${-40 + i * 100} 450 L${120 + i * 70} 330" stroke="${g('#c79a52')}" stroke-width="3" opacity=".7"/>`).join('')}`;
}
function shadeHex(hex, amt) {
  const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(v * (1 + amt))));
  return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('');
}
/** One maize plant, roots at (x, y). */
function maize(x, y, s = 1, delay = 0, cob = true) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="sway" style="animation-delay:${delay}s">
    <path d="M0 0 C-2 -40 2 -80 0 -118" fill="none" stroke="#4d8b3a" stroke-width="5" stroke-linecap="round"/>
    <path d="M0 -26 C-22 -40 -40 -36 -52 -22 C-36 -30 -18 -28 0 -20Z" fill="#5ea548" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M0 -50 C22 -66 42 -60 54 -44 C38 -54 20 -52 0 -44Z" fill="#6cb653" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M0 -78 C-18 -96 -36 -94 -46 -82 C-30 -88 -16 -86 0 -72Z" fill="#5ea548" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M0 -118 l-6 -14 M0 -118 l0 -16 M0 -118 l7 -13" stroke="#d6b04c" stroke-width="2.4" stroke-linecap="round"/>
    ${cob ? `<g transform="translate(5 -64) rotate(18)"><ellipse rx="6" ry="15" fill="#f5c542" stroke="${INK}" stroke-width="1.6"/><path d="M-6 -2 C-12 6 -8 16 0 16 C-4 8 -2 2 -6 -2Z" fill="#7cbf5c" stroke="${INK}" stroke-width="1.2"/></g>` : ''}
  </g></g>`;
}
const maizeRow = (x0, y, n, gap, s = 1, cob = true) => Array.from({ length: n }, (_, i) => maize(x0 + i * gap, y + (i % 2) * 3, s, (i % 5) * .3, cob)).join('');
function barn(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 V-90 L60 -138 L120 -90 V0Z" fill="#c0392b" ${O}/><path d="M-8 -86 L60 -146 L128 -86" fill="none" stroke="#f8fafc" stroke-width="7" stroke-linejoin="round"/>
    <rect x="34" y="-62" width="52" height="62" fill="#a93226" ${O} stroke-width="2"/><path d="M34 -62 L86 0 M86 -62 L34 0" stroke="#f8fafc" stroke-width="4"/><rect x="48" y="-112" width="24" height="20" fill="#fde68a" ${O} stroke-width="2"/></g>`;
}
function silo(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="0" y="-150" width="46" height="150" fill="#cfd8e3" ${O}/>${[1, 2, 3, 4].map((i) => `<path d="M0 ${-150 + i * 30} H46" stroke="#9aa8ba" stroke-width="2"/>`).join('')}<path d="M-2 -150 Q23 -182 48 -150Z" fill="#b5c1d0" ${O}/></g>`;
}
function tractor(x, y, s = 1, { sprayer = false, cls = '' } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})" class="${cls}">
    ${sprayer ? `<rect x="-120" y="-58" width="70" height="36" rx="6" fill="#e8eef6" ${O}/><path d="M-170 -26 H-40" stroke="${INK}" stroke-width="4"/>${[-160, -140, -120, -100, -80, -60].map((nx) => `<path d="M${nx} -26 v6" stroke="${INK}" stroke-width="3"/>`).join('')}` : ''}
    <path d="M-40 -40 H60 L70 -74 H10 L4 -40" fill="#2e9e4f" ${O}/><rect x="14" y="-118" width="54" height="46" rx="5" fill="#a7d3f5" ${O}/><path d="M10 -120 H72" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <rect x="-48" y="-42" width="58" height="18" rx="4" fill="#2e9e4f" ${O}/><rect x="-40" y="-70" width="8" height="28" fill="#4b5568" ${O} stroke-width="2"/>
    <g transform="translate(50 -20)"><circle r="30" fill="#2b2f3f" ${O}/><circle r="12" fill="#f5c542" ${O} stroke-width="2"/></g>
    <g transform="translate(-24 -12)"><circle r="16" fill="#2b2f3f" ${O}/><circle r="6" fill="#f5c542" stroke="${INK}" stroke-width="1.6"/></g></g>`;
}
function combine(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-150" y="-36" width="70" height="26" rx="4" fill="#f5c542" ${O}/>${Array.from({ length: 7 }, (_, i) => `<path d="M${-146 + i * 10} -36 v26" stroke="${INK}" stroke-width="1.6"/>`).join('')}
    <path d="M-80 -24 H-60 V-40" stroke="${INK}" stroke-width="4" fill="none"/><path d="M-60 -20 V-96 H60 V-20Z" fill="#2e9e4f" ${O}/><rect x="-46" y="-138" width="56" height="44" rx="5" fill="#a7d3f5" ${O}/><path d="M60 -90 L120 -128" stroke="#2e9e4f" stroke-width="12" stroke-linecap="round"/><path d="M60 -90 L120 -128" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" opacity=".3"/>
    <g transform="translate(34 -14)"><circle r="26" fill="#2b2f3f" ${O}/><circle r="10" fill="#f5c542" stroke="${INK}" stroke-width="1.6"/></g><g transform="translate(-36 -10)"><circle r="18" fill="#2b2f3f" ${O}/><circle r="7" fill="#f5c542" stroke="${INK}" stroke-width="1.6"/></g></g>`;
}
function chicken(x, y, s = 1, flip = false, delay = 0) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"><g class="peck" style="animation-delay:${delay}s"><ellipse cx="0" cy="-16" rx="18" ry="14" fill="#fff" ${O} stroke-width="2"/><path d="M-16 -22 L-26 -34 L-14 -28Z" fill="#fff" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="14" cy="-30" r="9" fill="#fff" ${O} stroke-width="2"/><path d="M12 -40 q3 -6 6 0 q3 -6 5 1" fill="#e11d48" stroke="${INK}" stroke-width="1.2"/><path d="M22 -30 L29 -28 L22 -25Z" fill="#f59e0b" stroke="${INK}" stroke-width="1.2"/><circle cx="16" cy="-31" r="1.6" fill="${INK}"/>
    <path d="M-4 -2 v6 M4 -2 v6" stroke="#f59e0b" stroke-width="2.4" stroke-linecap="round"/></g></g>`;
}
const sack = (x, y, label = '', s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-20 0 C-26 -30 -20 -50 -12 -56 L12 -56 C20 -50 26 -30 20 0Z" fill="#e8d3a8" ${O} stroke-width="2"/><path d="M-12 -56 Q0 -64 12 -56" fill="none" stroke="${INK}" stroke-width="2"/>${label ? `<text y="-24" text-anchor="middle" font-size="7" font-weight="900" fill="#7a4b1e">${label}</text>` : ''}</g>`;
function rain(intensity = 60) {
  return `<g class="rainfall">${Array.from({ length: intensity }, (_, i) => { const x = (i * 53) % 820, y = (i * 97) % 470 - 470; return `<path d="M${x} ${y} l-8 22" stroke="#dbeafe" stroke-width="2.4" stroke-linecap="round" opacity=".85"/><path d="M${x} ${y + 470} l-8 22" stroke="#dbeafe" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>`; }).join('')}</g>`;
}
const puddle = (x, y, w) => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w / 6}" fill="#9fb3cc" ${B}/><ellipse class="ripple" cx="${x}" cy="${y}" rx="${w / 2}" ry="${w / 12}" fill="none" stroke="#e5edf7" stroke-width="2"/>`;
function caterpillar(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="crawl">${[0, 1, 2, 3, 4].map((i) => `<circle cx="${i * 12}" cy="${i % 2 ? -3 : 0}" r="8" fill="${i === 4 ? '#6b4f2a' : '#8a6a3b'}" stroke="${INK}" stroke-width="1.6"/>`).join('')}<circle cx="50" cy="-4" r="2" fill="#fff"/></g></g>`;
}
function weighbridge(x, y) {
  return `<g transform="translate(${x} ${y})"><rect x="-130" y="-8" width="260" height="14" rx="3" fill="#94a3b8" ${O}/>${[-110, -60, -10, 40, 90].map((i) => `<path d="M${i} -8 v14" stroke="${INK}" stroke-width="1.6"/>`).join('')}
    <g transform="translate(170 -6)"><rect x="-6" y="-110" width="12" height="110" fill="#64748b" ${O} stroke-width="2"/><rect x="-46" y="-160" width="92" height="56" rx="8" fill="#1f2937" ${O}/><rect x="-38" y="-152" width="76" height="30" rx="4" fill="#0f172a"/><text class="count" x="0" y="-131" text-anchor="middle" font-size="17" font-family="ui-monospace, Menlo, monospace" font-weight="700" fill="#34d399">2,480 kg</text></g></g>`;
}
function pickup(x, y, sacks = 6) {
  return `<g transform="translate(${x} ${y})"><path d="M-120 -30 H40 V-58 L74 -58 L96 -30 H110 V-6 H-120Z" fill="#3b82c4" ${O}/><path d="M46 -54 L70 -54 L86 -32 H46Z" fill="#c7e0f7" ${O} stroke-width="2"/>
    ${Array.from({ length: sacks }, (_, i) => sack(-104 + (i % 4) * 34, -28 - Math.floor(i / 4) * 30, '', .62)).join('')}
    <g transform="translate(-74 0)"><circle r="18" fill="#2b2f3f" ${O}/><circle r="7" fill="#cbd5e1" stroke="${INK}" stroke-width="1.6"/></g><g transform="translate(70 0)"><circle r="18" fill="#2b2f3f" ${O}/><circle r="7" fill="#cbd5e1" stroke="${INK}" stroke-width="1.6"/></g></g>`;
}
function henhouse(x, y) {
  return `<g transform="translate(${x} ${y})"><path d="M0 0 V-120 H380 V0Z" fill="#f4ead8" ${O}/><path d="M-14 -118 L190 -176 L394 -118Z" fill="#9aa8ba" ${O}/>${Array.from({ length: 6 }, (_, i) => `<rect x="${24 + i * 60}" y="-96" width="38" height="24" rx="3" fill="#cfe3f5" stroke="${INK}" stroke-width="1.8"/>`).join('')}
    <text x="190" y="-138" text-anchor="middle" font-size="13" font-weight="900" letter-spacing="2" fill="#334155">BROILER HOUSE 2</text></g>`;
}

/* ---------- Scenes ---------- */
export const SCENES = {
  dawn: (t) => `${sky('dawn', 'fd1')}${sun(600, 150, 40, '#ffb347', true)}${cloud(80, 80, .9)}${cloud(380, 56, .7)}
    ${hills()}${barn(560, 300, .8)}${silo(668, 300, .8)}
    ${maizeRow(30, 420, 7, 46, .8)}
    <g transform="translate(40 388)"><rect x="0" y="0" width="120" height="10" fill="#8a5a3b" ${O}/><rect x="8" y="10" width="9" height="36" fill="#6b4226" ${O} stroke-width="2"/><rect x="103" y="10" width="9" height="36" fill="#6b4226" ${O} stroke-width="2"/></g>
    ${person('anna', 230, 440, { pose: 'look', hold: 'phoneBack', look: 3 })}
    <g transform="translate(90 388)"><path d="M-10 -22 H10 V-4 Q10 0 6 0 H-6 Q-10 0 -10 -4Z" fill="#fff" ${O} stroke-width="2"/><path class="steam" d="M-2 -28 Q-6 -36 -2 -42" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g>
    ${callout(330, 60, 260, 176, `<text font-size="9" font-weight="800" letter-spacing="1.1" fill="#3d4a66">GREENVALE · TODAY</text>
      ${[['Land in season', '412 ha'], ['Cost a hectare', 'under plan by 7%'], ['Rain', 'Wed, 18 mm'], ['Waiting', '2 tasks need you']].map(([k, v], i) => `<text y="${24 + i * 22}" font-size="9.5" fill="#6b7590">${k}</text><text x="228" y="${24 + i * 22}" text-anchor="end" font-size="10" font-weight="700" fill="${INK}">${v}</text>`).join('')}
      <rect y="100" width="228" height="20" rx="6" fill="#ecfdf5"/><text x="8" y="114" font-size="9" font-weight="700" fill="${C.green}">✓ All flocks recorded yesterday</text>`, ...at(230, 440, 'look'), { title: 'Clafina · Farm home' })}
    ${bubble(40, 150, 170, 50, 'Good morning, farm.', { tail: 'right', delay: 1.2, size: 21 })}`,

  scout: (t) => `${sky('day', 'fs1')}${sun(80, 70, 28)}${cloud(520, 60, .8)}
    <path d="M0 230 C200 210 600 220 800 206 V450 H0Z" fill="#9ccc7c" ${B}/>
    ${maizeRow(-20, 300, 18, 46, .9, false)}
    <rect x="0" y="330" width="800" height="120" fill="#c79a52"/>
    <g transform="translate(560 430) scale(2.4)">${maize(0, 0, 1, 0, false)}</g>
    ${caterpillar(530, 266, 1.2)}<circle cx="560" cy="270" r="40" fill="none" stroke="${C.red}" stroke-width="4" stroke-dasharray="6 6" class="pop" style="animation-delay:.6s"/>
    ${person('hana', 330, 440, { pose: 'show', hold: 'phoneOut', look: 4, mood: 'focus' })}
    ${callout(40, 60, 240, 170, `<text font-size="9" font-weight="800" letter-spacing="1.1" fill="#3d4a66">SCOUTING · ROAD FIELD</text>
      <text y="22" font-size="12" font-weight="800" fill="${INK}">Fall armyworm</text>
      ${[['Severity', 'Moderate, 14%'], ['Photos', '3 · 08:20'], ['Weather', 'Dry today']].map(([k, v], i) => `<text y="${44 + i * 18}" font-size="9.5" fill="#6b7590">${k}</text><text x="208" y="${44 + i * 18}" text-anchor="end" font-size="10" font-weight="700" fill="${INK}">${v}</text>`).join('')}
      <rect class="pop" style="animation-delay:1.6s" y="96" width="208" height="22" rx="6" fill="#fef3c7"/><text class="pop" style="animation-delay:1.6s" x="8" y="111" font-size="9" font-weight="700" fill="#a15c07">Task created: treat Road Field</text>`, ...at(330, 440, 'show'), { title: 'Clafina · Scouting', delay: .3 })}
    ${hand(640, 214, 'gotcha!', 34, C.red, 'pop', 1, -8)}`,

  rain: (t) => `${sky('storm', 'fr1')}${cloud(40, 70, 1.4, '#7b879b', 'drift')}${cloud(330, 50, 1.6, '#6b778c', 'drift')}${cloud(600, 80, 1.3, '#7b879b', 'drift')}
    <g class="flash"><path d="M520 40 L496 110 L516 110 L492 180" fill="none" stroke="#fef08a" stroke-width="6" stroke-linejoin="round"/></g>
    ${hills(-.25)}
    ${barn(80, 352, 1.1)}<path d="M200 352 V266 H420 V352" fill="none" stroke="#6b4226" stroke-width="8"/><path d="M186 270 L310 238 L434 270Z" fill="#8b5e3c" ${O}/>
    ${tractor(330, 352, .92, { sprayer: true })}
    ${puddle(560, 400, 70)}${puddle(700, 430, 46)}${puddle(180, 430, 40)}
    ${person('hanaRain', 620, 400, { pose: 'look', hold: 'phoneBack', look: -3 })}
    ${rain(70)}
    ${callout(30, 40, 250, 170, `<text font-size="9" font-weight="800" letter-spacing="1.1" fill="#3d4a66">CALENDAR · SPRAY CHECK</text>
      <text y="22" font-size="11" font-weight="800" fill="${INK}">Foliar spray, West Field</text>
      <rect y="34" width="218" height="24" rx="6" fill="#fee2e2"/><text x="8" y="50" font-size="9.5" font-weight="700" fill="${C.red}">Wed · rain 18 mm · no spray</text>
      <g class="pop" style="animation-delay:1.4s"><rect y="66" width="218" height="24" rx="6" fill="#dcfce7"/><text x="8" y="82" font-size="9.5" font-weight="700" fill="${C.green}">Moved to Thu · first dry day</text></g>
      <text y="110" font-size="9" fill="#6b7590">Farm rule: no spray within 12 h of rain</text>`, ...at(620, 400, 'look'), { title: 'Clafina · Calendar', delay: .2 })}`,

  harvest: (t) => `${sky('day', 'fh1')}${sun(700, 70, 30)}${cloud(120, 60, .8)}${cloud(420, 90, .6)}
    <path d="M0 250 C240 220 520 236 800 222 V450 H0Z" fill="#e3c26b" ${B}/>
    ${maizeRow(380, 340, 10, 44, .9)}
    <rect x="0" y="340" width="800" height="110" fill="#c79a52"/>
    ${combine(330, 372, .95)}
    <g transform="translate(520 330)"><g class="pop" style="animation-delay:.6s"><rect x="-6" y="0" width="12" height="70" fill="#64748b" ${O} stroke-width="2"/><path d="M-38 -38 L0 -76 L38 -38 L0 0Z" fill="${C.amber}" ${O}/><text y="-30" text-anchor="middle" font-size="18" font-weight="900" fill="${INK}">!</text></g></g>
    ${person('anna', 640, 420, { pose: 'look', hold: 'phoneBack', look: -3, mood: 'focus' })}
    ${callout(486, 34, 260, 170, `<text font-size="9" font-weight="800" letter-spacing="1.1" fill="#3d4a66">HARVEST · DAM FIELD</text>
      <text y="22" font-size="11" font-weight="800" fill="${INK}">Sprayed last Tuesday</text>
      <rect y="34" width="228" height="26" rx="6" fill="#fef3c7"/><text x="8" y="51" font-size="9.5" font-weight="700" fill="#a15c07">Waiting period: 4 more days</text>
      <g class="pop" style="animation-delay:1.6s"><rect y="70" width="228" height="26" rx="6" fill="#eef2ff"/><text x="8" y="87" font-size="9.5" font-weight="700" fill="${C.blue}">Harvest moved to Mon, Hilltop first</text></g>`, ...at(640, 420, 'look'), { title: 'Clafina · Harvest', delay: .2 })}
    ${bubble(250, 80, 190, 52, 'Hilltop first, then.', { tail: 'right', delay: 2.2, size: 22 })}`,

  broilers: (t) => `${sky('day', 'fb1')}${cloud(140, 60, .8)}
    <path d="M0 260 C240 240 560 250 800 236 V450 H0Z" fill="#a9d18e" ${B}/>
    ${henhouse(380, 340)}
    <rect x="0" y="340" width="800" height="110" fill="#e9dcc0"/>
    ${[[120, 400], [180, 420], [240, 395], [90, 440], [300, 430], [520, 410], [600, 440], [690, 420], [760, 400]].map(([x, y], i) => chicken(x, y, .95, i % 2 === 0, i * .2)).join('')}
    ${person('samuel', 420, 440, { pose: 'look', hold: 'phoneBack', look: -3, mood: 'focus' })}
    ${callout(40, 40, 260, 180, `<text font-size="9" font-weight="800" letter-spacing="1.1" fill="#3d4a66">BATCH B-14 · DAILY RECORD</text>
      ${[['Birds', '4,812'], ['Deaths today', '23'], ['Cause', 'Heat stress'], ['Feed issued', '610 kg']].map(([k, v], i) => `<text y="${22 + i * 20}" font-size="9.5" fill="#6b7590">${k}</text><text x="228" y="${22 + i * 20}" text-anchor="end" font-size="10" font-weight="700" fill="${i === 1 ? C.red : INK}">${v}</text>`).join('')}
      <rect class="pop" style="animation-delay:1.4s" y="96" width="228" height="22" rx="6" fill="#fee2e2"/><text class="pop" style="animation-delay:1.4s" x="8" y="111" font-size="9" font-weight="700" fill="${C.red}">Above the usual 6 a day · vet told</text>`, ...at(420, 440, 'look'), { title: 'Clafina · Flock', delay: .2 })}
    ${hand(150, 300, 'bawk!', 30, '#a15c07', 'pop', 1, -10)}`,

  pickers: (t) => `${sky('day', 'fp1')}${sun(80, 80, 32)}${cloud(400, 50, .8)}
    <path d="M0 210 C200 170 480 190 800 170 V450 H0Z" fill="#9ccc7c" ${B}/>
    <path d="M0 300 C220 260 520 280 800 262 V450 H0Z" fill="#86bf6a" ${B}/>
    ${maizeRow(560, 330, 6, 42, .75)}
    ${person('pick1', 150, 410, { pose: 'carry', mood: 'grin' })}<g transform="translate(150 410)">${sack(0, -58, 'MAIZE', 1)}</g>
    ${person('pick2', 290, 420, { pose: 'wave', mood: 'grin' })}
    ${[0, 1, 2, 3, 4, 5].map((i) => sack(360 + (i % 3) * 40, 420 - Math.floor(i / 3) * 44, i === 0 ? 'MAIZE' : '', .9)).join('')}
    ${person('hana', 560, 430, { pose: 'look', hold: 'phoneBack', look: -3 })}
    ${callout(470, 40, 290, 190, `<text font-size="9" font-weight="800" letter-spacing="1.1" fill="#3d4a66">PIECE WORK · HILLTOP</text>
      ${[['Pickers', '12'], ['Bags today', '486'], ['Rate', 'a bag, from the contract'], ['Charged to', 'Maize 2026 · Hilltop']].map(([k, v], i) => `<text y="${22 + i * 20}" font-size="9.5" fill="#6b7590">${k}</text><text x="258" y="${22 + i * 20}" text-anchor="end" font-size="10" font-weight="700" fill="${INK}">${v}</text>`).join('')}
      <g class="press" style="animation-delay:1.6s"><rect y="100" width="258" height="30" rx="9" fill="${C.green}"/><text x="129" y="120" text-anchor="middle" font-size="11" font-weight="900" fill="#fff">Sign off and pay</text></g>`, ...at(560, 430, 'look'), { title: 'Clafina · Labour', delay: .2 })}
    ${bubble(230, 120, 150, 50, '486 bags!', { tail: 'left', delay: .8, size: 26 })}`,

  outgrowers: (t) => `${sky('day', 'fo1')}${cloud(100, 60, .7)}${cloud(500, 80, .9)}
    <path d="M0 250 C240 228 560 240 800 226 V450 H0Z" fill="#b8d99a" ${B}/>
    ${silo(700, 340, .9)}${silo(620, 340, .75)}
    <rect x="0" y="340" width="800" height="110" fill="#d6c7a8"/>
    ${weighbridge(260, 392)}
    <g class="arrive">${pickup(250, 386, 7)}</g>
    ${person('daniel', 560, 430, { pose: 'wave', look: -3 })}
    ${callout(500, 40, 270, 200, `<text font-size="9" font-weight="800" letter-spacing="1.1" fill="#3d4a66">OUTGROWER RECEIPT</text>
      <text y="20" font-size="11" font-weight="800" fill="${INK}">Daniel Ross · 2,480 kg</text>
      ${[['Maize at contract price', '₦1,240,000'], ['Seed advanced', '−₦180,000'], ['Fertiliser advanced', '−₦260,000']].map(([k, v], i) => `<g class="fadein" style="animation-delay:${.6 + i * .4}s"><text y="${42 + i * 18}" font-size="9.5" fill="#6b7590">${k}</text><text x="238" y="${42 + i * 18}" text-anchor="end" font-size="10" font-weight="700" fill="${INK}">${v}</text></g>`).join('')}
      <path d="M0 102 H238" stroke="#d7deec"/><text y="122" font-size="11" font-weight="900" fill="${INK}">To pay</text><text class="pop" style="animation-delay:2s" x="238" y="122" text-anchor="end" font-size="13" font-weight="900" fill="${C.green}">₦800,000</text>`, 480, 252, { title: 'Clafina · Outgrowers', delay: .3 })}`,

  trace: (t) => `${sky('dusk', 'ft1')}${sun(640, 250, 50, '#ff8c42')}${cloud(80, 70, .8, '#ffe2c7')}
    ${hills(-.08)}${barn(80, 320, .8)}${silo(190, 320, .8)}
    <rect x="0" y="352" width="800" height="98" fill="#b4885a"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => sack(260 + (i % 4) * 46, 420 - Math.floor(i / 4) * 50, i === 0 ? 'LOT 7' : '', 1)).join('')}
    ${person('anna', 520, 430, { pose: 'show', hold: 'phoneOut', look: 4 })}
    ${callout(470, 40, 300, 210, `<text font-size="9" font-weight="800" letter-spacing="1.1" fill="#3d4a66">TRACE · MAIZE LOT 7</text>
      ${[['Field', 'West Field, 38 ha'], ['Season', 'Maize 2026'], ['Inputs', '2 sprays, waiting kept'], ['Weigh slips', '14 · 21.6 t'], ['Sold to', 'Riverside Mills']].map(([k, v], i) => `<g class="fadein" style="animation-delay:${.5 + i * .35}s"><circle cx="5" cy="${18 + i * 26}" r="5" fill="${C.green}"/>${i < 4 ? `<path d="M5 ${23 + i * 26} V${39 + i * 26}" stroke="${C.green}" stroke-width="2"/>` : ''}<text x="18" y="${22 + i * 26}" font-size="9.5" fill="#6b7590">${k}</text><text x="268" y="${22 + i * 26}" text-anchor="end" font-size="10" font-weight="700" fill="${INK}">${v}</text></g>`).join('')}`, ...at(520, 430, 'show'), { title: 'Clafina · Traceability', delay: .2 })}
    ${hand(250, 250, 'field to buyer', 30, '#7c2d12', 'fadein', 2.6, -6)}`,
};
