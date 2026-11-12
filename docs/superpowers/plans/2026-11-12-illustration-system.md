# Clafina illustration system: stories for every product and industry

**Goal:** one illustrated world across the whole site. The same cast, the same cartoon style, the same two businesses, so a visitor who meets Ada on the home page recognises her on the Sales page, the Restaurant page and in the help centre. Real product screens stay (they prove it is real); illustrations carry the story around them (they make it human).

**Reference:** the Journey of QUO-0221 prototype (https://claude.ai/artifact/Gd4orYYqZF9i96TjBB9zYn). Its kit (rigged people, places, props, callouts, light by hour) becomes `src/illustrations/`.

## 1. Where the journey of QUO-0221 goes

| Place | What | Why |
|---|---|---|
| **New page** `/stories/journey-of-a-quote/` | The full eleven-chapter player | The deep version; shareable on its own; JavaScript loads only here |
| **Home**, replacing the four-step "One record" cards | A poster frame (chapter 4, "Deal!") with the six-paper trail and "Follow one sale, start to finish" | The home page explains one record in one picture; ~25 KB of inline SVG, no player script, so the phone Lighthouse budget (≥ 0.95) holds |
| **Sales and invoicing** page | The trail as the page's spine: each tour step links to its chapter | Shows where each feature sits in a real sale |
| **Payments**, **Stock**, **Mobile** pages | One chapter each (Pay now, Picked and packed, Approve on the phone) as a still with a link | Reuse, not repetition |
| **Why one record** page | The closing chapter (the books post themselves) | That page's whole argument in one frame |

A second journey, **REQ-0045 (buying)**, follows the same pattern: requisition → quotes compared → purchase order → goods received (196 of 200) → bill matched → payment run. It goes on Purchasing, Stock and Finance.

## 2. The illustration system

**Cast (shared across the site).** Ada (sales), Tunde (customer, Lagoon Foods), Ngozi (manager), Femi (warehouse), Musa (driver), plus one host per industry (list below). Mixed ages, body types and dress; at least one wheelchair user and one older owner across the set. No real people or brands.

**Style rules.**
- Ink outline 2.6 on people and the thing being used; 1.7 soft-blue on backgrounds.
- One light from the upper left; two-tone shading; light follows the hour on the scene's clock.
- River palette for Clafina moments (violet, blue, teal); the business's own colour for the business.
- Every scene has a time, a place and one Clafina moment shown on a readable callout screen.
- Amounts always add up and match the screens and content files.
- Motion: one idea per scene, under 3 s, still and complete under reduced motion.

**Formats.**
| Format | Size | Used for |
|---|---|---|
| Hero scene | 800×450, animated | Product and industry heroes |
| Spot | 320×240, still | The three "jobs" cards on product pages |
| Moment | 800×450, animated | Each time-stamped moment on industry pages |
| Story | 6–11 moments in a player | Stories pages |
| Badge | 96×96 | Menus, footer, help centre |

**Engineering.** Scenes are server-rendered SVG strings (no client JS for stills); the player is a small client component used only on story pages. Each scene is a pure function of its content, so English text comes from content files and translations follow the normal pipeline later. A contact-sheet test renders every scene and fails on overflow or overlap of callouts.

## 3. Product pages (22)

Hero scene, three spots for the jobs, and where it fits in a story.

| Product | Hero scene | Story it joins |
|---|---|---|
| Finance and accounting | Ngozi closes the month: ledgers fold into one book, the bank line ticks green | Both journeys end here |
| Payments and wallets | Tunde taps Pay now; coins fly into a wallet that is a page in the books | QUO-0221 ch. 10 |
| Tax engine | A receipt passes through a prism and splits into price and VAT | QUO-0221 ch. 5 |
| Business health | Ngozi's dashboard as a heart monitor that beats with each sale | QUO-0221 ch. 11 |
| Sales and invoicing | The quote's envelope taking flight | QUO-0221 (full) |
| Customers and CRM | Tunde's card in a rolodex that remembers his offer and birthday | QUO-0221 ch. 3 |
| Point of sale | Juniper Kitchen's till at lunch rush, keeps selling as the Wi-Fi drops | Restaurant story |
| Online shop | A phone becomes a shop window with Juniper's teal awning | Restaurant story |
| Trading network | Two businesses' documents meeting across a bridge | Both journeys |
| Stock and warehouses | Femi's conveyor with the counter 120 → 80 | QUO-0221 ch. 7 |
| Purchasing | Three supplier quotes on scales, the best one wins | REQ-0045 |
| Manufacturing | Raw parts enter a machine, finished goods and their true cost come out | Manufacturing story |
| Bookings | A calendar where two people try the same slot and one is kindly moved | Classes story |
| Projects | A kanban board with a timesheet clock on each card | Construction story |
| Assets | A forklift with a service-due tag | Field service story |
| HR and payroll | Payday: envelopes leave in a neat row, leave calendar beside | Small-business story |
| Communication | One inbox where chat apps, email and team chat land as cards | QUO-0221 ch. 2 |
| Business email (pre-launch) | Envelopes with the business's own domain on the stamp | Behind its switch |
| Mobile app | Ngozi approving from a meeting | QUO-0221 ch. 6 |
| AI assistant | The assistant writes the minutes while people talk | Meeting story |
| Document capture | A paper receipt photographed and turning into a filled form | REQ-0045 bill |
| Integrations and API | Plugs from other tools fitting into the record | Developers page |

## 4. Industry pages (17)

Each industry gets a host character and a "day" story from its existing `moments`.

| Industry | Host and place | Signature moment |
|---|---|---|
| Retail | Adaeze, homeware shop | Two tills sync after a power cut |
| Restaurant | Juniper Kitchen team | Order fires to the right station; dish cost per plate |
| Accommodation | Guesthouse front desk | Late check-in with the room already ready |
| Events | Event organiser at the gate | Tickets scanned, stock of drinks moves |
| Memberships | Gym owner | Renewal paid, door opens |
| Classes | Dance studio | Class full, waitlist moves up |
| Courses | Training centre | Certificate issued after the last lesson |
| Clinics and salons | Physiotherapy clinic | Consent signed before the record opens |
| Property | Property manager | Rent roll, late rent reminded kindly |
| Construction | Site manager | Valuation certified and invoiced |
| Field service | Solar technician | Checklist done on site, signed by the client |
| Rentals | Equipment rental yard | Item out, back, checked, deposit returned |
| Distribution | Van sales rep | Route of shops, stock in the van counted |
| Farm | Poultry and crop farm | Harvest weighed into stock |
| Manufacturing | Small factory | Work order from raw parts to finished cartons |
| Fundraising | Charity | Donation, receipt and thank-you in one minute |
| Product configurator | Furniture maker | Customer picks options; price and parts follow |

## 5. Phases

1. **Kit in the site, journey live (this week).** Port the kit to `src/illustrations/` in TypeScript; story content in `content/en/stories/quo-0221.json`; the story page and its player; the home poster replacing the One-record cards; link from Sales. Contact-sheet and accessibility tests; Lighthouse on home and the story page.
2. **Buying journey REQ-0045** on Purchasing, Stock, Finance.
3. **Product heroes and spots** for all 22 products, in four batches by menu group (Money, Selling, Operations, People and Everywhere). Each batch: contact sheet for owner review before merge.
4. **Industry day stories** for all 17 industries, three batches.
5. **Polish:** badges in menus and help, Open Graph images from scenes, print-quality exports for sales decks.
6. **Translations** of every story when the owner says so.

**Definition of done for each scene.** Reads at phone width; text on callouts is real content; numbers add up; passes axe; under 30 KB inline; owner has seen it on a contact sheet.

## 6. Needs from the owner

- Approve the cast (names, looks) before batch 3.
- Real photos (optional) for pairing next to illustrations on industry pages.
- Whether Tunde and Lagoon Foods stay the recurring customer across products.
