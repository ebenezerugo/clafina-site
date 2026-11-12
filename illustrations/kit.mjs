/**
 * The Clafina illustration kit: people on a two-bone rig, places, props, callout screens and light by the hour.
 * Everything returns SVG markup as a string in an 800 x 450 world. Scenes are drawn at build time by
 * scripts/draw-illustrations.mjs, so the site ships finished SVG and none of this code.
 */
const INK = '#1b2033';
const C = { ink: INK, paper: '#ffffff', line: '#d7deec', blue: '#2563eb', violet: '#6d4fe0', teal: '#0f766e', green: '#16a34a', amber: '#f59e0b', red: '#e11d48', wood: '#c48a5c', woodDark: '#8a5a3b' };
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + (amt < 0 ? v * amt : (255 - v) * amt))));
  return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('');
}
const O = `stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"`;

const CAST = {
  ada:   { skin: '#8d5524', shirt: '#6d4fe0', inner: '#ffffff', pants: '#26304f', shoes: '#2b2f3f', hair: 'bun',  hairCol: '#1d1512', top: 'blazer' },
  tunde: { skin: '#5c3a1e', shirt: '#0f766e', inner: '#f5c542', pants: '#3b3f4f', shoes: '#4a3426', hair: 'fade', hairCol: '#14100c', top: 'kaftan', beard: true },
  ngozi: { skin: '#a16a3e', shirt: '#2563eb', inner: '#fbbf24', pants: '#23304f', shoes: '#2b2f3f', hair: 'puff', hairCol: '#1d1512', top: 'blouse' },
  femi:  { sleeve: 'short', skin: '#c68642', shirt: '#9aa3b5', inner: '#f97316', pants: '#2f3a55', shoes: '#3b2a1e', hair: 'cap',  hairCol: '#1d4ed8', top: 'vest' },
  musa:  { sleeve: 'short', skin: '#7a4a2a', shirt: '#334155', inner: '#6d4fe0', pants: '#1e2433', shoes: '#2b2f3f', hair: 'cap',  hairCol: '#0f766e', top: 'polo' },
};

