# Sales: quotation to receipt

> Status: **current** — checked against the code on 5 October 2026 (Phase
> 5 step 3, sales in the ledger). Tests: see the "Sales: quotation →
> receipt" and "Sales in the ledger" rows in [STATUS.md](STATUS.md).

A sale is four documents. A **quotation** offers prices to a customer. A
**sales order** records what the customer agreed to buy, and fulfilling it
takes the goods out of stock. An **invoice** says what the customer owes.
A **receipt** records money received and settles invoices with it. Each
can be made on its own (ROADMAP 4.8). Converting one into the next only
fills in the new document; it is never required unless a setting says so.
ROADMAP Phase 4.

## What it does

Every document starts as a **draft**. Only a draft can be edited or
deleted. Past that, it has been approved, sent, posted or paid, and other
records rely on it: you cancel or void it instead.

**Submitting** gives the document its next step:

- Where the organisation has an approval policy for that kind of
  document, it waits for approval (*approval pending*). An approver
  approves it, or rejects it back to draft with a reason.
- With no policy, it is approved as it is submitted.
- Every document is numbered when it is made, from the number series for
  its kind and location.

Each step starts only from the statuses below. Every other status is
refused, with the reason in words.

**Quotation** (statuses in capitals, as the API stores them)

| Step | From | To |
|---|---|---|
| Submit | DRAFT, still valid | APPROVED, or APPROVAL_PENDING with a policy |
| Approve / reject | APPROVAL_PENDING | APPROVED / DRAFT |
| Mark as sent (or share it, [SHARING.md](SHARING.md)) | APPROVED, still valid | SENT |
| Customer accepted / declined | SENT | ACCEPTED / REJECTED |
| Make a sales order | ACCEPTED, with product lines only | CONVERTED |
| Cancel | anything but CONVERTED or CANCELLED | CANCELLED |

**Sales order**

| Step | From | To |
|---|---|---|
| Submit, approve, reject | as for a quotation | |
| Confirm | approved | confirmed |
| Fulfil | confirmed | fulfilled: the goods leave stock, unless a waybill dispatches the order |
| Invoice it | fulfilled, with a location and lines | invoiced: a draft invoice at the order's prices, due by its payment terms |
| Cancel | anything but fulfilled, invoiced or cancelled | cancelled |

**Invoice**

| Step | From | To |
|---|---|---|
| Submit, approve, reject | as above | |
| Post | approved | posted: the customer owes it. An invoice written directly takes its goods out of stock, where the organisation wants that |
| Cancel | draft, approval pending, approved | cancelled |
| Void | posted, with nothing paid on it | void: what posting took out of stock goes back |

**Receipt**

| Step | From | To |
|---|---|---|
| Submit, approve, reject | as above | |
| Post | approved | posted: each allocation settles its invoice |
| Void | posted | voided: each invoice it paid is owed again |

The money rules:

- **Amounts** must be numbers above zero: the receipt, and each allocation
  on it.
- **A receipt never applies more than it brought in.** Its allocations
  never total more than its amount.
- **What it does not apply is credit on the customer's account**, where
  the organisation allows it (receipt setting *allow on account*). Where
  it does not, a receipt must be allocated in full before it is posted.
  Credit is spent later from the receipt, against the customer's other
  invoices, and never twice.
- **A payment settles only the paying customer's invoice**, only a posted
  or part-paid one, and never for more than is still owed. Two payments
  at once cannot both take the last of the same invoice: each reads it
  under a row lock.
- **An invoice is part paid until nothing is owed, then paid.** Voiding a
  receipt gives each invoice its money back, and it returns to part paid,
  or to posted when none is left paid.
- **An invoice with a payment on it cannot be voided.** The receipts that
  paid it are voided first.
- **Totals are worked out from the lines**, whatever total a request
  sends. A line is quantity × price, less its discount, plus its tax. The
  header adds up the lines. An invoice line given a tax rate and no tax
  amount works the amount out from the rate.

## Units: every line keeps the unit it is written in

