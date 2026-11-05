# Rentals (the rentals pack)

Equipment, party, car and tool hire (boards `erp4f-rent-*`, RECOMMENDATIONS-F §7; package
`design-handoff/feature-inventory/rentals.md`). Built 25 October 2026 on `feature/industry-packs-rest-api`.

## The pack

`rentals`, version 1, kind `rental_yard`. Features `rentals.items`, `.agreements`, `.returns`. Words: Product → Item.
Menu "Rentals": Items, Agreements, Returns due. Six Home cards (declared). The installer writes nothing.

## Data (schema `rentals`, migration `1790550000000`)

| Table | What it holds |
|---|---|
| `items` | A hire offer: name, rate per day or hour, its own late rate (else a share of the rate by the settings), deposit, currency, tax. |
| `units` | Each unit with its tag code (the QR scanned at hand-out and return) and, usually, the asset of the register it is; available, being mended, retired. Availability counts units, not items. |
| `agreements`, `agreement_lines` | The customer's hire: the units, the period, the deposit due, who brings it back (the customer, or our collector). A unit is never held twice at once: an exclusion constraint on the line's period (as the booking engine's allocations), and a unit handed out and not back stays held past its due time. |
| `conditions` | Append-only: notes, photos (Drive files), damaged, the signature, at hand-out and at return. |
| `charges` | Rent, late fee, damage (proposed from the return's condition, confirmed or waived by staff, with the customer's comment kept), other. |
| `deposit_movements` | Append-only: held, taken off for charges, refunded. The customer's money held, never income. |

## Rules (`logic/rental.logic.ts`)

- A part period is a whole one; a hire's rent is periods × rate × units.
- The late fee is periods past the due time after `graceMinutes`, at the item's late rate; shown as a projection
  (`lateFeeSoFar`, `projection: true`) until the item is back, then charged.
- Hand-out needs every unit's tag scanned, the customer's signature for the condition, and the deposit when
  `depositBeforeHandOut` says so.
- Return records the condition against the hand-out; a damaged unit gets a proposed damage line and leaves the calendar
  (`maintenance`) until it is mended (`POST units/:unitId/status`).
- Settling needs no damage left undecided: rent, late fees and confirmed damage are one customer invoice
  (`PackInvoicer`); the deposit pays the charges first, the rest is recorded as refunded to the original payment route.

## Settings (`DocumentType.RENTAL`)

`graceMinutes` (60), `lateRatePercent` (100), `depositBeforeHandOut` (true), `postInvoices` (submit), `dueInDays` (7),
`serviceItemId` (required to settle).

## API (`/api/v1/rentals`)

| Route | Permission |
|---|---|
| `GET items` · `GET items/:id` · `GET items/:id/availability?from&to` · `POST quote` | `rentals.items.read` |
| `POST items` · `PATCH items/:id` · `POST items/:id/units` · `POST units/:unitId/status` | `rentals.items.manage` |
| `GET agreements` · `GET agreements/:id` · `GET returns-due` | `rentals.agreements.read` |
| `POST agreements` (reserve) | `rentals.agreements.create` |
| `POST agreements/:id/hand-out` · `…/return` · `…/extend` · `…/cancel` · `…/charges/:chargeId/decide` · `…/comment` | `rentals.agreements.operate` |
| `POST agreements/:id/settle` | `rentals.agreements.settle` |

Seed `1790550000101`. Events `RentalItem`, `RentalAgreement` (created, updated), topic `commerce.rentals.v1`.

## Tests

Unit (run): `logic/rental.logic.spec.ts`, `rentals-permissions.spec.ts`, `rental.settings.spec.ts`. Written, not run:
`test/rentals.e2e-spec.ts`, tenancy-sweep fixtures.

## Not yet

Posting the deposit to a liability account in the ledger (the movements are kept; the journal is the finance side's,
with the payment rails held to the end), opening an asset maintenance job from damage (the unit leaves the calendar; the
job is raised in Assets by hand), week and month discounts, insurance, the customer's booking page, driver pickup through
delivery.

## History

- 25 October 2026: built.
