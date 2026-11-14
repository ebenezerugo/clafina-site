/** A day at the shop: opening float, the line drops with a queue, points and cash, an online order, a kettle back, two tills sold the last blender, a weekend banner, the evening count. */
import { INK, C, O, B, person, callout, clock, bubble, hand, sparkle, handAt, phone, laptop } from '../kit.mjs';

const at = (x, y, pose, flip = false) => { const [hx, hy] = handAt(x, y, pose, 'R', 1, flip); return [hx, hy - 16]; };
const row = (k, v, y, w, col = INK) => `<text y="${y}" font-size="9.5" fill="#6b7590">${k}</text><text x="${w}" y="${y}" text-anchor="end" font-size="10" font-weight="700" fill="${col}">${v}</text>`;

/* ---------- The shop world ---------- */
function blender(x, y, s = 1) { return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-14" y="-8" width="28" height="8" rx="2" fill="#334155" ${O} stroke-width="1.6"/><path d="M-12 -8 L-10 -50 H10 L12 -8Z" fill="#bfdbfe" opacity=".85" ${O} stroke-width="1.6"/><rect x="-11" y="-56" width="22" height="7" rx="2" fill="#334155" stroke="${INK}" stroke-width="1.4"/></g>`; }
function kettle(x, y, s = 1) { return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-16 0 Q-20 -30 -10 -36 H10 Q20 -30 16 0Z" fill="#e11d48" ${O} stroke-width="1.8"/><path d="M16 -28 Q30 -24 22 -8" fill="none" stroke="${INK}" stroke-width="3"/><path d="M-16 -22 L-26 -30" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><rect x="-8" y="-42" width="16" height="6" rx="2" fill="#334155"/></g>`; }
function lamp(x, y, s = 1) { return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-14 0 H14 L10 -4 H-10Z" fill="#334155"/><path d="M0 -4 V-34" stroke="${INK}" stroke-width="2.4"/><path d="M-14 -34 H14 L8 -52 H-8Z" fill="#fbbf24" ${O} stroke-width="1.6"/></g>`; }
function shelfWall() {
  return `${[0, 1, 2].map((r) => `<rect x="20" y="${110 + r * 80}" width="360" height="9" rx="2" fill="#a16207" ${B}/>`).join('')}
    ${[60, 140, 220, 300].map((x) => blender(x, 110)).join('')}${[50, 110, 170, 230, 290, 350].map((x) => kettle(x, 190, .9)).join('')}${[60, 130, 200, 270, 340].map((x) => lamp(x, 270, .9)).join('')}`;
}
function shopInside(t, dusk = false) {
  return `<rect width="800" height="450" fill="${dusk ? '#efe6dd' : '#f5f1ea'}"/><rect x="0" y="0" width="800" height="40" fill="#0f766e"/><text x="400" y="27" text-anchor="middle" font-size="15" font-weight="900" letter-spacing="3" fill="#fff">⟦u:store⟧</text>
    ${shelfWall()}${clock(450, 90, 22, t)}
    <rect x="0" y="352" width="800" height="98" fill="#d8cbb6"/><path d="M0 352 H800" stroke="${INK}" stroke-width="2.2"/>${Array.from({ length: 16 }, (_, i) => `<rect x="${i * 54}" y="${352 + (i % 2) * 49}" width="54" height="49" fill="none" stroke="#c9b99f" stroke-width="2"/>`).join('')}`;
}
function counter(x, y, w = 300) {
  return `<g transform="translate(${x} ${y})"><path d="M0 0 H${w} V96 H0Z" fill="#0f766e" ${O}/><path d="M-8 -12 H${w + 8} V0 H-8Z" fill="#14b8a6" ${O}/><path d="M18 18 H${w - 18}" stroke="#fff" stroke-width="2" opacity=".2"/></g>`;
}
function till(x, y, offline = false, label = 'TILL 1') {
  return `<g transform="translate(${x} ${y})"><path d="M-10 0 h20 l6 -34 h-32z" fill="#334155" ${O} stroke-width="1.8"/><rect x="-46" y="-104" width="92" height="70" rx="6" fill="#1b2033" ${O} stroke-width="2"/><rect x="-40" y="-98" width="80" height="58" rx="3" fill="${offline ? '#fff7ed' : '#fff'}"/>
    <text x="0" y="-84" text-anchor="middle" font-size="7.5" font-weight="800" fill="#3d4a66">${label}</text>
    ${offline ? `<g class="pop" style="animation-delay:.6s"><rect x="-36" y="-76" width="72" height="20" rx="10" fill="#fde68a"/><text x="0" y="-68" text-anchor="middle" font-size="6.5" font-weight="900" fill="#a15c07">OFFLINE</text><text x="0" y="-59.5" text-anchor="middle" font-size="6" font-weight="800" fill="#a15c07">still selling</text></g>` : '<rect x="-34" y="-74" width="68" height="8" rx="4" fill="#e2e8f0"/>'}
    <rect x="-34" y="-52" width="68" height="8" rx="3" fill="${C.blue}"/></g>`;
}
function router(x, y) {
  return `<g transform="translate(${x} ${y})"><rect x="-26" y="-14" width="52" height="16" rx="4" fill="#e2e8f0" ${O} stroke-width="1.8"/><path d="M-14 -14 V-34 M14 -14 V-34" stroke="${INK}" stroke-width="2.4"/>${[-12, 0, 12].map((x2, i) => `<circle class="blink" style="animation-delay:${i * .2}s" cx="${x2}" cy="-6" r="2.6" fill="${C.red}"/>`).join('')}
    <g class="pop" style="animation-delay:.3s"><path d="M30 -46 a26 26 0 0 1 36 0 M38 -36 a14 14 0 0 1 20 0" fill="none" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/><path d="M28 -54 L70 -24" stroke="${C.red}" stroke-width="4" stroke-linecap="round"/></g></g>`;
}
function street(t, dusk = false) {
  const sky = dusk ? ['#ffb36b', '#ffd9a8'] : ['#b9d8ff', '#e8f2ff'];
  return `<defs><linearGradient id="rsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs><rect width="800" height="450" fill="url(#rsk)"/>
    ${[[0, 150, '#e9d5b8'], [600, 130, '#cfd8e3']].map(([x, h, c]) => `<rect x="${x}" y="${352 - 260}" width="200" height="260" fill="${c}" ${B}/>${[0, 1, 2].map((r) => [0, 1].map((cc) => `<rect x="${x + 30 + cc * 90}" y="${120 + r * 60}" width="50" height="36" fill="${dusk ? '#fde68a' : '#dbeafe'}" ${B}/>`).join('')).join('')}`).join('')}
    <rect x="200" y="70" width="400" height="282" fill="#f8fafc" ${O}/>
    ${Array.from({ length: 8 }, (_, i) => `<path d="M${200 + i * 50} 70 h50 v18 q-25 14 -50 0z" fill="${i % 2 ? '#fff' : '#0f766e'}" stroke="${INK}" stroke-width="1.8"/>`).join('')}
    <rect x="240" y="104" width="320" height="34" rx="4" fill="#0f766e" ${O} stroke-width="2"/><text x="400" y="127" text-anchor="middle" font-size="15" font-weight="900" letter-spacing="2" fill="#fff">⟦u:store⟧</text>
    <rect x="230" y="160" width="200" height="180" fill="#dbeafe" ${O}/><g transform="translate(230 160)">${blender(50, 150, 1.2)}${kettle(120, 150, 1.1)}${lamp(170, 150)}</g>
    <rect x="450" y="160" width="110" height="192" fill="#0f766e" ${O}/><circle cx="545" cy="260" r="5" fill="#fbbf24"/>
    <rect x="0" y="352" width="800" height="98" fill="#cbd5e1"/><path d="M0 352 H800" stroke="${INK}" stroke-width="2.2"/><rect x="0" y="420" width="800" height="30" fill="#64748b"/>`;
}
const coins = (x, y, n = 5) => `<g transform="translate(${x} ${y})">${Array.from({ length: n }, (_, i) => `<ellipse cx="0" cy="${-i * 5}" rx="16" ry="6" fill="#fbbf24" stroke="#b45309" stroke-width="1.6"/>`).join('')}</g>`;
const notes = (x, y, n = 3) => `<g transform="translate(${x} ${y})">${Array.from({ length: n }, (_, i) => `<rect x="${-26 + i * 3}" y="${-14 - i * 4}" width="52" height="26" rx="3" fill="#86efac" stroke="#15803d" stroke-width="1.6"/>`).join('')}</g>`;
const drawer = (x, y) => `<g transform="translate(${x} ${y})"><path d="M-80 0 H80 L70 26 H-70Z" fill="#334155" ${O}/>${[-50, -16, 18, 52].map((cx) => `<rect x="${cx - 14}" y="-10" width="28" height="18" rx="2" fill="#475569" stroke="${INK}" stroke-width="1.2"/>`).join('')}${coins(-50, 0, 3)}${coins(-16, 0, 2)}${notes(36, 0, 3)}</g>`;

/* ---------- Scenes ---------- */
export const SCENES = {
  open: (t) => `${street(t)}
    <g class="shutter"><rect x="230" y="160" width="330" height="192" fill="#94a3b8" ${O}/>${Array.from({ length: 12 }, (_, i) => `<path d="M230 ${172 + i * 15} H560" stroke="#64748b" stroke-width="2.4"/>`).join('')}</g>
    ${person('lily', 640, 420, { pose: 'look', hold: 'phoneBack', look: -3, mood: 'grin', flip: true })}
    ${callout(20, 150, 200, 170, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">OPEN SHIFT · TILL 1</text>
      ${row('Float counted', '⟦x:20000⟧', 24, 168)}${row('Expected', '⟦x:20000⟧', 42, 168)}
      <rect class="pop" style="animation-delay:1.6s" y="56" width="168" height="24" rx="7" fill="#dcfce7"/><text class="pop" style="animation-delay:1.6s" x="10" y="72" font-size="9.5" font-weight="700" fill="${C.green}">✓ Matches · shift open</text>`, ...at(640, 420, 'look', true), { title: 'Clafina · Till', delay: .4 })}
    ${hand(250, 60, 'good morning, high street', 24, '#0f766e', 'fadein', 1.2, -3)}`,

  offline: (t) => `${shopInside(t)}
    ${counter(380, 300, 360)}${till(470, 300, true)}${router(690, 290)}
    ${person('lily', 560, 300, { pose: 'type', hide: 'legs', look: -3, flip: true, mood: 'focus' })}
    ${[0, 1, 2].map((i) => person(['shopper', 'shopper2', 'whit'][i], 120 + i * 80, 430, { pose: 'stand', look: 3, s: .95 })).join('')}
    ${callout(20, 10, 280, 120, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">TILL 1 · NO INTERNET</text>
      <text y="22" font-size="11" font-weight="800" fill="${INK}">Still selling · 14 sales waiting to sync</text>
      <rect class="grow" style="animation-delay:1s" y="34" width="180" height="8" rx="4" fill="#f59e0b"/>`, 470, 230, { title: 'Clafina · Till', delay: .2 })}
    ${hand(450, 420, 'the queue keeps moving', 28, '#a15c07', 'fadein', 1.6, -3)}`,

  points: (t) => `${shopInside(t)}
    ${counter(250, 300, 330)}${till(350, 300)}
    ${person('lily', 450, 300, { pose: 'type', hide: 'legs', look: -3, flip: true })}
    ${person('whit', 160, 430, { pose: 'stand', look: 3, mood: 'grin' })}
    ${callout(580, 90, 200, 210, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">PAY · 2 WAYS</text>
      <text y="22" font-size="10.5" font-weight="800" fill="${INK}">⟦n:regular⟧</text>
      ${row('Total', '⟦x:38500⟧', 44, 168)}
      <g class="pop" style="animation-delay:.8s"><rect y="56" width="168" height="26" rx="7" fill="#ede9fe"/><text x="10" y="73" font-size="9.5" font-weight="700" fill="${C.violet}">Points</text><text x="158" y="73" text-anchor="end" font-size="10" font-weight="800" fill="${C.violet}">−⟦x:5000⟧</text></g>
      <g class="pop" style="animation-delay:1.4s"><rect y="88" width="168" height="26" rx="7" fill="#dcfce7"/><text x="10" y="105" font-size="9.5" font-weight="700" fill="${C.green}">Cash</text><text x="158" y="105" text-anchor="end" font-size="10" font-weight="800" fill="${C.green}">⟦x:33500⟧</text></g>`, 350, 220, { title: 'Clafina · Till', delay: .2 })}
    ${bubble(40, 170, 190, 50, 'Use my points first!', { tail: 'right', delay: .4, size: 20 })}`,

  online: (t) => `${shopInside(t)}
    ${person('shopper2', 260, 430, { pose: 'point', look: -3, flip: true })}
    <g transform="translate(140 82)"><circle r="38" fill="none" stroke="${C.blue}" stroke-width="4" stroke-dasharray="6 6" class="pop" style="animation-delay:.4s"/></g>
    ${phone(590, 90, 140, 260, `<rect width="124" height="244" rx="18" fill="#fff"/><rect x="0" y="0" width="124" height="36" rx="12" fill="#0f766e"/><text x="62" y="23" text-anchor="middle" font-size="7.5" font-weight="900" fill="#fff">⟦u:store⟧</text>
      <g transform="translate(62 116)">${blender(0, 0, 1.6)}</g><text x="62" y="140" text-anchor="middle" font-size="9" font-weight="800" fill="${INK}">Blender 1.5 L</text><text x="62" y="156" text-anchor="middle" font-size="10" font-weight="900" fill="${INK}">⟦x:45000⟧</text>
      <g class="press" style="animation-delay:1s"><rect x="14" y="170" width="96" height="26" rx="8" fill="#0f766e"/><text x="62" y="187" text-anchor="middle" font-size="9" font-weight="800" fill="#fff">Buy, collect today</text></g>`, { cls: 'bob' })}
    ${callout(330, 40, 240, 110, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">STOCK · BLENDER 1.5 L</text>
      ${row('On the shelf', '2', 24, 198)}${row('Held for online order', '1', 42, 198, C.violet)}
      <rect class="pop" style="animation-delay:1.8s" y="56" width="198" height="24" rx="7" fill="#eef2ff"/><text class="pop" style="animation-delay:1.8s" x="10" y="72" font-size="9.5" font-weight="700" fill="${C.blue}">Same stock, shop and shelf</text>`, 600, 200, { title: 'Clafina · Stock', delay: .3 })}`,

  return: (t) => `${shopInside(t)}
    ${counter(250, 300, 330)}${till(350, 300)}
    ${person('clara', 460, 300, { pose: 'look', hold: 'phoneBack', hide: 'legs', look: -3, flip: true })}
    ${person('shopper', 150, 430, { pose: 'carry', look: 3 })}<g transform="translate(150 430)">${kettle(0, -50, .95)}</g>
    ${callout(560, 70, 220, 200, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">RETURN · RECEIPT 8841</text>
      ${row('Kettle 1.7 L', '⟦x:18500⟧', 24, 188)}${row('Paid by', 'card, last week', 42, 188)}
      <g class="pop" style="animation-delay:1s"><rect y="56" width="188" height="26" rx="7" fill="#dcfce7"/><text x="10" y="73" font-size="9.5" font-weight="700" fill="${C.green}">Refund to the same card</text></g>
      <text class="fadein" style="animation-delay:1.6s" y="102" font-size="9.5" fill="#6b7590">Back into stock, books updated</text>`, ...at(460, 300, 'look', true), { title: 'Clafina · Returns', delay: .2 })}`,

  clash: (t) => `${shopInside(t)}
    ${counter(60, 300, 680)}${till(200, 300)}${till(600, 300, false, 'TILL 2')}
    ${person('lily', 300, 300, { pose: 'look', hold: 'phoneBack', hide: 'legs', look: 3 })}
    <g transform="translate(400 290)">${blender(0, 0, 1.3)}<g class="pop" style="animation-delay:.8s"><circle cx="0" cy="-90" r="20" fill="#fef3c7" ${O} stroke-width="2"/><text x="0" y="-83" text-anchor="middle" font-size="20" font-weight="900" fill="#a15c07">!</text></g></g>
    ${callout(440, 50, 330, 170, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">SYNC EXCEPTIONS · ⟦u:branchRoad⟧</text>
      <text y="22" font-size="11" font-weight="800" fill="${INK}">Last blender sold twice while offline</text>
      ${row('Till 1 · 10:22', '1 sold', 44, 298)}${row('Till 2 · 10:31', '1 sold', 62, 298)}
      <g class="pop" style="animation-delay:1.4s"><rect y="76" width="298" height="26" rx="7" fill="#eef2ff"/><text x="10" y="93" font-size="9.5" font-weight="700" fill="${C.blue}">Transfer one from ⟦n:branch2⟧ · one tap</text></g>`, ...at(300, 300, 'look'), { title: 'Clafina · Sync', delay: .2 })}`,

  banner: (t) => `${shopInside(t)}
    ${person('clara', 470, 300, { pose: 'type', hide: 'legs', look: 3, mood: 'grin' })}
    <path d="M380 300 H780 L790 318 H370Z" fill="#a16207" ${O}/><rect x="370" y="318" width="420" height="12" fill="#854d0e" ${O}/>
    ${laptop(540, 172, `<rect x="16" y="16" width="168" height="90" rx="6" fill="#fff"/><g class="slidein" style="animation-delay:.6s"><rect x="16" y="16" width="168" height="44" fill="#f59e0b"/><text x="100" y="36" text-anchor="middle" font-size="10" font-weight="900" fill="#fff">WEEKEND OFFER</text><text x="100" y="52" text-anchor="middle" font-size="8" font-weight="700" fill="#fff">20% off kitchen appliances</text></g>${[0, 1, 2].map((i) => `<rect x="${24 + i * 54}" y="68" width="46" height="32" rx="4" fill="#f1f5f9"/>`).join('')}`)}
    ${callout(40, 70, 290, 150, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">STOREFRONT STUDIO · HOME</text>
      <text y="22" font-size="11" font-weight="800" fill="${INK}">Banner: Weekend offer</text>${row('Shows', 'Fri 18:00 to Sun 23:59', 44, 258)}
      <g class="press" style="animation-delay:1.8s"><rect y="58" width="258" height="28" rx="8" fill="#0f766e"/><text x="129" y="77" text-anchor="middle" font-size="10.5" font-weight="800" fill="#fff">Publish</text></g>`, 560, 230, { title: 'Clafina · Online shop', delay: .2 })}
    ${sparkle(700, 160, 1.1, C.amber, 2.2)}`,

  close: (t) => `${shopInside(t, true)}
    ${counter(250, 300, 330)}${drawer(415, 300)}
    ${person('lily', 410, 300, { pose: 'type', hide: 'legs', look: 3, mood: 'focus' })}
    <g transform="translate(600 160)"><rect width="150" height="190" rx="6" fill="#1e293b" ${B}/><rect x="8" y="8" width="134" height="174" rx="4" fill="#fdba74"/><circle cx="110" cy="60" r="20" fill="#fef3c7"/><path d="M8 140 Q75 120 142 140 V182 H8Z" fill="#7c2d12" opacity=".5"/></g>
    ${callout(20, 60, 260, 210, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">CLOSE SHIFT · TILL 1</text>
      ${row('Counted', '⟦x:284500⟧', 24, 228)}${row('Expected', '⟦x:284500⟧', 42, 228)}${row('Card and transfer', 'matched', 60, 228)}
      <rect class="pop" style="animation-delay:1.6s" y="74" width="228" height="26" rx="7" fill="#dcfce7"/><text class="pop" style="animation-delay:1.6s" x="10" y="91" font-size="10" font-weight="800" fill="${C.green}">✓ Drawer matches the day</text>`, 410, 220, { title: 'Clafina · Till', delay: .2 })}
    ${hand(470, 140, 'to the coin', 28, '#0f766e', 'fadein', 2, -5)}`,
};