(ROADMAP Phase 4's remainder; UNIT_OF_MEASURE.md §13.) A quotation,
order, waybill or invoice line may be written in any of the
organisation's units of its item's kind — 2 CASE24 of a drink counted in
EA — and keeps three things beside the quantity typed: `uom_id`,
`base_quantity` (48) and `conversion_factor` (24), as goods receipt lines
do. Settled when the line is saved, whichever way it is written — the
form, a conversion from another document, an import — by
`SalesLineUnitsSubscriber` (`trade/sales/common`): a unit by `uomId`; else
the free-text `uom` read as the ledger reads it (code, symbol, name of a
unit of the item's kind); else the base unit. A unit that is not the
organisation's, or measures something else, is refused (400). Text that
names no unit ("bag") is the organisation's own word for the base unit
and kept as written. A line saved again unchanged keeps its snapshot, so
a pack size changed later does not rewrite it.

- **Stock moves by the line's own factor**: fulfilling an order, posting
  a stand-alone invoice (and voiding it), dispatching a waybill — each
  movement is recorded in the line's unit with the snapshot it kept
  (`stockLineOf` → `postDocument`'s `measure`). Two cases sold when a case
  held 24 take 48 out, though the case holds 20 by fulfilment.
- **Counted in base units, item by item**: "never deliver more than was
  ordered" and what an order has left (`/waybills/from-sales-order`) add
  `base_quantity` across units — an order by the case, a waybill singly.
  What is left is shown in the unit the order first sold it in when it is
  whole to a thousandth there (1.5 CASE24), else in the base unit.
- **Discount rules' quantities** ("10 or more") are measured in base
  units: five cases of 24 are 120. The forms' warning sends the base
  quantity it worked out; posting reads the stored one.
- **The form**: a *Unit* beside each line's quantity, offering the units
  of its item's kind (`GET /uoms`, the same permission as picking the item
  — `inventory.products.read`); choosing one suggests its price as that
  many of the item's single price (a suggestion: a case may sell for less);
  "= 48 EA" under the quantity; the line sends `uomId`. The waybill form
  offers the organisation's units as its unit field is typed. The price
  list's rows now carry `baseUomId`.
- Lines written before this (or by a raw insert) carry no snapshot and are
  read as base units; the migration (1780310400000) backfilled every
  existing line the ledger's way.

## In the ledger

Invoices and receipts post their journal entries as they happen (ROADMAP
Phase 5 step 3), by role, to the accounts the organisation chose (Finance ›
Posting accounts; FINANCE.md):

| Event | Entry |
|---|---|
| Invoice posted | Dr receivables at its total; Cr revenue per line, net of its discount (per category, inventory type or location where the organisation set one); Cr output VAT for its tax; anything the header takes off beyond the lines, Dr discounts given. Its goods' cost is stock's entry (STOCK.md): Dr cost of sales, Cr stock |
| Invoice voided | The invoice's entry reversed (and its goods' cost, as the stock comes back: `stock:ArInvoiceVoid`, Dr stock, Cr cost of sales — posted since 31 October 2026, see below) |
| Customer credit note with goods back (`restock` lines) | The note's entry (Dr revenue, Dr output VAT, Cr receivables / deposits), and the goods back into stock where the invoice sold them from, at what they left at: `stock:CustomerReturn`, Dr stock, Cr cost of sales. Reversing the note takes them out again (`CustomerReturnReversal`) |
| Receipt posted | Dr the bank account's ledger account at the amount; Dr bank charges for the `fees`; Cr receivables for each invoice it settles, at the rate that invoice was raised at; Cr customer deposits for the rest. A foreign receipt at a different rate posts the difference to exchange gain or loss, a line per invoice narrated "Realised exchange gain (loss) on <invoice number>" |
| Credit applied later (`/ar-receipts/:id/allocations`) | Dr customer deposits, Cr receivables — one entry per application |
| Receipt voided | The receipt's entry and each of its credit applications (and releases) reversed. A receipt with refunds is not voided (PAYMENTS.md) |
| Released for a refund (`ar-release`, Phase 4.10) | Dr receivables, Cr customer deposits: the invoice owes it again; kept on the receipt as an allocation of minus the amount |
| Bad debt written off (`/ar-invoices/:id/write-off`) | Dr bad debts, Cr receivables; the amount comes off what is owed, under the same lock as a payment. With bad-debt VAT relief, the VAT in it (written off × the invoice's tax ÷ its total) goes Dr to the output VAT accounts the invoice credited, by code, and only the rest to bad debts (see *VAT on sales* below) |

The entry is written once the document is saved, in its transaction. If
the books refuse it — a closed period, a role with no account, a currency
with no rate — the document still stands and the entry waits in the
backlog (`/finance/books/backlog`) until it can post. A posted document
records its batch (`posting_batch_id`); one still null is waiting.
Receivables in the ledger equal what customers owe on posted invoices —
the endpoint tests check it after every step.

Each document posts once per event: posting twice, or a retry, finds the
first entry.

## How it works

- `src/modules/trade/sales/`: one folder per document (`quotation`,
  `sales-order`, `ar-invoice`, `ar-receipt`), each with a controller,
  thin use cases, and a service that holds the rules. Mappers work out
  the totals.
- **Converting** calls the next document's own `create`. A conversion that
  fails leaves the first document where it was: no quotation is marked
  converted without its order, and no order is marked invoiced without its
  invoice.
- **Stock**: fulfilling an order posts an issue through
  `StockMovementService`, unless a live waybill references the order, so
  the stock is never taken out twice. Posting an invoice written directly
  does the same when `standaloneIssuesStock` is on, in the same
  transaction, so a refusal (not for sale, not enough on hand) refuses the
  posting. Voiding puts it back.
- **Payments**: `ArInvoiceService.allocatePayment` and `reverseAllocation`
  read the invoice `FOR UPDATE` and save it through the repository, so the
  change raises the invoice's update event. Posting a receipt applies its
  allocations before marking it posted, so a refusal leaves it unposted.
- **Tenancy**: every document carries `organization_id`, and every read
  names it. Row-level security and the tenant-scoped reads keep one
  organisation's documents from another's.
- **Events**: each document raises created, updated and deleted events
  through the outbox ([OUTBOX.md](OUTBOX.md)). Live screens hear about
  other people's changes from them, and so do the summaries.

## Data

| Table | Distributed on | Holds |
|---|---|---|
| `sale.quotations`, `sale.sales_quotation_lines`, `sale.quotation_attachments` | `organization_id` | Quotations: customer, location, dates, currency, totals, status, approval context (sent, accepted, converted to which order). |
| `sale.sales_orders`, `sale.sales_order_lines` | `organization_id` | Orders: customer, bill-to and ship-to, payment terms, totals, status, context (from which quotation, invoiced as which invoice). |
| `ar_invoice.ar_invoices`, `ar_invoice.ar_invoice_lines` | `organization_id` | Invoices: customer, dates, totals, amount still owed, status, extras (source order, payments, stock issued). |
| `ar_receipt.ar_receipts`, `sale.ar_receipt_allocations` | `organization_id` | Receipts: amount, method, bank account, status; allocations to invoices. |

## API

All are under `/api/v1/` and need signing in. Each kind of document has
its own permissions: `trade.quotations.*`, `trade.sales-orders.*`,
`trade.ar-invoices.*`, `trade.ar-receipts.*`.

| Method | Path | Permission | What it does |
|---|---|---|---|
| POST | `/{kind}` | `.create` | Makes a draft. |
| GET | `/{kind}`, `/{kind}/:id` | `.read` | A page (newest first, searchable), or one. |
| PATCH | `/{kind}/:id` | `.update` | Edits a draft. |
| DELETE | `/{kind}/:id` | `.update` | Deletes a draft. |
| POST | `/{kind}/:id/submit-for-approval`, `/approve`, `/reject` | `.approve` | Submits; an approver decides. While the document has an approval request in review, `/approve` and `/reject` answer 409 `APPROVAL_IN_REVIEW`: its approvers decide it in the inbox ([APPROVALS.md](APPROVALS.md)). |
| POST | `/quotations/:id/send`, `/accept`, `/reject-quote`, `/convert-to-sales-order`, `/cancel` | `trade.quotations.approve` | The quotation's steps. |
| POST | `/sales-orders/:id/confirm`, `/fulfill`, `/convert-to-invoice`, `/cancel` | `trade.sales-orders.approve` | The order's steps. |
| POST | `/ar-invoices/:id/post`, `/cancel`, `/void` | `trade.ar-invoices.approve` | The invoice's steps. |
| POST | `/ar-invoices/:id/write-off` | `trade.ar-invoices.approve` | `{ amount, reason, vatRelief? }`: writes off a bad debt — only a posted invoice still owed, not more than is owed. `vatRelief` empty: what the invoice settings allow; `false` leaves the VAT in bad debts; `true` where it is not allowed is a 400. |
| GET | `/ar-invoices/:id/tax-result` | `trade.ar-invoices.read` | Read live (not from the cached invoice): `salesVat` (the VAT warning, below) and `badDebtRelief` (`available`, `setting`, `basis`, `vatOfAmountDue`). |
| GET | `/ar-invoices/open?customerId=` | `trade.ar-invoices.read` | A customer's invoices still owed. |
| POST | `/ar-receipts/:id/post`, `/void` | `trade.ar-receipts.approve` | The receipt's steps. |
| POST | `/ar-receipts/:id/allocations` | `trade.ar-receipts.approve` | Spends a posted receipt's credit on invoices. |
| GET | `/ar-receipts/credit?customerId=` | `trade.ar-receipts.read` | A customer's receipts with credit left. |
| GET | `/locations/mine?for=…` | none (signed in) | The locations where the person holds any of the permissions named: every one for an owner or an organisation-wide grant. The forms' "sell from". |
| GET | `/banks/accounts/receiving` | `finance.bank.read` or `trade.ar-receipts.create` | Active bank accounts by name and currency, without balances, for recording receipts. |

`{kind}` is `quotations`, `sales-orders`, `ar-invoices` or `ar-receipts`.

Errors: `400` for a step from the wrong status (the message names the
status and what to do instead), an id that is not a UUID, an amount that
is not a number above zero, more than is owed, another customer's invoice,
a receipt allocated beyond its amount. `422` for a body that fails
validation. `403` without the permission, or for an approval step on a
document not waiting for approval. `404` for a document that is not there
or not this organisation's.

## Settings and permissions

Admin → Document settings ([document settings](../src/modules/document-settings)),
for the organisation or a location:

- **Sales order**: `requireQuotation`: an order must come from a quotation.
- **Invoice**: `requireSalesOrder`, and `standaloneIssuesStock`: posting an
  invoice written directly takes its goods out of stock. On by default.
  `taxBadDebtRelief` (*Claim back the VAT on a bad debt*): `country` (the
  default: as the adopted country preset says), `on`, `off`.
- **Receipt**: `allowOnAccount`: what a receipt does not apply is kept as
  credit. When off, a receipt must be allocated in full to post.
- **Quotation and invoice**: sharing and reminders ([SHARING.md](SHARING.md)).

Approval policies (Approvals) decide whether submitting waits for an
approver.

## Web

`commerce-web/src/app/features/sales/` (NgRx store `sales`):

- **Lists** (`/sales/quotations`, `/orders`, `/invoices`, `/receipts`):
  number, customer, date, status and total, plus still owed for invoices.
  They show loading, empty with what to do, a failure with Try again (never
  "nothing here"), searching and pages. They follow other people's changes
  live. **New** appears only for someone who may make one.
- **A document** (`/sales/{kind}/:id`): its facts, lines and totals, and
  where it came from and went. Its **next steps** are only those the
  server accepts from its status, and only those the person may take.
  Steps that cannot be undone (post, cancel, void, fulfil, decline) are
  asked first, with *Go back* and the step's own name. A refusal is shown
  in the server's words, and a conversion opens the new document. An
  invoice adds **Record a payment** (a draft receipt for what is owed,
  opened) and the credit on account. A quotation or invoice adds sharing
  and the PDF. Invoices and receipts add **Till slip** (the PDF on an 80 mm roll)
  and **For a receipt printer** (ESC/POS), Studio step 7 (STUDIO.md).
- **Forms**: new quotation, order or invoice (customer, where it sells
  from, dates, items priced at that location), and new receipt. They say
  what is still missing before they can be saved.
- **Routes** are guarded by each kind's read or create permission;
  without it, `/unauthorized`.

## Tests

| Kind | Where | Run with |
|---|---|---|
| API unit specs | `quotation.service.spec.ts`, `sales-order.service.spec.ts`, `ar-invoice.service.spec.ts`, `ar-receipt.service.spec.ts`: every step tried from every status, plus the money rules. `sales-totals.spec.ts`: totals. `tenant/location/services/workplaces.service.spec.ts` | `npm test -- trade/sales` |
| Endpoint tests | `test/sales.e2e-spec.ts`: every route's permission, ids and amounts refused before a use case runs, `locations/mine` and the receiving accounts. `test/sales-ledger.e2e-spec.ts`: an invoice's entry and its goods' cost, a receipt with a deposit, credit applied later, a write-off, both voids, a foreign receipt's exchange gain, nothing left waiting — receivables equal what is owed after each; another organisation reaches none of it | `npm run test:e2e` |
| Drill | `src/modules/trade/sales/sales-drill.ts`, in the test organisation (39 checks, the invoice's entry and the receipts clearing it included; the journal entries are removed with the documents): a quotation through order, fulfilment (stock), invoice, posting and two receipts, with what must be refused — a receipt for more than it holds, another customer's, deleting a posted invoice | `npm run drills -- sales` |
| Web unit specs | `features/sales/…`: models (each button only from a status the API accepts), service, effects, store | `npm test` (web) |
| Cypress | `cypress/e2e/sales.cy.ts` (17: lists, steps by status and permission, confirming, refusals, a conversion, voiding, the form), `cypress/e2e/live/sales.cy.ts` (a quotation from the form to an order; a payment posted and voided; a viewer) | `npm run test:e2e:ci`, `npm run test:e2e:live` (web) |

## Discount policies

How far a discount may go on quotations, sales orders and invoices, and
above what an approver decides (`item/discount-policy`, 7 October 2026).
Sales → Discount policies.

- **A policy** has a name, dates it is in force between (open either
  way), a limit for anything no rule covers (a percent, an amount off a
  line; empty for none) and **rules**. A rule covers what it names — one
  item, a category or an inventory type (at the document's location);
  customers in a group (a tag on the customer); documents written by staff
  in a job function (HR); quotations, orders or invoices; a quantity band
  — and anything it leaves empty. Each rule has a limit (percent, amount)
  and/or an approval threshold (percent, amount). Percentages are percent
  (5 = 5%); stored as fractions.
- **Judged per line**: the line's discount against what it would have
  cost. In each policy in force the rule that fits most closely decides
  (an item over a category over an inventory type, then a group, a job
  function, a document); none fitting, the policy's own limit. Across
  policies the strictest limit and threshold win.
- **Over a limit is refused** (400 naming the line, the percent and the
  policy) when a quotation, order or invoice is written by a person, and
  again when it is sent for approval (whatever changed its lines since).
  One made by converting another is judged when it is sent.
- **Over a threshold an approver decides.** Sending it gives the approval
  engine `discountPercent` (the largest line's), `discountAmount` (all
  lines) and `discountNeedsApproval` (yes/no); an approval policy uses
  them like any fact (Approvals → Policies, "when Discount needs approval
  is yes"). When one needs an approver and no approval policy would ask
  anyone, sending is refused — a discount that needs approval is never
  approved by nobody.
- **The forms** ask `POST /discount-policies/check` as lines change and
  say what would be refused or need approval before saving.
- **API**: `GET/POST /discount-policies`, `GET/PATCH/DELETE /:id` (a
  policy written as a whole: the rules sent replace its rules; delete sets
  it aside, out of force, kept), `GET /choices?kind=item|category|
  inventory-type|customer-group|job-function` (what a rule may name, under
  the policies' own permission), `POST /check`. Permissions
  `inventory.discount-policies.*`; `check` for whoever may write a sales
  document.
- **Tests**: `discount-judgement.spec` (5), `discount-policies.e2e-spec`
  (4: written and checked, refused on all three documents, a group's
  larger limit, the threshold sent to an approver or refused without one,
  facts in the request, rewritten and set aside); web
  `discount-policy.models.spec`, Cypress `discount-policies` (3) and the
  form's warning in `sales`.

## Pricing from the price book

Which price a sales line takes, and how far a person may move it (asked 9
October 2026; `item/pricing`, settings **Sales pricing**, per organisation
or location).

- **Choosing an item fills its list price** (`POST /sales-pricing/resolve`,
  as the customer, the location, a quantity or a unit changes): the price
  book in force at the location — the **base** price, or the **wholesale**
  price when the settings say so or the customer is in one of the
  wholesale groups (tags); the deepest **quantity break** reached, when
  lower; less the **book's own discount**; in the line's unit (a case is
  its singles). A line still at its list price follows a new one; a price
  someone typed is kept. Each line shows its list price and how far below
  it the price is.
- **Moving the price** (`priceChanges`):
  - *Lower within discount limits* (default): a price typed below the list
    is judged as the list price with the difference off — added to the
    line's discount — so each person's **discount policy limits and
    approval thresholds** hold, on quotations, sales orders and invoices,
    as they are written, changed and sent, and in the form's check.
  - *Locked*: the list price stands (the field is read-only); prices come
    down only by the discount field, within the limits.
  - *Free*: the price is not measured against the list (discounts still
    are).
  A price above the list can be refused (`priceAboveList`), and an item
  with no price in force at the location (`unpricedItems: refuse`).
- A negotiated price is always a discount on the quoted price, and a
  revision cannot lower a quoted price (see Negotiating a quotation).
- **Tests**: `pricing.logic.spec` (7), `sales-pricing.e2e-spec` (7: base
  and quantity breaks; wholesale by group or setting, a stranger's group
  refused; below the list over the limit refused on all three documents
  and in the check; locked; free; unpriced refused; another
  organisation), Cypress `sales-pricing` (4, axe), web
  `sales-pricing.spec`.

## Customer pricing (13 October 2026)

The price a customer is entitled to now comes from more than the price
book of the stock: customer, group and channel price books, contract
prices (agreements), tiers from how they buy, and promotions, in the order
the organisation chooses. Quotations, orders, proforma and AR invoices
ask the same resolver and pass the customer's organisation and the channel;
a price below the entitled price is a discount judged by the person's
limits, and the organisation can forbid discounts on special prices or set a
margin floor. See [PRICING.md](PRICING.md).

## Negotiating a quotation

A customer answers a shared quotation with the prices they propose, and
the organisation answers them (asked 9 October 2026;
`trade/sales/quotation/negotiation`). Every round is kept.

- **The customer proposes** from the shared page (`POST
  /public/shares/counter`): a price a unit for the lines they want lower,
  a message, their name — what it comes to worked out as they type. Not
  above what was offered, at least one line lower; refused further below
  the offer than the organisation will consider online
  (`counterFloorPercent`), or once they have made as many as it allows
  (`maxCounterRounds`, 3). The quotation becomes **COUNTERED** and waits;
  reminders stop; whoever made it and the customer's account manager are
  told (`quotation-countered`).
- **Staff see it beside the offer** (`GET /quotations/:id/negotiation`):
  each line offered and asked, how far below, and what the discount limits
  say of accepting it — refused, needing an approver, or within them.
- **Accept their prices** (`POST …/counter-offers/:id/accept`). The quoted
  price stays and the difference becomes the line's **discount** (tax at
  the line's own rate), so the discount policies judge it like any other:
  over a limit it is refused; over a threshold it goes to an approver (the
  `agreement` process — the lines show the agreed prices to the approver,
  and a rejection puts the offer back and the proposal waits again);
  otherwise the quotation is **accepted in the customer's name** and the
  agreed offer kept as the next revision. The customer is emailed.
- **Decline** (`…/decline`, with a note they read): the offer stands, the
  quotation is SENT again, they may accept it or propose again.
- **Make another offer** (`POST /quotations/:id/revise`, with what
  changes): back to draft as the next **revision**, answering a proposal
  waiting. A revised quotation's quoted prices only stay or go up —
  lowering one is refused ("keep that price and give a discount") — and
  its discounts are held to the limits as it is saved and sent. It is
  approved and sent again as any quotation.
- **The customer sees** the last offer issued — never a revision being
  prepared, nor their proposal's prices before they are agreed — with
  "your proposal is with them" or "a new offer is being prepared", and
  every proposal they made and what became of it.
- **Data**: `sale.quotations.revision`, `.counter_rounds`;
  `sale.quotation_revisions` (each offer as issued — sent, or agreed from a
  proposal — lines and totals frozen); `sale.quotation_counter_offers`
  (each proposal beside the offer, its message, who, from which link, and
  its answer; at most one open). Migration `1780312600000`.
- **Settings** (Quotations): `shareAllowCounter` (on),
  `maxCounterRounds` (3), `counterFloorPercent` (none).
- **Screens**: on the shared page, "Propose other prices" beside Accept
  and Decline; on a quotation's page, the **Negotiation** panel (the
  proposal waiting, its answers, every offer and proposal). Status
  COUNTERED reads "Customer proposed other prices".
- **Tests**: `negotiation.logic.spec` (7), `public-shares.service.spec`
  (+2), `quotation-negotiation.e2e-spec` (6: proposed and waiting; accepted
  as discounts in their name, every offer kept, the customer written to;
  declined until proposals run out, then accepted as offered; under an
  approval policy, rejected then approved; over a limit, revised — no price
  lowered, the customer seeing the last offer until the new one is sent;
  another organisation), `sharing.e2e-spec` (the route), Cypress
  `quotation-negotiation` (8, axe).

## Proforma invoices

*Customer account numbers (9 October 2026):* with **Give each customer an
account number of their own** on, a proforma's payment details start with
the customer's collection wallet account number (their own, opened the
first time; see [FINANCE_MANAGEMENT.md](FINANCE_MANAGEMENT.md#wallets-step-15)),
and what they pay into it becomes their receipt by itself.

A proforma tells the customer what they will be invoiced and asks them to
pay — the whole amount or a deposit — before the goods or services are
supplied (asked 9 October 2026; `trade/sales/proforma-invoice`). It is
**never posted**: nothing is owed, no revenue is earned, no tax falls due
on it. What the customer pays against it is an ordinary receipt, posted to
the bank and held as their credit (**Dr bank, Cr customer deposits**), and
that credit settles the final invoice when the invoice is posted.

- **Written** directly (`POST /proforma-invoices`, numbered PFI), or made
  from what was agreed (`POST /proforma-invoices/from`): an approved, sent
  or accepted **quotation** (its lines and prices; the quotation then
  cannot be converted around it — "convert the proforma, so what the
  customer paid follows the order"), or an approved **sales order** not
  yet invoiced (a deposit on the order). One live proforma per quotation
  or order. Lines are priced and judged by the discount policies as a
  quotation's are; totals are summed on the server.
- **The settings decide what it asks and how to pay** (asked 9 October
  2026: a business with many people writing proformas controls its terms).
  The deposit — the whole total or a percentage — and the payment
  instructions are set per organisation or location. Whoever writes a
  proforma changes the deposit only as `depositChanges` allows: **locked**
  (the default — the form shows it, and the server refuses another),
  **higher only** (more, never less), or **any** (a percentage or an
  amount of their own, never below `minimumDepositPercent`); and how to pay
  only where `paymentInstructionsChanges` is on. A locked draft written
  before the settings changed goes out as they are when it is submitted.
  The form reads them from `GET /proforma-invoices/terms?locationId=`
  (proforma writers may read it; the settings themselves are an
  administrator's). Valid for the settings' days unless it says.
- **How the customer pays** comes from the settings too: the methods
  offered (`paymentMethods`: bank transfer, card and online, mobile money,
  cash, cheque) and the accounts to pay into (`paymentAccounts`), chosen
  from Finance → Banks (bank and mobile-money accounts; a location may
  have its own), with a note (`paymentInstructions`). Each proforma keeps
  them as issued (`payment_details`, migration `1780312800000`): the
  accounts in its own currency (all, when none is), so a renamed or closed
  account later does not change what the customer was told. Where
  `paymentInstructionsChanges` is on, the writer may choose other accounts
  of the organisation and write the note. Card and online pay is offered
  only where the methods include it. The PDF prints it through the
  design's **payment section** — on by default for proformas, filled from
  the template variable `{{proforma.paymentDetails}}` — and the shared
  page shows the methods, the accounts and the note.
- **Approved** like any document (`POST …/submit`; with no policy it is
  approved at once; discounts over a threshold go to an approver), **sent**
  by sharing it or by hand (`…/send`), **revised** back to a draft while
  nothing is paid (`…/revise`).
- **Paid**:
  - **online** from the shared page, through the organisation's payment
    providers — what is left of the deposit (or part of it where the
    settings allow); the provider's confirmation posts the receipt;
  - **recorded by staff** (`POST …/deposits`): a receipt for the customer
    through the receipt's own approval, counting once posted;
  - **counted from a receipt** already on the customer's account (`POST
    …/deposits/link`) — a transfer the bank showed first — for as much of
    its credit as is free.
  Each is kept in `sale.proforma_deposits`: pending (its receipt not yet
  posted), held, applied (to which invoice), released (left on the
  customer's account) or void. Paid reaches the deposit → **paid**; less →
  **part paid**; a receipt voided or refunded counts out again.
- **Converted** (`POST …/convert`, `target` sales order or invoice; one
  with service lines becomes an invoice) once the settings allow — any
  time, once the deposit is paid (the default), or once paid in full —
  as a **draft** for that document's own approval. Optionally at once when
  a payment reaches that point (`autoConvert`). When the invoice it leads
  to — directly, or through the order — is **posted**, the deposits are
  applied to it oldest first (`ArReceiptService.applyCredit`: Dr customer
  deposits, Cr receivables) and the proforma is settled; anything over
  stays the customer's credit. A deposit on a sales order is applied when
  that order's invoice is posted. A refusal to apply is kept on the
  deposit and the proforma, and never stops the invoice posting.
- **Cancelled** (`…/cancel`): what was paid stays the customer's credit, to
  apply to another invoice or refund. **Expired**: unpaid past its date,
  hourly (`expireUnpaid`); one with money on it is kept.
- **Shared, printed, reminded** like a quotation: the shared page shows
  what is asked, paid and to pay now, and Pay; the PDF prints the deposit,
  what is paid and what to pay now, and the settings' statement that it is
  not a tax invoice (with its terms and how to pay). Email templates
  `proforma-sent`, `proforma-reminder`; template subject `ProformaInvoice`;
  a PDF design kind of its own.
- **Told**: `proforma-deposit-paid` (creator and account manager),
  `proforma-part-paid`, `proforma-expiring` (two days before, unpaid),
  `proforma-expired`. Its figures above the list: awaiting payment, paid
  and to convert, held as deposits, expiring in seven days
  (`proforma-invoice.summary`). On the customer's page, in search, live.
- **Data**: `sale.proforma_invoices`, `sale.proforma_invoice_lines`,
  `sale.proforma_deposits`. Migration `1780312700000`; permissions
  `trade.proforma-invoices.read`, `.create`, `.approve` (seed v24).
- **Settings** (Proforma invoices): `validityDays` (14), `depositMode`
  (whole), `depositPercent` (50), `minimumDepositPercent`,
  `depositChanges` (locked), `paymentMethods` (bank transfer, card and
  online), `paymentAccounts`, `paymentInstructions`,
  `paymentInstructionsChanges` (off)
  (on), `allowPartPayment` (off), `convertWhen` (deposit paid),
  `convertTo` (sales order), `autoConvert` (off), `expireUnpaid` (on),
  `statement`, the sharing settings, reminders before expiry.
- **Screens**: Sales → Proforma invoices (list with what is left of each
  deposit, the form with the deposit asked for and how to pay); a
  proforma's page with its **Payment before supply** panel (figures, each
  payment and what became of it, Record a payment, Count a receipt, Make
  the sales order / invoice or why not yet); "Ask for payment (proforma)"
  on a quotation, "Ask for a deposit" on an order.
- **Tests**: `proforma.logic.spec` (14), `proforma-invoices.e2e-spec` (13:
  written with the deposit the settings allow; the deposit and how to pay
  held to the settings — locked, refreshed on submit, higher only; approved, shared and paid
  online — a receipt in the books as customer deposits; recorded by staff;
  converted to an invoice whose posting applies the deposits; converted
  only as the settings allow; a receipt counted, then voided; cancelled
  with the money left as credit; from a quotation; a deposit on a sales
  order applied when it is invoiced; expiry; the summary; another
  organisation), Cypress `proforma-invoices` (7, axe).

## Waybills (delivery notes)

What leaves a location for a customer, who carries it and what happened
on the way (`trade/sales/waybill`, 7 October 2026). Built by the layers:
controller → use-cases → `WaybillService` → `WaybillReadsRepository` (reads,
every join on the organisation) and the entity.

| Status | Means | Next |
|---|---|---|
| draft | written; nothing has moved | change, send for approval, dispatch, cancel, set aside |
| approval_pending | with its approvers | cancel (approvers decide) |
| approved | agreed | dispatch, cancel |
| in-transit | the goods left; their stock with them | note where it is, deliver, cancel |
| delivered | it arrived | record who signed for it, dispute |
| received | signed for | dispute |
| disputed | the customer says something is wrong | settle |
| cancelled | called off | — |

- **Made** by `POST /waybills` from what a person writes; the number,
  status, author and dates are the server's (anything else sent is
  dropped). With a sales order it must be agreed (approved or later);
  the customer and location come from it when not given.
  `GET /waybills/from-sales-order/:id` gives what the order still has to
  deliver — ordered less what its other waybills (not cancelled) carry,
  counted in base units (see Units) — with its customer and address.
- **Checked** as written and again at dispatch: every party is the
  organisation's (customer, carrier — a supplier — and location), each
  line names its own item or only describes, and the document settings
  (`waybill`) — a sales order required, no more than ordered, approval,
  vehicle and driver, driver's phone, carrier, expected date, packages,
  weight before dispatch, who received it at delivery.
- **Dispatched** in the request's transaction, the waybill locked first:
  in transit, and its stock lines leave the location in the same
  transaction (a dispatch that cannot record its stock fails). Each line
  moves its base quantity by the factor it kept (2 boxes of 12 → 24; see
  Units); a word that names no unit is the item's base unit. An
  order whose fulfilment already took the goods out is left alone. A
  second dispatch is refused (409).
- **Followed**: `POST /:id/update-location` with a place, coordinates or
  both, kept in order (the last 500).
- **Delivered**, and **signed for** when who received it is named — then
  or later (`/receive-pod`). **Disputed** with what is wrong; **settled**
  back to where it was, with how.
- **Cancelled** with a reason; goods already on the road come back into
  the location (`WaybillReturn` receipt). Delivered goods are disputed,
  not cancelled.
- **Set aside**: a draft only, kept with `deleted_at` (its lines too);
  nothing further is ever removed.
- **Read**: `GET /waybills` (status, sales order, customer, location,
  words — number, order, customer, address, driver, vehicle; late ones
  marked), `GET /waybills/:id` with lines, positions, proof of delivery,
  dispute, history (who did what, named) and `next` — the steps allowed
  now. `GET /waybills/:id/pdf` prints the delivery note (Studio design).
- **Permissions**: `trade.waybills.read`, `.create`, `.update` (change,
  send, set aside), `.approve` (approve, dispatch, follow, deliver,
  receipts, disputes, cancel).
- **Web**: Sales → Waybills — the list, the page with its next steps
  (each asked in a dialog that keeps a refusal), the form (from a sales
  order's "Make a waybill", or alone; items from stock or described
  lines). The order page links to its waybills.
- **Tests**: `waybills.e2e-spec` (6), `waybill-settings.e2e-spec` (4),
  `waybill-view.spec`, `stock:drill`; web `waybill.models.spec`, Cypress
  `waybills` (5).

## Billing an organisation (Phase 15 step 1)

Quotations, proforma invoices, sales orders, invoices, receipts, credit notes and waybills carry an optional billed party (`partyId`), who ordered (`orderedById`, a person of the organisation) and where it goes (`shipToSiteId`, a site). Buyer limits, credit limit and hold and a customer's discount ceiling are judged as the document is written, by the organisation's settings; an order sent to the customer's approver waits for the approver's decision before it is confirmed (invoices before posting, proformas before sending). The organisation's legal name, address, TIN and VAT are kept on the document and printed. See [TRADING_NETWORK.md](TRADING_NETWORK.md).
## Service lines on every document (14–16 October 2026)

A line is a product or a **service** (`itemType` PRODUCT | SERVICE and the service's id, from the catalogue's service items). Quotation, proforma, sales order, invoice, credit/debit note (a line naming a service), requisition, request for quotes, purchase order and bill can all carry one; the web has one line picker beside the products (`GET /service-items/lookup`, any member).

- **Posting.** A service on an invoice credits the service's **income account** (the revenue role where it has none); on a bill it debits the service's **expense account** (`purchases_expense` where none); on a credit or debit note, the income (customer) or expense (supplier) account. Tax follows the line as for a product. No stock moves: a service has no variant, so it is skipped by the stock-out, the delivery (a waybill takes lines with an item), the receipt (a purchase order's service lines are never pending and do not hold it open) and the three-way match.
- **Conversion** carries a service across (quotation → order → invoice); the order no longer refuses a quotation with service lines.
- **Data.** Migration `1782550000000-service-lines`: `item_type` (NOT NULL, default `PRODUCT`) and `service_item_id` on `sale.sales_order_lines`, `procurement.purchase_order_items`, `request_for_quote_items`, `ap_invoice_lines`. Quotation, proforma and invoice lines had them; a requisition line names its service (`serviceItemId`), a memo line too (`serviceId`).
- **Retire, never delete:** a service named by any of these lines is counted as in use.
- **Proved by** `npm run service-lines:drill` (an invoice and a bill with a service line, posted: the account, no stock movement).

## Customer refunds and gift cards (13 October 2026)

Added for the point of sale (see [POINT_OF_SALE.md](POINT_OF_SALE.md#pos-completion-returns-payments-and-the-gaps-closed)); both are documents of their own and are usable without a till.

**Customer refunds** (`ar-refund`, number prefix `RFD`, Sales → Refunds). Money paid *back* to a customer out of a treasury account: Dr customer deposits, Cr the paying account's ledger account. It is backed by credit the customer holds, either left on a receipt (a payment that was never allocated or was released by a credit note) or left on a credit note after its application to invoices; `GET /ar-refunds/credit?customerId` lists both. A refund above the credit held, in another currency than its account, or for fractions of a cent is refused with the reason in words; posting is atomic with the credit it uses, so two refunds cannot spend the same credit. Voiding reverses the entry and gives the credit back. Document settings: `requireReason` (default on), `maxAmount`. Permissions `trade.ar-refunds.read|create|void`. Table `ar_receipt.ar_refunds`. The money register shows each as source `ar-refund`. Tests: `ar-refund.logic.spec.ts`, `test/ar-refunds.e2e-spec.ts`; Cypress `refunds.cy.ts`, live `live/gift-cards-refunds.cy.ts`.

**Credit notes from a sale return.** The AR memo service gained `recordApproved` (a memo made already approved, for a decision taken elsewhere, as the till has) and a per-line `fixedTaxAmount`, so a credit note carries the tax the customer was actually charged. A credit note can release the already-paid part of its invoice from the receipts that paid it (the credit then sits on those receipts, for a refund or the next sale).

**Gift cards** (`sale.gift_cards`, Sales → Gift cards). A bearer code shown once (kept as a SHA-256 and a four-character hint) with a currency, balance, optional customer and expiry. Issued by staff for money received into a treasury account: Dr that account, Cr **Gift cards owed (2440, posting role `gift_card_liability`)**. Spent as a receipt with method `gift-card` (no bank account): it debits the card inside the receipt's posting (locked and debited in one statement) and reduces the liability; voiding the receipt gives the balance back. Block, unblock, set or clear the expiry; every movement is kept (`gift_card_movements`: issue, redeem, reverse). Permissions `trade.gift-cards.read|issue|manage`. Expired balances: kept as a liability by default, or recognised as income after a period the organisation sets, reversible by a person (13 October 2026; [PRICING.md](PRICING.md#expired-gift-card-balances), Sales → Expired gift-card balances). Not built: selling a gift card as an item at the till.

## The read side (25 October 2026)

Quotations, orders, invoices and receipts read through `ReadStore`
(PROJECTIONS.md "Read models behind ReadStore"): `GET /<documents>/:id`
answers the document from Redis or its read repository at the version
Postgres holds; `GET /<documents>?keyset=true` (or `cursor=`) answers
`{ content, nextCursor, hasNext, pageSize, payloadSize, counts? }`, each row
the detail's document, under the same filters as the offset list (status,
customer, place, dates, search, expiring, late, channel, overdue, method,
bank account, held as credit). Every new version is pushed as a `doc`
envelope on `live:<org>:<model>:<id>` and `live:<org>:<model>`
(LIVE_UPDATES.md "Read-model rooms"). The offset form keeps its query until
the screens page by cursor.

## For the phone (mobile phase 3, A3 to A5)

The phone shows the ERP's answers and never decides a price, a total, a step or a status.

- **Seeds.** `GET /sales-form/seed?from=<type>:<id>&as=<type>` is what a new document starts from when it is copied,
  converted or made from a won deal (`from` is a quotation, proforma-invoice, sales-order, ar-invoice or deal). The
  offered pairs are `domain/copy-targets.ts` (the web's `COPY_TARGETS`): quotation to quotation; proforma to proforma;
  order to order or quotation; invoice to invoice, quotation or order; deal to order or quotation. Anything else is a
  field refusal under `as` (`copy_target_not_offered`). It needs the source's read and the target's create permission.
  It answers the header (customer, party, ship-to, place, currency, today's date at the place, salesperson, notes,
  terms, tax treatment), the lines as `price-draft` line requests and `priceChanges` (`{ key, name, was, now }`). A
  document's lines are priced again from today's book through `price-draft` (a line the book has no price for keeps the
  source's price; a discount is carried as a percentage); a deal's agreed prices stand. The customer's own reference is
  never copied. A deal has no place of its own: ask with `locationId` or the lines are not priced. Nothing is saved.
- **Make an invoice instead.** `POST /quotations/:id/convert-to-invoice` (`trade.quotations.approve`) answers
  `{ salesOrderId, salesOrderNumber, invoiceId, invoiceNumber }`. It is the order conversion, then the invoice
  conversion, in the request's one transaction: refused unless the quotation is ACCEPTED, and nothing is made then. The
  order is invoiced as the draft it was made, never confirmed or fulfilled, so the invoice is not stamped as made from a
  fulfilled order (`extrasJson.source = 'quotation'`) and posting it takes the goods out of stock like an invoice written
  directly. The order records `invoicedWithoutFulfilment`.
- **List rows.** Every sales list (quotations, sales orders, invoices, receipts, proformas; keyset and offset) adds to
  each row, for the person reading it: `statusView` (`{ label, tone }`, tones `done|stopped|waiting|moving|open`) and
  `next` (`{ key, label }` of the first step they may take that is not destructive, or null; none while the document
  waits for approval). The raw `status` stays for the web. Invoice rows also carry `daysLate` (whole days past `dueDate`
  while posted or part paid and money is owed, counted in the place's time zone; null otherwise). The steps are
  `records/domain/document-steps.ts`, a port of the web's tables.
- **Summaries.** `ar-invoice.summary` (version 3) adds `overdueCustomers` (customers with something past due, each once)
  and `outstandingChange` / `overdueChange` (per currency, signed: now less seven days ago, both read from the ledger
  as it stood each day: the invoice's journal entry from its posting date to its reversal, less the receipts allocated
  on or before the day). `quotation.summary` (version 2) adds `expiringCount` and `expiringValue`.
- **A link's terms.** `GET /{quotations|proforma-invoices|ar-invoices}/:id/shares` `rules` adds `expiresOn` (the day a
  link made now would stop working, in the place's time zone; the same arithmetic as creating one, `sharing/share-expiry.ts`)
  and `nextReminderOn` (the day the plan's first reminder would go, or null).

## Known limits

- **Tax on a deposit is accounted when the final invoice posts.** Where
  the law makes an advance payment a tax point (VAT on deposits), issue an
  invoice for the deposit instead of a proforma.
- **A proforma is not revised once anything is paid on it**: cancel it
  (the money stays credit) and write another, or convert it and adjust the
  order or invoice.
- **A price book in another currency than the document is not compared**
  (no conversion): the line is judged by its own discount only.
- **Searching lists by customer works for invoices and waybills only.**
  Quotations, orders and receipts match the number alone, though the screen
  says "number or customer"; their customer's name is on the contact, not
  the document.
- **Invoices and receipts posted before the books were opened are not in
  the ledger** (`posting_batch_id` null); Phase 5 step 8 posts them.
- **A receipt in one currency settling an invoice in another** is not
  converted: the allocation's amount is taken in both.
- **Credit notes** (adjustment memos) post with Phase 5 step 5.
- **A credit note brings goods back from one invoice**, and only against the invoice line that sold them
  (`reversesLineId`), no more than that line sold less what earlier notes brought back. Goods that left through a
  waybill come back at today's average (the note cannot see the waybill).
- **Tax-inclusive pricing is not worked out.** A quotation's `taxMode`, an
  order's `priceIncludesTax` and an invoice's `taxTreatment` are stored,
  but totals always add tax on top. The screens send tax-exclusive lines
  only.
- **A header discount is stored, not applied.** A quotation's
  `discountMode` and `discountValue` do not change its totals; discounts
  are per line.
- **Location scope is not enforced on writes.** The API checks that a
  person holds a permission somewhere in the organisation, not at the
  document's location. The forms offer only their own locations.
- **Fulfilling an order whose stock cannot be recorded still fulfils it**,
  with a warning in the log, where posting an invoice refuses instead.
- **Inventory is not reserved** when an order is confirmed.
- **Prices are per line, not per unit**: a case's price is suggested from
  the single's and may be changed, but the price list holds one price per
  item (UNIT_OF_MEASURE.md §7 step 7).
- **The sidebar lists Sales** to people who cannot open it. The pages turn
  them away.
- **No void for a part-paid invoice**: void its receipts first.

## The sales audit fixes (31 October 2026, `fix/sales-void-stock-entry-and-customer-returns`)

An accountant's walk through order to cash, receipts, credit notes, write-offs, foreign currency and stock
(report: `commerce/qa/procurement-accounting-audit-2026-10-31.md`, sales section) found two places the books did
not follow the goods:

1. **A voided invoice's goods came back to stock but not to the ledger.** The void's movements share the invoice's
   ledger group with the sale's; `StockLedgerService` read both, they netted to nothing, and no entry was written —
   34 voids on dev (33 in the test organisation, ₦265,755). Each of the two now posts from its own movements
   (`UNDOES_UNDER_SAME_ID`). Migration `1792420000100` queues every void missing its entry in the posting backlog;
   Finance › Backlog posts them.
2. **A credit note for returned goods left them out of stock.** Its revenue and tax came back, the goods and their
   cost did not. A credit note line may now say `restock` (with the item and `reversesLineId`): posting puts the
   goods back where the invoice sold them from, at what they left at — the invoice's own issue, or the order's
   fulfilment for an invoice made from an order (`costOf`, `StockMovementService.departureValue`). Reversing the
   note takes them out again at that value. Migration `1792420000200`.

The invoice answer now carries each line's `id` (`ArInvoiceLineResponseDto`), so a credit note can name the line it
reverses. Read documents made before this carry none until they are projected again.

Proved: the audit walk against the branch (every entry matched; stock ledger movement equals valuation movement over
the run), `stock-ledger.logic.spec` (returns, reversals, voids), the stock, memo and sales unit suites.

## VAT on sales (31 October 2026, `fix/salesvat`)

The rest of the audit's sales findings.

**No VAT rule, no warning.** VAT on a sale comes only from the tax engine's rules (the screens send no rate), so an
organisation registered for VAT with no rule for its sales sold VAT-free and never heard of it.
`engine/sales-vat-check.logic.ts` asks the engine about an ordinary sale (one line, no item, no buyer) at every place
the organisation is **registered** — a location's tax profile says `registered`, or, for a place with no profile, the
home country in the tax settings (the same answer the engine gives) — and says whether a group applied. Registered with
none (or with the engine off): *"No VAT rule applies to your sales — check Tax › Rules"* (one place or one document:
*"… to this sale …"*), link `/tax/rules`. Not registered anywhere: nothing is said. The answer (`salesVat`:
`registered`, `ruleApplies`, `uncovered` countries, `warning`, `link`) is on `GET /tax/settings`,
`GET /finance/tax/position`, `GET /sales-form/defaults` (at the form's location) and `GET /ar-invoices/:id/tax-result`,
and Home's *Needs your attention* card (`alerts.attention`, for whoever may read the tax setup; the card keeps its
answer up to 10 minutes) lists it. For one invoice: no warning when it carries tax or has treatment `none`; when the
engine worked it out, whether its lines say `NO_TAX_CONFIGURED`; a draft saved before a rule that applies now says
*"A VAT rule applies now, but this draft was saved before it — save it again to charge VAT"*; an invoice the engine
never saw is judged by whether a rule would apply at its place on its date. Other modules ask through the
`SALES_VAT_CHECK` token (`finance/tax/sales-vat.contract.ts`).

**Bad-debt VAT relief.** A write-off used to post its whole amount to bad debts, VAT included. Where relief applies,
the write-off keeps its VAT share (`vat` on the write-off in `extras_json.writeOffs`) and posts
Dr bad debts (net) / Dr output VAT (the share, by the invoice's own tax codes) / Cr receivables. A part takes its share
pro rata: ₦43,000 off a ₦107,500 invoice with ₦7,500 VAT gives back ₦3,000. The VAT return
(`sales.badDebtRelief`) and the VAT position (`badDebtRelief`) take it off the output tax of the period it is written
off in, at the rate the invoice posted at (index `ix_ar_invoices_org_written_off`, migration `1792434000000`). Whether it
applies is the invoice setting `taxBadDebtRelief`, by default `country`: each preset records `badDebtVatRelief`
(allowed, and on what law) — on for the UK, Kenya, South Africa, the EU and the US; **off for Nigeria** (neither the VAT
Act nor what the pack was reviewed against of the Nigeria Tax Act 2025 gives VAT back on a bad debt; the Act's text is
not in the repository), Ghana (not confirmed under Act 1151) and India (no relief under GST). A receipt's
"difference written off" (receipt settings, `writeOffUpTo`) is a settlement difference, not a bad debt, and keeps
posting to the write-off account without relief.

**The receipt's fees.** `fees` is what the bank or processor kept before the money arrived: `amount` is what reached
the account, the customer paid `amount + fees`, and both settle invoices (Dr bank, Dr bank charges). Fees not applied
to an invoice become the customer's credit, by design. The receipt form says so: *"Bank charges taken out
(optional)"*, with the customer's total under it.

Proved live against the branch API (test organisation, every probe row removed and its tax setup put back to none):
not registered — no warning; registered with no rule — the warning on the settings, the position, the form, the
dashboard card and the invoice; Nigeria adopted — gone (the draft told to save again, and clean once saved); a
₦107,500 invoice (7.5%) written off in full posts Dr bad debts 100,000 / Dr output VAT 7,500 / Cr receivables 107,500;
₦43,000 of another posts 40,000 / 3,000 / 43,000 and its other ₦64,500 with `vatRelief: false` posts gross; the
month's VAT return shows ₦10,500 given back, output tax down by it, and still agrees with the VAT accounts; relief asked
for under Nigeria's default is refused.

## History

- 16 October 2026: **a quotation whose lines have no SKU converts** (found by the demo data): its lines became order lines with an empty SKU, and the second collided on the order line's unique (organisation, order, sku). Converting now gives each line its own SKU, or its item's code when it has none (the variant's SKU, the service's code), with `-2`, `-3`… on a repeat (the network's order edits do the same), 64 characters at most (`orderLineSkus`, `QuotationRepository.catalogueCodes`). The order line's unique key is unchanged. No migration. Tests: `quotation.service.spec.ts` +1; `sales:drill` converts two lines without a SKU.

- 13 October 2026: customer refunds (`ar-refund`), gift cards, credit notes made approved from a sale return (`recordApproved`, `fixedTaxAmount`) and a gift-card payment method on receipts, for the point of sale. Migrations `1781200000000`, `1781200000200`; seed v80.

- 9 October 2026: proforma invoices — a preliminary invoice asking for
  payment before supply, never posted; paid online, recorded or counted
  from a receipt, held as the customer's credit and applied to the final
  invoice when it is posted. Fixed on the way: a payment confirmed by its
  provider from a shared link never reached the ledger — its journal entry
  needed a person and had none, and waited in the backlog for ever; it is
  now posted as whoever connected the provider account.
- 9 October 2026: pricing from the price book — base, wholesale (by
  setting or customer group), quantity breaks, the book's discount; a
  price below the list judged as a discount against each person's limits
  on quotations, orders and invoices; locked or free by setting.
- 9 October 2026: quotation negotiation — the customer proposes prices,
  the organisation accepts them (as discounts, within its limits and
  approvals), declines or revises; every offer and proposal kept. Fixed on
  the way: changing a quotation's lines always failed (the new lines were
  written beside the old, whose numbers are unique), and an update read
  the quotation by id alone, whatever the organisation.
- 7 October 2026: discount policies enforced and on screen (Phase 4).
- 7 October 2026: waybills end to end and on screen (Phase 4's remainder).

- 5 October 2026: sales in the ledger (Phase 5 step 3) — invoices,
  receipts, credit applications, voids and a new write-off post their
  entries; foreign receipts post their exchange difference.

- 2 October 2026: tested and documented (Phase T step 1). Fixed on the
  way:
  - **Delete took any status.** A posted invoice, a paid receipt or a
    converted quotation could be deleted with the update permission. Only
    drafts can be deleted now.
  - **Delete routes took any id**, so a malformed one came back as a 500.
    They now take UUIDs only.
  - **An amount like "abc" crashed the decimal library** as a 500. Amounts
    must be numbers.
  - **A salesperson could not sell.** The form's locations came from the
    admin list and the payment dialog's accounts from Finance's, so both
    were refused. `locations/mine` and `banks/accounts/receiving` answer
    them now.
  - **Posted invoices and receipts had no Void button**, though posting
    said an invoice "can only be voided".
  - **The cancel confirmation had two buttons called "Cancel".**
  - **The item and customer pickers pointed screen readers at an option
    that was no longer there.**
- Built in Phase 4 (documents, conversions, payments, credit) and 4.8
  (each document on its own).
