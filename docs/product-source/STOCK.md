# Stock

> Status: **current** — checked against the code on 5 October 2026 (Phase 5
> step 2, stock valuation). Tests: see the "Stock and counts" and "Stock
> valuation" rows in [STATUS.md](STATUS.md).

> Levels, transfers in transit and ABC classes (Phase 4.13) are in
> [STOCK_PLANNING.md](STOCK_PLANNING.md).

Nothing in this schema recorded goods arriving at a place or leaving it.
Quantities existed on receipt lines and order lines, but a quantity on a
document is a statement about that document — it is not a position. "How much
is in this warehouse" had no answer to derive.

## An append-only ledger

`item.stock_movements` is a ledger, in the same shape as the general ledger
beside it. A position is the sum of what has moved; a correction is another
movement rather than an edit to an old one.

That matters for more than tidiness. It makes the position as at any past date
recoverable, and it makes a discrepancy something whose history you can read
rather than something that silently became true.

**Append-only is enforced by grant**: the application holds `SELECT` and
`INSERT` on this table and nothing else. It has to be a revoke rather than a
narrow grant — an earlier migration set default privileges granting all four
verbs on every table created in these schemas, so granting only two adds
nothing and takes nothing away. That was caught by checking the grants after
the fact rather than by assuming.

A trigger would state it more loudly, but Citus only runs triggers on
distributed tables with `citus.enable_unsafe_triggers`, and enabling that
across the cluster to protect one table is a poor trade.

## The sign belongs to the kind

| Kind | Direction |
| --- | --- |
| `RECEIPT` | positive |
| `TRANSFER_IN` | positive |
| `OPENING_BALANCE` | positive |
| `ISSUE` | negative |
| `TRANSFER_OUT` | negative |
| `ADJUSTMENT` | either — its direction is the point |

Callers pass a positive quantity and say what they are doing; the service
applies the sign. Asking every caller to negate an issue invites a receipt that
quietly reduces stock.

The database checks it too, as a constraint rather than a convention, because a
receipt written as a negative number is an error no report would ever show as
one. Three other invariants are enforced there:

- a movement of zero is not a movement
- a transfer must carry a `transfer_id`, so each half can find the other
- an adjustment must carry a reason — it is the one movement with no document
  behind it, so the explanation is the only record of why a figure changed

## What the service adds

```
POST /v1/stock/receipts      stock arriving
POST /v1/stock/issues        stock leaving
POST /v1/stock/adjustments   a correction, signed, with a reason
POST /v1/stock/transfers     between two locations
GET  /v1/stock/on-hand       positions, from the projection
POST /v1/stock/counts        a physical count: open, start, record, approve
```

There is no endpoint to correct or delete a movement, and that is deliberate.

**Issues and transfers are refused when there is not enough.** A negative
position is not a warning anyone sees — it is a number that quietly makes every
downstream figure wrong, and it is usually a mistake in what was issued rather
than a genuine oversell.

**A movement made by hand cannot claim to be a document's.** A document
posts once, by its id: a movement under its source says its stock is in.
So the four routes above may label a movement (`sourceType`), but not as a
document that posts its own stock — `GoodsReceiptNote`, `Waybill`,
`SalesOrder`, `ReturnToSupplier`, `StockCount`, `ArInvoice`,
`ArInvoiceVoid` — nor as one of the catalogue's sources (`Inventory`,
`CatalogueImport`, …). A receipt labelled `Waybill` with a real waybill's
id would have stopped that waybill ever posting. Refused with a 422
(`DOCUMENT_SOURCES` in `stock.constants.ts`).

**Only this organization's places and items.** Every movement checks its
location, and a transfer checks both before writing either half; an item
that is not this organization's is named. Both are 404s. Another
organization's location used to reach the foreign key and come back a 500,
and its item was reported as having "no base unit". Opening a count, and
adding items to one, check the same.

**A transfer is two entries in one transaction**, sharing a `transfer_id`. Half
a transfer is stock that has left one place and arrived nowhere. The unit tests
assert that both halves are written or neither is, and that they sum to zero —
a transfer moves stock, it does not create or destroy any.

**Every movement is written in the caller's own transaction**, so a movement
and the document that caused it commit together. A goods receipt recorded
without its stock, or stock without its receipt, is a discrepancy someone
reconciles by hand later.

## Reading the position

