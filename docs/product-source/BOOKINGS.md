# The booking engine

> Status: **steps 1 to 5 built (16 October 2026)** on `feat/booking`. Code: `src/modules/booking`. Tests: `npm run test -- src/modules/booking`.

One engine for everything that is booked: hotel and guest-house rooms, restaurant tables, a stylist's chair, a clinic's appointment, a hired machine or vehicle, a studio's class. It is generic on purpose; industry packs (hotels, restaurants, salons, hire) sit on top and choose which resources and offers to create. It reuses the calendar's slot engine (`src/modules/calendar/slots.ts`) rather than building a second one.

## The model (step 1)

| Table (`booking.`) | What it holds |
| --- | --- |
| `resource_groups` | A room type, dining area, team of stylists, class of equipment or vehicles. Interchangeable resources an offer can draw on. |
| `resources` | Anything bookable at a location: `room`, `table`, `staff`, `equipment`, `vehicle`, `space`. Capacity (and the fewest a table is laid for), `shared` (a class of twelve takes several bookings at once up to its capacity; everything else takes one at a time), area/zone, tables it can be **joined** to, the member of staff for a staff resource, its own time zone, attributes. Retired, never deleted; refused while reservations to come hold it. |
| `offers` | What a guest books: a `service` (duration, staff who can do it), a `table` (a party), a `stay` (nightly, a room type, check-in/out times), a `hire` (hourly or daily). Lengths, step between start times, buffers before and after, lead time, horizon, party limits, the group it draws on, and where its price comes from. `offer_resources` names the resources that may give it. |
| `rate_plans` | Weekday, weekend and season rates and a season's minimum or maximum stay. |
| `hours`, `exceptions` | Opening hours (a week in a zone) per location or resource; closures and special days over a run of dates. Taken off, never deleted. |
| `allocations` | A resource held for a period (buffers included). The next step writes them; availability reads them. |

Every table's key starts with `organization_id`; every query names it, and each join too. Row-level security is on. Photos and papers are Drive references (`booking_resource`, `booking_resource_group`, `booking_offer`, `booking_reservation` in the registry; `<app-record-documents>` on the web).

### No double booking, in the database

`allocations` carries

```sql
EXCLUDE USING gist (organization_id WITH =, resource_id WITH =, period WITH &&)
  WHERE (exclusive AND released_at IS NULL)
```

`period` is a `tstzrange`, half-open: a guest leaving at 11:00 and the next arriving at 14:00 never overlap. Released holds (cancelled, moved, lapsed) stop counting. A **shared** resource is not exclusive: its seats are counted under a lock on its row. Proved on a scratch database: an overlap is refused (`23P01`), back-to-back is allowed, another organisation's same id is unaffected, a released hold frees the room. The extension is `btree_gist` (supported on RDS and Aurora).

## Hours

A location's week is `{ "mon": [{ "start": "09:00", "end": "17:00" }], … }` in its time zone (`PUT /booking/hours/locations/:id`); a day left out is closed. Nothing set: weekdays 09:00-17:00 in Africa/Lagos, as the calendar assumes. A resource with no hours of its own follows its place; with its own, it is open only when the place is too (a stylist's 07:00-12:00 inside the salon's 09:00-18:00 is 09:00-12:00). Closures and special days (`/booking/hours/exceptions`) apply to the place or to one resource; a closure says how many reservations it reaches without moving them. Hours are wall-clock: 09:00 stays 09:00 across a change of clocks. Stays ignore opening hours (a room is open all night) but not closures.

## Availability

