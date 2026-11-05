# Industry facts for the 17 industry stories

Internal. Written 5 Nov 2026 from `docs/product-source/`, the mockup board texts and `commerce-web/` (docs and, for
the configurator, its code). "Commerce" in the sources is Clafina. Every capability names its source. Where a source
is silent: "unclear".

Rules that apply to every story:
- **Pre-launch** holds only the spec's Appendix A items and the owner's added items (courses fees by term, fee
  statements and guardian records; a fundraising receipt sent as soon as a gift is received; selling in several
  units at the till). Tag each with `prelaunch: "<route id>"`. Any other "Not yet" item stays off the site until the
  owner says otherwise; each brief lists them under "Not in Appendix A" or "Avoid".
- **Payments and tax authorities run in test or sandbox only.** Do not name payment providers, banks, SMS, WhatsApp
  or email vendors, booking sites, insurers, map or weather providers, marketplaces or tax authorities as live.
- Boards show sample names, some of which may match real firms. Replace them with fictional ones when porting.
- No internal counts, test figures or audit findings. Never "compliant" or "certified".
- Retail and manufacturing are core modules, not packs.

---

## industry-retail — Retail

**Kind:** core, not a pack. The till (point of sale) and the online shop are part of every organisation
(spec Appendix A; "Retail and manufacturing are core modules, not packs").

**Who it is for:** businesses that serve walk-in customers: a shop, a market stall, a pharmacy, a showroom or a
warehouse counter (Point-of-Sale-Product-Document §1); and any organisation that sells online, with one shop or many,
by location, inventory or brand (Online-Shop doc §1, §2). Business buyers get their own prices and terms on the shop
(STOREFRONT_STUDIO.md §13).

**Trade words:** Till, Shift, Opening float, X report / Z report, Walk-in customer, Cashier, Supervisor, Blind close,
Cash in / cash out, Safe drop, Offline allowance, Split payment, Store credit, Gift card, On account, Return window
(POINT_OF_SALE.md steps 1-3 and settings; Point-of-Sale-Product-Document §4). Online: Storefront, Sales channel,
Create online store, Look and content, Publish, Collections, Assortment, Collection point (Online-Shop doc §4, §6, §7;
STOREFRONT_STUDIO.md).

**A day** (illustrative: a household and electronics shop with two branches and an online shop):

| Time | The problem | How Clafina handles it | Surface | Best board |
|---|---|---|---|---|
| 08:30 | The cashier opens the till and must start with a known float. | Signs in with a PIN (not an ERP account) and counts the float by denomination; the shift starts (POINT_OF_SALE.md steps 3-4; step 1 PINs). | till | till-retail |
| 10:15 | The internet drops with a queue at the counter. | The till keeps selling: every sale is written to the till first and sent when the line is back, within the offline limits the ERP set per product, hours offline and payment type (POINT_OF_SALE.md steps 3-4; "Allowances, in detail"). | till | till-retail |
| 11:40 | A regular wants to pay part in points and part in cash. | The cashier finds them by phone number, sees points, store credit and wallet, and splits the payment; points are earned on the rest (POINT_OF_SALE.md step 9). | till | till-payment |
| 13:00 | An online order comes in for an item also on the shelf. | The shop sells the same stock at the same prices; the order lands as a sales order tagged with the shop, and the shop and till cannot both sell the last unit (Online-Shop doc §4, §8; ROADMAP 4.11). | shop, web | studio-storefronts |
| 15:20 | A customer returns a kettle bought last week by card. | The return becomes a credit note and a refund, back the way the sale was paid; the goods go back into stock (POINT_OF_SALE.md, POS completion "A return is a credit note and a refund"; step 9). | till | till-retail |
| 16:00 | Two tills sold the last unit while offline. | Both sales stand; the manager sees an "oversold" exception with a link to transfer stock from a branch that has it (POINT_OF_SALE.md, POS completion "Oversold"). | web | unclear (no board in this set shows Sync exceptions; till-trade-sell shows stock here and at other branches) |
| 17:30 | The owner wants a new banner on the shop for the weekend. | Edits it in Storefront Studio as a draft, previews it, sends it for approval and publishes; a bad change can be rolled back (STOREFRONT_STUDIO.md §5, §12). | web | studio-designer |
| 19:00 | Closing: is the cash right? | The cashier counts the drawer; the till shows the difference from expected (or hides it on a blind close) and prints the Z report; the manager sees the shift on Shifts & cash and in the cash differences report (POINT_OF_SALE.md step 2 "Shifts", step 10). | till, web | till-retail |

**Built:**
- Kotlin till for desktop (macOS, Windows, Linux) and Android, and a browser till that opens and sells with no network (POINT_OF_SALE.md steps 3-5).
- Always journal, then sync: offline sales within allowances the ERP sets per product or category, held aside from stock so the shop and other tills cannot sell them (POINT_OF_SALE.md step 1, "Allowances, in detail").
- Enrolment codes for devices, cashier PINs, supervisor approval above discount, price, refund and void limits (POINT_OF_SALE.md step 1, steps 3-4).
- Shift screens: float by denomination, cash in and out, safe drops, X and Z reports, blind close (POINT_OF_SALE.md steps 3-4).
- Selling: search, scan, favourites, decimals for weighed goods, price breaks, discounts within limits (POINT_OF_SALE.md steps 3-4).
- Each sale posted once as an invoice, receipts and a stock issue; the walk-in customer when none is named (POINT_OF_SALE.md step 2 "A sale in the ERP").
- Returns and voids as credit notes and refunds, back the way the sale was paid (POINT_OF_SALE.md, POS completion; step 9).
- Split payment across cash, card, bank transfer, points, gift card, store credit, wallet, on account, QR and payment link; QR and payment link on a sandbox (POINT_OF_SALE.md step 9; POS completion "Every payment type is booked").
- Customers found or made at the till; marketing consent recorded; loyalty earned and spent; credit limits checked (POINT_OF_SALE.md step 9).
- Gift cards sold and topped up at the till (POINT_OF_SALE.md step 9).
- Sync exceptions in plain words, with fixes: make a missing cash or bank account in one click; transfer stock for an oversold item (POINT_OF_SALE.md, POS completion).
- Reports: sales by till, cashier and hour; payment mix; cash differences; offline time; voids, returns and discounts (POINT_OF_SALE.md step 10).
- ESC/POS receipt printing and the cash drawer; the browser till prints over USB, serial or Bluetooth, or the print dialog (POINT_OF_SALE.md steps 3-5, step 7).
- Tax rules per country on the till's receipt, reported to a simulated authority (POINT_OF_SALE.md step 8, 8b).
- "Create online store": channel, credentials, subdomain and first feed in one step; many shops per organisation (Online-Shop doc §2, §6; ROADMAP 4.11).
- Orders back as sales orders tagged with the shop; assortment as a rule; availability shared with the till (ROADMAP 4.11; Online-Shop doc §4).
- Storefront Studio: theme, pages, menus and collections as versions; preview, approval, publish, roll back; contrast guard on theme colours; visual designer (STOREFRONT_STUDIO.md §2, §5, §12).
- Catalogue views per category, with suggestions the owner accepts (STOREFRONT_STUDIO.md §11).
- B2B on the shop: account prices, contract catalogues, credit terms, purchase orders, quotes, returns, coupons (STOREFRONT_STUDIO.md §13).
- Shop journeys: subscriptions, bookings, warranties with serial numbers, ordering for a time, what to do when an item runs out (STOREFRONT_STUDIO.md §14).
- Archive and restore a storefront (STOREFRONT_STUDIO.md "Archive and restore").

**Pre-launch:**
- The till on iOS (spec Appendix A; POINT_OF_SALE.md steps 3-4 "iOS is written, not built").
- Selling in more than one unit at the till: cartons, packs, single items (spec Appendix A and corrections; POINT_OF_SALE.md steps 3-4).
- Serial and batch capture at the till (spec Appendix A; POINT_OF_SALE.md steps 3-4).

**Not in Appendix A (keep off the site):**
- Tills for every platform (step 6) and Clafina's own devices (POINT_OF_SALE.md status line).
- Card terminals and printers from more makers; scales (POINT_OF_SALE.md step 7, waves 2 and 3).
- Storefront analytics (sessions, conversion, page speed) and scheduled publication (STOREFRONT_STUDIO.md §10).
- Booking images; guests booking on the shop without signing in (STOREFRONT_STUDIO.md §14 "What is left").
- Live payment rails and live tax-authority connections. Both stay sandbox or simulated on the site (rules above).

**Pack switches on:** none. Retail is the core. Every organisation has the till and the online shop as sales channels
of kind point of sale and online store (POINT_OF_SALE.md step 1; Online-Shop doc §4). Packs such as Restaurant or
Events add to the same till (RESTAURANT.md; EVENTS.md "Selling from other products").

**Shares with the core:** the catalogue, price books and promotions; stock and inventory types (sell-from types,
reservations); sales invoices, receipts, credit notes and refunds; the books (gift cards owed, cash and clearing
accounts); customers, loyalty and credit limits from CRM; analytics reports and dashboard widgets; tax rules per country
(POINT_OF_SALE.md steps 2, 9, 10; Online-Shop doc §2, §8).

**Avoid:**
- Device makers as supported. The doc says none of it "has run on a real terminal yet" (POINT_OF_SALE.md step 7).
- "Fiscal certified" or "compliant". The doc says "not a certified fiscal device" (POINT_OF_SALE.md step 8).
- Tax authorities as connected; payment providers as live.
- iOS as available today (pre-launch only).
- A card terminal on the browser till (it has none: POINT_OF_SALE.md step 5).
- Receipts sent by SMS or WhatsApp: in the product doc (§4) and on till-payment, but the built docs do not say it is built. Unclear.
- Hold and recall: in the product doc (§4) and on till-retail ("held"), not in the built till screens list. Unclear.
- The figures on studio-storefronts (conversion, page speed) and speed claims: analytics is not built and not in Appendix A.
- Naming the domain reseller, marketplaces or carriers.
- The phone model and brand names on till-trade-sell.

**Boards:** till-retail, till-payment, till-trade-sell, studio-storefronts, studio-designer, studio-catalogue,
studio-wholesale-desktop, till-main.

---

## industry-restaurant — Restaurant

**Kind:** a pack (`restaurant`), switched on per place (RESTAURANT.md; INDUSTRY_PACKS.md).

**Who it is for:** restaurants, cafés, bars and counter service, run as modes of the same pack (settings, not separate
products) (RESTAURANT.md intro). Places of kind restaurant, bar or quick service (INDUSTRY_PACKS.md "Open kinds of place").

**Trade words:** Floor, Tables, Covers, Tabs, Courses, Stations, Kitchen display, Bump and recall, "86" (sold out),
Dine in / Takeaway / Delivery, Set menu, Comp, Void, Waste, Food cost, Tips, Tip pool, Table turns (spec Appendix A;
RESTAURANT.md). The pack says Dishes for Products (ROADMAP "Industry packs and the restaurant pack").

**A day** (illustrative: a restaurant with an inside room, a terrace and a bar):

| Time | The problem | How Clafina handles it | Surface | Best board |
|---|---|---|---|---|
| 10:00 | The chef wants to know what each dish earns at today's costs. | Dish costs shows cost a portion from the recipe at stock cost, the price without tax, and the margin; a dish set up to leave stock twice is flagged and fixed in one click (RESTAURANT.md step 6; "Recipe dishes are Non-Stock"). | web | erp4c-rest-recipes |
| 11:30 | The fish delivery did not come. | The manager marks the dish sold out ("86") once; every till and menu shows it at once (RESTAURANT.md step 3 "86"). With the setting on, a dish whose ingredients run out is sold out by itself (step 6). | web, till | erp4c-rest-menus |
| 12:30 | Lunch: a booked party of four arrives. | The floor shows every table in the colour and words of its state and how long it has been there, and a free table with a booking within the hour; the waiter seats them and opens the tab (RESTAURANT.md step 2; booking engine tables). | till | till-floor |
| 12:45 | The order must reach the right cooks. | Required choices ("how is it cooked") are asked before sending; each dish goes to its station by the routing rules; the kitchen screen shows tickets that turn amber and red with age, and cooks bump them (RESTAURANT.md step 3 option groups, step 5). | till, kitchen display | till-kitchen |
| 13:10 | A dish is nearly out of an ingredient. | With "warn the waiter" set, the till lists what is short and the waiter can send anyway (RESTAURANT.md "When ingredients are short of stock"). | till | till-main |
| 14:00 | A takeaway order during the lunch offer. | The tab's order type is takeaway; price rules by order type, day and hour change the price-book price, and the till shows the rule's name (RESTAURANT.md "Prices by order type and by time"). | till | till-main |
| 15:00 | A late main was given free. | The comp is recorded with what it cost and what it would have sold for, apart from voids and stock lost (RESTAURANT.md step 6 "Waste"). | till, web | erp4c-rest-waste |
| Monday | The week's tips must be shared fairly. | A tip run pools the week's tips by hours from the timeclock and role points, to the cent; approval books them; cash shares are paid out and the rest go into the next payroll (RESTAURANT.md "Tips"). | web | erp4c-rest-tips |

**Built:**
- Floors and tables drawn on a grid, with drag or arrow keys, saved all together; tables are booking resources (RESTAURANT.md step 2).
- Live table states from the till: free, seated, ordered, waiting for food, eating, bill asked, paying, to clean (RESTAURANT.md step 2).
- Menus with days and hours served and the places that serve them; sections and courses (RESTAURANT.md step 3).
- Dishes are catalogue items priced by the price book; allergens, dietary tags, calories, spice level (RESTAURANT.md step 3).
- Option groups with fewest and most to pick and prices that add (RESTAURANT.md step 3).
- "86": a dish or option sold out on every till and menu, with a reason and an optional end (RESTAURANT.md step 3).
- Table service on the till: tabs, courses, tickets, covers (ROADMAP restaurant step 4; RESTAURANT.md "Who owns what").
- Stations and routing by dish, category, course or default, with a preview of where each dish goes (RESTAURANT.md step 5).
- Kitchen display: a ticket per station per send, dishes ticked ready, bump and recall, ages that turn amber and red, course pacing (RESTAURANT.md step 5).
- Recipes with sub-recipes, kitchen units and preparation loss; ingredients leave stock when the kitchen starts a dish (RESTAURANT.md step 6).
- Dish cost and margin; a flag and one-click fix for a recipe dish also counted in stock (RESTAURANT.md step 6; "Recipe dishes are Non-Stock").
- Short stock: allow and flag, warn the waiter, block the send, or mark the dish sold out (RESTAURANT.md "When ingredients are short of stock").
- Waste: stock lost by hand, voids and comps, each costed (RESTAURANT.md step 6).
- Dine in, takeaway and delivery; price rules by order type, days, hours and dates (RESTAURANT.md "Prices by order type and by time").
- Set menus with choices and upgrade surcharges (RESTAURANT.md "Set menus and combos").
- A sent dish moved between tabs takes its kitchen ticket with it (RESTAURANT.md "A sent dish moved between tabs").
- Tips kept apart from sales; shared by individual or pool (hours, points, equal); paid in cash or through payroll; booked in the ledger (RESTAURANT.md "Tips").
- Measures and reports: covers, spend per cover, average tab, tips, table turns, time at the table, kitchen time, voids, comps, waste (RESTAURANT.md step 7).
- Role templates Waiter, Host, Chef (RESTAURANT.md "Permissions").
- Ordering ahead on the shop for a time window with capacity (STOREFRONT_STUDIO.md §14).

**Pre-launch:**
- Menu photos and menu languages (spec Appendix A; RESTAURANT.md "Not yet (menus)").

**Not in Appendix A (keep off the site):**
- Shop orders sent to the kitchen screen as tickets (STOREFRONT_STUDIO.md §14 "What is left").
- Restaurant screens on the native (Kotlin) till (ROADMAP "Industry packs and the restaurant pack": "Left: … the Kotlin till").

