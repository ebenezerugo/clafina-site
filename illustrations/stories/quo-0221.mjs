/** The journey of QUO-0221: eleven scenes of one sale, from ⟦n:sales⟧'s quote to the books posting themselves. */
import { INK, C, O, B, POSES, SHOULDER, joints, angles, handAt, person, callout, clock, plant, mug, doc, phone, laptop, box, stampMark, bubble, hand, sparkle, motion, notify, office, shopfront, warehouse, street } from '../kit.mjs';

export const SCENES = {
  write: (t) => `${office(t)}
    ${person('maya', 250, 352, { pose: 'type', mood: 'focus', look: 2 })}
    <g transform="translate(176 206)"><path d="M6 0 H150 Q156 0 156 6 L160 94 H2 L6 6 Q6 0 12 0Z" fill="#cdd4e4" ${O}/><path d="M18 10 L26 84" stroke="#fff" stroke-width="5" opacity=".45" stroke-linecap="round"/>
      <circle cx="80" cy="48" r="13" fill="${C.violet}" ${O} stroke-width="2"/><text x="80" y="54" text-anchor="middle" font-size="14" font-weight="900" fill="#fff">C</text>
      <g transform="translate(112 62) rotate(8)"><rect width="38" height="30" fill="#fde68a" stroke="${INK}" stroke-width="1.6"/><text x="5" y="13" font-family="Caveat, cursive" font-size="11" fill="${INK}">⟦n:customer⟧</text><text x="5" y="25" font-family="Caveat, cursive" font-size="11" fill="${INK}">40 ctns</text></g></g>
    <path d="M40 300 H540 L574 328 H8Z" fill="${C.wood}" ${O}/><path d="M60 304 H520" stroke="#fff" stroke-width="2" opacity=".25"/><rect x="8" y="328" width="566" height="15" fill="${C.woodDark}" ${O}/><rect x="40" y="343" width="15" height="80" fill="${C.woodDark}" ${O}/><rect x="526" y="343" width="15" height="80" fill="${C.woodDark}" ${O}/>
    <ellipse cx="256" cy="302" rx="92" ry="5" fill="#0b1020" opacity=".14"/>
    ${mug(380, 300)}${plant(744, 352, .85)}
    ${callout(436, 118, 330, 204, `<text font-size="9" font-weight="800" letter-spacing="1.2" fill="#3d4a66">NEW QUOTATION</text><text x="298" y="0" text-anchor="end" font-size="10" font-family="JetBrains Mono, monospace" font-weight="700" fill="${INK}">QUO-0221</text>
      ${[['Customer', '⟦n:shop⟧'], ['Item', '40 × Tomato paste, carton'], ['Price', '⟦m:quo.price⟧ a carton'], ['Valid for', '14 days']].map(([k, v], i) => `<text y="${24 + i * 22}" font-size="9.5" fill="#6b7590">${k}</text><g class="fadein" style="animation-delay:${.6 + i * .45}s"><text x="74" y="${24 + i * 22}" font-size="10.5" font-weight="600" fill="${INK}">${v}</text></g><path d="M74 ${29 + i * 22} H298" stroke="#e3e8f3" stroke-width="1.4"/>`).join('')}
      <g class="pop" style="animation-delay:2.5s"><rect x="186" y="112" width="112" height="28" rx="9" fill="${C.blue}"/><text x="242" y="130" text-anchor="middle" font-size="10" font-weight="800" fill="#fff">Send as link →</text></g>
      <text y="130" font-size="9" fill="#6b7590">⟦t:label⟧ worked out for you</text>`, 334, 248, { delay: .2, title: 'Clafina · Sales' })}
    ${bubble(18, 158, 184, 52, 'Forty cartons, coming up!', { tail: 'right', delay: .4, size: 19 })}
    ${sparkle(426, 112, .9, C.amber, 2.7)}`,
  envelope: (t) => `<rect width="800" height="450" fill="#eef2ff"/>${clock(720, 70, 28, t)}
    <rect x="-20" y="330" width="840" height="140" fill="${C.wood}" ${O}/><path d="M0 338 H800" stroke="#fff" stroke-width="2" opacity=".2"/>
    ${person('maya', 96, 470, { pose: 'wave', mood: 'grin', s: 1.12, look: 4 })}
    ${bubble(30, 96, 170, 52, 'Off you go!', { tail: 'left', delay: .5, size: 24 })}
    <g transform="translate(220 150)"><g class="fly" style="animation-delay:2.2s">
      <rect x="0" y="50" width="250" height="160" rx="10" fill="#f2f5ff" ${O}/>
      <g class="slidein" style="animation-delay:.2s">${doc(30, -30, 190, 200, 'QUOTATION', 'QUO-0221', 5, `<text x="12" y="150" font-size="10" font-weight="800" fill="${INK}">⟦m:quo.price⟧ a carton</text>`)}</g>
      <path d="M0 80 L125 150 L250 80 V210 H0Z" fill="#e3e9fc" ${O}/>
      <path class="flap" style="animation-delay:1.3s" d="M0 50 L125 136 L250 50Z" fill="#d3ddfb" ${O}/>
      <g transform="translate(125 128)"><g class="pop" style="animation-delay:1.7s"><circle r="20" fill="${C.violet}" ${O}/><circle r="14" fill="none" stroke="#fff" stroke-width="1.6" opacity=".6"/><text y="7" text-anchor="middle" font-size="19" font-weight="900" fill="#fff">C</text></g></g>
    </g></g>
    <path class="draw" style="animation-delay:2.3s" d="M420 250 C500 90 610 90 660 170" fill="none" stroke="${C.violet}" stroke-width="3.4" stroke-dasharray="7 10" stroke-linecap="round"/>
    ${phone(612, 150, 110, 210, `<rect width="98" height="198" rx="14" fill="#f6f7fb"/>${notify(-6, 34, 110, 'New quotation', 'Bright Harbour', C.violet, 3.5)}<g class="fadein" style="animation-delay:3.9s">${[0, 1, 2, 3].map((i) => `<rect x="10" y="${96 + i * 18}" width="${70 - i * 10}" height="8" rx="4" fill="#dfe5f2"/>`).join('')}</g>`, { cls: 'bob' })}
    ${hand(470, 80, 'whoosh!', 40, C.violet, 'fadein', 2.5, -8)}${motion(430, 196, 3, 46)}${sparkle(700, 140, 1, C.amber, 3.6)}`,

  counter: (t) => `<rect width="800" height="450" fill="#fff4e3"/><g opacity=".35">${shopfront(t)}</g>
    <circle cx="400" cy="250" r="236" fill="#ffffff" opacity=".6"/><circle cx="400" cy="250" r="236" fill="none" stroke="#fff" stroke-width="10" opacity=".7"/>
    <g transform="translate(250 60)">
      ${phone(40, 0, 220, 400, `<rect width="208" height="388" rx="24" fill="#fff"/>
        <g transform="translate(18 40)"><rect width="22" height="22" rx="6" fill="${C.violet}"/><text x="11" y="16" text-anchor="middle" font-size="12" font-weight="900" fill="#fff">C</text>
          <text x="30" y="10" font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">QUO-0221</text><text x="30" y="22" font-size="9" fill="#4a5468">from Bright Harbour</text>
          <rect y="38" width="172" height="60" rx="10" fill="#f6f7fb"/><text x="12" y="58" font-size="10" fill="${INK}">40 × Tomato paste</text><text x="12" y="82" font-size="16" font-weight="800" fill="#9aa3b5">⟦m:quo.price⟧</text><path class="grow" style="animation-delay:.8s" d="M10 77 H86" stroke="${C.red}" stroke-width="3"/>
          <text y="122" font-size="9" font-weight="700" fill="#4a5468">YOUR PRICE</text>
          <rect class="pop" style="animation-delay:1.2s" y="130" width="172" height="44" rx="11" fill="#ecfdf5" stroke="${C.teal}" stroke-width="2"/><text class="fadein" style="animation-delay:1.6s" x="14" y="159" font-size="20" font-weight="900" fill="${C.teal}">⟦m:quo.offer⟧</text><rect class="caret" x="104" y="142" width="2.5" height="22" fill="${C.teal}"/>
          <rect y="194" width="80" height="38" rx="11" fill="#eef2ff"/><text x="40" y="217" text-anchor="middle" font-size="10" font-weight="800" fill="${C.blue}">Accept</text>
          <g class="press" style="animation-delay:2.6s"><rect x="90" y="194" width="82" height="38" rx="11" fill="${C.teal}"/><text x="131" y="217" text-anchor="middle" font-size="10" font-weight="800" fill="#fff">Send my price</text></g>
          <text y="262" font-size="8.5" fill="#4a5468">Every offer is kept, line by line.</text></g>`)}
      <g transform="translate(0 -4)">
        <path d="M-6 410 C-14 360 -2 316 30 300 L50 298 C58 304 56 330 48 352 C44 380 40 400 34 412Z" fill="#e0ac69" ${O}/>
        <path d="M30 300 C24 316 22 334 26 350" fill="none" stroke="${INK}" stroke-width="2" opacity=".5"/>
        <path d="M46 306 C58 290 82 280 92 290 C100 300 84 310 64 318 Z" fill="#e0ac69" ${O}/><ellipse cx="84" cy="292" rx="6" ry="4" fill="#f3d2b1" transform="rotate(-24 84 292)"/>
        <path d="M306 410 C314 360 302 316 270 300 L250 298 C242 304 244 330 252 352 C256 380 260 400 266 412Z" fill="#e0ac69" ${O}/>
        <path d="M270 300 C276 316 278 334 274 350" fill="none" stroke="${INK}" stroke-width="2" opacity=".5"/>
        <g class="tap"><path d="M254 306 C246 286 226 270 214 278 C204 286 218 300 236 316 Z" fill="#e0ac69" ${O}/><ellipse cx="218" cy="281" rx="6" ry="4" fill="#f3d2b1" transform="rotate(30 218 281)"/></g></g>
    </g>
    ${bubble(30, 60, 210, 70, 'Hmm… ⟦m:quo.offer⟧?', { tail: 'right', delay: .4, size: 30, think: true })}
    ${sparkle(600, 140, 1.1, C.teal, 2.8)}${sparkle(570, 380, .8, C.amber, 3)}`,

  agree: (t) => `<rect width="800" height="450" fill="#eef2ff"/><path d="M430 0 H800 V450 H370Z" fill="#fff4e3"/><path d="M430 0 L370 450" ${O} stroke-width="4"/>
    <rect x="0" y="352" width="800" height="98" fill="#c9d3ec"/><path d="M370 450 L384 352 H800 V450Z" fill="#ecd9bb"/><path d="M0 352 H800" ${O}/>
    ${person('maya', 130, 380, { pose: 'cheer', eyes: 'happy', mood: 'grin' })}
    ${person('leo', 680, 380, { pose: 'wave', flip: true, mood: 'grin' })}
    <g transform="translate(290 70)"><g class="shake" style="animation-delay:1.3s">${doc(0, 0, 220, 270, 'QUOTATION', 'QUO-0221', 4, `
      <text x="12" y="118" font-size="10" fill="#9aa3b5" text-decoration="line-through">⟦m:quo.price⟧</text><text x="70" y="118" font-size="13" font-weight="900" fill="${C.teal}">⟦m:quo.offer⟧ a carton</text>
      <rect x="12" y="132" width="196" height="26" rx="7" fill="#ecfdf5"/><text x="22" y="149" font-size="9.5" font-weight="700" fill="${C.green}">✓ Inside ⟦n:sales⟧'s discount limit</text>
      <path d="M12 236 H208" stroke="#d7deec" stroke-width="1.5"/><text x="12" y="256" font-size="10" fill="#4a5468">Total with ⟦t:label⟧</text><text x="208" y="256" text-anchor="end" font-size="13" font-weight="900" fill="${INK}">⟦m:quo.total⟧</text>`)}</g>
      ${stampMark(110, 196, 'AGREED', '#15803d', 1.1)}</g>
    ${bubble(40, 70, 130, 56, 'Deal!', { tail: 'right', delay: 1.5, size: 34 })}${bubble(620, 70, 130, 56, 'Done!', { tail: 'left', delay: 1.7, size: 34 })}
    ${sparkle(280, 90, 1.3, C.amber, 1.4)}${sparkle(530, 300, 1.1, C.violet, 1.6)}${sparkle(540, 110, .8, C.teal, 1.8)}`,

  invoice: (t) => `${office(t)}
    ${person('maya', 120, 380, { pose: 'point', look: 3 })}
    <g transform="translate(190 120)">${doc(0, 0, 130, 160, 'QUOTATION', 'QUO-0221', 4)}${stampMark(66, 120, 'AGREED', '#15803d', 0)}</g>
    <g transform="translate(330 196)"><path class="grow" style="animation-delay:.5s" d="M0 0 H70" stroke="${C.violet}" stroke-width="5" stroke-linecap="round"/><path class="pop" style="animation-delay:.9s" d="M62 -12 L80 0 L62 12" fill="none" stroke="${C.violet}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>${hand(-6, -18, '1 tap', 26, C.violet, 'pop', .7, -6)}</g>
    <g transform="translate(420 110)"><g class="pop" style="animation-delay:1.1s"><g class="fly2" style="animation-delay:2.4s">${doc(0, 0, 150, 180, 'INVOICE', 'INV-0412', 3, `<text x="12" y="110" font-size="9.5" fill="#4a5468">Total with ⟦t:label⟧</text><text x="12" y="128" font-size="14" font-weight="900" fill="${INK}">⟦m:quo.total⟧</text><rect x="12" y="140" width="80" height="24" rx="7" fill="${C.green}"/><text x="52" y="156" text-anchor="middle" font-size="9.5" font-weight="800" fill="#fff">Pay now</text>`)}</g></g></g>
    ${phone(650, 210, 90, 170, `<rect width="80" height="160" rx="12" fill="#f6f7fb"/>${notify(-4, 26, 88, 'New invoice', '⟦m:quo.total⟧', C.green, 3.4)}`, { cls: 'bob' })}
    ${hand(250, 420, 'nobody typed it twice', 28, C.violet, 'fadein', 1.6, -3)}`,

  approve: (t) => { const [hx, hy] = handAt(200, 388, 'look', 'R', 1.08); return `<rect width="800" height="450" fill="#eef2ff"/>
    <g transform="translate(576 46)"><rect width="196" height="132" rx="8" fill="#fff" ${B}/><text x="14" y="26" font-size="10" font-weight="800" fill="#6f7a99">Q4 PLAN</text>
      <path d="M18 112 L60 84 L100 94 L140 58 L178 44" fill="none" stroke="${C.blue}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/></g>
    ${clock(470, 70, 26, t)}
    <rect x="0" y="352" width="800" height="98" fill="#c9d3ec"/><path d="M0 352 H800" stroke="${INK}" stroke-width="2.2"/>
    ${person('priya', 200, 388, { pose: 'look', s: 1.08, look: 3, hold: 'phoneBack' })}
    ${callout(318, 108, 226, 236, `<text font-size="8.5" font-weight="800" letter-spacing="1.1" fill="#3d4a66">NEEDS YOUR APPROVAL</text>
      <text y="22" font-size="13" font-family="JetBrains Mono, monospace" font-weight="700" fill="${INK}">SO-0187</text>
      ${[['Customer', '⟦n:shop⟧'], ['Goods', '40 cartons'], ['Total', '⟦m:quo.total⟧']].map(([k, v], i) => `<text y="${46 + i * 18}" font-size="9.5" fill="#6b7590">${k}</text><text x="194" y="${46 + i * 18}" text-anchor="end" font-size="10" font-weight="700" fill="${INK}">${v}</text>`).join('')}
      <rect y="94" width="194" height="24" rx="7" fill="#ecfdf5"/><text x="10" y="110" font-size="9.5" font-weight="700" fill="${C.green}">✓ Credit check clear</text>
      <g class="press" style="animation-delay:1.5s"><rect y="130" width="194" height="36" rx="10" fill="${C.green}"/><text x="97" y="153" text-anchor="middle" font-size="12" font-weight="900" fill="#fff">Approve</text></g>`, hx, hy - 10, { delay: .3, title: 'Clafina · Approvals' })}
    <g transform="translate(668 300)"><circle class="pop" style="animation-delay:1.9s" r="58" fill="#dcfce7" ${O}/><path class="draw" style="animation-delay:2.1s" d="M-27 0 L-8 21 L29 -19" fill="none" stroke="${C.green}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
      ${sparkle(-74, -54, 1.05, C.amber, 2.3)}${sparkle(70, -50, .9, C.green, 2.5)}${sparkle(66, 64, .8, C.violet, 2.6)}</g>
    ${bubble(28, 56, 214, 54, 'Approved! Over to ⟦n:warehouse⟧.', { tail: 'right', delay: 2.3, size: 22 })}`; },
  pick: (t) => `${warehouse()}
    ${clock(250, 150, 24, t)}
    <g transform="translate(220 300)"><rect x="0" y="0" width="380" height="22" rx="11" fill="#3b4256" ${O}/>${Array.from({ length: 9 }, (_, i) => `<circle cx="${20 + i * 43}" cy="11" r="6" fill="#aab3c5" stroke="${INK}" stroke-width="1.6"/>`).join('')}
      <rect x="40" y="22" width="12" height="50" fill="#56658a" ${O} stroke-width="2"/><rect x="330" y="22" width="12" height="50" fill="#56658a" ${O} stroke-width="2"/>
      <clipPath id="belt"><rect x="0" y="-60" width="380" height="60"/></clipPath><g clip-path="url(#belt)"><g class="belt">${Array.from({ length: 8 }, (_, i) => box(i * 90 - 60, -38, 52, 38, 'TOMATO')).join('')}</g></g>
      <path d="M150 -90 V0 M230 -90 V0 M150 -90 H230" fill="none" stroke="#22252f" stroke-width="10" stroke-linejoin="round"/><rect x="160" y="-84" width="60" height="10" rx="3" fill="${C.red}" class="beam"/></g>
    ${person('sam', 140, 392, { pose: 'carry', s: 1.05, look: 4, mood: 'grin' })}
    <g transform="translate(140 392) scale(1.05)">${box(-38, -100, 76, 40, 'TOMATO PASTE')}${box(-32, -138, 64, 38)}</g>
    <g transform="translate(540 30)"><rect width="230" height="120" rx="14" fill="#fff" ${O}/><text x="18" y="30" font-size="10" font-weight="800" letter-spacing="1.2" fill="#3d4a66">MAIN STORE · STOCK</text><text x="18" y="48" font-size="10.5" fill="#4a5468">Tomato paste, carton</text>
      <text class="fadeout" style="animation-delay:1.8s" x="18" y="100" font-size="40" font-weight="900" fill="${INK}">120</text><text class="fadein" style="animation-delay:2.2s" x="18" y="100" font-size="40" font-weight="900" fill="${C.blue}">80</text>
      <g class="pop" style="animation-delay:2.4s"><rect x="140" y="72" width="70" height="30" rx="15" fill="#fef3c7" ${O} stroke-width="1.6"/><text x="175" y="93" text-anchor="middle" font-size="15" font-weight="900" fill="#a15c07">−40</text></g></g>
    ${hand(290, 236, 'beep!', 36, C.red, 'pop', .8, -10)}${hand(320, 204, 'beep!', 28, C.red, 'pop', 1.3, 8)}`,

  road: (t, v) => `${street()}
    <g class="drive">${v === 'bike' ? `
      <g transform="translate(300 370)">
        <g transform="translate(-70 0)"><g class="spin"><circle r="34" fill="#22252f" ${O}/><circle r="14" fill="#c9d4ee" ${O} stroke-width="2"/><path d="M0 -14 V14 M-14 0 H14" stroke="${INK}" stroke-width="2"/></g></g>
        <g transform="translate(70 0)"><g class="spin"><circle r="34" fill="#22252f" ${O}/><circle r="14" fill="#c9d4ee" ${O} stroke-width="2"/><path d="M0 -14 V14 M-14 0 H14" stroke="${INK}" stroke-width="2"/></g></g>
        <path d="M-70 0 L-20 -46 H34 L70 0" fill="none" stroke="${C.teal}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M-30 -52 H30 Q40 -52 36 -40 H-26Z" fill="#22252f" ${O}/>
        <path d="M34 -46 L50 -78" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><rect x="-118" y="-112" width="74" height="58" rx="8" fill="${C.violet}" ${O}/><text x="-81" y="-77" text-anchor="middle" font-size="14" font-weight="900" fill="#fff">BH</text></g>
      ${person('omar', 304, 334, { pose: 'ride', hide: 'legs', s: .9, look: 4 })}` : `
      <g transform="translate(130 238)"><rect x="0" y="0" width="250" height="118" rx="14" fill="#fff" ${O}/><rect x="0" y="0" width="250" height="24" rx="12" fill="${C.violet}" ${O}/>
        <rect x="18" y="40" width="34" height="34" rx="9" fill="${C.violet}"/><text x="35" y="64" text-anchor="middle" font-size="20" font-weight="900" fill="#fff">C</text>
        <text x="62" y="58" font-size="18" font-weight="900" fill="${C.violet}">Bright Harbour</text><text x="62" y="78" font-size="11" font-weight="700" fill="#4a5468">Traders · deliveries</text>
        <path d="M250 32 H316 L356 76 V118 H250Z" fill="#e8efff" ${O}/><path d="M262 42 H312 L340 76 H262Z" fill="#a9c2f5" ${O} stroke-width="2"/>
        <circle cx="292" cy="62" r="11" fill="#7a4a2a" ${O} stroke-width="2"/><path d="M281 58 C281 46 303 46 303 58Z" fill="${C.teal}" ${O} stroke-width="1.6"/>
        <rect x="338" y="92" width="22" height="10" rx="3" fill="#fde68a" ${O} stroke-width="1.6"/>
        <g transform="translate(66 122)"><g class="spin"><circle r="28" fill="#22252f" ${O}/><circle r="12" fill="#c9d4ee" ${O} stroke-width="2"/><path d="M0 -12 V12 M-12 0 H12" stroke="${INK}" stroke-width="2"/></g></g>
        <g transform="translate(290 122)"><g class="spin"><circle r="28" fill="#22252f" ${O}/><circle r="12" fill="#c9d4ee" ${O} stroke-width="2"/><path d="M0 -12 V12 M-12 0 H12" stroke="${INK}" stroke-width="2"/></g></g>
        ${motion(-14, 40, 3, 44)}</g>`}</g>
    <g transform="translate(548 60)"><g class="pop" style="animation-delay:.6s"><rect width="226" height="196" rx="16" fill="#fff" ${O}/>
      <text x="16" y="28" font-size="9.5" font-weight="800" letter-spacing="1.2" fill="#3d4a66">WAYBILL · WB-0097</text>
      <rect x="16" y="40" width="194" height="92" rx="10" fill="#eef4ff"/><path d="M28 116 C60 116 60 64 100 70 C140 76 140 54 196 56" fill="none" stroke="#c9d4ee" stroke-width="8" stroke-linecap="round"/>
      <path class="draw" style="animation-delay:1s" d="M28 116 C60 116 60 64 100 70 C140 76 140 54 196 56" fill="none" stroke="${C.violet}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="28" cy="116" r="7" fill="${C.blue}" ${O} stroke-width="2"/><path d="M196 44 a9 9 0 0 1 9 9 c0 8 -9 16 -9 16 s-9 -8 -9 -16 a9 9 0 0 1 9 -9z" fill="${C.red}" ${O} stroke-width="2"/>
      <text x="16" y="152" font-size="9.5" fill="#4a5468">Main store → ⟦n:shop⟧</text><text x="16" y="168" font-size="9.5" fill="#4a5468">40 cartons · ${v === 'bike' ? 'bike' : 'van'}</text>
      <circle class="blink" cx="22" cy="182" r="5" fill="${C.green}"/><text x="32" y="186" font-size="9.5" font-weight="800" fill="${C.green}">12 min away</text></g></g>
`,

  sign: (t) => {
    const [mx, my] = handAt(250, 384, 'show');
    const tapHx = joints(...angles(POSES.tap, 'R'))[2], tx = mx + 18 + SHOULDER.R[0] + tapHx;
    return `${shopfront(t)}
    <g transform="translate(46 352)">${box(0, -40, 56, 40)}${box(58, -40, 56, 40)}${box(28, -80, 56, 40, 'TOMATO')}${box(0, -120, 56, 40)}</g>
    ${person('omar', 250, 384, { pose: 'show', hold: 'phoneOut', look: 4 })}
    ${person('leo', tx, 384, { pose: 'tap', flip: true, look: -4 })}
    <g transform="translate(660 250) scale(.88)"><g class="pop" style="animation-delay:.4s"><circle r="106" fill="#0b1020" opacity=".12" transform="translate(6 8)"/><circle r="106" fill="#fff" ${O} stroke-width="4"/>
      <text x="0" y="-58" text-anchor="middle" font-size="10" font-weight="800" letter-spacing="1.1" fill="#3d4a66">WB-0097 · DELIVERY</text><text x="0" y="-40" text-anchor="middle" font-size="10" fill="#4a5468">40 cartons received</text>
      <path d="M-72 22 H72" stroke="#d7deec" stroke-width="2"/>
      <path class="draw" style="animation-delay:1s" d="M-64 16 C-50 -28 -38 34 -24 0 C-14 -24 -6 28 8 2 C16 -12 26 14 38 0 C46 -8 54 8 64 -2" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/>
      <text class="fadein" style="animation-delay:2.6s" x="0" y="54" text-anchor="middle" font-size="11.5" font-weight="800" fill="${C.green}">✓ Signed by ⟦n:customer⟧ · 16:05</text></g></g>
    <path class="fadein" style="animation-delay:.5s" d="M${mx + 30} ${my - 18} L567 250" stroke="${INK}" stroke-width="2.2" stroke-dasharray="2 6" stroke-linecap="round"/>
    ${bubble(tx - 10, 74, 150, 54, 'All forty!', { tail: 'left', delay: 2.8, size: 28 })}`; },
  pay: (t) => { const [hx, hy] = handAt(690, 384, 'look', 'R', 1, true); return `<rect width="800" height="450" fill="#fff4e3"/><path d="M0 0 H360 L420 450 H0Z" fill="#eef2ff"/><path d="M360 0 L420 450" stroke="${INK}" stroke-width="3"/>
    <rect x="0" y="352" width="800" height="98" fill="#c9d3ec"/><path d="M420 450 L407 352 H800 V450Z" fill="#ecd9bb"/><path d="M0 352 H800" stroke="${INK}" stroke-width="2.2"/>
    ${clock(300, 70, 26, t)}
    <path d="M30 300 H330 L350 318 H10Z" fill="${C.wood}" ${O}/><rect x="10" y="318" width="340" height="12" fill="${C.woodDark}" ${O}/>
    ${laptop(70, 166, `<g class="pop" style="animation-delay:2.7s"><rect x="22" y="20" width="166" height="92" rx="12" fill="#f0fdf4" stroke="${C.green}" stroke-width="2"/><text x="105" y="44" text-anchor="middle" font-size="9" font-weight="900" letter-spacing="1" fill="${C.green}">PAYMENT RECEIVED</text><text x="105" y="72" text-anchor="middle" font-size="19" font-weight="900" fill="${INK}">⟦m:quo.total⟧</text><text x="105" y="92" text-anchor="middle" font-size="8.5" fill="#4a5468">INV-0412 · matched by itself</text></g>`)}
    ${person('leo', 690, 384, { pose: 'look', flip: true, look: -3, hold: 'phoneBack' })}
    ${callout(452, 92, 176, 184, `<text font-size="9" font-weight="800" letter-spacing="1" fill="#3d4a66">INVOICE · INV-0412</text><text y="24" font-size="17" font-weight="900" fill="${INK}">⟦m:quo.total⟧</text><text y="40" font-size="9" fill="#6b7590">due in 7 days</text>
      <g class="press" style="animation-delay:.9s"><rect y="54" width="144" height="34" rx="10" fill="${C.green}"/><text x="72" y="76" text-anchor="middle" font-size="12" font-weight="900" fill="#fff">Pay now</text></g>
      <text y="108" font-size="8.5" fill="#6b7590">Card · Transfer · Wallet</text>`, hx, hy - 12, { delay: .2, title: 'Clafina · Pay' })}
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<g transform="translate(${520 + (i % 3) * 16} ${220 + (i % 2) * 14})"><g class="coin" style="animation-delay:${1.3 + i * .16}s"><circle r="15" fill="#fbbf24" ${O} stroke-width="2.2"/><circle r="10" fill="none" stroke="#d97706" stroke-width="1.6"/><text y="5" text-anchor="middle" font-size="13" font-weight="900" fill="#92400e">⟦c:symbol⟧</text></g></g>`).join('')}
    ${hand(110, 140, 'cha-ching!', 40, C.green, 'pop', 2.8, -6)}`; },
  receipt: (t) => `${office(t)}
    ${person('maya', 110, 382, { pose: 'cheer', eyes: 'happy', mood: 'grin' })}
    ${person('priya', 210, 386, { pose: 'wave', s: .95, mood: 'grin' })}
    <g transform="translate(286 262)"><rect width="150" height="80" rx="14" fill="#22252f" ${O}/><rect x="18" y="12" width="114" height="9" rx="4" fill="#0b0d12"/><circle cx="128" cy="62" r="6" fill="#34d399"/>
      <g class="printout" style="animation-delay:.3s"><g transform="translate(28 -168)"><path d="M0 0 H94 V176 H0Z" fill="#fff" ${O} stroke-width="2"/><text x="47" y="22" text-anchor="middle" font-size="8.5" font-weight="900" letter-spacing="1" fill="${INK}">RECEIPT</text><text x="47" y="36" text-anchor="middle" font-size="8" font-family="JetBrains Mono, monospace" fill="#4a5468">RCT-0310</text>
        <path d="M10 46 H84" stroke="#d7deec" stroke-dasharray="3 3"/>${['INV-0412', 'Paid in full'].map((l, i) => `<text x="47" y="${64 + i * 15}" text-anchor="middle" font-size="8.5" fill="${INK}">${l}</text>`).join('')}<text x="47" y="108" text-anchor="middle" font-size="12" font-weight="900" fill="${INK}">⟦m:quo.total⟧</text>
        <text x="47" y="150" text-anchor="middle" font-size="18" font-family="Caveat, cursive" fill="${C.violet}">Thank you!</text></g></g></g>
    <g transform="translate(470 196)"><rect width="300" height="200" rx="16" fill="#fff" ${O}/><path d="M0 16 Q0 0 16 0 H284 Q300 0 300 16 V40 H0Z" fill="${C.violet}" ${O}/><text x="18" y="26" font-size="11" font-weight="900" letter-spacing="1.4" fill="#fff">THE BOOKS · POSTED BY THEMSELVES</text>
      ${[['Sales', '⟦m:quo.subtotal⟧'], ['⟦t:label⟧ owed', '⟦m:quo.tax⟧'], ['Bank', '+⟦m:quo.total⟧'], ['⟦n:shop⟧ owes', '⟦m:quo.zero⟧']].map(([k, v], i) => `<g class="fadein" style="animation-delay:${.8 + i * .45}s"><text x="18" y="${72 + i * 34}" font-size="13" fill="#4a5468">${k}</text><text x="232" y="${72 + i * 34}" text-anchor="end" font-size="13" font-weight="900" fill="${INK}">${v}</text></g><g transform="translate(266 ${67 + i * 34})"><g class="tick" style="animation-delay:${1 + i * .45}s"><circle r="11" fill="#dcfce7" stroke="${C.green}" stroke-width="1.6"/><path d="M-5 0 L-1 4 L6 -4" fill="none" stroke="${C.green}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></g></g>`).join('')}</g>
    ${notify(500, 128, 210, 'Receipt RCT-0310 sent', 'to ⟦n:customer⟧ at ⟦n:shop⟧', C.teal, 2.4)}
    ${Array.from({ length: 26 }, (_, i) => `<rect class="confetti" style="animation-delay:${2.6 + (i % 7) * .14}s" x="${20 + i * 30}" y="${30 + (i % 4) * 24}" width="9" height="14" rx="2" fill="${[C.violet, C.teal, C.amber, C.blue, '#e11d48'][i % 5]}" transform="rotate(${(i * 37) % 90} ${24 + i * 30} ${36 + (i % 4) * 24})"/>`).join('')}`,
};

