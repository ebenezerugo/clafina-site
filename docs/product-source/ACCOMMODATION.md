# Accommodation (the accommodation pack)

Hotels, guest houses and short-lets on the booking engine (boards `erp4f-acc-*`, RECOMMENDATIONS-F §2; package
`design-handoff/feature-inventory/accommodation.md`). Built 25 October 2026 on `feature/industry-packs-rest-api`.

Rooms, room types, stays and availability stay the **booking engine's** ([BOOKINGS.md](BOOKINGS.md)): a room is a
resource of kind `room` in a `room_type` group, a stay is a reservation of a `stay` offer priced per `night`. There is no
second availability grid. This module adds what a hotel works with over them: the front desk and the rack, rooms
between guests, the folio, the hotel's rate rules, channels and the night audit. Check-in, check-out, a moved stay and
a no-show go through the engine's own `ReservationLifecycle` and `ReservationChanger` (exported on its public edge).

## The pack

`accommodation` (`packs/catalogue/accommodation.pack.ts`), version 1, kind `hotel` (also declares `guest_house`,
`short_let`). Features: `accommodation.desk`, `.housekeeping`, `.folios`, `.rates`, `.channels`, `.audit`. Words: Guest,
Guests, Stay, Stays. Menu "Accommodation": Front desk, Room rack, Housekeeping, Folios (every day); Rates, Channels, Night
audit (set up). Six Home cards (declared). The installer writes nothing: a room never touched reads as clean.

## Data (schema `accommodation`, migration `1790400000000`)

| Table | What it holds |
|---|---|
| `room_status`, `room_status_log` | A room's state (dirty, clean, inspected, out of order, with a note and "until") and every change (append-only: the application role may SELECT and INSERT only). |
| `housekeeping_tasks` | Departure clean, stayover, inspection, deep clean; one of a kind per room per day (partial unique index); priority `early_arrival` when someone arrives in the room that day. |
| `folios` | One per stay (unique on the reservation while not void) or standalone; the company that pays and what it covers (`none`, `room_nights`, `all`); `FOL-…` number. |
| `folio_lines` | Append-only. `source` (room_night, no_show, pos, booking, manual, correction), `source_id`, outlet, money worked out at posting (amount, service charge, VAT, consumption tax, total), `bill_to`, `corrects_line_id`. A room night is unique per folio and night; a till ticket per source id. |
| `folio_payments` | Cash, card, transfer, wallet, deposit; a refund is a payment below nothing with a reference. |
| `rate_plans`, `seasons`, `special_dates` | A plan is a rule on a room type's stay offer base rate (percent, amount, set), with a weekend uplift and a minimum stay; seasons repeat every year (`MM-DD`, may wrap the year end, may not overlap); a special date sets a percent or a price, a minimum stay, or closes the night (soft-removed). |
| `channel_connections`, `channel_updates`, `channel_sync_log`, `channel_bookings` | One connection per channel per place (Booking.com, Expedia Group, Airbnb, Agoda, Trip.com, Google Hotels, Hostelworld, Hotelbeds), its queue of outbound updates with attempts and the next try, every attempt logged, and the bookings it brought with commission. |
| `night_audits` | A place's business date closed once (key: place and date), with the nights posted, no-shows and folios still owing. |

Every key leads with `organization_id`; row-level security with the tenant policy on every table; no foreign keys.

## Rules (and where they live)

- **Rooms** (`logic/room-status.logic.ts`): dirty → clean → inspected; out of order needs a reason and comes back dirty.
  A guest goes only into an inspected room, or a clean one unless `sellOnlyInspected` is on. Check-out makes the room
  dirty and asks for a departure clean. Every change is logged and announced (`AccommodationRoom-updated`) so the desk
  hears it on `/live`; nothing polls.
- **Folio** (`logic/folio.logic.ts`): service charge on the charge (room nights and outlets, not fees); VAT on the
  charge and its service charge; consumption tax as a second tax on the charge alone; all by the place's settings and
  shown on the folio, never inside the rate. A posted line never changes: a correction is a new line turned round, never
  past the original; moving a line to the company is a correction plus the same charge billed to the company. Owing now
  is the guest's share less payments; the projection at check-out adds the nights still to come at the stay's own
  nightly rate (`subtotal / nights`). Settling needs nothing owing; the company's share becomes one customer invoice on
  the ERP's own invoice path (`PackInvoicer`, module `pack-billing`), carried as far as `postInvoices` says.
- **Charge to room**: any outlet's till posts by room number to the open folio of the guest in the house; the ticket id
  makes it once only (a second call returns `posted: false`).
- **Rates** (`logic/rate.logic.ts`): a night = base, then the plan's rule, then the season, then the weekend uplift
  (Friday and Saturday nights), then a special date (a price replaces everything before it). The quote says each step.