**Pack switches on:** the Restaurant menu (Floor, Draw the floor, Menus, Options, Sold out, Kitchen, Recipes, Dish
costs, Waste, Prices, Tips), the `restaurant.*` features at that place, the kinds restaurant, bar and quick service,
and its permissions and role templates (RESTAURANT.md screens and "Permissions"; INDUSTRY_PACKS.md). It can be on at
one place and off at another; an upgrade changes only defaults nobody changed (INDUSTRY_PACKS.md "Upgrading").
"Set up a kitchen and a bar" installs a Kitchen and a Bar station (RESTAURANT.md step 5).

**Shares with the core:** the catalogue and price book (a dish is a catalogue item); the till and its payments; the
booking engine (tables are bookable resources); the stock ledger (ingredients, waste); the books (tips owed to staff,
tips kept by the house); payroll and the timeclock (tips); analytics reports, dashboards, exports and alerts
(RESTAURANT.md "Who owns what", steps 6-7, "Tips").

**Avoid:**
- An online order going straight to the kitchen screen. A web order is a sales order, not a kitchen ticket (STOREFRONT_STUDIO.md §14 "What is left").
- Restaurant screens on the native (Kotlin) till: ROADMAP says "the Kotlin till follows". Say "the till" without naming the platform; unclear.
- Allergen information as a legal or safety guarantee; "compliant".
- The sales, order and conversion figures on studio-storefronts.

**Boards:** till-floor, till-kitchen, erp4c-rest-service, erp4c-rest-menus, erp4c-rest-recipes, erp4c-rest-floor-plan,
erp4c-rest-kitchen, erp4c-rest-options, erp4c-rest-waste, erp4c-rest-tips, till-main, studio-restaurant-phone.

---

## industry-accommodation — Accommodation

**Kind:** a pack (`accommodation`) on the booking engine (ACCOMMODATION.md; spec Appendix A).

**Who it is for:** hotels, guest houses and short-lets (ACCOMMODATION.md intro; pack kinds hotel, guest house, short let).

**Trade words:** Guest, Stay, Front desk, Room rack, Housekeeping, Folio, Charge to room, Rate plan, Season, Special
date, Night audit, No-show, Out of order, Inspected, Walk-in (spec Appendix A; ACCOMMODATION.md; board erp4f-acc-front-desk).

**A day** (illustrative: a 24-room hotel with a restaurant and a bar):

| Time | The problem | How Clafina handles it | Surface | Best board |
|---|---|---|---|---|
| 03:00 | Yesterday must be closed before the new day. | The night audit posts a room night to each guest in the house (once), marks arrivals who never came as no-shows with the fee rule, counts folios still owing and closes the day (ACCOMMODATION.md "Night audit"). | automatic, web | unclear (no night-audit board; nearest erp4f-acc-front-desk) |
| 08:00 | Housekeepers need to know which room first. | Each room's tasks for the day; a room someone arrives in today is marked early-arrival priority (ACCOMMODATION.md data "housekeeping_tasks"). | phone | erp4f-phone-acc-housekeeping |
| 10:50 | The desk needs to know when a room is ready. | Room states go dirty, clean, inspected; each change reaches the desk at once, with no refresh (ACCOMMODATION.md "Rooms"). | web, phone | erp4f-acc-housekeeping |
| 11:00 | A guest arrives early. | Check-in puts a guest only into an inspected room (or a clean one, by setting) (ACCOMMODATION.md "Rooms"; check-in through the booking engine). | web | erp4f-acc-front-desk |
| 13:00 | The guest has lunch and wants it on the room. | The restaurant till posts the bill by room number to the guest's open folio, once only (ACCOMMODATION.md "Charge to room"). | till, web | erp4f-acc-folio |
| 14:00 | A company is paying for three rooms, but not the bar. | The folio names the company and what it covers (room nights or all); a charge can be moved to the company; the company's share becomes one customer invoice (ACCOMMODATION.md "Folio"). | web | erp4f-acc-folio |
| 16:00 | A busy weekend is coming. | The manager adds a special date with a higher price and a minimum stay; "try a price" shows each step from base rate to the night's price (ACCOMMODATION.md "Rates"). | web | erp4f-acc-rates |
| 17:30 | A guest asks to move rooms for two nights. | The stay is dragged on the room rack; a move onto a room already held those nights is refused (ACCOMMODATION.md "Rack"). | web | erp4f-acc-room-rack |

**Built:**
- Front desk: arrivals, in house and departures for the day; check-in, check-out and moves through the booking engine (ACCOMMODATION.md intro and API).
- Room rack: every room by night, occupancy over sellable rooms, moves refused when the room is taken (ACCOMMODATION.md "Rack").
- One availability grid: rooms and stays are the booking engine's, with no double booking held by the database (ACCOMMODATION.md intro; BOOKINGS.md "No double booking").
- Housekeeping: dirty, clean, inspected, out of order with a reason; check-out makes a room dirty and asks for a departure clean; every change logged (ACCOMMODATION.md "Rooms").
- Folios: one per stay or standalone; lines never changed, corrected by a new line; service charge, VAT and a second consumption tax by the place's settings (ACCOMMODATION.md "Folio").
- Charge to room from any outlet's till, once only (ACCOMMODATION.md "Charge to room").
- Split bill and company billing into one customer invoice (ACCOMMODATION.md "Folio", API).
- Payments on the folio: cash, card, transfer, wallet, deposit; refunds (ACCOMMODATION.md data "folio_payments").
- Rates: plans on the base rate, seasons that repeat each year, weekend uplift, special dates that set a price, a minimum stay or close the night; a quote that shows each step (ACCOMMODATION.md "Rates").
- Channels screen: one count of rooms left for every channel, Stop to close a night, an overbooking allowance (0 by default), retries when an update fails (ACCOMMODATION.md "Channels"). No connection ships switched on.
- Night audit, run by itself after the place's audit time or by hand (ACCOMMODATION.md "Night audit").
- From the booking engine: deposits by payment link (sandbox), cancellation and no-show fees, waiting list, guest emails with a calendar file, public booking pages for stays (BOOKINGS.md steps 2-3).

**Pre-launch:**
- Live connections to outside booking sites (spec Appendix A; ACCOMMODATION.md "Not yet": each needs the organisation's account and the site's approval).
- Key cards and locks (spec Appendix A; ACCOMMODATION.md "Not yet").
- Group bookings with a rooming list (spec Appendix A; ACCOMMODATION.md "Not yet").
- The occupancy dashboard (spec Appendix A; ACCOMMODATION.md "Not yet").
- A public booking page for rooms (spec Appendix A; ACCOMMODATION.md "Not yet").

**Not in Appendix A (keep off the site):**
- Average daily rate and revenue per available room as KPIs; the night-audit report (ACCOMMODATION.md "Not yet").
- Guest check-in on a tablet with ID scan and signature (ACCOMMODATION.md "Not yet").
- Company price books in a rate plan (ACCOMMODATION.md "Not yet").
- An out-of-order room opening a maintenance job (ACCOMMODATION.md "Not yet").
- SMS and WhatsApp guest messages (BOOKINGS.md "Limits").

**Pack switches on:** the Accommodation menu (Front desk, Room rack, Housekeeping, Folios; Rates, Channels, Night audit
for set-up), features `accommodation.desk`, `.housekeeping`, `.folios`, `.rates`, `.channels`, `.audit`, the place kinds
hotel, guest house and short let, and the words Guest and Stay. The installer writes nothing: a room never touched reads
as clean (ACCOMMODATION.md "The pack"). Where another pack calls the customer something else, the standard word stays
until the owner picks one (INDUSTRY_PACKS.md "Two packs, two words").

**Shares with the core:** the booking engine (rooms, room types, stays, availability, deposits, policies); the till
(charge to room); sales invoices for a company's share; customers from CRM; payments; the price book (BOOKINGS.md
pricing); document settings per place (ACCOMMODATION.md intro, "Folio", "Settings").

