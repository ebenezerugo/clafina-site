# Records: follow, comment, history and glance on any record

*Mobile phase 2, lane A (30 October 2026).* One module (`src/modules/records`) gives any registered kind of record the
same pattern the phone's record page uses: **follow**, **comments with @mentions**, **history**, a **glance** card, and
**Ask the Assistant** about it. Quotations were the first kind; since mobile phase 3 (A5) the other sales documents, customers and support tickets have pages too; people are glance-only.

## The registry

`definitions/record-types.ts` lists the kinds (`RECORD_TYPES`), named by the web's glance kind:

| Kind | Aggregate | Read permission | Page (follow, comments, history) | Web path |
|---|---|---|---|---|
| `quotation` | `Quotation` | `trade.quotations.read` | yes | `/sales/quotations/<id>` |
| `customer` | `Contact` | `crm.contacts.read` | yes | `/customers/contacts/<id>` |
| `staff` | `Staff` | `hr.staff.read` | glance only | `/hr/staff/<id>` |
| `sales-order` | `SalesOrder` | `trade.sales-orders.read` | yes, with steps | `/sales/orders/<id>` |
| `invoice` | `ArInvoice` | `trade.ar-invoices.read` | yes, with steps and PDF | `/sales/invoices/<id>` |
| `proforma` | `ProformaInvoice` | `trade.proforma-invoices.read` | yes, with steps and PDF | `/sales/proformas/<id>` |
| `receipt` | `ArReceipt` | `trade.ar-receipts.read` | yes, with steps and PDF | `/sales/receipts/<id>` |
| `support-ticket` | `SupportTicket` | `crm.support-tickets.read` | yes | `/support/tickets/<id>` |

A kind is a `RecordType` (`definitions/record-type.ts`): its permission, its web path and how to read one back from a
path (`matchPath`), `summarise` (many ids, one query), `glance` (one record's card), `statusLabel` and
`assistantPrompts` (deterministic, at most two). Its SQL lives in `repositories/<kind>-record.repository.ts` (the sales documents and tickets share
`document-record.repositories.ts` and the `documentRecord` factory). A document kind also has `stepsFor` and `pdfPath`.

**To add a kind:** write the `RecordType` entry and its repository read; add one line to `RECORD_TYPES`; add one line
to the Go service's `record.Types` and one entry to the app's `RecordTypes`. For a kind with a page, also add the
status preset (copy `quotation-followed-status`) and, if it is approved, set `documentType` so approvals reach its
history. Nothing else changes: the routes, the pins, the search hit and the Assistant all read the registry.

## Routes (`/api/v1`, any member; the kind's own read permission decides what they may open)

| Route | Answer |
|---|---|
| `GET /records/:type/:id` | `{ type, id, summary, following, pin: {id} \| null, pinsLeft, counts: {comments, history}, assistant: {available, suggestions}, steps, waitingFor, opened: {at, views} \| null, links }` |
| `GET /records/:type/:id/glance?context=` | `summary` + `facts[]` + `last` |
| `PUT` / `DELETE /records/:type/:id/follow` | `{ following }`, idempotent |
| `GET /records/:type/:id/comments?cursor=&limit=` | `{ items, cursor }`, oldest first, keyset `(created_at, id)`, at most 50 |
| `POST /records/:type/:id/comments` `{ body, mentions }` | `201` the comment; the author follows the record from then on |
| `DELETE /records/:type/:id/comments/:commentId` | retires the author's own comment (`retired_at`); someone else's is 403 |
| `GET /records/:type/:id/history?cursor=&limit=` | `{ items, cursor }`, newest first |

`steps` is what the person may do with a document now, from `domain/document-steps.ts` (the web's step tables, with
their labels, permissions and confirm sentences): `{ key, label, method: 'POST', path, body, destructive, confirm, next,
online, pinned }`, `next` marking the first step that is not destructive and moves the sale on. `path` is the ERP route with the id
in it; null for a screen of the phone, named by the key (below). A document waiting for approval has no steps but `copy`: `waitingFor` names the people
and roles its open request waits for (null otherwise). `links.pdf` is the PDF's route (null for an order, which has
none; `links` is null for kinds with no steps). A seller who only creates may submit their own draft.