`GET /v1/stock/on-hand` reads the `inventory-on-hand` projection rather than
summing the ledger, because summing every movement a tenant has made is not
what a stock screen should do on each load. The ledger remains the truth;
the projection is rebuilt from it, and the drill checks that rebuilding
reproduces exactly what the incremental stream produced.

`GET /v1/stock/on-hand/:variantId/:locationId` sums the ledger directly, for
the single-item case where being exactly current matters more than being cheap.

Positions that net to zero are not stored. The history stays in the ledger, and
an on-hand table full of zeroes is noise on every screen that reads it.

### A position is moved, not edited

Everything above is undone by one endpoint that can set the figure directly,
and `PATCH /inventories/:id` could: `UpdateInventoryDto` extends the create
DTO, so it carried `quantityOnHand`, and the mapper spread it straight over
the existing row. A position could be changed to anything, by anyone, with no
reason, no document and nothing in the ledger to read afterwards — which is
the whole class of problem the append-only ledger exists to prevent.

It is refused now, and the message names the endpoint to use instead. Only a
*change* is refused, not the field's presence: a client that echoes the whole
record back on a partial update is not asking for anything, and should not be
turned away for it. Everything that is not a position stays editable — where
it sits, what it cost, when it expires.

That leaves the ledger as the only answer to "how much is there", which is
what makes the answer worth having.

## What stock is worth

Every movement is costed as it is written, in the same transaction, in the
organisation's base currency (ROADMAP Phase 5 step 2). The movement ledger
is not touched — it stays append-only — and each movement's cost sits
beside it in `item.stock_movement_costs`: its value, signed like its
quantity, and what one base unit cost.

**The method is the organisation's** (`PATCH /finance/books`,
`costingMethod`):

- **Moving weighted average** (the default). An arrival at a price adds
  its value; an issue leaves at the average. Taking the last of an item
  takes the last of its value, so no kobo is left on an empty shelf.
- **First in, first out.** Each costed arrival is a layer
  (`item.stock_cost_layers`); an issue takes the oldest first. Switching
  makes what is held now one layer per item and place, at what it is worth.

What a movement costs:

| Movement | Costed at |
|---|---|
| Receipt with a price (a goods receipt, a receipt by hand with `unitCost`) | its price × quantity, converted to the base currency at the day's rate |
| Receipt or adjustment found with no price | what a unit costs now, so it changes no unit cost |
| Issue, transfer out, adjustment down | the average (or the oldest layers) |
| Transfer in | what the other half left at: a transfer moves value, it makes or loses none |
| Goods back from a voided invoice | what they left at on that invoice, not today's average |
| More out than is held (documents may go negative) | the last unit cost; the position goes negative in value as in quantity, and the next arrival fills it |

The position in money is `item.stock_valuations` (item, place, quantity,
value, last unit cost), locked and updated with each movement — the next
issue's cost depends on it. A batch (an import chunk) is costed in five
statements however many lines it has.

**Value without quantity** (`item.stock_value_adjustments`, append-only):

- `POST /stock/landed-costs` — freight, duty, clearing spread over a
  receipt's lines (`goodsReceiptNoteId` or `movementIds`) by value or
  quantity, in any of the organisation's currencies. The share of goods
  already gone goes to cost of sales; under FIFO the receipt's own layer
  carries the rest.
- `POST /stock/revaluations` — what one unit of an item at a place is now
  worth; the difference is the revaluation. Only stock that is held.

**Reading it**: `GET /stock/valuation` (item, place, quantity, value, unit
cost; by location or item; paged) and `GET /stock/valuation/reconciliation`
(the stock's value against the ledger's stock accounts — they agree unless
stock moved before the books were opened, or an entry is waiting in the
backlog).

## Stock in the ledger

Every movement posts a journal entry through the ledger
(`StockLedgerService`), one per document — a goods receipt's lines are one
entry — and lines that land on the same account are added together:

| Movement | Debit / credit |
|---|---|
| Goods receipt | Dr stock, Cr goods received not invoiced |
| Return to supplier | Dr goods received not invoiced, Cr stock — at what the goods cost on the receipt the return names, not at the average (31 October 2026); a return naming no receipt leaves at the average |
| Invoice voided (`ArInvoiceVoid`) | Dr stock, Cr cost of sales, at what the sale took out — posted from the void's own movements, though they share the invoice's ledger group (31 October 2026) |
| Customer return on a credit note (`CustomerReturn`), and its reversal | Dr stock, Cr cost of sales at what the goods left at; reversed, the other way |
| Waybill, sales order, invoice (issues) | Dr cost of sales, Cr stock; a voided invoice reverses it |
| Count, adjustment, receipt or issue by hand | Dr/Cr stock against stock adjustments |
| Opening balance (an import, a new stock row) | Dr stock, Cr opening balance equity |
| Transfer | Dr stock at the destination, Cr stock at the source — nothing when both use the same account |
| Landed cost | Dr stock (and cost of sales for goods gone), Cr goods received not invoiced |
| Revaluation | Dr/Cr stock against stock adjustments |