**Avoid:**
- Naming booking sites. erp4f-acc-channels, erp4f-acc-front-desk and erp4f-acc-room-rack show them as live; relabel them.
- "Channel manager".
- The key-card maker and "ID scanned" on erp4f-acc-folio, as built.
- An occupancy dashboard as built (the rack's occupancy by night is built; the dashboard is pre-launch). ADR and RevPAR: keep off the site.
- Card payment by the guest online as live (sandbox).

**Boards:** erp4f-acc-front-desk, erp4f-acc-room-rack, erp4f-acc-folio, erp4f-acc-housekeeping,
erp4f-phone-acc-housekeeping, erp4f-acc-rates, erp4f-acc-channels.

---

## industry-events — Events and ticketing

**Kind:** a pack (`events`), switched on per place (EVENTS.md status; INDUSTRY_PACKS.md).

**Who it is for:** conferences, fairs, concerts, races, galas and any business that sells entry (EVENTS.md intro).
Places of kind venue (INDUSTRY_PACKS.md "Open kinds of place").

**Trade words:** Event, Session, Ticket type, Seating plan, Table, Hold, Door sales, Box office, Gate, Check-in, Scan,
Sponsor, Venue, Invitation-only, Refund window, On sale (spec Appendix A; EVENTS.md).

**A day** (illustrative: a two-day trade fair with a gala dinner):

| Time | The problem | How Clafina handles it | Surface | Best board |
|---|---|---|---|---|
| Weeks before, 09:00 | Set up the fair before selling. | A draft event with ticket types (price, number, sales window, limit per order), sessions and a venue; it cannot go on sale until every seated ticket has a table drawn (EVENTS.md "Making and selling"). | web | erp4f-ev-new |
| Weeks before, 15:00 | Two buyers want the last gala table. | The table is held for a few minutes for the first buyer; the second is refused, naming the table; two sales can never take the last ticket (EVENTS.md "Tables", "One sale"). | web | erp4f-ev-event |
| Weeks before, 16:30 | A company buys 20 passes on account. | The sale makes an invoice; the tickets stay "not paid yet" at the gate until it is paid, then become valid and are emailed (EVENTS.md "Paying"). | web | erp4f-ev-event |
| Day 1, 08:00 | The gate opens and the queue is long. | Staff scan each ticket's QR code or type its number; a code that is forged, for another event, unpaid or already used is refused with the reason; every scan is recorded (EVENTS.md "Tickets and codes", "The gate"). | web | erp4f-ev-event |
| Day 1, 09:30 | Delegates go into the keynote room. | A session scan is separate from the gate: a ticket gets into each session it admits to once (EVENTS.md "The gate"). | web | erp4f-ev-event |
| Day 1, 11:00 | People turn up without tickets. | Door sales use the same sale, paid in cash or by card and recorded (EVENTS.md "One sale", "Paying"; board "Door sales"). | web | erp4f-ev-event |
| Day 1, 14:00 | A buyer who cannot come asks for a refund. | Free within the refund window, with a reason after it; the tickets are voided, the count goes back and the answer names the invoice to credit (EVENTS.md "Refunds"). | web | erp4f-ev-event |
| Day 2, 18:00 | What did the fair bring in? | The event page shows tickets by type, the gate's figures, sales by day, and sponsors' agreed and paid amounts (EVENTS.md "What a person does", "Sponsors", API sales-by-day). | web | erp4f-ev-list |

**Built:**
- Events as drafts, on sale, closed or cancelled (cancelling needs a reason); ticketed, free or internal (EVENTS.md "Data", "Making and selling").
- Sessions with a room and a time; ticket types with price, number, sales window, limit per order, invitation-only and the sessions they admit to (EVENTS.md "Data").
- Seating plan of numbered tables or seats; tables held while a buyer pays, sold only to the holder (EVENTS.md "Tables").
- One sale for the desk, the door, an invoice, the till and the storefront, claimed so the last ticket or table is never sold twice; a retried sale is one sale (EVENTS.md "One sale").
- Paying by cash, card, transfer, the till or free, recorded at the desk or door; or on an invoice that makes tickets valid when paid (EVENTS.md "Paying").
- Tickets with QR codes signed by the event and a readable number; emailed when paid, and again on request (EVENTS.md "Tickets and codes").
- The gate: scans checked in a fixed order with the reason; a ticket gets in once; two phones cannot let one ticket in twice; a replayed scan is recorded once (EVENTS.md "The gate").
- Refunds within a window, with a reason after it; never for a ticket already scanned in (EVENTS.md "Refunds").
- Sponsors with what each agreed and paid; venues with a capacity (EVENTS.md "Sponsors", "Data").
- Event list with tabs On sale, Now, Drafts, Past and the figures over them; orders across events (EVENTS.md "What a person does").
- Role templates Box office, Door scanner, Events manager (EVENTS.md "API" scope).

**Pre-launch:**
- Offline scanning at the gate (spec Appendix A; EVENTS.md "Not yet").
- The ticket page on the storefront (spec Appendix A; EVENTS.md "Not yet").
- Waitlists, resale and transfer of a ticket (spec Appendix A; EVENTS.md "Not yet").

**Not in Appendix A (keep off the site):**
- The till's ticket screen (EVENTS.md "Not yet").
- A credit note on refund, and refunding every order of a cancelled event in one step (EVENTS.md "Not yet").
- Releasing unpaid invoice orders after a time, and reminders to people who have not paid (EVENTS.md "Not yet").
- Sponsor passes as tickets, a seat map drawn freehand, an override at the gate (EVENTS.md "Not yet").
- Home cards: events on sale, happening now, almost sold out, ticket sales this year (EVENTS.md "Not yet").
- The buyer paying a ticket order online by card, transfer or wallet; it waits on live payment rails (EVENTS.md "Not yet").

**Pack switches on:** the Events pages (Events, an event, Tickets sold, Check-in, Venues), the place kind venue, the
`events` permissions and three role templates, and starting settings for the refund window, hold minutes and when
check-in opens; an upgrade moves only the settings nobody changed (EVENTS.md "What a person does", "Settings";
INDUSTRY_PACKS.md).

**Shares with the core:** sales invoices (a sale on account is made, approved and posted by the invoice path); the
numbering module; document settings per place; customers from CRM (buyers and sponsors); the till and the storefront
(through the same sale); finance for refunds (EVENTS.md intro, "Paying", "Refunds", "Selling from other products").

**Avoid:**
- "Scanned on any staff phone, offline" (erp4f-ev-new): offline scanning is pre-launch.
- Phone scanning as built: the built gate is the web Check-in screen; a phone scanner is unclear.
- Online ticket checkout or online payment by the buyer (not in Appendix A; payments are sandbox).
- The sponsor, organiser and venue names on erp4f-ev-event and erp4f-ev-list (real-sounding names).

**Boards:** erp4f-ev-event, erp4f-ev-list, erp4f-ev-new.

---

## industry-memberships — Memberships

**Who it is for:** gyms, clubs, coworking spaces, schools "and any business that bills by the period" (MEMBERSHIPS.md intro).
The pack brings the place kinds gym, club and coworking (INDUSTRY_PACKS.md "Open kinds of place").

**Trade words:** members, plans, freezes, billing runs (Appendix A); also member card, fob, day pass, class pack, trial,
corporate seats, check-in, paid to, payment failed, retainer, maintenance contract (MEMBERSHIPS.md; boards).

**A day** (illustrative: a gym in Lekki, named "Eben Wellness" on the boards; label it as an example):
1. **06:00. A member's card is scanned at the front desk.** Problem: is she allowed in, and does today count as a visit?
   Clafina asks one rule what the member may enter now: started, frozen, overdue, visits used, the area and the hours her plan
   lets in (MEMBERSHIPS.md Rules, "Access, one entitlement"). A second scan within the set window lets her through without
   counting twice (same). Surface: web (the desk, `/memberships/access`); phone (owner, spec §2). Board: erp4f-cls-checkin
   (the desk), erp4f-mem-member (Access tab).
2. **07:15. Someone owes from last month.** Problem: the front desk should not have to argue. An overdue invoice marks the
   member as owing; access pauses after the set number of unpaid days; the moment the invoice is paid, access opens again,
   because the rule reads what is owing, not a flag (MEMBERSHIPS.md Rules, "Late payment"). Staff with the check-in
   permission can let someone in once with a reason, which is logged (same, "Access"). Surface: web. Board: erp4f-mem-members.
3. **09:30. A member travels for two weeks and asks to freeze.** Problem: fair credit without spreadsheet sums. Freezes come
   from a yearly allowance per plan with a shortest freeze and a notice; days already paid for come back as a credit on the
   next invoice; access is blocked while frozen and the hourly sweep starts and ends the freeze (MEMBERSHIPS.md Rules,
   "Freezes"; "Jobs"). Surface: web. Board: erp4f-mem-member.
4. **11:00. A new member joins mid-month.** Problem: what to charge for the first part-month. The first bill follows the
   organisation's proration setting: charged by the day ("14 of 31 days"), a full first period, or nothing; a trial bills
   nothing until it ends; a card with a QR code is made and can be emailed (MEMBERSHIPS.md Rules, "Joining"; API
   `card/send`). Surface: web. Board: erp4f-mem-members.
5. **13:00. A company wants ten staff on one plan.** Problem: one payer, named people. A corporate plan sends the company one
   invoice for its seats; each seat is a named member; if the company owes or ends, its seats stop at the door
   (MEMBERSHIPS.md Rules, "Corporate plans"). Surface: web. Board: erp4f-mem-plans.
6. **15:00. The manager checks tomorrow's billing run.** Problem: catching mistakes before anyone is invoiced. The check is a
   dry run that lists who needs a look and why (payment overdue, skipped, ends, price change, check seats, no payment method,
   plan change) and nothing is invoiced or charged until Run is pressed; each member is then invoiced in their own step, a
   failure is marked and can be retried without billing twice (MEMBERSHIPS.md Rules, "Billing runs"). Charging a card on file
   on the day is **pre-launch** (MEMBERSHIPS.md "Not yet"; Appendix A). Surface: web. Board: erp4f-mem-billing-run.
7. **17:00. Prices go up for new members.** Problem: existing members keep their price until told. A plan's price change
   applies to new members; the manager can move live members to the new price from a chosen day, and the run flags each one as
   a price change (MEMBERSHIPS.md Rules, "Price changes"). Surface: web. Board: erp4f-mem-plans.
8. **18:30. A maintenance client asks how many visits are left.** Problem: knowing what has been used. Contracts and
   retainers count visits from the jobs done, hours from time logged and money from what was drawn; never typed in; and say
   on track, running low, used up or renewing (MEMBERSHIPS.md Rules, "Contracts and retainers"). Surface: web. Board:
   erp4f-mem-contracts.

**Built:**
- Plans of four kinds: recurring, pack, day pass, corporate; with price, rhythm, visit limit, validity, freeze days, trial,
  ID needed, billing day, areas and hours (MEMBERSHIPS.md Data, `plans`; Rules, "Plans").
- A plan change applies to new members; members keep the price they pay until moved (MEMBERSHIPS.md Data, `memberships`;
  Rules, "Price changes").
- Joining with proration by the day, a full period or none; trials (MEMBERSHIPS.md Rules, "Joining").
- Member card as a QR code (a random token, never the member number), also emailed as an image, and a fob; a new card stops the
  old one (MEMBERSHIPS.md Rules, "Access"; "Not yet").
- One entitlement for the desk, a door and the till; locked while it works so two scans cannot take the last visit; a once-off
  let-in with a logged reason (MEMBERSHIPS.md Rules, "Access, one entitlement").
- Freezes with a yearly allowance, notice, no overlap, credit for paid days (MEMBERSHIPS.md Rules, "Freezes").
- Plan change now or at the next bill, with credits and charges as lines on the next invoice (MEMBERSHIPS.md Rules, "Plan
  change").
- Cancelling at the end of what is paid, at once, or as chosen; can be taken back before it takes effect (MEMBERSHIPS.md Rules,
  "Cancelling").
- Late payment: reminders on the retry days through the invoice's own reminders; access pauses after N unpaid days and opens
  when paid (MEMBERSHIPS.md Rules, "Late payment").
- Billing runs checked before they run, one invoice per member per period, failures retried without double billing,
  reminders only, leave a member out; one currency per run (MEMBERSHIPS.md Rules, "Billing runs").
- Corporate plans with named seats and unused seats flagged (MEMBERSHIPS.md Rules, "Corporate plans").
- Contracts, retainers and prepayments as a view over Projects, with renewal (MEMBERSHIPS.md Rules, "Contracts and
  retainers").
- Hourly sweep: freezes, trials, scheduled ends, chasing, yearly renewal notice (MEMBERSHIPS.md "Jobs").
- Billing rules set once for all plans; three role templates: Front desk, Membership billing, Memberships manager
  (MEMBERSHIPS.md "Settings"; API "Scope").

**Pre-launch:**
- Card on file and charging it (MEMBERSHIPS.md "Not yet"; Appendix A). Until then a card member is invoiced and flagged *No
  payment method*. Sandbox only until payment rails are live.
- The member's own app and a web join page (MEMBERSHIPS.md "Not yet"; Appendix A).
- Wallet passes (MEMBERSHIPS.md "Not yet"; Appendix A). Do not name the wallet makers.
- Offline door scanning (MEMBERSHIPS.md "Not yet"; Appendix A).

**Pack switches on:** the `memberships` pack per place; place kinds gym, club, coworking (INDUSTRY_PACKS.md "Open kinds");
the first four billing settings (bills on, proration, retry days, access paused after) as defaults the organisation can change
and that later upgrades leave alone (MEMBERSHIPS.md "Settings"; INDUSTRY_PACKS.md "Upgrading"); three role templates
(MEMBERSHIPS.md "History"). Menu labels: unclear (the doc lists screens and routes, not menu text). Home cards declared, not
drawn (MEMBERSHIPS.md "Not yet").

**Shares with the core:** recurring invoice dates and the invoice path (made, approved, posted, emailed the same way)
(MEMBERSHIPS.md intro); CRM customers (Data, `memberships`); invoice reminders (Rules, "Late payment"); Projects for contracts and
retainers, which needs Projects permissions too (Rules, "Contracts and retainers"); the till and doors through the same check-in
(Rules, "Access"); the classes pack's bookings and check-in (History, 25 Oct).

**Avoid:**
- "Charged automatically", "card on file" or the billing run's "card is charged" as built: pre-launch, and sandbox only.
- The bank name next to the card on erp4f-mem-member; "Apple and Google Wallet" (say "wallet pass", pre-launch).
- "QR code by SMS" (erp4f-mem-plans day pass): the card is emailed; SMS is not in the memberships doc.
- "A door or turnstile opens by itself" (erp4f-cls-checkin): door hardware set-up is "not drawn" (MEMBERSHIPS.md "Not yet")
  and is not on the pre-launch list. Unclear.
- Refund rules on cancellation, plan comparison for a member, notes on a member: not yet, not on the list (MEMBERSHIPS.md "Not
  yet"). The member board's Notes tab is one of these.
- Unused corporate seats are not refunded: do not imply otherwise.

**Boards:** erp4f-mem-billing-run, erp4f-mem-member, erp4f-mem-plans, erp4f-mem-members, erp4f-mem-contracts.

---

## industry-classes — Classes

**Who it is for:** studios, gyms and anyone running a timetable of classes with places (CLASSES.md intro; the pack offers the
place kind `studio`, "The pack"). Members book on their plan where the memberships pack is on; anyone with class-pack credits
books without it (CLASSES.md "The pack").

**Trade words:** class schedule, check-in, class packs, credits, drop-in (Appendix A); also places left, waiting list, offer,
late cancel, no-show, teachers' pay, doors open (CLASSES.md; boards).

**A day** (illustrative: the same Lekki gym's studio; label it as an example):
1. **06:00. The 06:30 spin class has one place left and two people tap Book at once.** Problem: overbooking. The class row is
   locked while a booking takes a place, so two people never take the last one; the second joins the waiting list in order
   (CLASSES.md Rules, "Places"; BOOKINGS.md "shared resources"). Surface: web; phone (owner, spec §2). Board: erp4f-cls-schedule.
2. **08:00. A member with a plan and a customer with a 10-class pack both book yoga.** Problem: who pays how. A member pays
   with the plan when the memberships rule allows the class now; otherwise the soonest-expiring credits are taken at booking;
   otherwise a drop-in is invoiced if the class has a price (CLASSES.md Rules, "Paying"). The member booking for themselves on
   their own screen is **pre-launch** (CLASSES.md "Not yet"; Appendix A); today staff book. Surface: web. Board:
   erp4f-cls-schedule.
3. **10:00. Someone cancels four hours before.** Problem: being fair about credits. Cancelling is free until a set number of
   hours before and the credit comes back; later is a late cancel and the credit is kept if the setting says so (CLASSES.md
   Rules, "Cancelling"; Settings). Surface: web. Board: erp4f-cls-schedule.
4. **10:01. The freed place goes to the first person waiting.** Problem: filling it without phoning round. The first waiting
   is offered the place by email for a set number of minutes; if they don't take it, the offer lapses and the next is offered
   (CLASSES.md Rules, "Offers"). Offers by WhatsApp or SMS are **pre-launch** (CLASSES.md "Not yet"; Appendix A). Surface: web
   plus email. Board: erp4f-cls-schedule.
5. **17:30. Doors open for the 18:00 class.** Problem: a queue at the desk. Check-in uses the memberships desk: scan a code or
   pick from the class list; the visit is counted once; a refusal is shown with its reason, and staff can let someone in once
   with a reason; a walk-in with a free place is booked at the door; doors open and close at set minutes around the start
   (CLASSES.md Rules, "Check-in"; `commerce-web/docs/features.md` "Classes"). Surface: web; phone (owner). Board:
   erp4f-cls-checkin.
6. **19:05. Class is over.** Problem: chasing who didn't come. A job at the class's end marks no-shows (credit kept if set),
   lapses any open offer and closes the class (CLASSES.md Rules, "No-shows"). Surface: automatic. Board: erp4f-cls-checkin.
7. **20:00. The teacher is ill tomorrow.** Problem: telling everyone. Cancelling a class cancels every place, returns every
   credit and emails everyone (CLASSES.md Rules, "Cancelling a class"). Surface: web. Board: erp4f-cls-schedule.
8. **Month end. Teachers' pay.** Problem: counting classes and heads. Pay is classes taught times the rate a class plus
   attendees times the rate an attendee, at the rate in force on the month's first day (CLASSES.md Rules, "Teachers' pay").
   Sending it into payroll is **pre-launch** (CLASSES.md "Not yet"; Appendix A). Surface: web. Board: none drawn (unclear).

**Built:**
- Class types and classes, once or weekly, with room, teacher, places, length, drop-in price and credits a booking takes
  (CLASSES.md Data; API `repeatWeeks`).
- The week coloured by places left: open, almost full, full (CLASSES.md Rules, "Places").
- No double booking of the last place; waiting list in order (CLASSES.md Rules, "Places").
- Paying with a plan, credits or a drop-in invoice (CLASSES.md Rules, "Paying").
- Free cancel window, late cancel and no-show rules by setting (CLASSES.md Rules; Settings).
- Waiting-list offers by email for a set time, lapsing to the next; staff may offer to anyone waiting (CLASSES.md Rules,
  "Offers").
- Check-in through the memberships desk, counted once, refusals kept with the reason, once-off let-in, walk-ins (CLASSES.md
  Rules, "Check-in").
- No-shows marked and the class closed at its end (CLASSES.md Rules, "No-shows").
- Class packs sold as credits, with an append-only credit ledger (CLASSES.md Data; API `packs/:id/sell`).
- Teachers' pay worked out a month (CLASSES.md Rules, "Teachers' pay").
- Message everyone in a class (CLASSES.md API `sessions/:id/message`); cancel a class with credits back and emails
  (CLASSES.md Rules).
- How far ahead people can book is a setting (CLASSES.md Settings, `bookAheadDays`).

**Pre-launch:**
- The member's own booking screen (CLASSES.md "Not yet"; Appendix A).
- Waiting-list offers by WhatsApp or SMS (CLASSES.md "Not yet"; Appendix A). Do not name a vendor.
- Teachers' pay sent into payroll (CLASSES.md "Not yet"; Appendix A).

**Pack switches on:** the `classes` pack ("Classes and check-in"), features schedule, check-in, packs and pay; menu "Classes":
Class schedule, Check-in, Class packs, Teachers' pay; place kind `studio` offered; the installer writes nothing (CLASSES.md "The
pack"). Home cards declared, not drawn (INDUSTRY_PACKS.md "Not yet").

**Shares with the core:** Memberships' check-in and entitlement (CLASSES.md "The pack"; Rules); Bookings, as the pack is "on
Bookings" (ROADMAP item 11; BOOKINGS.md "a studio's class"); the customer invoice for drop-ins and packs (INDUSTRY_PACKS.md
"What the packs of 25 October share"; CLASSES.md Settings `packInvoices`); CRM customers (CLASSES.md Data, "a member, or a
customer").

**Avoid:**
- "Members book in the app" (erp4f-mem-member Access) as built: pre-launch.
- Online classes in Meet rooms made for them (a link is kept), rooms as booking-engine resources, class packs in another
  currency, loyalty points for attendance: not yet, not on the list (CLASSES.md "Not yet").
- Turnstiles opening by themselves (erp4f-cls-checkin): unclear (see memberships).
- "Credits never expire": packs have days they are good for (CLASSES.md Data).

**Boards:** erp4f-cls-schedule, erp4f-cls-checkin.

---

## industry-courses — Courses

**Who it is for:** businesses training their own staff and selling courses to customers; schools and training centres (COURSES.md
intro; "The pack", kinds `school` and `training_centre`).

**Trade words:** learners, lessons, quizzes, certificates (Appendix A); also course outline, modules, pass mark, retakes, My
learning, stuck, where people stop, fees by term, fee statement, parent or guardian (COURSES.md; boards; owner).

**A day** (illustrative: a training manager at a distributor, "Eben Distribution" on the boards; label it as an example):
1. **08:30. A new course is nearly ready.** Problem: publishing something half-finished. The builder lists modules and video,
   reading, quiz and live lessons; publishing needs every lesson ready (a video with its file and length, captions when the
   setting requires them, a reading with text, a quiz with enough questions) (COURSES.md Rules, "Publishing"). Surface: web.
   Board: erp4f-course-builder.
2. **09:00. Course published.** Problem: getting staff onto it. Staff invited to a draft are enrolled when it is published;
   staff come from HR with their sign-in and are never invoiced (COURSES.md Rules, "Publishing", "Customers"; Data,
   `enrolments`). Surface: web. Board: erp4f-course-builder.
3. **11:00. A cashier skips through a video.** Problem: "watched" that wasn't. The player reports what was watched; the server
   only accepts as much as time allows and cuts back the rest; a video is done at the set share of its real length
   (COURSES.md Rules, "Watching"). Surface: web, My learning; phone (owner). Board: erp4f-course-progress.
4. **12:30. A quiz.** Problem: answers passed around. Each attempt draws questions from a bank, answers are never sent to the
   browser, retakes are limited and spaced apart, and passed is final (COURSES.md Rules, "Quizzes"). Surface: web. Board:
   erp4f-course-builder.
5. **14:00. A customer wants a paid place.** Problem: getting paid first. A priced place is invoiced on the normal customer
   invoice, and a setting can hold the learner until payment is confirmed (COURSES.md Rules, "Customers"). Selling the course
   on the online shop is **pre-launch** (COURSES.md "Not yet"; Appendix A). Surface: web; shop (pre-launch). Board:
   erp4f-course-builder.
6. **15:30. The manager sees where people give up.** Problem: a lesson that loses people. The learners board shows states
   worked out for today (finished, not started, on track, stuck, retake) and the lesson with the biggest drop, with a hint from
   that lesson's own facts (COURSES.md Rules, "Where people stop", "A learner's state"). Sending reminders is **pre-launch**
   (COURSES.md "Not yet"; Appendix A). Surface: web. Board: erp4f-course-progress.
7. **16:30. A learner finishes.** Problem: proof for HR. Finishing gives a numbered certificate with an expiry and a
   verification code; a staff member's goes on their HR record as a training record (COURSES.md Rules, "Finishing"). Checking a
   code is built for staff with the certificates permission (`commerce-web/docs/features.md` "Courses"); a public verification
   page is **pre-launch** (COURSES.md "Not yet"; Appendix A). Surface: web. Board: erp4f-course-progress.
8. **17:00. (A school using it.)** Problem: a parent asks what is owed this term. Fees by term, fee statements and parent or
   guardian records are **pre-launch** (owner, 5 Nov; Appendix A). How they work is unclear: COURSES.md does not describe them.
   Surface: unclear. Board: none drawn.

**Built:**
- Courses with modules and lessons: video, reading, quiz, live; Drive files, captions, resources, languages, audience (staff,
  customers, both) (COURSES.md Data, `courses`, `lessons`).
- Publishing only when every lesson is ready (COURSES.md Rules, "Publishing").
- Watch progress bounded by time on the server (COURSES.md Rules, "Watching").
- Quizzes from a question bank, pass mark, retakes with a gap, answers never sent (COURSES.md Rules, "Quizzes").
- Staff learners from HR; customer learners invoiced, optionally held until paid; approval (COURSES.md Data, `enrolments`;
  Rules, "Customers").
- Numbered certificates that run out, verify by code, and can be revoked with a reason and reissued (COURSES.md Data,
  `certificates`; API).
- A staff certificate added to the HR record as a training record (COURSES.md Rules, "Finishing").
- Learners board: states for today, tallies, where people stop (COURSES.md Rules; `commerce-web/docs/features.md` "Courses").
- My learning and the player for the learner (COURSES.md API, "The player's read").

**Pre-launch:**
- Public certificate verification (COURSES.md "Not yet"; Appendix A).
- Reminders (COURSES.md "Not yet"; Appendix A).
- Cohorts and scheduled classes (COURSES.md "Not yet", "the booking engine"; Appendix A).
- Selling on the shop (COURSES.md "Not yet"; Appendix A).
- Fees by term, fee statements, parent or guardian records (owner, 5 Nov; Appendix A). Not in COURSES.md.

**Pack switches on:** the `courses` pack, place kind `school` (also `training_centre`); features courses, enrolments,
certificates; menu "Courses": Courses, Learners, Certificates, My learning; the installer writes nothing (COURSES.md "The pack").
Home cards declared, not drawn (INDUSTRY_PACKS.md "Not yet").

**Shares with the core:** HR (staff learners, the certificate as a training record) (COURSES.md Data, Rules); Drive files for
lessons (COURSES.md Data); the customer invoice (COURSES.md Rules, "Customers"); the booking engine for cohorts (pre-launch,
COURSES.md "Not yet").

**Avoid:**
- "Staff are told in their Inbox" (erp4f-course-builder): not yet, not on the list (COURSES.md "Not yet").
- "Customers see it on the shop" (erp4f-course-builder) as built: pre-launch.
- The certificate as a designed document, captions as a separate upload, Meet for live lessons: not yet, not on the list
  (COURSES.md "Not yet").
- Calling the courses accredited, or using the other banned word. A certificate here is the business's own.
- Detail on how term fees or guardian records work: unclear.

**Boards:** erp4f-course-progress, erp4f-course-builder.

---

## industry-client-records — Client records

**Who it is for:** clinics, physiotherapists, therapists, vets, opticians, and salons that keep formulas (CLIENT_RECORDS.md intro).

**Trade words:** client, consent, signed notes, break-glass (Appendix A); also care team, treating practitioner, access log,
record lock, measurements, prescriptions, guardian, data request, retention, privacy officer (CLIENT_RECORDS.md; boards).

**A day** (illustrative: a physiotherapy clinic in Lekki, "Eben Wellness" on the boards; label it as an example):
1. **08:00. Front desk checks the day's list.** Problem: the receptionist should not see clinical notes. Front desk and managers
   see name, phone, bookings and consent state only; the list searches names, numbers and phones and never indexes clinical
   text (CLIENT_RECORDS.md "The standard": Roles; Search). Surface: web. Board: erp4f-cr-clients.
2. **08:30. A new client arrives for a first visit.** Problem: no consent on file. Consent is a record (purpose, wording version,
   signed when and by whom, valid to); without valid consent, things that need it are blocked (CLIENT_RECORDS.md "The standard":
   Consent). A client signing on their own consent page is **pre-launch** (CLIENT_RECORDS.md "Not yet"; Appendix A); today
   staff record it. Surface: web. Board: erp4f-cr-consent-settings.
3. **10:00. The physio opens her client's record.** Problem: every look should be accountable. The treating practitioner opens
   without a question; every read of a clinical field writes an access-log row at the same moment; the record locks after a set
   idle time (CLIENT_RECORDS.md "The standard": Roles; access log; Idle lock). Surface: web; phone (owner). Board:
   erp4f-cr-record.
4. **10:40. She signs her session note.** Problem: notes changed later. A signed note never changes; a correction is a new note
   naming the first (CLIENT_RECORDS.md "The standard": signed note). Templates per profession are **pre-launch**
   (CLIENT_RECORDS.md "Not yet"; Appendix A). Surface: web. Board: erp4f-cr-record.
5. **11:30. A colleague covers for her.** Problem: access outside the care team. Other clinical staff must give a reason,
   which is logged (CLIENT_RECORDS.md "The standard": Roles). Surface: web. Board: erp4f-cr-access-log.
6. **13:00. A child's appointment.** Problem: who can consent. A client under the set age needs a guardian, and consent must be
   the guardian's (CLIENT_RECORDS.md "The standard": minor). Surface: web. Board: erp4f-cr-clients.
7. **15:00. An emergency out of hours.** Problem: getting in fast without a free pass. Break-glass needs a written reason and is
   announced at once; break-glass, unusual speed and exports raise an item for the privacy officer (CLIENT_RECORDS.md "The
   standard": Roles; flags). Surface: web. Board: erp4f-cr-access-log.
8. **17:00. A client emails asking for a copy of her record.** Problem: missing the deadline. Copy, correction and deletion
   requests each get a due day 30 days from receipt, and overdue ones are marked (CLIENT_RECORDS.md "The standard": Data subject
   requests). Exports and prints are logged with their reason (same: access log). Sending to an insurer is consent-gated
   (CLIENT_RECORDS.md "The standard": Consent; API export "insurer"); insurer claims are **pre-launch** (CLIENT_RECORDS.md
   "Not yet"; Appendix A). Surface: web. Board: erp4f-cr-access-log.

**Built:**
- A client list with nothing clinical; search on names, numbers and phones only (CLIENT_RECORDS.md "The standard").
- Clinical fields encrypted again in the application with a key per organisation (CLIENT_RECORDS.md "The standard"). Say
  "encrypted with your organisation's own key"; leave out algorithm names.
- Records opened deliberately: treating, with a reason, or break-glass; a short-lived lock after idle time
  (CLIENT_RECORDS.md "The standard": Roles; Idle lock).
- An access log written with every read, that cannot be edited, kept ten years; flags for break-glass, unusual speed, exports
  and searches over the set limits (CLIENT_RECORDS.md "The standard"; Settings).
- Consent as versioned records that block what needs them (photos, insurer share) (CLIENT_RECORDS.md "The standard").
- Notes, measurements, prescriptions, documents and allergies on the record; signed notes sealed (CLIENT_RECORDS.md Data; API).
- Minors with guardians and guardian consent (CLIENT_RECORDS.md "The standard").
- Data requests on a 30-day clock; retention rules for adults and children, applied by the privacy officer; no delete route
  (CLIENT_RECORDS.md "The standard"; Settings).
- No clinical text in notifications, links, logs, errors, events or the assistant (CLIENT_RECORDS.md "The standard").
- No default role but the owner carries clinical access (CLIENT_RECORDS.md "The standard": Roles; Seed).

**Pre-launch:**
- Record templates per profession (physio, therapy, vet with pets and owners, eyewear prescriptions, hair colour formulas)
  (CLIENT_RECORDS.md "Not yet"; Appendix A).
- The client's own consent page (CLIENT_RECORDS.md "Not yet"; Appendix A).
- Insurer claims (CLIENT_RECORDS.md "Not yet"; Appendix A). Do not name insurers.

**Pack switches on:** the `client-records` pack, its pages under `/client-records` (INDUSTRY_PACKS.md "The packs";
`commerce-web/docs/features.md`); the record settings (idle lock, flag limits, hours, retention, majority age, privacy officer)
(CLIENT_RECORDS.md Settings). The place kind `clinic` is a core kind (INDUSTRY_PACKS.md "Open kinds"). Menu labels, words and
Home cards: unclear (CLIENT_RECORDS.md does not list them).

**Shares with the core:** the booking engine's screens book clients (CLIENT_RECORDS.md "Not yet", last item); Drive files for
documents (CLIENT_RECORDS.md Data); whether a client is a CRM customer: unclear.

**Avoid:**
- Any word or law name (HIPAA, GDPR, NDPA) that says the pack meets a law. The doc says it was built "to the health-data standard"; the consent
  board's "What the law asks of you" panel and "Set to the data protection law of your country" should not become claims.
- "A breach is detected and reported" (erp4f-cr-consent-settings): not in the doc.
- "Repeated unusual access can pause that person's access" and "Owner approves exports" (erp4f-cr-access-log): not in the doc.
  Unclear.
- "Signed on a phone or tablet" by the client (erp4f-cr-consent-settings) as built: pre-launch (client consent page).
- Insurer names and claim numbers on the boards.
- Your own cloud key service, key rotation, flags in the Inbox, referrals, booking from the record: not yet, not on the list
  (CLIENT_RECORDS.md "Not yet").
- Marketing consent "by SMS, WhatsApp or email" as a sending feature: the board lists a consent wording only.

**Boards:** erp4f-cr-record, erp4f-cr-access-log, erp4f-cr-clients, erp4f-cr-consent-settings.

---

## industry-fundraising — Fundraising

**Who it is for:** charities and foundations (FUNDRAISING.md intro; place kind `charity`, "The pack").

**Trade words:** Donor, gifts, campaigns, grants, tax receipts, pledges (Appendix A); also restricted funds, budget lines,
major, monthly, lapsed, suggested ask, thank-you, year-end batch, funder, tranche, grant report (FUNDRAISING.md; boards).

**A day** (illustrative: a Lagos foundation, "Eben Care Foundation" on the boards; label it as an example):
1. **08:30. The overview.** Problem: things slipping. The overview shows what needs doing: receipts to issue, thank-yous not
   sent, overdue pledges, grant reports due (FUNDRAISING.md; `commerce-web/docs/features.md` "Fundraising"). Surface: web;
   phone (owner). Board: erp4f-fund-overview.
2. **09:00. A transfer arrives and is recorded as a gift.** Problem: the same money counted twice. A gift is linked to the
   finance receipt it came by, once; a receipt already used by a gift cannot be picked again (FUNDRAISING.md Data, `gifts`; API
   "The Finance receipt a gift came by"). Posting gifts to the ledger with the fund is **pre-launch** (FUNDRAISING.md "Not yet";
   Appendix A). Surface: web. Board: erp4f-fund-campaign.
3. **09:05. The donor's receipt.** Problem: receipts late or missing. Each gift is put down for its own receipt, the yearly
   receipt or none, by the donor's choice and the rules; receipts are numbered, in the organisation's own words, and are voided
   and replaced, never deleted (FUNDRAISING.md Rules, "A gift's receipt", "Tax receipts"). A receipt issued and sent as soon as
   a gift is received, and emailing receipts, are **pre-launch** (owner, 5 Nov; FUNDRAISING.md "Not yet"; Appendix A). Today
   receipts are recorded as sent or bounced. Surface: web. Board: erp4f-fund-receipts.
4. **10:30. A big gift needs a thank-you.** Problem: forgetting the personal note. Gifts over a set amount are listed for a
   thank-you within a set number of days (FUNDRAISING.md Settings, `thankYouOver`, `thankYouWithinDays`; API `thank`).
   Surface: web. Board: erp4f-fund-overview.
5. **12:00. Planning a call to a company donor.** Problem: how much to ask. The donor card gives a suggested ask in a sentence:
   the most given in a year, rounded up, at the next campaign for their interests; donors are grouped as major, monthly, new,
   lapsed or regular (FUNDRAISING.md Rules, "Suggested ask", "Groups"). Surface: web. Board: erp4f-fund-donors.
6. **14:00. A supplier invoice for the borehole.** Problem: spending restricted money on the wrong thing. Restricted spend is
   refused off the fund's lines, over a line's remainder, or over what came in (FUNDRAISING.md Rules, "Restricted spend").
   Surface: web. Board: erp4f-fund-campaign.
7. **15:30. A grant report is due.** Problem: losing track of funder promises. Grants move through stages (idea, applied, needs
   info, awarded, reporting, closed, or declined) with the next step and date, tranches expected and received, and reports
   promised and submitted (FUNDRAISING.md Data, `grants`, `grant_payments`, `grant_reports`). Surface: web. Board:
   erp4f-fund-grants.
8. **17:00. A pledge is overdue.** Problem: chasing politely. Pledges are paid by gifts naming them; reminders go out at most a
   set number of times, a set gap apart (FUNDRAISING.md Rules, "Pledges"). The campaign shows its projection to the end date,
   drawn as a projection (FUNDRAISING.md Rules, "Campaign projection"). Surface: web. Board: erp4f-fund-overview.

**Built:**
- Donors as a role on a CRM customer, with how they like to be asked, what they give to, and how they want receipts
  (FUNDRAISING.md Data, `donors`).
- Donor groups for today and the suggested ask (FUNDRAISING.md Rules).
- Gifts with their fund, method, channel, anonymous and monthly; refunds with a reason; thank-yous (FUNDRAISING.md Data, `gifts`;
  API).
- A gift tied once to the finance receipt it came by (FUNDRAISING.md API).
- Pledges with part and full payment and limited reminders (FUNDRAISING.md Rules, "Pledges").
- Campaigns with goal, dates, budget lines, raised, promised and spent, and a projection (FUNDRAISING.md Data; Rules). The giving
  page's address, amounts and monthly option are stored on the campaign (FUNDRAISING.md Data, `campaigns`); the page itself is
  pre-launch.
- Grants through their pipeline with payments, reports and conditions (FUNDRAISING.md Data, `grants`).
- Restricted money spent only on its lines within what came in (FUNDRAISING.md Rules).
- Numbered tax receipts per gift or one a year, in the organisation's wording; void and replace (FUNDRAISING.md Rules, "Tax
  receipts").
- The word "Donor" replaces "Customer" where the pack is on (FUNDRAISING.md "The pack").

**Pre-launch:**
- Gifts posted to the ledger with the fund as a finance dimension, and payables checked against budget lines in Finance
  (FUNDRAISING.md "Not yet"; Appendix A).
- Emailing receipts (FUNDRAISING.md "Not yet"; Appendix A).
- A receipt issued and sent as soon as a gift is received (owner, 5 Nov; Appendix A).
- The giving page (FUNDRAISING.md "Not yet", "on the store service with the payment orchestrator"; Appendix A). Payments
  sandbox only until rails are live.
- Soft credits and volunteers (FUNDRAISING.md "Not yet"; Appendix A).

**Pack switches on:** the `fundraising` pack, place kind `charity`; features donors, campaigns, grants, receipts; the word
Customer → Donor; menu "Fundraising": Overview, Donors, Gifts, Campaigns, Grants, Tax receipts; the installer writes nothing
(FUNDRAISING.md "The pack"). Where another pack names Customer differently, the standard word stays until chosen
(INDUSTRY_PACKS.md "Two packs, two words"). Home cards declared, not drawn (INDUSTRY_PACKS.md "Not yet").

**Shares with the core:** CRM customers (FUNDRAISING.md Data, `donors`); Finance receipts (API, the receipt picker); Drive files for
grant reports (Data, `grant_reports`); the ledger and Finance budget checks (pre-launch); the store service and payments for the
giving page (pre-launch).

**Avoid:**
- Naming a tax office, a company registry or a registration body on the receipt (erp4f-fund-receipts shows one); "Rules for your
  country, set in Tax": unclear.
- "Card, transfer or USSD" on the giving page (erp4f-fund-campaign) as live: pre-launch and sandbox only.
- "Payroll giving" (erp4f-fund-campaign): not in the doc. Unclear.
- "Wording from Document designs" (erp4f-fund-receipts): the doc says the wording is a setting. Unclear.
- Tributes and the donor's own page: not yet, not on the list (FUNDRAISING.md "Not yet").
- "Tax-deductible" or any promise about a donor's tax relief.

**Boards:** erp4f-fund-overview, erp4f-fund-receipts, erp4f-fund-donors, erp4f-fund-campaign, erp4f-fund-grants.

---

## industry-property — Property

**Who it is for:** property managers and agents who let units for landlords, and the owners' associations that run
an estate's budget and levies. It covers properties, units and owners, leases, the rent roll and landlords'
statements, inspections and deposits, tenants' requests and owners' levies (PROPERTY.md intro).

**Trade words:** Tenant, lease, rent roll, caution deposit, agency fee, notice, renewal, landlord's statement,
move-in / routine / move-out inspection, deductions, tenant request, contractor, owners' levies, levy budget, common
area, vacant, let, under notice, off the market (Appendix A; PROPERTY.md Data; boards).

**Illustrative business:** Eben Homes, a property manager in Lagos and Abuja with three blocks (Eben Court in Lekki,
Wuse II Apartments, GRA Villas) (boards erp4f-prop-*).

**A day:**
1. **05:17.** *Problem:* rent invoices have to go out ahead of each due date, and leases that have ended still show as
   let. *Clafina:* a daily run invoices rent that falls due within the set number of days. It also ends leases that are
   past their end date with no renewal and marks the unit vacant (PROPERTY.md Rules, "The daily sweep"; Settings
   `rentInvoiceDaysAhead`). *Surface:* web (runs on its own). *Board:* erp4f-prop-rent-roll.
2. **08:30.** *Problem:* who has paid this month, and who is late? *Clafina:* the rent roll shows each tenant's due,
   paid and owing amounts for the month. Late rent is grouped by days late: up to 14, 15–30, 31–60 and over 60
   (PROPERTY.md Rules, "Lateness"; API `rent-roll`). Staff record a payment against a due (commerce-web features.md,
   Property). *Surface:* web. *Board:* erp4f-prop-rent-roll.
3. **09:15.** *Problem:* a two-bed lease ends in 56 days. *Clafina:* the renewal moves through four steps: a reminder,
   an offer with a rent rise and a day to answer by, then either a new lease that follows on or a decline. The new
   lease carries the deposit over and charges no second agency fee (PROPERTY.md Rules, "Renewal").
   *Surface:* web. *Board:* erp4f-prop-leases.
4. **10:00.** *Problem:* a tenant has had no water since the morning. *Clafina:* staff log a tenant request on the unit
   or the common area, with a priority. It moves from new to assigned, in progress and done, and records the
   contractor, the cost and who pays. When it is done, the tenant is invoiced, or the cost comes off the landlord's
   statement, or the owners' budget line pays it (PROPERTY.md Data `tenant_requests`; Rules, "Requests").
   *Surface:* web. *Board:* erp4f-prop-requests.
5. **11:30.** *Problem:* a quote to replace the water pump is far above what the manager may spend alone. *Clafina:*
   a repair over the owner's spending limit waits for the owner's decision before work starts. The limit is set per
   owner or by a default (PROPERTY.md Rules, "Requests"; Settings `ownerApprovalLimit`).
   *Surface:* web. *Board:* erp4f-prop-requests.
6. **14:40.** *Problem:* a tenant is moving out and the deposit must be settled fairly. *Clafina:* the inspection goes
   room by room against the unit's last finished inspection, and anything worse is flagged. Deductions are allowed only
   at a move-out, each with a reason and a photo. The tenant is sent the report and may answer within the set days.
   Clafina then settles the deposit and works out the amount to return, never below nothing (PROPERTY.md Rules,
   "Inspections"; features.md, Property). *Surface:* web. *Board:* erp4f-prop-inspections.
7. **16:00.** *Problem:* an owner of three flats wants her month's statement. *Clafina:* the landlord's statement takes
   rent received for her units in the month, less the management fee and less repairs charged to her, to give the
   payout. When it is issued, the payout is billed to her supplier account. A statement can be viewed for any month
   and issued once (PROPERTY.md Rules, "A landlord's statement"; features.md, Property). *Surface:* web.
   *Board:* erp4f-prop-rent-roll.
8. **17:00.** *Problem:* the estate's owners need their share of the year's running costs. *Clafina:* the levy budget
   is set by lines, and each owner's share is worked out equally, by size or by share. A levy can be raised only once
   the budget is approved, and spending can never pass a line or what the levy has collected (PROPERTY.md Data;
   Rules, "Levies"). *Surface:* web. *Board:* erp4f-prop-levies.

**Built:**
- Properties, owners and units, each unit with a code, kind, bedrooms, floor, size, levy share, asking rent and owner.
  A unit's state is vacant, let, under notice or off the market, with the date it changed (PROPERTY.md Data).
- Leases running from draft to active, notice and ended, or terminated early. Each holds the term, rent by the month,
  quarter or year, caution deposit, agency fee and its invoice, and notice period. Only one lease can be in force on a
  unit at a time (PROPERTY.md Data `leases`).
- Rent as a schedule of dues: a short last period is charged by its days, and notice or an early end waives the dues
  after the new end (PROPERTY.md Rules, "Rent").
- Daily invoicing of upcoming rent, and leases ended automatically when they run out (PROPERTY.md Rules, "The daily
  sweep").
- Rent roll with late rent grouped by days late (PROPERTY.md Rules, "Lateness"; API).
- Renewals: reminder, offer with a rise, accepted into a new lease, or declined (PROPERTY.md Rules, "Renewal").
- Landlords' statements: collected, fee, repairs and payout, with the payout billed to the owner (PROPERTY.md Rules;
  Data `owner_statements`).
- Move-in, routine and move-out inspections, room by room, with photos, deductions, the tenant's reply and the
  deposit settled. Settling has its own permission (PROPERTY.md Rules, "Inspections"; API; features.md).
- Tenant requests with a contractor, a cost, who pays, and the owner's approval above a limit (PROPERTY.md Data;
  Rules, "Requests").
- Owners' association budgets, spending and levies, with each owner's charge invoiced (PROPERTY.md Data; Rules,
  "Levies").
- A unit picker (a property, then a unit, or a common area) used by leases, inspections and requests
  (features.md, Property).
- Settings for deposit periods, agency and management fees, notice, renewal days, rent and levy invoicing, the
  owner's limit and the tenant's reply days (PROPERTY.md Settings).

**Pre-launch:**
- Meter readings and service charges. **pre-launch**
- Tenant and landlord portals. They exist as settings only today (PROPERTY.md Settings; features.md). **pre-launch**
- Listings. Today a vacant unit is not yet a listing (PROPERTY.md Not yet). **pre-launch**
- Not in Appendix A (unclear): receipts from the rent invoices' own payments (staff record them today); the deposit
  and owners' fund in liability accounts and the refund paid; offers and viewings; property portal feeds; commission
  and deals; the landlord's statement in the owner's own currency (naira assumed) (PROPERTY.md Not yet).

**Pack switches on:** the `property` pack, place kind `property`, with features for units, leases, rent,
inspections, requests and levies. It adds a "Property" menu: Properties and units, Leases, Rent roll, Inspections,
Tenant requests, Owners' levies. It declares four Home cards (whether they are drawn yet is unclear; INDUSTRY_PACKS
Not yet). The installer writes nothing (PROPERTY.md, The pack). It can be on for some places and off for others, and
the organisation can use its own words (INDUSTRY_PACKS, The feature resolver).

**Shares with the core:** tenants and owners are customers. An owner can have a supplier account, so payouts are
supplier bills. Rent, levies, agency fees and repairs go on the standard customer invoice. Screens update live
(PROPERTY.md Data; Rules; INDUSTRY_PACKS, "What the packs of 25 October share"; features.md).

**Avoid:**
- Levy notices "by email and WhatsApp with a payment link" and reminders at 7 and 21 days (board
  erp4f-prop-levies). No source describes them, and they name a vendor.
- Request channels "Tenant portal" and "WhatsApp" (board erp4f-prop-requests). The portal is pre-launch, and do not
  name the vendor. The doc only says a request records its channel.
- "Send reminders" on the rent roll: unclear, as no API or rule describes it.
- "Goes on the market" after a move-out: listings are pre-launch. Vacant is built.
- A refund "paid" or a deposit "held in a liability account": not built.
- Amounts in any currency other than naira on landlords' statements.

**Boards:** erp4f-prop-rent-roll, erp4f-prop-leases, erp4f-prop-inspections, erp4f-prop-requests,
erp4f-prop-units, erp4f-prop-levies.

---

## industry-construction — Construction

**Who it is for:** building contractors who bill a client by stages, hold retention, manage variations and pay
subcontractors against certificates. The pack is built on Projects (CONSTRUCTION.md intro; PROJECTS.md lists
construction among the businesses it serves).

**Trade words:** contract, contract sum, stages, variations (VO), valuation, measure, certify, retention, practical
completion, defects period, site diary, hours lost, snags, subcontractor, subcontract, papers (tax clearance,
insurance, safety card), payment certificate, back-charges, withholding tax (Appendix A; CONSTRUCTION.md Data and
Settings).

**Illustrative business:** a Lagos contractor building Ikoyi Court for a developer on an ₦850m contract, project
PRJ-2026-0033 (boards erp4f-con-*). The contractor's own name does not appear on the boards.

**A day:**
1. **08:00.** *Problem:* the finishes in unit 2A are full of small faults, each belonging to a different trade.
   *Clafina:* each snag on the snag list records the floor, unit, place, trade and subcontractor. A snag moves from
   open to fixed to closed, or is reopened, with photos before and after. A plan view shows snags unit by unit
   (CONSTRUCTION.md Data `snags`; API `snags/plan`). *Surface:* web. *Board:* erp4f-con-snags.
2. **10:00.** *Problem:* it is month end, and the client owes for the work done since the last valuation.
   *Clafina:* a new valuation is opened, and the site engineer measures each stage's percent to date. A percent can
   never go below what the client has already certified, nor above 100 (CONSTRUCTION.md Rules, "A line", "Steps").
   *Surface:* web. *Board:* erp4f-con-billing.
3. **11:00.** *Problem:* the client has asked for an extra column on floor 3. *Clafina:* a variation is raised on its
   stage and moves from proposed to priced, agreed and instructed, or rejected. It is valued with its stage once its
   state is billable (by setting, agreed and instructed). Its amount is fixed once part of it is certified
   (CONSTRUCTION.md Data `variations`; Rules, "Variations"; Settings). *Surface:* web. *Board:* erp4f-con-billing.
4. **13:00.** *Problem:* the valuation needs the surveyor and the project manager before anything is billed.
   *Clafina:* the valuation moves through measure, value, approve and certify. Only the person holding the current step
   can change a line, and the screen shows who it is waiting for. On certifying, Clafina holds retention, moves the
   contract's net certified total, and makes the customer invoice for the net amount. VAT and withholding tax show on
   the certificate. Nothing is invoiced before certifying (CONSTRUCTION.md Rules, "A valuation", "Certifying";
   features.md, Construction). *Surface:* web. *Board:* erp4f-con-billing.
5. **14:30.** *Problem:* the plumbing subcontractor wants paying, but their tax clearance has expired.
   *Clafina:* a missing or expired required paper blocks the payment certificate, and papers that expire soon are
   flagged. A person with the exception permission can let one certificate through with a reason, which is logged.
   An approved certificate takes off retention and back-charges and makes a draft supplier bill in Payables
   (CONSTRUCTION.md Rules, "Papers", "A payment certificate"). *Surface:* web. *Board:* erp4f-con-subs.
6. **15:30.** *Problem:* an electrical conduit clashes at grid D and needs the engineer's answer. *Clafina:* the
   query is raised as an RFI against the drawings (Appendix A, "drawings and RFIs"). **pre-launch**
   *Surface:* web. *Board:* erp4f-con-diary (shows the open RFI).
7. **17:42.** *Problem:* the day's record has to be written while it is fresh. *Clafina:* the site engineer writes one
   diary entry for the day. It records the weather, people on site (own staff and subcontractors), hours lost and why,
   equipment, safety and incidents, work done, delays, instructions and photos. An entry can never be made for a day
   to come, and it can be changed until it is submitted (CONSTRUCTION.md Data `site_diary_entries`; Rules,
   "Site diary"). *Surface:* web. *Board:* erp4f-con-diary.
8. **18:15.** *Problem:* the project manager must stand behind the record. *Clafina:* the manager signs the entry off,
   which locks it, or returns it with a note. Hours lost are added up for the month (CONSTRUCTION.md Rules, "Site
   diary"; features.md). *Surface:* web. *Board:* erp4f-con-diary.

**Built:**
- One contract per Projects project, holding the client, contract sum, retention percent, VAT and WHT rates, defects
  period, the programme's percent, completion and the end of the defects period. Making a contract without a project
  makes one (CONSTRUCTION.md Data `contracts`; features.md).
- The contract sum split into stages, optionally tied to project milestones (CONSTRUCTION.md Data `stages`).
- Variations from proposed to instructed or rejected (CONSTRUCTION.md Data; Rules).
- Valuations in four steps (measure, value, approve, certify), with one open at a time, each step under its own
  permission. Each line keeps the engineer's and the surveyor's percents (CONSTRUCTION.md Data `valuations`; Rules,
  "Steps").
- The valuation sum: work to date less retention, less what was certified before, then VAT and WHT. No VAT or WHT on
  a valuation that gives money back (CONSTRUCTION.md Rules, "A valuation").
- The customer invoice made only on certifying (CONSTRUCTION.md Rules, "Certifying").
- Retention released in part at practical completion and the rest after the defects period, each part invoiced
  (CONSTRUCTION.md Rules, "Retention"; Settings).
- Site diary, locked once signed off (CONSTRUCTION.md Data; Rules; features.md).
- Snag list by floor, unit, trade and subcontractor, with photos and a plan view (CONSTRUCTION.md Data; API).
- Subcontracts with sums, retention and tax rates, and papers that expire. A renewal is a new paper (CONSTRUCTION.md
  Data `subcontracts`).
- Payment certificates blocked by missing or expired papers, with a logged exception, and a draft supplier bill on
  approval (CONSTRUCTION.md Rules, "Papers", "A payment certificate").
- Settings for retention, the completion release, defects months, VAT and WHT defaults, billable variations, required
  papers and the warning days (CONSTRUCTION.md Settings).
- Every screen works on one contract, chosen once in the contract bar (features.md, Construction).

**Pre-launch:**
- Gantt, including hours lost feeding the programme (CONSTRUCTION.md Not yet). **pre-launch**
- Subcontractor portal: a subcontractor's own view of their snags (CONSTRUCTION.md Not yet). **pre-launch**
- Drawings and RFIs (CONSTRUCTION.md Not yet). **pre-launch**
- Final account (CONSTRUCTION.md Not yet). **pre-launch**
- Not in Appendix A (unclear): retention and released parts posted to a liability account (the invoice carries the
  net today); VAT and WHT rates from the tax engine (the contract's own rates today, defaulted from settings); the
  client's own certification screen; a handover pack (CONSTRUCTION.md Not yet).

**Pack switches on:** the `construction` pack, place kind `site` (Construction site), with features for billing,
diary, snags and subcontracts. It adds a "Construction" menu: Progress billing, Site diary, Snag list,
Subcontractors. It declares four Home cards (whether they are drawn yet is unclear). The installer writes nothing
(CONSTRUCTION.md, The pack). It can be on per place, with the organisation's own words (INDUSTRY_PACKS).

**Shares with the core:** the Projects project and its milestones. Customer invoices for valuations and retention.
Draft supplier bills in Payables. Subcontractors are suppliers. Photos are kept as Drive files. Screens update live
(CONSTRUCTION.md intro; Data; Rules; INDUSTRY_PACKS, "What the packs of 25 October share"). Projects also brings
tasks, timesheets, materials from stock and profitability (PROJECTS.md steps 2–4 and "Stock to a project"). How far the construction screens draw on these is unclear.

**Avoid:**
- "Client certifies" as something the client does in Clafina (board erp4f-con-billing step 4). The client's
  certification screen is not built. The certify step is done by a user with that permission.
- "The subcontractor sees only their own" (board erp4f-con-snags). That is the portal, which is pre-launch.
- Retention "held in a liability account" or VAT and WHT "from the tax engine": not built. Do not name a tax
  authority.
- Treating the 7.5% VAT and 5% WHT defaults as advice. They are editable settings.
- Handover packs.

**Boards:** erp4f-con-billing, erp4f-con-diary, erp4f-con-subs, erp4f-con-snags.

---

## industry-field-service — Field service

**Who it is for:** installers, repairers, cleaners and pest control firms that send technicians to customers' sites
(FIELD_SERVICE.md intro). The boards show a solar, air conditioning and electrical service firm.

**Trade words:** Job, dispatch, technician, van, checklist, service area, window, en route, on site, follow-up job,
parts used, customer signature, call-out (Appendix A; FIELD_SERVICE.md Data; boards). The pack renames Task to Job
(FIELD_SERVICE.md, The pack).

**Illustrative business:** a Lagos service firm with technicians in vans covering air conditioning, solar and
electrical work, on Monday 19 October (boards erp4f-fs-*). The phone board's header reads "Eben Distribution Ltd ·
Ikeja warehouse", which does not match. Use a field service name on the page.

**A day:**
1. **07:00.** *Problem:* the day's jobs need sharing out across the technicians. *Clafina:* the dispatch board shows
   jobs by technician and hour, with a list of jobs waiting for someone. Assigning a job sets the technician and the
   van. If two live jobs for the same technician would overlap, the board refuses and names the other job
   (FIELD_SERVICE.md Rules, `dispatch.logic.ts`; API `dispatch`, `assign`). *Surface:* web. *Board:* erp4f-fs-dispatch.
2. **07:45.** *Problem:* an urgent call comes in: an inverter fault and no power at night. *Clafina:* a new job is a
   project task with a service side: customer, site, time window, priority and the checklist for its job type. Service
   areas set where each place's technicians go (FIELD_SERVICE.md intro; Data `jobs`, `service_areas`).
   *Surface:* web. *Board:* erp4f-fs-dispatch.
3. **09:30.** *Problem:* a job's window has opened and nobody has arrived. *Clafina:* a job counts as late once the set
   number of minutes has passed since its window opened (30 by default) and nobody is on site. Each technician's last
   known position is shown, and a late offline report never moves the pin backwards (FIELD_SERVICE.md Rules; Settings
   `lateAfterMinutes`; Data `technician_locations`). *Surface:* web. *Board:* erp4f-fs-dispatch.
4. **11:00.** *Problem:* the technician arrives and needs to know what to do first. *Clafina:* the technician marks the
   job en route, then on site. The phone shows the next required step not yet done. The job keeps the checklist
   version it started with, even if the template changes later (FIELD_SERVICE.md Rules, `checklist.logic.ts`; Data).
   The offline phone store, for a site with no signal, is **pre-launch** (Appendix A). *Surface:* phone.
   *Board:* erp4f-phone-fs-job.
5. **11:40.** *Problem:* the battery bank reads low, which needs a return visit. *Clafina:* a checklist step can take
   a tick, number, photo, text or part. A number outside its limits raises the step's follow-up job when the job is
   finished, and a follow-up is raised only once (FIELD_SERVICE.md Data `checklist_template_versions`, `jobs`; Rules).
   *Surface:* phone. *Board:* erp4f-fs-checklists.
6. **12:15.** *Problem:* a fuse has blown and the technician uses one from the van. *Clafina:* a part step issues the
   part from the van's stock, because a van is a stock location. If the van shows none, the part is still recorded as
   used with the reason, and the van is reconciled at the end of the day (FIELD_SERVICE.md intro; Rules; API `vans`).
   *Surface:* phone. *Board:* erp4f-fs-job.
7. **12:50.** *Problem:* the work is done and the customer should sign and be billed before the technician leaves.
   *Clafina:* a job can be finished only when every required step is answered, the customer has signed (when the
   version asks), and there is a payment reference or invoice lines. The invoice on site is the standard customer
   invoice. Time on site is logged as a timesheet entry (FIELD_SERVICE.md intro; Rules; Settings
   `signatureByDefault`, `logTimeOnFinish`). *Surface:* phone. *Board:* erp4f-fs-job.
8. **16:30.** *Problem:* tomorrow's jobs need planning around traffic and the right skills, and customers want to
   know when to expect someone. *Clafina:* route optimisation, technicians' skills, and telling the customer the
   arrival window (Appendix A). **pre-launch** *Surface:* web. *Board:* erp4f-fs-dispatch.

**Built:**
- Jobs as project tasks with a service side, with no separate job table. Moving a job's status moves the task too
  (FIELD_SERVICE.md intro).
- Job status runs waiting, assigned, en route, on site, then done or cancelled (FIELD_SERVICE.md Data `jobs`).
- Dispatch by technician and hour, which refuses overlapping jobs and works out lateness (FIELD_SERVICE.md Rules;
  API).
- Versioned checklists. Steps take a tick, number, photo, text or part, can be required, and can have limits and a
  follow-up (FIELD_SERVICE.md Data; Rules).
- Follow-up jobs raised by a reading outside its limits (FIELD_SERVICE.md Rules).
- Parts issued from the van's stock, with the reason kept when the issue fails (FIELD_SERVICE.md Rules; API `vans`).
- Photos per step and the customer's signature, kept as Drive files (FIELD_SERVICE.md Data).
- Finishing with a payment reference or an invoice on site (FIELD_SERVICE.md Rules; Settings).
- Time on site logged to timesheets (FIELD_SERVICE.md intro; Settings).
- Technicians' last positions on a map (FIELD_SERVICE.md Data; ROADMAP item 2, "technicians on the map").
- Service areas (FIELD_SERVICE.md Data).
- A jobs list filtered by status, technician and day, with counts by status (FIELD_SERVICE.md API; History).
- Live updates, so the technician's app and the board see each change (FIELD_SERVICE.md Rules).
- The phone API takes the true times of a photo, signature, finish and position, so a later sync keeps them
  (FIELD_SERVICE.md Not yet).

**Pre-launch:**
- Route optimisation and the map's routes. Positions are kept today (FIELD_SERVICE.md Not yet). **pre-launch**
- Skills, together with the technicians list (FIELD_SERVICE.md Not yet). **pre-launch**
- Telling the customer the arrival window (FIELD_SERVICE.md Not yet). **pre-launch**
- The offline store on the phone (FIELD_SERVICE.md Not yet). **pre-launch**
- Not in Appendix A (unclear): job templates by job type beyond a checklist; support tickets raising jobs
  (FIELD_SERVICE.md Not yet).

**Pack switches on:** the `field_service` pack, place kind `service_depot`, with features for dispatch, jobs,
checklists and technicians. Task is renamed Job. It adds a "Field service" menu: Dispatch and Jobs for every day, and
Checklists and Service areas for setting up. It declares six Home cards (whether they are drawn yet is unclear). The
installer writes nothing (FIELD_SERVICE.md, The pack). Places become vans by kind (FIELD_SERVICE.md API `vans`).

**Shares with the core:** Projects tasks and their rules, timesheets, project stock issued from the van (vans are
stock locations), the standard customer invoice, Drive files, the staff directory and live updates
(FIELD_SERVICE.md intro; features.md, "Pickers and files"; INDUSTRY_PACKS).

**Avoid:**
- "Send and take payment" as live card or transfer collection (board erp4f-fs-job). Payments are sandbox only.
  Say the invoice is made on site and the payment is recorded.
- "Message the customer" (board erp4f-fs-job): the channel is unclear, so name no vendor.
- "Photos kept for 7 years" (board erp4f-fs-checklists): no source.
- A technician shown "on annual leave" on dispatch: unclear whether dispatch reads HR leave.
- "Customer history" and a "Solar care plan" contract on the job: unclear.
- Routes drawn on a map, or optimised, as built today: pre-launch.

**Boards:** erp4f-fs-dispatch, erp4f-fs-job, erp4f-phone-fs-job, erp4f-fs-checklists.

---

## industry-rentals — Rentals

**Who it is for:** equipment, party, car and tool hire businesses (RENTALS.md intro).

**Trade words:** Item, unit, tag, agreement, hand-out, return, returns due, deposit, late fee, grace period, damage,
condition, extend, settle (Appendix A; RENTALS.md Data; boards). The pack renames Product to Item (RENTALS.md,
The pack).

**Illustrative business:** Eben Hire in Ikeja, hiring out generators, concrete mixers, scaffolding, compactors,
drills, pumps and a marquee, on Monday 19 October (boards erp4f-rent-*).

**A day:**
1. **08:00.** *Problem:* a caller wants to know if a 7.5 kVA generator is free for three days, and what it costs.
   *Clafina:* availability is counted by units, not items, and the availability check shows how many are free for
   those dates. The quote is periods × rate × units, and a part period counts as a whole one (RENTALS.md Data
   `units`; Rules; API `availability`, `quote`). *Surface:* web. *Board:* erp4f-rent-items.
2. **08:30.** *Problem:* the generator must not be promised to two customers. *Clafina:* the agreement reserves
   specific units for a period, with the deposit due and who brings it back (the customer, or our collector). A unit
   can never be held twice at the same time. A unit handed out and not returned stays held past its due time
   (RENTALS.md Data `agreements`). *Surface:* web. *Board:* erp4f-rent-items.
3. **09:10.** *Problem:* a mixer and a compactor go out, and any dispute later needs proof of their condition.
   *Clafina:* hand-out needs every unit's tag scanned, the customer's signature on the condition notes and photos, and
   the deposit first when the setting asks (RENTALS.md Rules; Data `conditions`; Settings `depositBeforeHandOut`).
   *Surface:* web (the device used to scan is unclear). *Board:* erp4f-rent-agreement.
4. **10:00.** *Problem:* two items are overdue. *Clafina:* returns due lists what should come back, in order. A late
   fee starts after the grace minutes at the item's late rate. Until the item is back it shows as a projection of the
   fee so far, and it is charged on return (RENTALS.md Rules; API `returns-due`; Settings `graceMinutes`).
   *Surface:* web. *Board:* erp4f-rent-returns.
5. **11:25.** *Problem:* the mixer comes back with a dent in the drum. *Clafina:* the return records the condition
   against the hand-out. A damaged unit gets a proposed damage line and leaves the calendar until it is mended
   (RENTALS.md Rules). *Surface:* web. *Board:* erp4f-rent-agreement.
6. **11:40.** *Problem:* the customer disagrees about the damage. *Clafina:* staff confirm or waive the proposed damage
   charge, and the customer's comment is kept on the file (RENTALS.md Data `charges`; API `decide`, `comment`).
   *Surface:* web. *Board:* erp4f-rent-agreement.
7. **12:00.** *Problem:* the hire must be closed and the deposit balanced. *Clafina:* settling needs every damage line
   decided. Rent, late fees and confirmed damage go on one customer invoice. The deposit pays the charges first, and
   the rest is recorded as refunded to the original payment route. The deposit is kept as the customer's money, never
   income (RENTALS.md Rules; Data `deposit_movements`). *Surface:* web. *Board:* erp4f-rent-agreement.
8. **17:00.** *Problem:* a site wants the scaffolding for another two weeks. *Clafina:* the agreement is extended
   (RENTALS.md API `extend`). Week and month discounts on longer hires are **pre-launch** (Appendix A).
   *Surface:* web. *Board:* erp4f-rent-returns.

**Built:**
- Items with a rate per day or hour, their own late rate (otherwise a share of the rate), a deposit, currency and tax
  (RENTALS.md Data `items`).
- Units with tag codes (QR), usually linked to an asset in the register. A unit is available, being mended or
  retired (RENTALS.md Data `units`).
- Availability by unit, and quotes (RENTALS.md API; Rules).
- Agreements that never double-hold a unit (RENTALS.md Data; ROADMAP item 4).
- Hand-out by tag scan, with photographed and signed condition and the deposit held (RENTALS.md Rules; ROADMAP item 4).
- Returns with condition compared, proposed damage, and the unit taken off the calendar until mended (RENTALS.md
  Rules).
- Late fees after a grace period, shown as a projection until the item is back (RENTALS.md Rules; Settings).
- Charges: rent, late fee, damage and other, with damage confirmed or waived by staff (RENTALS.md Data `charges`).
- Deposit movements: held, taken off for charges, refunded (RENTALS.md Data).
- Settling on the standard customer invoice (RENTALS.md Rules).
- Extend and cancel an agreement (RENTALS.md API).
- Returns due (RENTALS.md API; ROADMAP item 4).

**Pre-launch:**
- Week and month discounts (RENTALS.md Not yet). **pre-launch**
- Insurance (RENTALS.md Not yet). **pre-launch**
- The customer's booking page (RENTALS.md Not yet). **pre-launch**
- Not in Appendix A (unclear): posting the deposit to a liability account; opening an asset maintenance job from
  damage (raised in Assets by hand today); driver pickup through delivery (RENTALS.md Not yet).

**Pack switches on:** the `rentals` pack, place kind `rental_yard`, with features for items, agreements and returns.
Product is renamed Item. It adds a "Rentals" menu: Items, Agreements, Returns due. It declares six Home cards
(whether they are drawn yet is unclear). The installer writes nothing (RENTALS.md, The pack).

**Shares with the core:** the asset register (each unit is usually an asset), customers, the standard customer
invoice, Drive files for condition photos, and live updates (RENTALS.md Data; Rules; INDUSTRY_PACKS). Damaged units
are mended through Assets, with the job raised by hand (RENTALS.md Not yet).

**Avoid:**
- "Held on hand-out, in a liability account" (board erp4f-rent-agreement): not built.
- "Goes back by bank transfer" (board erp4f-rent-agreement): the refund is recorded to the original payment route,
  and payments are sandbox only. Name no bank.
- "Plan the pickup run" and booked driver pickups (board erp4f-rent-returns). Driver pickup through delivery is not
  built. The agreement does record who brings the item back.
- "Our crew takes it down": no source.
- An asset repair job opened automatically from damage: not built.
- The board's "a day is 24 hours from hand-out" (erp4f-rent-items) as a stated rule. The doc says only that a part
  period counts as a whole one.

**Boards:** erp4f-rent-agreement, erp4f-rent-items, erp4f-rent-returns.

---

## industry-distribution — Distribution

**Who it is for:** distributors and wholesalers who deliver by van on fixed routes, especially drinks and
other goods sold in returnable crates, bottles and kegs; depots that also sell to trade customers at the
counter and online; warehouses that store, receive and send goods for other businesses (3PL)
(DISTRIBUTION.md intro; STOREFRONT_STUDIO.md §13).

**Trade words:** Routes and van loads, Load sheet, Stops, Settle a van, Empties and deposits, Empties limit,
Oldest crate, Returnable items, Driver's differences, Storage billing, Rate card, Pallet place, Cold room,
Receiving, Sending, Trade price, Account price, On account, Quick order.

**A day** (illustrative: a drinks distributor with six vans out of its Ikeja warehouse, Lagos):

| Time | Problem | How Clafina handles it | Surface | Best board |
|---|---|---|---|---|
| 06:10 | Each van must leave with the right stock for today's route. | A van load (`VLD-…`) puts one van on one route for the day; its stops are the route's customers for that weekday, in order; the load sheet lists what was loaded and its value (DISTRIBUTION.md "Data", "Rules: A van's day"). Each van is a moving location with its own stock (ROADMAP §13 item 8). | web | erp4f-dist-routes |
| 11:40 | The driver sells at the stop and must not sell what he does not have. | Sales at a stop never exceed what is left on the van; payments never exceed what was sold at that stop; a failed stop keeps the goods on the van (DISTRIBUTION.md "Rules: A van's day"). Sales, payments and empties come in as the phone syncs (ROADMAP §13 item 8). | phone | erp4f-dist-routes |
| 12:15 | A bar is already holding more crates than it should. | The delivery is held when it would leave the customer over their empties limit after the empties handed back at that stop, with what would bring it within; the driver can still deliver if enough empties come back (DISTRIBUTION.md "Rules: The empties limit"; setting `holdOverLimit`). | phone | erp4f-dist-empties |
| 13:00 | The office needs to know who holds crates and for how long. | Each customer's crates out, deposit held and oldest crate are read from an append-only empties ledger, first in first out; lists by state: over limit, not returned in 60 days (a setting), balanced (DISTRIBUTION.md "Data", "Rules: What a customer holds", "Settings"). | web | erp4f-dist-empties |
| 14:00 | A shop owner orders online on account, with his own prices. | The trade portal shows the company's contract and tier prices, limits the catalogue to the contract, checks credit at checkout, asks for a PO number and sends large orders to the company's own approver; quick order, saved lists and reorder (STOREFRONT_STUDIO.md §13). | shop | studio-wholesale-desktop |
| 15:00 | A trade customer buys at the depot counter on credit. | The till sells on account, with supervisor limits for discounts (POINT_OF_SALE.md; product-facts product-pos). Selling in cartons and single units at the till: **pre-launch** (owner, added to Appendix A Retail). Trade prices at the till: unclear. | till | till-trade-sell |
| 16:15 | The van is back; cash, stock and empties must agree with what was sold. | Settling sets payments sold against counted by method, stock (loaded less sold) against counted by line, and empties expected against counted; a cash shortfall within the tolerance clears, every other difference goes to the driver's account, where a manager clears it, charges the driver or writes it off (DISTRIBUTION.md "Rules: Settling"; "Data: driver_differences"). | web | erp4f-dist-settlement |
| Month end | Storage clients must be billed for the month. | Pallet places by the month's average or peak × days × rate, cold room the same, receiving per pallet, sending per case, services, insurance as a share of declared value, topped up to the minimum; one invoice per client; making the invoices fixes the month (DISTRIBUTION.md "Rules: 3PL month"). | web | erp4f-dist-3pl |

**Built:**
- Routes from a warehouse, with customers by weekday and their place in the order (DISTRIBUTION.md "Data").
- Vans with registration, stock location, asset and driver; available, in the workshop, retired (DISTRIBUTION.md "Data").
- Van loads: loading, out, back, settled; load value, sold value, empties expected (DISTRIBUTION.md "Data").
- A van's day: stops in order, sales capped by what is on the van, payments capped by what was sold, a failed stop keeps the goods (DISTRIBUTION.md "Rules").
- Returnable items (crates, bottles, kegs) with a deposit price (DISTRIBUTION.md "Data").
- Customers on the distribution list with area, account, terms, empties limit and route codes (DISTRIBUTION.md "Data").
- An append-only empties ledger: out with full crates, back, by delivery, collection, settlement or adjustment (DISTRIBUTION.md "Data").
- What a customer holds, the deposit that moves with it, and the oldest crate first in first out (DISTRIBUTION.md "Rules").
- The empties limit holds a delivery unless enough empties come back at the stop (DISTRIBUTION.md "Rules").
- Settling a van against what is counted: cash within a tolerance clears; the rest to the driver's account for a manager (DISTRIBUTION.md "Rules").
- 3PL storage billing: rate cards (one default per warehouse), clients with their own card, average or peak, insurance or their own cover, daily counts, receiving, sending and services, invoiced per client per month (DISTRIBUTION.md "Data", "Rules").
- Van loads and customers' empties update live on screen (DISTRIBUTION.md "API"; commerce-web docs/features.md "Industry packs: configurator, courses, fundraising, distribution").
- Screens: day board and van load sheets, settling a van, empties and deposits with "the next delivery is held", storage billing with its workings (commerce-web docs/features.md, same section).
- Trade portal for business buyers: account prices, contract catalogues, credit and payment terms, purchase orders and approvals, quotes, returns (STOREFRONT_STUDIO.md §13).
- Wholesale prices from the price book by customer group, with quantity breaks (SALES.md "Sales pricing").

**Pre-launch:**
- Route planning by map (DISTRIBUTION.md "Not yet"; Appendix A).
- Proof of delivery (DISTRIBUTION.md "Not yet"; Appendix A).
- The 3PL clients' own view of their stock (DISTRIBUTION.md "Not yet"; Appendix A).
- Excise (DISTRIBUTION.md "Not yet"; Appendix A).
- At the till: selling in several units: cartons, packs, singles (owner, added to Appendix A Retail).

**Not in Appendix A (keep off the site):**
- Empties as stock in their own inventory type, and deposits posted to a liability account (DISTRIBUTION.md "Not yet").
- At settling, counted van stock moved back into the warehouse and cash to the till (DISTRIBUTION.md "Not yet").
- Correcting a customer's empties ledger from an empties shortfall (DISTRIBUTION.md "Not yet").
- Expiry and batches in the pack (DISTRIBUTION.md "Not yet").
- Serial and batch capture at the till (Appendix A lists it for Retail only, not for distribution).

**Pack switches on:** the `distribution` pack, kind `warehouse` (DISTRIBUTION.md "The pack"):
- Features: routes, empties, storage.
- A "Distribution" menu: Routes and van loads, Settle a van, Empties and deposits, Storage billing.
- Home cards (declared; whether they are drawn is unclear: INDUSTRY_PACKS.md "Not yet").
- Starting settings: hold a delivery over the limit (on), old empties after 60 days, a cash tolerance,
  storage invoices submitted and due in 14 days (DISTRIBUTION.md "Settings").
- The installer writes no records (DISTRIBUTION.md "The pack").

**Shares with the core:** stock (each van is a stock location), assets (each van is an asset), customers,
sales invoices (storage is invoiced on the ERP's own customer invoice through `PackInvoicer`), payments,
price books, the trade portal and the till (DISTRIBUTION.md "Data", "Rules"; INDUSTRY_PACKS.md "The packs";
STOREFRONT_STUDIO.md §13).

**Avoid:**
- Saying a van sale makes an invoice at the stop. The boards show it; DISTRIBUTION.md does not say: unclear.
- "Send a statement" and "Statement run" from the empties board: no source describes them.
- Saying deposits sit in a liability account, that settling returns stock to the warehouse and cash to the till, or that it corrects customers' empties ledgers (all three are on erp4f-dist-empties and erp4f-dist-settlement; none is built or in Appendix A).
- Serial scanning at the till (shown on till-trade-sell): not in Appendix A for distribution.
- "Route optimisation", or naming any map provider.
- Naming card terminals, banks or mobile money; van payments run in sandbox.
- Naming an excise or tax authority.
- Trade prices at the till as built: unclear.
- Board sample names that may match real firms (for example "Zenith Beverages Ltd", "Samsung Galaxy").

**Boards:** erp4f-dist-routes, erp4f-dist-settlement, erp4f-dist-empties, erp4f-dist-3pl,
studio-wholesale-desktop, till-trade-sell (it shows cartons, which are pre-launch, and serials, which must be taken off).

---

## industry-farm — Farm

**Who it is for:** farms that grow crops, keep poultry, fish or livestock, or buy from outgrowers, in any mix,
across one or several farms; schemes that run outgrowers; cooperatives that sell together (FARM.md intro,
Phase 1 "place-kinds", Phase 7).

**Trade words:** Fields, Seasons, Crop plans, Plan against actual, Soil tests, Tasks and work, Piece work,
Scouting, Inputs applied, Waiting period (withholding), Batches, Daily record, Withdrawal, Vaccinations,
Harvest and lots, Release to sale, Trace, Recall, Outgrowers, Advances, Collection points, Payment run,
Cooperatives, Pooled sale.

**A day** (illustrative: a maize farm near Zaria, Kaduna, with a poultry site at Ogbomosho):

| Time | Problem | How Clafina handles it | Surface | Best board |
|---|---|---|---|---|
| 06:00 | The manager needs to know what cannot wait today. | The farm home shows land in season, cost a hectare against budget, the expected harvest as a dated projection, eggs today, and typed attention items, each with its next step (FARM.md Phase 2 "GET home, GET attention"; Phase 4 "Attention"). A weak patch seen in satellite imagery becomes one open scouting suggestion, never a task (FARM.md Phase 7 "Providers"). | web, phone | erp4e-farm-home |
| 08:20 | A scout finds fall armyworm on a field. | The report carries place, severity and photos; a check shows the weather on the day, the waiting period against the planned harvest, store stock and cost, then assigning makes a calendar task (FARM.md Phase 3 "scouting"; "Gaps closed: Scouting photos through Drive"). | phone | erp4e-scouting |
| 09:00 | A spray is planned for the day rain is forecast. | The calendar marks every spray that meets rain, with the rule and the nearest dry day; moving the task says the rain before and after (FARM.md Phase 2 "calendar", "tasks/:id/move"; setting: no spraying within 12 hours before rain by default, `FARM_WORK.sprayBeforeRainHours`; Decisions 13). | web | erp4e-farm-calendar |
| 10:00 | A field is due for harvest but was sprayed ten days ago. | The application set a waiting period from the product's profile; harvesting inside it warns, or is refused when the setting is "block" (FARM.md Phase 3 "POST applications"; Phase 5 "POST/GET harvests"). | web | erp4e-harvest |
| 12:00 | A broiler house lost more birds than usual. | One daily record a day: deaths need a cause, feed is issued from the store at that day's cost; mortality over the limit raises attention; feed conversion, average weight and cost a kilo are on the batch (FARM.md Phase 4). | phone | erp4e-batch-broiler |
| 15:00 | A harvest gang is paid by the bag. | Piece work needs a unit, a rate and units; sign-off posts the labour to the season once and makes the payroll lines once (FARM.md Phase 2 "tasks/:id/work", "sign-off", "payroll-inputs"). | web | erp4e-tasks |
| 16:00 | Outgrowers bring maize; they must be paid net of the inputs advanced. | A receipt values the scale reading under the contract, rejects it above the moisture limit, and gives the grower a receipt; a payment run takes produce less open advances, oldest first, and approving it makes one draft supplier bill per ready grower (FARM.md Phase 7 "receipts", "payment-runs"). The grower sees a statement on a private link (FARM.md "Gaps closed: The grower's statement on a private link"). | web | erp4e-payment-run |
| 17:30 | A buyer asks where a lot of maize came from. | The lot traces back (field, season, inputs, slips, storage) and forward (sales, buyers, stock left); a recall preview shows who it reaches and holds the stock left; issuing it emails each buyer (FARM.md Phase 5 "trace", "recall"). | web | erp4e-lot-trace |

**Built:**
- Farms and what each farms (crops, poultry, fish, livestock, outgrowers, any mix), deciding the pages shown (FARM.md Phase 1).
- Fields with boundaries drawn, imported or walked, area measured; overlaps and self-crossing caught; soil tests read against aims and last year (FARM.md Phase 1).
- Fields map coloured by crop, stage, problem or vigour, each colour with words beside it (FARM.md Phase 1; Phase 7).
- Versioned crop plans with cost a hectare on seven lines and margin; seasons started from a plan with a budget and plan against actual, every figure with its source (FARM.md Phase 1).
- Rotation advice that warns and never blocks (FARM.md Phase 1).
- A season short of inputs makes one draft purchase request; nothing reserved (FARM.md "Gaps closed: Request the inputs a season is short of").
- Tasks from the plan, moving with the planting day; pay by day, hour or piece; sign-off feeds the season and payroll once (FARM.md Phase 2).
- The calendar by field or team with each day's weather and the spray-before-rain rule (FARM.md Phase 2).
- Inputs issued from the farm store at stock cost and charged to the season; the waiting period; a weather copy kept; "Needs a look" for missing kit, untrained applicator, off-label rate or crop (FARM.md Phase 3).
- The applications register and an export for auditors (FARM.md Phase 3).
- Scouting reports with photos, on the map, with suggested treatments (FARM.md Phase 3; "Gaps closed").
- Batches of broilers, layers, fish and livestock placed against a goods receipt; daily records; feed conversion, mortality, weight, laying rate, cost a kilo or an egg (FARM.md Phase 4).
- Eggs graded and crated in thirties into stock; cracked eggs and eggs in a withdrawal period kept from sale (FARM.md Phase 4).
- Vaccination schedules by breed; a medicine's withdrawal blocks the sale of the batch or animal (FARM.md Phase 4 "Sales are refused in withdrawal").
- Animals by tag with parents, offspring, weights, health and breeding (FARM.md Phase 4).
- Harvest loads into lots by day and grade, received into stock; drying loss; release to sale refused above the release moisture; storage checks against limits (FARM.md Phase 5).
- Lot trace both ways, recalls, grade prices, and a public trace page that drops a revoked lot (FARM.md Phase 5).
- Costs reach a season or batch where they happen, each once: labour, inputs, chicks, feed, medicine, machinery, land and overheads by a nightly accrual (FARM.md Phase 6).
- Profit by field, crop, season, hectare or farm, with forecast rows marked as projections; export; closing a season freezes its valuation (FARM.md Phase 6).
- Outgrowers with contracts, fields, input advances (no interest; over the limit waits for approval), collection points, receipts, payment runs, statements (FARM.md Phase 7; "Gaps closed").
- Cooperatives: members and pooled sales shared by delivered kilos less inputs owed, with the arithmetic (FARM.md Phase 7).
- Weather and satellite readings from a provider connected in settings, with a connection test; provider keys never reach the browser (FARM.md Phase 1 "providers", "map-tiles"; Phase 2 "Weather"; Phase 7 "Providers").
- Each person sees only the farms they are attached to (FARM.md "Shape").
- Work records, harvest loads, applications and receipts keep one client id, so a retry after a lost reply records once (FARM.md Phases 2, 3, 5, 7; commerce-web docs/features.md "Farm pack: Retries").

**Pre-launch:**
- A sales line naming a lot, and the lot printed on the invoice and waybill (FARM.md Phase 5 "Not here"; Appendix A).
- Tagging the ledger's journal lines with the season (FARM.md Phase 6 "Not here"; Appendix A).
- More map, weather and satellite providers (FARM.md Phase 1, Phase 7 "planned"; Appendix A). Name none.

**Not in Appendix A (keep off the site):**
- A release waiting for approval told to the lot when approved (FARM.md Phase 5 "Not here").

**Pack switches on:** the `farm` pack, kind `farm`, switched on per place (FARM.md "Shape"; Decisions 1). It
brings:
- The farm pages for what each place farms (FARM.md Phase 1 "place-kinds").
- Default task types, installed once (FARM.md Phase 2).
- Vaccination schedules for broilers and layers (FARM.md Phase 4).
- Farm settings for fields, work, inputs, batches, harvest, trace, costs and outgrowers, each shown against the pack standard with "Changed" (FARM.md Phase 1 "settings"; each phase's "Settings").
- The farm's words for menus and screens: unclear (FARM.md does not list them).

**Shares with the core:** stock and the farm store (inputs, feed, harvest, eggs as stock movements at cost),
the ledger (each season and batch is a value of one ledger dimension), payroll (piece and day work),
procurement (goods receipts for chicks, draft purchase requests), payables (one draft bill per grower),
sales documents (lot sales), assets (machines and places), the Drive (scouting photos), shared links
(grower statements), analytics (season profit and cost-line reports), live updates (FARM.md "Shape";
Phases 2–7; "Gaps closed"; Decisions 4).

**Avoid:**
- Naming any map, weather or satellite provider. The boards print several; take them out.
- WhatsApp or SMS to growers. FARM.md Phase 7 says WhatsApp "is not offered until a sender enforces it"; the boards show both.
- Money "going to each grower's mobile money or bank account" (erp4e-payment-run). Approval makes draft supplier bills; payments run in sandbox. The board also names banks and mobile-money brands.
- Weights "from the scale by Bluetooth" (erp4e-harvest): FARM.md does not describe it; unclear.
- Shared machinery "booked like a rental" (erp4e-coop) and contractors' bills on the costs board: no farm source; unclear.
- A recall warning buyers "through your trading network link": FARM.md says email.
- The trace page's scan count: no source.
- Yield forecast "from rain and satellite vigour" (erp4e-season-page): the doc calls the forecast a dated projection; its inputs are unclear.
- "24 hours" for the spray rule (erp4e-farm-home, erp4e-farm-calendar). Use FARM.md's default: no spraying within 12 hours before rain, a setting the farm can change (FARM.md Phase 2 "Settings"; Decisions 13).
- Acceptance numbers (A1 to A105), drill figures, the 20,000-row export bound.
- "Certified" for the trace page or certifications on it.

**Boards:** erp4e-farm-home, erp4e-season-page, erp4e-fields-map, erp4e-scouting, erp4e-farm-calendar,
erp4e-inputs-applied, erp4e-harvest, erp4e-lot-trace, erp4e-batch-broiler, erp4e-batch-layers,
erp4e-vaccinations, erp4e-tasks, erp4e-costs-profit, erp4e-outgrowers, erp4e-payment-run, erp4e-coop,
erp4e-field-page, erp4e-phone-farm-home, erp4e-phone-field, erp4e-phone-batch.

---

## industry-manufacturing — Manufacturing

**Who it is for:** businesses that make what they sell, to order or for stock: food, drinks, packaging,
assembly, and work run as projects with deliverables. Manufacturing is a **core module, not a pack**; it
coordinates stock, procurement, finance, HR, asset management and the Drive, which stay the systems of
record (MANUFACTURING.md intro; spec Appendix A).

**Trade words:** Bill of materials, Routing, Work centre, Production order, Work order, Shop floor,
Operator's screen, Reason codes, OEE, Scrap rate, Inspection, Gate, Non-conformance report (NCR), Corrective
action, Output awaiting release, Work in progress.

**A day** (illustrative: a food and drinks maker at a plant in Ikeja, Lagos, filling groundnut oil and
packing pepper mix):

| Time | Problem | How Clafina handles it | Surface | Best board |
|---|---|---|---|---|
| 07:40 | The only filler on line 1 breaks down. | The operator reports the stop with a reason code; the machine goes to its state. The breakdown automation pauses the operations running on it, names the other machines of its work centre, schedules again every order waiting for it and tells the plant manager (MANUFACTURING.md Step 6 "Stops and reason codes"; Step 9 "Automation"). | shop floor (phone or web) | erp4c-mfg-work-order |
| 08:00 | The supervisor needs to know which orders are held up and why. | A work order explains a stopped operation: the machine and since when, the reason, who is on it, the operations waiting behind it, and the machine's open maintenance job (MANUFACTURING.md "The screens rebuilt from the v3 boards"). Machine status lists machines out of use and services overdue (same section). | web | erp4c-mfg-maintenance |
| 09:30 | Sales asks whether 3,000 jars can be ready by the 30th. | "Can we deliver by…?" plans the order as a dry run and answers yes or no, with the projected finish, days to spare and the factors: materials, suppliers, capacity, maintenance, workforce and routing (MANUFACTURING.md Step 4 "Can we deliver by 30 November?"). | web | erp4c-mfg-production-orders |
| 10:00 | A tomato paste order is short of tins. | Materials are held for each order where stock allows; a shortage raises a draft purchase requisition and a risk on the order's project, and procurement is told (MANUFACTURING.md Step 4 "Materials and stock"; Step 9 "Automation"). | web | erp4c-mfg-materials |
| 11:00 | An operator on the floor reports what was made. | Any phone camera opens the work order from its label; the operator starts, pauses, reports good and spoilt units and completes; work done offline syncs and is never applied twice (MANUFACTURING.md Step 6 "The operator's screen", "Offline", "Scanning and labels"). | shop floor | erp4c-mfg-work-order |
| 13:00 | Caps are leaking. | A failed in-process inspection holds the next operation and opens a non-conformance report; the report is dispositioned (accept, rework, scrap, return to supplier) and its corrective actions are verified by someone other than whoever did them (MANUFACTURING.md Step 7 "Inspections", "Non-conformance and action"). | web | erp4c-mfg-quality |
| 15:00 | A finished run must not be sold before quality looks at it. | With the setting on, output waits in "Awaiting release", which is not for sale, until someone with the right permission releases or rejects it (MANUFACTURING.md "Output follows the stock-flow settings"). | web | erp4c-mfg-quality |
| 17:00 | The owner wants to know how the lines did and what the order cost. | The production dashboard shows OEE and its three parts, throughput, scrap rate and downtime by reason; a work order's cost comes from what happened, work in progress is in the ledger, and variances show at completion (MANUFACTURING.md Step 6 "The dashboard"; Step 8; "The screens rebuilt from the v3 boards"). | web | erp4c-mfg-production |

**Built** (MANUFACTURING.md, all nine steps built 11 October 2026; see also product-facts product-manufacturing):
- Bills of materials with versions, co-products, by-products, phantoms and scrap (Step 1 "Bills of materials").
- Routings and work centres; revisions released through approval; engineering change (Step 1 "Routings and work centres", "Product lifecycle, revisions and change").
- Plants, lines, work-centre calendars and capacity, machines and their state, tools with calibration, people and skills read from HR (Step 2).
- Manufacturing projects: phases, milestones, deliverables, tasks with dependencies, risks, changes (Step 3).
- Production orders from a deliverable, a sales order, a plan or by hand; a planning engine that makes work orders for the product and each sub-assembly, pinned to the versions it planned with (Step 4).
- Materials held or short; shortages raise requisitions; suggestions for items at their reorder point (Step 4 "Materials and stock", "Capacity and suggestions").
- "Can we deliver by…?" with its factors (Step 4).
- A finite-capacity scheduler around maintenance, breakdowns and people's rosters and leave; the board by machine, person or order; critical path; scenarios (Step 5).
- The operator's screen; stock that moves with the work (issue, return, scrap, backflush, finished goods under a batch named after the work order); stops with reason codes; offline sync; labels with QR and Code 128 (Step 6).
- The shop-floor dashboard: units, rate, scrap, downtime, OEE, labour efficiency, live (Step 6 "The dashboard").
- Quality: inspection plans; incoming, in-process and final inspections; project gates; NCRs; corrective actions; traceability both ways (Step 7).
- Cost of each work order from what happened (materials, labour, machine time, overhead, work sent out); work in progress in the ledger; variances; project budgets, forecast and earned value; profitability (Step 8).
- Automations for shortage, delay and breakdown, each recorded with the steps it took (Step 9 "Automation").
- Dashboards for production, quality, maintenance, materials and projects; downtime by reason, defects by type, supplier delivery (Step 9; "The screens rebuilt from the v3 boards").
- An audit trail with where a change came from; search within the plant (Step 9).
- Output held in "Awaiting release" until quality releases it; scrapping goods already received; stock under the project; an asset made for own use (MANUFACTURING.md "Output follows the stock-flow settings").

**Pre-launch:**
- Statistical sampling tables (AQL) and control charts (Step 7 "Known limits"; Appendix A).
- Costing in more than the base currency (Step 8 "Known limits"; Appendix A).
- Machine states read from IoT and joined to the floor (Step 6 "Known limits"; Appendix A).

**Not in Appendix A (keep off the site):**
- Energy read from meters (Step 8 "Known limits").
- Sequence-dependent setup (Step 5 "Known limits").
- The capacity-overload alert net of maintenance and leave (Step 9 "Known limits").
- A work order from a configured order (ROADMAP §13 item 5).

**Pack switches on:** none. Manufacturing is a core module (spec Appendix A). Its behaviour is set in
Settings → Documents: production planning, scheduling, shop floor, cost and the ledger, automation
(MANUFACTURING.md each step's "Settings").

**Shares with the core:** stock (every draw and receipt is a stock movement; held stock is its own kind of
inventory, not for sale), procurement (requisitions, purchase orders for work sent out, returns to supplier),
finance (work in progress, variances, the Project dimension), HR (people, rosters, leave, skills), asset
management (maintenance jobs on machines), projects (one project table with the service industries), the
Drive (drawings), analytics (MANUFACTURING.md intro; Steps 4–9; PROJECTS via ROADMAP Phase 17).

**Avoid:**
- Calling it a pack.
- "Industry 4.0" or "IoT-ready" as live; OEE benchmarks.
- AQL, control charts or multi-currency costing without the pre-launch tag.
- Delay found "the second it happens": the scan runs every ten minutes (Step 9 "Known limits"). Say "within minutes" or leave timing out.
- "Move op 30 to the second filler" (erp4c-mfg-work-order) as an automatic move: the breakdown automation names the other machines and reschedules; a person moves work.
- Report window sizes, test names, drill results.

**Boards:** erp4c-mfg-production, erp4c-mfg-work-order, erp4c-mfg-production-orders, erp4c-mfg-quality,
erp4c-mfg-materials, erp4c-mfg-maintenance.

---

## industry-configurator — Product configurator

Source note: there is no CONFIGURATOR.md in this repo. This brief comes from the web app's code
(`commerce-web/src/app/features/configurator/`: `configurator.routes.ts`, `domain/configurator.model.ts`,
`domain/configurator.logic.ts`, `data/configurator-api.service.ts`, `application/configurator.stores.ts`,
`presentation/*`), commerce-web `docs/features.md` ("Industry packs: configurator, courses, fundraising,
distribution"), ROADMAP §13 item 5 and INDUSTRY_PACKS.md. Below, "code" means that folder.

**Who it is for:** businesses that sell products made to the customer's choices, such as furniture, where
each choice changes the price, the parts and the lead time, and the result goes on a quotation (code:
`configure.component.ts`, `product-editor.component.ts`; ROADMAP §13 item 5).

**Trade words:** Configurable products, Options and rules, Option, Value, Asked as (a choice, a number, yes
or no), Price change, Adds lead days, Parts it adds, Quantity or formula, Rules (Not allowed, Adds a part,
Needs, Takes longer), Try it, Configure and quote, Needs a quote, Configurations, Notes for the workshop.

**A day** (illustrative: an office-furniture workshop in Ikeja, Lagos, making an executive desk to order):

| Time | Problem | How Clafina handles it | Surface | Best board |
|---|---|---|---|---|
| 08:00 | The desk comes in many sizes and finishes; each costs and uses something different. | Make an existing product configurable, with a base price, base cost, lead time and, if wanted, the BOM it starts from. Options are asked as a choice, a number or yes or no, shown as buttons, a list or swatches; each value can change the price by a fixed amount or a percent of the base, add lead days and add parts whose quantity is a number or a formula of other options (code: `products.component.ts`, `product-editor.component.ts`, `bom-lines-editor.component.ts`; `configurator.model.ts` `OptionRow`, `ValueRow`, `BomLineSpec`). | web | erp4f-cfg-editor |
| 09:00 | Some choices cannot go together. | Rules of four kinds (not allowed, adds a part, needs, takes longer), each shown as a plain sentence; a rule can be switched off and on (code: `configurator.model.ts` `RuleRow`; `configurator.logic.ts` `RULE_KIND_WORDS`; `rule-form.component.ts`; `product-editor.component.ts`). | web | erp4f-cfg-editor |
| 09:30 | The owner wants to check the set-up before customers see it. | Try it: choose as a customer would; nothing is saved. Then publish the product; a retired product stays on saved configurations (code: `product-editor.component.ts`; `configurator-api.service.ts` `evaluate`, `publish`, `retire`). | web | erp4f-cfg-editor |
| 11:00 | A customer wants four desks in mahogany with a gloss finish. | Configure and quote works the answer out as you choose: the price line by line, for one and for the quantity before tax, the cost, the margin, the lead time and ready-by date. A choice a rule rules out is set aside and the reason is said (code: `configure-panel.component.ts`; `configurator.model.ts` `Evaluation`; `configurator.logic.ts` `asideWords`). | web | erp4f-cfg-quote |
| 11:10 | The tops for four desks are not all in stock. | The bill of materials lists each part with need, on hand and short, from the base BOM or from an option or rule; "Order the short parts" opens a new purchase order with those parts and quantities filled in (code: `configure-panel.component.ts` `orderQuery`; `configurator.logic.ts` `stockWords`, `shortLines`; procurement `encodeOrderLines`). | web | erp4f-cfg-quote |
| 11:20 | The order is large and should be quoted, not just ordered. | Over the product's "needs a quote" amount the screen says so. "Save and put on a quotation" needs a customer; the quotation line keeps the configuration's number, and price books, discounts and approval limits apply when it is quoted (code: `configure.component.ts`, `configure-panel.component.ts`, `products.component.ts`). | web | erp4f-cfg-quote |
| 14:00 | The customer calls back to change the width. | Saved configurations keep the exact values, the product version and what they came to; a draft can be changed or cancelled, a quoted one links to its quotation; the list has tabs with counts and updates live (code: `configurations.component.ts`; `configurator-api.service.ts` `ConfigurationsApi`, `rework`, `cancel`). | web | erp4f-cfg-quote |

**Built** (all from the code unless named):
- Configurable products: draft, published, retired; base price, base cost, currency, lead time before options, an optional base BOM, a "needs a quote over" amount (`configurator.model.ts` `ProductSummary`; `products.component.ts`).
- Options asked as a choice, a number or yes or no; shown as buttons, a list or swatches; required or not; help text (`configurator.model.ts` `OptionRow`; `product-editor.component.ts`).
- Values that change the price by a fixed amount or a percent of the base, add lead days, add parts, and can be the default (`configurator.model.ts` `ValueRow`; `product-editor.component.ts`).
- Parts with a quantity that is a number or a formula of other options (`bom-lines-editor.component.ts`; `BomLineSpec`).
- Rules: not allowed, adds a part (optionally with a price), needs, takes longer; each in a plain sentence; switched on and off (`configurator.model.ts` `RuleRow`, `RuleEffect`; `rule-form.component.ts`).
- Try it, which saves nothing (`product-editor.component.ts`; `configurator-api.service.ts` `evaluate`).
- Configure and quote: price line by line, cost, margin, lead time and ready-by, BOM with stock, choices set aside with their reason, problems that stop saving (a missing required choice, a rule broken, a formula that fails) (`configure-panel.component.ts`; `configurator.model.ts` `Evaluation`, `Issue`; `configurator.logic.ts` `blocked`).
- Order the short parts as a pre-filled purchase order (`configure-panel.component.ts`; procurement `encodeOrderLines`).
- Save a configuration, or save and put it on a quotation for a customer; notes for the workshop (`configure.component.ts`).
- Saved configurations: number, values, product version, prices, cost, margin, lead time, BOM; draft, quoted, cancelled; change or cancel a draft; live updates (`configurations.component.ts`; `configurator.model.ts` `Configuration`; commerce-web docs/features.md).
- Several configurations on one quotation: the API call takes more than one (`configurator-api.service.ts` `quote` with `alsoIds`; ROADMAP §13 item 5), but no screen in the code offers it yet: unclear whether to claim it.
- Permissions to read products, create configurations, read them and quote them (`configurator.routes.ts`; `configure.component.ts`).

**Pre-launch:** none. The configurator row in Appendix A is empty.

**Not in Appendix A (keep off the site):**
- A work order from a confirmed order with the configuration's bill of materials (ROADMAP §13 item 5; the screen in `configure-panel.component.ts` says it is not built).
- Anything else CONFIGURATOR.md lists as "Not yet": unclear, the doc is not in this repo.

**Pack switches on:** the `configurator` pack. The pages are reachable only where it is installed
(`configurator.routes.ts` `requirePack('configurator')`; INDUSTRY_PACKS.md "The packs"): Configurable products,
Options and rules, Configure and quote, Configurations. Settings, words and Home cards: unclear.

**Shares with the core:** products (a configurable product sells as an existing product), bills of materials
(it can start from one), stock (on hand and short per part), sales quotations, price books, discounts and
approval limits, procurement purchase orders, live updates (code: `products.component.ts`,
`configure-panel.component.ts`, `configure.component.ts`; ROADMAP §13 item 5).

**Avoid:**
- Saying an accepted quote or confirmed configuration makes a work order. It is not built and not in Appendix A; say the bill of materials is kept with the configuration.
- A 3D or visual product preview: the code has none.
- Customers configuring products themselves in the online shop: the code is staff screens only; unclear.
- "Rules checked when written" (ROADMAP §13 item 5): not visible in the web code; unclear.
- How formulas work beyond "a number or a calculation of other choices": the formula language is the API's and is not in this repo.
- Margin warnings: the code has a "margin" problem kind, but when it fires is unclear.
- "Raise a purchase order" wording (board): the screen says "Order the short parts".

**Boards:** erp4f-cfg-quote, erp4f-cfg-editor.