`GET /booking/availability/slots` (service, table, hire), `/stays` (a stay on dates, with the price), `/nights` (rooms free each night with its rate). Reads are two statements on range indexes (the window's holds on the GiST index `(organization_id, location_id, period)`, and the hours), so the cost is the holds in the window, not the table; a window is at most 62 days.

- **Timed offers** use the calendar's `freeSlots`: each candidate's working time is its hours with closures; its busy time is what holds it (for a shared resource, the times when what is held plus the party exceeds its capacity: a sweep over starts and ends); the engine finds start times clear for the whole booking with its buffers, honouring lead time and horizon. The slot lists how many ways there are to give it.
- **Tables** that fit the party; a party too large for the larger of two joinable tables takes the pair (either table held blocks the pair).
- **Stays** hold a room from check-in time on arrival to check-out time on departure, in the place's zone. Free means nothing holds it and no closure covers a night.
- Why nothing is offered is said in words (`restriction`): too few or too many guests, too short or long a stay for those dates, too soon, too far ahead.

## Pricing

The base rate is the catalogue item's price book at the location through the same sales pricing every sales document asks (so a customer's contract, tier or promotion applies and tax is the book's), or the offer's own rate when it names no item. Rate plans then move it: by weekdays and/or dates, set / percent / amount, highest priority wins (a seasonal plan beats a plain one); one plan prices a night, plans never stack. A plan's `minStay` / `maxStay` restrict stays arriving in its season. Each guest beyond those included pays the extra-person rate. Tax is added, or taken out of a tax-inclusive price. Timed bookings are priced by the booking, the person, the hour (part hours count as parts) or the day (a started day is a day). `pricing.logic.ts` is pure and specced.

## API (step 1)

`/api/v1/booking/{resources, resource-groups, offers, rate-plans, hours, availability}`. Lists are keyset paged (`cursor` / `limit`, answer `{ items, next }`) on an index starting with `organization_id` and take the location. Reading needs `booking.reservations.read` (so anyone who takes bookings has the pickers); writing needs `booking.setup.manage`. Location scope: a person attached to locations sees those; the permission-holders for setup see all.

## Permissions

`booking.reservations.read | create | update | cancel`, `booking.frontdesk.operate`, `booking.setup.manage`, `booking.pages.manage`. Owners and administrators hold all; managers read, create, update, cancel and run the front desk; viewers read. Role templates "Front desk / host stand" and "Bookings manager". Seed: `sync-permission-catalog-v99` (1782650000001).

## Events

Lifecycle: `BookingResource-`, `BookingResourceGroup-`, `BookingOffer-`, `BookingRatePlan-created|updated`; `BookingAvailability-updated` (the live notice) with the bespoke `Availability-changed` (location, window, reason, resource ids). The topic family is `commerce.booking.v1`. (A booking-engine reservation is a `BookingReservation`: the CRM's `Reservation` is a request for an appointment.) Every payload carries `organizationId`.

## Tests

`src/modules/booking`: `hours.logic`, `capacity.logic`, `stay.logic`, `pricing.logic`, `availability.service` specs; `booking-permissions.spec.ts` (every route is held to a catalogued permission, writes never to a read alone).

## Reservations (step 2)

A **reservation** is a document, standalone like every other: numbered from its own series (`RSV-…`, type `booking-reservation`), for a guest (a customer, found by email or made one so the booking is on their timeline; a phone-only walk-in is kept on the reservation alone), a party, an offer and the resources that hold it.

```
held ──confirm──▶ confirmed ──check in──▶ checked in ──complete──▶ completed
  │                  │  └────────────────────complete (service)────────▲
  ├─lapse─▶ expired  ├─cancel─▶ cancelled      └─no-show (after the grace)─▶ no show
  └─cancel─▶ cancelled
```

- **Making one** (`POST /booking/reservations`, `booking.reservations.create`): the best-fitting free resource is chosen (a table with the least spare seats; staff by the fewest bookings; the first free room), or staff name the resources. The resources are **held by the database first** (the exclusion constraint settles a race: the loser tries the next fit, and with none left gets 409 "that time has just been taken"), then the guest, the price (lines night by night), the number, the deposit and the hold are written in the same transaction. A booking that cannot be held leaves nothing behind.
- **Holds** (`held`): a reservation the organisation holds for someone, waiting for a deposit, or only requested by a guest keeps its resources until `hold_expires_at`, then lapses (`expired`) and the resources are free. A job delayed to the expiry lets it go (BullMQ queue `booking`), with a slow sweep (every 10 minutes) as the safety net; booking onto a resource also lets lapsed holds on it go first.
- **Deposit or prepayment** through the existing payments: a fixed **payment link** for the amount the settings ask (none, a percentage, a fixed amount, the first night, the whole). The reservation keeps the link (`deposit_link_id`). When the provider's verified webhook has settled a payment (`PaymentIntent-updated`, succeeded) `DepositListener` adds what the link has taken and a held reservation waiting for it **confirms itself**; one that lapsed or was cancelled before the money came has it to give back (`refund_due`). Sandbox providers only, as everywhere, until real rails are switched on.
- **Cancellation and no-show policy** are document settings (`booking-reservation`, per organisation or location): free cancellation until N hours before the start, then a fee (none, percentage, fixed, first night, whole); a no-show fee by the same options, markable only after a grace; what was paid ahead less the fee is `refund_due` (given back from Finance → Payments; the receipt is the customer's credit). A person with `booking.reservations.cancel` may **waive** the fee; the page tells what cancelling now would cost.
- **Modify / move** (`PATCH`): another time or dates, party, rooms, resources, notes, the guest's details. The reservation's own holds are let go and the new ones taken in the same transaction: if they cannot be had, nothing changes. Repriced; the deposit asked follows the new total (never below what was paid).
- **Front desk**: `check-in` (seated, arrived), `complete` (checked out, done; early completion frees the resource from that moment). `booking.frontdesk.operate`.
- **Waiting list** (`/booking/waitlist`): a guest joins for dates or a window that is full. When a cancellation, no-show, lapse or move frees what they want, the first in line is **held a reservation** for `waitlistOfferMinutes` (so nobody can take it from under them while they are told); not taken, the hold lapses and the next is offered.
- **Invoice**: `GET …/invoice-draft` fills the invoice form from a completed stay or service (or just the cancellation/no-show fee); the person makes the invoice as for any document and `POST …/invoiced` links it back. A deposit received is noted on it for Finance to apply.
- **Reads**: `GET /booking/reservations` (keyset, in the order of the start; filters location, status, offer, customer, resource, window, search), the detail (lines, holds, history, deposit link, what may be done now), `day-sheet` (arrivals, departures, in house, pending, missed) and `timeline` (resources as rows, holds as blocks; at most 62 days).

### Data (step 2)

`booking.reservations`, `reservation_lines`, `reservation_events` (history, written once), `waitlist`; `allocations.reservation_id` now has a (deferred) foreign key. Lists are on `(organization_id, start_at, id)` and its location / status variants; search is trigram.

### Settings (`booking-reservation`)

Hold minutes; guests' bookings confirm or are requests (and for how long); the contact a reservation needs; deposit mode, percentage, amount, whether it is needed to confirm, minutes to pay; cancellation window, fee mode, percentage, amount; no-show fee and grace; whether guests may change their own booking and until when; the waiting list and its offer time; reminder hours; confirmation messages; invoice note on completion. Each is enforced by the code named in the settings' `enforcedBy`.

### Events (step 2)

`BookingReservation-created | updated` (the live notice, versioned by `updated_at`), the moments `BookingReservation-confirmed | cancelled | checked-in | completed | no-show | moved`, `BookingWaitlist-created | updated`, `Availability-changed`.

### Tests (step 2)

`policy.logic.spec.ts` (life, deposits, fees, holds, guests), `reservation-allocator.service.spec.ts` (best fit, retry on a lost race, joined tables together or not at all); `npm run booking:drill` (step 2: a held reservation with its deposit link, paid and confirmed; all rooms taken, the race for the last room; the waiting list offered a freed place and lapsing; a late cancellation's fee as the page said; moves; check-in and out; the invoice draft; a no-show's fee; every event announced; the database refusing an overlap).

## Public booking and messages (step 3)

### Booking pages

A **page** (`booking.pages`, `/booking/pages`, `booking.pages.manage`) is a link a guest opens without an account: for one location, offering some of its public offers in the order set, with an intro and a message for after booking. As the calendar's booking links: the token is `<organization id>.<secret>`, stored as its SHA-256 and sealed so the link can be copied again; retired, never deleted (the link stops working; reservations made through it stay). The web address is `/reserve/<token>`.

### What a guest does (`POST /public/booking-pages/*`, no sign-in)

POST only, the token in the body (never in a URL the server logs), `Cache-Control: no-store`, not indexed; `book`, `waitlist`, `manage/move`, `manage/cancel` and `manage/accept` are rate-limited as `sends`.

| Endpoint | |
| --- | --- |
| `open` | The organisation, the place, the page's offers (no resources, no staff). |
| `slots`, `stays`, `nights` | Free times, whether a stay is bookable with its price and the deposit that would be asked, and night by night. A full stay says the waiting list is open. |
| `book` | The staff's booking (same rules, same refusal of a double booking in the database) with source `public`; answers with the reservation as a guest sees it and the link to manage it. |
| `waitlist` | Joins the waiting list for full dates or a window. |
| `manage`, `manage/availability`, `manage/move`, `manage/cancel`, `manage/accept` | The guest's own link (their reservation's token): see it, see what they could move to, move it, cancel it (the page says what that costs), or take a place held for them. Held to `guestChanges` / `guestChangeWindowHours`: closer to the start than that a guest is asked to contact the organisation. |

A deposit shows as a link to pay, from the reservation's payment link. Settings decide the rest: `publicBookings` (`confirm` or `request`), the deposit, the hold.

### Messages

The guest is told through the organisation's own email channel (its slot and its Studio layout, with an invitation file that moves or removes the calendar entry rather than adding one): *confirmed*, *request received*, *pay your deposit* (with the hold time), *changed*, *cancelled* (with the fee and what goes back), *a place has opened for you* (the waiting list) and *a reminder* (`reminderHours` before the start). They are sent as the outbox relay delivers the reservation's events (`ReservationNoticesListener`), so a booking that rolled back tells no one; each is recorded on the reservation's history under a key (`message`), so a notice delivered twice is sent once. Reminders are delayed jobs in the `booking` queue (`remind-<reservation>-<hours>`) set when a reservation is confirmed or moved and taken back when it ends; one that fires for a reservation that has moved on checks it is still due. `sendConfirmation` turns the confirmations off.

Staff are told through the notification centre: the subject **Reservation** (`BookingReservation`), with two presets — a reservation made held is waiting to be confirmed, and a cancellation — to those who may read reservations at its location, in the app.

### Tests (step 3)

`message-format.spec.ts` (when, price, deposit, cancellation in words); `booking:drill` (79 checks: a page and its link, what a guest sees and not, an offer not on the page and a bad token refused, price and deposit shown, a guest's booking held for its deposit with its payment and manage links, moved, accepted-while-owing, cancelled by the guest, the waiting list joined from a full date, one confirmation however often told, the reminder waiting in the queue and taken back, a withdrawn page).

## On screen (step 4; commerce-web `features/bookings`)

| Where | What |
| --- | --- |
| `/bookings/timeline` | (The module's home; the day in numbers, a now line and the held list were added on 19 October 2026, see below.) Resources as rows, what holds each as a bar, by the day or the week, for a kind of resource. A bar is dragged to another time or row (rooms by whole days, timed things in 15-minute steps); the server checks it again and a refusal is said in words, nothing changes. Every bar is also a link to its reservation, where the same move is made by typing. Held bars are dashed. |
| `/bookings/day-sheet` | The front desk's or host stand's day: arrivals and bookings today, departures, here now, waiting for an answer, no-shows and cancellations, each row with the one action it needs behind an Actions menu. |
| `/bookings/reservations`, `/:id` | The keyset list (filters: coming up, here now, waiting, finished, ended; search; from a day) and a reservation: when, party, what holds it, the price line by line, the deposit and its link to pay, the fee and what is to be given back, history, files (Drive references), and confirm / check in / check out / move or change / cancel (the fee said first, waivable) / no-show / make the invoice. |
| `/bookings/waitlist` | Who waits for what, who has been held a place; add a guest; take one off. |
| `/bookings/setup/…` | Resources and room types (with photographs and papers), offers with their rate plans and the catalogue item they are priced from, hours and closures (a closure says how many reservations it reaches), booking pages with their copyable links. Policies are the document settings (Settings → Documents → Reservations). |
| `/reserve/:token`, `/reserve/manage/:token` | The guest's pages (no sign-in, no shell). |

The invoice is made on its own as any invoice is: the reservation's page fills the ordinary `POST /ar-invoices` from `invoice-draft` (a `SERVICE` line when the offer is not priced from a catalogue item), then links it back. The guest must be a customer (an email makes one).

## Live updates (step 5)

Nothing on these screens polls. The reservation's lifecycle events become entity notices on `/live` (`entity:BookingReservation`, location rooms, `booking.reservations.read`); resources, groups, offers, pages, the waiting list and the place's free time have their own (`BookingResource`, `BookingResourceGroup`, `BookingOffer`, `BookingRatePlan`, `BookingWaitlist`, `BookingPage`, `BookingAvailability`). Each screen reads once on opening, applies what the socket says (`followLive`: a moment after a burst, and once after a reconnect) and shows `<ui-live-status>` instead of a refresh button. A change made at the other desk — a deposit paid, a guest checked in, a hold that lapsed — is on screen within the push budget. Holds lapse by a job at their expiry (and a ten-minute sweep as the net), reminders and message by delayed jobs and the outbox, never by a screen's timer.

## The screens rebuilt from the v3 boards (19 October 2026)

The Bookings screens were rebuilt from `erp4c-bookings-timeline`, `-day-sheet`, `-reservations`, `-reservation`,
`-waitlist`, `-offers`, `-pages` and `erp4c-phone-bookings-day-sheet` (lane `feature/screens-operations-people`;
inventory `design-handoff/feature-inventory/bookings.md`). The in-page tab strips and the three copies of the place
picker are gone: the sidebar navigates and one `ui-place-picker` stays (fixed text with one place). What the API gained,
all additive (an old caller gets what it always got):

- **`GET /booking/reservations/timeline`** carries `summary {date, covers, reservations, held, seated, tablesInUse,
  waitlist, waitlistFor[]}` so the strip over the lanes does not call four endpoints. `date` is optional (the place's
  date; today at the place by default); covers, reservations and held are what *starts* in that day by the place's
  clock, `seated` is who is checked in this moment, `tablesInUse` the distinct resources they hold, `waitlist` the guests
  waiting or offered, `waitlistFor` when they want a place that day (at most three). Each resource says `shared`, so a
  shared place can say "14 of 30 seats" (the party sizes the engine counts). Two bounded reads (the day; the checked-in
  guests, at most 5,000) and one for the waiting list (at most 500), all on organisation-first indexes.
- **`GET /booking/reservations`** carries, on the first page, `counts {upcoming, held, here, past, ended, all}` read on
  the same conditions as the rows (coming up and held are counted from `from`, as the rows are read), each counted to
  10,000 so a place with millions of reservations still answers at the cost of the cap. Saved views: `bookings.reservations`.
- **`GET /booking/reservations/:id`** carries `settingsApplied[]` (the deposit, free-cancellation, fee and guest-change
  rules in force at the place, in words, from `settingsInWords` in `policy.logic.ts`), `cancellationFeePercent` and
  `freeCancellationUntil` beside `cancellationFeeNow`, which stays the server's own figure (the browser never works a fee
  out), and `guestTimezone`: the zone of the browser a guest booked from, so a reservation made from another zone shows both.
- **`GET /booking/waitlist`** carries, on the first page, `counts {active, booked, ended}`, `freedPlaces[]` (the live
  offers: the place held, its time, who is first in line and was offered it, until when) and `rules {on, offerMinutes}`;
  every row carries `timezone` (the place's: the window a guest wants is read in it, no longer in UTC) and `position`
  (1 for the first in line among those waiting for the same offer). Saved views: `bookings.waitlist`.
- **`POST /booking/waitlist/:id/offer`** (`booking.reservations.update`): offer a waiting guest a place now. Rule 4: in
  queue order only; someone who joined first for the same time goes first (409 in words), nothing free in the window is
  409 too and they stay on the list. The place is held for `waitlistOfferMinutes`. **`POST /booking/waitlist/:id/skip`**
  passes an offered place on: the held reservation is cancelled without a fee, the place is freed, the next in line is
  offered it by the engine's own matcher and the skipped guest is marked as having let it lapse.
- **`GET /booking/pages`** carries `bookingsMade` for each page (reservations a guest made through it; older bookings did
  not record the page and are not guessed at). `POST /public/booking-pages/book` takes an optional `timezone` (an IANA
  name; one that is not a zone is ignored) and records it with the page.
- **The default of `waitlistOfferMinutes` is 15** (it was 120), as the design says (RECOMMENDATIONS-C §5, rule 4). An
  organisation that stored its own value keeps it; one that never set it now offers a freed place for 15 minutes.
- Migration `1788800000100` (expand only): `booking.reservations.guest_timezone` and `page_id` (nullable), three indexes
  (`(organization_id, location_id, status, start_at)` on reservations and `(organization_id, location_id, status)` on the
  waiting list for the pills; `(organization_id, page_id)` partial for a page's count). No new permission.
- The rules page is `/bookings/setup/rules`: it reads and saves the `booking-reservation` document settings through
  Settings → Documents' own endpoint (`GET/PUT/DELETE /document-settings/booking-reservation`, per place or for every
  place); Settings → Documents shows a link to it instead of a second copy.

Tests: `policy.logic.spec.ts` (the rules in words), `reservation-reader.screens.spec.ts` (the settings applied, the
free-until time, the guest's zone, the day in numbers for the place's own date), `reservation-screens.spec.ts` (what the
pills, the day's summary, the waiting list's counts and live offers and a page's count ask for), `waitlist.service.spec.ts`
(offering in queue order, refusing in words, the page a screen reads). Deferred to CI: `booking:drill` cases for the offer and
the skip, an e2e or drill case for the new reads and a sweep case for `/booking/waitlist/*/offer` and `/skip`.

## Limits and what comes next

- Real payment rails are held to the end: deposits go through the organisation's sandbox providers. A refund is made by Finance from the payment (the reservation says what is to be given back).
- Shared resources (a class of twelve) are counted under a lock on the resource's row, not by a database constraint; exclusive ones (rooms, tables, staff) by the exclusion constraint.
- A stay's price is per night by the rate plans; a plan prices a night, never stacks; a booking spanning a change of price keeps the price it was made at (a move reprices).
- Not built: a channel manager (sync with outside booking sites), group blocks and allotments, per-resource photos on the public page, SMS/WhatsApp messages (the email channel is the one wired; the organisation's other channels follow the communication module).
- Industry packs (hotels, restaurants, salons, hire) sit on top: they choose the resources, offers and policies; nothing in the engine is specific to one.

## Deferred tests (for the test lane)

Cypress (stubbed): timeline day/week, drag-move and refusal, day sheet actions, reservation page (confirm, check in, cancel with fee, move, invoice), new-reservation drawer for a stay and a timed offer, waiting list, set-up screens, public booking and manage pages (axe on each). Live Cypress: make a page, book as a guest, pay (sandbox), confirm, check in/out, cancel. E2E route specs and the tenancy sweep for `/booking/*` and `/public/booking-pages/*` (a second organisation sees none of it; a forged token is 404). Web unit specs for the screens' logic beyond `booking.model`.

## History

- 19 October 2026: the screens rebuilt from the v3 boards (above): the timeline's summary, pill counts, `settingsApplied`, the waiting list's live offers, offering and skipping, a page's bookings made, the guest's zone, the booking rules in place.
- 16 October 2026: step 1 — resources, groups, offers, rates, hours, availability.
- 16 October 2026: step 2 — reservations, holds, deposits, policies, waiting list, invoice draft.
- 16 October 2026: step 3 — public booking pages, the guest's own page, messages and reminders, staff notifications.
- 16 October 2026: step 4 — the staff screens and the guest's pages on the web. Step 5 — live updates and documents.
