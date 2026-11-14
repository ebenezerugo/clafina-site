/** A day at the hotel: night audit, housekeeping, room 108 turning ready, an early guest off a plane, lunch on the room, a company folio, a trade-fair weekend, a quieter room. */
import { INK, C, O, B, person, callout, clock, bubble, hand, sparkle, plant, laptop, handAt, notify, motion } from '../kit.mjs';

const at = (x, y, pose, flip = false) => { const [hx, hy] = handAt(x, y, pose, 'R', 1, flip); return [hx, hy - 16]; };
const row = (k, v, y, w, strong = false, col = INK) => `<text y="${y}" font-size="9.5" fill="#6b7590">${k}</text><text x="${w}" y="${y}" text-anchor="end" font-size="10" font-weight="${strong ? 800 : 700}" fill="${col}">${v}</text>`;

/* ---------- The hotel world ---------- */
function skyline(night) {
  const sky = night ? ['#0f1b3d', '#1e2f63'] : ['#9cc9ff', '#dceaff'];
  const bld = night ? '#22305e' : '#a7bdf0';
  const win = night ? '#ffd98a' : '#eef4ff';
  return `<defs><linearGradient id="hsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs>
    <rect width="800" height="300" fill="url(#hsky)"/>
    ${night ? `<circle cx="640" cy="70" r="26" fill="#fef3c7"/><circle cx="652" cy="62" r="24" fill="${sky[0]}"/>${Array.from({ length: 26 }, (_, i) => `<circle class="${i % 3 ? '' : 'blink'}" cx="${(i * 97) % 780 + 10}" cy="${(i * 53) % 120 + 14}" r="${i % 4 ? 1.4 : 2.2}" fill="#fff" opacity=".8"/>`).join('')}`
      : `<g class="drift"><path d="M80 70 q10 -22 32 -12 q14 -18 34 0 q22 -4 22 14 q0 14 -18 14 h-68 q-16 0 -14 -16z" fill="#fff" opacity=".9"/><path d="M500 50 q10 -22 32 -12 q14 -18 34 0 q22 -4 22 14 q0 14 -18 14 h-68 q-16 0 -14 -16z" fill="#fff" opacity=".9"/></g>`}
    ${Array.from({ length: 14 }, (_, i) => { const h = [120, 170, 90, 200, 140, 110, 180, 130, 95, 160, 120, 190, 100, 150][i]; return `<rect x="${i * 58}" y="${300 - h}" width="50" height="${h}" fill="${bld}"/>${Array.from({ length: Math.floor(h / 22) }, (_, r) => [0, 1, 2].map((c) => ((i + r + c) % 3 ? `<rect x="${i * 58 + 8 + c * 13}" y="${300 - h + 10 + r * 22}" width="8" height="10" fill="${win}" opacity="${night ? .9 : .7}"/>` : '')).join('')).join('')}`; }).join('')}`;
}
function plane(x, y, s = 1, night = false) {
  return `<g class="fly-across"><g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 L60 -4 Q72 -4 72 2 Q72 8 60 8 L0 6Z" fill="#f8fafc" ${O} stroke-width="1.6"/><path d="M26 2 L14 -20 H22 L42 2Z M28 6 L16 24 H24 L44 6Z" fill="#cbd5e1" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M2 2 L-6 -12 H2 L10 2Z" fill="#6d4fe0" stroke="${INK}" stroke-width="1.4"/>
    ${night ? '<circle class="blink" cx="-4" cy="-10" r="2.4" fill="#ef4444"/>' : ''}${[34, 42, 50].map((wx) => `<circle cx="${wx}" cy="1.5" r="1.4" fill="#60a5fa"/>`).join('')}</g></g>`;
}
/** The lobby: a tall window on the city, the reception desk, a key rack and the hotel's name. */
function lobby(t, night = false) {
  return `<rect width="800" height="450" fill="${night ? '#1b2340' : '#f3eee6'}"/>
    <g transform="translate(330 30)"><rect width="440" height="270" rx="6" fill="#e5e7eb" ${B}/><g transform="translate(10 10)"><svg width="420" height="250" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice">${skyline(night)}${plane(night ? 120 : 160, night ? 140 : 90, 1.3, night)}</svg></g><path d="M220 10 V260 M10 135 H430" stroke="${night ? '#334155' : '#cbd5e1'}" stroke-width="6"/></g>
    <g transform="translate(40 54)"><rect width="250" height="54" rx="8" fill="${night ? '#0f172a' : '#1f3a6b'}"/><text x="125" y="34" text-anchor="middle" font-size="18" font-weight="800" letter-spacing="1.5" fill="#fde68a">⟦u:hotel⟧</text></g>
    <g transform="translate(60 130)">${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${(i % 3) * 30}" y="${Math.floor(i / 3) * 32}" width="24" height="26" rx="3" fill="${night ? '#334155' : '#d6cbb8'}" ${B}/><path d="M${(i % 3) * 30 + 12} ${Math.floor(i / 3) * 32 + 8} v10" stroke="#b45309" stroke-width="2.4"/>`).join('')}</g>
    ${clock(250, 160, 22, t)}
    <rect x="0" y="352" width="800" height="98" fill="${night ? '#252c48' : '#d9cbb3'}"/><path d="M0 352 H800" stroke="${INK}" stroke-width="2.2"/>
    ${Array.from({ length: 10 }, (_, i) => `<path d="M${i * 90 - 30} 450 L${i * 90 + 20} 352" stroke="${night ? '#2f3858' : '#cbb994'}" stroke-width="2"/>`).join('')}`;
}
const desk = (x, y, w = 330, night = false) => `<g transform="translate(${x} ${y})"><path d="M0 0 H${w} V96 H0Z" fill="${night ? '#3b2f2a' : '#8a5a3b'}" ${O}/><path d="M-10 -10 H${w + 10} V0 H-10Z" fill="${night ? '#57463c' : '#b07a52'}" ${O}/>${[1, 2, 3].map((i) => `<path d="M${(w / 4) * i} 6 V90" stroke="${INK}" stroke-width="1.6" opacity=".3"/>`).join('')}
  <g transform="translate(${w - 50} -18)"><path d="M-10 0 Q0 -16 10 0Z" fill="#fbbf24" ${O} stroke-width="1.6"/><rect x="-12" y="0" width="24" height="4" fill="#d97706" ${O} stroke-width="1.4"/></g></g>`;
function suitcase(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-24" y="-62" width="48" height="60" rx="7" fill="#2563eb" ${O}/><path d="M-10 -62 V-78 H10 V-62" fill="none" stroke="${INK}" stroke-width="3.4"/><path d="M-14 -50 V-12 M0 -50 V-12 M14 -50 V-12" stroke="#1d4ed8" stroke-width="3"/><circle cx="-14" cy="0" r="4" fill="${INK}"/><circle cx="14" cy="0" r="4" fill="${INK}"/><rect x="-18" y="-58" width="16" height="10" rx="2" fill="#fde68a" stroke="${INK}" stroke-width="1.2"/></g>`;
}
function corridor(t) {
  return `<rect width="800" height="450" fill="#efe7da"/>
    <path d="M0 0 H800 V60 L560 150 H240 L0 60Z" fill="#f7f1e7" ${B}/><path d="M0 450 L240 300 H560 L800 450Z" fill="#7c2d3a"/><path d="M240 300 H560" stroke="${INK}" stroke-width="2"/>
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${400 - 40 - i * 60} 450 L${300 + i * 0} 300" stroke="#9b3546" stroke-width="2" opacity=".0"/>`).join('')}
    <path d="M0 60 L240 150 V300 L0 450Z" fill="#e8dcc7" ${B}/><path d="M800 60 L560 150 V300 L800 450Z" fill="#e8dcc7" ${B}/>
    <rect x="240" y="150" width="320" height="150" fill="#f3ead9" ${B}/><rect x="370" y="190" width="60" height="110" fill="#b07a52" ${B}/>
    ${[[60, 108], [150, 107]].map(([x, n]) => `<g><path d="M${x} ${110 + (x - 60) * .3} L${x + 60} ${135 + (x - 60) * .3} V${330 - (x - 60) * .2} L${x} ${380 - (x - 60) * .3}Z" fill="#a0603c" ${B}/><text x="${x + 30}" y="${150 + (x - 60) * .3}" text-anchor="middle" font-size="14" font-weight="800" fill="#fde68a">${n}</text></g>`).join('')}
    <g><path d="M680 108 L740 86 V398 L680 360Z" fill="#a0603c" ${B}/><text x="710" y="130" text-anchor="middle" font-size="14" font-weight="800" fill="#fde68a">109</text></g>
    ${[120, 680].map((x) => `<g transform="translate(${x} 70)"><path d="M-14 0 H14 L8 18 H-8Z" fill="#fde68a" stroke="${INK}" stroke-width="1.6"/><circle cx="0" cy="24" r="22" fill="#fde68a" opacity=".25"/></g>`).join('')}
    ${clock(400, 100, 18, t)}`;
}
function trolley(x, y) {
  return `<g transform="translate(${x} ${y})"><rect x="0" y="-120" width="110" height="10" fill="#94a3b8" ${O} stroke-width="2"/><rect x="0" y="-70" width="110" height="10" fill="#94a3b8" ${O} stroke-width="2"/><rect x="0" y="-20" width="110" height="10" fill="#94a3b8" ${O} stroke-width="2"/>
    ${[0, 1, 2].map((i) => `<rect x="${8 + i * 32}" y="-108" width="26" height="36" rx="4" fill="#fff" ${O} stroke-width="1.6"/><path d="M${8 + i * 32} -96 h26" stroke="#2a9d8f" stroke-width="3"/>`).join('')}
    <rect x="10" y="-58" width="40" height="36" rx="3" fill="#2a9d8f" stroke="${INK}" stroke-width="1.6"/><rect x="58" y="-58" width="40" height="36" rx="3" fill="#e9f5f3" stroke="${INK}" stroke-width="1.6"/>
    <path d="M110 -120 L130 -140" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><circle cx="12" cy="0" r="8" fill="${INK}"/><circle cx="98" cy="0" r="8" fill="${INK}"/></g>`;
}
function bedroom(t) {
  return `<rect width="800" height="450" fill="#eef2f7"/><rect x="0" y="0" width="800" height="250" fill="#e6ecf5"/>
    <g transform="translate(470 40)"><rect width="270" height="190" rx="6" fill="#cbd5e1" ${B}/><g transform="translate(8 8)"><svg width="254" height="174" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice">${skyline(false)}${plane(300, 80, 1.6)}</svg></g><path d="M135 8 V182" stroke="#e2e8f0" stroke-width="6"/>
      <path d="M-20 -10 H40 V200 H-30Z" fill="#c4b5fd" ${B} opacity=".9"/><path d="M290 -10 H230 V200 H300Z" fill="#c4b5fd" ${B} opacity=".9"/></g>
    <rect x="0" y="352" width="800" height="98" fill="#c7b8a1"/><path d="M0 352 H800" stroke="${INK}" stroke-width="2.2"/>
    <g transform="translate(60 380)"><rect x="0" y="-150" width="22" height="150" fill="#8a5a3b" ${O}/><rect x="0" y="-150" width="360" height="70" rx="10" fill="#8a5a3b" ${O}/><rect x="10" y="-80" width="350" height="60" rx="8" fill="#fff" ${O}/><path d="M10 -60 H360" stroke="#e2e8f0" stroke-width="3"/><rect x="200" y="-80" width="160" height="60" rx="8" fill="#e0e7ff" ${O} stroke-width="2"/><rect x="24" y="-104" width="70" height="30" rx="10" fill="#fff" ${O} stroke-width="2"/><rect x="104" y="-104" width="70" height="30" rx="10" fill="#fff" ${O} stroke-width="2"/></g>
    ${clock(420, 70, 20, t)}`;
}
function hotelRestaurant(t) {
  return `<rect width="800" height="450" fill="#f6efe4"/>
    <g transform="translate(40 30)"><rect width="720" height="200" rx="6" fill="#d1d5db" ${B}/><g transform="translate(8 8)"><svg width="704" height="184" viewBox="0 0 800 210" preserveAspectRatio="xMidYMid slice"><rect width="800" height="210" fill="#bfe0ff"/><path d="M0 150 C200 120 400 160 800 130 V210 H0Z" fill="#60a5fa"/><path d="M0 170 C220 150 520 180 800 160 V210 H0Z" fill="#3b82f6"/>${[[120, 120], [520, 110]].map(([x, y]) => `<path d="M${x} ${y} l18 -40 l18 40z" fill="#fff" stroke="${INK}" stroke-width="1.4"/><path d="M${x + 6} ${y} q12 8 24 0" fill="#ef4444"/>`).join('')}</svg></g>${[180, 360, 540].map((x) => `<path d="M${x} 8 V192" stroke="#e5e7eb" stroke-width="6"/>`).join('')}</g>
    ${[160, 640].map((x) => `<g transform="translate(${x} 250)"><path d="M0 0 V-40" stroke="${INK}" stroke-width="2"/><path d="M-22 -40 H22 L14 -62 H-14Z" fill="#fbbf24" ${O} stroke-width="1.8"/></g>`).join('')}
    <rect x="0" y="352" width="800" height="98" fill="#d6c3a5"/><path d="M0 352 H800" stroke="${INK}" stroke-width="2.2"/>${clock(400, 260, 18, t)}`;
}
const table = (x, y, w = 160) => `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="0" rx="${w / 2}" ry="14" fill="#fff" ${O}/><path d="M-${w / 2} 0 V14 Q0 30 ${w / 2} 14 V0" fill="#f1f5f9" ${O}/><path d="M-6 26 V96 M6 26 V96" stroke="${INK}" stroke-width="4"/><path d="M-30 96 H30" stroke="${INK}" stroke-width="5" stroke-linecap="round"/></g>`;
const plate = (x, y, food = '#f59e0b') => `<g transform="translate(${x} ${y})"><ellipse rx="22" ry="7" fill="#fff" ${O} stroke-width="1.6"/><ellipse cx="0" cy="-3" rx="12" ry="5" fill="${food}"/><ellipse cx="6" cy="-4" rx="5" ry="3" fill="#16a34a"/></g>`;

/* ---------- Scenes ---------- */
export const SCENES = {
  night: (t) => `${lobby(t, true)}
    ${person('desk', 128, 352, { pose: 'type', look: 3, mood: 'focus' })}
    ${desk(80, 300, 330, true)}
    ${laptop(196, 196, `<rect x="16" y="16" width="168" height="90" rx="6" fill="#0f172a"/><text x="28" y="42" font-size="9" font-weight="800" letter-spacing="1" fill="#93c5fd">NIGHT AUDIT</text><rect class="grow" style="animation-delay:.6s" x="28" y="56" width="140" height="8" rx="4" fill="#34d399"/><text x="28" y="88" font-size="10" fill="#e2e8f0">18 rooms posted</text>`, 170)}
    ${mug(392, 290)}
    ${callout(460, 300, 300, 130, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">NIGHT AUDIT · 03:00</text>
      ${row('Room nights posted', '18', 22, 268)}${row('Restaurant and bar', 'all on folios', 40, 268)}
      <rect class="pop" style="animation-delay:1.4s" y="54" width="268" height="22" rx="6" fill="#dcfce7"/><text class="pop" style="animation-delay:1.4s" x="8" y="69" font-size="9.5" font-weight="700" fill="${C.green}">✓ Yesterday closed · the new day starts</text>`, 300, 240, { title: 'Clafina · Front desk', delay: .3 })}
    ${hand(166, 150, 'z z z', 24, '#93c5fd', 'fadein', 1, -8)}`,

  housekeeping: (t) => `${corridor(t)}
    ${trolley(430, 410)}
    ${person('marta', 360, 420, { pose: 'look', hold: 'phoneBack', look: 3 })}
    ${callout(470, 160, 300, 196, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">MY ROOMS TODAY · ⟦u:housekeeper⟧</text>
      <g class="pop" style="animation-delay:.6s"><rect y="12" width="268" height="30" rx="8" fill="#fef3c7"/><text x="10" y="31" font-size="10.5" font-weight="800" fill="#a15c07">108 · early arrival · do first</text></g>
      ${['112 · checkout', '204 · stayover', '206 · checkout', '215 · stayover'].map((r, i) => `<text y="${62 + i * 20}" font-size="10" fill="${INK}">${r}</text>`).join('')}`, ...at(360, 420, 'look'), { title: 'Clafina · Housekeeping', delay: .2 })}
    ${bubble(80, 150, 170, 50, '108 first!', { tail: 'right', delay: 1.6, size: 26 })}`,

  ready: (t) => `${bedroom(t)}
    ${person('marta', 520, 410, { pose: 'look', hold: 'phoneBack', look: -3, mood: 'grin' })}
    ${sparkle(150, 220, 1.2, C.amber, .8)}${sparkle(300, 210, .9, C.teal, 1)}
    ${callout(40, 30, 300, 150, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">ROOM 108</text>
      <g transform="translate(0 16)">${[['Dirty', '#fee2e2', C.red], ['Clean', '#fef3c7', '#a15c07'], ['Inspected', '#dcfce7', C.green]].map(([l, bg, fg], i) => `<g class="pop" style="animation-delay:${.4 + i * .7}s"><rect x="${i * 92}" y="0" width="84" height="30" rx="15" fill="${bg}"/><text x="${i * 92 + 42}" y="20" text-anchor="middle" font-size="10.5" font-weight="800" fill="${fg}">${l}</text></g>`).join('')}</g>
      <text class="fadein" style="animation-delay:2.4s" y="74" font-size="9.5" fill="#6b7590">The desk sees each change at once, no refresh</text>`, ...at(520, 410, 'look', true), { title: 'Clafina · Housekeeping', delay: .2 })}`,

  arrive: (t) => `${lobby(t)}
    ${desk(330, 310, 300)}
    ${person('desk', 520, 312, { pose: 'wave', mood: 'grin', hide: 'legs', flip: true })}
    ${person('novak', 210, 410, { pose: 'stand', look: 3 })}${suitcase(130, 410)}
    ${motion(90, 300, 3, 40)}
    ${callout(30, 30, 270, 170, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">ARRIVING · 11:00</text>
      <text y="22" font-size="12" font-weight="800" fill="${INK}">⟦n:earlyGuest⟧</text>
      <rect y="32" width="238" height="24" rx="7" fill="#fef3c7"/><text x="10" y="48" font-size="9.5" font-weight="700" fill="#a15c07">108 · still being cleaned</text>
      <g class="pop" style="animation-delay:1.2s"><rect y="62" width="238" height="24" rx="7" fill="#dcfce7"/><text x="10" y="78" font-size="9.5" font-weight="700" fill="${C.green}">✓ Moved to 109 · inspected, free tonight</text></g>`, 520, 280, { title: 'Clafina · Front desk', delay: .2 })}
    ${bubble(250, 200, 160, 50, 'Early flight!', { tail: 'left', delay: 1.6, size: 24 })}`,

  lunch: (t) => `${hotelRestaurant(t)}
    ${table(300, 360, 200)}${plate(270, 356)}${plate(330, 356, '#ef4444')}
    ${person('lindq', 190, 420, { pose: 'stand', mood: 'grin', look: 3 })}
    ${person('waiter', 470, 420, { pose: 'look', hold: 'phoneBack', look: -3 })}
    ${callout(520, 250, 250, 150, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">LUNCH · TABLE 4</text>
      ${row('Guest', '⟦n:lunchGuest⟧', 22, 218)}${row('Total', '⟦x:23400⟧', 40, 218, true)}
      <g class="press" style="animation-delay:1.2s"><rect y="54" width="218" height="28" rx="8" fill="${C.violet}"/><text x="109" y="73" text-anchor="middle" font-size="10.5" font-weight="800" fill="#fff">Charge to room 214</text></g>`, ...at(470, 420, 'look', true), { title: 'Clafina · Restaurant', delay: .2 })}
    ${bubble(60, 220, 170, 50, 'On my room, please.', { tail: 'right', delay: .6, size: 20 })}`,

  company: (t) => `<rect width="800" height="450" fill="#eef2ff"/>${clock(380, 70, 26, t)}
    <rect x="0" y="352" width="800" height="98" fill="#c9d3ec"/><path d="M0 352 H800" stroke="${INK}" stroke-width="2.2"/>
    <path d="M40 300 H380 L400 318 H20Z" fill="#b07a52" ${O}/><rect x="20" y="318" width="380" height="12" fill="#8a5a3b" ${O}/>
    ${person('hmgr', 300, 300, { pose: 'type', hide: 'legs', look: -3, mood: 'focus' })}
    ${laptop(90, 172, `<rect x="16" y="16" width="168" height="90" rx="6" fill="#eef2ff"/><text x="26" y="36" font-size="8.5" font-weight="800" fill="#3d4a66">FOLIO · SPLIT</text><rect x="26" y="46" width="70" height="50" rx="5" fill="#dbeafe"/><rect x="104" y="46" width="70" height="50" rx="5" fill="#fef3c7"/>`)}
    ${callout(440, 50, 330, 230, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">WHO PAYS WHAT</text>
      <rect y="12" width="140" height="150" rx="10" fill="#eff6ff"/><text x="10" y="32" font-size="9.5" font-weight="800" fill="${C.blue}">⟦n:company⟧</text>
      ${['3 rooms × 4 nights', 'Breakfast'].map((l, i) => `<text x="10" y="${54 + i * 18}" font-size="9.5" fill="${INK}">${l}</text>`).join('')}<text x="10" y="146" font-size="12" font-weight="900" fill="${INK}">⟦x:540000⟧</text>
      <rect x="156" y="12" width="140" height="150" rx="10" fill="#fff7ed"/><text x="166" y="32" font-size="9.5" font-weight="800" fill="#a15c07">The guests</text>
      ${['Lunch', 'Bar', 'Laundry'].map((l, i) => `<text x="166" y="${54 + i * 18}" font-size="9.5" fill="${INK}">${l}</text>`).join('')}<text x="166" y="146" font-size="12" font-weight="900" fill="${INK}">⟦x:46800⟧</text>`, 400, 250, { title: 'Clafina · Folio', delay: .2 })}`,

  weekend: (t) => `<rect width="800" height="450" fill="#f3eee6"/>${clock(730, 60, 24, t)}
    <g transform="translate(40 40)" class="pop" style="animation-delay:.3s"><rect width="180" height="230" rx="6" fill="#6d4fe0" ${O}/><text x="90" y="52" text-anchor="middle" font-size="22" font-weight="900" fill="#fde68a">TRADE</text><text x="90" y="80" text-anchor="middle" font-size="22" font-weight="900" fill="#fde68a">FAIR</text><text x="90" y="116" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">27–29 November</text>
      ${[0, 1, 2, 3].map((i) => `<rect x="${24 + i * 34}" y="140" width="26" height="60" rx="4" fill="#fff" opacity=".85"/>`).join('')}</g>
    <rect x="0" y="352" width="800" height="98" fill="#d9cbb3"/><path d="M0 352 H800" stroke="${INK}" stroke-width="2.2"/>
    ${person('hmgr', 300, 420, { pose: 'look', hold: 'phoneBack', look: 3 })}
    ${callout(390, 70, 360, 250, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">RATES · NOVEMBER</text>
      <g transform="translate(0 14)">${Array.from({ length: 14 }, (_, i) => { const d = 17 + i; const hot = d >= 27 && d <= 29; return `<g class="${hot ? 'pop' : ''}" style="animation-delay:${hot ? .8 + (d - 27) * .25 : 0}s"><rect x="${(i % 7) * 46}" y="${Math.floor(i / 7) * 52}" width="40" height="46" rx="8" fill="${hot ? '#ede9fe' : '#f8fafc'}" stroke="${hot ? C.violet : '#e2e8f0'}" stroke-width="${hot ? 2 : 1}"/><text x="${(i % 7) * 46 + 20}" y="${Math.floor(i / 7) * 52 + 20}" text-anchor="middle" font-size="11" font-weight="800" fill="${INK}">${d}</text><text x="${(i % 7) * 46 + 20}" y="${Math.floor(i / 7) * 52 + 36}" text-anchor="middle" font-size="7.5" fill="${hot ? C.violet : '#6b7590'}">${hot ? '+25%' : 'base'}</text></g>`; }).join('')}</g>
      <rect class="pop" style="animation-delay:1.8s" y="130" width="316" height="26" rx="7" fill="#ede9fe"/><text class="pop" style="animation-delay:1.8s" x="10" y="147" font-size="10" font-weight="700" fill="${C.violet}">Special date · 2-night minimum · price shown step by step</text>`, ...at(300, 420, 'look'), { title: 'Clafina · Rates', delay: .2 })}`,

  move: (t) => `${lobby(t)}
    ${desk(300, 310, 300)}
    ${person('desk', 480, 312, { pose: 'look', hold: 'phoneBack', hide: 'legs', look: -3, flip: true })}
    ${person('duarte', 200, 412, { pose: 'stand', look: 3 })}${suitcase(110, 412, .8)}
    ${callout(20, 30, 290, 190, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">ROOM RACK · LAST 2 NIGHTS</text>
      ${[['302', 'street side', '#fee2e2'], ['418', 'garden · quiet', '#dcfce7']].map(([r, n, bg], i) => `<rect y="${16 + i * 48}" width="258" height="38" rx="8" fill="#f8fafc" stroke="#e2e8f0"/><text x="10" y="${40 + i * 48}" font-size="12" font-weight="900" fill="${INK}">${r}</text><text x="50" y="${40 + i * 48}" font-size="9.5" fill="#6b7590">${n}</text>`).join('')}
      <g class="slide-down" style="animation-delay:.8s"><rect x="160" y="22" width="90" height="26" rx="6" fill="${C.violet}"/><text x="205" y="39" text-anchor="middle" font-size="9.5" font-weight="800" fill="#fff">⟦n:movingGuest⟧</text></g>
      <text class="fadein" style="animation-delay:2.2s" y="128" font-size="9.5" fill="#6b7590">Rooms already held are refused, so no one is double-booked</text>`, 480, 260, { title: 'Clafina · Room rack', delay: .2 })}
    ${bubble(240, 230, 170, 50, 'Somewhere quieter?', { tail: 'left', delay: 1.4, size: 21 })}`,
};

function mug(x, y) { return `<g transform="translate(${x} ${y})"><path d="M-12 -26 H12 V-4 Q12 0 8 0 H-8 Q-12 0 -12 -4Z" fill="#fff" ${O}/><path d="M12 -20 Q22 -20 22 -13 Q22 -6 12 -6" fill="none" ${O}/><path class="steam" d="M-4 -32 Q-8 -40 -4 -46" fill="none" stroke="#cbd5e1" stroke-width="2.4" stroke-linecap="round"/></g>`; }
