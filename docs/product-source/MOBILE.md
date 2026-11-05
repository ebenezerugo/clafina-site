# Mobile: the ERP pieces the phone uses

The phone talks to the Go mobile service (`commerce-mobile`), which reads from the ERP and forwards writes to it. The
**route contract** (`documentation/contracts/mobile-erp-routes.json`) is the source: every ERP route the phone or Go calls,
the fields it reads, who may call it, and, on every write, `offline: true | false` (may the phone queue it and send it
later). Go keeps a byte copy (`make contract-sync`); `src/common/contracts/mobile-contract.spec.ts` checks the file
against `openapi.json`. Phase 1's pieces are in `AUTH.md`, `WRITE_SAFETY.md` and `NOTIFICATIONS.md`.

## Phase 2 (App shell and everyone), lane A

| Task | What the ERP gained |
|---|---|
| A1 | Declining needs a reason: `POST /approvals/decide` with `decision: rejected` and no `note` is `400 { field: "note", code: "reason_required" }` (at most 1,000 characters). The reason reaches whoever asked: `approval-rejected` / `approval-approved` bodies carry it, and the Inbox's came-back items (`approval-approved`, `approval-rejected` notifications) carry `outcome` (`approved` \| `refused`), `quote { who, text, at }` and `requestedAt`, read by one batched join per page. |
| A2 | `GET /approvals/inbox/request/details` adds `facts[] { label, value }` (the web's `factsOf`, same keys and cap of eight), `money { payFrom { name, last4 }, balanceAfter, currency }` (supplier payments: from the paying account's ledger; `balanceAfter` null when the payment is in another currency) and `decidedSoFar[] { who, what: prepared \| approved \| waiting, at, you }`. A document type supplies `money` by implementing `IApprovable.moneyFor`. |
| A3 | The records module: [RECORDS.md](RECORDS.md). |
| A4 | Followers and mentions reach the bell and the Inbox (`record-comment-mention` is a mention). |
| A5 | `GET /me/inbox/counts?by=area` adds `byArea` (`sales`, `customers`, `money`, `buying`, `stock`, `people`, `operations`, `files`, `other`): approvals, open tasks and unread mentions only, less what is snoozed. Inbox entries carry `area`. `GET /engagement/pins` labels record pins. `GET /me/drafts?limit=5` (at most 10): my own unsent quotations, sales orders, invoices and proformas, newest first; a kind I cannot read is skipped. |
| A6 | `GET /search/everything`: each group says `total` (counted up to 100: the app shows "100+"); each hit says `record { type, id }` (the glance kind it opens), `status { label, tone }`, `amount`, `currency`. Documents read these in one query per kind of document on the page (quotation, sales order, invoice, proforma, purchase order, supplier bill); customers and companies by what they owe and whether it is late; a new `tickets` group. A hit is listed and counted only when its record is there to open ([SEARCH.md](SEARCH.md)). |
| A7 | `POST /assistant/conversations { about }` and `POST /me/open-on-computer { path, title }` (a notice to myself in the app and by email, once per page per minute). |
| A9 | `POST /assistant/conversations/{id}/attachments` joins the route contract (`offline: false`): the phone's composer microphone sends a recording (multipart `file` as `audio/mp4`, `origin=phone`, `title`) and then names the answer's `id` in `attachmentIds` on `POST .../messages`. No ERP change: the route and its 100 MiB limit (`MAX_AUDIO_BYTES`) are the web's. |
| P3 | `POST /files/upload` joins the route contract (`member`, `offline: false`): the phone uploads a receipt photo to it directly as multipart `file` (not through the phone service) and names the answer's `id` on the expense. No ERP change. |
| A8 | This contract, `openapi.json`, these documents. |

## Phase 3 (sales, customers and money), lane A