Which accounts is the organisation's (Finance › Posting accounts): stock can
be one account per location, category or inventory type.

**The goods moved whatever the books say.** An entry is posted in a
savepoint of the movement's transaction; when the books refuse it — a
closed period, a role with no account, a currency with no rate — the
movement and its cost stand, and the entry waits in the backlog
(`GET /finance/books/backlog`, with why), counted on the books
(`unposted`), and is posted by `POST /finance/books/backlog/retry` once the
cause is fixed. Nothing is lost quietly, and nothing physical is undone by
an accounting setting.

## Ledger entries by purpose (17 October 2026)

The rules that choose the account each costed movement lands on are pure (`stock-ledger.logic.ts`, unit-tested): a **single movement that says what it was for** (`source_type`) goes to that purpose's account instead of stock adjustments —

| Purpose | Other side | Falls back to |
|---|---|---|
| `QualityScrap` (finished goods scrapped by a quality report, bought goods scrapped after a failed inspection, rejected output) | `production_scrap` | stock adjustments |
| `asset-work-order` and `AssetPartReturn` (parts used on, and given back from, a maintenance work order) | `maintenance_expense` (6400) | stock adjustments |
| `ProjectIssue` and `ProjectReturn` (stock issued to, and given back from, a project) | `project_materials` (5500) | cost of sales |
| `asset-construction` (stock issued to an asset being built) | `assets_under_construction` (1650) | none (the role is set before an asset is begun) |
| `WorkOrderIssue/Return/Scrap/Receipt` | `wip` | |
| `asset-acquisition` | `assets_clearing` | |

A role the organisation has not set an account for falls back as shown, so entries are not held up and post where they always did until it is set (Finance › Posting accounts).

A movement may name **the project it is charged to** (`project_id`, a row of `manufacturing.projects`, either family): both lines of its entry carry the project's value in the ledger's Project dimension (`dim1`), and so does the cost added to goods a project's work order made. `StockMovementService.issueCosted` answers an issue's total value across the inventory types it was drawn from (one movement per type); callers that cost an issue use it.

## Where movements come from

| Document | When | What it records |
| --- | --- | --- |
| Goods receipt note | approved | a `RECEIPT` at the receipt's location, with unit price and batch |
| Waybill | dispatched | an `ISSUE` from the waybill's location |
| Sales order | fulfilled | an `ISSUE` from the order's location — **only if no waybill covers it** |
| Return to supplier | approved | an `ISSUE` from the location of the receipt it came in on |
| Stock count | approved | an `ADJUSTMENT` per line whose variance is non-zero |
| Catalogue import | as each chunk commits | an `OPENING_BALANCE` per item created or newly stocked, and an `ADJUSTMENT` per item whose figure it sets |
| Catalogue grid paste | when the batch is written | an `OPENING_BALANCE` per item, under `CatalogueBulkCreate` |
| A stock row opened directly | `POST /inventories`, or a quick-create | an `OPENING_BALANCE` for what it opened with, under `Inventory` |

Approval is the moment goods are accepted into the warehouse; dispatch is the
moment they leave it. Delivery is not the trigger — that is when they arrive
somewhere this system does not hold stock for.

A return has no location of its own, so it takes one from the goods receipt it
is linked to: that is where the goods were put, and guessing anywhere else
would move stock out of somewhere it never was. A return with no receipt
behind it records nothing, and says so.

### One movement per physical event

Fulfilling a sales order and dispatching a waybill for it both mean "the goods
left". Posting on each would take the stock out twice, in two entries that each
look correct on their own — the hardest kind of error to find, because nothing
is malformed.

**The waybill wins**, because it records the goods actually leaving the
building, where an order can be marked fulfilled in advance of anything moving.
So fulfilment posts only when no waybill references the order — a counter sale,
a collection, anything handed over without a dispatch note.

Each side checks the other, so exactly one posts however the two are sequenced:

