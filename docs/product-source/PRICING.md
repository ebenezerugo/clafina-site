# Customer pricing: price books, agreements, tiers, commitments, rebates

> Status: **built 13 October 2026** (API and web). Tests: see "Customer
> pricing" in [STATUS.md](STATUS.md) and the Tests section below.

How the organisation prices what it sells to a particular customer, and
how that price is kept honest. Everything here is the organisation's own
policy: it chooses the precedence, the stacking and the margin floor in
settings; nothing is fixed in code. Every price path — quotations, orders,
proforma and invoices, the till, the online shop, the network's
catalogues — asks the same engine, so the price a rep sees is the price
the customer is charged. A price below the entitled price is a discount,
and the existing discount limits and approvals judge it
([SALES.md](SALES.md#discount-policies)).

## What it does

**Price books** (`/pricing/books`). A book prices items for whom it is
assigned to, between its dates, in **one currency**. Nothing is converted,
ever: a book in another currency is never compared with the price being
charged. A book is assigned to customers, organisations (the party behind
a customer), customer groups (tags), sales channels, locations, or a
currency. Its rules say what they price (one item, a category, everything;
the most specific wins) and how:

- a **fixed price**, or a **percent off** list or wholesale price, or a
  **formula** (list, wholesale or cost, plus or minus a percent and/or an
  amount);
- **rounding** (to a step such as 0.05 or 50, or to end in .99) and a
  **lowest price**;
- **quantity breaks**, counted in base units and by default across all the
  lines of one document, either **all units at the break price** or in
  **slabs** (only the units above each break). The organisation's setting
  is the default; a book or a rule can choose its own.

A book is a draft until someone puts it in force, can be copied, and is
**retired, never deleted**. Each save is a numbered revision; a stale
version is refused (409). The currency is fixed once a book has rules; a
book used by a tier or a catalogue cannot be retired. A book in force with
no rules cannot exist.

**Promotions** (`/pricing/promotions`) are books of kind promotion:
layered on top of the price the customer would otherwise pay, for a time,
with their own precedence (the best one, or all that are marked stackable,
as the setting says). A promotion can start from "the price so far".
Promotions stay off a contract-priced item unless the organisation says
otherwise.

**Agreements** (`/pricing/agreements`) are contract prices for a customer,
group or organisation. An agreement has a number (series `CPA`), an owner,
a commercial reason, dates, optional terms and, if wanted, a **named
approver**. Its life: *draft → waiting for approval → in force → ended /
retired*, or *turned back* to its author with a reason. The approver is
whoever may approve agreements and, by the setting, never its author
(`approverMustDiffer`). With an approval policy for `price_agreement` the
approval engine decides; with none, a person who may approve still decides
(`approvalNeedsPerson`), or it is approved as it is sent when that is off.
An agreement in force is changed by **amending** it: a new revision (same
number, next revision) that replaces it only when it too is approved. It
is **retired with a reason**, never deleted. History keeps every step.
An agreement is "ending soon" for `expiringSoonDays` before it ends, and
reminders are notification-centre presets (30 and 7 days before, and when
it ends), to its owner.

**Tiers** (`/pricing/tiers`). A scheme is a ladder of tiers in one
currency. Each tier has conditions on a customer's purchases — spend,
quantity, number of orders, share of invoices paid on time, average days
late — over a rolling number of days or a calendar period, in all items or
one category, with *all* or *any* of them required, and the price book
that prices the tier. A **nightly job** (and *Recalculate now*) places
every customer in the highest tier they qualify for, from posted invoices
net of credit notes. A customer who stops qualifying **keeps the tier for
the scheme's grace days**, marked falling, and then drops one step at a
time. A person can **pin** a customer to a tier (with a reason); the job
leaves a pinned customer alone until the pin is taken away. A scheme can
apply to a customer group only, and can measure an organisation and all
its people as one buyer. Every move (entered, promoted, demoted, left,
pinned, unpinned) is kept with the evidence at the time, and **a customer
or rep can see why they are in a tier and exactly what the next tier
needs** (`GET /customer-pricing/customers/:id/tiers`). A preview shows
what would move without moving anyone.

**Commitments** (`/pricing/commitments`). What a customer agreed to buy
over a period on an agreement, by quantity or by spend, for one item, a
category or everything, against what they have bought (invoiced net of
credit notes, in base units), with the pace (ahead, on track, behind), a
month-by-month series and a projection. When the period ends (the nightly
job, or *Close it now*) a shortfall becomes a **true-up**: the shortfall
at the agreed share, valued at the commitment's unit value (quantity) or
as the money short (spend). **A person approves it** — it can be reduced
with a reason, never raised — and approving makes a **draft AR invoice**
to the customer for the approved charge; a person turns it back with a
reason. Nothing is billed without that person.

**Rebates** (`/pricing/rebates`). What a customer earns back for buying
more: tiers by spend or quantity, paid as a percent of spend or an amount
a unit, **retroactive** (the reached rate applies to everything bought) or
**incremental** (each rate only above its start), over the agreement or
each year, quarter or month. The amount earned so far is **booked as a
liability as the customer buys** (Dr rebates given 4320, Cr customer
rebates owed 2450, by the posting roles `rebates_given` and
`rebates_payable`), once per change (idempotent: running it twice books
nothing more). When a period ends a **settlement** waits for a person, who
approves it as a **credit note** on the customer's account, turns it back
with a reason (it can be prepared again), or **waives** the rebate for that
period with a reason (the accrual is reversed). The system pays nothing
out. Anything that could not be booked is shown on the rebate and in the
accruals report.

**Price check** (`/pricing/check`, `POST /customer-pricing/explain`). What a
customer would pay for some items on a day, and exactly why: which
agreement, tier or book priced it, what else was considered, which
promotions applied. The engine can also answer **as of a past day**, which
is how the exceptions report judges an old invoice by the agreement then in
force.

**A customer's pricing page** (the *Pricing* tab on a customer,
`?tab=pricing`): the books and agreements that reach them and why, their
tier and what the next needs, commitments and rebates with progress, and
recent tier moves.

**Reports** (`/pricing/reports`): margin and discount per customer (cost
from the item's cost price; says so when none is recorded), agreement and
commitment utilisation, rebate accruals (earned, booked, settled, still
owed, what is not in the books), and invoices against agreements
(undercharged or overcharged, each with the reason).

## Which price wins

Set under **Sales pricing** settings:

- `precedence`: `ordered` — the first kind in the order wins even if
  another is cheaper — or `best_price` — the lowest of every book and the
  list price.
- `precedenceOrder`: contract, customer, party, tier, group, channel,
  location, currency; highest first. A kind left out still prices an item,
  after the others. Edited with the *ordered choices* control.
- `quantityBreakMode`, `breaksAcrossLines`, `promotions` (`best` or
  `stack`), `promotionsOverContracts`.
- `repDiscounts`: `stack` (a person may still give a discount within their
  limits) or `not_on_special_prices`; `priceChanges`; `marginFloor`
  (`off`, `refuse`, `approval`) with `minimumMarginPercent` over cost.

Inside one kind, the book with the lower `priority` number wins a tie; a
book with the nearest assignment (customer over group) wins within a kind.

## Do the prices hold the tax? (tax engine, step 2)

A price book carries `pricesIncludeTax` (`true`, `false` or null, set on the price list screen and returned by the books API). A sales channel has the same flag. A new sales document starts as: what the document says, else its price list's flag, else its channel's, else its document settings; `GET /sales-form/price-treatment` says which decided. Where the Sales pricing setting *A document may be priced from a price list chosen by hand* is on, `POST /sales-pricing/resolve` and the discount check take a `priceListId`, and a document saved with `priceListForced: true` is priced from that list alone (it must be in force). See [TAX_ENGINE.md](TAX_ENGINE.md#prices-that-hold-the-tax-price-list-channel-forced-list).

## Where the price is used

`PricingEngineService` (module `customer-pricing/engine`) is the one
resolver. `SalesPricingService` (the "pricing from the price book"
resolver in `item/pricing`) calls it, so `DiscountPolicyService.judge`
sees the entitled price as the list for quotations, sales orders, proforma
and AR invoices (they pass the customer's party and the channel).
`ChannelPricesService` prices the till and the online shop's company
shoppers; the trading network's catalogues can be scoped to one price book
(`network.catalogues.price_book_id`). Authority is never taken from a
client: a price typed below the entitled price is a discount; one above is
allowed when `priceAboveList` says so.

## Data

Schema `pricing` (migrations `1781500000000`–`1781500000300`; every table
has `organization_id` first in its key):

| Table | Holds |
|---|---|
| `price_books` | kind (book, contract, promotion), status, dates, priority, stackable, break mode, version |
| `price_book_assignments` | who a book is for (customer, party, group, channel, location, currency) |
| `price_rules` | one rule: target, method, basis, value, rounding, floor, breaks |
| `book_revisions` | every saved version of a book, as JSON |
| `agreements` | the contract over a book: number, revision, owner, approver, reason, terms, approval |
| `events` | the history of books and agreements |
| `tier_schemes`, `tiers`, `tier_memberships`, `tier_moves`, `tier_runs` | tiers, where each customer is, every move, every run |
| `commitments`, `trueups` | what was agreed, and the true-up a person approves (`invoice_id` of the draft invoice) |
| `rebates`, `rebate_periods`, `rebate_accruals`, `rebate_settlements` | rebate terms, each period, what was booked, the settlement (`memo_id` of the credit note) |

Also: `network.catalogues.price_book_id`; `sale.gift_cards.expiry_*` and the
movement kinds `expire`, `restore` (below); ledger accounts 2450, 4320 and
4820 with posting roles `rebates_payable`, `rebates_given`,
`gift_card_breakage`.

## API

Routes (all `/api/v1`, all `organization`-scoped):

- `customer-price-books` — list, `choices` (pickers), one, revisions,
  history, create, update (`expectedVersion`), `:id/activate`, `:id/retire`,
  `:id/copy`. (Not `/price-books`: that is the catalogue's price list.)
- `promotions` — the same for promotions.
- `price-agreements` — list, one, history, create, update (a draft or one
  turned back), `submit`, `withdraw`, `amend`, `approve`, `reject`, `retire`.
- `price-tiers` — `schemes` (list, one, create, update, `preview`, `pause`,
  `resume`, `retire`, `members`, `pin`, `unpin`), `moves`, `runs`.
- `price-commitments` — list, one, create, update, `close`, `retire`,
  `true-up` (prepare again), `true-ups` (list, one, `approve`, `reject`).
- `price-rebates` — list, one, create, update, `retire`, `recalculate`,
  `settlements` (list, one, `approve`, `reject`), `periods/:id/waive`,
  `periods/:id/settlement` (prepare again).
- `customer-pricing` — `customers/:id` (the pricing page),
  `customers/:id/tiers`, `explain` (the price check).
- `pricing-reports` — `margin`, `utilisation`, `rebate-accruals`, `exceptions`.
- `sales-pricing/resolve` (existing) now returns the explanation.
- `gift-card-expiry` — expired balances, `run`, `:cardId/reverse`.
- Channel API (`channel/v1`, the channel's own key): `POST prices` (the online
  shop, for a company shopper's or customer's prices) and
  `POST pos/tills/:tillId/prices` (the till).

Refusals are in words: DTO problems are 422, a service refusal 400, a
state conflict 409, a missing right 403, someone else's record 404.

## Settings and permissions

Document settings **Customer pricing** (`customer-pricing`):
`requireCommercialReason`, `requireEndDate`, `approverMustDiffer`,
`approvalNeedsPerson`, `expiringSoonDays`, `runTiersNightly`,
`closeCommitmentsAutomatically`, `accrueRebates`, `settlementsNeedPerson`.
**Sales pricing** gains the precedence, break and stacking settings above.
**Gift cards** (`gift-card`, new): `expiredBalance`
(`keep_liability` or `recognise_income`) and `recogniseAfterDays`.
**Network**: `sharedCertificates` — `review` (default: a person accepts a shared
certificate first) or `auto_file` (it is filed in the supplier's compliance
file as it arrives).

Permissions (seed v86): `trade.pricing.read`, `.books.manage`,
`.promotions.manage`, `.agreements.create`, `.agreements.approve`,
`.tiers.manage`, `.commitments.manage` (commitments and rebate terms),
`.settlements.approve` (true-ups, settlements, waiving a rebate) and
`.reports.view`. Owners and administrators hold all of them; managers read and
draft agreements (`.read`, `.create`); viewers read. Approval of agreements, true-ups and settlements honours
`approverMustDiffer` and, where there is a policy, the approval engine
(`PRICE_AGREEMENT`, `COMMITMENT_TRUEUP`, `REBATE_SETTLEMENT`).

## Jobs, events and notices

The queue `customer-pricing` runs one scheduled job at 01:30 each night: it
places customers in tiers, closes commitments that ended and prepares their
true-ups, accrues rebates and prepares settlements, and reminds of
agreements ending. Each organisation is handled on its own, and a failure
in one is recorded and does not stop the others.

Events (all carry `organizationId`): `PriceAgreement`, `PricingTierMove`,
`CommitmentTrueUp`, `RebateSettlement`. Notification subjects
`price-agreement`, `commitment-trueup`, `rebate-settlement`, and presets
for approval waiting, decided, ending in a month and a week, ended, a
customer promoted or demoted, a true-up and a settlement waiting.

## Expired gift-card balances

The second setting asked for the same day. By default an expired gift
card's balance stays a liability to its holder. With `expiredBalance:
recognise_income` the nightly job, `recogniseAfterDays` after the expiry,
books it (Dr gift cards owed, Cr income from expired gift cards, posting
role `gift_card_breakage`), takes the card's balance to nothing and records
the movement. A person with `trade.gift-cards.manage` can **reverse** one
with a reason: the entry is reversed, the balance restored, and the card
can be given a new last day. Screen: Sales → Expired gift-card balances.

## Shared certificates on the network

Network setting `sharedCertificates`: `auto_file` (a certificate, tax,
registration or insurance document a connection that is one of the
organisation's suppliers shares is filed in that supplier's compliance file
under the certificate type that fits, as it arrives; one that cannot be
filed this way is left for a person with the reason, and a document can still
be rejected afterwards) or `review` (the default: it waits for a person to
accept and file it).

## Web

Pricing in the main menu (`/pricing`): price books, promotions, agreements
(a list and a page with the approval actions), tiers (schemes, members and
pinning, moves, runs), commitments and true-ups, rebates and settlements,
price check, reports. A customer's page has a *Pricing* tab; the network
catalogue form can name a price book; Admin → Document settings edits the
precedence order. Creating and changing is in a drawer from a header
button; several row actions are behind one *Actions* menu; every list says
a failure apart from nothing there (`ui-list-state`); a person who may
only look sees no buttons.

## Tests

- Unit: `engine/pricing-engine.logic.spec.ts` (80), `books`, `agreements`,
  `tiers`, `commitments`, `rebates` logic specs, `network/shared-certificate-filing.spec.ts`.
- Endpoint (whole app, `test/`): `customer-pricing-books.e2e-spec.ts`
  (books, precedence, breaks, promotions, judge, margin floor, permissions,
  tenancy), `customer-pricing-agreements.e2e-spec.ts` (approval, named
  approver, amendments, expiry, permissions),
  `customer-pricing-behaviour.e2e-spec.ts` (tiers, commitments and true-ups,
  rebates and settlements, reports, the customer's page).
- Tenancy sweep: `TENANCY_ROUTES=/api/v1/customer-price-books/` and the
  other routes above.
- Web: `pricing.logic.spec.ts`; Cypress `customer-pricing.cy.ts` (stubbed,
  axe on each screen and drawer) and `live/customer-pricing.cy.ts`.

## Known limits

- Price conversion between currencies does not exist by design: a book, an
  agreement and a tier scheme each have one currency, and an invoice in
  another currency is not counted for a scheme or a commitment.
- Margin uses the item's recorded cost price, not the cost of each unit
  sold; where none is recorded the report says so rather than guess.
- A rebate is accrued on posted invoices net of credit notes; a document
  posted late into a closed period is picked up the next night and
  settled with the next settlement.
- Real payment of a rebate or collection of a true-up is not made here: the
  credit note and the draft invoice go through the ordinary documents.
- Tier moves and runs are kept forever; there is no purge.

## History

- 13 October 2026 — built: price books and promotions, agreements and their
  approval, tiers, commitments and true-ups, rebates and settlements,
  precedence/stacking/margin floor in `judge()`, every price path, the
  reports, the two organisation settings (shared certificates, expired
  gift-card balances).