Everything the phone shows of a sale, a customer or money is the ERP's answer: no price, tax, total, limit, number, status or
next step is worked out on the phone or in Go. The route contract now lists every phase-3 route (200 in all) with the
fields read and the `offline` flag; `mobile-contract.spec.ts` also checks each route's `access` and `enveloped` against
the controller's own metadata, the summaries' figures against the metrics' schemas, that no form picker needs an admin
permission, and that the "Test sales" role (`fixtures/phone-sales-rep.permissions.json`, equal to the seed's) reaches the
sales screens.

| Task | What the ERP gained |
|---|---|
| A1 | `GET /sales-form/items`: the items a seller may pick, priced and stocked at the place (no `inventory.products.read`). |
| A2 | `POST /sales-form/price-draft`: prices a draft, judged for its salesperson; totals are always the server's. A read sent as POST. |
| A3 | `GET /sales-form/seed` (copy, convert, a won deal); `POST /quotations/{quotationId}/convert-to-invoice`; a quotation is not invoiced straight away when the order would need approval. |
| A4 | Sales list rows say `statusView { label, tone }`, `next { key, label }`, `actions[]` and, for invoices, `daysLate` (counted in the place's zone); summaries: `ar-invoice.summary` v4 (late customers, `oldestOverdueDays`, change on last week), `quotation.summary` v2 (`expiringCount`, `expiringValue`); a share's `rules.expiresOn` and `nextReminderOn`. A seller may submit their own draft for approval with `.create`. |
| A5 | Pages and next steps for orders, invoices, proformas, receipts, tickets and customers: `GET /records/{type}/{id}` adds `steps[]`, `waitingFor` and `links` ([RECORDS.md](RECORDS.md)). |
| A5b | Steps for the phone's sales screens (31 Oct): `mark-sent`; `send`, `copy` (`body.targets`), `payment-link`, the conversions and `make-a-proforma` as screens (`path: null`); `actions[].inline`; the order's convert answers `invoice {id, number}`; price-draft `stock.enough` and `stock.headline`; `viewCount` / `lastOpenedAt` on payment links; `opened` on a shared document's record ([RECORDS.md](RECORDS.md)). |
| A6 | Customers: `city`, `oldestOverdueDays`, `stage`, `createdFrom`, counts `leads` and `newThisMonth`, and `tab=new\|lapsed\|leads` (the ERP reads the tab in the organisation's zone; lapsed is 90 days). Deals: `ownerId`, `lostReason`, `GET /deals/board`. Migration `1792410000000`. |
| A7 | A payment run's bills (`lines[]` on the approval detail), `POST /finance/wallets/transfers/preview`, `GET /finance/cash/summary`. |
| A8 | `GET /finance/tax/position` (VAT due by month, by kind of sale, filing day, projection); `vatFilingDayOfMonth` on the tax settings. Migration `1792410000100`. |
| A9 | `POST /me/expenses/receipts/read { fileId }`: a staff member's own uploaded receipt read by the organisation's AI (no AI permission; own uploads only; 20 a minute per person; recorded as their capture, kind `expense`; `409 reading_unavailable` in words when AI is off). `DELETE /me/expenses/receipts/{fileId}` takes back an unattached upload (`409 receipt_in_use`). `storage.files.uploaded_by` records who uploaded; migration `1792410000200`. |
| A10 | The contract, the response DTOs (`openapi.json` regenerated), the least-privileged check, these documents. |

### Member reads for the sales form (31 Oct)

The phone's sales form may drop nothing the web form shows, and a sales rep (who holds `trade.quotations.create` and
the like, not `inventory.*`, `crm.parties.*`, `finance.bank.read`) cannot call the admin reads the web form was built on.
Each field now has a read under `sales-form`, gated by the same permissions as the rest (any of the four sales
documents' `create`), each answering only what the form needs. No admin route was widened; nothing is written; no
migration.

| Field | Read | Answers |
|---|---|---|
| Exchange rate | `GET /sales-form/fx-rate?from=&to=&date=` | `{ currency, from, to, base, rate, rateDate, found }`: units of `to` (the base when absent) per unit of `from`, the latest rate on or before `date`; two foreign currencies are worked through the base and dated by the older rate; `found: false` when a currency has none. The web's `?currency=` still works. |
| Bill to, ordered by, ship to | `GET /sales-form/customer-sites?customerId=&partyId=` | `billTo[]` (the customer's own party, or the organisations a person works for), and for the party billed `orderedBy[]` (`contactId` is the document's `orderedById`) and `shipTo[]` (`id` is `shipToSiteId`, with the address on one line). Empty `billTo`: the customer is billed directly. |
| Take from | `GET /sales-form/take-from?documentType=&locationId=&variantIds=` | per item, the sellable inventory types the kind of document sells from that hold any of it, in the order they are tried, with what each holds. A line names its choice as `inventoryTypeId`. |
| Price list | `lines[].priceList { id, name, kind, reason }` on `POST /sales-form/price-draft` | set only when a contract or a customer, tier, group, channel or location list makes the price cheaper than the item's own list price and the person did not type the price. |
| Proforma payment accounts | `GET /sales-form/proforma-accounts?locationId=` | `{ changeable, selected[], accounts[] }`: what a new proforma starts with and, when the settings let the writer choose, every open account to choose from (names and numbers, never balances). Send the choice as `paymentAccountIds`. |
| Tax warnings | `lines[].taxWarnings[]` and `lines[].taxAcknowledge[]` on the price-draft | the engine's warnings as the web form shows them; for a line whose taxes were changed by hand (`taxOverride`), `taxAcknowledge` are the WARN and BLOCK codes to send back as `taxOverride.acknowledgedWarnings` once read (without them save is refused 409 `TAX_WARNINGS_UNACKNOWLEDGED`). |

Also: `GET /customers/{id}/summary` says `mainContact.phone` (and `jobTitle`); `POST /email-suppressions/check
{ emails[] }` (any signed-in member; answers only about the addresses sent) is in the contract, online only, for the Send
sheet's warning; `actions[].inline` is declared on the five sales lists; and a versioned PATCH's `409 version_conflict`
declares `conflictFields` (`updatedByName`, `updatedAt` beside `currentVersion` and `current`) in the contract.

A sales list row also carries `actions[] { key, label, destructive? }`: every quick action this person may take (the steps
`stepsFor` allows, `next` first, and `decide` on a document waiting for approval that they may approve), worked out in one
pass per page. `GET /customers?tab=` and `GET /summaries/{name}` are described in the contract's `note`s.

## Phase 3 follow-ups (31 Oct)

### Payment runs and VAT

- `GET /approvals/inbox/request/details` adds `lines[].supplierId` (a payment run's bill: the supplier behind the beneficiary, `null` for staff, customers and other beneficiaries) and `canDecide`.
- **Who decides a payment run.** There is no `finance.payment-batches.approve`. A run is an approval request of type `payment-batch`; it is decided with `POST /approvals/decide`, which asks for `approval.requests.manage` and that a step in progress asks the person (their name, their role or a group; the engine checks). So the phone should not gate "Payment runs waiting for you" on `finance.payment-batches.read` (that opens the run in the finance screens, which a decider may not hold): the list is `GET /approvals/inbox` (`approval.requests.read`), which holds only what asks this person, and `canDecide` on the detail says whether Approve and Reject are offered. `canDecide` is false when no step asks the reader, when they lack `approval.requests.manage`, or when they asked for it themselves and the finance controls (`requesterMayApprove` off) forbid approving one's own request.
- `GET /finance/tax/position` says `currency`: the books' base currency (every amount in the answer), `null` before the books are set up. The phone no longer reads the currencies list to find it.

### Gift cards, one claim, the claim form's pickers

- Gift card writes are in the contract: `POST /gift-cards/{cardId}/block { reason }`, `POST …/unblock` and `PUT …/expiry { expiresOn: YYYY-MM-DD | null }`, each `trade.gift-cards.manage` (as the controllers say), `offline: false`, and each answers the card as `GET /gift-cards/{cardId}` does.
- **One expense claim.** `GET /me/expenses/{claimId}` (member): the claim with `lines[]` and `history[]`. Only its owner reads it: anyone else's id is 404 (not confirmed to exist) and someone not on the staff list is 403. A draft or a rejected claim is changed with `PATCH /me/expenses/{claimId}` (already queueable).
- **The More pickers.** The admin lists need `communication.campaigns.read`, `finance.cost-centers.read` and `projects.projects.read`, which a claimant need not hold, so the form reads `GET /me/expenses/pickers/campaigns`, `/cost-centers` and `/projects`: `?q=` (part of a name, and a project's number) and `?limit=` (50, at most 100), answering `{ rows: [{ id, name, reference }], hasMore }` by name. `reference` is a project's number. Gated as the form is (staff only), ids and names only; open projects only (not closed, cancelled or templates). Campaigns are the organisation's that are not deleted.

### Tickets and people

- `GET /support-tickets/{id}`: the ticket says `statusView { label, tone }` (the words and tone the list rows use; the mapper now adds it to every ticket answer) and each message says `authorName` (the staff member who wrote it, else the customer; null for nobody known, such as an email from a stranger), read for all of a ticket's messages in one query. `authorUserId` and `authorContactId` are filled now: they were always null on this read because the relations were not loaded.
- **Editing a person.** The web edits a contact with `PATCH /contacts/{contactId}` (`crm.contacts.update`, not an admin permission), so that is the route; it is now versioned like the documents. `GET /contacts/{contactId}` (in the contract) answers `version` and an `ETag`; the PATCH takes `If-Match: "<version>"` and answers 409 `version_conflict` with `current` when the person was saved after the phone read them (`updatedAt` says when; `updatedByName` is null: the ERP keeps no edit history for a person). Without `If-Match` the save is accepted, as the web does. `offline: true` in the contract: it changes no money, so the phone may queue it. The version is a column kept by the database (migration `1792410000300`, the trigger of [WRITE_SAFETY.md](WRITE_SAFETY.md)). The seed's "Test sales" role (and `fixtures/phone-sales-rep.permissions.json`, which the contract spec compares with it) holds `crm.contacts.update`, so a sales rep can edit a person.

## Home KPI cards

The tablet board's three figures are the dashboard widgets the web's home already shows, so the phone and the web agree
and the ERP's caching and pushes serve both (no new route):

| Card | Widget | Permission | Value |
|---|---|---|---|
| Sales today | `today.sales` | `trade.ar-invoices.read` | money figure: what was invoiced today (base currency, other currencies as entered), against last week's same weekday and yesterday |
| Cash | `money.balances` | `finance.bank.read` | money figure: bank, cash and wallet balances (organisation-wide, not narrowed by place), against the last working day; `empty` block before the first account |
| Needs ordering | `today.stock` | `inventory.stock-levels.read` | count figure: stock records out or fallen to a level, from `projection.inventory_on_hand`, against a week ago |

`GET /dashboard/widgets/{key}` answers `{ key, version, computedAt, scope, data { baseCurrency, asOf, blocks } }`. The first
block is `tiles` with one tile; money is a decimal string with its currency and never a bare number. A person who
may not read a widget gets 403 for that widget alone: the Go service leaves that card out of Home's `kpis` and
asks the others. A 503 is a failure and the `kpis` card says so (never a zero). `locationId` narrows the scoped
widgets to the person's place.

## Phase 4 (calendar, meetings and links), lane A

The phone's calendar, Meet and "Links I've shared" screens add 66 routes to the contract and widen two it had (`GET /calendar/events`,
`GET /calendar/availability`). They are spelled as `openapi.json` spells
them. The pieces behind them, by task:

- **A1** `POST /calendar/free-busy` and `POST /calendar/find-a-time`: reads sent as POST, so the names stay out of the
  address (CALENDAR.md). **A2** `GET /calendar/rooms` and `/calendar/rooms/slots` (staff meeting rooms, migration
  `1792500000100-meeting-room-holds`). **A3** reminders and the ring through the notification centre. **A4**
  `PUT /calendar/blocked/device` (the phone's busy time, migration `1792500000200-blocked-source`). **A5**
  `GET /meet/record/{appointmentId}/drafts` and `.../drafts/{id}/confirm|change|dismiss` (MEET.md, migration `1792500000300-meeting-drafts`). **A6**
  `GET /me/shared-links` and `GET /me/shared-links/{kind}/{id}`, and Drive's refused opens in the audit log (SHARING.md).
- **Offline.** Two writes may queue (`offline: true`): `POST /calendar/events/{id}/respond` (my own answer; repeating it
  changes nothing, the last answer wins, a refusal because the event was cancelled meanwhile comes back in the ERP's
  words) and `PUT /calendar/blocked/device` (the phone's busy time; the latest set wins). Every other calendar, meeting
  and link route is `offline: false`: meetings and everything of a room never queue, and the writes that send an
  invitation, make a public address or book a resource need a connection. Go's registry and the app's `OfflinePolicy`
  are tested against this file.
- **Shared links.** `GET /me/shared-links` is one list across the kinds `drive-link`, `document-share`, `booking-link`,
  `payment-link` and `file-request`, with how many are on, expired and off. Each kind needs its own read permission
  (`drive.files.read`, `crm.appointments.read`, `finance.payment-links.read`, the trade `*.read` ones); a kind the person
  may not read is left out and named in `unavailable`, the rest show. Drive's audit log now records a refused open as
  `link.refused { linkId, reason }`, the reason one of `not_listed`, `passcode`, `locked`, `expired`, `download_limit` or
  `address`, and the link's events show it (SHARING.md).
- **Permissions.** No route a phone calendar or meeting screen calls needs an admin permission. The calendar's reads need
  `crm.appointments.read`, its changes `crm.appointments.create` or `.update`; Start now and Take notes need
  `meet.meetings.create`, ringing and a call from a chat `meet.calls.create`. The seeded **Test sales** role (the
  least-privileged phone role, `src/common/contracts/fixtures/phone-sales-rep.permissions.json`, which the spec holds equal
  to `TEST_ROLES['Test sales']`) gained `crm.appointments.read|create|update` here: that rep reaches every route of the
  calendar screens and every read and answer of a meeting's page, and lacks exactly five meeting routes (`POST /meet/instant`,
  `/meet/notes`, `/meet/meetings/{appointmentId}/restart`, `/meet/meetings/{appointmentId}/ring` and
  `/chat/conversations/{id}/call`), so the app does not offer Start now, Take notes, Restart or Ring to that role. Making a task
  from a draft needs `crm.activities.create`; without it the answer is 403 "Making a task is for those who may give tasks."
- **Answers without a schema.** Most of the older calendar and meeting reads (`events/{id}`, `counts`, `people`, `types`,
  `links`, `blocked`, `/meet/home`, `/meet/record/{id}`) are not described in OpenAPI, so their `fields` are empty and
  their `note` says "not described in OpenAPI"; the Go service forwards the ERP's answer as given. Describing them is a
  follow-up (`@ApiGlobalResponse` on each); the spec requires the note until then.
- **The phone's join protocol** is in MEET.md → "The phone client".

## Offline

Queued (`offline: true`): next-step dismiss, milestone close, snoozes, marking notifications read, follow and unfollow,
comments, notification switches, quiet hours, the appearance, and the phase-1 activity and account edits. Needs a
connection (`offline: false`): approvals, next-step run, reminders, pins, taking a comment back, open on a computer, the
Assistant, linking Telegram, profile edits, sign-in and the device routes. Phase 4: only an invitation answer and the phone's busy time queue; see "Phase 4" above.

## Migrations (range 1788002000000 to 1788002999999)

`1788002000000-records`, `1788002000100-my-drafts-indexes`, `1788002000200-assistant-about`. Forward only, expand only.

Phase 3 (range 1792400000000 to 1792499999999): `1792410000000` (customers and deals), `1792410000100-vat-filing-day`, `1792410000200-file-uploaded-by`, `1792410000300-contact-version` (a `version` on `crm.contacts` and its bump trigger; follow-ups, 31 Oct: all 6,262 dev contacts at version 1 after it; run twice, nothing changed; an update raises it and so does `SET version = 99`; rolled back). Expand only; proved on a scratch copy of dev, not yet run on dev.

Phase 4 (range 1792500000000 to 1792599999999): `1792500000100-meeting-room-holds` (A2), `1792500000200-blocked-source` (A4) and `1792500000300-meeting-drafts` (A5). Forward only, expand only.