/* ---------- The rig: shoulder and elbow angles in degrees (0 = hanging straight down, positive swings to screen-left) ---------- */
const UPPER = 27, FORE = 25;
const rad = (d) => d * Math.PI / 180;
function joints(a1, a2) {
  const ex = -UPPER * Math.sin(rad(a1)), ey = UPPER * Math.cos(rad(a1));
  return [ex, ey, ex - FORE * Math.sin(rad(a1 + a2)), ey + FORE * Math.cos(rad(a1 + a2))];
}
/* Poses: [left shoulder, left elbow], [right shoulder, right elbow], which arm crosses in front of the body, what the right hand holds. */
const POSES = {
  stand: { L: [12, -6], R: [-12, 6], front: '' },
  type:  { L: [-8, -44], R: [8, 44], Lt: [-14, -72], Rt: [14, -72], front: 'LR' },
  look:  { L: [12, -6], R: [0, 0], Rt: [44, -112], front: 'R' },
  show:  { L: [12, -6], R: [0, 0], Rt: [72, -92], front: 'R' },
  tap:   { L: [12, -6], R: [0, 0], Rt: [76, -98], front: 'R' },
  point: { L: [12, -6], R: [-84, -8], front: 'R' },
  wave:  { L: [12, -6], R: [0, 0], Rt: [62, -170], front: '', wave: 'R' },
  cheer: { L: [0, 0], R: [0, 0], Lt: [-62, -170], Rt: [62, -170], front: '', wave: 'LR' },
  carry: { L: [0, 0], R: [0, 0], Lt: [-30, -80], Rt: [30, -80], front: 'LR' },
  ride:  { L: [0, 0], R: [0, 0], Lt: [44, -84], Rt: [58, -88], front: 'LR' },
};
const SHOULDER = { L: [-27, -114], R: [27, -114] };
/* Two-bone reach: angles that put the hand on (tx, ty), elbow bending outward. */
function ik(side, tx, ty) {
  const [sx, sy] = SHOULDER[side]; const dx = tx - sx, dy = ty - sy;
  const d = Math.min(UPPER + FORE - .5, Math.max(Math.abs(UPPER - FORE) + 1, Math.hypot(dx, dy)));
  const base = Math.atan2(-dx, dy) * 180 / Math.PI;
  const alpha = Math.acos((UPPER * UPPER + d * d - FORE * FORE) / (2 * UPPER * d)) * 180 / Math.PI;
  const a1 = base + (side === 'R' ? -alpha : alpha);
  const ex = -UPPER * Math.sin(rad(a1)), ey = UPPER * Math.cos(rad(a1));
  const a12 = Math.atan2(-(dx - ex), dy - ey) * 180 / Math.PI;
  return [a1, a12 - a1];
}
const angles = (pose, side) => pose[side + 't'] ? ik(side, ...pose[side + 't']) : pose[side];
function limb(side, pose, p, cls) {
  const [a1, a2] = angles(pose, side);
  const [ex, ey, hx, hy] = joints(a1, a2);
  const [sx, sy] = SHOULDER[side];
  const short = p.sleeve === 'short';
  const thumbX = side === 'L' ? 4 : -4;
  return `<g transform="translate(${sx} ${sy})"><g class="${cls}">
    <path d="M0 0 L${ex} ${ey} L${hx} ${hy}" fill="none" stroke="${INK}" stroke-width="17.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${short ? `<path d="M${ex} ${ey} L${hx} ${hy}" fill="none" stroke="${p.skin}" stroke-width="12" stroke-linecap="round"/><path d="M0 0 L${ex * .62} ${ey * .62}" fill="none" stroke="${p.shirt}" stroke-width="13" stroke-linecap="round"/>`
      : `<path d="M0 0 L${ex} ${ey} L${hx} ${hy}" fill="none" stroke="${p.shirt}" stroke-width="12.5" stroke-linecap="round" stroke-linejoin="round"/>
         <path d="M${ex + (hx - ex) * .78} ${ey + (hy - ey) * .78} L${hx} ${hy}" fill="none" stroke="${shade(p.shirt, -.2)}" stroke-width="12.5"/>`}
    <circle cx="${hx}" cy="${hy}" r="8.6" fill="${p.skin}" stroke="${INK}" stroke-width="2.4"/>
    <ellipse cx="${hx + thumbX}" cy="${hy - 4}" rx="3" ry="4.6" fill="${p.skin}" stroke="${INK}" stroke-width="1.8" transform="rotate(${side === 'L' ? -30 : 30} ${hx + thumbX} ${hy - 4})"/>
  </g></g>`;
}
/* Where a hand ends up, in scene coordinates, so props and other people can meet it. */
function handAt(x, y, poseName, side = 'R', s = 1, flip = false) {
  const pose = POSES[poseName]; const [, , hx, hy] = joints(...angles(pose, side)); const [sx, sy] = SHOULDER[side];
  return [x + (flip ? -1 : 1) * s * (sx + hx), y + s * (sy + hy)];
}
const EYES = {
  open: (dx) => `<ellipse cx="-11" cy="-160" rx="5.2" ry="6.4" fill="#fff" stroke="${INK}" stroke-width="2"/><ellipse cx="11" cy="-160" rx="5.2" ry="6.4" fill="#fff" stroke="${INK}" stroke-width="2"/>
    <circle cx="${-11 + dx}" cy="-158.6" r="3.2" fill="${INK}"/><circle cx="${11 + dx}" cy="-158.6" r="3.2" fill="${INK}"/><circle cx="${-9.8 + dx}" cy="-160.4" r="1.1" fill="#fff"/><circle cx="${12.2 + dx}" cy="-160.4" r="1.1" fill="#fff"/>`,
  happy: () => `<path d="M-16.5 -157 Q-11 -165 -5.5 -157 M5.5 -157 Q11 -165 16.5 -157" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`,
};
const MOUTH = {
  smile: `<path d="M-8 -142 Q0 -134 8 -142" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
  grin: `<path d="M-10.5 -144 Q0 -127 10.5 -144 Z" fill="#7a2230" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M-7.5 -142.6 H7.5" stroke="#fff" stroke-width="2.6"/><path d="M-4 -133.5 Q0 -136 4 -133.5" fill="none" stroke="#e86a7a" stroke-width="2.4" stroke-linecap="round"/>`,
  wow: `<ellipse cx="0" cy="-139" rx="4.6" ry="5.8" fill="#7a2230" stroke="${INK}" stroke-width="2"/>`,
  focus: `<path d="M-5 -140 H5" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
};
function hair(p, layer) {
  const h = p.hairCol, hl = shade(h, .28);
  if (layer === 'back') {
    if (p.hair === 'bun') return `<circle cx="0" cy="-201" r="14" fill="${h}" ${O}/><path d="M-6 -208 Q0 -212 6 -208" fill="none" stroke="${hl}" stroke-width="2.4" stroke-linecap="round"/>`;
    if (p.hair === 'puff') return `<circle cx="0" cy="-205" r="27" fill="${h}" ${O}/><path d="M-14 -218 Q-6 -226 4 -222" fill="none" stroke="${hl}" stroke-width="3" stroke-linecap="round"/>`;
    return '';
  }
  return {
    bun: `<path d="M-30.5 -162 C-33 -201 33 -201 30.5 -162 C24 -182 -4 -188 -30.5 -162Z" fill="${h}" ${O}/><path d="M-14 -185 Q-2 -192 10 -188" fill="none" stroke="${hl}" stroke-width="3" stroke-linecap="round"/>`,
    fade: `<path d="M-30.5 -160 C-32 -197 32 -197 30.5 -160 C27 -176 -27 -176 -30.5 -160Z" fill="${h}" ${O}/><path d="M-18 -186 Q0 -192 18 -186" fill="none" stroke="${hl}" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`,
    puff: `<path d="M-30.5 -164 C-31 -193 31 -193 30.5 -164 C21 -180 -21 -180 -30.5 -164Z" fill="${h}" ${O}/><path d="M-22 -186 Q0 -198 22 -186" fill="none" stroke="#f97316" stroke-width="6" stroke-linecap="round"/><path d="M-22 -186 Q0 -198 22 -186" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round" opacity=".5"/>`,
    cap: `<path d="M-31.5 -170 C-31 -203 31 -203 31.5 -170Z" fill="${h}" ${O}/><path d="M6 -175 H46 Q51 -171 45 -167 H6Z" fill="${shade(h, -.22)}" ${O}/><circle cx="0" cy="-198" r="3.2" fill="${shade(h, .3)}" stroke="${INK}" stroke-width="1.4"/><path d="M-20 -190 Q-8 -196 6 -194" fill="none" stroke="${shade(h, .3)}" stroke-width="2.6" stroke-linecap="round"/>`,
  }[p.hair];
}
function outfit(p) {
  const dark = shade(p.shirt, -.22);
  const base = `<path d="M-30 -60 C-33 -96 -28 -122 -12 -126 L12 -126 C28 -122 33 -96 30 -60 Q0 -54 -30 -60Z" fill="${p.shirt}" ${O}/>
    <path d="M12 -126 C28 -122 33 -96 30 -60 Q22 -57 14 -57 C20 -86 18 -112 12 -126Z" fill="${dark}" opacity=".5"/>
    <path d="M-22 -116 Q-26 -96 -24 -74" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".22"/>`;
  return base + {
    blazer: `<path d="M-10 -126 L0 -100 L10 -126Z" fill="${p.inner}" stroke="${INK}" stroke-width="2"/><path d="M-12 -126 L-4 -96 L-14 -84 M12 -126 L4 -96 L14 -84" fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><circle cx="0" cy="-80" r="2.4" fill="${INK}"/><circle cx="0" cy="-70" r="2.4" fill="${INK}"/><rect x="-24" y="-98" width="10" height="3" rx="1.5" fill="${dark}"/>`,
    kaftan: `<path d="M-12 -126 Q0 -112 12 -126" fill="none" stroke="${p.inner}" stroke-width="4.5"/><path d="M0 -114 V-74" stroke="${p.inner}" stroke-width="3.2" stroke-dasharray="1 6" stroke-linecap="round"/><path d="M-6 -78 Q0 -72 6 -78" fill="none" stroke="${p.inner}" stroke-width="3"/>`,
    blouse: `<path d="M-12 -126 Q0 -108 12 -126" fill="${shade(p.shirt, .2)}" stroke="${INK}" stroke-width="2"/>${[-9, -3, 3, 9].map((x) => `<circle cx="${x}" cy="${-118 + Math.abs(x) * .6}" r="2.7" fill="${p.inner}" stroke="${INK}" stroke-width="1"/>`).join('')}`,
    vest: `<path d="M-30 -60 C-32 -90 -26 -116 -16 -124 L-6 -124 L-6 -58 Q-18 -56 -30 -60Z M30 -60 C32 -90 26 -116 16 -124 L6 -124 L6 -58 Q18 -56 30 -60Z" fill="${p.inner}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M-28 -84 H-6 M6 -84 H28" stroke="#e5e7eb" stroke-width="5"/><path d="M-28 -84 H-6 M6 -84 H28" stroke="${INK}" stroke-width="1" opacity=".3"/>`,
    polo: `<path d="M-10 -126 L0 -112 L10 -126" fill="none" stroke="${INK}" stroke-width="2"/><path d="M0 -112 V-98" stroke="${INK}" stroke-width="1.6"/><circle cx="0" cy="-106" r="1.6" fill="${INK}"/><rect x="8" y="-108" width="15" height="11" rx="3" fill="${p.inner}" stroke="${INK}" stroke-width="1.4"/><text x="15.5" y="-100" text-anchor="middle" font-size="6" font-weight="900" fill="#fff">C</text>`,
  }[p.top];
}
/* Things a right hand can hold, drawn in the hand's own coordinates. */
const HELD = {
  phoneBack: `<g transform="translate(-4 -24) rotate(-4)"><rect width="22" height="38" rx="5" fill="#22252f" stroke="${INK}" stroke-width="2"/><circle cx="6" cy="7" r="2.6" fill="#4b5568"/><circle cx="6" cy="14" r="2" fill="#4b5568"/></g>`,
  phoneOut: `<g transform="translate(-2 -40) rotate(10)"><rect width="30" height="54" rx="6" fill="#22252f" stroke="${INK}" stroke-width="2"/><rect x="2.5" y="2.5" width="25" height="49" rx="4" fill="#fff"/><path d="M6 34 C9 26 12 38 15 30 C17 25 19 33 23 29" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/><path d="M6 40 H24" stroke="#d7deec" stroke-width="1.4"/></g>`,
};
function person(who, x, y, { s = 1, pose = 'stand', flip = false, mood = 'smile', eyes = 'open', look = 0, hide = '', hold = '' } = {}) {
  const p = CAST[who], P = POSES[pose];
  const cls = (side) => (P.wave || '').includes(side) ? 'wave' : '';
  const back = ['L', 'R'].filter((k) => !P.front.includes(k)), front = ['L', 'R'].filter((k) => P.front.includes(k));
  const [, , hx, hy] = joints(...angles(P, 'R'));
  const held = hold ? `<g transform="translate(${SHOULDER.R[0] + hx} ${SHOULDER.R[1] + hy})">${HELD[hold]}</g>` : '';
  const legs = hide === 'legs' ? '' : `<path d="M-20 -64 L-18 -8 H-4 L-2 -64Z" fill="${p.pants}" ${O}/><path d="M2 -64 L4 -8 H18 L20 -64Z" fill="${p.pants}" ${O}/>
    <path d="M-6 -60 L-5 -12" stroke="${shade(p.pants, -.3)}" stroke-width="2" opacity=".5"/>
    <path d="M-25 -4 Q-25 -18 -11 -18 Q-1 -18 -1 -4 Z" fill="${p.shoes}" ${O}/><path d="M1 -4 Q1 -18 11 -18 Q25 -18 25 -4 Z" fill="${p.shoes}" ${O}/>
    <path d="M-20 -13 Q-14 -15 -9 -13 M6 -13 Q12 -15 17 -13" fill="none" stroke="#fff" stroke-width="1.6" opacity=".35" stroke-linecap="round"/>`;
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    ${hide === 'legs' ? '' : `<ellipse cx="0" cy="-3" rx="42" ry="8" fill="#0b1020" opacity=".16"/>`}
    ${legs}${back.map((k) => limb(k, P, p, cls(k))).join('')}
    ${outfit(p)}
    <path d="M-8 -136 H8 V-122 Q0 -118 -8 -122Z" fill="${shade(p.skin, -.18)}" stroke="${INK}" stroke-width="2"/>
    ${hair(p, 'back')}
    <circle cx="-30" cy="-156" r="7" fill="${p.skin}" ${O}/><circle cx="30" cy="-156" r="7" fill="${p.skin}" ${O}/>
    <circle cx="0" cy="-160" r="30" fill="${p.skin}" ${O}/>
    <path d="M14 -186 A30 30 0 0 1 24 -144 Q15 -152 14 -186Z" fill="${shade(p.skin, -.22)}" opacity=".5"/>
    ${hair(p, 'front')}
    ${p.beard ? `<path d="M-24 -152 Q-22 -124 0 -122 Q22 -124 24 -152 Q14 -135 0 -136 Q-14 -135 -24 -152Z" fill="${p.hairCol}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M-8 -146 Q0 -149 8 -146" fill="none" stroke="${p.hairCol}" stroke-width="3.4" stroke-linecap="round"/>` : ''}
    <path d="M-17 -172 Q-11 -176 -5 -172 M5 -172 Q11 -176 17 -172" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>
    ${eyes === 'happy' ? EYES.happy() : EYES.open(look)}
    <path d="M-2 -152 Q3 -149 -1 -145" fill="none" stroke="${shade(p.skin, -.45)}" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="-19" cy="-146" rx="5" ry="3.4" fill="#ff7b7b" opacity=".33"/><ellipse cx="19" cy="-146" rx="5" ry="3.4" fill="#ff7b7b" opacity=".33"/>
    ${p.beard && mood === 'smile' ? '' : MOUTH[mood]}${p.beard && mood === 'smile' ? `<path d="M-7 -140 Q0 -134 7 -140" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>` : ''}
    ${held}${front.map((k) => limb(k, P, p, cls(k))).join('')}
  </g>`;
}

/* Background line work: lighter and thinner than the people, so the eye goes to the story first. */
const B = `stroke="#6f7a99" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"`;

/* A zoomed-in screen, linked by a dotted leader to the device it belongs to (fx, fy). */
function callout(x, y, w, h, inner, fx, fy, { delay = .3, title = 'Clafina' } = {}) {
  const cx = fx < x ? x : fx > x + w ? x + w : x + w / 2, cy = fy < y ? y : fy > y + h ? y + h : y + h / 2;
  return `<g class="fadein" style="animation-delay:${delay}s"><path d="M${fx} ${fy} L${cx} ${cy}" stroke="${INK}" stroke-width="2.2" stroke-dasharray="2 6" stroke-linecap="round"/><circle cx="${fx}" cy="${fy}" r="5" fill="#fff" stroke="${INK}" stroke-width="2"/></g>
  <g transform="translate(${x} ${y})"><g class="pop" style="animation-delay:${delay + .1}s">
    <rect x="5" y="7" width="${w}" height="${h}" rx="18" fill="#0b1020" opacity=".14"/>
    <rect width="${w}" height="${h}" rx="18" fill="#fff" ${O}/>
    <path d="M0 18 Q0 0 18 0 H${w - 18} Q${w} 0 ${w} 18 V30 H0Z" fill="#f3f5fb"/><path d="M0 30 H${w}" stroke="#d7deec" stroke-width="1.6"/>
    <rect x="12" y="8" width="15" height="15" rx="4.5" fill="${C.violet}"/><text x="19.5" y="19.5" text-anchor="middle" font-size="10" font-weight="900" fill="#fff">C</text>
    <text x="34" y="19.5" font-size="9.5" font-weight="700" fill="#4a5468">${title}</text>
    <circle cx="${w - 34}" cy="15" r="3" fill="#d7deec"/><circle cx="${w - 24}" cy="15" r="3" fill="#d7deec"/><circle cx="${w - 14}" cy="15" r="3" fill="#d7deec"/>
    <g transform="translate(16 44)">${inner}</g></g></g>`;
}

/* Light for the hour: a wash and a glow from where the sun is. */
const LIGHT = {
  morning: `<defs><radialGradient id="lm" cx=".82" cy=".05" r=".95"><stop offset="0" stop-color="#fff6cf" stop-opacity=".6"/><stop offset=".6" stop-color="#fff6cf" stop-opacity=".08"/><stop offset="1" stop-color="#fff6cf" stop-opacity="0"/></radialGradient></defs><rect width="800" height="450" fill="url(#lm)" style="mix-blend-mode:screen"/><rect width="800" height="450" fill="#bcd2ff" opacity=".07" style="mix-blend-mode:multiply"/>`,
  noon: `<rect width="800" height="450" fill="#ffffff" opacity=".06"/>`,
  afternoon: `<defs><radialGradient id="la" cx=".9" cy=".1" r="1"><stop offset="0" stop-color="#ffe0a3" stop-opacity=".5"/><stop offset="1" stop-color="#ffe0a3" stop-opacity="0"/></radialGradient></defs><rect width="800" height="450" fill="url(#la)" style="mix-blend-mode:screen"/><rect width="800" height="450" fill="#ffcf8a" opacity=".1" style="mix-blend-mode:multiply"/>`,
  golden: `<defs><linearGradient id="lg" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9f43" stop-opacity=".34"/><stop offset="1" stop-color="#ff6f61" stop-opacity=".1"/></linearGradient></defs><rect width="800" height="450" fill="url(#lg)" style="mix-blend-mode:multiply"/><rect width="800" height="450" fill="#ffd9a0" opacity=".12" style="mix-blend-mode:screen"/>`,
};

/* ---------- Props ---------- */
function clock(x, y, r, time) {
  const [, hh, mm] = time.match(/(\d+):(\d+)/).map(Number);
  const ma = mm * 6, ha = (hh % 12) * 30 + mm * .5;
  return `<g transform="translate(${x} ${y})"><circle r="${r}" fill="#fff" ${O}/>${Array.from({ length: 12 }, (_, i) => `<rect x="-1" y="${-r + 4}" width="2" height="${i % 3 ? 3 : 6}" fill="${INK}" transform="rotate(${i * 30})"/>`).join('')}
    <rect x="-1.8" y="${-r * .5}" width="3.6" height="${r * .5}" rx="1.8" fill="${INK}" transform="rotate(${ha})"/><rect x="-1.2" y="${-r * .75}" width="2.4" height="${r * .75}" rx="1.2" fill="${C.red}" transform="rotate(${ma})"/><circle r="3" fill="${INK}"/></g>`;
}
const plant = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-8 -40 C-40 -70 -36 -100 -14 -104 C-6 -80 -4 -60 -8 -40Z" fill="#2f9e6d" ${O}/><path d="M6 -40 C30 -80 54 -84 58 -66 C40 -56 22 -48 6 -40Z" fill="#3fb57d" ${O}/><path d="M0 -40 C4 -80 14 -110 32 -116 C34 -90 20 -60 0 -40Z" fill="#26845b" ${O}/>
  <path d="M-22 -42 H22 L16 0 H-16Z" fill="#e07a5f" ${O}/><path d="M-24 -46 H24 V-38 H-24Z" fill="#c9634a" ${O}/></g>`;
const mug = (x, y) => `<g transform="translate(${x} ${y})"><path d="M-12 -26 H12 V-4 Q12 0 8 0 H-8 Q-12 0 -12 -4Z" fill="#fff" ${O}/><path d="M12 -20 Q22 -20 22 -13 Q22 -6 12 -6" fill="none" ${O}/><rect x="-6" y="-18" width="12" height="7" rx="2" fill="${C.violet}"/>
  <path class="steam" d="M-4 -32 Q-8 -40 -4 -46 Q0 -52 -4 -58 M5 -32 Q1 -40 5 -46" fill="none" stroke="#9aa6c4" stroke-width="2.4" stroke-linecap="round"/></g>`;
const doc = (x, y, w, h, title, num, lines = 3, extra = '') => `<g transform="translate(${x} ${y})">
  <path d="M4 4 H${w + 4} V${h + 4} H4Z" fill="#0b1020" opacity=".12"/>
  <rect width="${w}" height="${h}" rx="5" fill="#fff" ${O} stroke-width="2"/>
  <rect x="12" y="12" width="20" height="20" rx="5" fill="${C.violet}"/><text x="22" y="27" text-anchor="middle" font-size="12" font-weight="900" fill="#fff">C</text>
  <text x="40" y="22" font-size="8.5" font-weight="800" letter-spacing="1.2" fill="#3d4a66">${title}</text>
  <text x="40" y="33" font-size="9" font-family="JetBrains Mono, monospace" fill="${INK}">${num}</text>
  ${Array.from({ length: lines }, (_, i) => `<rect class="grow" style="animation-delay:${.3 + i * .22}s" x="12" y="${46 + i * 13}" width="${w - 24 - (i % 2) * 24}" height="5" rx="2.5" fill="#d9e1f2"/>`).join('')}
  ${extra}</g>`;
/* A phone: body, screen, camera pill; `inner` is drawn in screen coordinates (0,0 = screen top-left). */
const phone = (x, y, w, h, inner, { cls = '', rot = 0 } = {}) => `<g transform="translate(${x} ${y}) rotate(${rot})" class="${cls}"><rect width="${w}" height="${h}" rx="${w * .17}" fill="#22252f" ${O}/><rect x="${w * .055}" y="${w * .055}" width="${w * .89}" height="${h - w * .11}" rx="${w * .12}" fill="#fff"/>
  <rect x="${w * .38}" y="${w * .1}" width="${w * .24}" height="${w * .055}" rx="${w * .03}" fill="#22252f"/><g transform="translate(${w * .055} ${w * .055})">${inner}</g></g>`;
const laptop = (x, y, inner, w = 210) => `<g transform="translate(${x} ${y})"><rect width="${w}" height="${w * .64}" rx="10" fill="#22252f" ${O}/><rect x="8" y="8" width="${w - 16}" height="${w * .64 - 16}" rx="4" fill="#fff"/>${inner}
  <path d="M-20 ${w * .64} H${w + 20} L${w + 6} ${w * .64 + 13} H-6Z" fill="#aab4cf" ${O}/></g>`;
const box = (x, y, w = 46, h = 36, label = '') => `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="3" fill="#dba56d" ${O} stroke-width="2"/><rect x="${w / 2 - 6}" y="1" width="12" height="${h - 2}" fill="#efc797"/><path d="M${w * .62} 2 V${h - 2}" stroke="#b9814b" stroke-width="2" opacity=".4"/>${label ? `<text x="${w / 2}" y="${h - 6}" font-size="6.5" font-weight="900" text-anchor="middle" fill="#7a4b1e">${label}</text>` : ''}</g>`;
const stampMark = (x, y, text, col = '#15803d', delay = 0) => `<g transform="translate(${x} ${y})"><g class="stamp" style="animation-delay:${delay}s"><rect x="-64" y="-21" width="128" height="42" rx="8" fill="#fff" fill-opacity=".6" stroke="${col}" stroke-width="4.5"/><rect x="-58" y="-15" width="116" height="30" rx="5" fill="none" stroke="${col}" stroke-width="1.6"/><text x="0" y="8" text-anchor="middle" font-size="21" font-weight="900" letter-spacing="2.5" fill="${col}">${text}</text></g></g>`;
const bubble = (x, y, w, h, text, { tail = 'left', delay = 0, size = 23, think = false } = {}) => `<g transform="translate(${x} ${y})"><g class="pop" style="animation-delay:${delay}s">
  ${think ? `<circle cx="${tail === 'left' ? 26 : w - 26}" cy="${h + 14}" r="7" fill="#fff" ${O} stroke-width="2"/><circle cx="${tail === 'left' ? 16 : w - 16}" cy="${h + 28}" r="4" fill="#fff" ${O} stroke-width="2"/>`
    : `<path d="${tail === 'left' ? `M24 ${h - 2} L14 ${h + 18} L44 ${h - 2}` : `M${w - 24} ${h - 2} L${w - 14} ${h + 18} L${w - 44} ${h - 2}`}" fill="#fff" ${O} stroke-width="2.2"/>`}
  <rect width="${w}" height="${h}" rx="${h / 2.4}" fill="#fff" ${O} stroke-width="2.2"/>${think ? '' : `<rect x="${tail === 'left' ? 22 : w - 46}" y="${h - 5}" width="24" height="7" fill="#fff"/>`}
  <text x="${w / 2}" y="${h / 2 + size * .32}" text-anchor="middle" font-family="Caveat, cursive" font-weight="600" font-size="${size}" fill="${INK}">${text}</text></g></g>`;
const hand = (x, y, t, size = 26, col = INK, cls = 'fadein', delay = 0, rot = -4) => `<text class="${cls}" style="animation-delay:${delay}s" x="${x}" y="${y}" transform="rotate(${rot} ${x} ${y})" font-family="Caveat, cursive" font-weight="600" font-size="${size}" fill="${col}">${t}</text>`;
const sparkle = (x, y, s = 1, col = C.amber, delay = 0) => `<g transform="translate(${x} ${y}) scale(${s})"><path class="pop" style="animation-delay:${delay}s" d="M0 -14 Q2 -2 14 0 Q2 2 0 14 Q-2 2 -14 0 Q-2 -2 0 -14Z" fill="${col}" ${O} stroke-width="1.6"/></g>`;
const motion = (x, y, n = 3, len = 40) => Array.from({ length: n }, (_, i) => `<path class="fadein" style="animation-delay:${.2 + i * .1}s" d="M${x} ${y + i * 14} h${-len + i * 8}" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" opacity=".35"/>`).join('');
const notify = (x, y, w, title, sub, col, delay = 0) => `<g transform="translate(${x} ${y})"><g class="pop" style="animation-delay:${delay}s"><rect width="${w}" height="44" rx="12" fill="#fff" ${O} stroke-width="1.6"/><rect x="8" y="9" width="26" height="26" rx="8" fill="${col}"/><text x="21" y="27" text-anchor="middle" font-size="13" font-weight="900" fill="#fff">C</text>
  <text x="42" y="20" font-size="9" font-weight="800" fill="${INK}">${title}</text><text x="42" y="33" font-size="8" fill="#4a5468">${sub}</text></g></g>`;

/* ---------- Places ---------- */
function office(time) {
  return `<defs><linearGradient id="wallg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef2ff"/><stop offset="1" stop-color="#dfe6fb"/></linearGradient>
    <linearGradient id="sun" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff4c2" stop-opacity=".7"/><stop offset="1" stop-color="#fff4c2" stop-opacity="0"/></linearGradient></defs>
  <rect width="800" height="450" fill="url(#wallg)"/>
  <g transform="translate(470 34)"><rect width="270" height="170" rx="8" fill="#a9c2f5" ${B}/><rect x="10" y="10" width="250" height="150" rx="4" fill="#d7e5ff"/>
    <circle cx="214" cy="48" r="18" fill="#ffd166" class="bob"/>
    <g fill="#a3b8ec" ${B} stroke-width="1.6">${[[18, 70, 34], [58, 50, 46], [110, 92, 26], [142, 44, 54], [202, 66, 44]].map(([x, h, w]) => `<rect x="${x}" y="${160 - h}" width="${w - 8}" height="${h}" rx="2"/>`).join('')}</g>
    <path d="M135 0 V170 M0 85 H270" stroke="${INK}" stroke-width="5"/></g>
  <path d="M470 204 L330 450 H700 L740 204Z" fill="url(#sun)"/>
  <g transform="translate(70 60)"><rect width="120" height="84" rx="6" fill="#fff" ${B}/><rect x="10" y="10" width="100" height="64" rx="3" fill="${C.violet}"/><text x="60" y="38" text-anchor="middle" font-size="11" font-weight="900" fill="#fff">BRIGHT</text><text x="60" y="54" text-anchor="middle" font-size="11" font-weight="900" fill="#fff">HARBOUR</text></g>
  ${clock(420, 78, 28, time)}
  <rect x="0" y="352" width="800" height="98" fill="#c9d3ec"/><path d="M0 352 H800" stroke="${INK}" stroke-width="2.2"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 100 - 40} 450 L${i * 100 + 10} 352" stroke="#b4c0de" stroke-width="2"/>`).join('')}`;
}
function shopfront(time) {
  return `<rect width="800" height="450" fill="#fff4e3"/>
  <g transform="translate(0 0)">${Array.from({ length: 11 }, (_, i) => `<path d="M${i * 76} 0 H${i * 76 + 76} V44 Q${i * 76 + 38} 70 ${i * 76} 44Z" fill="${i % 2 ? '#fff' : C.teal}" ${B} stroke-width="2"/>`).join('')}</g>
  <text x="400" y="30" text-anchor="middle" font-size="19" font-weight="900" letter-spacing="3" fill="#fff" stroke="#0b4f49" stroke-width="5" paint-order="stroke">LAGOON FOODS</text>
  <g transform="translate(470 100)">${[0, 1, 2].map((r) => `<rect x="-6" y="${r * 72 + 58}" width="300" height="10" rx="2" fill="${C.woodDark}" ${B} stroke-width="2"/>${Array.from({ length: 7 }, (_, i) => { const col = ['#e11d48', '#f59e0b', '#16a34a', '#2563eb', '#e11d48', '#a855f7', '#f59e0b'][(i + r) % 7]; return r === 1 && i > 3 ? `<path d="M${6 + i * 41} ${r * 72 + 58} V${r * 72 + 26} Q${20 + i * 41} ${r * 72 + 14} ${34 + i * 41} ${r * 72 + 26} V${r * 72 + 58}Z" fill="#e8d3a8" ${B} stroke-width="1.8"/>` : `<rect x="${8 + i * 41}" y="${r * 72 + 18}" width="28" height="40" rx="5" fill="${col}" ${B} stroke-width="1.8"/><rect x="${8 + i * 41}" y="${r * 72 + 30}" width="28" height="13" fill="#fff" opacity=".75"/>`; }).join('')}`).join('')}</g>
  ${clock(300, 110, 26, time)}
  <g transform="translate(40 96)"><rect width="110" height="44" rx="8" fill="#fff" ${B} stroke-width="2"/><text x="55" y="29" text-anchor="middle" font-size="17" font-weight="900" fill="${C.green}">OPEN</text><path d="M30 0 L55 -24 L80 0" fill="none" stroke="${INK}" stroke-width="2"/></g>
  <rect x="0" y="352" width="800" height="98" fill="#ecd9bb"/><path d="M0 352 H800" stroke="${INK}" stroke-width="2.2"/>${Array.from({ length: 16 }, (_, i) => `<rect x="${i * 54}" y="${352 + (i % 2) * 49}" width="54" height="49" fill="none" stroke="#dcc6a2" stroke-width="2"/>`).join('')}`;
}
function warehouse() {
  return `<rect width="800" height="450" fill="#e6ebf5"/>
  ${[120, 400, 680].map((x) => `<g transform="translate(${x} 0)"><path d="M-6 0 V30" stroke="${INK}" stroke-width="2"/><path d="M-26 30 H26 L14 46 H-14Z" fill="#3b4256" ${B} stroke-width="2"/><path d="M-14 46 L-80 300 H80 L14 46Z" fill="#fff6c8" opacity=".35"/></g>`).join('')}
  ${[0, 1].map((k) => `<g transform="translate(${k ? 590 : 20} 76)"><rect width="10" height="280" fill="#56658a" ${B} stroke-width="2"/><rect x="180" width="10" height="280" fill="#56658a" ${B} stroke-width="2"/>${[0, 1, 2].map((r) => `<rect x="-4" y="${r * 92 + 82}" width="198" height="10" fill="#f97316" ${B} stroke-width="2"/>${[0, 1, 2].map((i) => box(16 + i * 54, r * 92 + 44, 46, 38)).join('')}`).join('')}</g>`).join('')}
  <rect x="0" y="352" width="800" height="98" fill="#cdd4e2"/><path d="M0 352 H800" stroke="${INK}" stroke-width="2.2"/><path d="M0 410 H800" stroke="#f5c542" stroke-width="7" stroke-dasharray="40 20"/>`;
}
function street() {
  return `<defs><linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfd6ff"/><stop offset="1" stop-color="#eaf1ff"/></linearGradient></defs>
  <rect width="800" height="450" fill="url(#skyg)"/>
  <g class="drift">${[[80, 70], [380, 46], [640, 90]].map(([x, y]) => `<path d="M${x} ${y} q10 -22 32 -12 q14 -18 34 0 q22 -4 22 14 q0 14 -18 14 h-68 q-16 0 -14 -16z" fill="#fff" ${B} stroke-width="2"/>`).join('')}</g>
  <g class="parallax-slow">${Array.from({ length: 18 }, (_, i) => { const h = [110, 150, 90, 130, 170, 100][i % 6]; return `<rect x="${i * 70}" y="${292 - h}" width="60" height="${h}" fill="#b6c8f2" ${B} stroke-width="1.6"/>`; }).join('')}</g>
  <g class="parallax">${Array.from({ length: 16 }, (_, i) => { const h = [80, 120, 60, 100, 70][i % 5]; return `<rect x="${i * 80 + 20}" y="${300 - h}" width="56" height="${h}" fill="${i % 2 ? '#93a9e3' : '#8aa1df'}" ${B} stroke-width="2"/>${Array.from({ length: Math.floor(h / 30) }, (_, k) => `<rect x="${i * 80 + 30}" y="${300 - h + 12 + k * 30}" width="12" height="14" fill="#fff6c8"/><rect x="${i * 80 + 54}" y="${300 - h + 12 + k * 30}" width="12" height="14" fill="#e8efff"/>`).join('')}`; }).join('')}</g>
  <rect x="0" y="300" width="800" height="16" fill="#aab3c5" ${B} stroke-width="2"/>
  <g class="parallax">${Array.from({ length: 8 }, (_, i) => `<g transform="translate(${i * 170 + 60} 300)"><rect x="-3" y="-120" width="6" height="120" fill="#4b5568"/><path d="M0 -120 Q20 -130 30 -118" fill="none" stroke="#4b5568" stroke-width="5"/><ellipse cx="30" cy="-114" rx="10" ry="5" fill="#fff6c8" ${B} stroke-width="2"/></g>`).join('')}</g>
  <rect x="0" y="316" width="800" height="134" fill="#4b5568"/>
  <g class="roll">${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 120}" y="384" width="62" height="8" rx="4" fill="#f5f5f5"/>`).join('')}</g>`;
}


export const lightFor = (time) => { const hr = +time.match(/(\d+):/)[1]; return hr < 12 ? 'morning' : hr < 14 ? 'noon' : hr < 16 ? 'afternoon' : 'golden'; };
export { INK, C, O, B, CAST, POSES, SHOULDER, joints, angles, handAt, person, callout, clock, plant, mug, doc, phone, laptop, box, stampMark, bubble, hand, sparkle, motion, notify, office, shopfront, warehouse, street, LIGHT };
