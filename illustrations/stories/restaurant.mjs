/** A Monday at the restaurant: costing a dish, the fish that did not come, a booked party, tickets to the right station, a side running low, a takeaway at the lunch price, a late main given free, tips shared. */
import { INK, C, O, B, person, callout, clock, bubble, hand, sparkle, handAt } from '../kit.mjs';

const at = (x, y, pose, flip = false) => { const [hx, hy] = handAt(x, y, pose, 'R', 1, flip); return [hx, hy - 16]; };
const row = (k, v, y, w, col = INK) => `<text y="${y}" font-size="9.5" fill="#6b7590">${k}</text><text x="${w}" y="${y}" text-anchor="end" font-size="10" font-weight="700" fill="${col}">${v}</text>`;

/* ---------- The restaurant world ---------- */
function kitchen(t) {
  return `<rect width="800" height="450" fill="#eef1f4"/>${Array.from({ length: 12 }, (_, i) => Array.from({ length: 6 }, (_, j) => `<rect x="${i * 68}" y="${j * 34}" width="66" height="32" fill="#f8fafc" stroke="#e2e8f0"/>`).join('')).join('')}
    <path d="M440 40 H780 L740 110 H480Z" fill="#cbd5e1" ${B}/><rect x="560" y="0" width="100" height="40" fill="#cbd5e1" ${B}/>
    <g transform="translate(60 40)"><rect width="300" height="8" rx="4" fill="#94a3b8"/>${[20, 80, 140, 200, 260].map((x, i) => `<path d="M${x} 8 V${30 + (i % 2) * 10}" stroke="${INK}" stroke-width="2"/><circle cx="${x}" cy="${44 + (i % 2) * 10}" r="${12 + (i % 3) * 3}" fill="#9ca3af" ${O} stroke-width="1.8"/><rect x="${x - 2}" y="${50 + (i % 2) * 10 + (i % 3) * 3}" width="4" height="18" fill="${INK}"/>`).join('')}</g>
    ${clock(400, 80, 20, t)}
    <rect x="0" y="300" width="800" height="150" fill="#9aa3b5"/><rect x="0" y="292" width="800" height="16" fill="#cbd5e1" ${O}/>${[0, 1, 2, 3, 4].map((i) => `<rect x="${20 + i * 160}" y="318" width="140" height="120" rx="4" fill="#b6bfcc" ${B}/><circle cx="${90 + i * 160}" cy="340" r="4" fill="#64748b"/>`).join('')}`;
}
function stove(x, y, w = 180) {
  return `<g transform="translate(${x} ${y})"><rect width="${w}" height="16" rx="3" fill="#475569" ${O}/>${[0.25, 0.75].map((f) => `<g transform="translate(${w * f} 0)">${[0, 1, 2].map((j) => `<path class="flame" style="animation-delay:${j * .15}s" d="M${-10 + j * 10} 0 q-6 -14 0 -26 q6 12 6 26z" fill="${['#f97316', '#facc15', '#ef4444'][j]}" opacity=".9"/>`).join('')}</g>`).join('')}
    <path d="M${w * .25 - 32} -18 H${w * .25 + 32} V-4 H${w * .25 - 32}Z" fill="#64748b" ${O} stroke-width="2"/><path d="M${w * .25 + 32} -14 h22" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <path d="M${w * .75 - 26} -40 H${w * .75 + 26} V-4 H${w * .75 - 26}Z" fill="#94a3b8" ${O} stroke-width="2"/><path class="steam" d="M${w * .75 - 8} -48 q-6 -10 0 -20 M${w * .75 + 8} -48 q-6 -10 0 -20" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/></g>`;
}
function dining(t) {
  return `<rect width="800" height="450" fill="#f7efe3"/><rect x="0" y="0" width="800" height="200" fill="#efe1cb"/>
    ${[120, 400, 680].map((x) => `<g transform="translate(${x} 0)"><path d="M0 0 V70" stroke="${INK}" stroke-width="2"/><path d="M-26 70 H26 L16 100 H-16Z" fill="#c2410c" ${O} stroke-width="2"/><ellipse cx="0" cy="110" rx="40" ry="10" fill="#fde68a" opacity=".5"/></g>`).join('')}
    <g transform="translate(560 120)"><rect width="200" height="12" fill="#8a5a3b" ${O} stroke-width="2"/><rect y="56" width="200" height="12" fill="#8a5a3b" ${O} stroke-width="2"/>${Array.from({ length: 8 }, (_, i) => `<rect x="${10 + i * 24}" y="${(i % 2) * 56 - 30}" width="14" height="30" rx="3" fill="${['#16a34a', '#b45309', '#7c3aed', '#0e7490'][i % 4]}" stroke="${INK}" stroke-width="1.4"/>`).join('')}</g>
    ${clock(300, 70, 22, t)}
    <rect x="0" y="352" width="800" height="98" fill="#b8865b"/><path d="M0 352 H800" stroke="${INK}" stroke-width="2.2"/>${Array.from({ length: 16 }, (_, i) => `<path d="M${i * 54} 352 V450" stroke="#a06f47" stroke-width="2"/>`).join('')}`;
}
const table = (x, y, w = 150) => `<g transform="translate(${x} ${y})"><rect x="-${w / 2}" y="-8" width="${w}" height="12" rx="4" fill="#fff" ${O}/><path d="M-${w / 2 - 12} 4 V86 M${w / 2 - 12} 4 V86" stroke="${INK}" stroke-width="5"/></g>`;
const plate = (x, y, food = '#f59e0b', s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse rx="22" ry="7" fill="#fff" ${O} stroke-width="1.6"/><ellipse cx="-2" cy="-3" rx="12" ry="5" fill="${food}"/><ellipse cx="7" cy="-4" rx="5" ry="3" fill="#16a34a"/></g>`;
function hostStand(x, y) {
  return `<g transform="translate(${x} ${y})"><path d="M-40 0 L-30 -100 H30 L40 0Z" fill="#7c2d12" ${O}/><rect x="-36" y="-112" width="72" height="14" rx="3" fill="#9a3412" ${O} stroke-width="2"/><rect x="-24" y="-130" width="48" height="20" rx="3" fill="#1b2033" ${O} stroke-width="2"/></g>`;
}
function door(x, y, open = false) {
  return `<g transform="translate(${x} ${y})"><rect x="0" y="-220" width="120" height="220" fill="#7c4a2a" ${O}/><rect x="14" y="-200" width="92" height="110" rx="4" fill="${open ? '#bfdbfe' : '#e0e7ff'}" ${B}/><circle cx="104" cy="-110" r="5" fill="#fbbf24" stroke="${INK}" stroke-width="1.4"/></g>`;
}
const crate = (x, y, label = '', empty = true) => `<g transform="translate(${x} ${y})"><rect x="-44" y="-40" width="88" height="40" rx="4" fill="#d6a669" ${O}/><path d="M-44 -26 H44 M-44 -12 H44" stroke="#a7773f" stroke-width="2.4"/>${empty ? '' : `<path d="M-30 -42 q14 -16 28 0 q14 -16 28 0" fill="#93c5fd" stroke="${INK}" stroke-width="1.6"/>`}${label ? `<text y="-48" text-anchor="middle" font-size="10" font-weight="800" fill="#7c2d12">${label}</text>` : ''}</g>`;
const ticket = (x, y, title, lines, col, delay = 0, from = [-200, 80]) => `<g transform="translate(${x} ${y})"><g class="ticket" style="--fx:${from[0]}px;--fy:${from[1]}px;animation-delay:${delay}s"><path d="M0 0 H86 V${24 + lines.length * 14} L80 ${30 + lines.length * 14} L72 ${24 + lines.length * 14} L64 ${30 + lines.length * 14} L56 ${24 + lines.length * 14} L48 ${30 + lines.length * 14} L40 ${24 + lines.length * 14} L32 ${30 + lines.length * 14} L24 ${24 + lines.length * 14} L16 ${30 + lines.length * 14} L8 ${24 + lines.length * 14} L0 ${30 + lines.length * 14}Z" fill="#fff" ${O} stroke-width="1.8"/><rect width="86" height="16" fill="${col}"/><text x="6" y="12" font-size="8.5" font-weight="800" fill="#fff">${title}</text>${lines.map((l, i) => `<text x="6" y="${30 + i * 14}" font-size="8.5" fill="${INK}">${l}</text>`).join('')}</g></g>`;
function tipJar(x, y) {
  return `<g transform="translate(${x} ${y})"><path d="M-34 0 Q-40 -60 -30 -96 H30 Q40 -60 34 0Z" fill="#dbeafe" opacity=".75" ${O}/><rect x="-32" y="-106" width="64" height="12" rx="4" fill="#94a3b8" ${O} stroke-width="2"/>${[[-14, -16], [8, -22], [-4, -34], [16, -40], [-18, -46]].map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="10" fill="#fbbf24" stroke="#b45309" stroke-width="2"/>`).join('')}<rect x="-20" y="-70" width="40" height="18" rx="2" fill="#86efac" stroke="#15803d" stroke-width="1.6" transform="rotate(-12)"/><text y="-80" text-anchor="middle" font-size="10" font-weight="900" fill="${INK}">TIPS</text></g>`;
}

/* ---------- Scenes ---------- */
export const SCENES = {
  costing: (t) => `${kitchen(t)}
    ${stove(470, 292, 220)}
    ${person('marco', 300, 400, { pose: 'look', hold: 'phoneBack', look: 3, mood: 'focus' })}
    <g transform="translate(150 290)"><ellipse cx="0" cy="0" rx="46" ry="10" fill="#fff" ${O} stroke-width="1.8"/><path d="M-26 -6 q8 -26 30 -18 q22 -6 24 16z" fill="#f4c28a" ${O} stroke-width="1.8"/><path d="M14 -16 l12 -12" stroke="#fff" stroke-width="5" stroke-linecap="round"/></g>
    ${callout(420, 30, 340, 200, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">DISH COSTS · TODAY</text>
      <text y="22" font-size="12" font-weight="800" fill="${INK}">⟦k:dishMain⟧</text>
      ${row('Chicken, at today\'s cost', '⟦x:1650⟧', 46, 308)}${row('Rice, oil, spices', '⟦x:380⟧', 64, 308)}${row('Price without tax', '⟦x:4186⟧', 82, 308)}
      <rect class="pop" style="animation-delay:1.4s" y="94" width="308" height="26" rx="7" fill="#dcfce7"/><text class="pop" style="animation-delay:1.4s" x="10" y="111" font-size="10.5" font-weight="800" fill="${C.green}">Margin 52% · still worth it</text>`, ...at(300, 400, 'look'), { title: 'Clafina · Dish costs', delay: .2 })}
    ${hand(110, 220, 'chicken went up…', 26, '#b45309', 'fadein', 1, -6)}`,

  nofish: (t) => `<rect width="800" height="450" fill="#e7ecef"/>${Array.from({ length: 10 }, (_, i) => `<rect x="${i * 82}" y="0" width="80" height="300" fill="${i % 2 ? '#dfe5ea' : '#e7ecef'}"/>`).join('')}
    ${door(80, 352, true)}${clock(300, 90, 28, t)}
    <rect x="0" y="352" width="800" height="98" fill="#9aa3b5"/><path d="M0 352 H800" stroke="${INK}" stroke-width="2.2"/>
    ${crate(260, 400, '⟦u:fish⟧')}${crate(260, 360)}
    ${person('nadia', 400, 420, { pose: 'look', hold: 'phoneBack', look: 3 })}
    ${callout(470, 50, 300, 200, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">MENU · LUNCH</text>
      <text y="22" font-size="12" font-weight="800" fill="${INK}">Grilled ⟦n:fish⟧</text>
      <g class="stamp" style="animation-delay:1s"><rect x="150" y="6" width="110" height="26" rx="6" fill="#fff" stroke="${C.red}" stroke-width="3"/><text x="205" y="24" text-anchor="middle" font-size="11" font-weight="900" fill="${C.red}">SOLD OUT</text></g>
      ${row('Reason', 'delivery did not come', 52, 268)}
      <rect class="fadein" style="animation-delay:1.8s" y="66" width="268" height="26" rx="7" fill="#eef2ff"/><text class="fadein" style="animation-delay:1.8s" x="10" y="83" font-size="10" font-weight="700" fill="${C.blue}">Every till and menu updated</text>`, ...at(400, 420, 'look'), { title: 'Clafina · Menu', delay: .2 })}
    ${bubble(150, 160, 150, 50, 'Still no fish…', { tail: 'right', delay: .5, size: 22 })}`,

  party: (t) => `${dining(t)}
    ${table(620, 380, 170)}${plate(590, 372)}${plate(650, 372, '#ef4444')}
    ${hostStand(330, 420)}
    ${person('aisha', 400, 420, { pose: 'look', hold: 'phoneBack', look: -3, mood: 'grin' })}
    ${person('bennM', 120, 430, { pose: 'wave', look: 3 })}${person('bennF', 200, 430, { pose: 'stand', look: 3, mood: 'grin' })}${person('kid', 160, 440, { s: .6, pose: 'wave', mood: 'grin', look: 3 })}
    ${callout(470, 40, 300, 210, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">FLOOR · INSIDE</text>
      <g transform="translate(0 14)">${[[0, 0, 'Seated', '#dbeafe'], [96, 0, 'Free', '#dcfce7'], [192, 0, 'Bill', '#fef3c7'], [0, 56, 'Free', '#dcfce7'], [96, 56, 'Held', '#ede9fe'], [192, 56, 'Seated', '#dbeafe']].map(([x, y, s, bg], i) => `<g class="${i === 4 ? 'pop' : ''}" style="animation-delay:${i === 4 ? .8 : 0}s"><rect x="${x}" y="${y}" width="84" height="46" rx="10" fill="${bg}" stroke="${i === 4 ? C.violet : '#e2e8f0'}" stroke-width="${i === 4 ? 2.4 : 1}"/><text x="${x + 42}" y="${y + 20}" text-anchor="middle" font-size="11" font-weight="900" fill="${INK}">${i + 1}</text><text x="${x + 42}" y="${y + 36}" text-anchor="middle" font-size="8.5" fill="#4a5468">${s}</text></g>`).join('')}</g>
      <text class="fadein" style="animation-delay:1.6s" y="136" font-size="9.5" font-weight="700" fill="${C.violet}">Table 5 held for ⟦n:partyFamily⟧</text>`, ...at(400, 420, 'look', true), { title: 'Clafina · Floor', delay: .2 })}`,

  stations: (t) => `${kitchen(t)}
    ${stove(40, 292, 230)}
    <g transform="translate(330 292)"><rect x="0" y="-60" width="160" height="60" fill="#e2e8f0" ${O}/>${[0, 1, 2].map((i) => `<ellipse cx="${30 + i * 50}" cy="-60" rx="18" ry="6" fill="#fff" ${O} stroke-width="1.6"/>`).join('')}<text x="80" y="-24" text-anchor="middle" font-size="11" font-weight="800" fill="#334155">KITCHEN</text></g>
    <g transform="translate(560 292)"><rect x="0" y="-70" width="200" height="70" fill="#7c2d12" ${O}/>${[0, 1, 2, 3].map((i) => `<rect x="${20 + i * 44}" y="-108" width="16" height="38" rx="3" fill="${['#16a34a', '#f59e0b', '#0e7490', '#be185d'][i]}" stroke="${INK}" stroke-width="1.4"/>`).join('')}<text x="100" y="-30" text-anchor="middle" font-size="11" font-weight="800" fill="#fde68a">BAR</text></g>
    <text x="155" y="230" text-anchor="middle" font-size="11" font-weight="800" fill="#7c2d12">GRILL</text>
    ${ticket(110, 120, 'GRILL · T6', ['2 × ⟦n:dishGrill⟧', 'well done'], '#ea580c', .4, [260, 200])}
    ${ticket(370, 120, 'KITCHEN · T6', ['1 × ⟦n:dishMain⟧'], '#2563eb', .8, [20, 200])}
    ${ticket(620, 110, 'BAR · T6', ['2 × lemonade', '1 × water'], '#7c3aed', 1.2, [-230, 210])}
    ${person('waiter', 400, 420, { pose: 'look', hold: 'phoneBack', look: 3 })}
    ${hand(470, 360, 'sent to three stations', 26, C.violet, 'fadein', 2, -4)}`,

  low: (t) => `${dining(t)}
    ${table(160, 380, 170)}${plate(130, 372)}${plate(190, 372, '#ef4444')}
    ${person('diner', 110, 430, { pose: 'point', look: 3 })}
    ${person('waiter', 360, 430, { pose: 'look', hold: 'phoneBack', look: 3 })}
    ${callout(430, 60, 340, 210, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">TABLE 3 · NEW ORDER</text>
      <text y="22" font-size="12" font-weight="800" fill="${INK}">1 × ⟦k:dishSide⟧</text>
      <rect class="pop" style="animation-delay:.9s" y="36" width="308" height="44" rx="9" fill="#fef3c7"/><text class="pop" style="animation-delay:.9s" x="10" y="54" font-size="10" font-weight="800" fill="#a15c07">Short: ⟦n:sideIngredient⟧ · 3 portions left</text><text class="pop" style="animation-delay:.9s" x="10" y="70" font-size="9" fill="#a15c07">Warn the waiter is on</text>
      <g class="press" style="animation-delay:1.8s"><rect y="92" width="150" height="30" rx="9" fill="${C.blue}"/><text x="75" y="111" text-anchor="middle" font-size="10" font-weight="800" fill="#fff">Send anyway</text></g><rect x="158" y="92" width="150" height="30" rx="9" fill="#f1f5f9"/><text x="233" y="111" text-anchor="middle" font-size="10" font-weight="700" fill="${INK}">Offer another</text>`, ...at(360, 430, 'look'), { title: 'Clafina · Till', delay: .2 })}`,

  takeaway: (t) => `${dining(t)}
    ${person('aisha', 330, 352, { pose: 'look', hold: 'phoneBack', hide: 'legs', look: 3 })}
    <g transform="translate(240 300)"><rect width="320" height="60" fill="#8a5a3b" ${O}/><rect x="-10" y="-10" width="340" height="14" fill="#b07a52" ${O}/></g>
    <g transform="translate(470 284)"><path d="M-30 0 L-24 -56 H24 L30 0Z" fill="#d6a669" ${O}/><path d="M-12 -56 Q0 -72 12 -56" fill="none" stroke="${INK}" stroke-width="3"/><text y="-24" text-anchor="middle" font-size="8.5" font-weight="900" fill="#7c2d12">⟦u:restaurant⟧</text></g>
    ${person('shopper', 660, 430, { pose: 'wave', look: -3, mood: 'grin', flip: true })}
    ${callout(20, 40, 250, 190, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">TAKEAWAY · 14:00</text>
      <text y="22" font-size="12" font-weight="800" fill="${INK}">1 × ⟦k:dishMain⟧</text>
      <text y="48" font-size="11" fill="#9aa3b5" text-decoration="line-through">⟦x:4500⟧</text><text class="pop" style="animation-delay:1s" x="80" y="48" font-size="14" font-weight="900" fill="${C.green}">⟦x:3500⟧</text>
      <rect class="fadein" style="animation-delay:1.4s" y="62" width="238" height="24" rx="7" fill="#dcfce7"/><text class="fadein" style="animation-delay:1.4s" x="10" y="78" font-size="9.5" font-weight="700" fill="${C.green}">Rule: weekday lunch offer</text>`, ...at(330, 352, 'look'), { title: 'Clafina · Till', delay: .2 })}`,

  comp: (t) => `${dining(t)}
    ${table(240, 380, 200)}${plate(220, 372, '#fde68a')}
    ${person('diner', 120, 430, { pose: 'stand', look: 3 })}${person('bennF', 340, 430, { pose: 'stand', look: -3, flip: true })}
    ${person('nadia', 520, 430, { pose: 'carry', look: -3, flip: true, mood: 'smile' })}
    <g transform="translate(520 340)">${plate(0, 0, '#fde68a', 1.3)}</g>
    <g transform="translate(250 220)" class="pop" style="animation-delay:.3s"><circle r="34" fill="#fff" ${O}/><text y="-2" text-anchor="middle" font-size="18" font-weight="900" fill="${C.red}">40</text><text y="14" text-anchor="middle" font-size="9" font-weight="700" fill="#4a5468">minutes</text></g>
    ${callout(560, 40, 220, 190, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">TABLE 9 · COMP</text>
      <text y="22" font-size="11.5" font-weight="800" fill="${INK}">⟦k:dishLate⟧</text>
      ${row('It cost', '⟦x:1900⟧', 46, 188)}${row('It would sell for', '⟦x:5000⟧', 64, 188)}
      <rect class="pop" style="animation-delay:1.2s" y="78" width="188" height="24" rx="7" fill="#eef2ff"/><text class="pop" style="animation-delay:1.2s" x="10" y="94" font-size="9.5" font-weight="700" fill="${C.blue}">Kept apart from voids and waste</text>`, 520, 280, { title: 'Clafina · Comps', delay: .5 })}
    ${bubble(380, 150, 160, 50, 'On the house.', { tail: 'right', delay: 1.6, size: 23 })}`,

  tips: (t) => `${dining(t)}
    ${tipJar(400, 340)}
    ${person('waiter', 200, 430, { pose: 'cheer', mood: 'grin', eyes: 'happy' })}${person('marco', 300, 430, { pose: 'wave', mood: 'grin' })}${person('aisha', 500, 430, { pose: 'wave', mood: 'grin', flip: true })}${person('nadia', 610, 430, { pose: 'look', hold: 'phoneBack', look: -3, flip: true })}
    ${callout(40, 30, 300, 210, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">TIP RUN · LAST WEEK</text>
      ${[['Waiters', '42%'], ['Runners', '18%'], ['Bar', '15%'], ['Kitchen', '25%']].map(([k, v], i) => `<text y="${24 + i * 22}" font-size="10" fill="${INK}">${k}</text><rect x="90" y="${15 + i * 22}" width="150" height="10" rx="5" fill="#f1f5f9"/><rect class="grow" style="animation-delay:${.6 + i * .3}s" x="90" y="${15 + i * 22}" width="${parseInt(v, 10) * 3}" height="10" rx="5" fill="${C.violet}"/><text x="268" y="${24 + i * 22}" text-anchor="end" font-size="10" font-weight="800" fill="${INK}">${v}</text>`).join('')}
      <text y="118" font-size="9.5" fill="#6b7590">By hours on the timeclock and each role's points</text>`, ...at(610, 430, 'look', true), { title: 'Clafina · Tips', delay: .2 })}
    ${sparkle(450, 200, 1.2, C.amber, 1.4)}${sparkle(360, 220, .9, C.teal, 1.6)}`,
};
