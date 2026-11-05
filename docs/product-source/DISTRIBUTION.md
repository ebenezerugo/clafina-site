# Distribution (the distribution pack)

Van sales on routes, empties and deposits, settling vans, and 3PL storage billing (boards `erp4f-dist-*`;
RECOMMENDATIONS-F §11; package `design-handoff/feature-inventory/distribution.md`). Built 25 October 2026 on
`feature/industry-packs-rest-api-2`.

## The pack

`distribution`, version 1, kind `warehouse`. Features `distribution.routes`, `.empties`, `.storage`. Menu
"Distribution": Routes and van loads, Settle a van, Empties and deposits, Storage billing. Four Home cards (declared).
The installer writes nothing.

## Data (schema `distribution`, migration `1790750000000`)

| Table | What it holds |
|---|---|
| `returnable_items` | Crates, bottles, kegs: the deposit price, base units in one, the empties' stock variant. |
| `outlets` | A customer on the distribution list: area, account, terms, the empties limit, what they hold out, the deposit held and the oldest crate (kept from the ledger), their route codes. Read model `distribution-outlet`. |
| `empties_ledger` | Append-only movements by type: out (+) with full crates, back (−), the base quantity and the deposit, from a delivery, a collection, a settlement or an adjustment. |
| `routes`, `route_stops` | A route from a warehouse; a customer on a route on a weekday at a place in the order (taken off by a flag). |
| `vans` | Registration, its stock location, its asset, driver; available, in the workshop, retired. |
| `van_loads` | Number `VLD-…`, a van on a route on a day: loading, out, back, settled; load and sold value, empties expected, the settlement as worked out. Read model `van-load` (with lines, stops, payments). |
| `van_load_lines`, `van_stops`, `van_payments` | Loaded, sold (never more than loaded) and counted; each stop's state, sales and empties; payments by method (append-only). |
| `driver_differences` | Cash, stock and empties that did not agree: cleared under the tolerance, else for review, then charged to the driver or written off. |
| `storage_rate_cards`, `storage_clients`, `storage_daily_counts`, `storage_movements`, `storage_runs` | 3PL: rates (one default per warehouse), clients (their card, average or peak, insurance, declared value), a count a day, receiving, sending and services, each month's workings and invoices. |

## Rules (`logic/distribution.logic.ts`)

- **The empties limit**: a stop whose delivery would leave the customer over the limit, after the empties handed back
  at that stop, is refused with what would bring it within (`holdOverLimit`).
- **What a customer holds** is the ledger's base quantities summed; the deposit moves with them at the item's price;
  the oldest crate is first in, first out over the movements.
- **A van's day**: its stops are the route's customers for that weekday in order; sales never exceed what is left on
  the van; payments never exceed what was sold at the stop; a failed stop keeps the goods on the van.
- **Settling**: payments sold against counted by method, stock (loaded − sold) against counted by line, empties
  expected against counted; a cash shortfall within `cashTolerance` clears, every other difference goes to the
  driver's account for review.
- **3PL month**: pallet places by the month's average (or peak) × days × the rate, the cold room the same, receiving
  per pallet, sending per case, services as charged, insurance as a share of the declared value unless they insure,
  topped up to the minimum. Making the invoices fixes the month (one invoice per client, `PackInvoicer`).

## Settings (`DocumentType.VAN_LOAD`)

`holdOverLimit` (true), `oldEmptiesDays` (60), `cashTolerance` (5,000), `storageInvoices` (submit), `storageDueInDays`
(14), `storageServiceItemId` (required to make storage invoices).

## API (`/api/v1/distribution`)

| Route | Permission |
|---|---|
| `GET day` · `GET routes/week` · `GET routes/:id/stops` · `GET vans` · `GET van-loads` (keyset, read store) · `GET van-loads/:id` | `distribution.routes.read` |
| `POST routes` · `PATCH routes/:id` · `POST routes/:id/stops` · `POST vans` · `PATCH vans/:id` | `distribution.routes.manage` |
| `POST van-loads` · `POST van-loads/:id/lines` · `…/out` | `distribution.vans.load` |
| `POST van-loads/:id/stops/:stopId` · `…/back` | `distribution.vans.drive` |
| `POST van-loads/:id/settlement-preview` · `…/settle` · `GET driver-differences` · `POST driver-differences/:id/decide` | `distribution.vans.settle` |
| `GET empties` · `GET customers` (keyset, read store; `state`, tabs) · `GET customers/:id` · `GET customers/:id/empties` · `GET returnable-items` | `distribution.empties.read` |
| `POST customers` · `PATCH customers/:id` · `POST customers/:id/empties` · `POST returnable-items` · `PATCH returnable-items/:id` | `distribution.empties.manage` |
| `GET storage/rate-cards` · `GET storage/clients` · `GET storage/billing` | `distribution.storage.read` |
| `POST/PATCH storage/rate-cards` · `POST/PATCH storage/clients` · `POST storage/clients/:id/counts` · `…/movements` · `POST storage/billing` | `distribution.storage.manage` |

Seed `1790750000101`. Events `VanLoad`, `DistributionOutlet`, `StorageRun` (created, updated), topic
`commerce.distribution.v1`. Read models `van-load` and `distribution-outlet` (location-scoped, keyset indexes).

## Tests

Unit (run): `logic/distribution.logic.spec.ts`, `distribution-permissions.spec.ts`, `distribution.settings.spec.ts`.
Written, not run: `test/distribution.e2e-spec.ts`, the tenancy-sweep fixtures and the read-store leg.

## Not yet

Empties as stock in their own inventory type and deposits posted to a liability account; counted van stock moved back
into the warehouse and cash to the till at settling (the stock and till modules); correcting a customer's ledger from
an empties shortfall (the stop it belongs to is not known; it is the driver's difference); route planning by map,
proof of delivery, the 3PL clients' own view of their stock, expiry and batches, excise.

## History

- 25 October 2026: built.