- **Rack** (`logic/rack.logic.ts`): bars clipped to the window, occupancy over sellable rooms (out of order off both); a
  move is refused when another stay holds the room those nights (and the engine's exclusion constraint holds it too).
- **Channels** (`logic/channel.logic.ts`): rooms left = rooms − out of order − booked + the overbooking allowance
  (`overbookPerNight`, 0 by default); Stop at none. An update is retried after 30 s, doubling to an hour; after five
  attempts the connection is `out_of_step` until Retry. Commerce connects itself (decided 14 October): an adapter per
  channel registers with `ChannelAdapters`; **none ships switched on** (each needs the organisation's account and the
  channel's partner approval), so a connection stays a draft and Go live answers in words.
- **Night audit** (`logic/audit.logic.ts`): for the business date, a room night posted to each guest in the house (once,
  by the unique key), confirmed arrivals who never came marked no-shows through the engine (its fee rule), folios still
  owing counted, the day recorded closed. The hourly sweep (BullMQ `accommodation`, job `audit-sweep`) closes yesterday
  at each place once its local `auditTime` has passed; a person can close a past day by hand. Its one cross-tenant read
  (`AuditRepository.organisationsWithRooms`, keyset pages of 500 ids on the system connection, listed in
  `system-scope.spec.ts`) finds the organisations with rooms; each organisation's audit runs in its own `runAs`.

## Settings (`DocumentType.ACCOMMODATION`, `accommodation.settings.ts`)

`sellOnlyInspected` (false), `overbookPerNight` (0), `vatRate` (0.075), `serviceChargeRate` (0.10),
`consumptionTaxRate` (0), `auditTime` ("03:00"), `dueInDays` (14), `postInvoices` (submit), `serviceItemId` (required
before a company's share can be invoiced). Location overrides allowed.

## API (`/api/v1/accommodation`)

| Route | Permission |
|---|---|
| `GET desk?locationId&date` · `GET rack?locationId&from&nights` | `accommodation.desk.read` |
| `POST stays/:reservationId/check-in` · `check-out` · `move` | `accommodation.desk.operate` |
| `GET rooms?locationId` · `GET rooms/:roomId` · `GET housekeeping?locationId&date&status&staffId` | `accommodation.housekeeping.read` |
| `POST rooms/:roomId/state` · `POST housekeeping/tasks` · `POST housekeeping/tasks/:id` | `accommodation.housekeeping.update` |
| `GET folios` (keyset page) · `GET folios/:id` | `accommodation.folios.read` |
| `POST folios` · `POST folios/charge-to-room` · `POST folios/:id/charges` · `POST folios/:id/split` | `accommodation.folios.charge` |
| `POST folios/:id/payments` · `…/lines/:lineId/correct` · `…/settle` · `…/void` | `accommodation.folios.settle` |
| `GET rates?locationId&from&months` · `GET rates/quote?offerId&planId&from&to` | `accommodation.rates.read` |
| `POST rates/plans` · `PATCH rates/plans/:id` · `POST rates/seasons` · `PATCH rates/seasons/:id` · `PUT rates/special-dates` · `DELETE rates/special-dates/:id` | `accommodation.rates.manage` |
| `GET channels?locationId` · `GET channels/:id` · `GET channels/:id/availability` | `accommodation.channels.read` |
| `POST channels` · `PATCH channels/:id` · `POST channels/:id/state` · `…/retry` · `…/bookings` | `accommodation.channels.manage` |
| `GET night-audits?locationId` / `POST night-audits` | `accommodation.audit.read` / `accommodation.audit.run` |

`accommodation.setup.manage` reaches every location. Owners and administrators hold all; managers also run the desk,
housekeeping, folios and the audit; viewers read (seed `1790400000101`).

## Events and live

`AccommodationRoom` (updated), `AccommodationHousekeeping`, `AccommodationFolio`, `AccommodationChannel` (created,
updated), `AccommodationAudit` (created; the entity is the place). Topic `commerce.accommodation.v1`; ids and states
only. Each is a live aggregate held to the matching read permission.

## Tests

- Unit (run): `logic/*.spec.ts` (rooms, folio money, rates, rack, channels, audit), `accommodation-permissions.spec.ts`,
  `accommodation.settings.spec.ts`, `pack-billing/pack-invoice.logic.spec.ts`, the catalogue spec.
- Written, not run (test lane): `test/accommodation.e2e-spec.ts`; tenancy-sweep fixtures for every table.

## Not yet

The channel adapters themselves (accounts and partner approval per channel); guest check-in on a tablet (ID scan,
signature), key cards and locks; the group booking (rooming list); the night-audit report and the hotel dashboard
(occupancy, ADR, RevPAR) as KPIs; the public booking page for rooms (the engine's public pages serve stays already);
company price books in a rate plan (a corporate plan names its company; its price is the plan's rule); an out-of-order
room opening an asset maintenance job.

## History

- 25 October 2026: built (desk, rack, housekeeping, folios, rates, channels, night audit).
- 25 October 2026 (`fix/followups-1025`): the sweep's cross-tenant scan moved into the repository, keyset-paged, and
  listed in `system-scope.spec.ts` (the spec was red on master after #91).