**Steps with `path: null` are phone screens** (31 Oct, mobile phase 3): the screen does its own writes through the ERP's
routes. `record-payment` and `edit` as before, and:

| Key | Label | Offered on | Held | `body` |
|---|---|---|---|---|
| `send` | Send | a quotation approved, sent, countered, accepted or converted; a proforma approved, sent, partly paid, paid or converted; an invoice posted, partly paid or paid (the API's own `SHAREABLE_STATUSES`, the one list the shares use) | the kind's `approve` (the web's share sheet rule) | null |
| `copy` | Make a copy | any status of a quotation, proforma, sales order or invoice (never a receipt) | `create` of at least one target | `{ targets }`: `quotation`, `proforma-invoice`, `sales-order`, `ar-invoice`, the web's `COPY_TARGETS` in order (itself first), only those the person may create |
| `payment-link` | Create payment link | an invoice posted or partly paid; a proforma approved, sent or partly paid | `finance.payment-links.create` | null |
| `convert-to-sales-order` | Make a sales order | an accepted quotation | `trade.quotations.approve` | null |
| `convert-to-invoice` | Invoice it (an order fulfilled) / Make an invoice instead (a quotation accepted) | as before | `trade.sales-orders.approve` / `trade.quotations.approve` | null |
| `make-a-proforma` | Make a proforma | a quotation approved, sent or accepted | `trade.proforma-invoices.create` | `{ sourceType: 'quotation', sourceId }` for `POST /proforma-invoices/from` |

The old `send` step, "Mark as sent", is now `mark-sent` (same label, same route `POST …/{id}/send`). `send`,
`payment-link` and `copy` sit beside the sale and are never `next`, so a paid invoice or a cancelled quotation still has no
next step; they come last, in that order after `edit`. `pinned: true` marks the step the boards pin beside `next`: `send`,
wherever it is offered (every other step says `pinned: false`), so the phone pins what it is told. A document waiting for
approval has no steps but `copy`, on the same targets (its list row still offers only `decide`).

`opened` (quotations, proformas, invoices): `{ at, views }`, when a customer last opened a shared link of the document and
how many times in all (`sharing.document_shares.last_viewed_at`, `view_count`, revoked shares included); null if none was
opened and for kinds that are not shared.

The customers list (`GET /customers`, rows in `items`) and the tickets list (`GET /support-tickets`, rows in `content`)
add `statusView` (`{ label, tone }`) and `next` (`{ key, label }` or null) to each row (`row-views.interceptor.ts`). A
customer reads Overdue, Owes you or Settled and has no next move; a ticket reads in the web's words and its `next.key`
is the status to set along the usual path (open, in progress, resolved, closed; a ticket waiting for the customer goes
back to work) for someone who may change tickets (`crm.support-tickets.update`).

Refusals are said in words: `403 cannot_open` "You can't open this quotation." (permission first, so a refusal never
says whether the record exists), `404 record_not_found`, `404 record_type_unknown`. A body of 1 to 4,000 characters; at
most 20 mentions. A mention of someone who cannot open the record is refused under `mentions`
(`mention_cannot_read`, "Ngozi Chukwuma can't open this quotation, so they won't see it."): nobody is told about a
record they cannot see. The rule is the notification centre's own (the permission or the owner's, held anywhere in the
organisation).

## Data (migration `1788002000000-records`, schema `records`, RLS through `rls:ensure`)

- `follows (organization_id, record_type, record_id, user_id, created_at)`.
- `comments (organization_id, id, record_type, record_id, author_user_id, body, mention_ids uuid[], created_at, retired_at)`.
  Retired, never deleted.
- `history (organization_id, id, record_type, record_id, at, actor_user_id, kind, text, note, source_key)` with a unique
  `(organization_id, source_key)`.

## History

`HistoryRecorderService` hears the committed lifecycle events of each kind with a page (`Quotation-created|updated|deleted`)
and the `approval.event`s of requests whose `document_type` matches. One row per event; `source_key` is
`lifecycle:<aggregate>:<id>:<version>:<action>` or `approval:<approvalEventId>`, inserted `ON CONFLICT DO NOTHING`, so a
replay writes nothing. It has its own table because the outbox is pruned. The words come from `domain/history-text.ts`:
"Created", "Draft → Waiting for approval", "Edited", "Sent for approval", "Approved by Funke Balogun", "Declined by
Ebenezer Ugo" (with the words the approver left as `note`), "Approval withdrawn by …". Steps, reminders and delegations
are not history. A customer's page also hears the `Contact` lifecycle and, for each document made for them
(`Quotation`, `SalesOrder`, `ArInvoice`, `ProformaInvoice`, `ArReceipt` `-created`, by `customer_id`), writes
"Invoice INV-0412 created" (`source_key` `customer-document:<aggregate>:<id>`).

## Phase 3: more page types and the next steps

Besides the quotation, the registry now has pages for the sales order, the invoice, the proforma, the receipt, the support
ticket and the customer. A document's page says what can be done with it now: `steps[] { key, label, method, path, body,
destructive, confirm, next, pinned, online }` from `stepsFor(kind, doc, permissions)`
(`records/domain/document-steps.ts`, a port of the web's step tables so the two cannot disagree). The first step that is not
destructive is marked `next`; a document held by an approval request has only `copy` and says who it waits for (`waitingFor`), and
`links.pdf` points at its print. A sales list row carries the same reading: `statusView`, `next` and `actions` (`rowActions`:
the steps, `next` first, and `decide` when the person may approve a waiting document; the actions the boards draw as
buttons on the row, `convert-to-sales-order`, `make-a-proforma` and `decide`, say `inline: true`). The customer's page names its main
contact, since when they are a customer and their points.

## Followers, mentions and the bell

After a comment commits: the outbox event `RecordComment-created` (payload `organizationId`, `entityId` = the comment,
`actorId`, `facts`), and the record's live room `doc:<Aggregate>:<id>` is told to read again (each page kind is in
`LIVE_DOCUMENTS`, so the phone follows its room). The notification centre's subject `RecordComment` reads the comment
(its `mention_ids` are the named people; the permission is the record kind's). Presets: `record-comment-mention`
(named; app and email; shown in the Inbox as a mention), `record-comment-following` (the `followers` recipient, less the
people the comment names: a mentioned person hears of the mention only) and `<kind>-followed-status` for quotation, sales order, invoice, proforma, receipt and support ticket (followers,
less whoever made the change; a customer has no status, so no rule). The recipient `followers` reads `records.follows` for the occurrence's record.

## Pins, "my drafts", the Assistant

- A record pin is a **page pin of the record's web path**; no new kind. `GET /engagement/pins` answers `record` (the
  summary) on a page pin that is a record's, and **leaves out** a pin to a record the person can no longer open (hidden,
  not deleted: it still holds its place among the eight).
- `GET /records/:type/:id` says `pin` and `pinsLeft` from the same table.
- `POST /assistant/conversations { about: { type, id } }` checks the person can open the record, stores it
  (`assistant.conversations.about_type`, `about_id`; migration `1788002000200`), and every turn then carries
  `about: { type, id, record, comments }` (the card and the latest 20 comments, read as the asker; nothing if they can no
  longer open it). *The commerce-ai service must accept the `about` key on its message body (its schema is strict); until
  it does, a turn of a conversation about a record is refused by the service.*

## Limits

Comments page at 50; history at 50; a person's pins at 8; mentions at 20. Following is per person and unbounded per
record; `records.follows` is read once per notification occurrence.
