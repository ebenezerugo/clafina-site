# Clafina illustration system: stories for every product and industry

**Goal:** one illustrated world across the whole site. The same cast, the same cartoon style, the same two businesses, so a visitor who meets Maya on the home page recognises her on the Sales page, the Restaurant page and in the help centre. Real product screens stay (they prove it is real); illustrations carry the story around them (they make it human).

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

**Cast (shared across the site).** Maya (sales, Bright Harbour Traders), Leo (customer, Greenleaf Grocers), Priya (manager), Sam (warehouse), Omar (driver), plus one host per industry (list below). Mixed ages, body types and dress; at least one wheelchair user and one older owner across the set. No real people or brands.

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
| Payments and wallets | Leo taps Pay now; coins fly into a wallet that is a page in the books | QUO-0221 ch. 10 |
| Tax engine | A receipt passes through a prism and splits into price and VAT | QUO-0221 ch. 5 |
| Business health | Ngozi's dashboard as a heart monitor that beats with each sale | QUO-0221 ch. 11 |
| Sales and invoicing | The quote's envelope taking flight | QUO-0221 (full) |
| Customers and CRM | Leo's card in a rolodex that remembers his offer and birthday | QUO-0221 ch. 3 |
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

## 4. Industry pages (17): a story for each

Every industry page already tells "a day" in six to eight time-stamped moments. Each moment gets one drawn scene (`scene` on the moment, `story` on the page), loaded as the visitor scrolls. The page text, its app screens and the drawings use the same international names. Outdoor scenes take their light from the sky; indoor scenes from the clock on the wall.

**Done: Farm.** Greenvale Family Farms (Anna, owner; Hana, agronomist; Samuel, poultry; Daniel Ross, outgrower). Sunrise over the fields and barn → armyworm close-up in the maize → rainstorm on spray day, sprayer kept in the shed → harvest held by the waiting-period sign, combine in the field → broiler house with pecking chickens → pickers paid by the bag on Hilltop → outgrower's truck on the weighbridge → maize lot traced at sunset.

| Industry | Business and cast | The world | Scenes, in the page's order |
|---|---|---|---|
| Retail | **Maple & Co. Home**, homeware store (Clara, owner; Jonah, cashier) | High street with shop windows, a bus passing, a power cut at noon | Shutters up at 08:00 → a customer pays by card at Till 1 → lights go out, tills keep selling offline → power back, two tills sync → reorder from the low-stock list → closing count and cash-up at dusk |
| Restaurant | **Juniper Kitchen** (Marco, chef; Aisha, front of house) | Open kitchen with steam and flames, dining room, delivery rider at the door | Prep at dawn, produce delivered → lunch rush, orders fire to grill and cold stations → a dish runs low, the till warns → online pickup order arrives → tips shared at close → cost per plate on the manager's tablet |
| Accommodation | **Harbourview Hotel**, city hotel (Sofia, front desk; Ben, housekeeping) | City skyline, an aeroplane crossing the sky, airport taxi, suitcases, a room with a view | Night audit under the moon at 03:00 → plane lands, guests on the way → housekeeping trolley through the corridor, room 108 first → early guest at the desk, room turns "inspected" just in time → lunch charged to the room from the restaurant → the trade-fair weekend priced up on the calendar → a guest moves to a quieter room on the room rack |
| Events | **Lumen Events** (Nora, organiser) | A concert-hall foyer with string lights, a stage, a ticket gate | Tickets on sale online → floor plan and tables set → gate scanning, a queue moves fast → bar stock moves with every drink → sponsor invoice sent → the morning after, the books closed |
| Memberships | **Peak Fitness**, gym (Kai, owner) | Gym floor with weights, a smart door, early-morning light | Members swipe in at 06:00 → a renewal fails, a friendly link goes out → paid, the door opens → class credits topped up → monthly billing run → owner checks churn on the phone |
| Classes | **Studio Tempo**, dance studio (Elena, teacher) | Mirrored studio, timetable board, waiting parents | Timetable for the week → class fills, waitlist forms → a cancellation, the next person moves up → check-in at the door → a teacher off sick, class moved → pay for the term |
| Courses | **Brightpath Academy**, training centre (Mr Hall, tutor) | Classroom, laptops, certificate wall | Enrolment and deposit → cohort starts → attendance taken → assessment marked → last lesson, certificate issued → invoice to the sponsoring company |
| Clinics and salons | **Willow Physio** (Dr Ines, physiotherapist; Tom, front desk) | Calm treatment room, plants, appointment screen | Front desk opens the day's list → consent signed before the record opens → treatment notes during the session → a print of the record logged in the access log → package of sessions sold → reminder for next week |
| Property | **Ivory Gate Property** (Grace, property manager) | Apartment blocks, keys, a tenant at the door | Rent roll on the first of the month → late rent, kind reminder → a leaking tap, contractor booked → move-out inspection, room by room → deposit returned → owner's statement |
| Construction | **Northline Builders** (Victor, site manager) | Site with a crane, hard hats, scaffolding | Site diary at 07:00 → materials delivered against the order → subcontractor hours on the phone → valuation measured and certified → invoice to the client → budget against cost on the project board |
| Field service | **Brightwire Power and Cooling** (Lena, technician) | Rooftop solar panels, a van, a customer's house | Dispatch board at 07:30 → route to the first job → checklist on the roof, photos taken → part used from the van stock → customer signs on the phone → invoice sent before she drives off |
| Rentals | **Atlas Equipment Hire** (Ravi, yard manager) | Yard with generators and scaffolding towers | Booking checked for clashes → item goes out with a contract and deposit → late return, extra day charged → item back, inspected, damage noted → deposit returned less damage → item serviced |
| Distribution | **Coastline Distributors** (Felix, van sales) | A van on a route of corner shops, a map | Van loaded from the warehouse → route of shops on the map → an order taken at the counter, stock in the van counted → cash and transfers collected → a return logged → end-of-day van stock matched |
| Farm | Greenvale Family Farms (done) | Fields, barn, sun, rain, poultry, weighbridge | As above |
| Manufacturing | **Corefold Packaging**, small factory (Ahmed, production lead) | Machines, conveyor, forklift, quality bench | Work order released → raw materials issued → machine run, output counted → quality check, one batch held → finished goods to stock → true cost per carton |
| Fundraising | **Hope Bridge Trust**, charity (Martha, director) | Community hall, donation box, volunteers | Appeal goes out → donations by link and at the door → gift receipts in a minute → restricted funds kept apart → grant report → thank-you letters |
| Product configurator | **Oakline Furniture**, furniture maker (Sam, designer) | Workshop with timber, a showroom sofa | Customer picks size, fabric and legs on the website → price and parts follow each choice → quotation sent → order to the workshop with a cut list → made, finished, delivered |

**Production order:** Accommodation, Restaurant, Retail first (most visited), then the rest in two batches. Each batch: scenes drawn, the page's names made international in the text and its app screens, a contact sheet for the owner, then merge.

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
- Whether Leo and Greenleaf Grocers stay the recurring customer across products.
- Currency: the stories use US dollars; the product screens and industry pages still use naira. One currency for the illustrated world, or by the visitor's country?