- order fulfilled, waybill exists → the waybill posts
- order fulfilled, no waybill → the order posts
- waybill raised afterwards for an order that already posted → it stands aside

A cancelled waybill does not count as cover. A cancelled dispatch moved
nothing, and treating it as cover would leave the stock out of the ledger
entirely.

The drill exercises all three cases against the real services.

**Posting is idempotent by the document's id.** Approval arrives from an
approval callback and dispatch can be retried, so a second posting would double
the stock with nothing to show which entry was the duplicate.

**Posting a document does not refuse when there is not enough on hand**, unlike
`POST /v1/stock/issues`. The document records something that has already
physically happened. Refusing would keep the ledger tidy and make it wrong,
whereas a negative position is visible and says exactly what it means — that
the opening balance for that item was never established. The drill exercises
this directly: dispatching from a location with no history leaves the position
at −3, which is the truthful answer.

**A failure to record stock does not undo the approval or the dispatch.** The
goods moved either way, and the ledger can be posted again because the
idempotency check makes that safe. Refusing the approval because stock could
not be written would leave a receipt nobody can progress.

### Both read their own lines

Neither `findOne` in those services loads relations, so `grn.items`,
`grn.location` and `waybill.items` are all undefined by the time the posting
code runs. Depending on them posted an empty document and reported success —
the silent failure that is worse than an error, and one the drill caught. Both
now query the header and lines directly, and both log a warning when a document
posts zero lines rather than passing over it quietly.

### An import is where most stock starts

A catalogue import is the moment a business says what it already has, and for
a long time it was the one way stock entered this system without entering the
ledger. On-hand was set directly and nothing was written, so 258,213 units
existed with no history and no explanation — the ledger and `inventories`
disagreeing not by drift but by construction.

**An opening balance is its own kind.** `RECEIPT` was the tempting reuse and
it is wrong: a receipt means goods came from outside, and any report of what
was received in a period would have counted an entire opening catalogue as
purchasing. `OPENING_BALANCE` is positive, like a receipt, and separate from
one.

A row in a sheet reaches the ledger in one of two ways, and which depends on
the same three-way distinction the import already draws:

- an item created, or one the organization has but this location does not →
  an `OPENING_BALANCE` for what the sheet says is on the shelf
- an item already stocked here → the sheet **sets** a figure, and setting is
  not something an append-only ledger can do

For the second, the difference between the sheet's figure and what the ledger
already sums to goes in as an adjustment, so the position lands on the figure.
The difference is measured **against the ledger, not against
`inventories.quantity_on_hand`** — measuring against on-hand would carry the
existing disagreement forward forever, where measuring against the ledger
makes every update-mode import repair the rows it touches.

**One statement per chunk, and one event.** The import writes five hundred
items in four statements precisely so that seven thousand items are sixty
round trips rather than twenty-eight thousand; a movement written per row
would have made recording the stock cost more than creating it. The ledger
write is a fifth statement over `unnest`, in the chunk's own transaction, so
the stock row and the movement explaining it still commit together. The event
is raised once for the batch, because `inventory-on-hand` recomputes a whole
tenant per event and ignores the payload — five hundred events would recompute
the tenant five hundred times to reach the answer one event reaches.

**Idempotency is the job, not the chunk.** Every other document here checks
`alreadyPosted` before writing, and an import must not: its chunks share one
`sourceId` and commit separately, so the check would pass for the first chunk
and refuse every chunk after it. An import job runs once; re-running a sheet
is a second import with a second id, which is also what it means.

**The grid on the import page is a different route.** Pasting rows submits to
`POST /products/bulk` and reaches `BulkCreateProductsUseCase`, not the import
runner — no job row, no chunks, no reaper. It writes the same opening balance
for the same reason, under its own `CatalogueBulkCreate` source so the two can
be told apart, against an id minted for the batch because there is no document
to point at. Anything that changes how an import reaches the ledger has to
change in both places, which is the cost of the page having two routes behind
one button.

`npm run import:drill` takes this end to end against the real cluster —
creates items, stocks one of them at a second location, sets a figure, sets
the same figure again — and checks the ledger, the positions and the
`inventory-on-hand` projection all land where they should. It exists because
the unit tests use a fake manager, which accepts an `INSERT ... SELECT` over
`unnest` into a distributed table however the Citus planner actually feels
about it. It removes everything it creates.

### A count is a document, not an adjustment

A count produces adjustments against what the ledger says, and that is not one
correction — it is a sheet of counted quantities, one variance per line. So it
has a document of its own: `item.stock_counts` and `item.stock_count_lines`,
moving draft -> counting -> approved.

**`expected_quantity` is captured when counting starts, not when it is
approved.** This is the whole point of the document. The figure worth keeping
is what the ledger said at the moment the sheet was taken; recomputing
"expected" at approval would silently absorb every receipt and issue that
happened while the shelf was being walked, and a genuine discrepancy would
approve as zero variance — the ledger agreeing with itself, and wrong.

**`variance` is a generated column**, `counted - expected`, so no code path can
arrive at a different answer from the two numbers beside it.

**`counted_quantity` is nullable, and null is not zero.** A line nobody reached
has found nothing; a line counted at zero has found an empty shelf. Only the
second is a write-off, and conflating them would let an abandoned sheet erase a
warehouse. Approving a sheet where no line was counted is refused for the same
reason — an abandoned count and a perfect one are indistinguishable once that
difference is dropped.

**Lines with zero variance record nothing.** A count that finds everything
correct leaves no movements, not a row of zeroes: the ledger is append-only, so
every zero in it is noise in every position query and every audit from now on,
with nothing to say why it is there.

Posting goes through `postAdjustments` rather than `postDocument`. The latter
takes one kind for the whole document and positive quantities it signs itself,
which is exactly the contract that stops a receipt line quietly reducing stock;
an adjustment is signed per line and needs a reason the database will not let
it omit. The two share the part worth sharing — idempotency by source document,
so a retried approval records one set of movements.

**A failure to post does fail the approval here**, unlike a receipt or a
dispatch. Those record something that already physically happened, so the
document must stand whatever the ledger does. A count's entire purpose is the
correction it posts, and a sheet marked accepted over a position nobody
corrected is a discrepancy no one will ever return to.

The drill takes one end to end: receive, start, count a different figure,
approve, and check the ledger and the `inventory-on-hand` projection both land
on what was counted. It also runs a count that agrees with the ledger and
checks that nothing at all was written. See
`src/modules/item/stock/drills/README.md` for what it covers and why it is not
a unit test.

## Stock held for production (decided 11 October 2026)

Stock set aside for a work order is **its own kind of inventory, not for sale.** The system-defined inventory type **Held for production**
(`HELD_FOR_PRODUCTION`: not sellable, not returnable, counted) is given to every organisation. The ledger has two sides at each place:
the stock that can be sold or sent, and the stock set aside. `item.stock_movements.held` says which side a movement is on (false for
everything before this day); `projection.inventory_on_hand` carries `quantity` (both sides: what is in the building) and
`held_quantity` (the held side), and what can be sold is the difference. There is one count, in the ledger and its projection.

- **A hold is a stock movement.** `StockMovementService.shift` writes a pair at one place sharing a transfer id, as a transfer between
  places does: out of one side, into the other, at what it cost (value carried, so the pair makes and loses none). A hold moves
  sellable to held; a release moves held to sellable. The pair is sourced `StockHold` / `StockRelease` (reserved against hand-made
  movements) and, with both sides in one stock account, posts nothing to the books; an organisation that gives *Held for production* a
  stock account of its own (the books place the held lines by that type) sees value move into it and out again.
- **`item.stock_reservations` stays** as the record of *which work order* holds what (`RESERVE`, `RELEASE`, `CONSUME`, appended and never
  changed), reserving still serialises on item and place, and what the entries sum to at a place is what the held side holds there. It is
  not a second count of quantity; the drill checks the two agree. `StockReservationService.reserve` holds (movement and entry together),
  `release` gives back, `consume` uses up the entry and the stock leaves the held side when the work order is issued
  (`issue(..., { fromHeld: true })`; the shop floor draws the held part first, then what is free).
- **Sales sees only what can be sold.** Stock-outs, hand-made issues (`POST stock/issues`), transfers and dispatches check the sellable
  side. A document that records a sale, a delivery or a return to a supplier (`postDocument`) is refused when the building has the stock
  but the sellable side does not (`Cannot take 24 of this item: 23 is on hand to sell, and 6 more is held for production.`); stock short in
  the building altogether is left as it always was. A correction (`adjust`, a count's variance) that would dig into the held side is refused:
  release the hold first. The till's barcode scan, the stock record's `quantityOnHand` and `quantityAvailable` are the sellable side;
  `quantityHeld` is the held side. `GET stock/on-hand` rows and `GET stock/on-hand/:variantId/:locationId` carry `heldQuantity` and
  `sellableQuantity` beside `quantity`; `GET stock/levels` carries `held` beside `onHand`.
- **What still counts the whole building:** the on-hand figure on counts, valuation and the books, the inventory KPIs and reports, the
  dashboard. Held stock is still the business's stock, and the work order that holds it is what will use it.
- **Reorder counts both** (decided 11 October 2026). Stock levels (`GET stock/levels`, `…/:inventoryId`) show **total** (the whole building),
  **held** and **sellable** (total less held), `crossed` — `both` when the whole building is at or below the reorder point, `sellable` when
  held stock props the total up but what can be sold is at or below it, null otherwise — and `sellableShortfall`, the units short of the
  point counting only what can be sold. There are two alerts: `inventory.below_reorder` (whole building) and
  `inventory.sellable_below_reorder` (sellable only) — ANALYTICS.md, "Alerts". **The quantity to order is still worked out on the whole
  building** (`suggestedOrder`: what is in the building plus what is on its way, to the reorder point): held stock is already bought and
  is about to be used by the work order that holds it, so ordering to replace it would buy it twice; the sellable shortfall is shown beside
  it so a person can decide to order more, or to release a hold.
- **No stock record is made for the held side.** Stock records (`item.inventories`) are keyed by item, place and type, and a great deal reads
  them as one row per item and place; the held side is the ledger's, shown as a line of its own (the location's stock, the stock levels and
  the product's page). Nothing can be stocked under the type directly (it is refused with a sentence saying why).
- **Rolling out.** Migration `1780601100000-stock-held-for-production` adds the two columns and the type. Reservations made before it have no
  movements behind them; `npm run stock:move-holds [-- <organisation id> …]` gives each place the movements it lacks (safe to run again; where
  less can be sold than is held it moves what it can and reports the shortfall). Until it has run, reserving counts the older holds from the
  reservation ledger so nothing is promised twice, and releasing moves only what the held side has.

Tests: `stock-movement.service.spec.ts` (the pair, the refusals, the held side), `stock-reservation.service.spec.ts`,
`test/stock-held-for-production.e2e-spec.ts` (a work order's hold, a sale refused and the rest sold, a hand-made issue, a transfer and a
write-off refused, an issue to the work order from the held side, calling the order off), the stock drill (a hold, a sale refused, an issue,
a release, `stock:move-holds`) and the manufacturing drill (the held side equals the reservations through holds, an issue and a call-off).

## Stock per inventory type (12 October 2026)

The ledger is also **per inventory type**: `item.stock_movements.inventory_type_id`, `projection.inventory_on_hand_by_type`, `staged_quantity` beside `held_quantity`,
the new type **Awaiting release**, the settings that say which types a sale draws from and where bought goods arrive, and the **Type transfer** document (first called release to sale; 19 October 2026) that moves goods
from one type to another at the cost they had, for a reason the organisation chooses. The held side above is now simply the movements in the *Held for production* type. All of it is in
[STOCK_FLOW.md](STOCK_FLOW.md).

## Web

- **Inventory** (`/inventory`): what is held at the chosen location, what is
  at or below its reorder point, the price there, the history, and transfers.
  Someone who may only read sees the figures and no way to change them:
  *Stock items here* needs `inventory.products.create`, *Transfer*
  `inventory.stock.move`, and changing a price `inventory.products.update`.
- **Stock items here** (`/inventory/stock-items`): put items into a location
  at a price, one after another.
- **Counts** (`/inventory/counts`, `/inventory/counts/:id`): draw up a sheet,
  start it (expected quantities fixed), enter counts, save, approve or
  cancel. Steps need `inventory.stock.adjust`.
- **State:** NgRx `stock` and `stockCounts`.

## Tests

| Kind | Where | Run with |
|---|---|---|
| API unit specs | `stock-movement.service.spec.ts` (direction, units, rules, documents, corrections, another organization's place or item), `stock-count.service.spec.ts`, `stock-costing.spec.ts` (average, FIFO, past zero, landed costs, allocation) | `npm test -- item/stock` |
| Endpoint tests | `test/stock.e2e-spec.ts`: the whole application in-process, two organisations of its own — receipts, issues, adjustments, transfers, a count end to end, hand-made movements refused as documents, another organisation's place, item and count refused, permissions | `npm run test:e2e` |
| Endpoint tests | `test/stock-valuation.e2e-spec.ts`: receipts at their price, issues at the average, transfers (posting only between different stock accounts), a revaluation, a landed cost, FIFO once chosen, a closed period's entry waiting in the backlog and posting on retry — the stock accounts equal the stock's value throughout; another organisation sees and changes none of it | `npm run test:e2e` |
| Drills | `ledger:drill` (stock: an item of its own costed at the average, and the stock account moving by exactly its value); `stock:drill` (waybills, orders and counts reach the ledger and the projection) and `stock:rules-drill` (each inventory type's rules), in the test organisation, each on an item of its own (`drill-items.ts`) that it removes | `npm run drills -- stock` |
| Web unit specs | `stock.store.spec.ts`, `stock-count.store.spec.ts`, the model specs | `npm test` (web) |
| Cypress | `cypress/e2e/stock-held.cy.ts` (4, stubbed: held stock as a line of its own at a location, in the stock levels and on the product's page), `cypress/e2e/stock.cy.ts` (7, stubbed), `cypress/e2e/live/stock.cy.ts` (2: the owner reads the main store's stock, draws up a count and cancels it) | `npm run test:e2e:ci`, `npm run test:e2e:live` (web) |

## Known limits

- **Stock moved before the books were opened is costed but not in the
  ledger** (`npm run stock:value` costs it; Phase 5 step 8 posts it), so
  the reconciliation shows that history as a difference until then.
- **A landed cost lands on what the position still holds**: it does not
  trace which units of a receipt were sold, only how many fewer are held.
- **Dates are UTC days**: a movement just after midnight in Lagos posts to
  the day before.

- **The transfer panel and *Stock items here* are covered by the store
  specs and the endpoint tests, not yet by Cypress.**
- **Location scope**: someone with stock permissions at one store can move
  stock at any store of the organisation (ROADMAP §3f).
- **A count's counted-quantity field shows to someone who may only read**;
  saving it does not.

## History

- 17 October 2026: ledger entries by purpose, the project dimension, `issueCosted` (above).

- 19 October 2026: release to sale became the type transfer: send-from and receive-into types, the organisation's reasons, reverse ([STOCK_FLOW.md](STOCK_FLOW.md#type-transfer-19-october-2026)).

- 12 October 2026: the ledger per inventory type; stock flow settings; release to sale ([STOCK_FLOW.md](STOCK_FLOW.md)).

- 11 October 2026: stock held for production is its own kind of inventory, not for sale (above).

- 5 October 2026: stock has a value and posts to the ledger (Phase 5 step
  2). `inventories.average_cost` was never written; the product overview
  reads the valuation instead.

- 4 October 2026: tested and documented (Phase T step 1). Fixed on the way:
  - **A hand-made movement could pose as a document** and stop that
    document posting its stock. Refused now.
  - **Another organisation's location was a 500**, for movements and for
    opening a count; its item was reported as having no base unit. Both are
    404s, and a transfer checks both places before writing.
  - **The stock drills ran in the demo tenant**, moving and re-typing one of
    its real items. They run in the test organisation on items of their own.
  - Web: *Stock items here* said it saved items one after another and sent
    them all at once; it is sequential now. Someone who may only read was
    offered Transfer, Stock items here and a price field. And `ui-button`
    was not a button to a keyboard or screen reader — no role, not
    focusable, not pressed by Enter or Space — on every screen that used it.


## Stock counts, rebuilt (19 October 2026)

`GET /stock/counts/overview` answers the open counts, what counts wrote off lately, and for each place how long it
is since it was counted and why (the longest first). Each count carries the value of what came out short and over
at what the place holds the items for (`shortValue`, `extraValue`, `currency`). With the **blind counts** setting
(`document-settings`, Stock planning) the expected quantity of a line is withheld until its count is saved. The count
sheet is also read on a phone, one item at a time, through the same lines endpoint.

## The read side (25 October 2026)

Stock on hand per place and inventory type is the read model
`stock-on-hand` over `projection.inventory_on_hand_by_type`, location-scoped
(PROJECTIONS.md "Tier 1"): `GET /stock/on-hand-by-type?keyset=true` (place,
item, type, `sellable`, `search`; sorted by last movement or quantity) reads
only the places the person holds `inventory.stock.read` at, and
`GET /stock/positions/:positionId` answers one position. A position's id is
a uuid made from (item, place, type); its version is its movement count.
Each apply of the on-hand projection pushes the positions it changed on
`live:<org>:stock-on-hand[:<id>]` and the place's room. The array form of
`GET /stock/on-hand-by-type` stays until the screens page by cursor.


## Batches, expiry and changes on the item (26 October 2026)

- **Expiry on the ledger.** `item.stock_movements.expiry_date` (migration `1791600000000`) is written by every
  movement that carries a batch's expiry: `POST /stock/receipts` and `/adjustments` take `expiryDate`, and a goods
  receipt now passes its lines' expiry with the batch (it took the date and dropped it before).
- **Stock by batch.** `GET /stock/batches?variantId&locationId` (`FindStockBatchesUseCase`, logic in
  `stock-batches.ts`). Issues and sales name no batch, so a batch's own sum never goes down; instead each place's
  position (every movement summed, by type) is laid over what came in, newest first: what is left is the newest
  arrivals, as FIFO costing already assumes. Same batch and expiry are put together; stock no arrival explains is
  one line with no batch. Each batch says what is left, what came in, its cost per base unit, its expiry and when.
- **Movements say more.** `GET /stock/movements` answers `unitCost`, `currencyCode`, `batchNumber`, `expiryDate`,
  `createdBy` and `createdByName`; receipts and adjustments recorded on the item carry who recorded them.
- **Documents only, if chosen.** Settings, Stock and prices (`DocumentType.STOCK_AND_PRICES`,
  `quantityChanges: direct | documents`): with `documents`, `POST /stock/receipts` and `/adjustments` are refused
  (403) and quantities change only through goods receipts, transfers, counts and sales.
- **Known gap.** `rls-ensure` grants UPDATE and DELETE on every table of a schema, `item.stock_movements` included,
  so the ledger's append-only rule (the REVOKE in `1780302100000`) is undone on any database it runs on. The price
  history (below, in CATALOGUE.md) holds with a trigger instead; the ledger should get the same.

## Stock adjustment requests and the asset on a dispatch (27 October 2026)

**A correction by hand is asked for first, when the organisation says so.** Settings, Stock and prices, "How quantities change": *straight away* (as before), *by a stock adjustment request*, or *only through documents*. With requests, `quantityRequestAbove` is the value up to which a correction is still made at once (0: every one is asked for). The value of a correction is the units it adds or takes away at the item's cost at that place (`StockValuationService` average while any is held, else the last cost).

`POST /stock/adjustment-requests/change` is the one door a screen uses (the stock levels page's Adjust quantity drawer; the product page's change-quantity drawer should call it too): each line gives `counted` ("it is N") or `change`, never both, in the item's base unit; the answer is `applied` (the movements are in the ledger) or `requested` (the request, waiting or already applied when no approval policy asks for it). A person who may ask but not correct stock always raises a request; one who may correct stock but not ask is refused when a request is needed. `POST /stock/adjustments` (the old direct route) answers 409 where a request is needed, 403 where only documents change quantities.

**The request** (`item.stock_adjustment_requests`): statuses `pending_approval`, `applied`, `rejected`, `cancelled`; a reason by its code, its label as it was; a note; each line the quantity the system held (`now_quantity`, less what is held for work orders), the count if given, the signed `change_quantity`, the unit cost and `value_effect`. It is applied by `StockMovementService.postAdjustments` under the source `StockAdjustmentRequest` (reserved, so a hand-made movement cannot claim it; posted once by the request's id), by the **change**, so stock that moved between the request and its approval is not written over. An adjustment that would leave less than nothing is refused at raising, and again if stock has since fallen. The approvals policy sees `totalAmount` (the size of the change either way), `reasonCode`, `itemCount` and `locationId`.

**A vehicle or asset on a dispatch.** `assetId` on a waybill and on a stock transfer. The asset must be the organisation's, not retired, disposed, written off, missing or still a draft. The document's settings say `assetOnDispatch`: `off` (not asked for, not kept), `optional` (the default), `required` (a dispatch without one is refused with 422). Its number plate (`asset.fleet_profiles.registration`) fills the vehicle when that is empty, and satisfies "vehicle" in the waybill's "Vehicle and driver before it leaves". The web picker reads `GET /asset-pickers/dispatch`, which answers how many assets there are, the first few, and the setting, for anyone holding a waybill or transfer permission.

Tests: unit (`stock-adjustment.logic.spec.ts`, `stock-adjustment.service.spec.ts`, `stock-levels.service.spec.ts`); E2E `test/stock-adjustment-requests.e2e-spec.ts` (written, run with the round).
