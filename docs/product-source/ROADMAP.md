# Roadmap

*Second draft, 24 September 2026. Supersedes the draft of 23 September, which
got one thing badly wrong — see §1.*

Every claim here was checked against the code or the cluster. Quotes are
verbatim. Nothing is inferred from a module's name.

---

## 1. Correction: there are no orphan tables

The first draft listed twelve tables as having "no entity" and asked whether
they could be dropped. That framing was wrong and the question should not
have been asked. `schema:check` reports tables with no entity, and I read its
output as *dead*. It means nothing of the kind. Broken down, the twelve are:

**Six are second tables that shadow a real one.** The entity points at the
real table; a six-column shell sits in a singular-named schema beside it:

| Real table (what the entity uses) | | Shell |
|---|---|---|
| `sale.waybills` | 37 cols | `waybill.waybills` — 6 |
| `sale.quotations` | 34 cols | `quotation.quotations` — 6 |
| `sale.sales_orders` | 26 cols | `sales_order.sales_orders` — 6 |
| `procurement.ap_invoices` | 27 cols | `ap_invoice.ap_invoices` — 6 |
| `procurement.ap_payments` | 24 cols | `ap_payment.ap_payments` — 6 |
| `procurement.goods_receipt_notes` | 15 cols | `goods_receipt_note.goods_receipt_notes` — 6 |

Every shell has the same shape: `created_at, updated_at, deleted_at, id,
name, organization_id`. It is the signature of the generator that also
produced the AR tables — and the features they appear to shadow
(`waybill.entity.ts`, `sales-order.entity.ts`, and the rest) are real, built,
and in use. The shells are leftovers from scaffolding, not the features.

**Two are deliberately raw-SQL.** `tenant.outbox` and
`item.catalogue_import_jobs` are managed by migrations and hand-written SQL
with no entity by design. Both work. Both are load-bearing.

**Four are HR tables whose entities have not been written yet.**
`human_resource.feedbacks`, `goals`, `leave_balances`, `performances` — real
features, migrated ahead of the code that will use them.

**Nothing gets dropped.** The shells cost nothing but confusion, and they are
addressed in Phase 0 by teaching `schema:check` the difference between a
table with no entity and a table that is *shadowed* by one, so the report
stops asking this question again.

---

## 2. Where the project actually is

**Target scale: 200,000+ users and millions of active transactions.** That is
not a footnote — it decides several things in this plan that would otherwise
be preference. Most of the code here is correct for one tenant on one
instance and has not yet been asked the second question. Where that matters
it is called out: §3m (real-time), §5 (Citus), and the recompute-per-event
choice the projections make deliberately.


| | |
|---|---|
| API entities | 169 |
| Database tables | 191 |
| Web routes with a component | 91 |
| …of those, placeholders | **61** |

**Six web features are real:** products, inventory, admin, users, settings,
numbering. **Ten are entirely placeholder:** sales, customers, support,
loyalty, procurement, suppliers, payables, finance, hr, approvals.

And there are whole API modules with no sidebar entry at all, which the first
draft missed completely:

- **`tag`** — full module, controllers through use-cases. No UI.
- **`customer/`** — ten submodules: account, activity,
  appointment-and-reservation, contact, deal, feedback-and-complaint, list,
  membership-and-loyalty, pipeline, stage. This is a CRM, a loyalty scheme
  and an appointments system. No UI.
- **`finance/cost-center`**, **`finance/adjustment-memo`** — the latter is the
  best-built finance module in the repo. No UI.
- **`notification`** — events, listeners, mail. Toasts only on the web.
- **`communication`** — an empty directory.
- **`reference/country`**, **`storage/files`**, **`adapters/`** — plumbing,
  working.

What is solid and safe to build on: the append-only **stock ledger**,
**GRN → stock** (the best-engineered path in the codebase), the **approval
engine**, the **payroll calculation engine**, **numbering**, and the
**catalogue**.

---

## 3. The gaps, named properly

### 3a. Code that reports success without doing the work

`ar-invoice.service.ts` builds a balanced journal entry, then:

```ts
// TODO: Post to GL via posting service
// const postingResult = await this.glPostingService.post(journalEntry);

arInvoice.status = ArInvoiceStatus.POSTED;
arInvoice.extrasJson = { ...arInvoice.extrasJson, journalEntry };
```

…and logs `Successfully posted AR invoice with ID: … GL entries created.`
Nothing is created. `ar-receipt.service.ts` is identical. `ap-invoice.service.ts`
sets POSTED then `// TODO: Trigger GL posting process`.

AP **payments** genuinely post — so payments land against open items that
invoices never created.

And the service they would call cannot post anyway:

```ts
private async getGLAccount(_organizationId: string, code: string) {
  // TODO: Implement proper GL account lookup from database
  const account = new GLAccount();
  account.id = `account-${code}`;
  return account;
}
```

`getGLAccountByBankId`, `resolvePeriod`, `ensureFiscalGuards` and
`reversePosting` are the same shape. Balances are never written, so
`reporting.service.ts` — 546 lines of correct SQL — reads numbers nothing has
written. Receipts never reduce `amountDue`.

On the web: `profile.component.ts` and `password.component.ts` render a form,
toast success, and make no HTTP call. The users list renders **randomuser.me**
data. The dashboard's figures are string literals.

### 3b. Every document needs its settings — and only one has them

`grn-setting/` is the pattern, and it is a good one: its own schema, entity,
controller, repository, mapper, DTOs, **policy service**, gateway, listener,
processor, subscriber and use-cases. It governs over-receipt tolerance
(globally and per category), when quality inspection is required, which
categories demand expiry or batch, and the default receiving location.

**No other document has anything.** Quotations, sales orders, waybills, AR
invoices, AR receipts, requisitions, RFQs, purchase orders,
returns-to-supplier, AP invoices, AP payments, journal entries, stock counts
and adjustment memos each need their own — and each needs two halves the GRN
module only has one of:

- **Behaviour** — tolerances, required approvals, default locations, whether
  a draft can skip a step, credit limits, allowed payment methods, rounding.
- **Appearance** — the document's numbering series, logo and letterhead,
  which columns print, terms and footer text, currency and date format,
  copies, email template.

Appearance has no home anywhere today. `tenant.brand_settings` holds a logo
for the application, not for documents.

### 3c. The catalogue has twelve controllers and seven screens

| API controller | Web |
|---|---|
| `product.controller` | list, detail, form, quick-add, import grid |
| `variant.controller` | **none** — variants only exist inside the product form |
| `category.controller` | **none** |
| `brand.controller` | **none** |
| `price-book.controller` | **none** |
| `service-item.controller` | **none** |
| `inventory.controller` | **none** |
| `inventory-type.controller` | **none** |
| `discount-policy.controller` | **none** |
| `uom.controller` | **none** |
| `stock.controller` | location-stock, stock-items |
| `import.controller` | import grid |

Nine of twelve have no interface at all. `stock-count` and
`stock-count-line` entities exist with no controller and no screen.

### 3d. Filtering and bulk actions barely exist

Every filter DTO in the item module is `search?: string` and nothing else —
`FilterProductDto`, `FilterVariantDto`, `FilterBrandDto`,
`FilterCategoryDto`, `FilterPriceBookDto`, `FilterDiscountPolicyDto`. The
single exception is `FilterInventoryDto`, which supports `locationId` and
`variantId`.

So **products cannot be filtered by location, category, brand, status or
stock position** — the API has no parameter for it. This is server work
before it is client work.

For bulk: `POST /products/bulk` exists and is bulk *create* only. There is no
bulk update, activate, deactivate, archive, delete, re-price, re-category or
export anywhere.

And the shared component library cannot express any of it yet:

```
avatar  back-link  badge  breadcrumb  button  card  confirm-dialog
dropdown-menu  input  label  phone-input  separator  switch  tabs
```

No table, no checkbox, no select, no pagination, no filter bar, no toolbar,
no empty state. Every list screen re-hand-rolls its table markup.
`confirm-dialog` and `phone-input` exist but are **not exported** from
`index.ts`, so nothing can import them by the documented path.

---

### 3e. A failure that renders as an answer

`GET /inventories` had never returned anything but 500, and three faults sat
on top of each other:

1. `findAll` passed a `relations` array, so TypeORM joined on the relation's
   own key and Citus refused to plan it.
2. Once it answered, it answered with three keys of thirty-one:
   `excludeExtraneousValues` strips anything without `@Expose()`, and exactly
   one field of `InventoryDto` had it.
3. Once the fields came back the relations did not, because `toDto` defaults
   every include to false and the controller mapped row by row rather than
   calling `toDtoList`.

Each fault hid the one behind it. But the reason none of them was found is
the fourth: **the stock screen drew its empty state over the failure**, so
207 rows of stock read as "Nothing is stocked at this location yet."

That is the same category as §3a seen from the client. A list that treats
*error* and *no rows* as one state cannot be trusted to tell you either.
Worth a sweep of every list screen, and a shared empty-vs-error convention
in the component library built in Phase 1.

### 3f. Every member is staff; not every member of staff signs in

> **Corrected 8 October 2026** (the user's rule): every member of an
> organisation is staff — their record is made, or HR's linked, when they
> join (`member.joined`), and they read it through self-service (`/me`) —
> while not every member of staff signs in (a warehouse hand). What
> follows was written before that rule and is kept as the reasoning on
> invitations; its "a user may be no one's staff" no longer holds.
>
> **Decided 8 October:** self-service stays inside the same web app as its
> own area (`/me`, `/me/reviews/:id`…), not a separate frontend. One
> sign-in and one session; permissions decide what else a member sees.

Worth stating because the question came up and the answer decides sequencing.

**Users & Access is already built**, on both sides, and is one of the six
working web features. It is tenant/admin: `tenant/users`,
`tenant/invitation`, `tenant/roles`, `tenant/permissions` — who may sign in
and what they may do.

**Phase 9 is HR**: `human-resource/staff`, leave, payroll, performance —
employment records, contracts and what someone is paid.

The entities already say they are different things. `Staff.user` is a
`@ManyToOne` the code itself comments as *"Optional association with a user
account for authentication and authorization"*, and `User.staffProfiles` is
the `@OneToMany` back. So a staff member may have no login (a warehouse hand
who never touches the system), and a user may be no one's staff (the outside
accountant, a contractor). Waiting for Phase 9 to fix invitations would leave
a working feature broken for months over a relationship the schema already
models as optional.

### 3g. Slugs from the template that match nothing

The sidebar's "Users & Access" section was hidden from **everybody**,
including an owner holding all 207 permissions, because it was gated on
`PERMISSIONS.ACCESS_USER = 'access.user'` — a slug the API has never defined.
Permissions are compared verbatim, so a name that does not exist matches
nothing and silently hides what it guards. The Invitations page was reachable
only by typing its URL.

All four values in that enum were template leftovers — `create.user`,
`create.sale`, `access.user`, `access.sale` — and its doc comment described
an `appSettings` RBAC model this application does not use.

The lesson is not the enum, which is now fixed. It is that **a permission
check that silently fails closed looks exactly like a permission check that
is working**, which is §3e in a different costume. Two things follow for
Phase 1: the permission catalogue the web uses should be generated from the
server's, not retyped, and a sidebar entry hidden by a permission is worth
logging at debug so "I cannot find the page" has an answer.


### 3h. Access is one subject split across two menus

Users, invitations, roles and permissions are one question — *who may do
what, and where* — and the application asks it in two places with two
different shapes.

**Users & Access** is a top-level section with no layout of its own: a list,
an invitations page, and a leftover `random-list` demo route. **Roles &
Permissions** lives under **Administration**, inside a side-nav shell
(`admin-layout.component.ts`) alongside Organization, Locations, Security and
Number Series. So granting someone a role and seeing who has one are two
different journeys through two different chrome.

Underneath the navigation, the connections the domain implies are mostly not
built:

- **There is no user detail page.** `/users` is a list you cannot click into.
  One person's roles, locations and status cannot be viewed, let alone
  changed.
- **Roles can only be assigned when a user is created.**
  `setUserLocationRoleUseCase` runs inside `POST /users` and nowhere else;
  `PUT /users/:id` updates the profile and nothing more. There is **no route
  that changes an existing user's role or location** — no promotion, no
  transfer, no revoking access.
- **`SendInvitationDto.roleIds` is accepted and silently dropped.** The field
  is documented as "Initial role IDs to assign upon acceptance", and
  `accept-invitation.use-case.ts` never reads it. §3a again, in the access
  layer.
- **The invite form asks only for an email**, so you cannot say what someone
  is being invited *as*.
- **A role does not know who holds it.** `role-detail.component.ts` has no
  reference to users, so "who are my administrators?" has no answer in the
  UI.

The last two are the ones that matter most, because of what they cost.
**§3k's location scope cannot be configured.** An owner sees everything by
virtue of `tenant.organization.owner`; anyone narrower has to be granted a
location, and nothing in the product can grant one. A shop manager cannot be
created. So the scoping built in Phase 1.5 is correct and, today,
unreachable — the only users that can exist are owners.

That is what decides when this happens: not the tidiness of the menu, but
that the access model has no administration.


### 3i. The invitation lifecycle stops at "sent"

Four routes exist — send, accept, list, revoke — and between them they cover
the happy path only.

**Nothing can be resent.** This is the one that gets asked for first, and the
current code makes it impossible rather than merely missing: `send` throws
409 Conflict when a pending invitation already exists, so an admin whose
invitee never received the mail cannot even re-invite them. The invitation is
stuck until it expires a week later.

A resend is not "send the same mail again". It should mint a **fresh token**
and extend the expiry, because the old link may already be dead, and a token
that has sat in an inbox for a week is the one most likely to have leaked. It
also needs a cooldown, which is currently unimplementable: nothing records
when an invitation was last sent.

**The list lies about status.** Expiry is checked only inside `accept` —
`invitation.expiresAt < new Date()` — so a row keeps saying `pending` until
somebody tries to use it. An admin reading the invitations page sees
invitations as live that died days ago. Deriving `expired` on read is cheaper
than a sweep and cannot drift out of step.

**Revoke leaves no trace.** It is a bare `invitationRepository.update` in the
controller — no use-case, no outbox event, and no `revoked_at` or
`revoked_by`. Nothing records who withdrew someone's access or when, and
nothing tells the recipient the link in their inbox is now dead.

**And an existing user cannot be invited at all.** `accept` calls
`usersService.create(...)` unconditionally, but `tenant.users` is a
**reference table with a globally unique index on `email`** — one user row
shared across every organization. So inviting someone who already has an
account anywhere on the platform fails on that constraint and the invitation
sticks as pending forever.

This is not an edge case, it is the multi-tenant case: `user_location_roles`
carries organization, location and role precisely so one person can belong to
several organizations. Accepting an invitation for an address that already
exists should **add a grant**, not create a user — and the accept screen
should ask that person to sign in rather than to choose a new password.


### 3j. Unit of measure

Full design in `UNIT_OF_MEASURE.md`. The short version, because it changes
what the catalogue screens can be built against.

**Most of it is built and correct.** `item.uoms` and `item.uom_categories`
exist with 792 seeded rows, `factor_to_base` is the relative-to-base model
the ERP literature recommends, conversion goes through `decimal.js`, and
`convertQuantity` refuses across categories with an error that explains why.

**Nothing calls it.** `convertQuantity` and `toBase` have no callers. In
their place are two cruder representations that *are* used:
`products.uom_id`, a bare uuid with no relation, set on all 120 products and
read by nothing; and `inventories.purchase_unit_of_measure` /
`.sale_unit_of_measure`, free-text `varchar` defaulting to `'UNIT'`. The unit
an item is bought and sold in is a string typed into a column.

**`stock_movements` carries `quantity` and nothing else** — no unit, no base
quantity, no conversion factor. Every figure in the append-only ledger is
implicitly in whatever unit the writer had in mind.

Three fits this architecture forces, all argued in the document:

- **System units cannot be `organization_id = NULL`** — `item.uoms` is
  distributed on `organization_id` and Citus has no shard for a null tenant.
  Seeding per organization with `is_system_defined`, which is what is already
  done, is the correct answer here rather than a compromise.
- **`VariantUom`, not `ProductUom`** — the variant is the item. A case holds
  24 of Coke 500ml and 12 of Coke 1L, and barcodes already live on the
  variant.
- **Packaging must not become a UoM category.** `uom.entity.ts` currently
  says businesses should add "Pallet of 48" as a Count unit, which holds only
  while every pallet is 48. Two items both sold by the case break it, and the
  escapes — `CASE_24`, `CASE_12` — push item data into the unit catalogue.


### 3k. Roles, permissions and location scope

There are two roles in the database, both called `owner`, each holding all
**207** permissions. Everything finer than that is unbuilt.

`tenant.user_location_roles` carries organization, location and role
together, and is how a user is attached to an organization at all — not
merely a location scope. Until the dashboard was built, **nothing anywhere
read it for authorisation.** The stock screen offered every location in the
organization to an account granted one.

The dashboard now resolves it server-side and answers 403 for a location the
caller does not hold. It is the only endpoint that does. Two things follow:

1. **Every read endpoint needs the same treatment** — inventories, products,
   stock movements, and every document in sales and procurement. A filter
   applied in the client is not enforcement.
2. **Ownership has to be asked about separately.** An owner holds one
   `user_location_roles` row like anyone else, against whichever location
   they were created with, so reading that table as a scope confines them to
   it. `tenant.organization.owner` is a permission that exists for this and
   was not being read.

Worth doing as one piece of work — a location-scope resolver plus a guard —
rather than thirteen times by hand. It belongs before the sales and
procurement screens, not after, because those screens are where a leak
between locations would actually cost something.

### 3l. The dashboard

Now real, and the shape to extend: server-side aggregates, a location picker
limited to what the caller may see, and an NgRx slice keyed by location so
moving the picker back costs nothing.

What it cannot show yet, and why: **there is no history.** All 207 stock
movements are opening balances written on a single day. Sales over time,
stock movement, receipts against invoices, margin — every one of those
charts needs Phases 3–5 to have put transactions in the database first. Until
then a trend line would be an invention, which is the thing §3a is about.

When there is history, the dashboard should gain: stock movement over time,
sales and receipts against invoices, and ageing. Each of those wants its own
aggregate endpoint rather than the client summing pages.

*(13 October)* **Built:** the home page is now a page of widgets — sales,
money, operations, channels, the trading network, people, my work, alerts and
a getting-started checklist — each permission-, location- and
currency-aware, cached once per scope and pushed live, arranged per person
and per role. See [DASHBOARD.md](DASHBOARD.md) and §5.

*(5 October)* There is history now, and the user's *Dashboard, Reports &
Analysis Model* widens this to every module: dashboards at three levels,
reports, analysis, insights, forecasts and alerts on one platform.
Sequenced as **Phase 5.5**, below.

### 3m. Real-time reads: Redis, Kafka, sockets — and what 200k users breaks

**Target: 200,000+ users and millions of active transactions.** Everything
below is sized against that, not against the demo.

The dashboard currently queries Postgres on every load. It should not. The
pattern for not doing so is already in this codebase, complete, and the
dashboard simply does not use it yet:

| Piece | Where | State |
|---|---|---|
| Redis | `CachesModule` (`@Global`), keyv | working |
| `CacheService` | get / set / exists / delete | working |
| `RealtimeService` | `getRoomKey`, `joinRoom`, `emitToRoom`, `emitToSocketId` | working |
| `SocketIoSharedAdapter` | one Socket.IO server, a namespace per gateway | working |
| Gateways | **47** of them | working |
| Kafka | outbox → `EventConsumer` → 5 projections | working |

And the read/write pair is already established, in `quotation`, `sales-order`
and `ar-receipt`:

- **`Set<X>MetricsUseCase`** — recompute → `cacheService.set(room, data)` →
  `realtimeService.emitToRoom(...)`. Triggered from a **BullMQ processor** on
  `CREATED_EVENT`.
- **`Get<X>MetricsUseCase`** — `joinRoom` → read cache → `emitToSocketId`.
  **No database query at all.**

So the dashboard work is: `DashboardGateway` with its own namespace,
`SetDashboardSummaryUseCase` and `GetDashboardSummaryUseCase` following those
three, and `GET /dashboard/summary` serving Redis with SQL only as a
cache-miss fallback. On the web, the NgRx slice already holds the summary by
scope — the socket becomes another action dispatching into it, so a change
arrives without a refresh and without a request.

That part is a few days. The scale work underneath it is not, and these are
in priority order:

**1. Socket.IO has no Redis adapter, and this is blocking.**
`SocketIoSharedAdapter` extends `IoAdapter` with no `@socket.io/redis-adapter`.
One process, `emitToRoom` reaches everyone; two or more, it reaches only the
sockets connected to the instance that emitted, and the rest see nothing until
they reload. It fails silently and it fails *partially*, which is worse than
failing — you cannot tell from one client that the other instances went quiet.
At 200k concurrent users this is the first thing to break and nothing else in
this section is safe until it is done.

**2. A recompute per event does not survive millions of transactions.**
Projections deliberately recompute a whole tenant per event, for idempotence
under at-least-once delivery (`projection.ts` argues this well, and for a
stock ledger it is right). A dashboard summary cannot inherit it: a tenant
with a million stock movements would re-aggregate them on every sale. What it
needs instead is **coalescing** — events mark the tenant's summary dirty, and
a worker recomputes each dirty scope at most once per window (5–15s), which
is well inside what a dashboard needs and turns a burst of a thousand sales
into one query.

**3. The cache key has no location in it.**
`getRoomKey(organizationId)` returns `realtime:<org>` and is used as both the
Socket.IO room and the Redis key. The dashboard is location-scoped (§3k), so
the key needs the scope in it — `dashboard:<org>:<location|all>` — or every
location shares one cached answer.

**4. And the room needs it too, which is a security matter, not a cache one.**
Broadcasting an organization-wide summary into `organization:<id>` sends it
to every socket in that organization, including users granted one location.
That leaks other locations' figures to people the REST endpoint correctly
answers 403 to. **Rooms must be per scope, and a socket must only be joined
to scopes its user holds** — the same resolver as §3k, applied at
`joinRoom` instead of at the controller.

**5. Nothing sets a TTL.** `cacheService.set(room, metricsData)` is called
with no expiry, so if the recompute path ever stops, the wrong number stays
on screen forever with nothing to indicate its age. Every cached summary
wants a TTL longer than its refresh window and a `computedAt` in the payload,
so a stale figure can be shown as stale rather than as fact.

**6. Two mechanisms do this job, and only one of them should drive reads.**
Metrics are driven by **BullMQ**; projections are driven by **Kafka**.

First, on cost, because it came up: **BullMQ is MIT-licensed and free.** The
installed package is `bullmq@5.56.9`, "MIT License, Copyright (c) 2018
BullForce Labs AB". What costs money is **BullMQ Pro**
(`@taskforcesh/bullmq-pro` — groups, batches, better rate limiting) and the
hosted **Taskforce.sh** dashboard. Neither is installed and neither is
needed. If a queue UI is wanted, `bull-board` is MIT and self-hosted. So
there is no licensing reason to remove it, and 47 processors currently use
it.

Second, on architecture: Kafka and BullMQ are not substitutes.

| | Kafka | BullMQ |
|---|---|---|
| Is | an ordered, replayable log | a job queue |
| Good at | fan-out to many consumers, replay, ordering per partition, audit | retries with backoff, delays, scheduling, priority, concurrency limits, rate limiting, dead-letter |
| Answers | "this happened" | "this must get done" |

Rebuilding per-job retry, backoff, delayed execution and concurrency control
on top of Kafka is a well-known way to spend a quarter reinventing a queue.
And BullMQ runs on the Redis that is already here for the cache and now the
socket adapter — it adds no infrastructure, where Kafka is the heavier
dependency of the two.

**So: keep both, and give each the half it is good at.**

- **Kafka** drives *events* — "a sale happened", "stock moved" — and
  therefore everything that maintains a read model: projections, and the
  dashboard recompute in (2). This is the path with replay, which matters
  because a read model that cannot be rebuilt is a read model you cannot fix.
- **BullMQ** keeps *work* — sending mail, generating a PDF, running an
  import, anything that needs a retry policy and a dead-letter queue.

The convergence worth doing is narrow and specific: **move the metric
recompute triggers off BullMQ onto Kafka**, because recomputing a read model
is a reaction to an event, not a job. `Set<X>MetricsUseCase` should be driven
by the consumer, not by a queue job. That is roughly a day per document and
should happen before thirteen more documents copy the current one — not a
removal of BullMQ, which would be a large, risky change for no benefit.

**7. Fan-out arithmetic.** 200k users in org rooms is fine; 200k users each
receiving a recomputed summary every time anyone in their organization makes
a sale is not. The coalescing window in (2) is what bounds this, and the
payload should be the summary itself rather than a nudge to refetch —
otherwise every broadcast turns into N requests against the API, which is the
stampede the cache existed to prevent.

Sequenced as **Phase 1.5**, below: after the catalogue screens exist to read
it, before sales and procurement add thirteen more documents on the old
pattern.

### 3n. Live everywhere: one pattern from a write to every open screen

*Asked for 26 September:* when a customer accepts a quotation, the
salesperson's screen should say so without a refresh — and every module
should work that way, on one architecture: the database changes, an event
goes through Kafka, a listener updates Redis, and the socket delivers to
whoever in the organization is looking.

**Most of it already exists** (§3m, Phase 1.5). Checked against the code:

| The flow asked for | What is here | State |
|---|---|---|
| A write raises an event | `TenantEntitySubscriber` records `<Aggregate>-created/updated/deleted` in the **transactional outbox** — the change and the event commit together | works; 43 aggregates |
| …queued through Kafka | `OutboxRelay` → Kafka, keyed by organization (ordered per tenant); `EventConsumer` validates each against its contract, dead-letters what fails | works |
| A listener updates Redis | `LiveMetrics` + `Coalescer`: a change marks the scope dirty, one recompute per 3 s window, only while someone watches; `Set<X>MetricsUseCase` → `CacheService` | works; 45 metrics |
| The socket delivers | `RealtimeService.emitToRoom` through the Socket.IO **Redis adapter** (every instance delivers); `Get<X>` joins a room and sends the cached value with no SQL | works; 47 gateways |
| The screen updates | the dashboard: socket → NgRx action → figures change in place | **one screen** |

So this is not a new system. It is that pipeline, finished, and made the
rule. What is missing is specific:

1. **Entities are not delivered, only aggregates.** A quotation being
   accepted recomputes the quotation *count*; nothing tells the list or the
   open document that QTE-19 is now ACCEPTED. That is the case in the
   request, and it needs a second kind of channel beside metrics.
2. **Events are too thin to act on.** The lifecycle payload is
   `{ organizationId, entityId }` — no location (so rooms cannot be scoped
   by location, and a sale at one shop refreshes every shop), no status (so
   a list row cannot change without a request), no version (so a late
   notice cannot be told from a fresh one).
3. **Some writes raise no event at all.** The subscriber fires for
   `repository.save`. `QueryBuilder.update`, `repository.update` and raw
   SQL reach `afterUpdate` without the entity, or not at all — the AR
   invoice's atomic payment allocation is one. A state change made that way
   is invisible to every consumer, projections included.
4. **Metrics are untyped and thin.** Each `Set` builds an object by hand
   (`{ totalCount }` in all 45), `Get` sends whatever is in Redis, and the
   web has no type for any of it — a renamed field breaks a screen
   silently. And they are **cached with no TTL**: Phase 1.5 gave the
   dashboard one, the 45 module metrics were never given one.
5. **The socket checks who you are, not what you may see.** `WebSocketGuard`
   verifies the token and session on each message; it checks no
   permission and no location. Any member can join any module's room —
   harmless for a count, a leak for customer names and amounts. And a
   socket outlives its session: pushes keep arriving after sign-out or
   revocation until the browser disconnects.
6. **Latency has a floor nobody chose.** The relay stretches its poll to 8×
   the base interval when idle, so the first change after a quiet spell can
   wait seconds; metrics add their 3 s window on top. A status notice should
   not wait for either.
7. **One gateway per module.** 47 namespaces, 47 handshakes, 47 copies of
   the same guard and the same Get/Set/Gateway boilerplate — and each new
   module adds four more files that do nothing new.
8. **A socket is at-most-once.** A laptop that sleeps for a minute misses
   what happened in it; nothing today catches it up.

**The architecture.**

```
 request ─► service ─► save (tx) ─► outbox row (same tx)
                                        │  relay, woken on commit
                                        ▼
                               Kafka  (key = organization: ordered per tenant)
                                        │
                  ┌─────────────────────┼──────────────────────┐
                  ▼                     ▼                      ▼
          live entities          live metrics            other consumers
      notice, no window     dirty → 3 s coalesce →     projections, search,
     → entity room           compute → validate →       notifications, mail
                             Redis (TTL, computedAt,
                             version) → metric room
                  └──────────────┬──────┘
                                 ▼
              /live gateway (every API instance, Redis adapter)
       authorizes each subscription: permission + location scope
                                 ▼
             browser LiveService ─► NgRx actions ─► screen
```

The rules it rests on:

- **The database is the record; Redis is a cache; Kafka is the log.**
  Redis holds derived read models (metric snapshots), watch markers,
  presence and coalescing markers — nothing that cannot be recomputed. If
  it is flushed, metrics recompute on the next watch and no entity is lost.
- **Metrics push the answer; entities push a notice.** A metric snapshot
  is small and the same for everyone in its room, so it travels whole — a
  "please refetch" would turn one broadcast into N requests. An entity
  notice carries id, status, version, location and who acted; the screen
  patches what it shows, and fetches the one row by REST only if it needs
  more — which also puts the fetch behind the same permission check as
  every other read.
- **A subscription is authorized like the REST call it replaces**: the
  module's read permission and the §3k location resolver, at join, and
  again when the session changes.
- **Every payload has a schema** — zod, versioned, exported through OpenAPI
  so the web's types are generated, never hand-written.
- **Order and staleness are the client's to check, cheaply**: the version
  on a notice (updated-at in ms) lets a client drop a notice older than
  what it holds.

**Contracts.**

```ts
// The lifecycle event, enriched (payload — the envelope's copy never
// reaches consumers; see the outbox contract rule):
{ organizationId, entityId, action: 'created' | 'updated' | 'deleted',
  locationId: string | null, status: string | null, version: number,
  actorId: string | null }

// live.entity — to the browser:
{ aggregate: 'Quotation', id, action, status, version, locationId, at }

// A metric in Redis, and live.metric to the browser:
{ metric: 'quotation.summary', v: 1, scope: { locationId: string | null },
  computedAt, data: T }
```

**The metrics service, typed.** Today a metric is four files per module
(`Set` use-case, `Get` use-case, gateway, service) and an untyped object.
It becomes one declaration; the module keeps its `<X>MetricsService` for
the queries — the part that knows what matters in that module:

```ts
export const quotationSummary = defineMetric({
  name: 'quotation.summary',
  version: 1,
  aggregate: 'Quotation',              // which events make it stale
  scope: 'location',                   // or 'organization'
  permission: 'trade.quotations.read', // who may subscribe
  schema: z.object({
    total: z.number().int(),
    byStatus: z.record(z.nativeEnum(QuotationStatus), z.number().int()),
    openValue: z.string(),             // decimal as string, as everywhere
    expiringIn7Days: z.number().int(),
    acceptedLast30Days: z.number().int(),
  }),
  compute: ({ organizationId, locationId }, metrics: QuotationMetricsService) =>
    metrics.summary(organizationId, locationId),
});
```

A `MetricsRegistry` finds every definition (as `LiveMetrics` finds
`@LiveMetric` today), keys it `metric:<name>:<org>:<location|all>`,
validates what `compute` returns against the schema before caching it —
a wrong shape fails in the drill, not on a screen — sets a TTL longer than
its refresh, and publishes the envelope. One generic subscribe handler
replaces 45 `Get` use-cases and 47 gateways. Each module chooses the
figures its screens show — no metric without a screen to read it.

**The gateway (`/live`).** Owns:

- *Connection*: token and session checked at the handshake, not per
  message; the socket joins `user:<id>` so a sign-out, a revoked session or
  a removed membership can disconnect it at once.
- *Subscriptions*: `live.subscribe { channel }` / `live.unsubscribe`;
  channels `metric:<name>:<scope>`, `entity:<aggregate>:<scope>`, and
  `doc:<aggregate>:<id>` for one open document (its timeline — viewed,
  downloaded, reminded, accepted). Each checked against the permission and
  location scope before joining; subscribing is rate-limited.
- *Presence*: `presence:<org>` in Redis — who is connected, heartbeat with a
  TTL — used to recompute only what someone watches (the existing watch
  markers) and later for "Ada is viewing this invoice".
- *Back-pressure*: notices to one channel merged per 250 ms, latest version
  wins, so a bulk import does not become ten thousand frames.
- *Catch-up*: on reconnect the client re-subscribes; metrics answer with the
  cached snapshot, and entity screens refetch what they show (the list page
  or the one document) — cheap, bounded, and correct without a replay log
  in Redis.

What never travels on the socket: pages of rows, anything the user's
permissions would not return over REST, secrets, and the share links and
codes that the mail queue now also refuses to keep.

**Where it runs.** Today every API instance serves HTTP and sockets *and*
consumes Kafka. At the scale target these split into roles of the same
codebase — `api` (HTTP + sockets) and `worker` (Kafka consumers, recomputes,
BullMQ jobs, the reminder sweep) — scaled separately. The worker has no
socket server; it publishes into rooms with `@socket.io/redis-emitter`,
through the same Redis the adapter uses. This is the "separate service"
the request describes, without a second repository to keep in step.

**Trade-offs taken.** Kafka adds a hop over emitting in process — tens to
hundreds of milliseconds once the relay is woken on commit — and buys
ordering per tenant, replay, and one consumer across all instances; kept.
Notices over full rows cost a request when a screen needs more, and save
authorizing and shaping every field twice. One gateway over forty-seven
centralizes authorization, which is the part that must not be copied
wrongly forty-seven times. Targets: a status change on screen within 1.5 s
at p95; a metric within its window plus 1.5 s; zero deliveries across a
location a user does not hold, proven by a drill.

**Onboarding a module — the checklist.** A module is live when:

1. Every state change goes through `repository.save` (the subscriber) or
   records its event explicitly with `outbox.record` — no silent
   `update()`/raw-SQL transitions; the aggregate is in `contracts.ts`.
2. Its subscriber declares where location and status live on the entity,
   so its events carry them.
3. Its figures are `defineMetric` declarations with a schema, a scope and a
   permission; `metrics:drill` covers them without being told.
4. Its web feature asks `LiveService` for `metric<T>(name, scope)` (a
   signal) and `entities(aggregate)` (notices), and one effect maps notices
   to its NgRx actions — patch a row's status, refetch the open document,
   reload the page when a new row belongs on it.
5. `live:drill` passes for it: a write reaches a subscribed test socket in
   time, and a user without the permission or the location receives
   nothing.

Sequenced as **Phase 4.7**, below.

### 3o. Every document stands on its own

*(Noted 26 September; **built 27 September** as Phase 4.8.)* A business does not always walk the whole chain.
A shop invoices a walk-in customer with no order; a supplier delivers
without a purchase order; a customer pays a deposit before any invoice
exists. So **every document can be created and managed on its own**, and
converting one into the next is a shortcut that fills the new one in —
never the only way to reach it. A link to a source is an optional
reference, and there may be several (an invoice covering two orders, a
receipt paying three invoices) or none. QuickBooks, Xero, Zoho and Odoo all
work this way: an invoice or bill is created directly, a receipt can sit
unallocated as credit on the customer's account, and Odoo receives goods
with no purchase order behind them.

Where the project stands (audited 26 September):

| Document | API: creatable alone? | Web | Gap |
|---|---|---|---|
| Quotation | yes | **New quotation** form | — |
| Sales order | yes (customer, lines) | reached only by converting a quotation | a **New order** form |
| AR invoice | yes (customer, location, lines) | reached only by converting an order | a **New invoice** form; decide what a standalone invoice does to stock (below) |
| AR receipt | **no** — at least one invoice allocation is required | recorded only from an invoice | accept an unallocated amount as **credit on account**, allocated later; a **New receipt** form |
| Waybill | yes (reference optional) | list, page, form (7 October) | — |
| Credit / debit note (adjustment memo) | yes (links optional) | none | its screen |
| Purchase order | yes (requisition optional) | placeholder | its screen |
| Goods receipt note | **no** — `purchaseOrderId` required | placeholder | a **direct receipt**: supplier, location, lines, no order; three-way matching then simply has nothing to match |
| Return to supplier | **no** — `grnId` required | placeholder | a return picked from stock at a location, with the receipt as an optional reference |
| AP invoice (bill) | yes | placeholder | its screen; matching to an order or receipt optional |
| AP payment | yes (line references optional) | placeholder | its screen; unallocated as supplier credit, as for receipts |
| Quality inspection | needs a receipt | none | kept: an inspection *is* of something received — not a document one starts alone |

**The one real decision: stock on a standalone invoice.** When an invoice
comes from an order, the order's fulfilment moves the stock. An invoice
with no order behind it has to decide. Zoho Inventory and QuickBooks reduce
stock on the invoice; Odoo never does (only a delivery moves stock).
*Recommendation:* a document setting (Phase 3's framework), **"a
standalone invoice issues its stocked lines"**, on by default — the shop
counter case — and off for businesses that always deliver separately;
lines that came from an order never issue twice.

The rules that go with it: a document made alone and one made by
converting are the same document afterwards (same statuses, approvals,
sharing, summaries); a conversion copies, and the copy can be edited before
it is saved; and each list page gets its **New** button beside the
conversions.

### 3p. A global product: tell people, and take their money, anywhere

*(Noted 27 September.)* Commerce is to be used well beyond Nigeria. Two
things decide whether that works day to day. People must hear about what
concerns them on the channel they actually read. Customers must be able to
pay with whatever is normal where they live. In both, **the organisation
chooses** (Phase 4.6); nothing is hard-coded.
Commerce's own email provider is set in the environment and picked later;
what gets built is the choice for organisations.

- **Notifications** (Phase 4.9) take their model from
  [Novu](https://github.com/novuhq/novu), read 27 September:
  - a *workflow* per thing worth telling, fired by a trigger, with *steps*
    per channel (in-app, email, SMS, WhatsApp, Telegram, push, chat,
    webhook) plus *delay* and *digest*;
  - *subscribers* and *topics*, *preferences* per workflow and channel,
    and a *provider* per channel chosen by the organisation;
  - an activity log of every step, and an in-app inbox.

  It is built inside our architecture, not run beside it (reasons in 4.9).
- **Payments** (Phase 4.10) take their pattern from
  [Hyperswitch](https://github.com/juspay/hyperswitch) (Rust, Apache 2.0):
  - one payment API over many processors, with routing between them,
    retries on another processor and normalised webhooks;
  - refunds, disputes, payouts and reconciliation;
  - a vault kept out of our own PCI scope.

  Hyperswitch is a candidate to run **as its own service** beside the
  NestJS API. That would be the first non-Nest service, so 4.10 is a drafted
  plan with a spike and a go/no-go, not a commitment.

Going global also touches everything already built, so each phase is
checked against the following:

| Concern | What it means here |
|---|---|
| Currency | Every money column already carries a currency. No tenant has `finance.currency` rows yet, so onboarding seeds the organisation's own currency. FX rates and revaluation come with the ledger (Phase 5). |
| Language | Templates (email, SMS, PDF, the shared page) take a locale. The recipient's locale is used, then the organisation's, then English. |
| Time | Digests, quiet hours, due dates and "overdue" are computed in the recipient's or the location's time zone, never the server's. |
| Phone and address | Phone numbers are stored in E.164 and verified before a message is sent to them. Addresses keep a per-country format. |
| Tax and e-invoicing | These are per country: FIRS MBS (Nigeria), ZATCA (Saudi Arabia), GST e-invoicing (India), Peppol / ViDA (EU). Each is a connector in an integration slot, never a branch in the invoice code. |
| Consent | Transactional messages (a document, a code, an approval) are separate from optional ones. Optional messages carry an unsubscribe link and respect NDPR and GDPR. Suppression lists are per organisation. |
| Where data lives | Citus shards by organisation already. A second region is a second cluster with the organisation pinned to it. This is not built; it is noted so nothing assumes one region. |

## 4. Sequence

Phases 1–5 are unchanged in spirit from the first draft; what follows is the
detail, and two new phases the first draft had no idea it needed.

### Phase 0 — Tell the truth *(~1 week)* ← **done**

No new features. Close §3a.

- [x] **AR invoice, AR receipt and AP invoice stop claiming POSTED.** The
      commercial half was always real and stays; what went is the journal
      entry stashed in `extrasJson` as though filed, and the log line saying
      "GL entries created." All three carry `posting_batch_id`, null, so
      "not in the ledger" is a fact you can select for — `ap_payments`, the
      one path that genuinely posts, already had it.
- [x] **Receipt allocation reduces `amountDue`.** `allocatePayment` was
      correct all along and the loop that called it was commented out.
- [x] **Profile and password call the endpoints that already existed**, and
      only clear once the server has answered.
- [x] **Users list reads the organisation's users** rather than
      `randomuser.me`.
- [x] **Dashboard reads real figures**, location-scoped, with charts. No
      trends: every stock movement is an opening balance written on one day.
- [x] **`GET /inventories` answers at all.** It had never returned anything
      but 500 — three faults stacked (see §5) — and the stock screen drew its
      empty state over the failure, so 207 rows of stock read as "Nothing is
      stocked at this location yet."
- [x] **Login carries the user's name.** `UserMapper.toDto` never set
      `firstname`, so the session never knew whose it was.
- [x] **`schema:check` separates shadowed, deliberate and unbacked tables**,
      so §1 cannot be asked the same wrong way again.
- [x] **Swept the list screens** (§3e). Five decided what to render by asking
      "are there rows?" before "did it fail?"; Roles and Locations had no
      error branch at all. `ui-list-state` and `listStateOf` now make failure
      and absence one ordered decision, with a retry.

      It repaid itself within the hour. With the error state visible,
      **`GET /access/roles` turned out to answer 500 to every request** — the
      permissions join goes through `roles_permissions` on `role_id` alone,
      which Citus will not plan — and the screen had been reporting that as
      "No roles yet". Rewritten as two queries, which also stops an owner's
      207 permissions multiplying each role into 207 rows before paging.

### Phase 1 — Finish the catalogue *(~4 weeks)* ← **done, 25 September**

Promoted to first, because it is the part of the product that already works,
it is what the demo data is for, and every later phase selects items from it.

**Progress, 24 September 2026.** Unit of measure steps 1–3 are done and proven
(`npm run uom:drill`; `UNIT_OF_MEASURE.md` §9–10). **Brands** is the first
screen, and the pattern the other eight follow:

| Piece | Where | Reused by |
| --- | --- | --- |
| Sortable header, `aria-sort` on the `<th>` | `th[uiSortHeader]` | every list |
| Selection bar, "select all N matching" | `ui-selection-bar` + `Selection` | every list with bulk actions |
| Debounced search | `ui-search-field` | every list |
| Form dialog on the native `<dialog>` | `ui-modal` | every add/edit that is a few fields |
| Bulk request: ids, or the filter | `SelectionRequestDto` (API) | every bulk endpoint |
| Usage count that gates delete | `BrandRepository.pageWithUsage` | categories, inventory types, UoMs |

Using the screen rather than reading it found three faults, all fixed: every
list paged with a gap (below); reading or renaming one brand was a 500 (an
eager logo join Citus will not plan); and a duplicate name was a 500 rather
than a 409 (an un-awaited save inside a try block). Brands in use cannot be
deleted — `products.brand_id` has **no foreign key** onto `brands`, though the
entity declares ON DELETE SET NULL, so a delete orphaned every product
carrying it. The constraint is worth adding with the distribution column
(`FOREIGN KEY (organization_id, brand_id)`), and the same check belongs on
categories.

**Every list had a gap.** The pagination decorator capped pages at 20 but
computed the offset from the size asked for, so a 25-row screen never showed
rows 21–25 of any page — forty of the demo location's 207 items on the stock
screen. It now caps first, allows 100, returns the `pageSize` it used, and
refuses an order an endpoint has not allowed with a 400 instead of a 500.
Endpoints should declare `allowedOrderBy` as they get screens.

**Categories** followed, and was the brands screen with the words changed —
so both now run on one implementation. API: `common/libs/usage` pages,
counts, sorts and bulk-deletes any list from a spec naming its table and
what counts as a use. Web: `features/products/reference` is one screen, one
dialog and a store factory; a list is a `ReferenceListConfig` of about twenty
lines. **Inventory types and units of measure should each be a spec and a
config**, not new screens. Categories also gained the `description` the table
always had and the API never carried.

**Inventory types** followed as a spec and a config, with two additions to
the shared list — built-in rows that cannot be deleted or re-coded, and
search by code — and two hazards found: `inventories.inventory_type_id` is
**ON DELETE CASCADE**, so deleting a type in use deleted its stock records
(all 207 for "Stocked"; now refused, but the constraint wants RESTRICT), and
new items were stocked as the type *named* "Stocked" (now by code). Its four
behaviour flags were read by **nothing** until the follow-up below.

**Units of measure** got a screen of their own, grouped by dimension, since
units have a factor and are retired rather than deleted. `PATCH /uoms/:id`
validated nothing (a `Partial<>` type is erased at runtime); it does now.

**Prices** (`/products/price-books`): a price book here is one price per
stock row, not a named list, so the screen is the price list over stock
rows — unpriced ones included — with click-to-edit and bulk re-pricing by a
percentage or to a figure, rounded as a shelf label wants. `GET /price-books`
had answered 500 forever: the entity never declared the `organization_id` the
table is distributed on, so tenant filters went through three joins on ids.
Known and left: a price's optional fields cannot be cleared through the API
(`null` means unchanged), and a first price for unpriced stock is still set
from the stock screens rather than this one. (The price history came on
26 October; **price change requests** — a document that asks for prices to
change and applies them when approved, for organisations whose Stock and
prices setting says so — on 27 October: `CATALOGUE.md`.)

Also on the way: the dev API's shutdown is bounded (every step time-limited,
a 15-second exit watchdog), after two restarts that never finished left it
serving stale code.

**Products** got what §3d asked for: server-side filters — category,
brand, status, and "stocked at" a location — search across code, SKU and
barcode, and bulk change of status, category or brand over ids or "all
matching", with one batched outbox insert (`Outbox.recordMany`) so search
hears about every change. The order-by was a raw string into ORDER BY; it is
whitelisted. No bulk delete, by design — archive instead.

**Stock counts** (`/inventory/counts`): the count API was proven by the stock
drill and unusable by a person. It gained whole-location and per-category
sheets (untracked items left off), named lines, and progress on the list; the
list's `limit` had refused every value with a 422. The screen draws up a
sheet, fixes expected quantities on start, takes counts in place, and says
exactly what approving will post before it does.

**Service items** (`/products/service-items`) — a reference list with a rate
and a unit, for which the shared list learned extra fields and columns.
Quotation and invoice lines are left out of its usage count until Phase 4
tenants them. **Discount policies** move to Phase 4 (see there): nothing reads
them yet.

Screens done: brands, categories, inventory types, units of measure, prices,
the products list's filters and bulk actions, stock counts, service items.
Variants and inventory do not get screens of their own: a variant is read
and edited on its product's page, and stock on the stock screen. The sidebar's
Variants link led nowhere — `/products/variants` matched `:productId` and asked
for a product called "variants" — so it is gone, and the path redirects to the
products list. Bulk tag and export are carried forward; nothing later waits on
them.

Three follow-ups, all done 24 September: the 68 repository writes returned
un-awaited from inside try blocks now await, so duplicates are 409s rather
than 500s; roles can be opened and edited (the single read was the roles
list's unplannable join again, and permissions are now written with their
organization); and inventory-type flags apply — counted and may-go-negative in
the ledger, for-sale on sales orders — proven by `npm run stock:rules-drill`.
Returnable waits for customer returns.

- **Shared components first**: table (sortable, selectable), checkbox, select,
  pagination, filter bar, toolbar, empty state, modal. Export
  `confirm-dialog` and `phone-input`. Nothing else in this phase is
  reasonable until these exist.
- **Screens**: categories, brands, variants, price books, service items,
  inventory, inventory types, discount policies, UoM, stock counts.
- **Filtering, server-side**: extend the filter DTOs and repositories —
  location, category, brand, status, price range, stock position, tag.
  Location filter spans products, variants and inventory.
- **Bulk actions**: select-all-across-pages semantics, then bulk activate,
  deactivate, archive, delete, re-category, re-brand, re-price, tag, export.
  Each needs an endpoint; each must be idempotent and tenant-scoped.
- **Location scope on every list**, per §3k, done once as a resolver and a
  guard rather than per controller.
- **Settle unit of measure first** (§3j, `UNIT_OF_MEASURE.md`), steps 1–3:
  a base unit on the variant, the conversion snapshot on `stock_movements`,
  and the engine actually wired to it. These come before the screens because
  every catalogue screen shows or edits a quantity, and a quantity whose unit
  is a free-text string is one the screens would then have to keep pretending
  about. The ledger backfill is trivial today — no conversion has ever been
  applied, so every row is already in its base unit — and stops being trivial
  the moment one is.
- **Watch for the mapper trap.** `InventoryResponseDto` had `@Expose()` on
  one field of thirty-three, so the endpoint returned three keys of thirty-one
  even when it returned 200; the four relations were dropped separately
  because `toDto` defaults every include to false. Check both when a screen
  looks empty for no reason — and prefer `toDtoList`.

### Phase 1.5 — Real-time reads *(~2 weeks)* ← **done, 25 September**

Per §3m, in this order, because each one makes the next safe:

1. **Socket.IO Redis adapter.** Nothing below works across more than one
   instance without it, and it fails partially and silently.
2. **Scope-aware rooms and keys** — `dashboard:<org>:<location|all>`, joined
   through the §3k resolver, so a socket only ever receives scopes its user
   holds.
3. **Coalesced recompute** off Kafka: events mark a scope dirty, a worker
   recomputes each dirty scope once per window.
4. **Dashboard gateway and the Get/Set pair**, following `quotation`,
   `sales-order` and `ar-receipt`; `GET /dashboard/summary` reads Redis, with
   SQL only on a miss.
5. **TTL and `computedAt`** on every cached summary, so stale can be shown as
   stale.
6. **Converge on Kafka**, retiring the BullMQ metric trigger.
7. **Web**: socket messages dispatch into the existing NgRx slice, so figures
   change in place without a refresh or a request.

**Progress, 25 September 2026.** All seven steps are done; step 6 is described after the findings below.

The adapter (1) and scoped rooms and keys (2) were already in place. What was
missing was anything that ever pushed: `DashboardGateway.publish` had no
caller. Now `DashboardRefresher` does (3): a change marks the organization in
Redis with `SET NX PX`, the instance that set it recomputes after a three
second window, and the marker is cleared *before* the queries so a change that
lands mid-recompute schedules another round. Only scopes someone is watching
are recomputed, which meant `watch` had to change — a socket used to join its
own scope and every location it held, so an owner of five hundred shops would
have cost five hundred and one recomputes per window. It now joins the one
scope on screen and renews it every five minutes; a scope nobody renews lapses
after fifteen. Pushed figures carry no location picker (the people in a
location's room do not all hold the same other locations). Summaries carry
`computedAt` (5), and the page shows it beside a Live marker, so figures that
have stopped updating say so.

Stock changes arrive through `inventory-on-hand` rather than off the raw
event: the runner now emits `projection.applied` after each apply commits.
Listening to `StockMovement-created` directly, in a consumer group of its own,
the dashboard could as easily have recomputed before the projection as after,
and published the position one movement behind.

Proven live: a probe product created with seven in stock moved the open
dashboard from 120 items to 121 and Main from 16309 to 16316 with no request
from the page, in one recompute for both events, after the projection had
applied. Moving the picker moved the socket from the organization's room to
the location's. The probe was removed afterwards.

**Four screens read stock from a column nothing keeps current.** The
dashboard, Stock Levels (`GET /inventories`), the product page and the
barcode scan all took on hand from `inventories.quantity_on_hand`, which is
written when a record is created and by catalogue imports — and by nothing
that moves stock. Receipts, issues, transfers and counts post to the ledger
only, so after the first of any of them those screens would show the opening
balance as the current figure, while availability checks, counts and the
ledger endpoints used the real one. All four now read
`projection.inventory_on_hand`; the record's update compares an echoed
quantity against that same figure, so a client sending back what it was shown
is not refused. The dashboard takes one record per (variant, location), since
the record's unique key includes the inventory type and a join on both would
count a position twice, and full-joins the projection so no ledger quantity
is dropped. The column stays; what becomes of it is for when valuation is
designed.

On the demo tenant the one visible disagreement — Chocolate Bar 80g at Main,
23 on the record against 13 in the ledger — was not a count. It was
`stock:drill`: every run fulfilled an order and deleted the order but not the
issue it posted, and six runs had left six issues of two behind. The drill now
removes them and recomputes the projection when it is done, and a rerun leaves
the ledger exactly where it found it. **The six leaked rows are still in the
ledger** (−12 on that item); removing them is a direct delete from an
append-only table, and left for a person to decide.

`GET /inventories/:id` and the response to `PATCH /inventories/:id` had
answered 500 throughout (a `relations` array Citus will not plan, the fault
the list had), and with the relations fixed would have sent `variant: []` —
`toDto` includes none unless asked. Both now go through the list's joins and
mapping.

Found on the way, not fixed:

- **`inventory-on-hand` recomputes the whole tenant on every movement** — it
  deletes and re-inserts every position from a sum over the entire ledger.
  Correct and idempotent, and at the scale target (§1) the most expensive
  thing an ordinary sale does. It should recompute the (variant, location)
  the movement touched, which needs those two on the event's payload.
- **The same missing payload widens every refresh**: an event names its
  organization and entity, not the location, so a sale at one shop
  recomputes every watched scope in the organization.
- **A product with stock history cannot be deleted**, and says only "Foreign
  key conflict" (the ledger references its variant). Refusing is right; the
  answer should be archive, in a sentence.

**Step 6: the metric triggers.** There were forty-four, one per feature: a
listener turning `<X>-created` into a BullMQ job and a processor running
`Set<X>MetricsUseCase`. Taking them apart found that they had barely existed:

- **Forty-three listeners were never registered in any module**, so nothing
  queued and those metrics were never computed — while forty-four workers
  held a Redis connection each, on every instance, waiting.
- **Every feature cached under one key.** `getRoomKey(org)` was
  `realtime:<org>`, so all forty-five metrics and the GRN settings overwrote
  each other; the GRN settings socket sent whatever was there, usually salary
  component counts.
- **Ten of the queries could not run on Citus**: counting through the
  `organization` relation joined `organizations` to filter and dragged in
  eager relations joined on id alone. The other thirty-five ran on every
  shard, because a filter through a join cannot prune.
- **Performance review counted every organization's reviews**, its tenant
  filter commented out.
- Only `created` triggered anything, so a delete left a count one high.

Now: a `Set` use-case is marked `@LiveMetric({ aggregate, namespace })`;
`LiveMetrics` finds them, recomputes on created, updated and deleted through
the same `Coalescer` as the dashboard (once per window per organization), and
only while a screen is in the room — joining watches it and brings it up to
date. Keys carry the namespace. Counts filter the organization column itself.
The listeners and processors are gone; BullMQ keeps mail, the attendance cron
and the approval SLA, which are jobs. `npm run metrics:drill` runs all
forty-five against the cluster and drives one through join, burst and window.

Still open: these rooms are per organization, not per location scope (§3k) —
fine for counts of organization-wide records, wrong the day one of them is a
location's figure. Tag and performance review raise no lifecycle events, so
their metrics compute when asked and not again (startup says so). No web
screen reads any of them yet.

### Phase 2 — Access administration *(~3 weeks)* ← **done, 25 September** (copy link held back)

Ahead of document settings, because §3h is not cosmetic: without it the
only kind of user that can exist is an owner, and Phase 1.5's location
scoping has nothing to scope.

**API first** — the gaps are real routes that do not exist:

1. A route to set an existing user's location-role grants, not only at
   creation. This is the one that unblocks everything else.
2. Honour `SendInvitationDto.roleIds` on acceptance, or drop the field.
   Accepting it and ignoring it is the §3a pattern.
3. A reverse lookup: the users holding a role, and the users at a location.

**Then the interface**, as one subject rather than two menus:

4. Merge Users, Invitations and Roles & Permissions into a single **Access**
   area, using the `admin-layout` side-nav shell that already works. Whether
   it lives under Administration or stays top-level matters less than that
   the four pages share one shell and one mental model.
5. A **user detail page**: profile, status, and the grants — role and
   location together, since `user_location_roles` carries them as one row and
   showing them apart invites the bug in §3k, where a grant looks like a
   scope.
6. **Invite with a role and a location**, so an invitation says what someone
   is being invited to be.
7. **Role detail shows its holders**, with a way to add and remove them.
8. Remove the `random-list` demo route.

**The invitation lifecycle**, per §3i — small individually, and the reason
an admin's day goes wrong when they are missing:

9. **Resend**, minting a fresh token and extending the expiry, with a
    cooldown. Needs `last_sent_at` and `resend_count` on the row before the
    cooldown can exist at all.
10. **Derive `expired` on read**, so the list stops showing dead invitations
    as pending.
11. **Copy invite link.** Email is not a guaranteed channel, and an admin who
    can paste a link into WhatsApp is not blocked by a bounced message. It
    also makes the whole flow testable without a mail server.
12. **Revoke through a use-case**, recording `revoked_at` and `revoked_by`
    and raising an event, so withdrawing access is auditable.
13. **Accepting as an existing user adds a grant** instead of creating a
    second account, and the accept screen asks them to sign in. Without this
    nobody who already uses the platform can join a second organization.
14. **Bulk invite**, because onboarding a shop's staff one address at a time
    is the kind of friction that gets a product abandoned on day one.
15. Resend and revoke must preserve the role and location from (6) — an
    invitation that forgets what it was for is worse than one that expires.

Two things worth getting right while building it, because they are cheap now
and expensive later: the permission catalogue the web compares against should
be **generated from the server's**, not retyped — §3g is what retyping
costs — and every screen here should show a grant as *role at location*,
never a bare role, so that the distinction survives into Phases 4 and 6 where
it starts guarding money.

**Progress, 25 September 2026.** Done: 1–10 and 12–15. Left: 11 (copy
invite link, held back — below) and the two "cheap now" items.

Bulk invite (14) takes up to a hundred addresses as the same roles at the
same locations. An address that cannot be invited — already a member, or an
invitation still open — is skipped with its reason and the rest are sent; an
expired invitation is replaced. It is three reads, one insert and one outbox
write whatever the batch size.

API: grants are a resource of their own — `GET /access/grants` by user, role,
location or search; add, revoke, and replace a user's set — with an owner
always kept (checked after the writes, serialised per organization), members
only, revocation kept as history, and one live grant per user, role and
location enforced by the database. Invitations carry the grants they give,
checked when sent; accepting writes them, joins an existing account by its
password, and refuses an invitation that offers nothing. Resend mints a new
link and week behind a sixty-second cooldown; expired is derived on read;
revoke records who and when.

Web: Users, Invitations and Roles & Permissions share the admin shell and one
store slice. A user's page shows and changes their grants; a role's page shows
its holders; invitations are sent as roles at locations; `/accept-invitation`
is the page the email now links to. Proven in the browser end to end,
including the last-owner refusal and joining with an existing account.

What doing it found:

- **No invitation had ever produced a member.** Accepting created an account
  and wrote no grant, and the email linked to `/setup-account` — a different
  flow that read the token as a one-time code — so it could not be accepted
  from the email anyway.
- **`GET /users/:id` and `PUT /users/:id` worked on any account on the
  platform** — `users` is one table for everyone — returning its roles in
  every organization, and letting any admin rename anyone. Both now require
  membership.
- **Nothing stopped the same grant being written twice**, which would have
  made a revoke that removed one copy leave the access in place.
- **The invite form reloaded the page** on submit: a standalone form control
  gives a `<form>` no directive, so `ngSubmit` never ran.
- **`invitations.created_at` and `expires_at` are `timestamp without time
  zone`**, written in the database's UTC and read in Node's Africa/Lagos, so
  a database-defaulted time reads an hour early. New columns here are
  `timestamptz`; the older ones want the same, carefully, since Citus refuses
  the conversion in an ordinary UPDATE.

Held back on purpose: **copy invite link (11).** The link is a credential for
creating an account under someone's email address, marked verified. An admin
who can copy it can accept it themselves and choose the password. It needs
either an unverified email on that path or a second factor before it ships.

### Phase 3 — Document settings *(~2 weeks)* ← **framework done, 26 September**

Generalise `grn-setting` into a document-settings framework rather than
copying it thirteen times: one settings table keyed by document type, a
policy service per document, and a shared appearance block (series, logo,
columns, terms, currency and date format, copies, email template). Then one
settings screen driven by the document type.

Doing this before the sales and procurement UI means those screens are built
against settings from the start, instead of being retrofitted.

**Progress, 26 September 2026.** The framework exists and the first document
is on it:

- `settings.document_settings`: one table keyed by document type, an
  organization row and optional per-location overrides.
- A zod schema per document type (`src/modules/document-settings/definitions`)
  validates, defaults and types the settings, and describes them to the
  screen through `z.toJSONSchema` — titles, help, units and widget hints. One
  screen, Administration › Document Settings, draws every document's
  settings from that description.
- Reads layer defaults, organization and location per key; a stored value
  the schema no longer accepts falls back rather than failing documents.
  Saves are strict and send only what changed.
- **Goods receipts** enforce all of theirs in `CreateGoodsReceiptNoteUseCase`:
  over-receipt tolerance, per-category tolerance, expiry and batch required
  by category, default receiving location. `grn:drill` drives them through
  the use-case on a real order.

**A document type is registered only with the code that enforces its
settings.** That is a departure from the plan above, deliberately. The old
`grn_settings` had twenty-five columns and three were read; building
fourteen empty schemas now would ship thirteen screens of switches that do
nothing. Each of Phases 4 and 6 adds its documents' schemas as it builds
them. The **appearance** block — terms, footer, copies, logo — waits for the
first thing that renders a document (the Phase 4 invoice); the numbering
series already lives in the numbering module, and the settings screen will
link to it rather than duplicate it.

What building it found, all on the receiving path and all fixed:

- `POST /goods-receipt-notes` **had never created a receipt**: its lines were
  inserted without the name and variant snapshot the table requires.
- It could not reach that point anyway — `PurchaseOrderService.findOne`
  joined order lines on the order id alone, which Citus refuses.
- A line's first receipt could never be refused for over-receipt
  (`undefined + qty` is NaN); the per-category tolerance was never given a
  category; a refusal was a 500; and `locationId` was required, so no
  default location could apply.

### Phase 4 — Sell something *(~3 weeks)* ← **API path and screens done, 26 September; waybills and discount policies 7 October; sales lines in their units 8 October — Phase 4 complete**

**First, before any screen:** `sale.sales_quotation_lines` and
`ar_invoice.ar_invoice_lines` are not in Citus at all — plain coordinator
tables with no `organization_id`, while their headers are distributed. Found
24 September; `npm run citus:verify` now fails on it (its tenant-table check
only saw tables that had the column). Both are empty, so the fix is cheap
now: add `organization_id`, distribute colocated with the headers, and set the
tenant explicitly on every line the quotation and invoice services write.
Also: `trade.purchase_requisition_lines` has both `service_item_id` and the
`"serviceItemId"` the entity uses; the first looks dead.

**Discount policies wait for this phase.** They cap discounts by job
function, customer group and order type, and nothing reads them — sales
order lines carry discounts no code checks. A screen now would configure
nothing; they get one alongside the enforcement.

*Enforced 7 October* (SALES.md → Discount policies): rules by item,
category, inventory type, customer group (tag), the writer's job function,
document and quantity band; over a limit refused as quotations, orders
and invoices are written and sent; over a threshold the approval engine
gets the discount facts, and with no approval policy to ask anyone the
sending is refused. Sales → Discount policies writes them; the sales forms
warn before saving. The rule table's `inventory_type_id_id` became
`inventory_type_id` (migration 1780309900000; it had never held a row).

**Where it stands, 26 September.** `npm run sales:drill` walks the whole
path on a live tenant and cleans up after itself: quotation → approval →
sent → accepted → sales order → approval → confirmed → fulfilled (stock
leaves the location) → invoice → approval → posted → a part payment → two
receipts that must be refused → the balance → invoice paid. 34 checks. None
of it worked end to end before; every step below was found by the drill.

- *The line tables.* `organization_id` added to both, defaulted from the
  tenant, distributed colocated (migration `1780304700000`). `citus:verify`
  passes again.
- *Nothing could be created.* Quotations, invoices and receipts each have a
  NOT NULL number (and quotations and invoices a NOT NULL author) that
  nothing set until submission, so every create failed as a "foreign key
  conflict". Each is now numbered and authored when it is created. An
  invoice also requires a location now, which the table always did.
- *Unplannable reads.* Quotation, invoice and receipt lines were eager
  relations joined on id alone, which Citus will not plan; sales order reads
  returned no lines at all. Each `findOne` is a query builder joining its
  lines on the tenant.
- *No policy meant stuck.* Submitting with no approval policy threw "No
  active policy". Now a document with no policy is approved on submission
  (`ApprovalEnginePort.hasActivePolicy`), and a refusal with a reason stays
  a 4xx instead of becoming a 500.
- *False conversions.* "Convert to sales order" and "convert to invoice" set
  the status and created nothing — the same kind of lie as Phase 0's
  postings. Both now create the document and record its id on the source
  (`approvalContextJson.salesOrderId`, `contextJson.invoiceId`). Service
  lines are refused when converting a quotation: sales orders carry
  variants only.
- *Settlement.* A partly paid invoice refused any further payment; a
  receipt could settle another customer's invoice; a receipt could allocate
  more than it held; and two receipts posted together could both pass the
  "not more than due" check. `allocatePayment` is now one conditional
  UPDATE (atomic, customer-checked, part-paid invoices included), and
  posting refuses allocations beyond the receipt's amount.

Still true, and recorded rather than fixed:

- Posting is a receivable only. No GL entries, as Phase 0 left it; say so
  on the screens.
- `POST /ar-invoices/:id/allocate-payment` settles an invoice with a free-text
  reference and no receipt, no cash. It should probably go, with receipts
  the only way to pay; that is a product decision.
- No tenant has any `finance.currency` rows or, except by accident, a GL
  account, and a bank account needs both, so no tenant can take a receipt
  until onboarding seeds them. The drill brings probe ones and removes them.
- Discount policies, above, still unread.


**Screens, 26 September.** The four sales areas are real: one list and one
detail page for quotations, orders, invoices and receipts; a quotation form
that finds or adds a customer and prices items at a location; and "record a
payment" from a posted invoice. Walked end to end in the browser on the dev
tenant (quotation → order → fulfilled → invoice → part payment), then
removed. Using them found four more API faults, fixed: receipts dropped
their date (no column — migration `1780304800000`); every bank-account read
was unplannable; sales orders had no number until submission and the client
could set one; a converted quotation did not say which order it became.
Still true: no tenant has a currency or bank account until Finance exists,
so "record a payment" says so and stops.

**Waybills, 7 October** (SALES.md → Waybills). The API had the whole
lifecycle and none of it held: the client sent the number, status and
author; reads returned no lines; dispatch saved outside the request's
transaction and swallowed a failed stock posting (dispatched, nothing
moved); a line in boxes moved that many units; cancelling on the road
left the goods out of stock; received and disputed were unreachable;
delete removed the row. Now: the server numbers and authors, every write
locks the waybill in the transaction, dispatch posts its stock in the
unit written or fails, cancelling returns the goods, drafts are set aside
and kept, and the screens are real — list, page with its next steps, a
form from a sales order's "Make a waybill" or alone. Found on the way and
left for this phase's remainder: order fulfilment and invoices move base
units whatever the line's unit says.

### Phase 4.5 — Share documents *(~4 weeks)* ← **done, 8 October** (steps 1–3, 5 and 6 by 27 September; step 4's delivery webhooks 8 October — SES, Postmark, SendGrid, Mailgun, Brevo; live views are Phase 4.7; per-address limits done)

A quotation or invoice that can only be seen inside the application has not
been sent. The customer needs it — as a link, as an email with the PDF
attached, as a PDF to forward, on WhatsApp — and the business needs to
choose how open each of those is, and to know what happened after it went.

Sequenced straight after Phase 4 because it is the other half of selling,
and because the pieces it needs are already here: `@nestjs-modules/mailer`,
S3-backed `storage/files`, BullMQ for work, the outbox for events, the
approval engine, and — the main one — Phase 3's document-settings framework,
which is exactly the place for "how do my invoices behave when shared". It
could equally follow Phase 5 (the ledger); nothing in it depends on the GL.

**What others do** (researched 26 September):

- *Stripe* sends a hosted invoice page and, by default, attaches the PDF to
  the email. Links expire relative to the **due date** (30 days after, at
  most 60), and an expired link lands on a recovery page where the customer
  types their email to get a fresh one — expiry without a dead end.
  ([expiry](https://support.stripe.com/questions/invoice-link-expiration),
  [hosted page](https://docs.stripe.com/invoicing/hosted-invoice-page),
  [emails](https://docs.stripe.com/invoicing/integration/send-email))
- *Xero* shares quotes, invoices and credit notes as online links anyone
  holding them can open, downloadable as PDF, and tracks the moment a
  customer opens one. It also **approves a draft when you copy its link** —
  a shortcut around approval we should not copy.
  ([share](https://central.xero.com/0/article/Share-an-online-invoice-link-with-your-customer))
- *Zoho* offers **Public** (anyone with the link) or **Private & Secure**
  (through a customer portal), a link expiry date, **identity verification**
  (an email or SMS code before the PDF will open) and PDF encryption.
  ([portal](https://www.zoho.com/us/invoice/help/customer-portal/),
  [encrypt PDF](https://www.zoho.com/invoice/kb/general/encrypt-pdf.html))
- *PandaDoc* adds passwords, download restriction, expiry, audit logs,
  per-page view analytics, and acceptance with an e-signature — the model
  for quotations. ([sharing](https://www.pandadoc.com/document-sharing-software/))
- *QuickBooks* makes "attach PDF" an organisation setting, tracks sent →
  viewed → paid, and sends **automatic reminders** before and after the due
  date — only for invoices already emailed.
  ([reminders](https://quickbooks.intuit.com/learn-support/en-us/help-article/invoicing/send-invoice-reminders-automatically-manually/L84cQjpxo_US_en_US))
- *OWASP* on secret links: ≥128 bits from a CSPRNG (a UUID is unique, not
  unguessable), stored hashed, revocable, served with
  `Referrer-Policy: no-referrer` and no third-party scripts.
  ([secrets](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html),
  [URLs](https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url))
- *Nigeria's FIRS e-invoicing (MBS)*: invoices are validated by FIRS, which
  returns an **IRN** and a **QR code** to print on them; the buyer then has
  **72 hours to accept or reject** before the invoice is final. Large
  taxpayers first, smaller ones following.
  ([EY](https://www.ey.com/en_gl/technical/tax-alerts/nigerias-federal-inland-revenue-service-rolls-out-e-invoicing-platform),
  [VATit](https://vatit.com/blog/nigerias-e-invoicing-mandate-what-businesses-need-to-know-ahead-of-2025/))

**The model.** One concept, a **share**: a grant to see one document, made
by someone, through a channel, under rules, that can be revoked.

| | |
|---|---|
| *Access* | **Anyone with the link**; **link + passcode** (generated, shown once to the sender to pass on separately — never in the same email as the link); **verified recipient** (a one-time code to the customer's email or phone, Zoho's "identity verification" — the default we should recommend, since nobody has to carry a password); later, **customer portal** (sign in, see every document and a statement). |
| *Channels* | Email (PDF attached or not, from the organisation's sender name, reply-to the salesperson); copy link; WhatsApp / SMS (a prepared message with the link, opened through the device's share sheet or `wa.me`); download PDF; print; QR code on the PDF pointing at the live page. |
| *Page* | A public, branded, read-only page per document — no app chrome, works on a phone — with what the settings allow: download PDF, **accept or decline a quotation** (typed name, optional drawn signature, timestamp, IP — PandaDoc's model), **accept or dispute an invoice** (which lines up with FIRS's 72-hour buyer review), ask a question, and later **pay** (Paystack / Flutterwave, Phase 5+). |
| *Lifecycle* | Expiry as a date or relative to the due / valid-until date (Stripe's rule); revoke one share or all shares of a document; an expired link offers "send me a fresh one" to the recipients it was sent to, never to anyone who asks. |
| *Tracking* | A timeline on the document: sent, delivered / bounced (provider webhooks), viewed (by the page, not a tracking pixel — pixels are unreliable and privacy-hostile), downloaded, accepted / declined, reminded. The salesperson is told live over the existing socket. |
| *Reminders* | Scheduled from settings: before due, on due, after due, repeating; quotation "expires in 3 days". Only for documents already sent (QuickBooks' rule), stopped by payment or acceptance. BullMQ jobs. |

**Settings — per document type, per organisation, overridable per location**
(Phase 3's layering, so a branch can differ from head office):

- Who may share, and which statuses can be shared. **Drafts and documents
  awaiting approval cannot be**; Xero's approve-on-share is the opposite
  choice and it bypasses the approval engine.
- Default access mode, and whether senders may loosen it (e.g. "invoices
  always need verification; quotations may be public").
- Link lifetime: fixed days, or relative to due / valid-until; maximum.
- Passcode rules: length, whether one is required above an amount.
- Page actions on or off: download, accept / decline, dispute, comment, pay.
- Email: subject and body templates per document type with merge fields
  (`{{customer.name}}`, `{{document.number}}`, `{{document.total}}`,
  `{{link}}`, `{{due_date}}`), attach PDF on/off, CC / BCC the sender,
  reply-to.
- Reminder schedule.
- PDF: template, logo, colours, footer, terms, bank details for transfer,
  "DRAFT" / "VOID" watermarks, locale and number format, whether to show
  the QR code, and (for FIRS) the IRN.

**Security** — the reason the invitation "copy link" was held back in
Phase 2 applies here, and this is the design that answers it:

- Tokens: 256 bits from `crypto.randomBytes`, base64url, **only the SHA-256
  stored**, never logged (the request logger must redact the path segment).
  Passcodes hashed with argon2; five wrong tries lock the share for fifteen
  minutes and are audited; rate limits per token and per IP.
- The public page: `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex`,
  no third-party scripts or fonts, a strict CSP, and no PII in the URL. It
  shows the document **as it is now**, and says so plainly when it has been
  voided, cancelled or replaced — never a stale total.
- **Citus.** A token arrives with no tenant, and `document_shares` is
  distributed on `organization_id`, so a token lookup would fan out to every
  shard. *As built:* the token carries its tenant, `<organizationId>.<secret>`,
  the format invitations already use — the organisation id is not a secret,
  the 256-bit part is. The id pins the lookup to one shard inside
  `transactions.runAs`, and `(organization_id, token_hash)` finds the share.
  The reference table sketched here first (`tenant.share_tokens`) was not
  needed: it would have been a second write per share and a table every
  node replicates, to learn what the token can simply say.
- *As built*, too: passcodes are hashed with bcrypt (the hasher the project
  already has), not argon2; the link is also kept **sealed** (AES-256-GCM
  under a key derived from `TOKEN_SECRET`) so a sender can copy it again
  later — a database dump alone opens nothing. The public endpoints take the
  token in the request body, never the URL; the browser route `/d/<token>`
  does carry it, so the web server's access log must drop that path segment
  (a deploy task, not yet done). Lock-outs and code limits are **per share**;
  per-address limits sit on top of them (step 4, below).
- Every share, view, download, acceptance and revocation is an outbox event
  whose **payload carries `organizationId`** (the contract rule), feeding
  the timeline and an audit log.

**Steps**

1. ✅ `sharing.document_shares` + `document_share_events` +
   `share_verifications`; settings schemas registered for quotations and
   invoices; create / revoke / list / copy link; `sharing:drill` (38
   checks) proving expiry, revocation, passcode lock-out, refusal for
   drafts, single-use codes, and that a token never resolves across
   tenants.
2. ✅ PDF rendering. *As built, and why it differs from the plan above:*
   **pdfmake in process, not headless Chromium.** A quotation renders in
   ~10 ms (500 lines in ~60 ms) at 10–75 KB, against ~0.5 s and 100 MB+
   per Chromium page — at 200k users the difference is a fleet. It also
   keeps a browser out of the Alpine image, and the renderer is locked
   down: no URL fetches, no file reads outside its font directory, the logo
   read from the bucket by key. **Not stored:** an approved document cannot
   be edited, so re-rendering prints the same thing (only a PAID / VOID
   stamp moves), and rendering is cheaper than an S3 GET. Watermarks DRAFT,
   PAID, VOID, DECLINED, EXPIRED; letterhead from the organisation, the
   issuing location's address and the brand colour and logo; the
   quotation's terms; a per-type note (bank details); a QR code to the live
   page on PDFs that go out with a link. Settings: attach to email, allow
   download, QR on/off, the note. Chromium (Gotenberg as a sidecar) stays
   the route if organisations ever author their own HTML templates.
   **Attachments only for links anyone can open** — a PDF riding with the
   email would get round a passcode or an emailed code. Proven by
   `sharing:drill` (48 checks) and in the browser.
3. ✅ The public page — an
   Angular route outside the shell — with quotation accept / decline, the
   quotation's terms, print, and Download PDF when the share allows it.
4. 🟡 Email send with templates, merge fields and the PDF attached, and
   the timeline on the detail page, are done. The mail queue no longer keeps
   sent jobs (they held links, codes and attachments in Redis indefinitely).
   **Per-address limits — done 26 September.** A guard on every route that
   skips authentication, counted in Redis with a sliding-window counter
   (Cloudflare's: two integers per key, one Lua call per check), so a limit
   holds across instances; if Redis is unreachable it counts per instance
   rather than failing open. Three policies, sized for carrier-grade NAT —
   in Nigeria one address is often a great many phones, so the tight limits
   count *failures* or *one recipient*, never everything:

   | Policy | Routes | Limits (per address unless said) |
   |---|---|---|
   | `public` | any unauthenticated route | 300 a minute — a flood backstop |
   | `credential` | sign-in, 2FA, reset, confirm, account setup, invitation accept, share passcode and code | 30 a minute; **20 wrong answers per 15 minutes**, per route — a right answer costs nothing |
   | `sends` | register, forgot password, resend confirmation, share code | 5 a minute, 30 an hour, **5 an hour to one recipient** from any address (hashed in Redis) |
   | `socket` | `/live` handshake | 120 a minute; 30 failed handshakes per 15 minutes |

   `/live` subscribe messages are limited to 60 a minute per connection.
   Refusals are 429 with `Retry-After` and "Too many attempts. Try again in
   10 minutes." — which the sign-in and share pages already show. IPv6 is
   counted by /64. **`TRUST_PROXY`** (default `loopback`) tells Express which
   hops are our proxies, so `request.ip` is the client — it was the load
   balancer's address in any proxied deploy, in the limits and in every
   "accepted from" record; `true` is refused because it lets a client pick
   its own address. The socket handshake reads the address with the same
   trust. `RATE_LIMIT_EXEMPT` lists addresses no limit applies to.
   Authenticated routes are not limited per address — a signed-in person is
   better limited as themselves, a separate budget when one is needed.
   Proven by `rate-limit:drill` (14 checks against the running API and
   Redis, using TEST-NET addresses through the trusted loopback proxy).
   Left: bounce and delivery webhooks (see *Delivery webhooks* below),
   live "viewed" notifications.
5. ✅ Verified-recipient access by email code; SMS when a provider is chosen.
6. ✅ Reminders. Invoices: before the due date, on it, then every N days up
   to M times (3 / on / 7 / 3 by default); quotations: N days before they
   expire. At 09:00 in the issuing location's timezone. Armed when a
   document is emailed (a checkbox in the share dialog, on by default when
   settings allow), using that email's link, recipients and attachment
   rule; stopped by payment, an answer, voiding, the link ending, or by
   hand — and a stop someone chose is not undone by emailing again. Send
   one now, stop, resume on the document; every reminder on the timeline;
   `{{when}}` in the templates ("is due in 3 days", "is 7 days overdue").
   *Design:* the next reminder is a row (`sharing.document_reminders`),
   not a delayed job — the page can show it, settings can re-plan it, and a
   flushed Redis cannot cancel it. A BullMQ job scheduler sweeps every five
   minutes (one sweep however many instances), claims each due row on its
   shard with a lease, and hands it to a retrying job; the plan advances in
   the same transaction the email is queued, so a job for a plan that has
   moved on sends nothing. Proven by `sharing:drill` (58 checks, the real
   worker included) and in the browser.
7. WhatsApp / SMS share, QR code on PDFs.
8. **Sending as the organisation** (below): verified domain, own SMTP,
   Gmail / Microsoft 365 — built on Phase 4.6's connection store.
9. Later, each needing its own decision: customer portal with statements;
   online payment; FIRS MBS integration (IRN + QR, buyer accept/reject);
   UBL export; e-signature beyond typed acceptance.

**Sending as the organisation** *(asked for 26 September)*

Today every email leaves through the platform's own mailer. That is the
right default — it works on day one — but a business wants its invoices to
come *from* `accounts@its-domain.com`, to land in the inbox rather than
spam, and some already pay for a mail service they want used. What others
do:

- *Zoho Invoice / Billing* offers three: its own servers, Gmail / Outlook
  connected by OAuth, or an **email relay** — the organisation's SMTP
  server with host, port, TLS, credentials and a **daily limit**, applied
  to a whole domain or one address.
  ([relay](https://www.zoho.com/us/billing/help/settings/notifications/emails.html),
  [Gmail / Outlook](https://www.zoho.com/us/invoice/help/integrations/email-integration.html))
- *Invoice Ninja* lets each user connect Google or Microsoft by OAuth, or
  choose SMTP, Postmark or Mailgun; mail sent through the customer's own
  provider carries no platform unsubscribe footer.
  ([hosted mail](https://invoiceninja.github.io/docs/hosted/hosted-mail))
- *Xero* sends "on behalf of" the organisation from its own servers without
  the organisation's DKIM, and invoices land in spam often enough that a
  small market of add-ons exists to fix it — the lesson is that a
  *From* address the sending server cannot authenticate is worse than an
  honest "via".
  ([Not the Junk Folder](https://www.notthejunkfolder.com/guides/xero-invoices-going-to-spam),
  [Paidnice](https://www.paidnice.com/blog/send-invoices-from-your-domain-xero))

Four **senders**, chosen per organisation and overridable per location
(a branch with its own mailbox):

| Sender | How | Trade-off |
|---|---|---|
| *Platform* (default) | Our provider; `From: "Acme Ltd via Commerce" <no-reply@…>`, `Reply-To:` the salesperson. | Works at once; honest "via"; bounces and opens through our provider's webhooks. |
| *Verified domain* | The organisation adds the DKIM / SPF / return-path records we show them; we check DNS, then send **as** `invoices@acme.ng` through our provider. | Best deliverability and keeps our webhooks; needs a provider with per-domain identities (SES, Postmark, Resend, Mailgun). **Recommended for most.** |
| *Own SMTP* | Host, port, TLS mode, username, password, daily cap; a **test send** before it can be saved as active. | For businesses with a relay already; no delivery webhooks, so the timeline says "handed to your mail server", not "delivered". |
| *Mailbox (OAuth)* | Connect Google Workspace (Gmail API) or Microsoft 365 (Graph `sendMail`); mail sends as the connected user and appears in their Sent folder. | Personal and familiar; subject to the mailbox's own sending limits; tokens expire and must be refreshed or re-connected. |

Rules that go with it:

- **Secrets never come back.** SMTP passwords and OAuth refresh tokens are
  sealed (envelope encryption: a per-row data key under a KMS / env master
  key), written once, shown as `••••` afterwards, never logged, never in an
  outbox payload. Rotation re-seals.
- **SSRF.** An SMTP host is a URL our servers will connect to: it must
  resolve to a public address, only ports 25 / 465 / 587 / 2525, re-checked
  at connect time (DNS rebinding), with a timeout.
- **Failure is loud, not silent.** When a custom sender fails (bad
  password, expired OAuth, over the daily cap), the send fails visibly on
  the document's timeline and the admins are told; falling back to the
  platform sender is a **setting**, off by default, because a customer
  getting mail from an unexpected address is its own problem.
- One BullMQ mail queue, a **transport per organisation** resolved at send
  time and cached briefly; per-organisation concurrency so one tenant's
  slow SMTP server cannot stall everyone's mail.
- Permission `settings.integrations.manage`; every connect, test, change
  and disconnect audited.

**Decisions for you:** the default access mode (**taken 26 September:**
verified recipient for invoices, link for quotations); the payment
provider (now Phase 4.10); the platform email provider (**settled 27
September:** Commerce's own sender is set in the environment and picked
later, so nothing waits on it; what gets built is every provider an
organisation may choose); the SMS/WhatsApp provider (the same: the
organisation's choice, Phase 4.9); and whether FIRS e-invoicing should be pulled
forward for tenants above the turnover threshold.

**Delivery webhooks** *(planned 26 September — organisations bring
different providers, so this is built for many, not one)*

Whichever sender an organisation picks, the document's timeline should say
what became of each email: *delivered*, *bounced — mailbox does not exist*,
*marked as spam*. Each provider reports that differently, so the plan is one
normalised model and an adapter per provider.

*The statuses we keep*, per message and recipient, and only ever forwards
(a late *deferred* never overwrites *delivered*):

| Status | Meaning | What follows |
|---|---|---|
| `accepted` | the provider (or the SMTP server, with a 250) took it | "handed over"; the terminal status for senders that report nothing more |
| `delivered` | the recipient's server accepted it | timeline tick |
| `deferred` | temporary refusal; still being retried | shown, nothing stops |
| `bounced` | permanent failure (hard), or a soft one the provider gave up on | shown with the diagnostic; reminders to that recipient stop; the recipient is suppressed for the organisation |
| `complained` | the recipient marked it as spam | reminders to them stop for good; the sender is told |
| `dropped` | the provider refused to send (its own suppression list, invalid address, blocked) | shown as not sent |
| `failed` | our side: bad credentials, expired OAuth, over the daily cap | loud, per *Sending as the organisation* |

Opens and clicks are **not** collected, even from providers that offer them:
the page records "viewed" itself (step 4), and a tracking pixel is both
privacy-hostile and unreliable — Apple Mail fetches every image on delivery.

*The catalogue — email*

| Provider | Reaches us by | Events mapped | Authenticity | Our id travels in |
|---|---|---|---|---|
| **Amazon SES** | SNS topic (HTTPS subscription) or EventBridge | Send, Delivery, DeliveryDelay, Bounce (Permanent / Transient), Complaint, Reject, Rendering Failure | SNS message signature (certificate fetched only from `sns.<region>.amazonaws.com`); confirm the subscription | message tags on a configuration set |
| **Postmark** | webhook per message stream | Delivery, Bounce (typed), SpamComplaint | **no signature** — HTTP Basic credentials we generate, in the URL, plus Postmark's IP ranges | `Metadata` |
| **SendGrid** | Event Webhook, events batched in one array | processed, delivered, deferred, bounce, dropped, spamreport | ECDSA signature over timestamp + raw body, verified with the account's public key | `custom_args` |
| **Mailgun** | webhook per domain | accepted, delivered, temporary_fail, permanent_fail, complained | HMAC-SHA256 of timestamp + token with the signing key; reject stale timestamps and replayed tokens | `v:` user variables |
| **Resend** | webhooks through Svix | email.sent, .delivered, .delivery_delayed, .bounced, .complained, .failed | Svix HMAC-SHA256 over `id.timestamp.body`, five-minute tolerance | tags |
| **Brevo** | transactional webhook | request, delivered, deferred, softBounce, hardBounce, blocked, invalid, spam, error | Basic credentials in the URL, or a bearer token header | `X-Mailin-custom` header |
| **Mailjet** | Event API | sent, bounce (with hard/soft flag), blocked, spam | Basic credentials in the URL | `CustomID` / `EventPayload` |
| **Zoho ZeptoMail** | webhook | hard bounce, soft bounce (no delivery event) | an authentication key sent with each call | client reference *(to confirm when built)* |
| **SMTP2GO** | webhook (JSON) | processed, delivered, bounce, spam, reject | optional Basic credentials in the URL | custom header |
| **Mailchimp Transactional** (Mandrill) | webhook | send, deferral, soft_bounce, hard_bounce, spam, reject | `X-Mandrill-Signature`, HMAC-SHA1 over the URL and sorted fields | `metadata` |
| **Own SMTP relay** | nothing — SMTP has no callbacks | `accepted` from the 250 reply; bounces only by VERP (below) | — | `Message-ID` header |
| **Google Workspace** (OAuth mailbox) | no delivery events; bounces arrive as reports in the sender's inbox | bounced, from `multipart/report; report-type=delivery-status` quoting our Message-ID | Gmail `users.watch` → Pub/Sub push | `Message-ID` header |
| **Microsoft 365** (OAuth mailbox) | as Google: reports in the inbox | bounced, the same way | Graph change notifications on the Inbox, with validation token and `clientState`; subscriptions expire within days and are renewed | `Message-ID` header |

*Where there is no webhook.* For an organisation's **own SMTP relay** the
envelope sender (Return-Path) becomes `bounces+<message>.<mac>@bounce.<our
domain>` (VERP), so a bounce comes back to our inbound mail — the platform
provider's inbound route — and is read as an RFC 3464 report. That works
wherever the relay keeps our envelope sender, which most do; Gmail's and
Microsoft's SMTP rewrite it, which is why the OAuth mailboxes read their own
inbox instead. Reading the inbox needs a read scope on top of send, a
heavier consent, so it is **opt-in**, and only delivery reports that quote
one of our Message-IDs are ever read. Without either, the timeline says
"handed to your mail server" and stops there — honestly.

*The catalogue — SMS and WhatsApp (step 7)*

| Provider | Delivery reports | Authenticity |
|---|---|---|
| **Termii** | webhook: delivery status per message | `X-Termii-Signature`, HMAC-SHA512 of the payload |
| **Africa's Talking** | delivery-report callback: Success, Failed, Rejected, Buffered, … | no signature — a secret in the URL, plus the callback's source ranges |
| **Twilio** | `statusCallback` per message | `X-Twilio-Signature`, HMAC-SHA1 over URL and fields |
| **WhatsApp Cloud API** (Meta) | webhook `statuses`: sent, delivered, read, failed | `X-Hub-Signature-256` with the app secret; verify-token handshake |

*How it is built*

1. **One route per connection:** `POST /api/v1/hooks/<provider>/<ref>`,
   where `ref` is `<organizationId>.<random>` — the tenant pinned in the
   reference, as share tokens do, so a call lands on one shard. The
   platform sender has one platform reference, and finds the organisation
   from our message id. The raw body is kept for signature checks.
2. **An adapter per provider**, three pure functions — `verify(request,
   secret)`, `parse(body) → events[]` (a call may carry a batch), and
   `correlate(event) → our message id` — each tested against the provider's
   documented sample payloads. Adding a provider is an adapter and its
   fixtures, nothing else.
3. **Verify, record, answer.** An unverifiable call is a 401 and counts as
   a failure against its address. A verified one is de-duplicated on the
   provider's event id (or a hash of the event) with a unique key, kept raw
   for 30 days, answered 200 at once, and applied by a BullMQ job — every
   provider retries, and none waits long.
4. **Correlation from our side:** each recipient's message gets our id
   when it is queued (`sharing.email_messages`: organisation, document,
   share, recipient hash, provider, provider message id, status,
   `last_event_at`), sent as the `Message-ID` and in the provider's
   metadata field (table above).
5. **Effects:** the status on the share's timeline (an outbox event, so the
   screen hears it live — Phase 4.7); hard bounces and complaints add the
   recipient to the organisation's **suppression list** (hashed), which the
   share dialog warns about and reminders respect.
6. **Rate limits:** these routes are not held to `public` per address —
   providers send bursts from a few addresses — but to a `webhook` policy
   per connection; only unverified calls count against an address.
7. **Settings:** each connection shows the URL and secret to paste into the
   provider, "last event received", and a test button where the provider
   has one.

*As built, 8 October:* SES, Postmark, SendGrid, Mailgun and Brevo are
providers in the email slot, each through its own SMTP relay with its
tracking header; the platform's provider is `MAIL_DELIVERY_*` in the
environment, its webhook at `/hooks/email/<provider>/platform`. Receipts,
per-recipient messages and suppressions are tables of their own; the
share's timeline gets a `delivery` event per change (on its next read, not
yet live); reminders skip suppressed addresses and the share dialog warns.
Proven by the adapters' sample payloads with real signatures, an HTTP e2e,
and `delivery:drill` against MailDev (INTEGRATIONS.md → Email providers and
delivery webhooks). Left: Resend and ZeptoMail (their SMTP correlation to
confirm), Mailjet, SMTP2GO, Mandrill, VERP for own SMTP, and the Gmail /
Microsoft 365 inbox readers with OAuth.

*Order:* the platform's own provider is set in the environment and chosen
later (27 September), so the adapters come in the order organisations
bring them: SES and Postmark, then SendGrid, Mailgun, Brevo, Resend and
ZeptoMail, each as a provider in the email slot on Phase 4.6's connection
store, with the platform reusing whichever adapter it ends up on; then Mailjet, SMTP2GO, Mandrill; the VERP bounce address for own
SMTP; and the Gmail / Microsoft 365 inbox readers last, opt-in.

### Phase 4.6 — Integrations *(~3 weeks for the foundation, then per connector)* ← **foundation and own SMTP built, 27 September; every connector in the table built by 10 October (Resend, ZeptoMail, Sage, the MCP writing tools and SAML last) — Phase 4.6 complete**

Organisations will want documents and events to reach the tools they
already use: their CRM, accounting package, payment provider, file store,
chat. *PandaDoc* is the reference catalogue
([integrations](https://www.pandadoc.com/integrations/), read 26 September).
It groups about forty integrations as:

- **CRM / CPQ** — HubSpot, Salesforce, Pipedrive, Zoho, Dynamics, Copper,
  monday.com, Freshsales… embedded *inside* the CRM, pulling deal and
  contact data into documents.
- **Payment** — Stripe, PayPal, Square, QuickBooks Payments, Authorize.Net:
  "get paid inside the document".
- **Accounting** — QuickBooks Online, FreshBooks: signed contract → invoice.
- **Storage** — Dropbox, OneDrive: import content, back up completed
  documents.
- **Productivity** — Slack and Teams notifications, Google Sheets bulk
  send, Google Docs.
- **Integration platforms** — Zapier and Make, for everything not built.
- **Admin** — single sign-on.
- **AI** — ChatGPT and **Claude** connectors: create, send and query
  documents from the assistant.
- Several are **Premium**, so integrations are also a plan lever.

**The organisation chooses** *(asked 27 September)*. Any organisation may
want any provider — its own SMTP or SES or Postmark, Termii or Twilio,
Paystack or Flutterwave, its own webhooks — so none is chosen for it in
code. Each kind of integration is a **slot** an organisation fills from a
catalogue, in an **Integrations** settings area beside Document settings,
per organisation and overridable per location like every other setting:
*Email sending* (platform, verified domain, own SMTP, Gmail / Microsoft
365), *SMS / WhatsApp*, *Payments*, *Delivery tracking* (the webhook
catalogue in Phase 4.5), *Outgoing webhooks*, and connectors. The platform
default fills a slot until the organisation picks something else. *As built (27 September):* `integrations.connections` (distributed;
config readable, secrets sealed with AES-256-GCM under their own key and
never returned — the page shows only that one is stored) and
`integrations.connection_events` (connected, changed, test passed or
failed, failing, recovered, disconnected — who and when). A catalogue in
code: a provider can be chosen only when the code behind it exists; the
rest are listed as coming. **Email sending** works both ways: Commerce
(now "Acme Ltd via Commerce") or the organisation's own SMTP server —
signed in to before it is saved, a test email to the admin, and its
documents, codes and reminders then sent from its own address through its
own server, per organisation or location. A failure marks the connection
failing and fails the message visibly unless the organisation chose to fall
back to Commerce. SSRF: the host must resolve to a public address on a mail
port, re-checked whenever a transport is built (at least hourly), and the
connection goes to the checked address; a local relay only in development.
Admin → Integrations in the web, drawn from the server's schemas like
document settings, permission `admin.access.organizations.update`. Proven
by `integrations:drill` (10 checks against MailDev) and in the browser.
*Next here:* email providers for organisations (SES, Postmark, SendGrid,
Mailgun, Brevo, Resend, ZeptoMail), each with its delivery webhooks
*(all seven built: the first five 8 October through their relays; Resend
and ZeptoMail 10 October through their APIs — INTEGRATIONS.md → Email
providers)*. The
platform's own provider stays an environment setting (27 September).
Then outgoing webhooks. SMS, WhatsApp, Telegram, push and chat now arrive
as channels of **Phase 4.9 Notifications**. Payments are **Phase 4.10**.

**What to take, and what not.** PandaDoc sits *beside* a system of record,
so its integrations pull data in. Commerce *is* the system of record for
stock, sales and (from Phase 5) the ledger, so ours mostly **push out**:
events, documents and payments. That changes the order — a generic outlet
first, native connectors only where a generic one is not enough.

**Foundation (built once, used by every connector):**

1. `integrations.connections` — distributed on `organization_id`:
   provider, kind, scope (organisation or location), status (`connected`,
   `failing`, `expired`, `disconnected`), non-secret config (jsonb), sealed
   secrets, who connected it, `last_ok_at`, `last_error`. Phase 4.5's
   custom mail senders are its first tenant.
2. **OAuth 2 connect flow** *(built 8 October: INTEGRATIONS.md → Signing
   in to connect; Google Workspace and Microsoft 365 mail)* — `state` bound to organisation + user +
   expiry, PKCE, callback, token refresh in a BullMQ job ahead of expiry,
   disconnect revokes at the provider. A connection that fails refresh goes
   to `expired` and tells the admins, never silently.
3. **Outgoing webhooks** *(built 8 October: INTEGRATIONS.md → Outgoing
   webhooks; thin events — what changed, its id and status — read further
   through the API; 14 objects × created, updated, status_changed,
   deleted)* — an organisation subscribes a URL to event types
   (`quotation.accepted`, `invoice.posted`, `payment.received`,
   `share.viewed`, `stock.low`…). Delivered from the **outbox** (so a
   rolled-back transaction never fires one), signed with HMAC-SHA256 and a
   timestamp, retried with back-off, a delivery log with replay, auto-pause
   after repeated failures. Same SSRF rules as SMTP.
4. **API keys** *(built 8 October: a key acts as its maker within its
   permissions; INTEGRATIONS.md → API keys, AUTH.md)* — per organisation, scoped to permissions, hashed, shown
   once, last-used shown, revocable; the existing API becomes usable by
   the organisation's own scripts.
5. An **Integrations** screen: a catalogue by category, connection health,
   and each connector's settings.

**Connectors, in suggested order:**

| | Why | Depends on |
|---|---|---|
| Email senders (verified domain, SMTP, Gmail, Microsoft 365) | Asked for; invoices must arrive | foundation 1–2 |
| **Zapier / Make** app *(REST hooks built 8 October; the apps are made in their consoles against INTEGRATIONS.md → Zapier, Make and n8n)* | Covers the long tail at once (Sheets, Slack, CRMs) | webhooks + API keys |
| Payments: **Paystack, Flutterwave**; Stripe / PayPal for foreign customers | "Pay" button on the shared invoice; receipts post automatically. **Planned in full as Phase 4.10** (Hyperswitch pattern) | Phase 5 ledger |
| Slack / Microsoft Teams | "Acme accepted QUO-0042", approvals from chat. **Now channels of Phase 4.9** | webhooks |
| Google Drive / Dropbox / OneDrive *(built 8 October: INTEGRATIONS.md → Document archive)* | Archive sent and accepted PDFs per customer | PDF rendering (4.5 step 2) |
| WhatsApp Business (Cloud API) / SMS (Termii, Twilio) | Share and remind where Nigerian customers actually read. **Now channels of Phase 4.9** | 4.5 steps 5–7 |
| Accounting export: QuickBooks Online, Xero, Sage *(QuickBooks and Xero built 8 October, Sage 10 October: INTEGRATIONS.md → Accounting export)* | For businesses keeping their books elsewhere | Phase 5 |
| CRM: HubSpot, Zoho, Salesforce, Pipedrive *(built 8 October: INTEGRATIONS.md → CRM)* | Contacts and deals in; quotation status out | foundation |
| **SSO** (SAML / OIDC: Google, Microsoft Entra) *(OIDC built 8 October, SAML 10 October with @node-saml/node-saml: INTEGRATIONS.md → Single sign-on)* | Larger tenants require it | Auth |
| **MCP server** (Claude, ChatGPT) *(read tools built 8 October, writing tools 10 October; **agent-ready, built 1 November 2026**: MCP 2026-07-28 with the older revisions kept (2024-11-05 dropped), every API route a tool (about 3,950, [MCP_CATALOG.md](MCP_CATALOG.md)) with read / draft / confirm effects and a per-connection policy, idempotency keys, questions to the person in the chat, progress and tasks with push, a module → record type → operation tree with hybrid search, and OAuth sign-in for agents ([AUTH.md](AUTH.md)) with consent, connections and an organisation switch; the web screens are built; left for the full application test: the drill and e2e / Cypress runs, live clients (Claude Code, Claude Desktop), and that reports can be run but not exported, scheduled or saved over MCP: INTEGRATIONS.md → The MCP server)* | "What's overdue?", "Send QUO-0042 to Ada" — permission-scoped, read-first | API keys, and OAuth for agents |
| FIRS MBS | Statutory e-invoicing | its own decision (4.5) |

**Decisions for you:** whether integrations are gated by plan (PandaDoc
gates Salesforce, OneDrive, QuickBooks, Sheets); the first payment
provider (Phase 4.10); and whether Zapier/Make comes before any native connector
(recommended: yes, with email senders the one exception).

### Phase 4.7 — Live everywhere *(~4 weeks, then per module)* ← **steps 1–4 done, 26 September; step 5 (roles and load) 8 October; step 6 done 10 October** (loyalty and outreach last) — **Phase 4.7 complete**

§3n, in this order — each step makes the next safe, and the pilot is the
case that was asked for:

1. **Events worth acting on** *(2–3 days)*. Enrich the lifecycle payload
   (action, location, status, version, actor) and its contracts; wake the
   relay on commit; find the writes that bypass the subscriber in the sales
   documents (payment allocation first) and record their events. A drill
   lists every aggregate whose status can change without an event.
2. **`/live` gateway** *(3–4 days, parallel with 1)*. Handshake auth, the
   `user:<id>` room and disconnect on sign-out or revocation, channel
   subscriptions authorized by permission and location, presence,
   back-pressure. The 47 namespaces keep working until their modules move.
3. **Live entities — the pilot** *(3 days)*. Quotations, sales orders,
   invoices and receipts publish notices; the open document's `doc:`
   channel carries its sharing timeline. Web: `LiveService` in `@core`, and
   the sales effects patch status in lists and detail. *Done when a
   customer accepting on the shared page turns the salesperson's open
   quotation to Accepted, with "Ada accepted it" on its timeline, and no
   refresh* — which also closes Phase 4.5 step 4's live views.
4. **Typed metrics** *(1 week)*. `defineMetric`, the registry, the
   envelope, TTLs, OpenAPI export; the three sales metrics first, with
   figures worth showing (by status, open value, expiring, accepted), and
   cards on the sales lists. Then the remaining 42 converted mechanically,
   their `Set`/`Get`/gateway files deleted.
5. **Roles and load** *(1 week)*. The `api`/`worker` split with the Redis
   emitter; a load test — 10,000 sockets, 100 writes a second across 50
   tenants — measuring write-to-screen p95 and Redis pub/sub throughput,
   with the sharded Redis adapter as the next step if one Redis channel
   becomes the ceiling.
6. **Module by module** after that, each by the §3n checklist; a module's
   "done" includes its screens updating without a refresh.

**Decisions for you:** whether presence ("who is viewing") is wanted on
documents; and when the worker role becomes its own deployment — it can
wait for the load test to say so.

**Reports, 6 October 2026.** Asked when reports were found to re-run every
query on every opening: a report's run is cached in Redis while nothing it
reads has changed, and `report:<key>` on `/live` tells the screens that have
it open — 27 of 30 are live, 15 cached (ANALYTICS.md, "Reports cached and
live"). The rest read tables nothing announces: line tables, variants,
stock valuations, books and accounts, HR's and approvals' — each joins when
its writers raise events. Locations now do.

**Progress, 26 September 2026.** Steps 1–4 are done, and the pilot works.

1. *Events worth acting on.* Lifecycle events now carry action, location,
   status, version and actor. The outbox wakes the relay when a
   transaction commits (a new after-commit hook on `runAs`), so a change
   reaches a screen in ~235 ms instead of waiting out an idle poll. Writes
   that went round the subscriber were moved onto the repository: AR
   payment allocation, GRN approval and purchase-order receipts as
   row-locked read-then-save (the lock keeps the race protection the single
   UPDATE gave), payroll runs from `update()` to `save()`. Two bulk writes
   keep one statement for thousands of rows and record their events
   explicitly (catalogue import — which had also been writing outside its
   transaction — and bulk product edits). `event-coverage.spec` fails the
   build on either kind of bypass.
2. *`/live` gateway.* Authenticated in the handshake; a socket joins its
   user and session rooms and closes at token expiry and on sign-out, on
   every instance. Channels are authorized like REST reads, per location:
   a person hears about a document only where one of their roles carries
   the module's read permission; owners hear everything.
3. *The pilot.* A customer accepting on the shared page turned the
   salesperson's open quotation to Accepted, with "Accepted by …" on its
   timeline, and cancelling it in another tab turned the list row — with
   no reload. `live:drill` proves the rest against the running API:
   location scoping, no permission no notice, order by version, sign-out.
4. *Typed summaries.* `defineMetric` — a zod schema, the aggregates that
   make it stale, the permission, one tenant-pruned query — for quotations,
   sales orders, invoices, receipts, products and stock, shown above their
   lists. Computed in the background and never on a request: a change
   stamps the summary stale, the coalescer recomputes each watched scope
   once per 2 s, the result is validated, cached with a TTL and pushed to
   every connected socket in that scope. A subscribe answers at once from
   the cache, or with nothing and a computation started. Schemas are
   OpenAPI components, so the web's types are generated. The old untyped
   `{ totalCount }` metric is gone from those modules; the 40 that remain
   have a TTL and `computedAt` until their screens adopt a summary.

Found on the way: the stock page's reorder banner counted only the rows on
the page it showed (1 at Storefront, where 4 were low); the summary's
location-wide figure replaced it. REST list endpoints still do not scope by
location (§3k) — sockets are now stricter than the lists they update.

**Every module's summary.** What each module shows at the top of its
screen, chosen from what comparable products lead with. Built with the
module's screen, not before (no summary without a screen); each is one
`defineMetric` beside the module, following the ones above.

| Module | Summary | Reference |
|---|---|---|
| Quotations ✅ | open pipeline and value, expiring in 7 days, acceptance rate (30 d), not yet sent | HubSpot, Odoo quotes |
| Sales orders ✅ | to fulfil, late for delivery, to invoice, ordered this month | Zoho Inventory |
| Customer invoices ✅ | outstanding, overdue with aging 0/30/60/90+, due in 7 days, DSO | QuickBooks, Xero |
| Receipts ✅ | received this month / 30 d, not posted, voids | QuickBooks |
| Products ✅ | active, without a price, not stocked, inactive | Shopify admin |
| Stock ✅ | value at cost and price, low, out, below zero — per location | Zoho Inventory |
| Waybills | to dispatch, in transit, delivered this week, late | Zoho Inventory |
| Purchase requisitions | awaiting approval, approved not ordered, value by department | Odoo Purchase |
| Purchase orders | open value, awaiting receipt, late receipts, spend this month by supplier | Odoo purchase dashboard |
| Goods received | received this week, awaiting inspection, short or over deliveries | Odoo |
| Supplier invoices | payable, overdue with aging, due in 7 days, DPO | QuickBooks AP |
| Supplier payments | paid this month, scheduled, not posted | QuickBooks AP |
| Suppliers | active, on-time delivery rate, top by spend | Odoo vendor analysis |
| Customers (CRM) | new this month, active in 90 d, top by revenue, with overdue balance | HubSpot |
| Deals / pipeline | open value by stage, won this month, win rate, stalled over 30 d | HubSpot, Pipedrive |
| Activities | due today, overdue, done this week | HubSpot |
| Support tickets | open, breaching SLA, first-response time, resolved this week | Zendesk |
| Loyalty | members, points issued vs redeemed this month, liability | Shopify loyalty apps |
| Appointments & reservations | today, no-shows (30 d), utilisation | Square Appointments |
| Staff | headcount, joiners and leavers this month, turnover (12 m) | BambooHR |
| Attendance | present today, late, absent | BambooHR, Deel |
| Leave | on leave today, requests awaiting approval, balance liability | BambooHR |
| Payroll | next run and its gross, last run net, runs awaiting approval | Gusto, BambooHR |
| Performance | reviews due, overdue, goals on track | Lattice |
| Journal / general ledger | unposted entries, trial balance difference (must be 0), last close | Xero |
| Cost centres | spend vs budget this month | Odoo analytic |
| Approvals | waiting on me, breaching SLA, approved this week | — (the engine's own) |
| Users & access | active users, pending invitations, users with no role | Google Workspace admin |

References: [QuickBooks / Xero AR aging and DSO](https://www.vertaccount.com/blog/best-accounts-receivable-dashboard-examples-templates-for-2026/),
[HubSpot quotes](https://knowledge.hubspot.com/quotes/manage-quotes),
[quote-to-cash KPIs](https://www.quotewerks.com/blog/Quote-to-Cash-KPIs-You-Need-to-Watch-QuoteWerks.asp),
[Zoho Inventory dashboard](https://www.zoho.com/us/inventory/help/getting-started/dashboard.html),
[Odoo purchase dashboard](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/purchase/advanced/purchase_dashboard.html),
[BambooHR headcount and turnover](https://www.bamboohr.com/product-updates/turnover-data-on-home).

**Step 5, 8 October:** `APP_ROLE` (all, api, worker) splits the
processes; a worker pushes through its own socket server on the Redis
adapter. `npm run live:load`: 10,000 sockets, 100 pushes a second across
50 rooms, none lost, p95 7 ms on one laptop (LIVE_UPDATES.md → Roles and
load). **Step 6, 8 October (first part):** buying (requisitions to
returns), waybills, supplier bills and payments, suppliers and products
send entity notices, and each of their lists and detail pages follows
them (`followLive`). **Second part, 8 October:** stock positions (told
when the on-hand read model has applied a movement), journal entries,
adjustment memos, contacts, deals, activities and support tickets.
**Left in Phase 4.7:** step 6 for HR, payroll, loyalty and communication,
with their screens. Also: notices are not yet merged per 250 ms under
bursts, and presence ("who is viewing") awaits your decision.

**Separations, 18 October** ([plan](../../design-handoff/plans/2026-10-18-erp-separations.md)):
the background workers are their own deployment, in pools by queue family
(`WORKER_QUEUES`: drive, communication, general; the `api` role builds no queue
worker or schedule); live envelopes travel on plain Redis room channels and the
ERP's `/live` can be served by the Go realtime gateway (commerce-realtime)
behind the Console switch `erp.live-gateway` (ES256 access tokens with a JWKS,
the sign-out list in Redis, the internal live API). Built and proven by unit
specs and the gateway's own tests; the full proof on dev is the integrator's
(switch on, Cypress `live/live-updates` and `live/notifications`, switch off).

### Phase 4.8 — Standalone documents *(~2 weeks)* ← **done, 27 September** (procurement screens still placeholders)

§3o in full. *As built:*

- **Each door is the organisation's to close**, not the code's: document
  settings, per organisation and location, all off by default — *only take
  orders from a quotation*, *only invoice from a sales order*, *accept
  payments not matched to an invoice* (on), *only receive goods that were
  ordered*, *only return goods against a receipt*. And *invoices written
  directly take their goods out of stock* (on): posting issues the stocked
  lines in the same transaction, voiding returns them; invoices from an
  order never move stock twice, and a request cannot claim to be a
  conversion.
- **Credit on account** is a posted receipt's unallocated amount — no new
  table. `POST /ar-receipts/:id/allocations` applies it under a row lock;
  `GET /ar-receipts/credit` and `GET /ar-invoices/open` list what a
  customer has and owes. Voiding a receipt now gives its invoices their
  amounts back (it left them marked paid).
- **Found on the way:** returns to supplier had never been saved (no
  supplier, receipt, number or variant set), could not be submitted (an
  unloaded organization), and took stock out at submission; goods receipts
  could not be submitted either (eager joins Citus refuses); neither
  approved with no approval policy; `receivedByStaffId` was not really
  optional. All fixed.
- **Web:** New order, New invoice (one form with quotations), New receipt
  with optional allocations, and a credit panel on invoices and receipts.
- Proven by `standalone:drill` (27 checks) and in the browser.

The plan it followed:

1. API: receipts and supplier payments accept an unallocated amount, held
   as credit on the customer's (supplier's) account and allocated later;
   a goods receipt note without a purchase order; a return to supplier
   without a receipt. Each with a drill, like every write before it.
2. The stock setting for standalone invoices, and the invoice posting that
   honours it — once, never twice for lines that came from an order.
3. Web: **New order**, **New invoice** and **New receipt** forms on the
   sales lists, built from the quotation form's line editor; conversions
   open the same form pre-filled rather than saving blind.
4. The procurement screens (orders, receipts, returns, bills, payments) are
   still placeholders; each is built standalone-first when it is built —
   in **Phase 6** (5 October).

### Phase 4.9 — Notifications *(~5 weeks for the engine, in-app and email; then per channel)* ← **steps 1–4 built, 27 September**; thresholds, channels and the daily summary left

*As built (27 September):*

- **Engine** (`modules/notification/center`):
  - built on the outbox, Kafka, BullMQ and `/live`, with Novu's patterns
    only;
  - lifecycle events now carry `previousStatus`, so "became posted" fires
    once;
  - `approval.event` goes through the outbox in the approval's own
    transaction;
  - one notification per event, rule and person, inserted once;
  - recipients worked out from the grants when a rule fires, and filtered
    to people who may read the document where it is.
- **Rules:**
  - seven presets in code (approval asked, overdue, approved, rejected;
    quotation accepted, declined; invoice paid);
  - the organisation's own rules in `notifications.workflows`, checked on
    save: unknown fields, a channel that cannot deliver, regular
    expressions, roles and people not its own;
  - the critical presets cannot be switched off.
- **Delivery:**
  - in-app at once to the person's inbox room;
  - email through the organisation's chosen sender (the mail worker's
    logic, now `MailDispatcher`), at once, after a wait (its condition
    checked again when due), or gathered into a digest;
  - a sweep re-queues lost jobs, and marks as failed, rather than resends,
    anything interrupted mid-send;
  - every skip says why.
- **Web:**
  - the bell, pushed live;
  - Settings → Notifications: real switches, replacing a page whose Save
    stored nothing;
  - Admin → Notification rules: list, on/off, editor, copy, reset, delete,
    and "what was sent".
- **Proof:** `notifications:drill` (24 checks, probes only) and the browser,
  with a live push to the signed-in user.
- **Found in approvals on the way, and fixed:**
  - no request could start: no location was ever set, though every approval
    table requires one, and approver weight was sent as null;
  - no step could complete: the decision was read on another connection,
    so it was never seen;
  - "all of" completed a step one approval early;
  - the assignee lookup compared a uuid with text;
  - events were written outside the transaction;
  - *(27 September, later)* the `/approvals` socket let any signed-in
    client join any organisation's room by naming it, and broadcast every
    approval event there before its transaction committed. Nothing in the
    web app used it. The namespace, its unauthenticated twin
    (`approval/events/approval.events.ts`) and the broadcast are gone;
    approvers hear through `approval.event` → the engine → their inbox room
    on `/live`, whose rooms come from the session, never the client
    (`live.gateway.spec.ts`).
- **Still open in approvals (Phase 7):**
  - an approved or rejected request never moves its document: the callback
    handler is not wired, so a quotation stays "waiting for approval";
  - the SLA worker runs outside a tenant transaction.
- **Left here:**
  - thresholds (step 5) — built as Phase 5.5 step 5, on its metric
    registry;
  - the other channels (step 6) — *SMS, WhatsApp and Telegram built 8
    October* (through the organisation's Communication channels and its
    own bot, to addresses each person proved; quiet hours from their
    communication preferences; NOTIFICATIONS.md); *Web Push built 8
    October* (our own encryption and VAPID, a worker of its own); *chat
    channels built 8 October* (Slack, Teams, Discord, Google Chat by their
    incoming webhooks; a rule posts once per event); chat to a person and
    the webhook step left (with 4.6 step 3);
  - the daily summary (step 7) — *built 8 October* (daily or weekly, at
    the person's own hour; approvals waiting and what is unread; nothing on
    a quiet day).
- **Before the api/worker split (4.7 step 5):** in-app pushes are emitted
  by the process that runs the engine. A worker with no socket server must
  emit through the Redis adapter instead.


*The ask (27 September):* "as a user, I want to be notified by email, sms,
whatsapp, telegram, push, chat, webhook or in-app when certain activities
happen or thresholds are met in the application, or when my approvals are
required." The reference is [Novu](https://github.com/novuhq/novu): MIT
core, `/enterprise` under its own licence.

**Where the project stands:**

- Email goes out through one BullMQ mail queue, over the organisation's
  transport (Phase 4.6).
- Staff screens are told about changes over `/live` (Phase 4.7).
- The approval engine pushes on its own Socket.IO namespace
  (`/approvals`). That namespace duplicates `/live`, which should replace it.
  *(Retired 27 September: see "Found in approvals" above.)*
- `human_resource.notifications` exists: title, message, channel
  (`email` / `sms` / `in-app`), `is_read`, and a recipient pointing at
  `Staff`. Nothing reads or writes it.
  - It is kept, not dropped ([no orphan tables](#1-correction-there-are-no-orphan-tables)).
  - *Checked 27 September:* it is distributed, has no rows, and nothing
    reads or writes it. Its recipient is a `Staff` row, and staff are not
    users (§3f): many staff never sign in. So it stays **HR's**. It will
    hold notices to staff (announcements, payslips ready) in Phase 9,
    delivered through this engine's channels.
  - The in-app inbox is keyed by *user* and gets its own table,
    `notifications.notifications`.

**Build it in, or run Novu beside it?** The recommendation is to build it
in, borrowing Novu's model. The reasons:

- **Most of Novu's backend is already here.** Triggers are our Kafka outbox
  events, which only fire for committed writes. Steps, delays and digests
  are BullMQ jobs and job schedulers. The in-app socket is `/live`.
  Per-organisation provider credentials are `integrations.connections`,
  with sealed secrets. Delivery status is the webhook design in Phase 4.5.
- **Running Novu means a second system of record.** It keeps subscribers,
  preferences and messages in MongoDB, next to Citus. Every user, role and
  location grant would be copied into it and kept in sync. So would every
  permission check: who may see a notification about an invoice at a
  location they do not hold?
- **Tenancy maps badly.** Our 200k-user target is spread over many
  organisations, each with its own providers. Novu separates tenants by
  organisation and environment, each with its own integrations. We would be
  running thousands of Novu organisations.
- **What to reuse:** Novu's provider packages (MIT) are worth evaluating as
  the channel adapters' HTTP clients, once each is audited for how it
  handles secrets and errors.

**The model** (schema `notifications`, every table distributed on
`organization_id` and co-located):

| Concept | As in Novu | Here |
|---|---|---|
| **Workflow** | a trigger key plus ordered steps | `workflows`: `key` (`approval.requested`, `invoice.overdue`, `stock.below_reorder`…), name, trigger, `critical`, enabled, steps (jsonb, versioned). **System workflows are defined in code**, like the integration catalogue. The organisation switches them on or off, tunes them and edits their wording, and **builds its own** from the same parts (decided 27 September). |
| **Step** | a channel, delay, digest or throttle, each with conditions | a channel (in-app, email, SMS, WhatsApp, Telegram, push, chat, webhook), a *delay* ("remind after 4 hours unless done"), a *digest* ("one email per hour listing them"), a *throttle* ("at most one per item per day"), or a *condition* ("only if still unapproved"). |
| **Subscriber** | a person with channel addresses | a **user** of the organisation. For document messages, a **contact**: a customer's or supplier's email, phone or WhatsApp. Contacts get transactional messages only, and every optional message carries an unsubscribe link. |
| **Topic** | a named list of subscribers | resolved, never copied: *role at location* ("managers at Lekki"), *holders of a permission* ("can approve purchase orders"), *the document's owner*, *the approvers of this request*. Recipients are worked out from the grants at send time, so a revoked user never gets a notification. |
| **Channel endpoint** | the subscriber's addresses | `channel_endpoints`: verified phone (E.164), WhatsApp number, Telegram chat id, web-push subscriptions and mobile device tokens, and Slack / Teams member ids. Each is verified by a code or a deep link before use. |
| **Preference** | per workflow per channel, with overrides | layered: the workflow's default, then the organisation's, then the location's, then the role's, then the user's own. **A critical workflow cannot be switched off entirely** (approvals, security, failures); a user may only pick its channels. Quiet hours and time zone are per user. |
| **Template and layout** | per step, with variables | Handlebars, as the mail templates already are. There is a template per channel and locale, and a variables schema per workflow, checked before save. The organisation's layout (logo, colours, footer) wraps each one. There is a preview and a test send to yourself. |
| **Notification / activity** | an execution log per step | `notifications`: one row per event, workflow and recipient, with a unique key on (event, workflow, recipient) so a replayed Kafka message sends nothing twice. It is the in-app inbox too (seen, read, archived, and a link to the thing itself). `deliveries`: one row per notification and channel, with status, provider, provider message id, attempts, error and the reason for a skip. Phase 4.5's planned `sharing.email_messages` folds into `deliveries`, so shared documents and notifications share one delivery log. Partitioning by month and retention come when volume asks for them. |

**Where a notification comes from:**

1. **Activities.** Any outbox event. A workflow's trigger names the event
   type and a condition on its payload ("invoice posted, total over
   ₦1,000,000"). Events already carry `organizationId` in the payload
   (outbox contract), so the consumer needs no lookup to route.
2. **Approvals required.** When the approval engine enqueues a request it
   writes `approval.requested`, with the step's approvers resolved. The
   same happens for `approval.decided`, `approval.escalated` (no decision
   within the policy's time) and `approval.returned`. The "approve / reject"
   actions in the inbox, email and chat open the approval in Commerce,
   signed in. Approving from an email link without signing in is **not**
   offered: a forwarded email would carry the power to approve.
   Slack and Teams buttons act only after the chat account is linked to
   the user.
3. **Thresholds.** `alert_rules` are made by the organisation, each a
   metric, a comparison, a scope and a workflow. Examples:
   - stock at a location below its reorder point;
   - an invoice N days overdue;
   - a customer over their credit limit;
   - today's sales under target by 6 pm;
   - a till's cash above a limit;
   - an integration failing.

   They are evaluated **where the number changes, for that entity only**:
   the projection consumer that moves `inventory_on_hand` checks the rules
   on that item and location, and no sweep scans a tenant (the scale
   rule). Time-based rules ("overdue") run on a job-scheduler sweep over
   an index, the way reminders do. `alert_states` keeps one row per rule
   and entity. A rule fires **once on crossing** and re-arms only when the
   value comes back, so a stock level bouncing around its reorder point
   does not send forty messages.
4. **Schedules.** A daily or weekly summary per user ("5 approvals waiting,
   3 invoices overdue, 2 items low"). It is a digest over the day's events,
   sent at the user's local 8 am.

**How it runs**, reusing the architecture as it is:

```
write ─► outbox (same transaction) ─► Kafka ─► notifications consumer group
            ├─ match: workflows for this org + event type (cached, invalidated on edit)
            ├─ resolve recipients from grants (topics) or the document's contact
            ├─ apply preferences, quiet hours, suppression
            └─ insert messages (idempotent) ─► BullMQ step jobs
                   ├─ delay / digest / throttle: delayed jobs + job schedulers
                   └─ channel jobs ─► provider adapter via the org's integration slot
                                         └─ status via provider webhooks (4.5 design)
in-app ─► inbox row + /live notice to the user's room ─► bell badge, no reload (NgRx)
```

- Channel jobs run with **per-organisation concurrency** and
  **per-provider rate limits**, so one tenant's burst or slow provider
  cannot hold everyone's messages. These run in the `worker` role
  (Phase 4.7 step 5), which this phase depends on.
- A failed step is retried with back-off. It then fails visibly in the
  activity log, and **falls back to the next channel** if the workflow says
  so ("if SMS fails, email").
- Every step records who, what, when and why (including "skipped: user
  turned this off" and "skipped: quiet hours, delayed to 07:00"), so
  "why didn't I get it?" has an answer.

**The channels**, each a slot in the integration catalogue:

| Channel | Providers the organisation can choose | Notes |
|---|---|---|
| In-app | Commerce | Built first. It is the bell, and the one channel that needs no provider. |
| Email | Commerce (default), own SMTP (built), SES, Postmark, SendGrid, Mailgun, Resend, Brevo, ZeptoMail, Google / Microsoft 365 mailboxes | Already a slot. Delivery statuses come from Phase 4.5's adapters. |
| SMS | Termii, Africa's Talking, Twilio, Vonage, Infobip, Amazon SNS | Sender IDs must be registered per country (Nigeria: NCC; DND numbers need the transactional route). Stored per connection. |
| WhatsApp | WhatsApp Cloud API (Meta), Twilio, Infobip, Termii | Outside the 24-hour window **only Meta-approved templates** can be sent. Each workflow's WhatsApp template is submitted through the connection and used once approved. |
| Telegram | the organisation's own bot (token sealed) | A user links by opening a `t.me/<bot>?start=<one-time code>` link. The bot's webhook uses the Phase 4.5 hooks route. |
| Push | Web Push (VAPID, no third party, first); FCM and APNs when there are mobile apps; OneSignal | Needs a service worker in the Angular app, and each user's own browser subscriptions. |
| Chat | Slack, Microsoft Teams, Discord, Google Chat | By channel (incoming webhook: "sales channel hears every accepted quotation") or by person (an app, with the account linked). |
| Webhook | the organisation's endpoints | This is Phase 4.6 foundation step 3 (outgoing webhooks), used as a step. It is signed, retried, with a delivery log and replay. The same SSRF rules as SMTP apply. |

**Web:**

- A bell in the header: unread count, list, mark read, archive, and "open
  it". Fed by the `/live` user room into an NgRx slice, never polled.
- **Profile → Notifications:** a matrix of workflows by channels, plus
  quiet hours and linking a phone, Telegram or a browser.
- **Settings → Notifications** (admins):
  - workflows on or off, organisation defaults, wording per locale with
    preview;
  - alert rules;
  - the activity log, searchable by recipient, document and status.

**Steps:**

1. Schema and engine: `workflows` (presets in code, the organisation's own in the table), `notifications` and `deliveries`,
   preferences, the consumer, idempotency, and BullMQ steps with delay,
   digest and throttle. A `notifications:drill` proves an event reaches
   the right users only once, respects preferences and quiet hours, digests
   and skips a revoked user.
2. **Approvals first**: `approval.requested`, `decided` and `escalated`,
   with in-app and email. This retires the `/approvals` namespace for
   `/live`.
3. In-app inbox and the bell; the inbox table decision above.
4. Preferences screens (profile and admin) and templates with preview.
5. Thresholds: `alert_rules`, `alert_states`, stock and overdue first.
6. Channels one at a time, each an adapter plus its delivery-status
   adapter and a drill against the provider's sandbox or a fake:
   - Web Push, then SMS (Termii), then WhatsApp Cloud API, then Telegram;
   - then Slack / Teams, then the webhook step (with 4.6 step 3);
   - then the rest of each catalogue.
7. Daily summary digest.

**Decisions (taken 27 September):**

- **Built into our own code.** Novu is not run. Only its integration
  patterns are borrowed and implemented.
- **Organisations build their own rules**, to fit their own business
  processes: trigger, conditions, recipients, channels and wording. The
  system workflows are presets they switch on, tune or copy.
- **SMS and WhatsApp costs:**
  - Commerce's own messages (sign-in codes, invitations, platform notices)
    are paid for by Commerce.
  - An organisation's messages go through its own provider account.
  - Commerce may also **resell** messaging to organisations that have no
    account. That needs usage metering per organisation, channel and
    country, plus a prepaid balance. It is planned with the SMS channel
    (step 6), not before.
- **Approving from chat**: allowed from Slack / Teams once the chat
  account is linked to the user; never from an email link.


### Phase 4.10 — Finance management: payments, spend, receive, treasury, planning *(re-planned 8 October against the Finance Management PRD: fourteen steps)* ← **steps 1–5 and 6a done, 9 October**; quotation negotiation, pricing from the price book and proforma invoices done 9 October ([SALES.md](SALES.md#proforma-invoices)); **6b, batches and payments on their date, done 9 October** ([FINANCE_MANAGEMENT.md](FINANCE_MANAGEMENT.md#payment-batches-and-payments-on-their-date-step-6b)); **the wallet service (step 15) built 9 October** in its own repository, `~/SoftwareProjects/wallet-service`, **and its Commerce integration's three layers the same day** — the screens, the books, then paying from wallets and customer collection wallets ([FINANCE_MANAGEMENT.md](FINANCE_MANAGEMENT.md#wallets-step-15)); **step 7, expenses, reimbursements and cash advances, done 10 October** ([FINANCE_MANAGEMENT.md](FINANCE_MANAGEMENT.md#expenses-reimbursements-and-cash-advances-step-7)); **step 8 — the receipts register, money to identify, other receipts (8a), and matching with fees, withholding and write-offs (8b) — done 10 October** ([FINANCE_MANAGEMENT.md](FINANCE_MANAGEMENT.md#receive-the-receipts-register-money-to-identify-other-receipts-step-8a), [matching](FINANCE_MANAGEMENT.md#matching-receipts-to-invoices-step-8b)); **step 9, transfers and cash operations, done 10 October** ([FINANCE_MANAGEMENT.md](FINANCE_MANAGEMENT.md#transfers-and-cash-operations-step-9)); **step 10 — statement import (10a) and reconciliation sessions, matching, exceptions, approval and the lock (10b) — done 10 October** ([FINANCE_MANAGEMENT.md](FINANCE_MANAGEMENT.md#statement-import-step-10a), [reconciliation](FINANCE_MANAGEMENT.md#reconciliation-step-10b)); **step 11, obligations and cash flow, done 10 October** ([FINANCE_MANAGEMENT.md](FINANCE_MANAGEMENT.md#obligations-and-cash-flow-step-11)); **step 12, the finance overview and reports, done 10 October** ([FINANCE_MANAGEMENT.md](FINANCE_MANAGEMENT.md#finance-overview-and-reports-step-12)); **step 13, intercompany, done 10 October** ([FINANCE_MANAGEMENT.md](FINANCE_MANAGEMENT.md#intercompany-step-13)); **step 14, virtual accounts, done 10 October** ([FINANCE_MANAGEMENT.md](FINANCE_MANAGEMENT.md#virtual-accounts-step-14)) — **all fourteen steps built**; left: real rails and live provider checks (held to the end), and the performance pass

*The ask (27 September):* follow the pattern of
[Hyperswitch](https://github.com/juspay/hyperswitch), running it as a
microservice although it is written in Rust. Draft the plan first.

**What Hyperswitch is** (read 27 September): a payment orchestrator under
Apache 2.0.

- **Services:**
  - the *router* (the API);
  - a *producer / consumer* scheduler, for retries and syncs;
  - a *drainer*, which moves Redis writes to Postgres;
  - a *card vault*, PCI-scoped and replaceable by VGS or TokenEx;
  - an *encryption service*, a *control centre* dashboard and a hosted
    checkout (`hyperswitch-web`).
- **Its own Postgres and Redis.**
- **Concepts:** merchant account, business profile, merchant connector
  account (one processor's credentials), payment intent and attempt,
  refund, dispute, payout, mandate.
- **Routing:** rule-based, volume split, success-rate, with smart retries on
  another processor and a fallback list.
- **Webhooks:** each processor's normalised into one set.
- **Deployment:** Docker Compose and Helm.

**What it covers for us, and what it does not.** It has 160+ connectors:
Stripe, Adyen, PayPal, Checkout.com, Razorpay, Xendit, Mollie, PayU and
more, which is the global reach. **For Nigeria it does not cover the
ground.**

- Its Paystack connector today supports only **EFT bank redirect** (South
  Africa): no cards, no bank transfer, no USSD. Capture is not implemented.
- There is **no Flutterwave, Interswitch, Monnify or OPay connector** at all.

The African processors our first customers need would be written by us,
in Rust, and contributed upstream, or handled outside it.

**Recommendation: our own payments module is the source of truth, with
Hyperswitch as one gateway behind it.** Commerce owns what a payment
*means*: the invoice it pays, the receipt it posts, the ledger lines. A
gateway only moves the money.

```
shared invoice page ─► "Pay" ─► payments module (NestJS, Citus: payments.*)
                                   │  PaymentGateway port
                   ┌───────────────┴────────────────┐
         direct adapters (NestJS)          Hyperswitch adapter
         Paystack, Flutterwave:            ─► Hyperswitch service (Rust, own Postgres/Redis)
         hosted checkout, their webhooks       ─► Stripe, Adyen, PayPal, … (160+)
                   └───────────────┬────────────────┘
      verified webhook ─► payment succeeded (idempotent) ─► outbox
                   ─► AR receipt posted + allocated to the invoice (Phase 5 ledger)
                   ─► /live + notification (4.9): "Acme paid INV-0042"
```

- **No card data ever reaches Commerce.** Customers pay on the
  processor's hosted page or its SDK (or Hyperswitch's hosted checkout),
  which keeps us to the lightest PCI self-assessment (SAQ A). Hyperswitch's
  own vault is **not** deployed at first. Saved cards and mandates come
  later, and only through a processor's or a third-party vault.
- **Tenancy.** A Commerce organisation is a Hyperswitch *merchant account*,
  and a location that takes payments separately is a *business profile*.
  - The organisation's processor keys are created in Hyperswitch through
    its API as *merchant connector accounts*, entered on Commerce's own
    screen.
  - Commerce keeps only the merchant id and that merchant's API key,
    sealed.
  - We do not expose Hyperswitch's control centre; Commerce's screens are
    the only place an organisation manages payments.
- **The integration slot changes shape.** Payments are not one provider
  per slot. An organisation may have Paystack for naira and Stripe for
  dollars, with a rule between them. `integrations.connections` is unique
  on organisation + slot (+ location), so payments get their own
  `payments.gateway_accounts` (several per organisation, each sealed like a
  connection) and `payments.routing_rules`:
  - currency, amount, method or location, then a gateway, then a fallback;
  - through Hyperswitch these become its routing configuration;
  - for direct adapters, Commerce evaluates the same rules itself.

**Our tables** (schema `payments`, distributed on `organization_id`):

- `payment_intents`: organisation, the document it pays (invoice or deposit
  request), amount, currency, customer, status, gateway, the gateway's
  reference, the idempotency key and expiry.
- `payment_attempts`: one row per try, including retries on another
  processor.
- `refunds`, `disputes`.
- `payment_events`: raw webhook, verified, deduplicated on the provider's
  event id, kept 90 days.
- `settlements`: payouts from the processor to the organisation's bank,
  with fees, for reconciliation.

**Flows:**

1. **Pay an invoice from its link.** A Pay button appears on the shared page
   (Phase 4.5) and in the invoice email.
   - Commerce creates an intent for the open balance and redirects to the
     gateway's checkout.
   - The webhook, never the browser's return, marks it paid. It then posts
     an **AR receipt**, allocated to the invoice, to the gateway's clearing
     account. The processor's fee is posted as an expense when it settles.
   - Partial payment and deposits reuse Phase 4.8's credit on account.
2. **Refund.** It is started from the receipt and posts a refund and a
   credit note. A gateway that fails the refund leaves the receipt
   untouched.
3. **Disputes.** They are shown on the receipt with deadlines, and the admins
   are notified (4.9).
4. **Reconciliation.**
   - Settlements from the processor are matched to receipts, the clearing
     account to the bank account.
   - A late or missing webhook is caught by a sync job, which asks the
     gateway for any intent still pending after N minutes.
5. **Payouts, later.** Paying suppliers (AP payments) and salaries (payroll)
   through Paystack Transfers, Flutterwave or Hyperswitch payouts. This goes
   through approvals, never automatic.

**The drafted plan, with gates:**

1. **Spike (1 week) → go / no-go on Hyperswitch.**
   - Run its Docker Compose beside ours, and create a merchant and a Stripe
     test connector through its API.
   - Drive a payment, refund and webhook from a NestJS script.
   - Record what it costs to run: its services, memory, upgrade cadence, and
     the Rust build we would need to contribute connectors.
   - Decide: adopt as the global gateway, or keep direct adapters only.
2. **Payments module and direct adapters (3 weeks).** The port, the tables,
   Paystack (cards, transfer, USSD through its hosted checkout) and
   Flutterwave Standard.
   - Webhooks go on the Phase 4.5 hooks route: Paystack's HMAC-SHA512
     signature, Flutterwave's `verif-hash`.
   - `payments:drill` runs against their test modes.
   - This is needed whatever the spike says, because Hyperswitch does not
     cover these today.
3. **Receipts that post themselves (1 week, needs Phase 5).** The clearing
   account, fees, and seeding the organisation's currency (no tenant has
   `finance.currency` rows).
4. **Hyperswitch adapter (2 weeks, if the spike says go).**
   - Merchant per organisation, connector accounts, routing rules, the
     normalised webhooks, and its hosted checkout for global customers.
   - Deployed as its own service with its own database. The first
     non-NestJS service, so it gets its own health checks, backups and
     upgrade runbook.
5. **Upstream (ongoing).** Contribute full Paystack (cards, transfer, USSD)
   and Flutterwave connectors to Hyperswitch in Rust. Once merged, an
   organisation may route naira through Hyperswitch too, and the direct
   adapters become optional.
6. Disputes, settlements and reconciliation screens; then payouts.

**Re-planned 8 October (the user's answers).** Phase 5 is done, so the
ledger is there. The Hyperswitch spike waits until global processors are
wanted. Paystack and Flutterwave come first, both behind the same port,
which is shaped so that a Hyperswitch adapter can sit on the same rail
later and an organisation sees several providers side by side. Drills
and Cypress run against a **local test gateway**; each real adapter is
proven against its documented payloads and signatures. Real test-mode
runs happen once the organisation's test keys are entered on the payments
screen. The user widened the phase:

> "virtual accounts … a virtual account can be created for a customer to
> pay in to it. When we manage expenses, procurement payments also. Staff
> or users should be able to spend through virtual account, debit and
> credit cards. Budget is created and used to manage expense, or
> unlimited. But there would surely be bank integration."

**One shape for every provider.** Each capability is a port, and each
provider an adapter that declares what it can do:

- collections: checkout, verify, refund, webhooks;
- virtual accounts;
- transfers out;
- card issuing;
- bank feeds.

An organisation connects as many `payments.provider_accounts` as it
likes: Paystack for naira, Flutterwave for dollars, a card issuer, a bank
feed. Each is sealed like an integration connection, has a test or live
mode, and maps to a clearing bank account in the ledger. Routing rules
choose between them by currency, amount, method and location, with a
fallback. Nothing card-shaped ever reaches Commerce (SAQ A): checkouts
are hosted, and issued cards are shown by the issuer's own secure view.

**Re-planned 8 October against the user's framework** (the Finance
Management PRD, kept outside git as `documentation/finance-management-prd.md`).
Steps 3–14 below replace the old steps 3–7. Card issuing and open-banking
providers are left out for now (the user, 8 October); statement import is
the bank feed until then.

**What the framework asks, and what we already have.** The ledger, AP
(supplier invoices and payments, with withholding, discounts and
write-offs), AR (invoices, receipts, allocations, credit, refunds), budgets
(lines by account and three dimensions, twelve periods), bank accounts,
statement import with a first matcher, intercompany entries, recurring
journals, the approval engine and online collections (steps 1–2) are
built. What is missing is the **operations and control layer** around
them: one register of every money movement, payment instructions with an
execution life of their own, expenses, transfers, reconciliation as a
controlled process, budgets that hold commitments, obligations and cash
forecasting, and the finance overview.

**Principles that run through every step** (PRD §3, §11.1, §12.4, §17):

- **A payment is not a journal.** A payment instruction moves money; its
  accounting is posted by the ledger, once, keyed to the source and event
  (`LedgerPostingService` is already idempotent per source/event). A
  posting that fails leaves the transaction *not accounted*, visible and
  retryable — never marked done.
- **Subledgers keep their documents.** AP owns supplier invoices and the
  AP payment that settles them; AR owns invoices and receipts. Finance owns
  the *instruction*, its execution and evidence. A confirmed supplier
  payment request creates and posts the AP payment; it never settles an
  invoice itself.
- **Nothing is deleted or overwritten.** Corrections are reversals and
  adjustments that name what they correct. Confirmed payments are never
  changed by reconciliation.
- **Ambiguity is a state.** A payout whose outcome is unknown is
  `unknown`, verified with the provider before anything else happens;
  Commerce never retries it blind.
- **Approved is not paid.** Approval, execution and confirmation are three
  separate facts, by three people where the organisation asks for it.
- **One obligation, one commitment.** A requisition's commitment becomes
  the order's, then the invoice's actual — it moves along the chain and is
  never counted twice.
- **Transfers are neither income nor spend.** They are classified
  `internal_transfer` and left out of money-in and money-out totals.
- **Every amount has a currency**, and a foreign one keeps its rate, the
  rate's date and source, and its value in the reporting currency.

**Steps:**

1. **Collections** ← **done 8 October** ([PAYMENTS.md](PAYMENTS.md)) — the `payments` schema: provider accounts, routing
   rules, intents, attempts and webhook events, deduplicated and kept.
   - Adapters: Paystack, Flutterwave and the test gateway.
   - "Pay" on a shared invoice opens the hosted checkout. The verified
     webhook (never the browser's return) posts an AR receipt to the
     provider's clearing account, allocated to the invoice; any surplus is
     held as credit.
   - A sync job asks about intents still pending.
   - Settings → Payments: providers and routing. A payments list, and the
     payment on its receipt. Live notices and notifications.
2. **Refunds, disputes, settlements** ← **done 8 October** — a refund is started from a
   receipt and posts a refund and a credit note. Disputes carry their
   deadlines and tell the admins. Settlements bring in fees (posted as an
   expense) and are matched from clearing to the bank.
3. **Foundations: financial accounts, the transaction register, controls,
   audit.** ← **done 8 October** ([FINANCE_MANAGEMENT.md](FINANCE_MANAGEMENT.md))
   - **Financial accounts** (FIN-007): `finance.bank_account` grows into
     every place money is held — bank, cash, petty cash, clearing,
     mobile money, provider wallet, card — each with its ledger account,
     currency, location (branch), custodian, minimum balance and
     restricted amount. Balances are read from the ledger (book), from
     the last statement (bank) and from what is pending; each with its
     freshness.
   - **The transaction register** (`finance.financial_transactions`, PRD
     §6.2): one row per money movement, written in the same transaction
     as the movement by one service, upserted by source — direction
     (in / out / internal), classification (§6.1: operating inflow and
     outflow, supplier settlement, employee expense, capital, financing
     in and out, internal transfer, tax, customer deposit, supplier
     advance, refund or reversal), source module, document and number,
     counterparty, financial account, method, dates (transaction, due,
     execution, settlement), currency, rate and reporting amount, gross,
     tax, deductions, fees, net, status, reconciliation status, journal
     and reversal references. Backfilled from AR receipts, AP payments,
     refunds and settlements; kept current by them from now on.
   - **Finance controls** (document settings `finance-controls`): who may
     approve their own request (nobody, by default), whether execution
     needs a third person, the duplicate window, the threshold above which
     two approvers are needed, revalidation before execution.
   - **Segregation of duties in the approval engine**: a requester never
     decides a step of their own request where the policy or the controls
     forbid it (403 `SELF_APPROVAL`), and the inbox does not offer it.
   - **The financial audit trail** (`finance.audit_events`): append-only,
     each row chained by hash to the one before it in its organisation so
     an altered or removed row breaks the chain; `GET /finance/audit` and a
     chain check. Every sensitive action from here on writes one.
   - **Roles**: AP officer, AR officer, treasury officer, payment operator,
     internal auditor (read-only) as role presets, offered with the
     permissions they need from step 5 on (until then, made from these
     permissions on the access screen).
   - Screens: Finance → Financial accounts (with balances), Transactions
     (the register, filtered by every dimension, each row to its source and
     journal), Audit trail.
4. **Budgets that control spending** (§5.12). ← **done 9 October** ([FINANCE_MANAGEMENT.md](FINANCE_MANAGEMENT.md#budget-control-step-4))
   - A budget's **scope** (organisation, location, department, cost centre,
     project, expense category) and **kind** (annual, quarterly, monthly,
     project, rolling); **versions**: the original kept, each revision a
     new version with its reason, approved through the engine; **transfers**
     between lines, approved and kept.
   - **Commitments** (`finance.budget_commitments`): a reservation against
     a budget line from a source — requisition, purchase order, payment
     request, expense claim — reserved, then *carried* to the next document
     in the chain (requisition → order → invoice), consumed when the actual
     posts, released when cancelled or closed short.
   - **Available = revised − actual − open commitments**, per line and
     period; actuals from the ledger.
   - **Policy per budget**: none, warn, or block; at which stages (request,
     approval, order, invoice, payment); tolerance %; alert thresholds (say
     80 % and 100 %) that notify the owner once each.
   - Checks wired into requisitions, orders, supplier invoices, and (as
     they are built) payment requests and expense claims.
   - Budget vs actual vs committed, exhaustion projection at the current
     burn rate. Screens: budget page with versions, lines, commitments,
     transfers; availability on the documents that check it.
5. **Payment requests: spend with maker–checker** (§5.7, FIN-002/004/021). ← **done 9 October** (5a beneficiaries and payouts; 5b the requests — [FINANCE_MANAGEMENT.md](FINANCE_MANAGEMENT.md#payment-requests-step-5b))
   - **Beneficiaries**: suppliers, staff, customers (refunds) and others,
     each with bank accounts held sealed (only the last four digits shown);
     the account name checked with the provider where it can be
     (Paystack / Flutterwave resolve); adding or changing an account is an
     elevated-risk action that needs approval and is audited.
   - **The request**: kind (supplier invoice, supplier advance, expense,
     reimbursement, tax, statutory, rent and utilities, refund, other),
     beneficiary and account, financial account to pay from, method
     (bank transfer by hand, provider payout, cash, cheque), amount and
     currency, due or scheduled date, allocations to supplier invoices
     (partial, several, never beyond what is owed), withholding,
     deductions, the expense account and dimensions where there is no
     invoice, and its evidence (files).
   - **Lifecycle**: draft → validated → in approval → approved → ready
     (funds checked) → executing → **unknown** | confirmed | failed →
     settled; cancelled, returned (from the bank), reversed. Each move
     recorded with who and when.
   - **Validation**: beneficiary verified, invoice balances, budget, funds,
     and **duplicates** (same beneficiary and amount, or the same invoice,
     within the window) — a suspected duplicate needs a reason to go on.
   - **Revalidation before execution**: the facts approved (beneficiary
     account, amount, currency, invoice balances) are fingerprinted; if any
     changed, the request goes back to approval.
   - **Execution**: by hand — the operator records the bank reference and
     evidence, and it stays *submitted* until confirmed (by a second
     person, or by the bank line in reconciliation); by provider — a payout
     through the gateway port (Paystack Transfers, Flutterwave Transfers,
     the test gateway) with an idempotency key per attempt; a timeout or
     ambiguous answer is `unknown`, verified by the sync job or an
     operator's *Verify*, and a new attempt is refused until it is known.
   - **On confirmation**: a supplier-invoice request creates and posts the
     AP payment (AP settles the invoices, Dr payables / Cr bank); others
     post Dr expense, advance or liability / Cr bank; fees Dr bank charges;
     a foreign rate difference to exchange gain or loss. The register row
     and the audit trail follow. Remittance advice is emailed to the
     supplier.
   - Returned or reversed payments reverse the posting and reopen what they
     settled.
6. **Batches, schedules and recurring payments** (§5.7, FIN-011). ← **6a,
   recurring schedules — payments, invoices and bills — done 9 October**
   ([FINANCE_MANAGEMENT.md](FINANCE_MANAGEMENT.md#recurring-schedules-step-6a));
   6b, batches and payments on their date, done 9 October
   ([FINANCE_MANAGEMENT.md](FINANCE_MANAGEMENT.md#payment-batches-and-payments-on-their-date-step-6b)).
   - *Inserted 9 October, at the user's ask:* **quotation negotiation**
     (done 9 October — the customer proposes prices on the shared page; the
     organisation accepts them as discounts within its limits and
     approvals, declines, or revises; every offer and proposal kept) and
     **pricing from the price book** (done 9 October — the list price by
     the settings, a price below it a discount held to each person's
     limits; [SALES.md](SALES.md#pricing-from-the-price-book)) and
     **proforma invoices** (done 9 October — a preliminary invoice asking
     for payment before supply, never posted; paid online, recorded or
     counted from a receipt, held as the customer's credit and applied to
     the final invoice when it is posted; from a quotation or as a deposit
     on a sales order; [SALES.md](SALES.md#proforma-invoices)).
   - **Recurring invoices** (asked 9 October): a schedule may raise a
     sales invoice to a customer each period — retainers, subscriptions,
     rent charged — approved, posted and emailed with its pay link, billed
     in advance or in arrears, its period in its words; and a supplier's
     recurring bill. One engine for the three. *(6a)*
   - **Payment batches**: approved requests from one financial account,
     approved as one, executed together (per-item outcomes), or exported as
     a bank bulk-payment file for upload, then confirmed line by line.
   - **Scheduled payments**: executed (provider) or put in the operator's
     queue (by hand) on their date.
   - **Financial schedules** (`finance.financial_schedules`): recurring
     payments, subscriptions, rent, loan repayments and contracts —
     frequency, amount, beneficiary, category; each occurrence raises a
     payment request ahead of its date, for review where asked. They feed
     obligations and the forecast. *(6a: a standing approval may stand for
     each occurrence; a date is raised once; failures recorded and moved
     past; the calendar of what falls when.)*
   - Payments due and overdue notify their owners. *(6a: payment requests
     and supplier bills, due and a day overdue; schedules thirty days
     before they end.)*
   - **Automatic collection** of a recurring invoice (a saved card or a
     mandate, through the processor's vault) is not in 6a: invoices are
     emailed with their pay link.
7. **Expenses and reimbursements** (§5.6). *Done 10 October — as built in
   [FINANCE_MANAGEMENT.md](FINANCE_MANAGEMENT.md#expenses-reimbursements-and-cash-advances-step-7);
   policies are by department or job function (the organisation has no
   grades); claims are approved by finance unless an approval policy
   routes them (manager, then finance, is a policy's two steps).*
   - **Categories** mapped to ledger accounts and tax, with limits and
     "receipt required above"; **policies**: per diem by place, mileage
     rate, per-claim and per-period limits, by role or grade.
   - **Claims** with lines (date, merchant, category, amount, currency,
     tax, purpose, cost centre, project, receipt files): draft, submitted,
     approved through the engine (manager, then finance), rejected with a
     reason and resubmitted (history kept), withdrawn.
   - **Duplicate detection** by amount, date, merchant and receipt.
   - **How it was paid**: out of pocket (owed to the employee: Dr expense /
     Cr employee reimbursements payable, paid by a reimbursement payment
     request), company card or company cash (Cr that financial account),
     or against a **cash advance** (Dr employee advances when issued; the
     claim clears it, the difference reimbursed or returned).
   - Budget check on submit; taxable and non-taxable parts kept.
   - Self-service at `/me/expenses`; finance's queue at Spend → Expenses.
8. **Receive: receipts register, unidentified receipts, matching** (§5.8).
   *Done 10 October: 8a the register's lifecycle, other receipts and money
   to identify; 8b matching — suggestions, by itself where chosen, fees,
   withholding, write-offs, under- and overpayments. Statement lines are
   matched with step 10.*
   - The **receipt register** over AR receipts, online collections and
     other receipts, with the lifecycle initiated → pending → confirmed →
     allocated / partly allocated → reconciled; failed, expired, reversed,
     refunded, disputed.
   - **Other receipts**: loans, capital, grants, supplier refunds and
     miscellaneous income, each classified and posted to its account —
     financing never as revenue.
   - **Unidentified receipts**: money in with no known payer, held in a
     suspense account, in a queue with an owner and a deadline; identified,
     it becomes the customer's receipt (and is allocated), or is returned.
   - **Auto-matching** of receipts and incoming bank lines to open invoices
     by reference, then payer and exact amount, then oldest first, within
     the organisation's rules; under- and overpayments, fees, withholding
     and approved write-offs.
   - Chargebacks (disputes) and refunds reached from the receipt.
9. **Transfers and cash operations** (§5.9, FIN-008). *Done 10 October —
   [as built](FINANCE_MANAGEMENT.md#transfers-and-cash-operations-step-9);
   authorised cash advances are step 7's; intercompany transfers step 13.*
   - A transfer between two of the organisation's financial accounts:
     approved, initiated, its **source leg** and **destination leg**
     confirmed independently, completed only when both are; money between
     them sits in *cash in transit*. Fees and exchange differences posted
     separately. Cash deposits, withdrawals and inter-branch cash are
     transfers too. Classified `internal_transfer`; never income or spend.
10. **Reconciliation as a controlled process** (§5.10, FIN-009). *Done 10
    October: 10a statement import, 10b sessions, matching, exceptions,
    approval and the lock.*
    - **Statement import**: CSV with saved column mappings, OFX, MT940 and
      CAMT.053, deduplicated by line fingerprint.
    - **Sessions** per account and period: matching, exceptions, approval,
      then the period is locked for that account.
    - **Matching** against the register: one to one, one to many, many to
      one; rules by amount, date window, reference, counterparty; tolerance
      for fees; a manual match needs a reason.
    - **Exceptions** with an owner and a deadline: missing, duplicate,
      reversed, unmatched; resolved by an adjustment (bank charges,
      interest) posted through the ledger, never by changing a payment.
    - Provider settlements reconciled the same way. Reconciliation report.
11. **Obligations and cash flow** (§5.11, §5.13, FIN-012). *Done 10
    October.*
    - **Obligations**: payables, approved requests, schedules, payroll,
      tax due (VAT, withholding, PAYE), order commitments, receivables —
      due dates, aging, owners, escalation.
    - **Forecast**: from confirmed balances (cleared, not expected), by day,
      week, month, quarter and year; best, expected and downside scenarios
      (collection rate and delay from each customer's history); minimum
      balances and shortfall alerts; manual adjustments with audit;
      snapshots for forecast vs actual; positions by currency and in the
      reporting currency.
12. **Finance overview and reports** (§9, §10, FIN-001/017/024). *Done
    10 October (intercompany's report comes with step 13).*
    - The overview answers the five questions: cash available, money in,
      money out, obligations due, within plan — each figure drilling to
      its transactions and journals.
    - Reports: cash position, cash flow statement (classified), forecast,
      spend analysis, payment register, receipt register, supplier payment
      history, collections, reconciliation, payment failures, expense
      reimbursements, tax payments, intercompany, audit activity, period
      close readiness, currency exposure; CSV and PDF export, audited.
13. **Intercompany** (FIN-023): due-to / due-from between organisations of
    one group, settled by transfers, with an intercompany report. *Done
    10 October.*
14. **Virtual accounts for collection** and **Hyperswitch** — a dedicated
    account per customer (Paystack, Flutterwave), matched as in step 8;
    Hyperswitch after the spike, which needs the user's go-ahead. *Done
    10 October: virtual accounts here; Hyperswitch came with step 16.*
15. **Wallets — a separate Rust service** *(asked 9 October 2026; the
    user's wallet PRD, `documentation/wallet-management-prd.md`, untracked,
    with its crypto addendum)*. `wallet-service`, generated from
    `~/SoftwareProjects/rust-cqrs-boilerplate` (`./new-service.sh -n
    wallet-service -a wallet -d ../wallet-service`) and following its CQRS
    conventions: wallets and their hierarchy (master, department,
    employee, project, branch, collection, foreign-currency, restricted),
    a double-entry wallet ledger with holds, funding (a virtual account per
    wallet, bank transfer, card top-up through the providers), internal
    transfers and allocations, payouts to verified beneficiaries,
    multi-currency and FX, policies and approvals through Commerce's
    engine, events, reconciliation; crypto wallets as an optional module.
    The user also asked for **customer wallets**: a virtual account funds a
    customer's wallet, and one-off payments land in it — so a proforma or
    invoice can offer "pay into your wallet" (`paymentMethods` leaves room
    for it). Commerce talks to it through Kafka events and its versioned
    API; the general ledger stays Commerce's. **Before building, the
    PRD's own open decision (§22) is the user's:** internal spending
    ledgers backed by the organisation's bank accounts, or balances held
    on behalf of customers through a banking or payment partner — it sets
    custody, ledger treatment and licensing.
    **Decided 9 October (the user):** in two stages — first internal
    spending ledgers backed by the organisation's own bank accounts
    (department, project, employee wallets), then customer wallets held
    through a banking or payment partner's virtual accounts once a partner
    is chosen. Built right after step 6b, before steps 7–14.
    **Superseded the same day (the user):** the wallet holds **real
    money**. A central pool account (the platform's, shared by every
    organisation) holds the funds; the wallet service connects to the rails
    itself (NIBSS directly, banks' APIs, payment providers) for inflow and
    outflow, and Commerce uses it as a complete inflow/outflow solution
    through its API. It is a microservice of its own, multi-tenant or
    self-hosted, API-only for now; wallet numbers follow configurable
    patterns like Commerce's numbering (with a check digit); organisations
    open as many wallets as they need. Then: international banks, holding
    and converting between currencies, sending in another currency with the
    conversion behind it, and crypto addresses — Wise or Grey for business.
    **Built 9 October** (`wallet-service`, merge `77012df`; design in its
    `docs/DESIGN.md`, API in `docs/API.md`): tenants with hashed API keys
    and permissions; organisations with their controls; numbering rules;
    wallets (eleven types, hierarchy under a master wallet per currency,
    policies: limits per transaction, day, week and month in the
    organisation's timezone, approval thresholds with one or two approvers
    who are not the requester, beneficiary rules, restrictions, lifecycle);
    the double-entry ledger (pool, suspense, fee and FX-position accounts
    at the platform; postings locked in account order; holds; reversals;
    statements with the balance after each entry; positions; an integrity
    check that the books close); transfers and allocations; FX quotes with
    exact-decimal rates and a spread per organisation, conversions between
    currency wallets and payouts converted behind the payment; inflows from
    rail notifications (signed, recorded once per rail reference),
    virtual accounts and crypto deposit addresses, unmatched money parked
    and assigned; beneficiaries (Nigerian, international — IBAN, SWIFT,
    routing, sort code — and crypto on seven networks) verified by name
    enquiry or a second person; payouts held until the rail answers, never
    retried blindly, returned, resolved by a person; the `manual` and
    `sandbox` rails and `sandbox`/`rate_sheet` FX; a worker for holds and
    payouts. 70 tests over the in-memory adapters, the same flows against
    Postgres (twenty concurrent spends never overspend), and a smoke test
    of the running stack.
    **Commerce integration, first layer, built 9 October**
    ([FINANCE_MANAGEMENT.md](FINANCE_MANAGEMENT.md#wallets-step-15)): the
    `wallets` integration slot (none, the platform's service, or the
    organisation's own), the organisation registered and kept in step,
    every call naming the person acting (so the service's maker–checker
    holds), wallets in the books as provider-wallet financial accounts,
    Wallets settings and five permissions, and Finance → Wallets: wallets,
    positions, opening, moving and converting with a quoted rate,
    approvals, money in, account numbers, limits, restrictions,
    lifecycle, statement and trail.
    **Second layer, built 9 October:** the service's event feed
    (`GET /api/v1/events`, commit-safe order, backfilled from the outbox)
    read by Commerce every ten seconds; every event recorded once; money
    in, transfers, conversions (two entries through a clearing account,
    the exchange difference to gain or loss), payouts and returns posted;
    failures kept with their reason and tried again; wallets opened in the
    service carried into the books; notifications and live; Wallet
    activity. Then the push (the user's go-ahead, the same day): the
    service sends signed webhooks from the feed, retried with backoff, and
    Commerce receives them, the feed read as the safety net.
    **Third layer, built 9 October:** payment requests and batches paid
    from a wallet (a keyless wallet gateway; payees saved and verified in
    the service; outcomes reaching the payment, which posts); wallet
    payouts with approvals on screen; customer collection wallets — an
    account number of their own on proformas, what they pay in becoming
    their receipt against their oldest invoices. Left for invoices: a
    payment section, which they do not have yet. **Not yet:**
    real rail and FX adapters (NIBSS NIP, banks, an international partner,
    a crypto custodian, a liquidity provider) — each needs the user's
    choice of partner, its interface specification and credentials, and
    the licensing that holding money for others requires.

16. **Payment collection, payment links and orchestration** *(asked 9
    October 2026; the user's payment-collection PRD,
    `documentation/payment-collection-prd.md`, untracked)*. Taken before
    step 7 at the user's ask. Steps 1–2 built the collections an
    organisation's own Paystack or Flutterwave keys make possible; this
    step makes them the PRD's payment product: a catalogue of every
    provider, method, wallet and card network the orchestration engine
    knows, connections with a lifecycle, a capability registry,
    explainable routing, payment links of their own, a hosted checkout
    that offers only what is truly available, and Hyperswitch behind it
    all as a private service no organisation ever sees.
    **The orchestrator (decided 9 October, the user: pull pinned images).**
    `~/SoftwareProjects/payment-orchestrator` runs Hyperswitch
    **v1.127.0** (router, scheduler consumer and producer) with its own
    Postgres and Redis, the router on loopback only, no control centre
    and no hosted SDK server; its configuration is the pinned upstream's,
    changed in five lines, secrets minted per machine into `.env`.
    Commerce reaches it only through the `PaymentConnector` contract
    (PRD §23.2); its Paystack connector is South Africa's bank redirect
    and it has no Flutterwave, Interswitch, Monnify, OPay, PalmPay, Paga
    or Remita, so Commerce's own adapters are the native path for those
    (PRD §15.2: native adapters for genuine gaps).
    - **16a — The contract and the orchestrator.** ← **done 9 October**
      ([PAYMENTS.md](PAYMENTS.md#the-payment-contract-and-the-engine-step-16a);
      the orchestrator's repository `3f5f1fb`). `PaymentConnector`
      with `Result` values and the error taxonomy (validation,
      unsupported, invalid credentials, declined, unavailable, unknown,
      duplicate); the Hyperswitch adapter (a merchant account and profile
      per organisation and environment, its own API key sealed; one
      merchant connector account per connection; Commerce's attempt and
      refund ids sent as Hyperswitch's; status by force-sync; refunds,
      capture, cancel; its signed webhooks verified and normalised); the
      native adapters (Paystack, Flutterwave, the test gateway, wallets)
      wrapped in the same contract; a conformance suite run against
      Hyperswitch's dummy connector and the test gateway.
    - **16b — Catalogue, connections and capabilities.** ← **done 9 October**
      ([PAYMENTS.md](PAYMENTS.md#catalogue-connections-and-capabilities-step-16b)). The catalogue
      generated from the pinned engine's connector library plus the
      native adapters, each entry classified (provider, method, wallet,
      card network), with its credential schema, markets against the
      country registry, and availability; connections with the PRD's
      lifecycle (not configured … active, degraded, suspended,
      credentials invalid, unavailable), validate, activate, suspend,
      rotate (versions and fingerprints, never the secret), restrictions
      by currency, country, method, channel and amount, preferred, shown
      at checkout, used by routing; payment methods per organisation;
      capability resolution — declared ∩ tested ∩ configured — with the
      reason for every exclusion (`GET /payment-methods/available`);
      Settings → Payments in the PRD's four sections.
    - **16c — Routing and the payment's life.** ← **done 10 October**
      ([PAYMENTS.md](PAYMENTS.md#routing-and-the-payments-life-step-16c)). Routing policies with
      the PRD's fields and modes (preferred, rules, availability, cost,
      success rate, customer's choice), each attempt's decision kept and
      explained; one intent, many attempts, at most one not final; the
      state machine of §23.6; webhooks verified, kept, acknowledged, then
      processed by a worker, out-of-order and unknown references held; a
      success confirmed by asking before it counts; an unknown outcome
      asked again (5 s, 30 s, 2 min, 10 min, then the sweeper), never
      retried blind; `Idempotency-Key` on every money-moving POST.
    - **16d — Payment links and hosted checkout.** ← **done 10 October**
      ([PAYMENTS.md](PAYMENTS.md#payment-links-and-the-hosted-checkout-step-16d)). Links of their own
      (fixed, customer-entered within limits, invoice-, order-,
      quotation- or proforma-linked, reusable or single-use, partial,
      a maximum of payments, charges, expiry, permitted methods and
      providers, approval), their lifecycle and management (copy, send,
      extend, disable, replace, receipts); the public checkout with the
      organisation's branding, the methods available for that payment and
      the provider choice where allowed. Recurring links wait for a
      certified connector that keeps mandates (none yet).
    - **16e — Control and sight.** ← **done 10 October**
      ([PAYMENTS.md](PAYMENTS.md#control-and-sight-step-16e)). Refund approvals within limits
      (maker–checker), reconciliation items, receipts and the PRD's
      notifications, the payments dashboard and reports, the roles
      (integration operator, auditor), monitoring and alerts.

Navigation follows PRD §18 *(done 10 October: headings Overview, Spend,
Receive, Cash & Treasury, Planning, Reports, Accounting over Finance's
items, each shown while its section holds something the person may
open)*: Finance Overview; Spend (Expenses, Payment
requests, Supplier payments, Reimbursements, Recurring, Batches); Receive
(Receipts, Collections, Payment links, Unallocated, Refunds, Chargebacks);
Cash & Treasury (Financial accounts, Transfers, Cash flow, Statements,
Reconciliation); Planning (Budgets, Commitments, Forecasts, Obligations,
Variance); Reports; Configuration.

**Decisions (taken 27 September):**

- **Payments wait for the ledger.** Nothing in this phase starts until
  Phase 5 is complete and everything it depends on is in place (currencies,
  bank and clearing accounts, receipts that post).
- **Holding money, later.** Commerce manages procurement and expenses, so
  it will move money, not only take it:
  - **virtual accounts from partner banks**, one per organisation (or per
    customer or supplier), to receive payments and match them to invoices;
  - **bank transfers initiated from Commerce** to pay suppliers and
    expenses, after approval;
  - **confirming** that payments were received and settled into the
    accounts;
  - a **microfinance bank (MFB) licence** when the need requires.

  This is a future plan. Until then, the design must not rule it out: the
  `payments` tables model a Commerce-held account as another kind of
  gateway account, and every money movement is a ledger entry.
- Paystack or Flutterwave first: both (8 October), behind one port.

### Phase T — Tested and documented *(now, before anything new)* ← **steps 0–3 done, 5 October** (every module tested, with two organisations, and documented — STATUS.md)

*The rule (27 September):* a feature is not done until its test cases are
written and pass, and it is not done until it is fully documented. This
applies to what is already built, not only to what comes next.

**Done means all seven:**

1. **API unit specs** for the logic: services, rules, validation.
2. **API endpoint tests:** each route, its permission, and its errors.
3. **A drill:** the flow end to end on the dev cluster, with throwaway data
   it removes.
4. **Web unit specs:** the NgRx store, effects and facade, and the main
   components.
5. **Cypress, two kinds:**
   - fast specs with the API stubbed, covering every state a screen can be
     in (loading, empty, error, validation, success);
   - live specs against the running stack, signed in as a seeded test user.

   Both include an accessibility check (cypress-axe), as the web project's
   own rules require.
6. **Documentation:**
   - a reference doc per feature in `documentation/`: what it is for, how
     it works, tables, endpoints, settings, permissions, how it is tested,
     known limits;
   - a feature entry in the web `docs/`;
   - a changelog entry.
7. **Everything green,** with no new lint errors, before the merge.

`documentation/STATUS.md` is the matrix: a row per feature, a column per
item. It is the one place that says what is done.

**Decisions (27 September):**

- **A dedicated test organisation** and test users on the dev cluster, their
  test passwords kept in the example config. Drills and live Cypress run
  there, not on the demo tenants.
- **GitHub Actions workflows** run the specs and the fast Cypress on every
  pull request.
- **The older unverified docs** move to `documentation/archive/`, each with
  a note that its claims were not checked. Nothing is ever deleted.
- **Developer reference now; user guides later,** once features have
  settled.

**Steps:**

0. **Foundations (~1 week):**
   - the four failing web specs fixed;
   - the test organisation and its users;
   - `npm run drills` and `npm run test:all`;
   - coverage reports that only go up;
   - the doc template, `documentation/README.md` and `STATUS.md`;
   - the archive move;
   - the CI workflows.
1. **What is already built and used (~3–4 weeks)**, most-used first:
   notifications, integrations, sharing, sales (standalone and credit), rate
   limiting, live, document settings, access, catalogue/stock/units.
2. **The platform (1–2 weeks):** auth and sessions, tenancy and row-level
   security, outbox and Kafka, Citus and migrations.
3. **Modules with an API but no screens** (finance, procurement, HR, most of
   CRM) — *done 4–5 October*: suppliers and tags, procurement, finance,
   CRM and customer service, HR; each with whole-app endpoint tests across
   two organisations and its own document (PROCUREMENT.md, FINANCE.md,
   CRM.md, HR.md). What each cannot do yet is in its Known limits:
   - an audit drill that records what really works, and a doc marked
     *unverified*, now;
   - full tests and docs when each is built in its phase.

**The demo organisation: Eben Distribution Ltd** *(asked 27 September)*

A building materials and household goods distributor, so the application
can be walked through as a real business.

- **Owner:** `ugo.ebenezer@gmail.com`. The account is created with **no
  password**: its set-up email lands in the local MailDev, and the owner
  chooses the password there. Nobody else ever sets it.
- **Locations:**
  - Apapa warehouse (head office);
  - Ikeja showroom;
  - Abuja branch;
  - an online store front and the showroom's till (Phase 4.11 / 4.12).
- **Staff:** about 8 `@example.com` logins with test passwords: sales
  manager, two sales reps, storekeeper, accountant, procurement officer,
  cashier.
- **Catalogue:** about 150 products (cement, roofing, tiles, paint,
  plumbing, electricals) with real units (bag, carton, piece, bundle),
  prices per location and stock per location.
- **Service items:** installation, delivery and logistics, cutting to size,
  site survey.
- **Customers and suppliers:** about 40 customers (contractors, developers,
  retailers, walk-ins) with some credit limits; about 10 suppliers.
- **Setup:**
  - naira and dollars;
  - bank and ledger accounts;
  - numbering;
  - document settings;
  - an approval policy (quotations over ₦5m need the sales manager);
  - a few notification rules.
- **History:** three months played out week by week: quotations sent by
  link, viewed, accepted, declined or expired; orders; direct counter
  invoices; payments in full, in part and overdue; deposits held as credit.
- **Live work left open:** an approval waiting, an acceptance this
  morning, invoices due this week.
- **How it is built:**
  - seeded **through the application's own services**, each action by the
    person who would do it, so numbering, stock, approvals, events,
    dashboards and notifications behave as in real use;
  - it ends by checking its own results, so the seed is also a test;
  - `npm run demo:seed` creates a fresh organisation each time; it never
    wipes one;
  - **every feature adds its chapter** to the story as part of being done.

### Phase T.2 — Tenancy at scale *(found by Phase T step 2, 4 October; items 1, 3 and 4 built 14 October on `feat/tenancy-rls`, item 2 open)*

What the tenancy audit ([TENANCY.md](TENANCY.md)) found and did not fix,
because each is a change of its own:

1. **Row-level security in force.** The policies exist on 195 tables but
   bind nothing: the API connects as a superuser. Give `commerce_app` LOGIN
   and worker authentication (Citus connects to workers as the current
   role), connect the API as it, keep a privileged connection for seeds,
   migrations and cross-tenant workers, and run every suite and drill as
   that role first. Plan: TENANCY.md, "Plan: row-level security in force"
   — steps 1–3 about a day, step 4 inside each Phase T step 3 module audit,
   step 5 the switch. *Step 1 needs the user's go-ahead: it changes the
   cluster's roles.*
2. **Tenant-keyed entities.** 159 of 166 distributed entities are keyed by
   `id` alone, so every TypeORM save fans out to all 34 shards. Key them by
   `(organization_id, id)`, module by module, relations on both columns;
   `npm run tenancy:audit` counts what is left.
3. **Truthful deletes.** 34 routes answer 2xx for another organisation's id
   while changing nothing; they should be 404 — with each module's Phase T
   step 3 audit.
4. **Background clean-up after a delete** (the user's design, 4 October):
   accepted only for the caller's own record, and the job carries and
   filters by `organization_id`.

*As built, 14 October (items 1, 3, 4 — [TENANCY.md](TENANCY.md)):* **row-level
security is in force**, behind `DB_APP_ROLE_ENABLED`. Every table with an
`organization_id` (708) has a forced `tenant_isolation` policy; the API can
connect as `commerce_app` (no bypass, owns nothing, no DDL) once
`npm run db:app-role` gives it a login, and a privileged "system" connection
remains for migrations, seeds, the audited cross-tenant scans
(`systemScope`, `system-scope.spec.ts` lists who may), two-sided writes
(`systemTransaction`) and the Console's and platform staff's surfaces. Workers,
listeners, guards, public tokens and per-organisation job loops enter their
organisation (`@AsOrganization`, `withOrganization`, `runAs`). Proved by
`test/rls.e2e-spec.ts` (catalogue guard; the role's behaviour; no leak
between pooled connections), the whole endpoint suite, the drills and the
tenancy sweep run as `commerce_app`; what broke and why is the table in
TENANCY.md. Item 2 (tenant-keyed entities) is untouched.
*16 October:* the four tables that kept a policy of their own (`sessions`,
`user_location_roles`, `roles`, `user_organizations`, which also admitted "this
person's rows") now have the plain `tenant_isolation` policy
(migration `1782350000000`); the guard spec requires one identical policy
everywhere. Two cross-organisation reads of a person's memberships moved to the
system scope (intercompany and group candidates).

*As built (Phase T step 3, 4 October):* relation joins now say the
organisation (`colocated-joins.ts`), which removed every "complex joins"
error the owner sweep found (632, on 54 routes) and keeps those reads on
one shard. Writes still fan out (item 2).

### Phase 4.11 — Sales channels: the store front first *(designed and agreed, 27 September; steps 1 and 2 built 12 October, step 3 and domains (step 4 below) 13 October: [SALES_CHANNELS.md](SALES_CHANNELS.md))*

*The ask:* a store front whose data comes from the ERP, fed through APIs
from the sales module to an e-commerce platform built separately in Go.
One button — "create e-commerce" — brings it to life.

**Locations stay untyped** *(decided 27 September)*. A location can be
used for anything — a warehouse, a shop, a factory, an office. What it
holds and what happens there (its inventory, operations and assets) gives
it its purpose, and that is the organisation's to decide.

**A sales channel is its own thing, which the organisation creates.**
Inventory types describe what an item *is* (raw material, finished goods,
service). A channel is *where it is sold*. The same bag of cement is sold
in the showroom, at the till, online and to contractors, so it cannot be
one inventory type per outlet without duplicating the item and letting its
stock, cost and price drift apart.

- **A channel:** a name the organisation gives it ("Eben online store",
  "Ikeja till 1", "Contractor portal"), and a kind that decides only which
  app serves it:
  - online store and point of sale first;
  - marketplace (Jumia, Konga), B2B portal, social or WhatsApp catalogue,
    or plain API later.
- **Assortment:** what it sells is a rule. For example:
  - "every *Finished goods* item in *Paint* and *Tiles*" (inventory type
    and category);
  - everything with a tag;
  - a hand-picked list.

  An item stays one item and can be in any number of channels.
- **Fulfilment:** the locations it draws stock from ("ship from Apapa,
  collect in Ikeja").
- **Prices:** its own price list and promotions, and its own document
  numbering.
- **Availability:** on hand at its fulfilment locations, less what is
  reserved and less safety stock (Phase 4.13), optionally only a share of
  it. The website and the till can never sell the last bag twice.
  *(12 October 2026, Stock flow:)* a channel sells from the **sellable
  inventory types its settings name** — the sell-from settings of its sales
  documents ([STOCK_FLOW.md](STOCK_FLOW.md)) — and is priced by their price
  books; goods waiting in a type that is not for sale (Awaiting release) are
  never on offer. There is **no per-channel held type**: a channel does not
  hold stock of its own, it draws on the types its documents sell from.
- **Orders:** orders come back as ordinary sales orders tagged with the
  channel (reports by channel), idempotently, with their payment (Phase
  4.10). Returns come back the same way.
- **Access:** an API key per channel (Phase 4.6 foundation step 4), scoped
  to that channel's items, prices and stock, with its own rate limit and
  signed webhooks.
- **Health on the channel's page:** sales, traffic, how far behind the
  feed is, and failed orders.
- **Payments by channel:** the store takes cards through Paystack; the till
  takes cash and transfers (Phase 4.10 routing rules).
- **Permissions:** who may create a channel, change its prices, and see its
  sales.

**The channel API:**

- versioned and separate from the admin API;
- catalogue, prices and availability as a feed (a full load, then changes
  since);
- customer accounts;
- order intake and order status;
- events through the outbox and Kafka (`commerce.channel.v1`), or
  outgoing webhooks for a store off our network.

A channel service keeps its own read model and never reads the ERP's
tables.

**"Create e-commerce" on the channel:**

- **By default, one shared, multi-tenant e-commerce service (Go)** serves
  every store by its host name, so creating a store is instant and nearly
  free. It scales to thousands of organisations, and one upgrade updates
  them all.
- **A dedicated container per store** is an option (a large customer,
  custom code, a plan upgrade). It needs a small provisioning service
  driving Kubernetes: create, pause, upgrade, retire — never deleting data.
- **Either way, the button sets up:**
  - a subdomain at once;
  - the organisation's own domain once its DNS is verified, with automatic
    TLS;
  - the theme and logo from Brand settings;
  - the channel's API key;
  - the first full feed, then changes as they happen.
- The shop front needs server-side rendering for search engines:
  decided 12 October — a Go service (from `~/SoftwareProjects/go-cqrs-boilerplate`)
  plus a React Next.js front end, awaiting answers to the Online Shop
  product document.

**Decided 12 October:** the ERP governs and controls the store front, and a
store front can also exist on its own; store-front orders become ordinary
sales orders; payments, customers, loyalty and support tickets all connect
to the ERP. A channel sells from the **sellable inventory types its
settings name** (the stock-flow sell-from idea) and is priced by the price
book of the stock a line draws on — never a per-channel held type: stock
set aside for its orders sits on the ledger's one held side.

**Order:**

1. The channel entity, assortment, fulfilment, prices and availability,
   with reservations. *(Built 12 October, API and web: the channel — name,
   kind (online store and point of sale served first, the rest in the enum),
   status (draft, active, paused, retired — never deleted), its own order
   numbering; assortment rules by inventory type and category, tag or
   hand-picked item, resolved in SQL and previewed with price and stock;
   fulfilment and collection places; sell-from types (only types that are
   for sale, refused otherwise); prices from the price book of the stock a
   line draws on, with tax apart (channel promotions are later: the
   discount policies set limits, not promotions, and have no channel
   scope); availability = what the sell-from types hold at its places less
   safety stock, at most a share; reservations through the existing
   reservation lock and held side, so two orders for the last unit are
   served one after the other; per-channel settings (order acceptance,
   share, guests, stock display, low-stock level, return window);
   permissions `trade.channels.*`; Sales → Channels with its page; seed
   v71, migration `1780700000000`.)*
2. The channel API and events, with drills. *(Built 12 October, API and
   web: `/api/channel/v1` by the channel's own key (rotate/revoke, shown
   once) with its own rate limit — the feed (a full load, then changes
   since a cursor), customers found or made by email then phone, orders
   once per idempotency key as sales orders tagged with the channel
   (`channel_id`; the sales order list filters by it), order status,
   returns recorded against the order (the sales return document is
   later); events on `commerce.channel.v1`; signed webhooks per channel,
   retried by BullMQ with a delivery log and replay; `npm run
   channel:drill`; tenancy sweep for `/api/v1/sales-channels/` — the admin
   path is `sales-channels` because `/channels` is Communication's.)*
3. The store front *(the store service and the ERP's button built 13 October; see below; the Next.js storefront is built in parallel)*: a Go service from `~/SoftwareProjects/go-cqrs-boilerplate` plus a React Next.js front end (decided 12 October; awaiting answers to the Online Shop product document), and the "create e-commerce" button. *(Replaces the earlier choice between Go templates and Angular SSR.)*
   **Step 3 as built, 13 October 2026** (API, web and the new Go repo
   `commerce-store-service`; [SALES_CHANNELS.md](SALES_CHANNELS.md), "The
   online store"). **Create online store** makes the shop's channel, its
   key, a subdomain (`<slug>.shops.localhost`), the shop's settings and the
   first feed, then registers the shop with the shared store service
   (`online_shops`, migration `1781000000000`); a failed hand-over shows as
   *Not connected* and **Reconnect** makes a new key. Shop settings: places
   and sell-from types, payment methods per shop, hold orders, guests,
   smallest order, credit terms for company shoppers, sign-in methods.
   The Go service serves every shop by host: the catalogue and search from a
   read model of the ERP's feed behind a Redis cache dropped on every
   change; carts that follow a signed-in shopper; **checkout re-priced
   live, idempotent three ways (a Redis claim, a unique key, the ERP's own
   idempotency key), the last unit sold once under concurrency, a card order
   placed in the ERP only after the payment succeeds and refunded if the
   ERP then refuses it**; a payment-provider port with a sandbox adapter;
   shopper accounts (an emailed code or a password; social sign-in is a port
   for step 4) with per-shop sessions stored as hashes; order history read
   back from the ERP; the store reports each payment to the ERP
   (`channel_order_payments`, `POST /api/channel/v1/orders/:id/payments`).
   Tests: Go unit, scenario (real router, a fake ERP), integration against
   real Postgres, Redis and Kafka, and `scripts/smoke.sh` against a branch
   ERP; ERP `online-shop.e2e-spec.ts` (17), `shop:drill`, the tenancy
   sweep; web stubbed Cypress (15) and a live spec. Not built: social and
   phone sign-in, real payment rails (the books are not posted), delivery
   fees and zones, shopper-side cancel of a placed order.
   **Follow-up built 13 October 2026 (API, web, store service and the Next.js
   storefront `commerce-storefront`; [SALES_CHANNELS.md](SALES_CHANNELS.md),
   "Look and content, a product's items, pictures, consent").** The six gaps
   the storefront found, closed end to end: (1) the feed carries `productId`
   and `options`, so an item's page offers the product's other items as
   colour/size choices (sold-out values shown); (2) the shop's **look and
   content** is set in the ERP's online-store tab "Look and content" (theme
   with a contrast guarantee, logo and favicon and banners as Drive files on
   the shop, terms/privacy/returns/about/contact/custom pages, SEO text,
   contact details, languages with translations, display-only extra
   currencies, the marketing wording), pushed to the store and used by the
   storefront (footer, pages, terms the shopper must agree to at checkout,
   SEO, logo, banners); (3) the feed carries the variant's **pictures**,
   served to the channel as bytes and cached by the store, shown on items,
   cart and order lines with the item's path; (4) a saved address is
   **edited in place**; (5) **marketing consent** from sign-up, profile and
   checkout, kept by the store with the wording and time and carried to the
   ERP customer's consent (source `online_shop`; a shopper who only signed up
   is a lead, one who ordered a customer); (6) a unit's **step** (halves,
   grams) is carried and enforced: the order endpoint refuses a quantity
   that is not a whole number of steps and the storefront steps by it.
   Migration `1781150000000`, seed v79 (`trade.channels.content.update`).
   Tests: `online-shop-content.e2e-spec.ts` (25), extended channel and
   shop drills, web unit and stubbed Cypress (27), Go scenario and
   integration tests, storefront Vitest and Playwright (axe on every new
   screen). Not built: translated interface text (the shop's own words are
   translated; the storefront's buttons are English), real multi-currency
   pricing, per-language addresses.
4. Custom domains. *(Built 13 October 2026, API, web, the store service and the storefront; [SALES_CHANNELS.md](SALES_CHANNELS.md#domains-step-7).)*
   A shop's **Domains** tab: search and price a domain (the registrar's price plus
   Commerce's margin, in the currency of the organisation's country), **buy it
   through Commerce** (Hostinger, built to its published API: the organisation
   confirms the exact total and is the registrant; it is charged, registered,
   pointed at the shop and given a certificate; a registry refusal refunds),
   **connect one the organisation owns** (records to add at its DNS provider, a
   TXT that proves ownership, live status checks and clear errors), a **main
   address** that the others redirect to, **renewal** (auto-renew, by hand,
   reminders, retries after a failed charge), **transfer out** with the
   authorization code (shown once), letting a domain go, settings, events and
   notifications. Ports with adapters: registrar (Hostinger, sandbox), edge
   (Cloudflare for SaaS custom hostnames, development, sandbox), DNS checker,
   payment (sandbox: no platform-billing path exists yet). Migration
   `1781400000000`, seed v84; the store service routes every verified name and
   the storefront redirects to the main one. Not built: real payment rails
   (held), a reconciliation of Commerce's Hostinger portfolio against the ERP.
   The user must supply: Hostinger token and payment method, `DOMAIN_PRICING`,
   Cloudflare for SaaS zone and token (see the document).
   **Online shop steps 4 and 5 — built 14 October 2026** (API, web, the store
   service and the storefront; branch `feat/shop-shoppers`;
   [SALES_CHANNELS.md](SALES_CHANNELS.md#shopper-accounts-step-4)). **Step 4,
   shopper accounts:** sign in by emailed code, password, a code sent to a
   phone or Google, Apple and Facebook, each through the **organisation's own**
   number or app (integration slots, checked when saved, offered only when
   ready; a sandbox provider for trying a shop); one account across the ways
   (proved email or number only); every message from the shop goes out through
   the organisation's own providers (`POST /messages`); **company shoppers**
   (the organisation's own customer records with people, roles, limits, credit
   terms and approvals; apply, order for the company with a purchase order
   number, approve over-limit orders; a company's orders in the ERP's
   **Company accounts** tab). Migrations `1781700000000`, `...100`.
   **Step 5, delivery:** the organisation's own **zones and rates** (flat or
   tiered by weight, value or items, extra per started unit, limits, free over,
   estimates, tax), **collection points**, and a **carrier as an integration
   slot** (a sandbox and an EasyPost adapter built to its published API); the
   shop's checkout offers options priced by the ERP for the cart and address,
   the shopper chooses, the ERP prices the choice again and the fee becomes a
   service line of the order; delivery notes (waybills) and shipments are made
   in the ERP (label from the carrier or a courier arranged by hand), followed
   to the door (tracking job, the Waybills screen) and shown to the shopper as
   packed, shipped, delivered or ready, collected, with the organisation's own
   email, SMS or WhatsApp telling them. Web: **Delivery** tab, the order's
   delivery drawer. Migration `1781700000200`, seed v90
   (`trade.channels.delivery.read|manage|fulfil`). Not built: per-currency
   charging (no foreign-currency accounting), partial shipments, a live
   EasyPost account (recorded answers only), real Google/Apple/Facebook apps
   and an SMS number (the organisation's to bring).
   **Step 6, what brings shoppers back:** **reviews** with verified
   purchasers (the ERP knows who bought), one per shopper per product, read by
   the organisation before they are shown (or after, its choice), answered as
   the shop; **wishlists** (the store service's own); **back-in-stock alerts**
   told once through the organisation's own mail when stock returns; **display
   currencies** whose rates come from a provider the organisation chooses
   (Frankfurter or Open Exchange Rates, or typed) with a markup of its own, kept
   in a history; and the storefront in **Spanish, Portuguese and French** beside
   English. Web: **Reviews** and **Back in stock** tabs, the review and alert
   switches, the currency source. Migration `1781700000400`, seed v91
   (`trade.channels.reviews.read|moderate`, `trade.channels.alerts.read`). Not
   built: charging in another currency, review photos and votes, alerts by
   SMS or WhatsApp from the storefront, live accounts at the two rates
   providers (recorded answers only).
5. Dedicated containers.
6. Marketplaces. **Built 17 October 2026** (API and ERP web, branch
   `feature/marketplaces`; [SALES_CHANNELS.md](SALES_CHANNELS.md#marketplaces-phase-411-item-6)).
   A channel of kind `marketplace` that sells on **Jumia, Konga or another
   marketplace through the organisation's own seller account** (one integration
   slot each, sealed and tried before saving; none bundled). A connector
   interface with a Jumia adapter (Vendor Center API, orders read on a schedule
   because Jumia has no webhooks), a contract adapter for Konga and any other
   marketplace (Amazon and Takealot-ready through a gateway), and a sandbox.
   **Listings** from the channel's assortment, checked before they are sent,
   with category and attribute matching, the channel's price books plus its
   own percentage, commission cover and rounding, and rejections shown with
   their reasons; **stock** with safety buffers, pushed on stock and catalogue
   events; **orders** imported once into sales orders (webhook or scheduled
   read), mapped customers, unmatched items held rather than guessed;
   **status and shipments** told back from the delivery module;
   **cancellations and returns** as credit notes; **commissions, fees and
   payouts** through a clearing account, statements (API or CSV) posted by
   themselves when they agree with the books and held when they do not, and the
   position owed against what clearing holds; **issues** told through the
   notification centre; screens followed live; 13 KPIs and 6 reports. Web:
   eight tabs on the channel's page and "Create marketplace channel". Migrations
   `1783200000000`, `...100`, `...200`; permissions
   `trade.channels.marketplace.read|manage|settle`. Not built or not proven: any
   live seller account (field names are assumptions until a first real call),
   Jumia returns and statements as an API (Jumia has none), grouped variations,
   marketplace-fulfilled stock, multi-currency conversion.

### Phase 4.12 — Point of sale: a channel with tills *(designed 27 September; rewritten 13 October from the Point of Sale product document, Draft 3, every question answered: [Point-of-Sale-Product-Document.md](Point-of-Sale-Product-Document.md))* ← **steps 1 to 5, 7, 9 and 10 built and the gaps closed, 13–14 October** ([POINT_OF_SALE.md](POINT_OF_SALE.md))

*The ask:* a point-of-sale till for walk-in customers that keeps selling
offline and resyncs when back online, on Android, iOS, Windows, macOS,
Linux and the browser.

- **A POS channel** like the store front, except that it registers
  **tills** at its locations; a cashier signs in to a till, not the ERP.
- **Native tills in Kotlin** (`commerce-pos-app`: Kotlin Multiplatform core,
  Compose screens) for Android (every maker's POS terminals through
  per-maker hardware adapters; later Commerce's own Android devices), iOS
  and the desktops. **A React web till** (`commerce-pos-web`) on the same
  Kotlin core compiled to JavaScript.
- **One backend, `commerce-pos`:** a Go service from `go-cqrs-boilerplate`
  (tills, shifts, cash, offline number blocks, sync, fiscal reporting),
  talking to the ERP only through the channel API.
- **Offline allowance set in the ERP** per product: sellable offline, a
  quantity per till reserved from stock, a maximum time offline (24 hours by
  default, changeable) and value per shift; offline card payments where the
  terminal supports them, up to a limit; bank transfers accepted.
- **Resync:** offline sales are facts; problems become sync exceptions,
  never dropped.
- **Tax and fiscal rules per country** in the settings, behind a fiscal
  slot per country.
- **Order:** the POS channel in the ERP; `commerce-pos`; the Kotlin till
  online; offline; the React web till; every platform; hardware; fiscal
  rules; loyalty and credit; reports; Commerce's own devices.

**Step 1 — the POS channel in the ERP: built 13 October 2026** (API and
web; [POINT_OF_SALE.md](POINT_OF_SALE.md)). A channel of kind
`point_of_sale`; tills with one-time hashed enrolment codes, a credential,
block / unblock / retire (never deleted) and a wipe flag; cashiers with a
role, limits and a bcrypt-hashed PIN (never returned); offline allowance
rules per product or category (fixed, share of the place's stock, any),
resolved in SQL and **reserved through the reservation ledger** so the shop
cannot sell them, released as sales sync and topped up; POS channel
settings (offline hours and value, payment types and which may be offline,
float, blind close, what a sale becomes, return window, block size, held app
version); receipt number blocks that never overlap; fiscal profiles per
country behind a `fiscal` integration slot; the channel API
(`/api/channel/v1/pos`) for the POS backend; events and permissions
(`trade.pos.*`, seed v74).

**Step 2 — the POS backend `commerce-pos`: built 13 October 2026** (its own
repository, Go, from `go-cqrs-boilerplate`; the ERP's half in API and web;
[POINT_OF_SALE.md](POINT_OF_SALE.md#step-2-what-the-tills-sold)). Tenancy
(every table and query leads with the organisation; a till credential is a
sealed-at-rest secret and PIN verifiers are bcrypt); the offline journal
(per-till gapless numbering, batches stored in order in one transaction, a
repeat answered identically, a hole refused unless the device closes it with
a `journal_gap` event, nothing unapplyable dropped: it is kept as received
with a sync exception in plain words); **sales posted into the ERP exactly
once, in the order they were made** (an invoice, its receipts, the stock;
oversold, a changed price, a missing account are reported and never refuse a
sale); shifts and cash reconciled exactly and reported; exceptions with a
resolution flow the ERP surfaces and the POS backend reads back by a cursor;
allowance release and top-up; a per-country fiscal slot and a terminal
payment port, each with a sandbox adapter. The ERP gained the sale, shift and
exception endpoints on the channel API (`pos_sales`, `pos_sale_payments`,
`pos_shifts`, `pos_sync_exceptions`, migration `1781050000000`), three
events, the permission `trade.pos.exceptions.resolve` (seed v77) and, on the
POS channel's page, the Sales, Shifts & cash and Sync exceptions tabs. Not
built at step 2: a sales return / credit-note document, gift-card and
account payments, the credit-limit check, card settlement; the first four
were closed by POS completion (below); steps 3 on.

**Steps 3, 4 and 5 — the tills: built 13 October 2026** (own repositories,
documented in [POINT_OF_SALE.md](POINT_OF_SALE.md#steps-3-to-5-the-tills)).
`commerce-pos-app`: the Kotlin till, online then offline (shared core with
decimal money, pricing and tax, cashier limits and approvals, the offline
rules, the journal and sync engine, receipt numbering from blocks; SQLite;
Compose screens; desktop and Android; ESC/POS printing; 166 JVM and 170
Node tests). `commerce-pos-web`: the React web till over the same core
compiled to JavaScript (IndexedDB, service worker, WebUSB / Web Serial
printing; 103 unit and 45 Playwright tests). **iOS is written, not built**
(no Xcode); **hardware** beyond ESC/POS printing and keyboard-wedge scanning
is tested only against fakes; the web till has **no card terminal and no
raw network printer**. The tills still offer cash, card and bank transfer
only.

**POS completion — built 13 October 2026** (API, web, `commerce-pos`,
branch `feat/pos-complete`). A till's return or void is a **credit note**
against the sale's invoice with the already-paid part released from the
receipts that paid it and the refund paid out of the right treasury account
(**customer refunds**, a document of their own: `ar-refund`, Sales →
Refunds); `return_to_book` is retired for new returns. Gift card, store
credit, wallet, on account (with the **credit-limit check**) and QR / payment
link (sandbox gateway) are **booked**; **gift cards** are an instrument
(account 2440, posting role `gift_card_liability`, Sales → Gift cards). A
missing treasury account is **made in one click** from the exception, which
books every payment that waited for it. An **oversold** exception suggests a
transfer from the places holding stock. `commerce-pos` answers **CORS** for
the web till's origin (`HTTP_CORS_ALLOWED_ORIGINS`) and passes through the
payment-checkout and gift-card calls. Migrations `1781200000000`,
`1781200000100`, `1781200000200`; seed v80. Left: till screens for the new
payment types, loyalty reversal on returns, gift-card breakage income,
selling a gift card at the till, real payment rails.

**Step 9 — customers, loyalty and the other ways of paying at the till:
built 14 October 2026** (API, web, `commerce-pos`, both tills; branch
`feat/pos-loyalty`; [POINT_OF_SALE.md](POINT_OF_SALE.md#step-9-customers-loyalty-gift-cards-and-the-other-ways-of-paying-at-the-till)).
The cashier finds or makes the customer (phone, name or email; the consent
answer is kept with the words read out) and sees their points, tier, credit
and terms; a sale **earns points** (floor of net x points per unit x the
tier's multiplier), points are **spent** as a payment, and a return takes
them back; **gift cards are sold and topped up at the till** (the code is
made on the till and printed; the ERP gets only its hash; the invoice
credits "gift cards owed", not income); **gift card, store credit, wallet,
on account (credit limit and hold) and QR / payment link** have till screens
and contract calls; split tenders; **refunds go back the way the sale was
paid**, a gift card back onto the card. Offline: regulars are kept, points
and store credit are spent against what the till last saw less what it has
let them spend, on account within an allowance (a supervisor beyond it),
earning is queued. Migrations `1781650000000`, `1781650000001`; no seed.

**Step 10 — reports: built 14 October 2026** (API, web, `commerce-pos`;
branch `feat/pos-reports-fiscal`; [POINT_OF_SALE.md](POINT_OF_SALE.md#step-10-reports)).
Nine reports in a `pos` analytics module — sales by till, by cashier and by
hour, the payment mix, cash differences per shift, offline activity, sync
exceptions, the fiscal status of sales, and voids, returns and discounts by
cashier — on the report framework (filters by place, channel, till, cashier
and dates; exports, views and schedules; location scope), read from a new
`pos-activity` projection, so none reads the history of sales, and all
cached and pushed because everything they read announces its changes. Five
dashboard widgets. `commerce-pos` now tells the ERP how long a till was
offline (a spell, once). The framework gained pickers by name, a default
grouping and period, and a fix for tables in a schema with no entity.
Migrations `1781950000000`, `1781950000100`; seed v95.
Not verified: iOS (never built), real payment rails, the hardware on a
terminal. Left: fiscal country modules beyond Nigeria, Ghana and Kenya (8), Commerce's own devices
(11), gift-card breakage income.

**Step 8 — tax and fiscal rules: built 14 October 2026** (API, web,
`commerce-pos`, both tills; branch `feat/pos-reports-fiscal`;
[POINT_OF_SALE.md](POINT_OF_SALE.md#step-8-tax-and-fiscal-rules)). A country's
rules are a module of the POS backend behind the `fiscal` integration slot
(rules, the receipt it requires, the deadline, checks, and an adapter for its
authority). **Built: Nigeria** (VAT 7.5%, inclusive or exclusive by the profile,
the TINs, the FIRS e-invoice, the receipt with IRN, stamp and QR). **Simulated:**
the authority (`ng-firs-sandbox`, a pretend FIRS, refused in production);
`ng-firs`, the real adapter, maps the sale to the e-invoice and is not
connected, since real calls to a tax authority are held to the end. The tills
(Kotlin and web) print what the profile requires; offline sales are queued and
reported by the worker within the deadline (retried with growing waits,
overdue flagged); the ERP keeps a record and a history per sale, a **Tax
reporting** tab lists the rejections with the authority's reasons and retries
them, and profiles say what is wrong with them. Migration `1781960000000`;
no seed. Left: other countries' modules, the real FIRS connection (credentials
and the live specification), the buyer's TIN at the counter.

**Step 8b — Ghana and Kenya: built 17 October 2026** (API, web, `commerce-pos`;
branch `feature/fiscal-gh-ke`;
[POINT_OF_SALE.md](POINT_OF_SALE.md#step-8b-ghana-and-kenya-17-october-2026)).
Two more modules on the same port. **Ghana (GRA E-VAT):** VAT with the NHIL and
the GETFund Levy (the COVID-19 levy while the schedule has it); **Kenya (KRA
eTIMS):** tax types A to E, an item classification code and units for every item,
the PIN, the branch and the registered device. No rate is in code: each country's
**rate schedule, with the days each applies**, is the organisation's, in the
country's document settings (`fiscal-ghana`, `fiscal-kenya`) and travels in the
till configuration, so a late-reported sale is taxed at the rate of the day it was
made. **Simulated:** `gh-gra-sandbox` and `ke-etims-sandbox` (refused in
production; the eTIMS one registers a device and takes sales only through it);
`gh-gra` and `ke-etims` map the sale and are not connected. Credit notes name the
invoice they undo and wait for its acceptance. The ERP gained the profile's branch
and device with a *Register the device* action, the **Item codes** tab (the
catalogue mapped to the authority), tax by tax and credit notes on the Tax
reporting tab, the `pos.fiscal_tax` report and a live room. Migrations
`1784000000000`, `1784000000100`; no seed. Left: the real connections (the owner's
registration, certification and test credentials: the list is in
`commerce-pos/docs/fiscal.md`), the Kotlin core printing each tax and the control
unit's lines, other countries; the tests listed under *Deferred tests*.

### Phase 4.13 — Inventory types for manufacturing, and stock classifications *(planned, 27 September)* ← **built, 11 October** ([STOCK_PLANNING.md](STOCK_PLANNING.md))

*The ask:* built-in inventory types for manufacturing. An organisation can
**hide** the built-in ones it does not use and **add its own**.

Today each organisation gets five system types (Stocked, Non-stocked,
Service, Consumable, Asset), each with the flags that already apply:
counted, may go negative, sellable, returnable, trackable.

- **New built-in types:**
  - **Raw materials:** counted, not sold;
  - **Work in progress:** counted, not sold, costed with labour and
    overhead once production exists;
  - **Finished goods:** counted, sold;
  - **MRO supplies:** consumed, not sold;
  - **Packing materials:** consumed.

  Each is seeded for every organisation, hideable (status), never deleted.
- **Not types, but stock facts.** Three items on the list describe *how
  much* or *where*, not *what kind*, so they are modelled that way:
  - **Safety stock** is a per-item, per-location level: minimum, safety
    level, reorder point and quantity. It feeds the stock-low alert
    (Phase 4.9 thresholds) and reordering.
  - **Transit inventory** is stock on a transfer between locations or on
    its way from a supplier: a transfer document and an in-transit state,
    so it is counted but not available.
  - **Cycle inventory** is a planning class. It is used with ABC analysis
    for cycle counting (Phase 1's stock counts) and reorder planning.
- Production itself (bills of materials, production orders, WIP costing) is
  a manufacturing phase of its own: **Phase 11**, which these types feed.

*(Built 11 October: the five types with a `manufacturing_role`, hideable
and never deleted; stock levels — minimum, safety, reorder point and
quantity — on the stock record, with the standing, the order to place
counting stock on its way, draft requisitions through a procurement port,
and alerts; transfers as a document with the in-transit state, journalled
through `stock_in_transit`; ABC classes by value issued with counting by
class and cycle-count sheets. The chosen shape: the levels stay on the
stock record the dashboard and alerts already read; transit is a document
beside the ledger, not a location; the class is a table of its own with
pinning. Left for the planning engine (Phase 11 step 4): stock on its way
from a supplier — built there: the engine counts purchase orders still to arrive.)*

### Stock flow (12 October 2026) — stock per inventory type, and settings that set up an organisation's business flow *(asked and built, 12 October)* ([STOCK_FLOW.md](STOCK_FLOW.md))

*The ask (the user, 12 October):* inventory types can hold several inventories, with a flag for whether sales can be carried out on one; the price book is connected to an
inventory, so settings should say which inventory invoicing and other documents use; and goods bought might not be put in the sales inventory yet (customisation, branding), so
a setting should let an organisation set up its business flow.

- **The ledger per inventory type** — `item.stock_movements.inventory_type_id` (backfilled; NOT NULL in a later migration), `projection.inventory_on_hand_by_type`, `staged_quantity`;
  every writer names a type (or the service settles one): the item's own type for receipts, the types that hold it for issues, the type travels in a transfer, a hold takes from the
  item's own type and a release gives it back there. `held` stays and is true exactly in the Held for production type.
- **Awaiting release**, a new default type (counted, not for sale).
- **Settings:** *sell from these inventory types* (ordered; only sellable) on quotations, sales orders, proforma invoices, invoices and waybills — what a sale draws from and which
  price book prices it (a line may name its type); *receive goods into* on goods receipts (so bought goods wait in Awaiting release); and the new **Release to sale** document's settings
  (approval, only into a sellable type, say what was done).
- **Release to sale** — a standalone document moving items from one type to another at one place at the cost they had; refused when the type it leaves lacks the quantity; it gives the
  item a stock record (and price book) under the new type. Extra cost of customisation goes through a Phase 11 work order.
- **Availability and pricing are type-aware**; reorder alerts keep their meaning (the whole building, and sellable = less held, less staged).

#### Stock adjustment requests and the asset on a dispatch, 27 October 2026 *(asked and built on `feat/stock-documents-reorder-dispatch`; API and web)* ([STOCK.md](STOCK.md#stock-adjustment-requests-and-the-asset-on-a-dispatch-27-october-2026))

*The ask (the user, 27 October):* the stock levels page does not type over a price or a quantity: a quantity changes by a document (goods receipt, waybill, transfer, count) or by a manual correction that is kept in the item's history; whether a correction is made at once or needs a request through the approvals is the organisation's setting; a vehicle or asset can be named on a dispatch, required or not by a setting; and the reorder level can be updated. Researched against SAP (inventory adjustment through a physical-inventory document and an approved posting), Odoo (inventory adjustment applied after review), Dynamics 365 (inventory adjustment journal, posted after approval) and NetSuite (inventory adjustment with an approval routing): the common shape is a reason code, the system quantity beside the counted one, the value effect, and a post that applies the difference.

- **Stock adjustment request**, a document: lines (item, place, type, what the system held, the count or change, the value effect), a reason from the organisation's list, a note; through the approvals engine; applied to the ledger by the change recorded. Settings, Stock and prices: *straight away / by a request (above a value) / only through documents*.
- **A vehicle or asset on a dispatch**: waybills and stock transfers; Settings off / optional / required.
- **Reorder levels**: managers can set them; `PUT /stock/levels/:id` takes any of the four.

#### Transfers go through approvals, 27 October 2026 *(asked and built on `feat/transfer-approvals`; API and web)* ([STOCK_PLANNING.md](STOCK_PLANNING.md#transfers-and-stock-in-transit), [STOCK_FLOW.md](STOCK_FLOW.md))

*The ask (the user, 27 October):* "Inventory transfer between locations and types needs to also go through approvals."

- **Stock transfers** (between places) are `@Approvable(stock-transfer)`: draft, waiting for approval, approved, in transit, received; or turned down, or called off (until it leaves). `POST /stock/transfer-orders/:id/submit`, `GET /stock/transfer-orders/rules`; the dispatch refuses a transfer that needs approval and has none (409). Settings, Stock transfers: *Transfers need approval* — always (default), over a value, never — and the value. Raised with `whenNoPolicy: 'owners'` (api #137), so with no policy the organisation gets "stock-transfer: owners approve" and the request waits. Migration `1791660000000` (statuses and the approval columns).
- **Type transfers** (between inventory types): *Approve before the stock moves* is on by default and raised with `whenNoPolicy: 'owners'`, so a transfer never passes for want of a policy. Decision: migration `1791660000100` turns a stored `requireApproval: false` on for every organisation (a stored false is mostly the old default saved with the form; it can be switched off again; `approvalOnlyIntoSellable` is kept).
- Both are in the approval policy form (*Stock transfer*, *Type transfer*, with their facts), in the approvals list and inbox, and tell whoever drew them up when they are approved or turned down. Each page reads whom the approval waits on and the decision with its note (`approval` on the document, readable without the right to read approval policies).
- Specs: the rules (`transferNeedsApproval`, `cannotDispatch`…), the service, the catalogue, the settings migration; e2e `stock-transfer-approvals.e2e-spec.ts` and the drill steps written, not run.

#### Type transfer, 19 October 2026 *(asked and built on `feature/inventory-type-transfer`; API and web)* ([STOCK_FLOW.md](STOCK_FLOW.md#type-transfer-19-october-2026))

*The ask (the user, 19 October):* "It's actually a type transfer. Settings can set which inventory types it can send to and receive from, with other settings. It is the ability to move items
from one inventory type to another; the reason is best known by the organisation." (SAP transfer postings with reason codes, NetSuite inventory status change, Dynamics 365 status change with
organisation-defined reason codes and Oracle subinventory transfers agree.)

- **Renamed** in everything a user sees — *Type transfers* in the menu, the pages, the drawers, the settings page, notifications and approvals, movement history, OpenAPI. New address
  `/inventory/type-transfers[/:id]`; `/inventory/releases[/:id]` redirect. Internal names stay (tables, `inventory.releases.*`, the `release-to-sale` settings key, the `stock/releases` API address, event
  and subject names), and every existing number. The branding-specific wording is gone: it describes moving stock between types in general.
- **Send-from and receive-into types** replace `intoSellableOnly`: `sendFrom` (any / chosen types, default any) and `receiveInto` (any / the types for sale, read live at submit, default / chosen types); chosen types are validated by the inventory-type-references rule at save, and the rules are enforced at
  create, update and submit with a 400 naming the setting; the form offers only the allowed types. Migration `1788900000200` makes `receiveInto.mode` `for_sale` where
  `intoSellableOnly` was on or unset (and `any` where it was off), so nothing changes on the day and a later sellable type is included (and `requireReason`, which meant "a note", becomes `requireNote`).
- **The organisation's reasons** (`reasons`: code, label, active; starting with Repacked, Branded or customised, Quarantine, Returned to sale, Reserved, Other), `requireReason`, `requireNote`;
  `reason_code` on the transfer (migration `1788900000100`), a column and a filter on the list, shown on the detail page; a switched-off reason stays readable.
- **Approval**: `requireApproval` kept; `approvalOnlyIntoSellable` limits it to transfers into a type for sale.
- **Reverse**: on a moved transfer, a draft pre-filled the other way (same place, items and quantities, reference = the original's number); nothing moves until it is submitted.
- Unchanged: the cost carries; refused when the sending type holds less; the item gets a record and price book under the receiving type; extra cost goes through a work order; Manufacturing's *Output awaiting release* is a separate screen and keeps its name.
- Tests: unit (`release-to-sale.logic.spec.ts`, `release-to-sale.service.spec.ts`, `type-transfer-settings.spec.ts`; web `stock-release.model.spec.ts`), `test/stock-flow.e2e-spec.ts`, `stock:drill`,
  stubbed Cypress `stock-flow.cy.ts` and live `live/stock-flow.cy.ts` (written; run by CI and the integrator). Inventory: `design-handoff/feature-inventory/type-transfer.md`.
- Built: API (step 1: migrations `1780650000000`–`400`, seed v70), web (step 2).

### Inventory into work and assets *(asked 17 October 2026; built 17 October on `feature/inventory-work-assets`; API and web)* ([MANUFACTURING.md](MANUFACTURING.md#output-follows-the-stock-flow-settings-17-october-2026), [PROJECTS.md](PROJECTS.md#stock-to-a-project-17-october-2026), [ASSETS.md](ASSETS.md#maintenance-accounting-and-assets-under-construction-17-october-2026), [STOCK.md](STOCK.md#ledger-entries-by-purpose-17-october-2026))

*The ask (the user, 17 October):* stock should flow into work and into assets the way it flows into sales — manufacturing following the stock-flow settings, stock going to any project and to maintenance at its cost with the ledger's Project dimension on every posting, maintenance accounted for properly, and assets built over time. A survey of the code found two bugs, which came first.

1. **Two bugs.** A quality (NCR) scrap of finished goods already received only lowered counts: the units now leave stock as a `QualityScrap` issue at their stock cost (Dr production scrap, Cr stock) and the work order's received count follows. A maintenance part was costed as quantity times a typed unit cost (default 0) and posted to stock adjustments: it now costs what stock valued the issue at and posts Dr repairs and maintenance, Cr stock (`maintenance_expense`, falling back to adjustments until set). *Built.*
2. **Production follows the stock-flow settings.** Output (product, co-products, by-products) lands in the type the shop floor's settings name; an optional *waits for quality's release* step holds it in *Awaiting release* until a person with `manufacturing.output.release` releases it (some or all, at the cost it carries) or rejects it (scrapped at its cost); audited, live, keyset-paged; web screen *Output awaiting release*. *Built.*
3. **Stock to any project and to maintenance, at stock cost.** `POST /projects/:id/stock/issue|return` for service, installation and manufacturing projects (Dr project materials, Cr stock, under the project in the Project dimension; a cost of kind `stock`; profitability, burn and forecast read it); every stock posting of a manufacturing work order, including the conversion cost added to goods, carries its project; a task's material check nets stock held for work orders. Web: the project's *Materials* tab. *Built.*
4. **Maintenance accounting.** Labour and contractor charges posted (through the posting backlog); an expense-or-capitalise decision per work order — an overhaul adds to the asset's cost and life and depreciation is worked out again; part returns to stock; replacing a component issues the replacement from stock, registers it and links it. Web: the work order's parts, *In the books* and the new actions. *Built.*
5. **Assets under construction.** Capital work in progress collecting stock issued, posted supplier bills, work orders on it (parts, labour, contractors) and what a work order made for it over time; commissioned in one entry into a parent and components, each over its own life; the parent reads as the sum of its parts. Manufacturing can make an asset for own use (a production order's product is capitalised, not stocked). Web: *Assets under construction*. *Built.*

Decisions for the user are in the final report; the deferred tests (e2e route specs, tenancy sweep for the new routes, stubbed and live Cypress) are listed there too.

### Phase 4.14 — Drive: the business's documents and files *(requested 4 October; written in full 5 October from the user's document; seven steps)* ← **step 1 (foundation) built, 10 October; steps 1 and 2 (the file platform: processing, versions, locks, trash, copies, quotas, search, the drive screen) built, 10 October; step 3a (stars, shortcuts, comments, activity, recent and shared lists) built, 10 October; step 3b (links outside, temporary access, document requests) built, 10 October; step 3c.1 (team and project workspaces) built, 10 October; step 3c.2 (document references) built, 11 October; the use-case refactor and step 4a (document types, details, tags, classification) built, 14 October; steps 4b (governance), 4c (approvals), 4d (workflows), 4e (templates and generation), 4f (e-signatures), 4g (the document inbox, routing and email-to-document) and 4h (watermarks, download and print controls) built, 14 October; the v3 boards' API (row states read model, figures, bulk actions, a file's page in one read, preferences, request counts and once-a-day reminders, the task board) built 25 October on `feature/drive-api`: DRIVE.md**

*The ask:* the business's own document platform inside the product —
Dropbox's storage, Google Drive's workspace, and enterprise document
management's control, workflow and intelligence — and the one place every
other module keeps its files. The source is the user's
`Document_Management_Platform_Combined.md` (product and technical, in
`documentation/`). **It is built in full: there is no MVP.** The steps
below are the document's own dependency order (its §203), not a cut in
scope.

**What it covers** (the document's capability map, every row built)

| Area | What |
|---|---|
| Storage | Workspaces (the organisation's, teams', projects', each member's own "My Drive"), drives (Finance Drive, HR Drive…, and shared drives owned by the organisation, not a person), folders, files; quotas per organisation, drive and member, with alerts. |
| Files | Upload — one, many, whole folders, drag and drop, resumable, multipart, in the background, with progress; download one, many or a folder as a zip; copy, move, rename; shortcuts; favourites, starred, recent, shared with me, shared by me. |
| Preview | Documents, spreadsheets, presentations (converted for viewing), images, audio and video (transcoded), archives (listed), text and code. |
| Versions | Every upload over a file is a version; history, compare, restore; the original is never changed. Locking: check out, check in. |
| Trash | Removed items restorable for the period the organisation sets; permanent deletion only past retention and outside a legal hold; ownership passed on when a member leaves. |
| Sharing | With people, groups, roles, locations and the whole organisation, as owner, manager, editor, contributor, commenter, viewer, uploader or downloader; links outside with passcode, expiry, download limits and revoking (Phase 4.5's model); temporary access; external users. |
| Collaboration | Comments with mentions and threads, the activity feed per file and across the organisation, notifications and each person's preferences (Phase 4.9). |
| Search | By name, type, owner, date, tag and metadata; inside files (full text, OCR for scans); suggestions; semantic search — and never a way round permissions. |
| Metadata | Tags; custom document types with their own metadata schemas; classification levels (public, internal, confidential, restricted) set by hand or by rule. |
| Business documents | Templates and generation (from records, pdfmake as today); numbering (the numbering module); document requests (ask someone, inside or out, to upload a file by a date); external collection pages; the document inbox and routing; email-to-document (each drive or organisation an inbound address). |
| Workflow | Approvals through the approval engine; a workflow builder (steps, conditions, actions: move, tag, notify, request, approve, sign); SLAs and escalation; delegation while away; approval then signature. |
| Signatures | E-signature through the organisation's provider (integration slot: DocuSign, Dropbox Sign, others) and our own typed or drawn signature, as quotations already have. |
| Governance | Retention policies by type, folder or classification; legal holds that stop deletion; expiry dates; the document lifecycle (draft, in review, approved, published, archived, expired). |
| Security | Malware scanning before anyone else can open a file; type detected from content, not the name; encryption in transit and at rest, with the organisation's own keys as an option; watermarks; download and print controls; DLP rules on content and sharing; device and session management. |
| Audit | An append-only audit log apart from the activity feed; searchable by admins and auditors; exports audited too. |
| Intelligence | OCR, text extraction, classification, metadata extraction, summaries, questions answered from documents, duplicate detection, comparison; human review of what the AI proposes; AI sees only what the asker may read. |
| Clients | The web app; a phone app (upload, scan with the camera, preview, approve, offline files); a desktop app with sync, selective sync, offline and conflict handling, through a change feed. |
| API | Files, folders, sharing, search and workflows over the public API (Phase 4.6 API keys and service accounts), webhooks (Phase 4.6), idempotency, rate limits, SDKs. |
| Enterprise | Single sign-on (SAML, OIDC), SCIM provisioning, delegated administration, data residency (the organisation picks the region of its storage), its own bucket or a dedicated deployment, custom domains and branding for shared pages, migration tools (import from Google Drive, Dropbox, OneDrive, SharePoint, a zip), full export. |
| Administration | The admin portal: members, groups, storage, security and governance policies, audit; storage and activity reports; dashboards for a member and for the organisation. |
| Billing | Storage and processing metered per organisation; plans set quotas and features (Phase 4.10). |
| Hosted images | Images with a public link of their own (the user, 7 October 2026), so the Studio's emails can show images by link instead of attaching them: social icons in layouts, a rich template's images, campaign images. Until then the Studio attaches the organisation's images inline (`cid:`). |

**Fitted to what exists**

- **Organisations, members, roles** are the tenant module's. The document's
  *groups* do not exist yet: they are built here, in the tenant module, and
  approvals' group assignees (which reach nobody today) use them too.
- **A person without an organisation** — the document's personal user — gets
  a personal organisation of one, so every row is still distributed on
  `organization_id` and nothing in the platform has two tenancy models.
- **Bytes** stay in object storage behind the provider interface: RustFS by
  default; the organisation's own S3, Google Cloud Storage, Azure Blob or
  R2 as integration slots (Phase 4.6). The document's MinIO is RustFS here.
- **`storage.files`** is the start of *StorageObject*: provider, bucket,
  key, size, checksum, type, storage class, key reference. The drive adds
  documents and versions pointing at it; the orphan sweep
  (`orphaned-files.service.ts`) learns to see them.
- **Records reference documents**: one `drive.document_references` table —
  entity type, entity id, document id, relationship (invoice → copy,
  supplier → certificate, staff → contract, asset → maintenance report) —
  and each record's files appear in the drive under its folder. Product
  images move onto it. Modules call the drive's API, never its tables.
- **Sharing** builds on Phase 4.5: tokens `<orgId>.<secret>`, only the
  hash stored; passcodes, expiry and revoking already work.
- **Approvals** are the engine's; the workflow builder drives it rather
  than becoming a second engine.
- **Events** through the outbox (`drive.*`, `organizationId` in the payload),
  so open screens update live (Phase 4.7), notifications fire (Phase 4.9),
  webhooks go out (Phase 4.6), and search indexes (Elasticsearch, as now).
- **Settings** are the organisation's (document settings, Phase 3): trash
  period, largest file, refused types, outside sharing on or off, default
  classification, retention, watermarks, AI on or off and which provider.
- **The stack** is ours: NestJS, Postgres on Citus, Redis, Kafka, BullMQ,
  Elasticsearch — the document allows TypeScript. Heavy work runs in
  workers of their own: ClamAV, LibreOffice for office previews, ffmpeg for
  media, Tesseract (or the organisation's OCR provider) for scans.

**How it is built** (the second question of every query: 200k+ people,
millions of files)

- Tables in a `drive` schema, distributed on `organization_id` and
  colocated: workspaces, drives, folders (`parent_id` canonical, a
  materialised path for "everything beneath" in one indexed query; moving
  refuses cycles and updates paths in batches), documents, versions,
  permissions (resource, principal — member, group, role, location,
  organisation, public, service account — role, inheritance, expiry),
  shares, comments, metadata schemas and values, requests, retention,
  holds, audit.
- **Permission evaluation is one service**: inherited, direct, group and
  role grants, then organisation and resource policies; results cached in
  Redis by `(org, member, resource, revision)` and dropped when a grant
  changes. Every read — metadata, content, preview, thumbnail, search, AI —
  goes through it.
- **Search security**: each indexed document carries the principals that
  may read it, and every query filters on the asker's; the index is
  rebuilt from Postgres when needed.
- **Bytes never pass through the API**: presigned multipart uploads with an
  upload session (started, uploading, completed, failed, expired) and
  short-lived signed downloads bound to the member. Private buckets only;
  object keys never appear in the API.
- **Processing pipeline** after upload — scan, detect type, thumbnail,
  preview, extract text, OCR, classify, index, embed — each an idempotent
  BullMQ job with retries, priorities and a dead-letter queue; the file's
  processing state is visible.
- **Deduplication** within an organisation only (by checksum), never across
  organisations; storage tiering and lifecycle rules move cold versions to
  cheaper classes; garbage collection deletes objects only after
  retention, holds and every reference allow it.
- **Quotas** are a projection kept from upload and purge events.
- Audit is append-only and separate from the activity feed.
- The document's invariants are tests: no bytes in Postgres; originals and
  versions immutable; every row tenant-scoped; authorisation before
  exposure; search and AI respect permissions; links are explicit and
  hashed; deletion respects retention and holds; events through the
  outbox; processing idempotent; search rebuildable; buckets private;
  signed URLs short-lived.

**Steps** (the document's dependency order; rough weeks)

1. **Foundation** *(~4)*: the `storage/files` module tested first (Phase T
   step 2 did); groups; workspaces, drives, folders, documents, versions;
   the permission service; upload sessions and download; tenancy and audit.
   *(Built 10 October: the API, the private bucket, signed uploads and
   downloads, the permission service with its revision-keyed cache, the
   audit log, settings; groups were Phase 7's. DRIVE.md.)*
2. **The file platform** *(~4)*: the drive screen (list and grid,
   breadcrumbs, drag and drop, details panel, context menu, permissions
   dialog, upload progress; NgRx; `ui-list-state`); previews and
   thumbnails; versions, locking, trash and restore; quotas; search by
   name and metadata; malware scanning. Built in four parts:
   *2a, processing (built 10 October: checksum, ClamAV, type from content,
   programs blocked, thumbnails and previews by sharp, pdfjs, Gotenberg and
   ffmpeg, checking again)*; *2b, versions restored and removed, locking,
   trash and restore, copying, garbage collection (built 10 October)*; *2c,
   quotas and search (built 10 October)*; *2d, the drive screen (built
   10 October)*. **Step 2 complete.**
3. **Collaboration** *(~3)*: sharing inside and out, shared drives, team
   and project workspaces, comments and mentions, activity, notifications,
   document requests and external collection, favourites, recent, shared
   with me and by me; record attachments through document references
   (products' images, staff documents, supplier certificates, asset
   folders). In three parts: *3a, stars, shortcuts, comments and mentions,
   activity (timelines and the feed), recent, shared with me and by me,
   their notifications and screens (built 10 October)*; *3b, sharing
   outside the organisation by link and temporary access (3b.1, built 10
   October), document requests and external collection (3b.2, built 10
   October)*; *3c, team and project workspaces (3c.1, built 10
   October) and document references from other modules (3c.2, built 11
   October: a registry of record kinds, references, a Records drive, the
   Files panel on eight record pages)*.
4. **Business document management** *(~5)*: metadata schemas and custom
   types, tags, classification levels, templates and generation,
   numbering, the workflow builder, SLAs, delegation, approvals,
   e-signature, retention, legal hold, expiry, the document inbox,
   routing and email-to-document, watermarks, download and print
   controls. Built in parts (DRIVE.md, *Business document management*):
   *4a, document types with their fields, details checked against them,
   tags through the organisation's own tags (open or controlled), five
   classification levels, classification rules on arrival and over existing
   files, bulk changes, search by kind, tag, detail and expiry, and the
   Organise screens (built 14 October)*; *4b, governance: retention policies
   (longest wins, waiting for a date), legal holds on files, folders, drives and
   people, expiry reminders, the lifecycle and disposal with a record (built 14
   October)*; *4c, approvals: files reviewed and published through the approval engine by kind, folder and classification, and approval before disposal as an organisation setting, off by default (built 14 October)*; *4d, workflows: five triggers, conditions, ten actions, one run per event, loop guards, SLAs with escalation, run history, dry run, tasks (built 14 October)*; *4e, templates and generation: merge fields from ten kinds of record or typed input, versions, PDF, Word and HTML, files in Drive attached to their record, bulk generation as a job (built 14 October)*;
   *4f, e-signatures: Commerce's own signing (typed, drawn or uploaded signatures; members in the app and people outside through links of their own; one after another or all at once; fields placed on pages; deadlines, reminders, decline; the signed PDF stored as the next version, locked, with a certificate of completion) and DocuSign and Dropbox Sign adapters (written against their published APIs, **not run against live accounts**), started from a file, a generated document, a workflow action and after approval (built 14 October)*;
   *4g, the document inbox: addresses that turn mail into files — read from an email channel's mailbox over IMAP or forwarded to the app, attachments scanned, checked against what is in Drive by hash and filed by routing rules (a folder, a kind of document, a level, tags, a workflow, Capture, or ignore), the rest waiting for a person; a mail-sink register so a claimed message is not also a conversation (built 14 October)*;
   *4h, watermarks, download and print controls: policies by classification, kind, folder, drive or organisation (the strictest winning); a download or outside share a policy forbids refused by the server and audited; PDFs and pictures watermarked with who, when, the level and the file as they are viewed or downloaded, nothing stored; the viewer honest that print and copy are only discouraged (built 14 October)*.
5. **Intelligence** *(~4)*: text extraction, OCR, full-text search,
   classification, metadata extraction with human review, semantic search,
   summaries, questions and answers, duplicates and comparison — with the
   organisation's chosen AI provider and only what the asker may read.
6. **Clients and API** *(~6)*: the phone app (Capacitor on the Angular
   code; it also carries assets' counting, Phase 10), the desktop app with
   sync and the change feed, the public API, webhooks, SDKs.
7. **Enterprise** *(~6)*: SSO (SAML, OIDC) and SCIM for the whole product,
   delegated administration, DLP, data residency, the organisation's own
   storage and keys, dedicated deployment, custom domains, migration tools,
   storage analytics, metering and plans (Phase 4.10).

Each step is done only when it is tested (specs, whole-app endpoint tests
with two organisations, the tenancy sweep, a drill in the test
organisation, web specs, Cypress stubbed and live) and documented
(`DRIVE.md`), per Phase T.

**To settle with the user**: which AI and OCR providers to offer first
(every one is an organisation's choice; the defaults are ours); whether
the desktop app is Electron or Tauri; which outside storage and migration
sources first; whether storage is sold by plan.

### Phase 4.15 — The customer page: their documents and transactions *(requested 4 October)*

*The ask:* clicking a customer shows everything the business has with
them — their documents and their transactions — in one place.

**Where it starts.** The Customers screens (accounts, contacts, deals,
pipelines, activities, lists) are placeholders. Every sales document already
names its customer (`customer_id`, a CRM contact), so the data is there;
nothing gathers it. The API has a contact's activity timeline and an
invoice list of what a customer owes (`/ar-invoices/open?customerId=`).

**What a person sees**

- **Customers list**: searchable by name, phone or email, with what each
  owes and when they last bought; opening one goes to its page.
- **The customer's page**:
  - *Header*: name, contact details, credit limit, **balance owed**, credit
    held (deposits not yet applied), overdue amount, last purchase.
  - *Documents*: every quotation, sales order, invoice, receipt, waybill
    and credit note for them, newest first; filter by type, status and date;
    each opens the document. Shared links (Phase 4.5) and their files (Drive,
    Phase 4.14) once those exist for customers.
  - *Transactions*: a statement — invoices, payments, credit applied,
    voids — with a running balance, between two dates; ageing (current,
    30, 60, 90+); download or share the statement as PDF.
  - *Activity*: the existing timeline (calls, notes, deals).
  - *Actions*: new quotation, invoice or receipt with the customer filled in.
- Only what the person may read: a document type they hold no read
  permission for is not listed, as search does (Phase 1).

**How it is built**

- **One read model, not a query per module.** `projection.customer_activity`
  — one row per document or money movement, keyed by `(organization_id,
  customer_id, occurred_at)` — fed from the outbox events the documents
  already raise (`<Document>-created/updated`, receipts posted, voided),
  rebuilt like the other projections (PROJECTIONS.md). At the scale target a
  busy customer has thousands of documents; the page reads one shard, one
  index range, paged. The balance and ageing come from the same rows.
- Endpoints: `GET /customers/:id/summary`, `/documents`, `/statement`
  (from, to), each naming the organisation; 404 for another's customer.
- Sales lists' search by customer works for invoices only today
  (SALES.md); this phase makes it work on every sales list.
- Web: NgRx feature store, `ui-list-state` for each tab (failure before
  absence), live updates through the `/live` gateway's entity notices.

**Done when** (Phase T): unit specs, whole-app endpoint tests with two
organisations (the projection's events, another organisation's customer),
a drill on the test organisation's Ada Contractor and Bayo Retailer, web
specs, stubbed and live Cypress, and `CUSTOMERS.md`.

**When.** After Phase T step 3 audits CRM (the contacts it stands on), and
alongside the remaining sales work; the statement's money is the
receivables already posted, so it does not wait for the ledger (Phase 5).

### Phase 4.16 — Customer pricing: price books, agreements, tiers, commitments and rebates *(asked and built 13 October 2026; API and web)*

*The ask (the user, 13 October):* price books assignable to a customer, a
group, an organisation, a channel, a currency or a location, with validity
dates and rules (fixed, percent off, formula with rounding, quantity breaks
all-units or slab, aware of units of measure, one currency per book, no
conversion); **contract prices** as agreements with an owner, approver,
reason and dates, an approval flow and expiry reminders, history, retired
never deleted; **tiers from behaviour**, recalculated nightly, every move
audited, the customer and the rep able to see why and what is needed next;
**commitments** with a true-up a person approves; **rebates** accrued as a
liability and settled by a credit note a person approves; **promotions**
layered on top with their own precedence; precedence, stacking and a margin
floor chosen by the organisation and enforced in `judge()`; every price
path through one explainable resolver; the reports; and two settings
(shared certificates on the network, expired gift-card balances).

1. Price books, rules, assignments, promotions, the engine and the price
   check. **Built 13 October:** migration `1781500000000`; `customer-pricing/engine`
   (pure `resolveLine`, 80 specs) read by `SalesPricingService`, so by every
   sales document through `judge()`, by the till and the online shop
   (`ChannelPricesService`) and by the network's catalogues
   (`price_book_id`). Routes `customer-price-books` and `promotions`.
2. Agreements (contract prices): numbered, owned, approved by a person other
   than the author (setting) or the approval engine, amended as revisions,
   retired, reminders. **Built 13 October:** routes `price-agreements`.
3. Tiers: nightly placement from posted invoices, grace before a fall,
   pins, the move audit, the customer's "why and what next". **Built 13
   October:** migration `1781500000100`; routes `price-tiers`.
4. Commitments with true-ups, and rebates with accrual and settlement.
   **Built 13 October:** migration `1781500000200` (also the ledger accounts
   2450, 4320, 4820 and the posting roles); routes `price-commitments`,
   `price-rebates`.
5. Reports, the customer's page, the screens (`/pricing/*`, a *Pricing* tab
   on a customer, the catalogue's price book, the ordered precedence
   control), and the two settings. **Built 13 October:** migration
   `1781500000300` (catalogue price book, gift-card expiry columns); seed v86
   (`trade.pricing.*`). Expired gift-card balances: Sales → Expired
   gift-card balances. Shared certificates: the Network setting
   `sharedCertificates`.

### Business intelligence and financial health — the whole PRD *(asked 16 October 2026, built 16-17 October; API and web)* ([BUSINESS_INTELLIGENCE.md](BUSINESS_INTELLIGENCE.md))

*The ask (the user, 16 October):* the business-health document has more than six
metrics; do not box the system to six. The six cards are only the default set of
a dashboard of KPI cards that can show any registered KPI.

- [x] **Facts layer** (`metric-facts` projection: ledger and customers handlers; day, month and total grains; dimensions; status per value) replacing the `business-health` projection; read through `MetricFactReadPort`. Migration `1783000000000`; rebuild `projections:rebuild -- metric-facts`.
- [x] **Registry governance** (group, basis, currency policy, period rule, data quality, numerator/denominator, facts, requires, industries), organisation targets with owners, effective date and audited history, presence-gated catalogue, industry-pack extension point. Migration `1783000100000`.
- [x] **Nine dashboards** of KPI cards with per-person and per-role layouts, the six composite cards as the default of *home*; web *Customise* drawer incl. role defaults.
- [x] **Finance KPIs** (profitability, liquidity, solvency, working capital, cash flow) built on the statements' own functions, so KPIs reconcile with them; cost behaviour and capex settings.
- [x] **Cash forecast runs** (optimistic / base / adverse, morning job, KPIs read the latest run) and a **loan register** whose instalments are obligations. Migration `1783000200000`.
- [x] **Customers and growth**: attribution, CAC by channel with hand-recorded spend, retention, NRR, cohorts, LTV:CAC, top customers; subscriptions interim from recurring invoices. Migration `1783000400000`.
- [x] **Operations, workforce (sensitive), risk and compliance KPIs**; project profitability via the ledger's project dimension; industry KPIs through an extension point.
- [x] **Alerts**: null KPIs cross nothing, target alerts, stale-figures alert, escalation of unacknowledged alerts (migration `1783000500000`); insights and anomalies.
- [x] **AI analyst tools** (`read_kpi`, `explain_kpi_change`, `what_if`), read-only, as the person asking.
- [x] **Consolidation** across linked legal entities with intercompany eliminations, and **reconciliation** of the figures to the books.
- [ ] **Deferred (test lane):** Cypress + axe, endpoint specs, tenancy-sweep fixtures, live specs. **Open:** the industry packs' own KPIs, Memberships and subscriptions as the real source of MRR.

### Business intelligence, follow-ups *(asked 17 October 2026, built 17 October; API and web)* ([GROUP_CONSOLIDATION.md](GROUP_CONSOLIDATION.md), [CAMPAIGN_COST.md](CAMPAIGN_COST.md))

*The ask (the user, 17 October):* "yes" to both follow-ups left open by the whole-PRD lane.

- [x] **Full consolidation**: multi-level groups (a parent of parents), ownership percentages with the full / proportional / equity method the group chooses per holding, dated and audited; non-controlling interest in the balance sheet and in profit; investment against equity and goodwill; an exchange-rate store (closing and period-average rates, entered and retired, never changed) with the translation difference shown in its two parts; line-level eliminations (recharges, intercompany sales and purchases, due-to / due-from, profit in goods still held where the data allows); adjustments as audited entries (draft, post by another person, reverse from a date); the group's statements and fifteen group KPIs; drill-down to each company; a person sees only the companies they may read and never a short sum. Ledger facts cut by the company on the other side (`ic_trade`, `ic_transfer`; ledger handler v3). Migration `1783100000000`, seed `1783100000001`; permissions `finance.consolidation.read|manage|adjust`; document type `consolidation`; `consolidation:drill`.
- [x] **Campaign cost from the books**: a campaign has a planned budget, an acquisition channel and a value of the new `CAMPAIGN` ledger dimension; supplier bill lines and expense claim lines can be tagged to a campaign and post to it; the campaign's cost, CAC by channel (with acquisition accounts no campaign claims assigned by a setting), CAC by campaign and overall CAC read from the ledger facts; spend entered by hand stays as the labelled fallback. Migration `1783100100000`, seed `1783100100001`; KPIs `crm.campaign_spend`, `crm.campaign_budget_used`; `campaign-cost:drill`.
- [ ] **Deferred (test lane):** Cypress + axe for the four consolidation pages, the Cost tab and the campaign selectors; endpoint specs; tenancy-sweep fixtures; an end-to-end elimination proof on posted group trade; a foreign-currency company end to end. **Open:** consolidated cash flow and a comparative column; staged acquisitions and fair-value step-ups (adjustments only); automatic dividend elimination.

### Business insights, reports and dashboard customise: the v3 boards' API *(asked 25 October 2026; built 25 October on `feature/bi-reports-api`; API)* ([BUSINESS_INTELLIGENCE.md](BUSINESS_INTELLIGENCE.md#the-v3-boards-reads-25-october-2026), [ANALYTICS.md](ANALYTICS.md#the-reports-hub-schedules-and-the-ageing-strip-25-october-2026), [DASHBOARD.md](DASHBOARD.md#sizes-25-october-2026))

*The ask (lane brief, 25 October):* build every API need of the eight boards (`erp4d-bi-executive`, `-bi-cash`, `-bi-customers`, `-bi-kpi-drawer`, `-reports-hub`, `-reports-report`, `-reports-schedule`, `-dashboard-customise`) so each is fully servable; reads through Redis and the projections, pushes on `/live`. Package: `design-handoff/feature-inventory/bi-reports.md`.

- [x] **KPI history** `GET /analytics/kpis/:key/history?points&granularity` (sparklines; "cash so far"), Redis copy dropped by the module's change stamp.
- [x] **The drawer in one read** `GET /analytics/kpis/:key/explain`: the equation (declared for gross and net margin, gross profit and the cash cycle), each input read as the person, what moved, assumptions, the projection, the target block's gate (`<owner>.alerts.manage`), sources.
- [x] **Projections of provisional finance figures**: profit and loss KPIs, margins and every statement-figure KPI say how many journal entries wait to be posted (approval or approved), list them, and give `projection { value, on, reason }` worked out with their lines. Migration `1789800000100` (partial index on waiting entries).
- [x] **"Agrees with the books"** on every BI dashboard payload (`reconciliation`), from the `bi.reconciliation` live summary in Redis, re-asked in the background after 15 minutes, pushed on `metric:bi.reconciliation`.
- [x] **Cards move by themselves** on every KPI-owning module's `analytics.facts.<module>` push (now stale on `analytics.kpis.changed.<module>`).
- [x] **Cash forecast** checkpoints (7/30/60/90 days) and end per scenario; **channels** against all channels (`overall`, `aboveOverall`, the comparison sentence).
- [x] **Reports hub**: `GET /analytics/reports/catalogue` (areas, kinds, my pins, my last runs), `GET …/summary` (the strip's counts), star a report (`PUT|DELETE …/:module/:report/pin`), pin a view (`PUT …/views/:viewId/pin`); every run remembered in `analytics.report_reads` (migration `1789800000000`).
- [x] **Ageing strip**: `ReportDefinition.ageing` (declared on `ar.overdue`, `ap.bills_due`, `supplier.corrective_actions`), band totals over every row on each run.
- [x] **Schedule drawer**: `POST …/schedules/:id/test` and `POST …/schedules/test` (to me only), `GET …/schedules/next-run`, `POST …/schedules/reach`.
- [x] **Dashboard customise**: Home items take `size` (checked against each widget's `sizes`); the role behind a role default is named; BI cards take `visible`.
- [ ] **Deferred (run after every lane):** `test/bi-reports-boards.e2e-spec.ts`, the sweep fixture at the end of `test/tenancy.sweep-spec.ts`, the new steps of `reports:drill` and `analytics:drill` — written, not run. Follow-up: an attention count per BI dashboard tab (no board).
- [x] **Fix, 25 October (`fix/cash-forecast-opening-balance`):** the forecast's first point is explained, not changed — `dayOne` / `dayOneByScenario` on the liquidity forecast and `dayOne` on the BI run (past-due bills paid today, past-due receipts as far as customers pay, what is due today, the day's closing), listed beside Home's Cash today; `shortOn` / `lowestOn` never before today with weeks; top customers' cost of sales followed through the stock ledger groups (₦181.0M found where ₦19.6M was), with `costKnown` and `uncostedIssues`. E2E leg in `test/liquidity.e2e-spec.ts` deferred to the full round.
- [x] **Fix, 26 October (`fix/forecast-collection-rate-and-vat`):** a customer who has paid nothing yet is forecast at the organisation's rate (or the 80% default), with `rateSource` and `bySource`; purchase `taxRate` above 1 refused, the demo generator's "7.5" (750% VAT on dev) corrected to 0.075. E2E legs deferred.
- [x] **Demo re-seed with VAT, 26 October (`chore/demo-reseed-vat`):** the demo organisation adopts the NG tax preset and the engine decides every line (sales output VAT, purchases input VAT at 7.5%); `demo:eben:check` holds both to 7.5% of net; `demo:purge` scoped to the two demo organisations under RLS and re-provisions the organisation (was a cross-tenant catalogue wipe). Re-seed on dev pending the test round.
- [x] **Fix, 26 October (`fix/sales-tax-rate-fraction`):** customer invoice lines refuse a `taxRate` above 1, credit/debit note lines one above 100 (they are percentages), one shared rule; e2e that sent '21' and '7.5' corrected.
- [x] **API spec gaps, 26 October (`chore/api-spec-gaps`):** what web #61's contract check found: `search` declared and honoured on locations, channel items, loyalty members and discount choices (`keyset` on HR change requests); 142 optional `@Query` params marked optional; `@PaginationParams` declares the paging params on every paginated route; response schemas for 41 operations the typed web services read (analytics KPIs, insights, BI dashboards and settings, the BI reports, ap-invoices due and match, locations/mine, RFQ responses, invite and award, requisition submit); the buying documents' always-filled fields required and their `extrasJson`/`contextJson` keys typed; campaignId nullable, the requisition reject body, activity status required. No migration. Unit specs.
- [x] **Fix, 27 October (`feat/product-page-variants-documents`):** `PATCH /variants/:id` no longer fails on what the editor sends (a blank weight reached the numeric column as `''`; a blank barcode was stored and collided; null/blank now clears text, size and rules; name and SKU never blanked), a value first used joins the product's lists, a SKU or barcode another variant holds is a 409 in words; `GET /products/:id/overview` carries each variant's `baseUomId` (the product page's unit cards). Unit spec; e2e leg deferred.
- [x] **25 October (`feature/buy-documents-pdf-copy`):** Download PDF for requisitions, RFQs, goods receipts, returns, inspections, supplier bills and payments (seven new Studio kinds); Make a copy (server-side) for requisitions, RFQs, purchase orders and bills; Drive references for five buying documents; a receipt's billed/paid facts on its page; `GET /ap-payments?billId=`; the bill match's rules in force; quote lines against the last posted price and the quote's price-held-until. Migrations 1791400000000, 1791400000100 (indexes). PROCUREMENT.md. E2E written, not run.
- [x] **Fix, 25 October (`fix/page-errors-1025`):** `include` declared on the deal and activity list filters (every Customers → Activities / Deals / Pipelines read was a 400); requisition list rows carry `lineCount` (the screen's rows rendered half-empty); `GET /restaurant/lookups/price-categories` for the Prices screen's picker (404 since 17 October). Unit specs only; no migration.

### Business health — the dashboard's six numbers *(asked and built 16 October 2026; API and web)* ([BUSINESS_HEALTH.md](BUSINESS_HEALTH.md))

*The ask (the user, 16 October):* the dashboard must show six numbers, each with
one plain sentence, so an owner knows whether the business is healthy — gross
margin, net margin, the cost of winning a customer, customer lifetime value (with
LTV ÷ CAC and payback), burn rate and runway, and the cash conversion cycle —
under "How the business is doing", with a Period picker and a drawer that shows
how each is worked out.

- [x] **Monthly aggregates kept incrementally** from the ledger's and the
  invoices' events (`business-health` projection, five `projection.health_*`
  tables, migration `1782500000000`): O(entry) per event, safe under redelivery
  and voids, rebuilt in pages by `projections:rebuild -- business-health`.
- [x] **The numbers are registered KPIs** (reworked onto the KPI registry the same
  day, PRD Part B): finance `gross_burn`, `net_burn`, `unrestricted_cash`,
  `runway_days`, `dio`, `ccc` (with the existing `ar.days_to_be_paid` and
  `ap.payment_days`), CRM `new_customers`, `cac`, `ltv_historical`,
  `ltv_predicted`, `ltv_cac`, `cac_payback_months`; the existing margins gained the
  organisation's floor as a `target`. They read the metric facts in O(1) and are
  cached by the analytics service; a pushed summary tells open dashboards to read
  them again. No endpoint of its own.
- [x] **Settings** (organisation): the gross and net margin floors, the runway
  alert, the acquisition accounts (a new `expense-accounts` picker), the share of
  salaries counted as selling time, the lifetime horizon, when a customer has gone.
- [x] **The section** on `/dashboard` (Period picker, six cards, drawer).
- [ ] Deferred to the test phase: stubbed Cypress (cards, a push, drawer, axe),
  a live Cypress spec; the reconciliation checks (KPIs against the trial balance and statements).

### Phase 5 — The ledger is real *(planned 5 October; eight steps, ~18 weeks)* ← **all eight steps done, 5 October**

*The ask* (the first draft's Phase 5, unchanged in spirit): every document
that moves money or stock writes its journal entry, so the books are the
business. Phase T step 3 made the ledger work on its own (FINANCE.md):
entries, periods, reports, reversal. What is missing is everything that
feeds it. Today invoices, receipts, supplier invoices and payments, memos
and payroll all say "not in the ledger" (`posting_batch_id` null), and the
posting service (`gl-posting.service.ts`) still uses made-up accounts and a
made-up period.

Built in full: every row below, not a first cut.

**What is missing, found by reading the code**

- **No organisation has books to post into.** No base currency (the
  organisation has none; `finance.currency` rows are added by hand), no
  chart of accounts (nothing seeds one), no fiscal year until someone makes
  one.
- **Nothing says which account.** There is no mapping from "a sale of this
  item" to a revenue account, from a tax code to its payable account (the
  column exists on `tax_code`, unused), from a bank account to cash (it
  exists on `bank_account`, unused), or to receivables, payables, stock,
  cost of sales, goods received not invoiced, withholding tax, discounts,
  rounding or exchange differences.
- **Stock has no cost.** Movements carry an optional `unit_cost`; nothing
  keeps an average (`inventories.average_cost` is never written) and sales
  issues carry none. Cost of sales cannot be posted until stock is valued.
- **Journal lines have no base amount.** A line holds its debit, credit,
  currency and rate; reports add debits across currencies as though they
  were one.
- **Balances are summed from every line on every report** — correct, and
  at millions of lines a full scan per click (§2's second question).

**Steps**

1. **The organisation's books** *(~2 weeks)*.
   - Finance settings (Phase 3's document settings: one table, a zod
     schema): base currency, costing method, posting accounts, rounding,
     fiscal year start. A new organisation gets its currency, a chart of
     accounts from a country template (Nigeria first: IFRS for SMEs
     layout, codes the organisation can rename or replace), the posting
     accounts pointed at it, and the current fiscal year — seeded like
     numbering and units are today. Existing organisations get the same by
     a backfill that adds and never overwrites.
   - **Account determination**: posting accounts by role (receivables,
     revenue, output VAT, customer deposits, payables, input VAT, GRNI,
     stock, cost of sales, stock adjustment, withholding tax, discounts
     given and taken, exchange gain and loss, rounding, salaries and
     deductions, retained earnings), each overridable by category,
     inventory type, location, tax code, bank account and customer or
     supplier group. The organisation chooses; nothing is hard-coded.
   - **The posting port** (`adapters/general-ledger`): `post(source, date,
     lines by role or account, dimensions)` → a posted journal entry in
     the caller's transaction (`activeTenantManager()`), balanced, in an
     open period (409 if closed), idempotent on `(organization, source
     type, source id, event)`, with a posting batch, the document's
     `posting_batch_id` set, and a `JournalEntry-posted` outbox event.
     `reverse(batch)` makes the reversing entry. The stub service goes in
     step 4: supplier payments still inject it.
   - **Base amounts**: journal lines gain `debit_base` and `credit_base`
     (amount × rate to the base currency, kept at posting); reports read
     them. Existing lines are backfilled at their own rate.
   - **As built** (FINANCE.md, *The books* and *Posting*): `finance/books`
     is a module of its own, so creating an organisation can open its books
     without the rest of finance. Posting accounts can be overridden per
     bank account, tax code, salary component, category, inventory type or
     location; customer and supplier groups wait until those groups exist.
     The posting service is `LedgerPostingService`; journal entries — by
     hand or posted — are numbered by the numbering module
     (`journal-entry`), so concurrent postings cannot take one number. Two
     requests posting one document at once write one entry (the posting
     batch's key is unique per organisation; it was unique per journal).
     Found on the way: seeding numbering rules twice duplicated every
     organisation-wide rule (NULL locations never collide in the unique
     index); fixed. Proved by `books.spec`, `finance-books.e2e-spec`,
     `organizations.e2e-spec` (a new organisation's books are open) and
     `ledger:drill`.
2. **Stock valuation** *(~2 weeks)*.
   - Costing method per organisation: moving weighted average (default)
     or FIFO (cost layers). Every movement carries its cost: receipts at
     the order's price (plus landed cost), issues and transfers out at the
     current cost, counts and adjustments at it.
   - `projection.inventory_valuation` per variant and location, kept from
     movements; `inventories.average_cost` written from it.
   - Landed costs — freight, duty, clearing — spread over a receipt's
     lines by value, quantity or weight, from the supplier's invoice or a
     separate charge.
   - Entries: receipt Dr stock Cr GRNI; issue Dr cost of sales Cr stock;
     count and adjustment Dr/Cr stock against stock adjustment; transfer
     between locations with their own stock accounts; return to supplier;
     revaluation.
   - The stock valuation report, which equals the stock account.
   - **As built** (STOCK.md, *What stock is worth* and *Stock in the
     ledger*): costs sit beside the append-only movements
     (`item.stock_movement_costs`), so history could be costed afterwards
     (`npm run stock:value`) without editing the ledger; positions in money
     are `item.stock_valuations`, locked with each movement. Each
     document's movements post one entry, by role, and a transfer between
     places with one stock account posts nothing. Sales issues already post
     cost of sales here, so step 3 adds the revenue side. **What the books
     refuse waits in a backlog** (`finance.posting_backlog`) instead of
     undoing the goods' movement — shown, counted and retried; the
     backlog is how every later step posts. Landed costs post Cr goods
     received not invoiced until the carrier's invoice (step 4) clears it.
     `inventories.average_cost` is no longer the answer; the product
     overview reads the valuation. History before the books is costed but
     not posted: step 8 posts it.
3. **Sales** *(~2 weeks)*.
   - Invoice: Dr receivables, Cr revenue per line (net of discount), Cr
     output VAT per tax code; cost of sales for what it or its order
     issued. Receipt: Dr bank or cash, Cr receivables for what is
     allocated, Cr customer deposits for the rest; allocating a deposit
     later moves it. Void and cancel reverse. AR memos (credit and debit
     notes) post. Bad-debt write-off.
   - Foreign currency: receipts at today's rate against invoices at
     theirs post the exchange difference.
   - Receivables control equals the sum of open invoices less deposits
     (a check the drill proves and the close step reports).
   - **As built** (SALES.md, *In the ledger*): `SalesLedgerService` posts
     invoices, receipts, credit applications (grouped by an
     `application_id` on their allocations), voids, and a new bad-debt
     write-off (`POST /ar-invoices/:id/write-off`). Receipts clear each
     invoice at the rate its own entry used, the difference to exchange
     gain or loss — the posting engine gained per-line rates for it. A
     header discount the lines do not carry goes to discounts given. Cost
     of sales was already stock's (step 2). Customer credit notes are
     adjustment memos and post with step 5. A receipt in one currency
     settling an invoice in another is not converted (SALES.md limits).
     Found by the drill, not the endpoint tests (whose outbox is fake):
     recording the batch through the entity raised an `ArInvoice-updated`
     without an id, which the real outbox refuses — the update now skips
     listeners. The backlog caught it and kept the invoice standing.
4. **Procurement** *(~2 weeks)*.
   - Supplier invoice reaches *posted* (PROCUREMENT.md's known limit):
     Dr GRNI for received lines at the receipt's cost, Dr expense or
     asset for lines not stocked, Dr input VAT, Cr payables; the
     difference between the receipt's and the invoice's price to price
     variance (or into stock while it is still held, as the organisation
     chooses). Three-way matching — order, receipt, invoice — within
     tolerances the organisation sets.
   - Payment: Dr payables, Cr bank, Cr discount taken, Cr withholding tax
     payable, write-offs. AP memos. Void reverses.
   - Payables control equals open supplier invoices; GRNI equals received
     but not invoiced.
   - **As built** (PROCUREMENT.md, *In the ledger*): supplier invoices
     reach `posted` through `POST /ap-invoices/:id/post` — three-way
     matched, then the `posting` approval. A supplier invoice line has an
     item but no receipt line, so matching is by supplier, item and place
     against what was received and not yet billed
     (`procurement.ap_invoice_matches`); settings
     (`/document-settings/ap-invoice`) say how strictly, and whether a
     price difference goes to variance or into stock (as a landed cost on
     the receipts). Payments now clear discount, withholding and
     write-off with the cash — they cleared the cash alone — settle only
     posted invoices, and can be voided once posted. Cash paid beyond the
     invoices is a supplier advance (a new posting role and account,
     `1510`; `finance:open-books -- --all` adds it to existing books).
     Posters skip a document voided while its entry waited. The stub
     `GLPostingService` is removed.
5. **Payroll, memos and journals** *(~1.5 weeks)*.
   - A paid payroll run posts: Dr salary and each allowance (by
     department as a dimension), Cr PAYE, pension and each deduction
     payable, Cr net pay (bank, or salaries payable until paid). Payslips
     get numbers and PDFs (HR.md's limit).
   - Adjustment memos post through the port.
   - Journal entries are approved through the approval engine (FINANCE.md's
     limit): no one approves their own; reversals and recurring entries
     too.
   - **As built** (FINANCE.md, *Memos and journals in the ledger*; HR.md):
     memos post and apply to the invoices they link (links were never
     saved — fixed); reversals carry the same links. A paid run posts by
     component; payslips are numbered and print. Journal entries, their
     reversals and recurring entries go through the approval engine;
     nobody approves their own by hand. Payroll found three bugs on the
     way: a structure kept only one component, pension was added to pay,
     and run components were never saved. Departments are not ledger
     dimensions, so payroll is not split by them.
6. **Balances, close and reports** *(~2.5 weeks)*.
   - `projection.gl_balances` per organisation, account, period and
     dimension, kept from `JournalEntry-posted` and `-voided` events and
     rebuildable (PROJECTIONS.md); reports read it, not every line.
   - Period close: a checklist — every subledger agrees with its control
     account (receivables, payables, stock, GRNI, bank), no drafts
     waiting, exchange revaluation of open foreign balances posted (and
     reversed on the first day of the next period).
   - Year end: income and expense closed to retained earnings; 13-period
     years fixed; the trial balance in one balance column.
   - Reports: trial balance, profit and loss, balance sheet, cash flow
     (indirect), GL detail, aged receivables and payables from the ledger,
     VAT return (output less input, FIRS layout), withholding tax schedule,
     comparatives and budget columns; PDF and spreadsheet export.
   - Opening balances: import a trial balance and open invoices from a
     previous system, dated the day before the first period.
   - **As built** (FINANCE.md, *Closing the books*, *Reports*): no
     `projection.gl_balances`. A closed period's sums cannot change while it
     stays closed, so they are kept when it closes
     (`finance.gl_period_balances`) and thrown away when it reopens; reports
     read closed periods from there and only open periods from their lines.
     Exact by construction, nothing to rebuild, and a report reads a few
     open months of lines however long the books run. Balances are kept
     per account, not per dimension: dimension reports still read lines.
     The checklist asks nine questions (receivables, payables, GRNI, stock
     and bank among them) and an override must say why. Revaluation is
     reversed the next day; the year end posts its closing entry into the
     year's last period (the adjustment period when it has one) and a year
     reopens by reversing it. The trial balance keeps its turnover columns
     beside the debit and credit balance columns. The VAT return is laid
     out as sales by rate, output tax, purchases and input tax beside the
     ledger, not yet the FIRS form itself. Opening invoices are not a new
     kind of document: receivables, payables and stock are refused by the
     opening-balance import and come in as ordinary invoices and an opening
     stock count. Found: a billed-ahead supplier invoice let a second
     invoice clear the same goods (fixed); the balance sheet did not
     balance before year end; years ignored the books' start month.
7. **Finance screens** *(~4 weeks)*: chart of accounts; journal entries
   (write, submit, approve, post, reverse, recurring); finance settings and
   posting accounts; fiscal calendar and close; reports; banks, statement
   import and reconciliation; budgets; tax codes; currencies and rates;
   cost centres and dimensions; memos. NgRx, `ui-list-state`, live
   updates, every action behind its permission.
   - **As built** (FINANCE.md, *Screens*; commerce-web CHANGELOG): every
     screen listed, each with its store, specs, stubbed Cypress and a live
     read of the test organisation. The API gained what the screens
     needed: a paged, filtered journal list (it returned every entry and
     line), account moves, bank statement reads and match candidates, memo
     reads with lines and links. Found: memos could be deleted — posted ones
     included — with only the read permission; an account's parent could be
     another organisation's; budgets lost their remainder when spread; one
     ledger line could reconcile two statement lines. Live updates on these
     screens wait for Phase 4.7's entity notices for finance.
8. **What was posted before the ledger** *(~1 week)*: a per-organisation
   job that posts, in date order, every document marked posted with no
   batch (invoices, receipts, supplier invoices and payments, memos, paid
   payroll runs) through the same rules, into their own periods (opened
   for the purpose and closed again), never changing the documents
   themselves; its report says what it posted and what it could not.
   - **As built** (FINANCE.md, *Before the books*): `POST
     /finance/books/history` queues a run (`ledger-history`), or
     `npm run finance:post-history`; voided documents are left out, credit
     applied and bad debts written off are their own events, stock
     movements post as stock does today. Closed periods are reopened and
     closed again with their balances kept afresh; locked ones are not
     touched. Proved by `post-history.e2e-spec` on an organisation of its
     own; `history:drill` only plans on the shared test organisation.

**Rules the tests prove**: every entry balances in the document's currency
and in the base; nothing posts into a closed period; a document posts
once (a retry or a race finds the batch and does nothing); a void
reverses exactly what posting wrote; control accounts equal their
subledgers; stock value equals the stock account; another organisation's
accounts, periods and documents are never reached (404); the trial
balance is zero after every drill.

**Done when** (Phase T), per step: unit specs for each posting rule
(lines by role, amounts to the kobo); whole-app endpoint tests with two
organisations; the tenancy sweep; `ledger:drill` on the test organisation
— buy, receive, invoice, pay; sell, issue, invoice, receive; count; pay a
payroll; close the month — ending in a zero trial balance and agreeing
subledgers; web specs and Cypress stubbed and live for step 7;
FINANCE.md, SALES.md, PROCUREMENT.md, STOCK.md and HR.md updated.

**Waiting on the user, not in these steps**: intercompany (organisation
groups); payments by card and transfer (Phase 4.10, once Phase 5.5
has given every module its analytics); accounting exports to QuickBooks, Xero and Sage (Phase 4.6
connectors, which read this phase's entries).

### Phase 5.5 — Dashboards, reports and analysis *(written in full 5 October from the user's document; eight steps, ~32 weeks)* ← **all eight steps built, 6 October**

*The ask (5 October):* upgrade the dashboard to the user's *Dashboard,
Reports & Analysis Model* (`dashboard-reports-analysis-model.md`, the
user's, in `documentation/`). Every module gets more than its lists:
dashboards at three levels, KPIs, reports, analysis, insights, forecasts
and alerts, all on one shared platform — *standardise the analytics
infrastructure, not the business intelligence* (its §2). The document is
the source; this section fits it to the code we have and orders it. **It
is built in full: there is no MVP.** Every section of the document, and
every module specification in its §12 whose module exists, is built; the
steps are the order of dependencies, not a cut.

**Why here.** §3l held the dashboard back because there was no history:
"a trend line would be an invention". Phases 3–5 put the history in —
sales, purchases, stock movements, payroll, and since Phase 5 step 8 a
ledger that carries all of it, including what happened before the books.
And every module built from now on must ship its own analytics (the
document's §15 checklist), so the platform comes before the next module:
Phase 4.10 (payments), 4.11–4.15 and 10 each follow it, carrying their
§12 specification as a step of their own.

**What exists, found by reading the code**

- **One dashboard** (`src/modules/dashboard`): stock, items and users,
  server-side aggregates over `projection.inventory_on_hand`, scoped to the
  locations the caller may see (`dashboard-scope.ts`), cached, refreshed
  from Kafka (`dashboard-refresher.service.ts`) and pushed on `/dashboard`.
  Its shape is right; it is one module's operational view, and it is the
  only one.
- **Forty metrics services** (`*-metrics.service.ts`), each with
  `totalCount()` and, in a handful, one or two counts more (by status, by
  country, expiring soon). Their `set-*-metrics` use cases carry
  `@LiveMetric`, so a change reaches open screens through the Coalescer and
  `/live` (§3n). No service knows a period, a previous value, a dimension
  or a definition.
- **Reports in finance only**: trial balance, profit and loss, balance
  sheet, cash flow, ageing and the subledger reports, exported as PDF,
  XLSX and CSV (`report-export.ts`), and balances kept per closed period
  (`finance.gl_period_balances`, Phase 5 step 6). No other module has a
  report, a schedule or an export besides contacts.
- **Thresholds are designed, not built**: Phase 4.9 step 5 (`alert_rules`,
  `alert_states`, evaluated where the number changes, fire once on
  crossing). The notification engine that would deliver them is built
  (in-app and email).
- **No snapshot of anything but ledger balances.** A trend today would
  scan the transactional tables on every view.

**Where we differ from the document, and why**

- **Events come from the outbox, not entity subscribers.** The document's
  flow is subscriber → domain event → queue → refresh (its §8.4). Here the
  write puts its event in `tenant.outbox` in the same transaction and
  Kafka carries it (OUTBOX.md, §3n): the same contract, and an event is
  never lost to a crash between the write and the refresh. Metric refresh
  is one more consumer group.
- **One snapshot table, not one per module.** `analytics.metric_snapshots`
  holds every module's keys (`supplier.total_count.daily`, its §8.7);
  a module table only where a snapshot needs columns a key cannot carry.
- **Routes keep our prefix and organisation from the session**:
  `/api/v1/{module}/dashboard` and the rest of its §9. No route takes an
  organisation id (its §10.2, and TENANCY.md already).
- **Alerts are Phase 4.9's thresholds**, built once: the rules name
  metric keys from the registry; delivery is the notification engine.

**Steps**

1. **The platform** *(~3 weeks)*.
   - **Metric definition registry** (its §8.9–8.10):
     `definitions/<module>.metrics.ts` declares each KPI — key, name,
     description, owning module, formula, source, value type,
     aggregation, unit, currency, dimensions, periods, refresh frequency,
     permissions, history, version — registered at start-up and listed at
     `GET /analytics/metrics`. A spec fails the build when two modules
     define one key, or when a financial KPI is computed anywhere but its
     owner.
   - **The KPI payload** (its §4.3): value, previous value, change,
     change %, trend, period — one DTO, one calculation of growth (its
     §6.3 formula; a previous value of zero says "new", not infinity).
   - **Periods and filters**: the date presets and comparisons (its §4.6,
     §6.4) computed in the location's time zone (location settings carry
     one today), *financial period* from Phase 5's fiscal calendar; the shared filters (its §4.5) as one
     typed filter, the location filter limited by `user_location_roles` as
     the dashboard is today.
   - **Permissions** (its §10.1): `{module}.dashboard.view`,
     `.report.view`, `.report.export`, `.report.schedule`,
     `.analytics.view`, `.alerts.manage`, seeded for every module, plus
     sensitive slugs for payroll and HR figures. Aggregates obey the same
     scope as the records under them: a user who cannot see a location's
     invoices does not get them summed.
   - **Cache and refresh** (its §8.4–8.6): `analytics:{org}:{module}:…`
     keys, invalidated by the metric-refresh consumer from the outbox
     events, pushed on `/live` metric topics through the Coalescer.
   - **Performance targets as tests** (its §8.11): cached KPI under
     200 ms, a dashboard under 500 ms, an analytical query under 2 s,
     measured by the drill on the test organisation's volumes.
   - **As built** (ANALYTICS.md): `src/modules/analytics` — the registry
     checked at start-up (one key, one name, owner, permissions, filters),
     `GET /analytics/kpis` and `GET /analytics/kpis/:key` with every preset,
     fiscal periods and both comparisons, a running period compared with
     the same stretch of the one before, the time zone of the locations in
     scope, filters refused when a KPI does not keep them, scope where every
     permission is held. The first KPIs: `supplier.total_count`,
     `supplier.new_count`, `ar.invoiced`. Permissions for 17 modules by an
     additive seed (v4) — payroll and HR to owners and admins only. Live
     push is step 6's: a dashboard is a `/live` summary. Found by the drill:
     41 aggregates were deleted with `repository.delete`, which raises no
     event, so every count stayed high after a delete; they now go through
     `removeRecorded`, and `event-coverage.spec` refuses the old way.
2. **Snapshots** *(~2 weeks)*. `analytics.metric_snapshots`
   (organization_id, metric key, period type, period start, dimension,
   dimension value, value, previous value, variance, created at),
   distributed on `organization_id`; written at each period's end by a
   BullMQ job per organisation, and on period close for finance (reading
   `gl_period_balances`, never replacing it). Backfilled from the
   documents' own dates, so trends start at the organisation's first
   transaction. Closed periods read snapshots; the open one reads live.
   - **As built** (ANALYTICS.md, *History and trends*): days for 400 days
     and months from each KPI's first record, for the organisation and each
     location, in its time zone; weeks, quarters and years made from them.
     An hourly sweep keeps every organisation; lifecycle events now carry
     the document's date, so a backdated invoice marks its module dirty from
     that day and it is kept again within a minute. `GET
     /analytics/kpis/:key/trend` says per point whether it was kept,
     computed now, or is coming. Ledger KPIs are dirtied by their entries'
     posting dates like any document; reading `gl_period_balances` comes
     with step 7's finance KPIs.
3. **The report engine** *(~3 weeks)*.
   - **Report definitions** (`definitions/<module>.reports.ts`, its §5):
     columns, filters, grouping, aggregations, calculated columns, totals
     and subtotals, sorting, paging and the drill-down target of each row;
     the eight report types (its §5.2). One execution path, paged.
   - **Saved views** per user.
   - **Exports** (its §5.4): CSV, XLSX, PDF, and JSON where it fits, by
     widening finance's `report-export.ts`, each with the organisation,
     title, generated date, period, filters, requester, currency, totals,
     page numbers and report version.
   - **Large reports as jobs** (its §5.7): BullMQ, the file kept in
     `storage/files` (RustFS), the requester told through the
     notification engine, then downloaded.
   - **Report audit** (its §5.8): `analytics.report_runs`.
   - **Schedules and subscriptions** (its §5.5–5.6):
     `analytics.report_schedules` — report, filters, frequency, format,
     channel, recipients (users or roles). **Each recipient's copy runs
     with that recipient's permissions and scope**, not the scheduler's:
     a schedule must not become a way to read what one may not.
   - **As built** (ANALYTICS.md, *Reports*; 6 October): one builder
     (`report-query.ts`) runs every report — every value a parameter,
     every identifier the definition's, the organisation first, then the
     person's locations, money never added across currencies (a total over
     several is null and says how many). Definitions are checked at start-up,
     including that every join names the organisation. Eight reports to
     start, the modules on screen: supplier register, purchase register,
     orders still to come, goods received, bills due, spend, invoice
     register, overdue invoices; each module adds its own as its screens
     come. Calculated columns are SQL over the row (days late, days
     overdue); subtotals are the grouped form. Exports are CSV, XLSX and PDF
     (JSON is the run itself), headed with who, when, the period, the
     filters in words, the locations and the version; small ones at once,
     past 2,000 rows by the `analytics-reports` queue into the object
     store, the requester told by the `report-ready` rule through Kafka;
     past 50,000 refused. Found by the endpoint test: a resolved period's
     end is exclusive, so "today" also took tomorrow until the report
     engine made it inclusive.
4. **Analysis, insights and forecasts** *(~3 weeks)*.
   - `GET /{module}/analysis?dimension=…` over the shared dimensions (its
     §6.2) and the module's own: trend, growth, comparison (previous
     period, same period last year, budget from Phase 5's budgets,
     forecast), distribution and concentration (top N's share),
     performance, exception and risk (its §6.3).
   - **Data quality** (its §6.7): missing values, duplicates, broken
     links, mixed currencies, stale and impossible values, as exceptions
     with counts that drill to the records; profile completeness by its
     formula.
   - **Insights** (its §6.6): rules per module that state a condition in
     words ("receivables grew 22% while revenue grew 8%"), each classed
     (information, warning, risk, opportunity, anomaly, recommendation)
     and carrying the metric keys and values it came from.
   - **Forecasts** (its §6.5) only where history is long enough, the
     method and the history it used shown beside the number: moving
     average and trend first, seasonal methods once a module has two
     years. Anomalies are deviations from a metric's own history.
   - **As built** (ANALYTICS.md, *Analysis, data quality, insights and forecasts*; 6 October):
     analyses are definitions like reports, run by one builder on the same
     scoped conditions (organisation, locations, period, declared
     filters): segments with share, the compared period and growth, the
     rest summed, and concentration (top 1/5/10, HHI). Money not already
     in the base currency is analysed one currency at a time. The routes
     are `/analytics/analysis` (not `/{module}/analysis`): one engine, the
     module in the key. Data quality checks are report flag filters, so a
     count and the rows it opens are one query; supplier completeness by
     the document's formula. Seven insight rules, each fact read as the
     person asking. Forecasts from kept KPI history (moving average,
     linear trend, seasonal), with range and method; anomalies by a robust
     score. Budget comparisons wait for step 7's finance figures.
5. **Alerts** *(~2 weeks)* — Phase 4.9 step 5, built here. Rules from
   `definitions/<module>.alerts.ts` and the organisation's own
   (`alert_rules`): a metric key, a comparison, a threshold the
   organisation sets, a scope, a severity. Evaluated where the number
   changes; time rules by an indexed sweep; fire once on crossing,
   re-arm on return (`alert_states`). Each alert keeps rule, metric,
   value, threshold, severity, triggered at, acknowledged by, resolved at
   (its §7). Delivered in-app and by email now, SMS and push as Phase 4.9
   step 6 adds them.
   - **As built** (ANALYTICS.md, *Alerts*; 6 October): rules on a KPI
     or a per-thing condition (invoice or bill overdue, stock at its
     reorder point); evaluated 30 seconds after a change to the module's
     figures (one debounced job per organisation and module) and by a
     fifteen-minute sweep; one evaluation of a rule at a time (a row
     lock). Recipients are the rule's people and roles, filtered to those
     who may read what it is about — kept on the alert and told through a
     new `named` recipient type of the notification engine. SMS and push
     come with Phase 4.9 step 6.
6. **The dashboard layer** *(~3 weeks)*.
   - **Widgets** (its §4.3), shared in the web app: KPI card, trend,
     distribution, ranking, recent activity, exception panel, status
     panel — each with its loading, empty and failure states
     (`ui-list-state`: a failure is never shown as "nothing here").
   - **The standard layout** (its §4.4) and **three levels** per module
     (its §4.2): executive, management, operational.
   - **Filters and presets** in one bar; **drill-down** from every KPI and
     exception to its list with the filter applied (its §4.7) — lists
     that cannot take the filter gain it here (§3d).
   - **Configuration** (its §4.8): widgets, position, size, filters,
     refresh and visibility per user (`analytics.dashboard_layouts`), and
     a layout an administrator sets for a role.
   - NgRx per dashboard, live through `/live`.
   - **As built** (ANALYTICS.md, *Dashboards*; 6 October): suppliers,
     procurement, payables and receivables, each with widgets and the
     standard layout of three levels; layouts per person and per role
     (`analytics.dashboard_layouts`). Widgets read their own endpoints, so
     a layout never widens what may be seen; each says which filters its
     source takes. Live through `/live` entity notices where the server
     sends them, and a five-minute refresh otherwise — the per-module
     metric pushes come with step 7. The home dashboard is unchanged until
     step 8 makes it the organisation's operational view.
7. **Every module that exists, to its §12 specification** *(~14 weeks)*,
   in the order they feed one another: suppliers (12.1, the reference —
   its *current vs target* table becomes all *implemented*), procurement
   (12.2), inventory (12.3, from the dashboard we have), catalogue (12.4),
   sales (12.5), receivables (12.6), payables (12.7), ledger and finance
   (12.8, on Phase 5's reports), tax (12.9), budgets (12.10), CRM (12.11),
   HR (12.12) and payroll (12.13) behind their sensitive permissions,
   approvals (12.20), messaging (12.21, from the notification delivery
   log), and logistics (12.14) as far as waybills and deliveries exist.
   Each to the document's §15 checklist: KPIs registered, widgets,
   filters, drill-downs, reports of every applicable type, dimensions,
   analysis, insights, forecasts, alerts, exports, schedules, snapshot
   keys, cross-module links, permissions and endpoints.
   - **As built** (ANALYTICS.md, *A KPI*, *Reports*, *Alerts*,
     *Dashboards*; 6 October): all sixteen modules — 114 KPIs, 30 reports,
     29 quality checks, 15 alert conditions, a dashboard each at three
     levels. Finance reads the ledger's own period sums and statement
     layout, so a KPI and its statement agree; tax from the documents that
     carry it and the ledger's tax lines; budgets by fiscal period like
     budget-versus-actual; HR and payroll stay sensitive. Exports,
     schedules, saved views and snapshots come with the shared report and
     history engines; analyses and insights beyond step 4's four wait for
     their figures to be asked for. **Not built, because the product does
     not record it yet**: tax filings (status, deadlines), delivery cost,
     commitments by account (committed spend), deals' closed dates (won
     and lost read from the last change), employer contributions apart
     from pension. Staff, attendance, leave, contracts, approvals, budgets
     and notification deliveries send no entity events, so their figures
     are read fresh rather than pushed.
8. **The organisation dashboard** *(~2 weeks)* (its §13): the executive
   KPIs across modules; the cross-module analyses — revenue against
   procurement, inventory, receivables and payroll; budget against actual
   everywhere; top-down and bottom-up navigation (its §13.3). Today's
   home dashboard becomes this one's operational view.
   - **As built** (ANALYTICS.md, *The organisation*; 6 October): the
     `organization` dashboard over every module's figures, each opening
     its module's dashboard (a new `dashboard` drill); five cross-module
     KPIs from the modules' own definitions, needing every permission
     their parts need; six insight rules for §13.2's questions; every
     module's exceptions in its operational level. **Decided overnight**:
     the home page is not replaced — it links to the organisation's
     dashboard for those who may view it — because it is the live stock
     view people use today; say if it should become the operational level
     instead.

**Modules that arrive later carry their own §12**, as a step of the phase
that builds them: storefront and point of sale (4.11, 4.12) → 12.16;
payments (4.10) → settlements and collections; Drive (4.14) → 12.19;
asset management (10) → 12.17 and 12.18, and fleet and delivery (12.15,
12.14 in full) with its step 6; manufacturing (11) → 12.22 and its own
dashboards and KPIs.

**Rules the tests prove**: one definition per KPI, and every number on a
screen traceable to its definition and source records (its §10.3); no
query aggregates across organisations, and none returns what the caller's
scope excludes; a scheduled report holds only what its recipient may see;
growth from zero is "new"; a snapshot's value equals the live value for
its period; an alert fires once per crossing; exports carry their header
and totals; performance targets met at the test organisation's volume.

**Done when** (Phase T), per step: unit specs for each metric, report and
rule; whole-app endpoint tests with two organisations; the tenancy sweep;
`analytics:drill` on the test organisation — every registered KPI
computed, snapshotted and compared with a direct count, a report run,
exported and scheduled, an alert crossed and re-armed; web specs and
Cypress stubbed and live with axe for every dashboard; an ANALYTICS.md and
each module's document updated.

**Waiting on the user, not in these steps**: AI automation and insights
(12.23) has no module and no phase yet. *(5 October: fleet and delivery
belong to asset management, Phase 10; projects to manufacturing, Phase
11.)*

### Phase 6 — Buy something: procurement on screen *(written 5 October; five steps, ~6 weeks)* ← **all five steps built, 6 October**

*The ask (5 October):* "I don't see procurement in the roadmap." It was
not there. The API is built and tested end to end (Phase T step 3) and
posts to the ledger (Phase 5 step 4), but every procurement, supplier and
payables screen in the web app is a placeholder, and no phase owned them.
This is that phase: buying, done on screen, as selling was in Phase 4.
**Built in full: there is no MVP.**

**Why now.** Half of commerce is buying; an organisation cannot order
stock, receive it or pay for it except through the API. And Phase 5.5's
dashboards drill down from every KPI to its list (its step 6): procurement
needs lists to drill into. Phase 5.5 resumes at step 3 when this is done.

**What exists, found by reading the code**

- **API** (PROCUREMENT.md): requisitions, requests for quotes, purchase
  orders, goods receipts, quality inspections, returns to supplier,
  supplier invoices with three-way matching, payments with discount and
  withholding, voids; the approval engine on each; numbering; document
  settings (standalone receipts and invoices); supplier search (hybrid,
  full text, trigram); everything in the ledger.
- **Web**: placeholders at `/procurement/*` (requisitions, RFQs, orders,
  goods receipts, inspections, returns), `/suppliers`, `/payables` (bills,
  payments). Supplier credit notes are memos, already on the finance
  screens (Phase 5 step 7).
- **Gaps in the API** (PROCUREMENT.md, *Known limits*): a request for
  quotes has no location, so submitting one under a policy fails; returns
  and inspections have no endpoint tests; an invoice line cannot name the
  receipt line it bills (matching takes by supplier, item and place);
  invoice quantities are in the item's base unit only; a supplier is
  deleted outright, so one with history cannot be retired.

**Steps** — each screen as the sales screens are: NgRx feature store,
`ui-list-state` on every list (a failure is never "nothing here"), filters
and bulk actions server-side (§3d), live through `/live` entity notices
(Phase 4.7), every action behind its permission, every document creatable
on its own and conversion only pre-filling (STANDALONE.md).

1. **Suppliers** *(~1 week)*. The list with search and filters (country,
   tag, active); create and edit; the supplier page — contacts, bank
   details, terms, tags, and their documents (orders, receipts, invoices,
   payments, returns), balance and statement (Phase 5's subledger
   reports). Suppliers with history are **retired, never deleted**
   (CATALOGUE.md's rule), and a retired one is offered on no new document.
2. **Requisitions and requests for quotes** *(~1 week)*. A requisition —
   requester, location, needed by, lines in any unit (UNIT_OF_MEASURE.md)
   — submitted, approved, converted to a request for quotes or an order.
   A request for quotes gains a location (the API gap); suppliers invited,
   their quotes entered, compared line by line, one awarded and turned
   into an order.
3. **Purchase orders** *(~1 week)*. Standalone or from a requisition or
   an award, pre-filled; approval; sent to the supplier as a PDF by email
   or a shared link (Phase 4.5's sharing, extended to orders); received in
   part or whole, closed, cancelled; what is still to come shown per line.
4. **Receiving** *(~1 week)*. Goods receipts against an order or alone
   (where the setting allows), into a location, in any unit; quality
   inspections that accept or reject quantities; returns to supplier from
   a receipt or an inspection. The stock each one moves is shown. Endpoint
   tests for returns and inspections (the gap).
5. **Payables** *(~2 weeks)*. Supplier invoices — standalone or from
   receipts — with the three-way match on screen (ordered, received,
   billed, and the variance), billed-ahead lines, posting; an invoice line
   may name the receipt line it bills (the API gap; matching by supplier,
   item and place stays the fallback). Payments, one invoice or many, with
   discount and withholding; voids. What is due, by supplier and by date
   (Phase 5's aged payables).

**Rules the tests prove**: nothing is received beyond what was ordered
unless the setting allows it; nothing is billed twice; a payment settles
only posted invoices; a retired supplier is offered nowhere new; another
organisation's suppliers and documents are never listed or reached.

**Done when** (Phase T), per step: API specs and endpoint tests for what
changed; the tenancy sweep; `procurement:drill` buying from requisition
to payment through the screens' routes; web specs; Cypress stubbed for
every state and live as the least-privileged role that may buy
(pickers read member endpoints, never admin lists); PROCUREMENT.md and the web CHANGELOG.

**As built (6 October, overnight).** All five steps, on
`feat/procurement-screens` in both repositories. Decisions taken without
asking, to revisit:

- **Sharing an order** is made, emailed and revoked with
  `trade.purchase-orders.update`, not `.approve` as for quotations: an
  order is approved before it can be shared at all. Sharing became a web
  feature of its own (`@shared/sharing`) rather than part of the sales
  store, so procurement could use it.
- **Units** reached goods receipt lines only (UNIT_OF_MEASURE.md §12);
  requisition, order, return and invoice lines stay in base units, and
  the screens convert. Inspections and returns count in base units.
- **An inspection moves no stock**; rejected goods leave by a return or a
  stock adjustment. Quarantine has no place of its own yet.
- **Matching priced by the pool's average cost**, also for a line that
  names its receipt line (which limits how much, not what it cost).
- A **test buyer** joined the test organisation (`test:org`) for the live
  specs.

Found on the way and fixed: reading a goods receipt, a supplier's invoice
or a payment by id returned no lines; a receipt's status could be set by
an edit (approving it with no approval and no stock); inspections saved
no receipt line and checked nothing; returns took back more than came and
trusted the request's subtotals; four lists took their filters as
properties the entities lack; a quote could be entered in any
organisation. Proven by `procurement:drill` (44 checks, requisition to
payment on the dev cluster), five new endpoint test files, the sharing
drill's order section, 36 stubbed and 3 live Cypress tests.

### Phase 7 — Approvals, finished *(written 5 October; ~2 weeks)* ← **built, 6 October**

What APPROVALS.md and STATUS still list as open, with the screen that is
missing. Decisions already move their documents (4 October).

1. **Withdrawing moves the document back** to draft, rather than leaving
   it waiting for a decision that will not come.
2. **Role and group assignees** reach the people who hold the role or are
   in the group, at the document's location.
3. **The SLA worker** runs in a tenant transaction.
4. **The policies screen**: make and change approval policies — document
   type, conditions (amount, location, department, category), steps,
   assignees, all-of or any-of, SLAs and escalation — with a preview of
   who would be asked for a given document.

Done when as Phase T; APPROVALS.md.

**As built** (APPROVALS.md; 6 October): all four steps, on
feat/approvals-finished.
1. A withdrawn request skips its open steps and calls each document's new
   `withdraw` (`IApprovable`), in the same transaction: the fourteen
   approvable documents go back to where they were before that process
   was submitted, recorded as withdrawn.
2. The inbox, deciding and notifications match role assignees (by id or
   name, where the document is) and **group** assignees; groups are new
   (`tenant.user_groups`, `user_group_members`, migration 1780307200000,
   `/access/groups`, `admin.access.groups.*`, seed v5). A policy naming a
   person, role or group the organisation does not have is refused.
3. The SLA worker runs in the tenant's transaction; deadlines start with
   their step; escalations ask their target on the step; post-breach
   reminders repeat by a job scheduler. Found on the way: the repeat was
   given `*/<milliseconds>` as a cron pattern, and scheduling read the
   request's relations, never loaded.
4. `POST /approvals/policies/preview`, `GET …/document-types`, `GET
   …/approvers`; the policies screen with its editor and preview, and
   `/admin/groups`. Found on the way: a policy with conditions made every
   document outside them fail to submit — the policy is now the newest one
   whose conditions the document meets, and none means straight through.
   The sales screen sends a pending document's deciders to the inbox.

Left: a "may decide what I am asked" permission apart from `.manage`;
department and category facts for conditions.

### Phase 8 — Customers on screen: CRM, support and loyalty *(written 5 October; three steps, ~6 weeks)*

The CRM, customer service and loyalty APIs are built and tested with two
organisations (CRM.md); every screen is a placeholder.

1. **CRM** *(~3 weeks)*: accounts, contacts, deals on pipelines and their
   stages, activities, lists and their members; the timeline; merge;
   import and attachments (untested today — tested here). Pipelines on a
   board. The customer page (Phase 4.15) is a contact's or account's
   documents and transactions; it is built with this step.
2. **Support** *(~2 weeks)*: tickets with their first response and
   resolution times, appointments and reservations on a calendar.
3. **Loyalty** *(~1 week)*: tiers, enrolments, the points ledger, and
   points earned and spent on sales.

Done when as Phase T; CRM.md.

**As built, 6 October 2026** (CRM.md):

1. *CRM.* Customers with what each owes (the customer page reads
   `projection.customer_activity`); accounts; deals on a pipeline's board;
   pipelines and stages; activities by kind, status and lateness; lists
   and members; CSV import (refused rows named) and export; merge, asked
   twice; logging an activity from a customer's page. Import and
   attachments are now tested, and the export no longer goes through one
   file every organisation shared.
2. *Support.* A ticket's first response and resolution are stamped by what
   happens — the first reply the customer sees, resolving and reopening —
   and `/support-tickets/times` gives medians and 90th percentiles. A
   reservation is converted into its appointment in one step. Tickets,
   their conversations and a week's appointments with reservations are on
   screen.
3. *Loyalty.* The organisation's scheme; points earned on posted invoices
   and spent as a receipt paid in points, both in the posting's
   transaction and in the books (posting roles `loyalty_liability`,
   `loyalty_cost`); tiers follow points earned; points change only through
   the ledger. The scheme, tiers, members and their ledgers are on screen.

Decisions taken: points are earned on the net amount; a receipt paid in
points is a receipt (so approval policies on receipts apply to it); a voided
invoice takes back only what points are still held. Not built: points
expiry, dynamic lists, sending reminders.

### Phase 9 — People on screen: HR and payroll *(written 5 October; four steps, ~8 weeks)* ← **done, 8 October**

The HR API — 37 controllers — is built and tested with two organisations
(HR.md); payroll posts to the ledger (Phase 5 step 5); every one of the
twenty-one screens is a placeholder. Staff are not users (§3f).

1. **Organisation and staff** *(~2 weeks)* ← **done 8 October**: staff and their records
   (documents, contracts, compliance, work authorisation, education and
   experience), departments, teams, job functions; a leaver's exit, which
   Phase 10's return checklist waits for.
2. **Time** *(~2 weeks)* ← **done 8 October** (2a rotas, attendance, self-service; 2b leave): shifts, rotas from rotation plans (none are
   made today), holidays, attendance with clock in and out and its jobs
   (off today); leave categories, entitlements and requests, approved and
   taken from the balance (records only today).
3. **Pay** *(~2 weeks)* ← **done 8 October**: salary structures, pay grades and groups, tax
   tables, payroll runs, payslips printed and sent.
4. **Performance** *(~2 weeks)* ← **done 8 October**: review cycles, reviews, goals and their
   tasks, competencies; HR analytics joins Phase 5.5 step 7's HR figures.

Done when as Phase T; HR.md. Payroll and HR figures keep their sensitive
permissions (Phase 5.5).

### Phase 10 — Asset management *(written in full 5 October from the user's document; six steps, ~25 weeks)* ← **complete, 11 October (steps 1–6)**: [ASSETS.md](ASSETS.md)

*The ask:* one register of everything the business owns and keeps — laptops,
vehicles, generators, machines, furniture, buildings, licences — who has
each, where it is, what state it is in, what it costs to keep, what it is
worth, and when it goes. The product and technical document
(`asset-management-product-and-technical-document.md`, the user's, in
`documentation/`) is the source; this section fits it to the code we have
and orders it. **It is built in full: there is no MVP.** Everything in the
document's final scope (its §79), its Phase 2 and Phase 3 lists and its AI
capabilities is built; the steps are the order of dependencies, not a cut.

**The boundary** (the document's, and ours). Asset management owns the
asset and its lifecycle. Procurement owns purchase orders and receipts,
inventory owns stock, finance owns entries, HR owns staff. Assets reach the
others through ports, the way `src/modules/adapters/` already does for
approvals, the ledger, inventory and numbering — never their services.

**Stock or asset.** The catalogue already has an *Asset* inventory type
(`ASSET`: kept, not sold, tracked). Ten laptops bought are stock of that
type until they are put into service; putting one into service issues it
from stock and makes the asset. One hundred USB cables stay stock. A spare
part taken from stock for a repair is issued against the work order and
becomes a component of the asset.

**What a person can do**, by step (rough weeks):

| Step | What |
|---|---|
| 1. The register *(~5)* | Categories (default useful life, method, residual value) and classes; identification — asset number, barcode, QR, RFID, NFC, serial, manufacturer number, custom identifiers — and tag labels printed in sheets; ownership (owned, leased, rented, borrowed, customer-owned, third-party managed, government-provided) with the provider, contract, dates, payment terms, monthly cost, renewal and return terms; a location tree under each of the organisation's locations; status (the document's fifteen, plus the organisation's own) and condition, kept apart; assignment to a member of staff, department, team, branch, location, project, vehicle operator, customer or outside party, with custody apart from ownership (owner, custodian, assigned person, responsible manager) and every past assignment kept; components and sub-components under a parent, replaced without losing its history; bundles (a workstation package) assigned together; the timeline and audit trail; search, saved filters, bulk assign, transfer, recategorise, tag, verify and retire; import from CSV or Excel, checked before anything is saved; export. |
| 2. Operations *(~5)* | Transfers — request, approve, dispatch, receive, two-step where the organisation turns it on — with reason, both locations and custodians, dates and evidence; maintenance — preventive by time, use or meter, corrective, emergency — as schedules and work orders (number, type, problem, priority, dates, technician, inside or outside provider, estimated and actual cost, parts issued from stock, labour, downtime, notes, attachments, approval) through requested → approved → scheduled → assigned → in progress → completed → verified → closed; inspections (exists, place, custodian, serial, condition, works, tag, photos); damage reports that open a work order; warranties and service contracts with their terms and expiry; the asset's documents (purchase invoice and order, warranty, maintenance, insurance, registration, lease, inspection, disposal certificate, photos, ownership); reminders and notifications; QR scan to the asset. |
| 3. Acquisition and money *(~5)* | From procurement — requisition, RFQ, quotation, purchase order, goods receipt *Create assets* (one per unit for serialised items), supplier invoice and payment, all linked to the asset; from stock (the *Asset* inventory type) into service; capitalisation threshold (below it, an expense); depreciation — straight line, declining balance, double declining, units of production — as a schedule per asset, run monthly at period close and reviewed by finance before posting; valuation (acquisition and capitalised cost, accumulated depreciation, impairment, revaluation, net book value, disposal value); retirement (out of service, awaiting disposal); disposal by sale, scrap, donation, return to supplier, lease return, destruction, internal transfer or write-off, with evidence and gain or loss; lost and stolen (last place and custodian, incident, investigation, resolution, financial treatment); reinstatement only by approval; insurance (provider, policy, cover, premium, dates, insured value, renewal reminders) and claims (incident, claim number, amount, insurer, status, settlement). |
| 4. Control and analysis *(~5)* | Physical verification — a count per location or class, expected against found, exceptions (missing, moved, damaged, unexpected) as reconciliation tasks, closed only when each is resolved or approved; capital budgets by category against finance's budgets, acquisitions compared to them; total cost of ownership (purchase, installation, maintenance, insurance, operating costs); utilisation from meter readings (mileage, trips, fuel, operating hours, production units, operations); downtime and availability; replacement planning on age, life, maintenance cost, downtime, condition, warranty, obsolescence, value and replacement cost; the twelve reports (register, valuation, depreciation, movement, assignment, maintenance cost, utilisation, warranty expiry, disposal, missing, verification, lifecycle) and the dashboard's KPIs; assets held by customers; projects; the leaver's return checklist. |
| 5. In the field *(~3)* | The phone app (shared with the Drive, Phase 4.14): scan a QR or NFC tag, see the asset, confirm place, custodian and condition, take a photo, submit — offline, synced when back; RFID readers for counting a room at once; meter readings and damage reports from the floor. |
| 6. Intelligence *(~4, then per capability)* | IoT telemetry feeding meters and downtime; predictive maintenance; replacement forecasting and recommendations; reading invoices, warranties and insurance certificates into fields (with the Drive's extraction and human review); anomaly detection (an asset moving too often, costs out of line, a count that disagrees); questions in words ("which vehicles are due for replacement this year?"); computer-vision checks of photos at verification; fleet management in depth (fuel, trips, drivers, GPS when a tracker is connected). |

*Step 1 built 11 October 2026: categories and classes, places, the register with identification, ownership and custody, assignment (one holder at a time), components, bundles, bulk actions, imports (checked before anything is saved) and exports, tags with QR codes, saved searches and the organisation's own statuses; `ASSETS.md`.*

*Step 2 built 11 October 2026: transfers through the approval engine (two steps by setting), work orders from request to close with parts from stock and labour, preventive schedules by date and by meter, damage reports, inspections, warranties and service contracts, reminders as notification rules, files through Drive references; `ASSETS.md`.*

*Step 3 built 11 October 2026: goods received and stock put into service as assets (one per unit, at cost; the capitalisation threshold decides capital or expense), the monthly depreciation run (four methods, computed in the background, reviewed by finance, posted through the ledger as one balanced entry), valuation (revaluation, impairment, adjustment through the approval engine), disposal (inspected, approved, carried out with its gain or loss), lost and stolen assets and their write-off, reinstatement by approval, insurance policies and claims; accounts by category or by posting role; `ASSETS.md`.*

*Step 4 built 11 October 2026: verification counts (planned, scanned, resolved, closed only when nothing is open; each asset found is dated), capital budgets against what was acquired, cost of ownership, utilisation and downtime, replacement planning with reasons, the leaver's return checklist opened by HR's exit, 14 KPIs, 12 reports and the assets dashboard on the analytics platform; `ASSETS.md`, `ANALYTICS.md`.*

*Step 5 built 11 October 2026: the phone app's API (`/asset-field`) — what a scan shows (number, QR link, barcode, RFID or NFC tag), the register kept offline in pages and then only what changed, confirming place, custodian and condition with photographs (a difference is a discrepancy, never a silent change; in a count it is the count's result), meter readings and damage reports from the floor, a room's RFID tags compared with the register, a phone's offline batch where an item sent twice applies once and a failing item undoes only itself; `ASSETS.md`.*

*Step 6 built 11 October 2026: **6a** — trackers and sensors posting through a gateway's service account become the machine's states (fault time is downtime), a vehicle's trips, its last position and the meters they feed; the fleet with fuel, kilometres a litre and what a kilometre costs; **6b** — failure risk with reasons and the date the next failure is expected, when meter-based jobs fall due, replacement forecast beside the capital budgets, and a nightly anomaly scan (moved too often, costs out of line, a count that disagreed, a meter that jumped, a tracker gone quiet, more fuel than a tank holds); **6c** — through the organisation's own AI provider: documents read into proposed fields for a person to correct and accept, questions in words answered as the asker from a tool catalogue (the provider never sees the register), photographs checked at a count for size, focus, light and being the same picture as another; `ASSETS.md`, `ANALYTICS.md`.*

**Fitted to what exists**

- **Locations.** The organisation's locations (`tenant/location`) are the
  roots; `asset_locations` is the tree beneath them (building, floor, room,
  yard, site), with a materialised path so "everything at Lagos Head
  Office" is one indexed query. Location scope (`user_location_roles`)
  therefore applies to assets as it does to stock: a person scoped to Abuja
  sees and moves Abuja's assets. The document's country, state and city
  levels are what the organisation's locations already say.
- **People.** Custodians are staff (`human-resource/staff`), not users
  (§3f): a driver with no login can hold a vehicle. Departments are HR's;
  cost centres are finance's (`finance/cost-center`); suppliers are the
  supplier module's.
- **Numbers.** The numbering module gives each organisation its series —
  `AST-2026-000001` by default, `LAG-IT-000001` if it chooses — for
  assets, transfers, work orders, verifications and disposals.
- **Approvals.** The engine, never a second one: `@Approvable` handlers for
  acquisition, assignment, transfer, revaluation, impairment, write-off and
  disposal, with policies by value, category, location, department and
  method ("disposal over ₦10m: department manager, finance, asset manager,
  executive").
- **Settings** (the organisation chooses; Phase 3's document settings):
  numbering, which statuses it uses and extra ones of its own (each mapped
  onto a built-in one, so the rules still hold), the capitalisation
  threshold, two-step transfers, depreciation defaults per class, reminder
  lead times.
- **Events.** `asset.created`, `.assigned`, `.returned`, `.transferred`,
  `.maintenance.created/.completed`, `.warranty.expiring`, `.verified`,
  `.missing`, `.retired`, `.disposed`, `.depreciation.posted` through the
  outbox, with `organizationId` in the payload; open screens update through
  the `/live` gateway (Phase 4.7); search indexes the register.
- **Notifications** are intents to the engine (Phase 4.9) — due
  maintenance, expiring warranties and insurance, overdue counts, a
  transfer to receive — and the channel is the organisation's.
- **Documents** live in the Drive (Phase 4.14): each asset has a folder —
  invoice, warranty, manual, photos, inspection and service reports —
  through the Drive's document references (its step 3). If assets are
  built before that step, they are `storage.files` attachments, moved into
  the folder when it comes. Bytes are in object storage
  (RustFS), never in Postgres; the database keeps the key, name, type,
  size and checksum.
- **The ledger.** Depreciation, capitalisation, impairment, revaluation and
  disposal each make an entry for finance — but nothing posts until Phase 5
  makes the ledger real, as with sales, procurement, memos and payroll.
  Until then schedules are computed and shown "not in the ledger", and
  step 3's posting is done when Phase 5 is.
- **HR.** A leaver's return checklist needs HR's exit, which is Phase 9;
  step 4 builds the checklist and Phase 9 triggers it.
- **Projects** come with Phase 11 (manufacturing projects). Until then
  the ledger's *Project* dimension gives assets a project to be assigned
  to and project-level cost; Phase 11 keeps each project and its
  dimension value in step, so nothing assigned earlier is lost.
- **Machines** are assets here and schedulable resources in Phase 11: a
  maintenance work order (step 2) blocks the machine's time on the
  production schedule.
- **Fleet and deliveries** *(the user, 5 October: "Fleets … has to do
  with delivery trucks or vehicles generally, IoT can capture realtime
  location of the asset used in delivery")*. Vehicles are assets of the
  *Vehicles* category, with a fleet profile: registration, insurance and
  roadworthiness expiry, fuel type, capacity, odometer. A delivery
  (today's waybill, SALES.md) names the vehicle and the driver — a member
  of staff, who need not sign in — so a vehicle's trips are its
  deliveries. **Live location**: a GPS or IoT tracker is an integration
  slot (Phase 4.6) — the organisation chooses its provider (Teltonika,
  Traccar, a phone in the cab); positions arrive as events, the last
  known position is a projection per vehicle, never a table scanned per
  request, and it is pushed on `/live` to the delivery's page and the
  fleet map. Trips, mileage, fuel, idling and downtime are summed from
  those events. The analytics document's §12.14 (logistics and delivery:
  routes, drivers, proof of delivery, on-time rate) and §12.15 (fleet:
  utilisation, fuel efficiency, cost per kilometre, accidents, expiries)
  are built with step 6, on Phase 5.5's platform.
- **AI** uses the organisation's chosen provider (an integration slot) and
  sees only what the asker may read, as the Drive's does.

**How it is built** (the second question of every query: 200k+ people,
millions of assets and events)

- `src/modules/asset/` with a sub-module per area (asset, category, class,
  location, assignment, transfer, maintenance, warranty, insurance,
  verification, valuation, depreciation, disposal, component, bundle,
  event, report) in the existing shape: controller → use case → service →
  repository, mappers both ways.
- Every table distributed on `organization_id` and colocated with the
  rest, which never comes from the request body — `@CurrentOrganization()`
  — and every query names it. Row-level security as T.2 and the RLS plan
  set out, when the user gives the go-ahead.
- Constraints carry the rules: `UNIQUE (organization_id, asset_number)`;
  serial numbers unique where present (a partial index); one open
  assignment and one current location per asset (partial unique indexes
  on the open rows); depreciation once per asset and period
  (`UNIQUE (organization_id, asset_id, period_id)`). Money is
  `numeric(19,4)`.
- Assign, transfer, dispose and depreciate are one transaction each —
  change the asset, write the record, append the event, record the outbox
  event — with optimistic locking on the asset's `version`, so two people
  assigning one laptop get one success and one 409.
- `asset_events` is the timeline and is append-only: no update or delete
  route reaches it.
- The register's lists are paged by key, filtered on indexed columns
  (`status`, `location`, `custodian`, `category`); the dashboard's numbers
  are a projection kept from the events, not a count per view.
- Work off the request in BullMQ: the daily reminders (maintenance due,
  warranties, insurance, leases, overdue counts), the monthly depreciation
  run per organisation in batches, imports, report files, label sheets.
  Meter readings and telemetry arrive as events and are summed into
  projections, never totalled per request.
- Retire, never delete: an asset with history is retired or disposed; only
  a draft can be deleted, and a background job clears its associations,
  checking the organisation on every row.
- QR codes carry the asset's link (the app URL and its number), nothing
  about money or people; a scan by someone without access shows nothing.
- Routes take ids, as the rest of the API does; a scan looks the number up
  (`GET /assets/lookup?number=`). (The document's routes use the asset
  number; ids keep one convention and the malformed-input 400.)
- Permissions: `asset.view`, `create`, `update`, `delete`, `assign`,
  `transfer`; `asset.maintenance.view/create/approve`;
  `asset.disposal.create/approve`; `asset.valuation.view/update`;
  `asset.verification.create/complete`; scoped by location as above.
- Web: an Assets area with the register, the asset page (details,
  timeline, assignments, components, maintenance, documents, value,
  insurance, usage), transfers, work orders, counts, disposals, budgets,
  reports and the dashboard; NgRx feature stores; `ui-list-state` on every
  list.

**The rules the tests prove** (the document's invariants and business
rules): a disposed asset cannot be assigned; a retired one returns to
service only by an approved reinstatement; one custodian and one location
at a time; a two-step transfer completes only on receipt; a disposal only
with its approval; depreciation never twice for an asset and period;
history is never edited; serial and asset numbers never repeat in an
organisation; staff are assigned only assets within their scope; a count
closes only when its exceptions are dealt with.

**Done when** (Phase T), per step: unit specs for the rules; whole-app
endpoint tests with two organisations (another's asset is 404 by id, absent
from lists, and cannot be assigned, moved, counted or disposed); the
tenancy sweep covering the new routes; a drill on the test organisation
(register a laptop from a receipt, assign it, move it Lagos → Abuja, repair
it, depreciate it, dispose of it); web specs; Cypress stubbed and live;
and `ASSETS.md`.

**When.** In roadmap order, after Phases 5–9. Steps 1 and 2 need nothing
unbuilt; step 3's acquisition needs procurement (tested in Phase T) and its
posting needs Phase 5; documents need the Drive's step 3 to be in their
final place; step 5 needs the phone app (Drive step 6); step 6's
extraction needs the Drive's step 5.

**To settle with the user**: whether lifecycle stages before receipt
(planned, requested, approved) belong to assets or stay procurement's
requisition; the default number format; which disposal methods need
approval by default; whether customers' held assets come before step 4.

### Phase 11 — Manufacturing: projects, production and the shop floor *(written in full 5 October from the user's document; nine steps, ~38 weeks)* ← **complete, 11 October 2026: all nine steps built** ([MANUFACTURING.md](MANUFACTURING.md))

*The ask (5 October):* project management centred on manufacturing —
"Projects are not simply collections of tasks. Tasks exist because a
manufacturing activity must happen." The user's *Manufacturing Project &
Production Management Platform* (`manufacturing-project-management-platform.md`,
the user's, in `documentation/`) is the source; this section fits it to
the code we have and orders it. **It is built in full: there is no MVP.**
Every section of the document is built; the steps are the order of
dependencies, not a cut.

**The boundary** (its §54). Manufacturing is the orchestration layer;
the other modules stay the systems of record. Stock owns quantities and
movements, procurement owns requisitions and orders, finance owns
entries, HR owns staff, shifts and skills, asset management owns
machines and their maintenance, the Drive owns documents. Manufacturing
reaches them through ports (`src/modules/adapters/`), never their
services.

**Why after Phase 10.** Machines are assets (Phase 10's register), and a
maintenance work order blocks a machine's time (its §33) — Phase 10 step
2. The operator's screen is the phone app Phase 10 step 5 and the Drive
share. Raw materials, work in progress and finished goods are Phase
4.13's inventory types. Costing work in progress needs Phase 5's ledger,
and the dashboards stand on Phase 5.5.

**What exists, found by reading the code**

- **HR has most of the workforce side**: staff, departments, teams, job
  functions, competencies, shifts, shift assignments, rotation plans,
  holidays and attendance (`src/modules/human-resource`). The scheduler
  reads them; it does not copy them.
- **Stock** keeps quantity on hand and reserved per item and location,
  and an append-only ledger of movements (STOCK.md). Production adds
  movement sources — issue to a work order, return from it, receipt of
  finished goods, scrap — and reservations for a work order.
- **Procurement** makes requisitions, RFQs, orders and receipts
  (PROCUREMENT.md); a shortage becomes a requisition through its port.
- **Products** carry barcodes; the catalogue has variants and units of
  measure (UNIT_OF_MEASURE.md), so a bill of materials states its
  quantities in the component's units and stock sums base quantities.
- **The ledger** has a *Project* dimension and budgets; nothing yet knows
  work in progress.
- **No projects, tasks, BOMs, routings, work centres, production or work
  orders, quality records or schedules exist.**

**Steps**

1. **What is made, and how** *(~5 weeks)* (its §15, §16, §61, §62). ← **built, 11 October** ([MANUFACTURING.md](MANUFACTURING.md))
   - **Bills of materials**: multi-level, versioned with effective dates,
     alternative components, scrap factors, co-products, by-products and
     phantom assemblies; quantities in the component's unit.
   - **Routings**: operations in order, each with its work centre,
     machine, skills (HR competencies), setup, run, queue, move and
     inspection times, tools, materials consumed at that operation, and
     labour and capacity needed. An operation can be **subcontracted**:
     it raises a purchase order to the subcontractor and its cost is the
     project's.
   - **Product lifecycle and change** (its §38, §62): concept →
     engineering → BOM → routing → approval → release; engineering change
     requests through the approval engine; BOM, routing, drawing and
     specification revisions kept, and **an order stays tied to the
     version that was released with it**. Drawings and specifications
     live in the Drive.
   *(Built 11 October: bills of materials with versions, lines (components,
   co-products, by-products, phantoms, alternatives, scrap), checks, release
   from a day and explosion to every level; routings with operations, skills,
   tools and subcontracting, and the time a quantity takes; work centres as a
   registry ahead of step 2; the product lifecycle with revisions that release
   a bill and a routing together through the approval engine, and engineering
   change requests; drawings linked from the Drive and pinned to a version.
   The chosen shape: a revision is the release package, so an order stays
   tied to the versions it was released with. Left for later steps: machines
   and tool records on operations (step 2), purchase orders for subcontracted
   operations (step 4), late-change alerts (step 9).)*

2. **Plants and resources** *(~3 weeks)* (its §6, §17, §18, §22–24). ← **built, 11 October** ([MANUFACTURING.md](MANUFACTURING.md))
   - **The hierarchy**: plants and warehouses are the organisation's
     locations; production lines and work centres beneath a plant; every
     record carries its organisation and its plant, so location scope
     (`user_location_roles`) limits manufacturing as it does stock.
   - **Work centres**: capacity, working hours, shift calendar (HR's
     shifts and holidays), machines, operators, skills, cost rates.
   - **Machines** are Phase 10 assets with a production profile: type,
     capacity, operating cost, state (available, running, idle, setup,
     maintenance, breakdown, offline, reserved), kept as events.
   - **Tools**, and **people** as staff with competencies,
     certifications and maximum hours.
   *(Built 11 October: plants as registered locations with lines beneath;
   work centres with capacity, efficiency, cost rates and a calendar (own hours,
   HR shifts, closed days, extra hours, HR holidays) worked out day by day;
   machines whose state is kept as events, with availability and utilisation read
   off them; tools with calibration; people as a manufacturing profile and skills
   over HR's staff, with HR's certificates and rosters shown. The chosen shape:
   plants stay the organisation's locations; skills held are manufacturing's
   because HR keeps none; routing operations name a machine and tools. Left:
   maintenance blocking machine time (step 5, with Phase 10), alerts and
   analytics (step 9).)*

3. **Projects** *(~4 weeks)* (its §7–12, §37–41). ← **built, 11 October** ([MANUFACTURING.md](MANUFACTURING.md))
   - **Projects** with every field of its §7, the lifecycle of its §8
     (draft → … → closed; on hold, cancelled, blocked), phases,
     milestones and deliverables.
   - **Tasks** with every attribute of its §10, nested (its §11), and
     **dependencies** of all four kinds with lag and lead, and
     conditional, approval, material and quality dependencies (its §12).
   - **Risks, issues, assumptions, dependencies, constraints** (its §37),
     scored and owned; **changes** to scope, quantity, deadline, material
     and cost, versioned (its §38).
   - **Comments** on projects, tasks, work orders, production orders,
     quality issues, requisitions and maintenance orders (its §40);
     documents linked through the Drive (its §39); approvals through the
     engine with policies by role, department, amount, risk and project
     type (its §41).
   - A project may have no production at all (an installation, a factory
     expansion): tasks, milestones and costs only.
   - Each project is also the ledger's *Project* dimension value, kept in
     step, so its money is in the books.
   - Numbers from the numbering module (`PRJ-2026-0001`, production and
     work orders, NCRs), the organisation's format.
   *(Built 11 October: projects with the eleven statuses and what each step asks of
   a project (settings), approval and closure through the engine, the ledger's
   Project dimension kept in step; phases (the standard nine as a setting),
   milestones and deliverables; nested tasks that roll up, with the four
   dependency kinds, lag and lead, conditional, approval, quality and material
   conditions, no loops and none the plan breaks; risks, issues, assumptions,
   dependencies and constraints scored into the project's level; changes that
   move the date and budget and raise a version, the first kept; comments with
   mentions on projects, tasks, risks, changes, requisitions and maintenance
   orders; documents through the Drive links. The chosen shape: a project at no
   plant is the whole organisation's, readable by all; a task made of others takes
   its figures from them; work starts once a project is approved. Left: work orders,
   production orders and quality issues take comments with their steps; costs from
   what happened are step 8.)*
4. **Production planning** *(~5 weeks)* (its §13, §14, §25–27, §56). ← **built, 11 October** ([MANUFACTURING.md](MANUFACTURING.md))
   - **Production orders** — planned demand, from a sales order, a
     project deliverable or a plan — and the **work orders** they
     generate, with their operations.
   - **The planning engine**: demand → production requirement → BOM
     explosion → material requirement → capacity requirement → resource
     allocation → schedule → work orders; recalculated when quantity,
     date, material, machine, person, progress, quality or maintenance
     changes.
   - **Materials**: checked against stock, reserved for the work order,
     or short — and a shortage becomes a purchase requisition through
     procurement's port. Material states (its §26) are stock's states for
     that work order, not a second count.
   - **"Can we deliver by 30 November?"** (its §66): the projected
     completion from quantity, BOM, stock, supplier lead times, machine
     and workforce capacity, maintenance, backlog and dependencies.
   *(Built 11 October: production orders from a project deliverable, a sales order line, a plan or by hand, with the demand
   remembered; the planning engine making a work order for the product and one for each sub-assembly stock cannot cover,
   operations worked out from the routing in force, materials held or short, dates back from the day needed and the earliest
   finish worked forward; stock held in a new append-only reservation ledger beside the movements, never a second count;
   shortages as draft requisitions through procurement's port and a purchase order for work sent out; "can we deliver by…?"
   answered with its factors; capacity per work centre per week; comments on both orders. The chosen shape: an order stays
   tied to the bill and routing versions it was planned with; planning again keeps and calls off the old work orders; stock is
   held at the order's plant only; the new work is taken to queue behind what is booked, until step 5's finite scheduler.
   Left for later steps: maintenance windows and people allocation (5), issue, return and finished goods (6), inspection
   (7), costs from what happened (8).)*
5. **Scheduling** *(~6 weeks)* (its §19–21, §23, §45, §46). ← **built, 11 October** ([MANUFACTURING.md](MANUFACTURING.md))
   - **The scheduler**: finite capacity, respecting dependencies, due
     dates, machine availability and maintenance windows, people's skills
     and shifts, materials, priority and setup time; durations computed
     on the shift calendar.
   - **Critical path**: earliest and latest start and finish, slack, the
     critical tasks and operations, and a delay's effect on the final
     date.
   - **Capacity planning**: required against available per work centre,
     bottlenecks found, not looked for.
   - **Workforce**: people suggested by skill, certification,
     availability, shift and hours.
   - **The board**: timeline, Gantt, calendar, kanban, and machine, work
     centre, person and line schedules, rescheduled by dragging — each
     move checked by the same rules.
   - **Scenarios** (its §46): "this machine is out for three days", "this
     delivery is a week late" — computed on a copy, never the live plan,
     showing the new completion date, affected work orders, conflicts and
     cost and delivery impact.
   *(Built 11 October: the finite-capacity scheduler placing each operation on the machine or work centre place that finishes it soonest along the
   work centre's calendar, never twice at once, never through maintenance or a breakdown (read from asset management's open maintenance orders and the
   machine's state), never before what it follows or the sub-assembly it draws; people given each operation by skill, certificate, roster, leave, other
   work and hours; the board by machine, work centre, person, line and order as a timeline, a calendar and a kanban; moves — dragged or entered —
   checked by the same rules (refused in words, snapped to working hours, or the rest planned around them) and pinned; critical path and slack for a
   project's tasks and an order's operations with a delay's effect; required against available per work centre with the bottlenecks named; and what-if
   scenarios on a copy for a machine out, a centre closed, deliveries late or a person away. The chosen shape: work is placed as soon as materials and
   capacity allow; a run leaves started, pinned and released work where it is; maintenance orders carry a day, so the setting says how many working
   hours of it are blocked. Left: nothing for step 5. (How sales sees stock held for work orders was settled on 11 October: it is its own kind of inventory, not for sale — see STOCK.md.))*
6. **The shop floor** *(~4 weeks)* (its §28, §29, §57, §58). ← **built, 11 October** ([MANUFACTURING.md](MANUFACTURING.md))
   - **The operator's screen** on the phone app: current task and work
     order, quantities required, done and left, materials, instructions,
     safety, quality checkpoints, machine state; start, pause, resume,
     complete, quantity produced, scrap, downtime with reason codes,
     comments — offline, synced when back.
   - **Stock moves with the work**: materials issued to and returned from
     the work order, finished goods received, scrap recorded — stock
     movements, so on-hand and value stay true.
   - **Barcodes and QR** for products, materials, batches, work orders,
     machines, tools, locations and finished goods; scanning a work order
     opens its instructions.
   - **The shop-floor dashboard** (its §29), live through `/live`; machine
     states from IoT where a machine is connected (Phase 10 step 6).
   *(Built 11 October: the operator's screen — the operations given to the person with quantities, materials and their state, instructions, safety requirements (new on routing operations), quality
   requirements, machine, tools, crew and drawings — and start, pause, resume, units good and spoilt, completion (short needs a reason), clocking on and off and comments, each a recorded event
   under the organisation's rules (operations in sequence, no more than was ordered or passed on, one job to a machine, none on a machine that is down); materials issued to a work order, given
   back, written off or drawn as units are reported, and finished goods with co- and by-products received under a batch named after the work order — all stock movements costed by stock, with the
   cost still in progress shared so the last receipt clears it; stops with the organisation's reason codes putting the machine in a state; a phone's offline batch applied once with a failure undoing
   only itself; scans and QR/Code 128 labels for work orders, machines, tools, items, batches and locations; the dashboard with units, target, rate, scrap, downtime, OEE and efficiency, live. The
   chosen shape: stock moves are the shop floor's own sources, reserved against hand-made movements; a work order's cost in step 6 is its materials (labour, machines and the books are step 8);
   an operator acts on what was given to them and a supervisor on any at their plants. Left: machine states from IoT (joins Phase 10 step 6), quality checkpoints on the operator's screen (step 7),
   stock held for work orders became its own kind of inventory, not for sale, on 11 October (STOCK.md).)*
7. **Quality** *(~4 weeks)* (its §30–32, §59, §60). ← **built, 11 October** ([MANUFACTURING.md](MANUFACTURING.md))
   - **Inspections** — incoming (at the goods receipt), in-process and
     final — with sampling and test results; **defects**; **quality
     gates** that block the tasks after them when they fail.
   - **Non-conformance** reports with every field of its §32 and the
     dispositions accept, rework, repair, scrap and return to supplier
     (procurement's return-to-supplier); corrective actions verified.
   - **Traceability** both ways (its §59–60): which materials and lots
     went into this product, and which products used this lot — for
     recalls and investigations. Lots and batches are recorded on the
     stock movements.
   *(Built 11 October: plans with sampling (all, fixed, percent), an accept number and measured or pass / fail characteristics, some critical; inspections incoming (raised from received goods), in process
   (raised when an operation is completed) and final, recorded sample by sample and judged by the plan's rule; gates that hold the next operation, the finished goods with the work order's completion, a lot
   from being issued, and a project's tasks through quality-conditioned dependency links; non-conformance reports opened by a failure, the floor or by hand, dealt with by accept, rework, repair, scrap or
   return to the supplier (a draft through procurement), reinspected after rework, with corrective actions verified by someone other than whoever did them; defect types and defects; traceability into a
   product and from a lot, to the supplier and to dispatch. The chosen shape: quality reads stock and procurement through ports and writes only stock movements for scrapped goods; an incoming plan is not a
   gate unless it says so; the first failure keeps holding while a second attempt is made. Left: AQL tables and control charts; cost of poor quality in the books (step 8).)*
8. **Cost and the ledger** *(~4 weeks)* (its §34–36). ← **built, 11 October** ([MANUFACTURING.md](MANUFACTURING.md))
   - **Costs** from what happened, not estimates: materials issued,
     labour from time booked on operations at HR's rates, machine time at
     the work centre's rate, energy, maintenance, subcontractors,
     logistics, overhead absorbed, scrap and rework.
   - **Budgets**: approved, planned, committed (open purchase orders),
     actual, forecast and variance per project, on Phase 5's budgets.
   - **Work in progress in the books**: new posting roles (WIP, labour
     and overhead absorbed, production variances, scrap) through
     `LedgerPostingService` — issue to WIP, WIP to finished goods,
     variances at completion — the organisation choosing the accounts.
   - **Profitability** (its §36) by project, product, customer,
     production order, work order, department and plant; earned value.
   *(Built 11 October: a work order's cost read from what happened — materials as stock valued them, labour at the person's hourly cost (else the work centre's rate), machine time and overhead at the
   work centre's rates, work sent out at its charge, and energy, maintenance, logistics, rework and the rest recorded by people and voided with a reason — applied to it once as cost lines and posted through
   `LedgerPostingService` (Dr work in progress, Cr labour or overhead absorbed); finished goods received at what the work has cost; completion clearing what is left (added to the goods made, charged to the
   material, labour and overhead variance accounts for units not made, written off to production scrap when called off); seven new posting roles with chart accounts; standard against actual by kind, cost of
   poor quality, work in progress set beside the ledger's balance; a project's approved, planned, committed, actual and forecast cost, budget by kind of cost, earned value and the Phase 5 budgets beside it;
   profit by project, product, customer, order, department and plant. The chosen shape: the other side of the shop floor's stock movements is work in progress, not stock adjustments; cost is applied by
   difference so it is idempotent; a posting that cannot be made waits in the posting backlog and the work stands. Left: energy and maintenance read from IoT meters and maintenance orders; invoiced
   revenue by period.)*
9. **Automation, alerts and analytics** *(~3 weeks)* (its §42–44, §47–51,
   §55, §63, §64). ← **built, 11 October** ([MANUFACTURING.md](MANUFACTURING.md))
   *(As built: the three automations of §48 on a hook object (`AutomationHooks`) so the services they call need not depend on them — a material found short raises the requisition, the project's risk and tells
   procurement; an operation behind its schedule (found by a ten-minute scan) is scheduled again, the project's tasks it touches are listed, the project's forecast completion moves and its manager is told; a machine
   in breakdown has its running operations paused, the alternatives named and its orders scheduled again — each recorded once for its cause with the steps taken or left to the organisation's settings, and resolved when the
   cause goes; five analytics modules (manufacturing, project, quality, maintenance, materials) with 70 KPIs (OEE from the shop floor's own figures, first pass yield, scrap rate, schedule adherence, on-time delivery,
   utilisation, throughput, cycle time, downtime, MTBF, MTTR), 27 reports, five dashboards and the 11 alerts of §47; the 16 roles of §51 as role templates, scoped by plant when given at a plant; the audit trail with the
   address and device of a change and a route to read it; the §55 events mapped onto the outbox's (plus `MaterialShortage`, `PurchaseRequirement`, `MfgAutomation`); notifications; and search in SQL within organisation
   and plant, not in the global index, which has no plant to narrow by. Left: capacity overload ignores leave and maintenance; delay is found within ten minutes, not instantly; the forecast completion is date
   arithmetic, not the project network's critical path.)*
   - **Automations** (its §48): a shortage raises the requisition,
     notifies procurement and lifts the project's risk; a delay
     reschedules, finds the affected tasks, moves the completion date and
     tells the project manager; a breakdown stops the machine's
     operations, offers the alternatives and reschedules.
   - **Alerts** (its §47) and **notifications** (its §63) on Phase 5.5's
     alerts and Phase 4.9's engine.
   - **Dashboards** for the executive, project, production, procurement,
     quality and maintenance managers (its §42); the analytics and KPIs
     of its §43–44 — OEE (availability × performance × quality), first
     pass yield, scrap rate, schedule adherence, on-time delivery,
     utilisation, throughput, cycle time, downtime; the reports of its
     §49 — all on Phase 5.5's platform, with the analytics document's
     §12.22.
   - **Roles** of its §51 seeded as default roles, granular and scoped by
     plant; **audit** of its §50 with previous and new values;
     **events** of its §55 through the outbox; **search** of its §64
     within organisation and plant.

**Rules the tests prove**: a dependency is never broken by a schedule,
a drag or a scenario; a machine is never booked twice or during its
maintenance; a person is never scheduled outside their shift or skills;
a released order keeps its BOM and routing version; materials are never
reserved beyond what stock has; a failed quality gate blocks what follows
it; issued, returned, consumed and scrapped quantities equal the stock
movements; work in progress in the ledger equals open work orders' cost;
another organisation's projects, orders and machines are never reached.

**Done when** (Phase T), per step: unit specs for the planning engine,
scheduler, critical path and costing; whole-app endpoint tests with two
organisations; the tenancy sweep; `manufacturing:drill` on the test
organisation — a generator project from BOM and routing to production
order, shortage to requisition, schedule, shop-floor execution, an NCR,
completion, finished goods in stock and a zero trial balance; web specs;
Cypress stubbed and live; and `MANUFACTURING.md`.

### Phase 12 — Supplier management, in full *(written 6 October from the user's Supplier-Management-Product-Document.md; nine steps)* ← **complete, 11 October 2026: all nine steps built** ([SUPPLIER_MANAGEMENT.md](SUPPLIER_MANAGEMENT.md))

The document (95 sections) describes supplier management as its own
module: a lifecycle with qualification and approval, many contacts,
addresses and bank accounts under maker-checker control, compliance with
expiring evidence, performance and risk measured from operations,
contracts and price lists, a supplier portal, and analytics. What exists
(SUPPLIERS_AND_TAGS.md, Phase 6 step 1): one record — one contact, one
address, one bank account, payment terms, currency — with active /
retired, a statement, search, and procurement refusing a retired supplier.

Gap, by the document's sections:

| Area (§) | Today | Needed |
|---|---|---|
| Lifecycle, status model (5, 79, 32–34) | active / retired | 13 statuses (draft … archived) with controlled transitions; separate *blocked for procurement* and *blocked for payment*; suspension, reactivation, blacklisting with reasons and dates |
| Registration, types, classification, categories (6–8) | name, ids, one category-less record | supplier types; strategic / spend / risk / relationship / geographic classification; a supplier-category tree |
| Contacts, addresses (9–10) | one of each, as columns | many, typed (sales, accounts, quality…; registered, remittance, pickup…), one primary of each |
| Banking (11, Rule 4) | one account as columns, changed freely | many accounts, verification status, every change a change request verified and approved by someone else, the previous account deactivated, audited |
| Tax (12) | registration number | TIN, VAT registration, withholding category, exemption certificates with expiry |
| Products and services (13, 39–40) | none | what a supplier supplies (variants, services), their codes, lead times, minimum quantities, capacity |
| Qualification, assessment (14–16, 35) | none | criteria and questionnaires by category; evidence; outcomes approved / conditional / rejected / expired; periodic evaluation programmes |
| Scorecards, score (17–18, 41–42, Rule 6) | supplier KPIs in analytics; supplier.performance report | quality / delivery / commercial / service / compliance scores computed from GRN inspection, on-time receipt, price variance, AP disputes — a projection, recomputed from source |
| Risk (19–21) | none | a risk register per supplier, likelihood × impact matrix, concentration (share of spend, single-source items) |
| Certifications, compliance, documents (22–24, Rule 3, Rule 5) | none | certificates and documents with expiry, renewal reminders, mandatory ones per category; an expired mandatory one restricts the supplier |
| Contracts, terms, price lists (25–27) | payment terms | contracts with validity and renewal; commercial terms; supplier price lists feeding the price an order is raised at |
| CAPA, audits, site visits (36–38) | none | corrective and preventive actions with owners and due dates; audits and visits with findings |
| Change management (31) | none | sensitive changes (legal name, bank, tax, ownership) as change requests through the approval engine |
| Approval engine (53) | none for suppliers | supplier onboarding, qualification and changes as approvables (Phase 7) |
| Communication, relationship (28–29) | none | the supplier's timeline (81): messages, notes, meetings, documents, changes |
| Portal (30) | none | suppliers' own sign-in, limited to their own data: onboarding, documents, bank and tax details (as change requests), RFQ responses, order confirmation, invoices, payment status, CAPA |
| Duplicates, merge, import, export (71–74) | identification number unique | duplicates by TIN, bank account, name similarity; merge (like contacts'); CSV import and export |
| 360 view, dashboard, reports, analytics (43–50, 82–84) | supplier dashboard and KPIs (Phase 5.5) | the supplier 360 page; spend analytics; comparison; operational alerts (expiring documents, falling scores) |
| Roles, permissions, sensitive data (54–55, Rule 9) | supplier.suppliers.* | read of bank and tax details under its own permission; supplier manager, quality, compliance, finance roles |
| Integrations (60–70) | procurement refuses retired; AP pays the one bank account | procurement and payment honour the blocks; AP pays only a verified, approved account; quality inspections feed scores |

Steps, in dependency order (the document's phases are not a priority —
everything here is built):

1. **Master data** (§6–13, 71–74): typed contacts and addresses, many bank
   accounts with verification status, tax details, types, classification,
   the category tree; duplicates, merge, import, export. Migration moves
   today's columns into the new tables (the columns stay, read-only, until
   nothing reads them — no table or column is dropped).
   *Built 11 October 2026 (SUPPLIER_MANAGEMENT.md): all of it, with the bank
   account's three-person path, activity, review cases and settings.*
2. **Lifecycle and change control** (§5, 31–34, 53, 79–80): the status
   model with its transitions and the two blocks; onboarding, qualification
   outcome and sensitive changes through the approval engine; bank changes
   maker-checker (Rule 4); the audit trail and timeline (§56, §81).
   *Built 11 October 2026 (SUPPLIER_MANAGEMENT.md): thirteen statuses
   (retired is the stored word for inactive), restrictions and standing
   asked by procurement and payables, suspension, blacklisting, reviewed
   reactivation, change requests, the timeline.*
3. **Compliance** (§22–24, 58): certificates and documents with expiry
   (FILES.md storage), mandatory ones per category, renewal reminders
   (scheduled job), automatic restriction on expiry (Rule 3) and its
   lifting.
   *Built 11 October 2026 (SUPPLIER_MANAGEMENT.md): kinds of document and what
   each category must hold (mandatory or not), certificates with expiry,
   verification and renewal, the daily check that marks lapsed ones expired
   and restricts (or moves the status) as settings say, exceptions, documents
   asked through Drive requests, expiry notification rules, approval refused
   while a mandatory document is missing.*
4. **Qualification and assessment** (§14–16, 35): criteria and
   questionnaires per category, evidence, outcomes, evaluation programmes.
   *Built 11 October 2026 (SUPPLIER_MANAGEMENT.md): criteria and questionnaires
   for a category, type, risk class or country with weights, knock-outs and pass
   marks; qualifications scored with evidence, submitted, decided by someone else
   as approved, conditional (restrictions) or rejected, lapsing and renewed;
   approval waits for one where a questionnaire applies; evaluation programmes
   making the evaluations that are due.*
5. **Performance** (§17–18, 41–42): the scorecard projection from GRN
   inspections, receipts against promised dates, price variance, AP
   disputes; CAPA, audits and site visits (§36–38).
   *Built 11 October 2026 (SUPPLIER_MANAGEMENT.md): the scorecard as a monthly
   projection from receipts against promised dates, inspections, returns, invoice
   lines against the price received, evaluations and corrective actions, under a
   model per category; corrective actions with a verifier other than the owner;
   audits with findings; site visits. AP has no record of a dispute: voided
   invoices and lines billed off the received price stand for it.*
6. **Risk** (§19–21): register, matrix, concentration from spend.
   *Built 11 October 2026 (SUPPLIER_MANAGEMENT.md): the register with fifteen
   categories, probability × impact levelled by the organisation's thresholds,
   reviews kept, the risk class a supplier's risks suggest; the matrix with
   counts; concentration of spend by supplier and by item (single source,
   concentrated, alternatives) read from invoices.*
7. **Commercial** (§13, 25–27, 39–40): supplier items, lead times, MOQ,
   capacity; contracts and terms; price lists used when an order is raised.
   *Built 11 October 2026 (SUPPLIER_MANAGEMENT.md): what a supplier supplies with
   one primary source for each product, order limits and the lead time seen on
   receipts; versioned price lists feeding the price an order is raised at (filled,
   noted or refused as settings say); contracts with renewal and expiry; commercial
   terms; stated capacity; who can supply a product.*
8. **Supplier 360, analytics and alerts** (§43–52, 82–84): the page,
   spend analytics, comparison, alerts; reports in the reports registry
   (cached and live, ANALYTICS.md).
   *Built 11 October 2026 (SUPPLIER_MANAGEMENT.md): the 360 page (each part shown by the
   person's rights), spend analytics by supplier, category, product, place, currency and
   month with contracted and outside-contract spend, comparison of two to six suppliers, the
   operational alerts of §84 and six alert conditions, sixteen KPIs, ten reports and the
   dashboard of §45 (cached and live where the tables announce themselves). With it the
   three known gaps: a conditional approval's spend limit held by orders and requisitions, a
   suspension lifted on its end date, a file from a document request recorded as a
   certificate.*
9. **Supplier portal** (§30): its own sign-in realm and permissions,
   limited to the supplier's records; built last because every step above
   is what it shows.
   *Built 11 October 2026 (SUPPLIER_MANAGEMENT.md, step 9): a mode of the same web app
   (`/portal`) with its own sign-in and session; a supplier account is a platform account
   linked to one supplier and reaches only the portal's routes (the permissions guard
   refuses it every other route, permission or not) and only its own records; orders
   answered and shipped, requests for quote quoted, invoices submitted for staff to accept or
   turn back, documents and qualification read, the company record kept (reach at once, legal
   identity, bank and tax as change requests), corrective actions answered where staff show
   them; staff give, suspend and end access and work the inbox. **Phase 12 is complete.**
   Decisions the document left open, built conservatively and listed in
   SUPPLIER_MANAGEMENT.md: an answer does not change the order; an invoice is a submission,
   not a bill; scorecards hidden unless `portalShowScores`; a corrective action is shown only
   when shared.*

Decisions for you: whether the portal is a separate web app or a mode of
this one; and which statuses block what by default (the document leaves
"status does not permit procurement" to configuration — the organisation
chooses, as everywhere else). *Step 2 chose the conservative defaults:
buying only in active and conditional, no payment in rejected or
archived, all of it settings.*

Where it sits: it builds on what is done — procurement and payables
(Phase 6), the approval engine (Phase 7), files, analytics and live reports
— and nothing later waits for it, so it can be taken up whenever you put it
next. Each step is done as Phase T: tested, drilled, on screen, documented.

### Phase 13 — Communication, meetings and scheduling *(written 6 October from the user's Communication-Management-Product-Document.md; ten steps)*

The document (136 sections) makes communication one layer every business
process speaks through — conversations tied to the record that caused them,
internal messaging, email, SMS, WhatsApp and web chat behind provider slots,
templates, campaigns, routing and SLAs — and adds meetings, video and
scheduling. What exists: the notification center (workflows, channels, the
bell, preferences, deliveries — NOTIFICATIONS.md), the organisation's own
SMTP slot, public share links with guest pages and reminders (SHARING.md),
CRM activities and the timeline, and appointments and reservations
(Phase 8). `src/modules/communication` is empty.

Steps, in dependency order (all are built; none is optional):

1. **Calendar, meetings and booking links** (§100–122, asked for first on
   6 October): one event model for **meetings** (organised, with
   participants and guests) and **bookings** (an external person choosing
   a time); the calendar by **day, week, month, year and agenda**, mine,
   my team's, the organisation's; **appointment types** (duration, buffers,
   staff, location, questions, notice and horizon, cancellation and
   reminder policy); **availability** (working hours, breaks, holidays,
   leave from HR, blocked periods); free slots computed across staff and
   existing events; **booking links** — per person, team or organisation,
   for customers, suppliers or anyone — opening a public booking page
   (the sharing module's tokens and guest pages); booking makes the
   appointment, finds or makes the customer or supplier contact, sends a
   confirmation with an .ics and links to **reschedule or cancel**;
   reminders through the notification engine; a **meeting link** per
   online meeting from the provider the organisation chooses (an
   integration slot), unguessable. Recurrence and round-robin follow in
   the same step.
   *Progress (6 October):* the API is built — the event model with kinds
   and participants, appointment types, weekly hours in the person's zone,
   blocked time, booking links (hashed and sealed tokens), the slot engine
   (pure, specced; spread to whoever has fewest), public booking with a
   per-organisation lock, the guest's link to move or cancel, the contact
   found or made, emails with an .ics, reminders, room codes, live notices
   (CALENDAR.md, `calendar.e2e-spec`). The screens too: the calendar by
   day, week, month, year and agenda, meetings, types, links, my hours,
   and the public booking and manage pages; approved leave as busy time and
   repeating meetings — **step 1 done** (6 October). *Our own meeting room* is built
   too (MEET.md): `/meet/<code>`, guests in a lobby until a host lets them
   in, WebRTC between browsers through our own coturn relay, mesh up to
   eight.
2. **Conversations and the inbox** (§8–10, 13–16, 41–42, 46–47):
   conversations tied to records (customer, supplier, document),
   participants, messages, threads, mentions, internal notes, assignment,
   attachments, real time on `/live`.
   *Built 6 October* (COMMUNICATION.md): the inbox, conversations with
   people inside and out, notes, replies, mentions through the notification
   engine, reactions, pins, assignment to a person or group, the customer's
   own link, live notices.
3. **Channels** (§24–28, 51–54): email accounts (in and out), SMS,
   WhatsApp, web chat — one provider abstraction, the organisation's own
   accounts, delivery tracking and retries.
   *Built 6 October* (COMMUNICATION.md → Channels): SMTP email, Twilio,
   Africa's Talking, Termii and WhatsApp Cloud behind one adapter layer;
   deliveries with retries and backup accounts; signed webhooks in; our own
   web chat widget. Mailboxes read over IMAP every minute (`imapflow`),
   from where the last read stopped.
4. **Internal messaging and channels** (§11–12, 16): team chat, channels
   by team and project, reactions.
   *Built 6 October* (COMMUNICATION.md → Team chat): channels for everyone,
   a department, a team, a project, a document or a topic, public or
   private, membership by HR rule; direct messages; forwarding, saved
   messages, search; the organisation's reactions; attachments kept by
   foreign key. `/messages` on the web.
5. **Templates and transactional communication** (§19, 29–31): templates
   with variables and categories; documents send through them.
   *Templates built 6 October* (COMMUNICATION.md → Templates): categories,
   channels, languages, variables per document, Handlebars with our own
   helpers only, live preview; Admin → Templates. *Transactional sends
   built 6 October* (COMMUNICATION.md → Transactional communication):
   notification rules that also write to the customer or supplier, in
   their language, through the organisation's channels, into a
   conversation about the document; four such rules ship switched off.
   *One wording, 6 October*: shares and their reminders are written by
   templates (settings wording moved into them, per location); rules share
   shareable documents; shares are kept in the conversation; the inbox's
   composer fills templates in. Step 5 is complete.
6. **Automation, routing, escalation and SLAs** (§32–34, 43–45).
   *Routing built 6 October* (COMMUNICATION.md → Routing): rules in order
   on channel, account, words, party, document, priority and stage; a
   person or a team (whole, in turn, least busy); priority, status, tags;
   a dry run. *Service levels built 7 October* (COMMUNICATION.md → Service
   levels and escalation): policies with targets in working hours,
   escalation steps, a sweep at each conversation's next check, response
   times and metrics. *Every document a template, 7 October*
   (COMMUNICATION.md → Every document a template): waybills, credit and
   debit notes, statements, requests for quote (each supplier), goods
   receipts, returns, supplier bills, remittance advice and payslips (each
   employee, by email only), with rules that ship off. *Automation, 7 October*
   (NOTIFICATIONS.md, COMMUNICATION.md → Send later): rules on a date and a
   schedule, the account manager as a recipient, follow-up tasks on the
   customer, send later. Step 6 is complete.
7. **Announcements, campaigns, audiences, preferences and consent**
   (§35–39).
   *Built 7 October* (COMMUNICATION.md → Outreach): announcements through
   approval to colleagues in the app and to customers and suppliers by
   email or text with their own link — acknowledgement, read tracking,
   reminders, expiry, retraction, a banner across the top; campaigns by
   email, SMS, WhatsApp (Cloud API templates) and in the app — Draft →
   Review → Approved → Scheduled → Sending → Completed, paused or
   cancelled, every skip reason, tracked opens, clicks, replies,
   unsubscribes and bounces, conversions and revenue; saved audiences over
   customers, leads, suppliers and colleagues in one single-shard query;
   preferences and consent per person with an append-only consent record,
   suppressions, a public preference centre, one-click unsubscribe and STOP
   replies. Push waits for push in the notification centre (Phase 4.9).
8. **Search, history, audit, retention, analytics and reports**
   (§48–50, 67–71, 75).
   *Built 7 October* (COMMUNICATION.md → Insights): one append-only
   communication log written in the transaction of each thing it records —
   messages in and out, deliveries and provider reports, rule sends,
   campaigns, announcements, opens, clicks, replies, consent — read as a
   customer's, supplier's or document's history and as the audit; what
   each message cost (account unit cost, else the channel's default; SMS by
   parts); retention by months per kind that blanks content and keeps the
   record; the `communication` analytics module (13 KPIs, 7 reports, 2
   analyses, a dashboard); global search (`/search/everything`) over the
   search index and what only the database can scope per person, with
   trigram indexes built concurrently by `npm run search:indexes`; the
   header search box and `/search` page.
9. **Video and voice meetings** (§92–99, 115–117): rooms, guest access and
   waiting rooms, chat (built 6 October, our own — MEET.md). In five parts:
   (1) *built 7 October* — our own media server (mediasoup, the user's
   choice of package): rooms of a hundred, simulcast, only the pictures on
   screen sent, the active speaker, raised hands, reactions, a host's lock
   and mute, devices; (2) *built 7 October* — access policies: anyone,
   members only, those invited, or anyone who proves their email (an
   emailed code), the waiting room, a password, an expiry, from the
   organisation's meeting settings until the host says; (3) *built 7
   October* — the meeting record: chat kept and continued after, files
   shared into the room, who came, structured notes the assistant can set
   out — chat
   kept and continued, files, notes; (4) *built 7 October* — recording,
   made in the recorder's browser (the room on one canvas, the voices
   mixed), sent in parts into a private object in the organisation's
   storage, played by short-lived links, who may record, watch, download
   and for how long from the meeting settings, swept, never deleted
   (MEET.md → Recordings); (5) *built 7 October* — transcription by the
   organisation's chosen provider (Integrations → Meeting transcription:
   OpenAI's Whisper, Deepgram, or a Whisper server of its own), from the
   voices kept beside each recording in ten-minute pieces; each line named
   by who the media server heard speaking; on the record page and into
   the AI notes (MEET.md → Transcripts). **Step 9 is complete.**
10. **AI and translation** (§65–66).
   *Built 7 October* (COMMUNICATION.md → AI assistant): the organisation
   chooses its provider in Integrations (Anthropic, OpenAI, Gemini, or any
   OpenAI-compatible endpoint) with a monthly token budget; suggested
   replies into the message box, summaries, classification applied only
   when a person says so, translation of messages (kept on them), drafts
   and templates, a meeting's notes set out and kept; every call recorded
   (`ai_runs`), held to the budget and each person's pace; automatic
   classification and translation when the organisation turns them on.
   Built ahead of step 9, whose transcription and summaries use it.

Decided 6 October: we build video ourselves — WebRTC between browsers,
our own signalling on the socket server and our own TURN relay, no
hosted video service. A room opens from its code (`/meet/<code>`); a
media server for large rooms and recording follows in step 9.

**Meet, the front door (25 October 2026, lane `feat/meet-communication`, the v5 Communication boards).** API built: room codes `<org handle>/<xxx>-<xxx>-<xx>` with the organisation's handle and eight letters and digits, no vowels or look-alikes (the user, 25 October: not words; old codes still open), Start now (`POST /meet/instant`, ringing colleagues on `live.call`, a thirty-second timeout into the Inbox's new kind `call` with Call back, decline with a message into the direct message), voice-only join, calls from a chat with the card in the thread, Take notes (a meeting with no room, the assistant drafting the minutes after the transcript, "Minutes ready" in the Inbox), the Meet page's read pushed by `live.meet-home`, permissions `meet.meetings.create` / `meet.calls.create` ([MEET.md](MEET.md#meet-the-front-door-25-october-2026-the-v5-communication-boards)). Web: the Communication module in the sidebar, the Meet page, the waiting screen, the voice-only room, the chat's Call, the ring banner, Take notes and the Inbox rows, in the web lane of the same date.

### Phase 14 — Studio: how everything the organisation sends looks *(requested 6 October; seven steps)*

Asked for on 6 October, after templates and sharing were unified: a
studio to brand templates further and to edit the documents themselves.
Templates (Phase 13 step 5) decide what is *said*; the Studio decides how
it *looks* — every email, every PDF — in one place, for the organisation
and, where it wants, per location.

What exists to build on: brand settings (logo, primary, secondary and
accent colours, a font), the PDF renderer (`sharing/pdf`: pdfmake, a
letterhead with the organisation, the location's address, the brand colour
and logo; QR code; a note at the foot), the email wrappers in
`mail-templates/*.hbs` (hard-coded, one per purpose), and templates in
plain text with variables.

1. **Brand kit.** The brand settings grown into a kit: logos (light and
   dark, square mark), colours with their contrast checked (AA), fonts
   (uploaded or chosen, embedded in PDFs), the footer facts — registered
   name and number, addresses per location, phone, website, social links,
   legal text — and the sender's display name. One source for emails and
   PDFs; per location where a branch looks different.
2. **Email layouts.** The frame around every email — header with logo and
   colour, the body, button style, footer with address, legal text and
   (for marketing) unsubscribe — designed with blocks and a live preview
   (light and dark, phone and desktop), rendered server-side to
   table-based, inline-styled HTML that mail clients show alike. The
   hard-coded wrappers (share, transactional, notification, conversation)
   become the layouts that ship; each template may choose a layout.
3. **Rich templates.** Email templates written in blocks — heading, text,
   button (to `{{link}}`), image, divider, columns, the document's lines as
   a table, a block shown only if a condition holds — still in the template
   language, still in each language, with plain text made from them for
   the text part. SMS and WhatsApp stay text.
4. **Document designer.** The PDF of each kind of document — quotation,
   invoice, purchase order, receipt, delivery note, statement — designed:
   a base layout chosen, its sections (letterhead, parties, details,
   lines, totals, payment details, notes, terms, signature, QR) arranged
   and shown or hidden, the lines' columns chosen, colours and fonts from
   the kit, text blocks with template variables, page size, margins,
   watermarks (draft, paid, cancelled), the labels in the document's
   language. Previewed with a real document; per document type and per
   location; the renderer reads the design instead of its fixed layout.
5. **Reusable blocks and assets.** Bank details, terms, a signature, a
   stamp, images — written once, used by templates and documents; stored
   with the organisation's files (Drive when it comes).
6. **Versions and publishing.** Drafts and published versions of layouts,
   templates and document designs; history and going back; a test send to
   oneself; optionally publishing through an approval policy (Phase 7's
   engine).
7. **More outputs.** Receipts for an 80 mm printer (with the point of sale,
   Phase 4.12), labels and barcodes, customer statements — designed the
   same way.

Order: after Phase 13 step 6, and before step 7 (campaigns), which need
designed emails and an unsubscribe in the footer.

*Progress, 7 October 2026.* Step 1, the brand kit, is built (STUDIO.md):
`studio.brand_kits` for the organisation and per location, contrast checked
to AA, fonts uploaded and embedded in PDFs, the details at the foot, the
name mail is sent as; every PDF's letterhead reads it. Next, step 2: email
layouts, which bring the kit to emails.

*Progress, 7 October 2026.* Step 2, email layouts, is built (STUDIO.md):
headers and footers in blocks, colours from the kit by name, rendered
server-side to table-based inline-styled HTML with dark mode and the phone
width, the logo inline; five layouts ship (the old wrappers), each kind of
email uses one, a template may choose its own; previewed light and dark,
wide and phone, in Admin → Email layouts. Next, step 3: rich templates.

*Progress, 7 October 2026.* Step 3, rich templates, is built (STUDIO.md):
email templates in blocks — heading, text, button, image, divider, space,
columns, the document's lines as a table — each in the template language
and each optionally shown only when a condition holds; the text part made
from them; drawn in the email's layout, images inline; previewed as sent.
Next, step 4: the document designer.

*Progress, 7 October 2026.* Step 4, part A, is built (STUDIO.md): the
document designer for quotations, invoices and purchase orders — base
layout (classic, modern, compact), page size, orientation and margins,
type size, colour from the kit, watermarks, the sections in order and
shown or hidden (letterhead, parties, dates, lines with their columns,
totals, payment details, notes, terms, signature, QR, text of its own in
the template language), the words in the document's language (English and
French built in; any language's own words); per kind and per location;
previewed with a real document or a sample; the PDF renderer reads the
design. Part B next: receipts, delivery notes and statements as PDFs,
designed the same way.

*Progress, 7 October 2026.* Step 4 is complete: part B prints receipts,
delivery notes and customer statements from their designs (one printable
shape for every kind, each with its own table, details, totals and — a
statement — ageing), with staff downloads for receipts and statements and
the designer offering each kind's own columns. Next, step 5: reusable
blocks and assets.

*Progress, 7 October 2026.* Step 5 is built (STUDIO.md): reusable blocks —
text in the template language or an image, per organisation and per
location — put in by `{{block "key"}}` anywhere templates are written, as
a block of an email, and as a document's signature; where each is put in
is shown, and one in use is not retired. Images are the organisation's
files until Drive (Phase 4.14). Next, step 6: versions and publishing.

*Progress, 7 October 2026.* Step 6 is built (STUDIO.md): versions of
email layouts, the layouts each kind of email uses, templates, document
designs, reusable blocks and brand kits — drafts that change nothing
sent, publishing (through an approval policy for "Studio publication"
where the organisation has one, directly otherwise), retiring as a
version, every version kept and any restored, a draft overtaken caught,
direct saves recorded (and refused under a policy), and a test send of a
draft or any version to oneself; a versions panel in every editor and
Admin → Publishing. Next, step 7: more outputs.

*Progress, 7 October 2026.* Step 7 is built, and with it **Phase 14 is
complete** (STUDIO.md): any designed document on an 80 or 58 mm till roll
— by its design, or for one print — and as ESC/POS for a receipt printer;
the document's number as a barcode; barcodes drawn in house (EAN-13,
UPC-A, EAN-8, Code 128; QR); label designs — product, shelf and shipping —
on label rolls or sheets, printed for chosen products with their prices
and barcodes, or one for each package of a delivery note; their versions
like the rest of the Studio. Customer statements were designed in step 4.
The till itself is Phase 4.12's.

### Phase 15 — Trading network and organisation customers *(written 12 October from the user's Trading Network product document, Draft 2, every question answered; ten steps)* ← **complete: all ten steps built, 12 to 14 October** ([TRADING_NETWORK.md](TRADING_NETWORK.md))

*The ask:* two businesses on Commerce trade without re-typing (a purchase
order one sends becomes the other's sales order, and so on to payment),
and a customer can be an organisation or a corporate entity as well as a
person. Decided with the user, 12 October:

- **Each organisation's directory is its own.** A customer or supplier,
  organisation or individual, belongs only to the organisation that added
  it. Adding a business that runs Commerce never links to or updates
  from its account; a partner's changes arrive, at most, as a change
  request. A clear boundary between organisations on one database.
- **Party model:** a small shared party record for identity only (kind,
  names, registration and tax numbers, addresses, verification);
  customer, supplier and CRM-account records keep their own tables and
  point to it. Added on top of today's tables; nothing rewritten.
- **No separate customer portal:** shared links, the store front's
  company accounts and the network cover it; a customer that wants more
  becomes a Commerce organisation (a sole proprietor is enough).
- **Shared document links, passwordless,** the way quotations work today,
  for every document kind in both directions: view, print, download,
  accept, propose changes, reject; suppliers record shipments, attach
  invoices, answer requests for quote, upload certificates. A one-time
  code to act; password sign-in removed. Bank and tax changes only through
  a dedicated change-request link and the supplier change control.
- **The supplier portal is an organisation setting** (suppliers vary): a
  passwordless list of what was shared.
- **Links onboard the next organisation:** "Run your business on
  Commerce" on link pages (the sender may turn it off); a partner that
  joins is offered its shared correspondence into its own books (open
  documents as drafts, closed as history), and a connection is proposed.
  Growth reporting for the platform.
- **Verification by Commerce** with a Verified tag; required documents per
  country or province; KYC, KYB and KYS of partners per organisation.
- **Auto-accept** off by default, per connection. **The network is the
  source of truth between organisations,** group members included;
  intercompany (built) builds on it. **Peppol and EDI, both.**
- **Commerce stands without the wallet system:** settlement through any
  provider the organisation chooses; the wallet product builds its own.

**Order:**

1. Party and organisation customers (sites, people, buyer limits, groups;
   billing a party with orderedBy and shipTo; open documents re-pointed by
   setting; posted documents never rewritten). **Built 12 October** (API
   and web; `TRADING_NETWORK.md`): the `party` schema, organisation
   customers with a customer record of their own, sites, people with roles
   and buyer limits (refuse / customer's approver / warn), terms with
   credit limit, hold and discount ceiling, groups with roll-up, the
   billed party / ordered by / ship to on every sales document, tax
   printing from the legal name and TIN, moving open documents by setting,
   merging, the backfill.
2. Shared document links and passwordless sign-in; the supplier portal as
   a setting. **Built 12 October** (API and web; `TRADING_NETWORK.md`,
   `SHARING.md`, `SUPPLIER_MANAGEMENT.md`): one link mechanism for every
   outward document in both directions — customers' quotations, proforma
   invoices, invoices, statements and delivery notes; suppliers' purchase
   orders, requests for quote and for documents, corrective actions,
   remittance advice, statements and a change-request link — with view,
   print and download, and acts that arrive as a message or a draft for staff
   and never post (one inbox); acting needs a one-time code to an address the
   link was sent to (the organisation's code lifetime, tries and hourly
   limit, a remembered device and for how long, a fresh code before
   sensitive acts); sessions belong to the inviting organisation and staff see
   and end them; the supplier portal signs in with a code (no password), is an
   organisation setting and per supplier, and lists what is shared; "Run
   your business on Commerce" on link pages unless hidden.
3. Joining from a link. **Built 12 October (API) and 13 October (web;
   `TRADING_NETWORK.md`):** the block asks for a single-use token tied to
   the link and sign-up reads the business and address from it server-side
   (no personal data in a URL); the organisation made from it keeps the
   claim, has the sender as its first customer or supplier (a copy), and
   is offered the correspondence shared with the address (open documents
   as drafts a person takes, closed ones as read-only history with the PDF
   in Drive); a connection is proposed once it is verified; growth facts
   for the platform; *Network → From your links*; the block is hidden by
   the *Shared links* setting.
4. Network foundation: profile, verification, connections, delivery, item
   maps. **Built 12 October (API) and 13 October (web;
   `TRADING_NETWORK.md`):** the profile (off by default), verification by
   Commerce (catalogue per country, Drive references, a reviewer queue, a
   provider slot), connections as two rows with consent on both sides,
   roles and scope per direction, pause / resume / end, codes, counterpart
   records made from the partner's profile; envelopes through the outbox
   (at least once, idempotent, ordered per document, retried, dead
   letters, a delivery log per side), the purchase order arriving as the
   seller's draft sales order; item maps; KYC / KYB / KYS partner checks
   as settings; Settings → Network, Network → Connections, documents, item
   maps, the review queue, the Connected badge. Migrations
   `1780800000000`–`500`, permissions v73.
5. Order to delivery. **Built 13 October (API and web;
   `TRADING_NETWORK.md`, step 5):** the purchase order's **order
   confirmation** back (accepted / accepted with changes — a difference the
   buyer accepts or declines — / rejected with a reason) and a **status**
   shared back (the seller's own order number on the buyer's order, as the
   `shareStatuses` setting allows); **change and cancellation requests**
   either way, shown as a side-by-side difference against the order as it is
   now, accepted (a draft sales order is edited in place; a sent purchase
   order is agreed and carried out by hand; a cancellation cancels) or
   declined, withdrawn, superseded; a **delivery note** (waybill) becoming
   the buyer's **expected receipt** (a draft goods receipt against its order,
   lines by the order's own lines then the maps); a **receipt notice** with
   differences and damage on the seller's delivery; **auto-accept per
   connection** (off; fully mapped and within credit; as a draft or
   confirmed); the "Order on the network" panel on the purchase order, sales
   order, waybill and goods receipt. Each is an envelope with the step-4
   guarantees. Migration `1780900000000`; no new permission.
6. Invoice to cash. **Built 13 October (API and web;
   `TRADING_NETWORK.md`, step 6):** the seller's **invoice** arrives as the
   buyer's **draft bill**, lines matched to the purchase order's and held to
   the order and the goods received (the **three-way match**: quantity and
   price tolerances, the basis and whether a mismatch blocks, as document
   settings on supplier invoices; a bill cannot be submitted or posted past a
   mismatch unless a person holding `network.bills.override` releases it with
   a reason, which covers exactly those mismatches); **disputes** (a reason,
   lines, a conversation, an owner on each side; resolved by a credit note, a
   corrected invoice, an explanation or withdrawn); **credit notes** arriving
   as draft supplier credits against the bill; **returns** from the goods
   receipt (authorised with a number or declined, goods back, the credit note
   made from the return); **remittances** naming the invoices a payment
   covers, offered for allocation of the matching receipt (allocated by a
   person, or by the rule only when exactly one receipt matches); **mutual
   statements** with both ledgers side by side (matched, differing, one side
   only, in transit, disputed); what is sent on posting as settings (off).
   The "Invoice to cash on the network" panel on the invoice, bill, credit
   notes, payment, goods receipt and sales order; Network → Disputes,
   Returns, Payment advice, Statements. Migration `1780950000000`, permission
   seed v75 (`network.bills.override`).
7. Group companies on the network. **Built 13 October (API and web;
   `TRADING_NETWORK.md`, step 7):** a **group** is the set of organisations
   one person owns, and that owner's consent connects the members: formed by
   an owner (its head), a company added only by someone who owns it too
   (checked in the company's own scope), each organisation holding its own
   row of the group and the roster, kept in step by signals; every pair of
   members that can be found (network on, verified) is **connected without a
   handshake** — active both ways, everything the network carries, customer
   and supplier records made — and a connection the pair already had is
   adopted, not doubled; it cannot be ended on its own while both are in the
   group; leaving, removal and dissolving never take the history (connections
   stay as ordinary ones). **Intercompany takes its matching and
   eliminations from network documents:** the finance link opens by itself
   for members with books, the group's statements are asked in both books,
   and the **elimination schedule** gives what both sides booked alike
   (invoices, credit notes, payments), what stops a pair agreeing and what
   is in transit, with a tolerance setting and a CSV; nothing is posted.
   Group settings (auto-accept, auto-send, statements answered, tolerance,
   the finance link); notices for the group; **notifications for the
   network's records** (the `NetworkNotice` subject, 24 presets, links that
   open the record: `NOTIFICATIONS.md`). Migrations `1781100000000` (notices)
   and `1781110000000` (groups), seed v78 (`network.groups.view|manage`).
8. Catalogues, RFQs and shared documents. **Built 13 October (API and
   web; `TRADING_NETWORK.md`, step 8):** four kinds of envelope on the
   step-4 guarantees. **Catalogues and price lists** a seller publishes to
   chosen connections as versions (priced from its price books at a place,
   in a currency, from the list or wholesale price, with a discount,
   validity and named prices; what cannot be priced is left out and
   reported) arrive as the buyer's **supplier catalogue** with every item
   *suggested* against its own items (a person confirms; its items are never
   written), prices **adopted** into the supplier's items and price list as
   new versions, and **punch-out** into a draft purchase order priced by
   quantity breaks that the seller checks against the version it came from;
   **requests for quote** put on the network for chosen suppliers (invited
   as any supplier is) arrive as the seller's request and **draft
   quotation** (matched, priced from its books, the lines that matched none
   listed to match), answered as the buyer's **quote response** beside the
   other suppliers' in the comparison (revisions withdraw the earlier;
   closed requests refuse a late quote with their reason; a refusal to quote
   carries a reason), with awarded / not awarded / closed told back;
   **shared documents** (certificates, specifications, contracts) copied
   into the receiver's own Drive as a record of its own, reviewed (accepted,
   or rejected with a reason the sender is told), filed into supplier
   compliance, renewed as versions, withdrawn, asked for and answered;
   reminders before catalogues and documents lapse and before a request
   closes; 20 notice kinds and 12 presets; settings; events. Migrations
   `1781250000000`, `1781260000000`, `1781270000000`; seed v81
   (`network.catalogues.*`, `network.documents.*`).
9. Peppol and EDI. **Built 13 October (API and web; `TRADING_NETWORK.md`,
   step 9):** partners outside Commerce are connections of the
   organisation's own (origin `external`) reached through a standard:
   **Peppol BIS Billing 3.0** (UBL invoices and credit notes, Order, Order
   Response, Despatch Advice; Message Level and Invoice Responses read) and
   **EDI** (EDIFACT ORDERS, ORDRSP, DESADV, INVOIC, REMADV; X12 850, 855, 856,
   810, 820; CONTRL, 997, 999), every standard converted to and from one
   neutral document, so an order in any of them is the same **draft sales
   order**, an invoice the same **draft supplier bill** under the step 6
   three-way match, and a changed order a change request. Own XML, EDIFACT
   and X12 parsers and writers (no new package; a DOCTYPE is refused), the
   EN 16931 and Peppol rules re-implemented (120 identifiers; **not the
   official schematron and not a certification**), participant identifiers
   with check digits, SMP lookup (advisory), trading-partner profiles,
   transports as a port (a Peppol access point as an integration slot with a
   sandbox adapter and a Storecove adapter **written from public
   documentation, unverified against a live account**; the organisation's
   own HTTPS gateway; a person carrying the file; a sandbox) — **AS2, SFTP
   and VAN are not built** (they need S/MIME and SSH libraries), nor the
   country mandates (CFDI, NF-e, DIAN, FIRS; the seam is documented).
   Every file kept exactly as it came, read once however often it arrives,
   acknowledged, retried with the same bytes and dead-lettered; the message
   log, plain-words problems with where each is put right, *check before
   sending*, upload of a file received outside Commerce, unknown senders
   assigned by a person; 4 notice kinds and 2 presets; 6 settings;
   permissions `network.exchange.view|manage` (seed v85); migration
   `1781450000000`.
10. **Netting and reports** *(built 14 October, API and web)*. Two
    connected organisations offset what each owes the other, **per
    currency**, into one net settlement: a proposal either side raises
    (documents named by the issuer's own id, held so no other netting takes
    them, disputes and anything after the cut-off kept out), checked against
    each side's own books, **agreed by both** to the same terms (a
    fingerprint), counterable, declinable and withdrawable (crossed answers
    settle), posted by each side **in its own books through the finance
    posting roles** (one entry for each currency, never silent: a changed
    document or a closed period stops it with the reason) and taken back
    exactly until the other side posts; the net payment advised as a
    remittance that names the netting; a converted net only when both agree
    the rates; multilateral netting across a group through a **netting
    centre** (the head calls, each company reports and agrees its leg
    against the centre, the centre announces the go-ahead). The two gaps step
    7 left: the group's **consolidated intercompany schedule** (a
    `group-statement` envelope each company sends the head, every pair
    reconciled from two reports the head holds, partial where a company has
    not reported, eliminations proposed to the consolidator) and optional
    **posting of group trade to the due-to / due-from accounts** (a group
    setting; flagged documents follow it for life; the period-close control
    check and the intercompany balances account for it). **Reports**: trade
    with each partner over time, days to pay and be paid, disputes and
    returns, on-time and in-full delivery, orders taken without a person,
    envelope delivery health — from the `network-activity` projection (two
    read models, recomputed not accumulated), three dashboard widgets and
    the platform's growth figures for the Commerce Console. 20 notice kinds
    and 5 presets, 11 netting settings (`netting`) and two group settings,
    permissions `network.netting.view|manage|approve` and
    `network.reports.view` (seed v88), migrations `1781600000000`,
    `1781610000000`, `1781620000000`. Limits: the schedule's eliminations
    are a proposal, not postings; group-trade flags only for documents
    posted after the setting; reports' months are UTC; analytics report
    definitions were not added (the page and widgets read the read models).

### Phase 16 — Commerce AI *(written 12 October from the Commerce AI product document, every question answered; ten steps)* ← **steps 1 and 2 built, 13 October; the assistant (steps 4, 6, 7 and 8 together) built, 14 October; step 3 built, 17 October; step 5 built, 17 October; the v3 D boards' API (Assistant and Capture) built, 25 October** ([COMMERCE_AI.md](COMMERCE_AI.md) §19)

Commerce's own AI as a separate Python service, `commerce-ai`
(`~/SoftwareProjects/commerce-ai`, port 8160), behind the existing `ai`
integration slot as its default provider; open models hosted by us (Llama
through Ollama now, behind a gateway), the organisation's own provider welcome
for the language-model step; never trained on an organisation's data unless it
opts in. Build order (product document §12):

1. **The service foundation** *(built 13 October)*: the layered, command/query
   service; the model gateway; metering with the budgets an organisation sets;
   tenancy enforced once per store; the ERP's signed tokens; events over Kafka
   behind an outbox; health, metrics, logs; the evaluation harness and a first
   labelled set (30 drawn documents in Nigerian English, Spanish, Portuguese
   and more).
2. **Capture: bills and expense receipts** *(built 13 October)*: from upload,
   camera and Drive files; OCR, extraction with a confidence for each field,
   coding suggested from the organisation's own history, duplicate checks; a
   review screen where a person confirms into a **draft** supplier bill or
   expense claim through the ERP's own code; originals kept in Drive; the
   inbox, notifications and "Create from this file" on Drive.
3. Capture: every form, and the Capture inbox with email. *(built 17 October: one contract for each of fourteen
   kinds of document (bills and receipts, purchase orders, delivery notes, customers' orders, requests for
   quotation, tellers, customers, suppliers, products, assets, journal vouchers, count sheets, transfer notes);
   "Fill from a document" on the forms that make them, nothing saved until the person saves; the Capture
   inbox for uploads, Drive files, forwarded email (a per-organisation capture address, sender rules, attachments
   and the message's words) and Drive document inboxes, classified, matched to the organisation's own records,
   checked for duplicates, a draft in one click or by itself when the organisation allows and the reading is
   sure; settings, live updates, measures and a full audit trail. Left: Cypress, e2e and the sweep (the test
   lane), WhatsApp and the other channels (step 5).)*
4. Voice: recorded notes and live dictation. *(built 14 October with 6, 7 and 8 as one assistant: a voice
   note of a meeting becomes minutes, decisions, next steps and draft documents; recorded in the web app
   or uploaded; live dictation and WhatsApp-forwarded notes are not yet.)*
5. Messaging channels: WhatsApp, Instagram and Messenger, Telegram, TikTok. *(built 17 October: each platform an
   adapter (WhatsApp Cloud API, 360dialog, Twilio, Instagram, Messenger, Telegram, TikTok) with signatures checked,
   an idempotent ledger and a queue; the sender known as a colleague (a one-time code), a customer or supplier (the
   number) or nobody; pictures and PDFs into the Capture inbox (and the colleague told when they are read), the
   assistant in a chat for linked colleagues (voice notes, answers shaped for a phone, Confirm in the chat, with their
   own permissions), customer conversations in the inbox with the platforms' reply windows, approved WhatsApp
   templates, opt-out/in and the sending gate; a sandbox for every provider; settings, measures, audit, live updates.
   [MESSAGING.md](MESSAGING.md). Left: Cypress, e2e and the sweep (the test lane); a first connection of each real
   account (what each needs is in MESSAGING.md §2); TikTok's field names to confirm on an approved app.)*
6. Knowledge: indexing, retrieval, permission checks, the chat panel. *(built 14 October: the chat page and
   drawer, documents and records indexed by meaning, shown only to who may open them.)*
7. Reports on request. *(built 14 October: report definitions run as the person; table and chart; save as a
   report and pin to the dashboard.)*
8. Act: MCP tools completed for every module; drafts, plans, confirmations, audit. *(built 14 October for the
   assistant's documents: quotations, sales orders, purchase orders, requests for quote, tasks, calendar,
   messages; drafts are made, anything that reaches people waits for the person; every call audited. "Every
   module" continues as tools are added. **Built 1 November 2026:** the
   tools are now every API route, not a list kept by hand (about 3,950; the assistant walks them through a module →
   record type → operation tree with hybrid search, the vectors kept in commerce-ai and pushed by the ERP), the
   assistant speaks MCP 2026-07-28, long work comes back as tasks by push, and the tool-choice evaluation
   (full list, BM25, hybrid, hybrid + tree) is written. Left for the full application test: the evaluation's
   numbers (the default path stays the tree until they say otherwise), live clients, and the e2e and Cypress runs.)*
9. The training loop: fine-tuning, per-organisation learning, opt-in data, release gates.
10. The phone app: capture and voice on the move, offline queueing.

**The v3 D boards' API (Assistant and Capture, 25 October 2026, `feature/assistant-capture-api`).** Every API need of
the seven boards (`erp4d-assistant-chat`, `-meeting`, `erp4d-phone-assistant`, `erp4d-capture-inbox`, `-empty`,
`-review`, `erp4d-phone-capture`; package `design-handoff/feature-inventory/assistant-capture.md`): each
conversation's digest (its list row's line, the drafts waiting for its owner) and the top bar's count
(`GET /assistant/attention`), pushed on `/live`; next steps tied to the drafts they became; speakers named on the
transcript and on each draft's source; recordings' origin, title and the organisation's `recordingRetentionDays`
(nightly to Drive's trash); the capture review in words (`checkReasons`, `checksPassed`, supplier since), how far a
reading has got, what to do when it failed, how it came (WhatsApp by name, filterable), the inbox's tab numbers and
attention band from the `capture-inbox-counts` read model (`GET /capture/inbox/counts`, pushed), the measures against
the period before, and the empty inbox's address, allowance and estimates. Lint and unit run; e2e, drill steps and
sweep fixtures written, not run. Left: page-by-page progress (needs Commerce AI), the web screens (web lane).

### Document lines *(asked 14 October 2026; built 16 October on `feat/document-lines`)*

One lane, four steps. **1–2 built:** a currency or a country is chosen, never typed — `ui-currency-select` and `ui-country-select`, member-level `GET /currencies/options`, a global pipe holding every currency and country in a request body to the organisation's currencies and ISO 3166, `npm run check:inputs` as the guard (55 inputs replaced). **3 built:** purchase pricing (`purchase-pricing` settings: locked | within limits | noted | free against the supplier's price list) on requisitions, quotes, orders and bills; the supplier price-list settings moved into it. **4 built:** service items on every document line (migration `1782550000000`), posted to the service's income or expense account with no stock movement, one line picker. Remaining: see the lane's report ("Deferred tests"; the portal's other currency screens; the assistant's draft tools do not yet offer a service). **Finished 18 October (`feature/document-lines-2`):** `POST /purchase-pricing/resolve` and the buying forms' list-price hints (order, requisition, quote entry, bill); a service named by a project billing item, a shop add-on or an order add-on counts as in use (usage sources can say their rows are hard-deleted); `test/document-lines.e2e-spec.ts`; the bookings offer currency is a picker (`check:inputs` passes).

### The shared booking engine *(asked 16 October 2026; built on `feat/booking`)* ([BOOKINGS.md](BOOKINGS.md))

One engine for rooms, tables, staff, equipment, vehicles and spaces; industry packs (hotels, restaurants, salons, hire) sit on top. Steps: 1 resources, offers, rates, hours and availability (**built 16 October**); 2 reservations, deposits and policies (**built 16 October**); 3 public booking pages and messages (**built 16 October**); 4 staff screens (timeline, day sheet, list, setup) (**built 16 October**); 5 live updates and documents (**built 16 October**). Left: stubbed and live Cypress, e2e route specs and the tenancy sweep for the new routes (the test lane), SMS/WhatsApp messages, a channel manager.

### Industry packs and the restaurant pack *(asked 15 October 2026; started 16 October on `feat/restaurant`)* ([INDUSTRY_PACKS.md](INDUSTRY_PACKS.md), [RESTAURANT.md](RESTAURANT.md))

One core, packs on top (Industries document). **The kernel** (**built 16 October**): a location's kind, the packs an organisation and each place carries, the feature resolver the API, the web menu and the tills read, the pack's words (Products are Dishes), the installer hook. **The restaurant pack**, seven steps: 1 the kernel (**built**); 2 the floor plan and tables, as booking resources, with live table states from the till (**built 16 October**); 3 menus, option groups, hours and "86" (**built 16 October**); 4 table service on the till (Go service and web till) (**built 16 October**); 5 the kitchen display, with stations and routing here (**built 16 October**); 6 recipes, stock taken when a dish is sent, waste, dish cost and margin (**built 16 October**); 7 the measures: covers, spend, table turns, kitchen times, voids, comps and waste, as KPIs and reports (**built 16 October**). The Kotlin till follows (what it needs is in RESTAURANT.md). **Follow-ups** (answers of 17 October, **built 17 October**): live updates on the shared `/live` socket (the till's SSE stream retired); a recipe dish must be Non-Stock (PRD enforced at save, with a Dish costs flag and an audited one-click fix); the kitchen's behaviour on short stock is a setting (allow and flag, warn, block, auto-86); prices by order type and by time of day; set menus; tip pools shared by role and hours and paid through payroll or in cash; a sent dish moved between tabs keeps the kitchen's ready state. Left: the test lane (e2e routes, tenancy sweep, Cypress, Playwright) and the Kotlin till.

### Pack versioning, memberships and events *(asked 18 October 2026; on `feature/packs-versioning-memberships-events`)* ([INDUSTRY_PACKS.md](INDUSTRY_PACKS.md), [MEMBERSHIPS.md](MEMBERSHIPS.md))

The industry-pack foundation and the first shared pack modules after the booking engine and projects (Industry Catalogue answers of 15 October). 1 **The pack kernel** (**built 18 October**): the installed version per organisation and per place, a record of who set each stored setting (so an upgrade changes only the defaults nobody changed), upgrade preview, apply and undo for 30 days, the organisation's own words, an open list of place kinds, and Settings → Industry packs (cards, place grid with a three-way menu, preview, upgrade drawer, words) per the three boards. 2 **Memberships and subscriptions** (**built 18 October**): plans, members with a card, freezes, billing runs checked before any invoice (on the recurring invoice's own engine), access and check-in, and contracts and retainers over Projects; the `memberships` pack. 3 **Events and ticketing** (**built 18 October**, [EVENTS.md](EVENTS.md)): events with sessions and ticket types, a seating plan whose tables are held while a buyer pays, one sale for the desk, the door, an invoice, the till and the storefront (claimed atomically, a retry is one sale), QR tickets signed by the event, the gate (a ticket gets in once; a replayed scan is recorded once), refunds, sponsors and venues; the `events` pack. Left: the test lane (the written e2e specs, drills, tenancy fixtures and stubbed Cypress are run by CI), the Console's pack editions, card-on-file charging (real rails), the offline door scan (mobile phase).

### The remaining industry packs *(asked 25 October 2026; on `feature/industry-packs-rest-api`)* ([INDUSTRY_PACKS.md](INDUSTRY_PACKS.md))

The packs of RECOMMENDATIONS-F §2 and §5–§14, each its own module over the engines already built (booking, recurring billing, projects), a package in `design-handoff/feature-inventory/<pack>.md`, and its own migration and permission seed in `1790400000000`–`1790999999999`. Shared for all of them: `PackModuleEvents` (the outbox announcer), `PackInvoicer` (module `pack-billing`, the one invoice path) and `database/helpers/pack-tables.ts` (schema, RLS policy and grants).

1. **Accommodation** (**built 25 October**, [ACCOMMODATION.md](ACCOMMODATION.md)): front desk and room rack over the booking engine, housekeeping, folios from every outlet (append-only lines, a room night once, charge to room once), rates with seasons and special dates and the try-a-price quote, Commerce's own channel connections with a retrying queue, the night audit.
2. **Field service** (**built 25 October**, [FIELD_SERVICE.md](FIELD_SERVICE.md)): dispatch by technician and hour with the double-booking refusal, jobs as project tasks with their service side, versioned checklists answered step by step, parts issued from the van, photos and the signature, finishing with a payment or the invoice on site, time on site logged, follow-ups raised by a broken limit, technicians on the map, service areas.
3. **Client records** (health-data standard) (**built 25 October**, [CLIENT_RECORDS.md](CLIENT_RECORDS.md)): to the health-data standard: a client list with nothing clinical, records opened deliberately (treating, a reason, broken glass) with a short-lived token that locks, clinical fields sealed with the organisation's own key (envelope encryption, a KMS port), consent as versioned records that block what needs them, an append-only access log written with every read and calm flags, signed notes sealed, data requests on a 30-day clock, the retention rule; no default role but the owner carries clinical access.
4. **Rentals** (**built 25 October**, [RENTALS.md](RENTALS.md)): items counted by their units (a unit never held twice: a database constraint), the calendar and the quote, reserve, hand-out by tag scan with photographed and signed condition and the deposit held, return with damage proposed for staff to confirm (the unit off the calendar until mended) and the late fee, returns due with the fee so far, settling on the ERP's invoice with the deposit taken off and the rest refunded.
5. **Product configurator** (**built 25 October**, [CONFIGURATOR.md](CONFIGURATOR.md)): option sets on products (a choice, a number, yes or no), values that change the price (fixed or a percent) and add BOM lines with formula quantities in a small safe language, rules (not allowed, adds, needs, time) in plain sentences and checked when written, Try it with the price line by line, cost, margin, BOM with stock and lead time, configurations saved as the exact values on the product version (read through ReadStore), several put on one ERP quotation whose lines keep the configuration id. Not yet: a work order from a confirmed order with the configuration's BOM.
6. **Courses** (**built 25 October**, [COURSES.md](COURSES.md)): courses of video, reading, quiz and live lessons for staff (from HR) and customers (invoiced, held until paid by a setting), watch progress the server bounds by time, quizzes drawn from a bank with a pass mark and retakes a gap apart, finishing with a numbered certificate that runs out and verifies (a staff member's on their HR record as compliance training), the learners board with states worked out for today and where people stop; courses and enrolments read through ReadStore.
7. **Fundraising** (**built 25 October**, [FUNDRAISING.md](FUNDRAISING.md)): donors (the donor role on a customer, groups for today, the card with the suggested ask), gifts with their fund and pledges paid by them (reminders within the send limits), campaigns with goal, giving page, projection and budget, grants through their pipeline with payments and reports, restricted money spent only on its lines within what came in, numbered tax receipts per gift or yearly in the organisation's words, voided and replaced; the overview with what needs doing; five read models through ReadStore.
8. **Distribution** (**built 25 October**, [DISTRIBUTION.md](DISTRIBUTION.md)): routes with customers by weekday and vans (each a moving location), a van's day (loaded, out, each stop's sales, payments and empties as the phone syncs, a delivery over the customer's empties limit held unless empties come back), settling against what is counted (cash within a tolerance clears, the rest to the driver's account for a manager), the empties ledger by type with deposits and the oldest crate, and 3PL storage by pallet place a day with receiving, sending, insurance and the minimum, invoiced per client; van loads and customers' empties read through ReadStore.
9. **Construction** (on Projects) (**built 25 October**, [CONSTRUCTION.md](CONSTRUCTION.md)): contracts on projects with stages (a milestone each may be) and variations, the month's valuation measured, valued, approved and certified into the customer invoice (worth to date less retention less certified before; VAT and WHT on the certificate), retention released at completion and after the defects period, the site diary signed off and locked, snags by unit, trade and subcontractor with the plan, subcontractors' papers blocking a payment certificate unless an exception is logged, and the supplier bill (`PackBiller`).
10. **Property** (**built 25 October**, [PROPERTY.md](PROPERTY.md)): properties, units and owners; leases signed into a rent schedule by month, quarter or year with the caution deposit, agency fee and notice, renewal by dates (reminded, offered with a rise, accepted into the next lease); the rent roll with lateness and the landlords' statements paid out by a supplier bill; inspections room by room against the last with deductions, the tenant's answer and the deposit settled; tenants' requests waiting for the owner over their limit and charged to the tenant, landlord or owners' fund; owners' levies by a rule with spending held to the budget and to what was collected; a daily sweep that invoices rent ahead and ends leases.
11. **Classes and check-in** (on Bookings) (**built 25 October**, [CLASSES.md](CLASSES.md)): class types and classes (once or weekly) with places and the week coloured by places left, bookings on a plan (the memberships entitlement) or a class pack's credits or as a drop-in, free cancels until a set time and credits kept for late cancels and no-shows, the waiting list's first offered a place for a set time (a delayed job lapses it and offers the next), check-in through the memberships desk's one use case counted once, class packs sold as credits, teachers' pay by class and attendee.

Left for every pack: the test lane (written e2e specs and tenancy fixtures run by CI), the web screens (another lane).

**The last gaps before the full test round (25 October, `fix/last-gaps-1025`).** Courses: the player reads the course a
learner is enrolled on (`GET courses/me/learning/:enrolmentId` under `courses.learn`, scoped by the enrolment, no
questions or answers; COURSES.md). Fundraising: the Finance receipt picker `GET fundraising/lookups/receipts` under
`fundraising.gifts.record`, and a gift's `arReceiptId` checked (FUNDRAISING.md). Procurement: a new purchase order
pre-filled from item and quantity (`lines[]` on the create, `GET purchase-orders/prefill?lines=…`; PROCUREMENT.md
"Pre-filled orders"). Tests: the remaining `body.payload ?? body` hedges on enveloped routes read `body.payload`.
### The farm pack (Agriculture) *(package 24 October 2026; phase 1 built 25 October on `feature/farm-phase-1`)* ([FARM.md](FARM.md))
### The farm pack (Agriculture) *(package 24 October 2026; phase 1 built 25 October on `feature/farm-phase-1`, phases 2–7 on `feature/farm-phases-2-7`)* ([FARM.md](FARM.md))

Seven phases from `design-handoff/feature-inventory/farm.md` (33 boards `erp4e-*`): 1 **pack, set-up, fields, crop plans, seasons** (**built 25 October**: the pack and installer, farms and what they farm, the farm settings, the maps slot, fields with boundaries measured on the ellipsoid and soil tests, versioned crop plans with cost a hectare, seasons from a plan with budget and plan against actual); 2 tasks, calendar, work and piece rate (**built 25 October**: tasks from the plan, piece work with sign-off feeding the season and payroll once, the weather slot and the calendar's spray rule, the farm home and attention); 3 inputs, withholding, scouting (**built 25 October**: products' farm profiles, inputs issued at stock cost with their waiting period and weather copy, the register and auditor's file, scouting with check and assign); 4 batches, animals, vaccinations (**built 25 October**: batches against a goods receipt with their measures, daily records, eggs graded into stock, shots with withdrawal blocking sales, schedules, animals by tag); 5 harvest, lots, traceability (**built 25 October**: loads into lots, drying as a loss, release by type transfer, trace, recalls, storage checks, grade prices, the public snapshot); 6 costs and profit (**built 25 October**: machinery, the daily accrual, valuation at market or cost, the profit report five ways with projections, closing a season, BI reports; the ledger's dimension tagging open); 7 outgrowers, collection, payment runs, cooperatives, satellite and key-based providers (**built 25 October**: growers as parties with contracts, inputs on advance with approval over the limit, collection with moisture rejection, payment runs netting advances once a period into AP bills, cooperatives' pooled sales, OpenWeather and Tomorrow.io, the satellite slot and imagery job; the produce GRN open; the private statement link built 25 October on `fix/farm-api-gaps`). **Gaps closed 25 October** (`fix/farm-api-gaps`): a season's shortfall as a draft purchase request (A30), lookups under farm permissions (items, machines, places, sales documents), scouting photos through Drive with short-lived links, the grower statement's passwordless link. Left for phase 1: the written e2e spec and drill run with the other lanes; web screens (web lane).

### Phase 17 — Projects and timesheets *(shared module, asked 16 October 2026; five steps)* ← **built, 16 October 2026** ([PROJECTS.md](PROJECTS.md))

The first shared module for the service industries (agencies, consultancies, construction, IT services, architects, event organisers, field work). **One project table**: manufacturing's `manufacturing.projects` family of tables is the project for services too (a `family` column), so there is no second project concept; manufacturing keeps its plant, production and deliverables.

1. **The project** — customer, manager, team, dates, budget in hours and money, billing type, lifecycle with gates, board columns, templates, Drive workspace, ledger Project dimension, permissions, events. *Built.*
2. **Tasks and milestones** — a board and a list, sub-tasks that roll up, finish-to-start dependencies, checklists, comments, files, milestones with acceptance. *Built.*
3. **Time and timesheets** — entries by hand, timer and import (the timeclock's job time), costed at the person's rate, weekly timesheets through the approval engine, locked once approved. *Built.*
4. **Money** — invoices from approved time, the schedule and costs as SERVICE lines, retainers and prepayments, profitability, budget burn and forecast, six KPIs. *Built.*
5. **Screens, live, docs** — projects, a project's tabs, my tasks, my timesheet, approvals, settings; everything live. *Built.* Left: Cypress, e2e and axe (deferred to the test lane), notifications for assignment and mentions, a retainer-period job.

### ERP shell, Inbox and Appearance *(asked 18 October 2026; built 18 October on `feature/erp-shell-inbox`; API and web)* ([APPEARANCE.md](APPEARANCE.md), [APPROVALS.md](APPROVALS.md), [ENGAGEMENT.md](ENGAGEMENT.md))
- **Appearance** (`modules/tenant/appearance`): the organisation's colour mode (light, dark, black, device), density and font for everyone and whether people may choose their own, each person's choices, and brand tokens derived from the Studio brand kit's primary colour behind a contrast guard (`GET/PUT /appearance`, `GET/PUT /me/appearance`; `admin.appearance.manage`; migration `1788100000000`, seed `1788100000001`). Mobile reads the brand from `/me/appearance`.
- **Page visits** for Recent and Suggested in the menu and Go to page (`engagement.page_visits`, `POST/GET /engagement/page-visits`; migration `1788100000100`).
- **`InboxChanged`**: approvers hear on `/live` when a request is decided or withdrawn (so a row leaves their Inbox without a refresh), from `ApprovalEngineService.decide` and `.cancel`, through the one expansion of "who is asked" (`approversOfSteps`). The Inbox feed itself (`GET /me/inbox`) is mobile Part A, task A4.
- **Mobile phase 2 ERP** (**built 30 October** on `feature/mobile-phase2-erp`, lane A of the phone's App shell and everyone; [MOBILE.md](MOBILE.md), [RECORDS.md](RECORDS.md)): a decline needs a reason and the requester hears it; the approval detail's facts, money and "decided so far"; the records module (follow, comments with @mentions, history, glance; quotations first) with followers and mentions in the bell; Home's counts by area, labelled record pins and `GET /me/drafts`; search totals, status and money on hits and tickets; the Assistant about a record; "Open on a computer"; and the route contract with an `offline` flag on every write. Left: the commerce-ai service must accept `about` on a message; run migrations `1788002000000`–`200` on dev; live proofs in the test round.
- **Mobile phase 3 ERP** (**built 31 October** on `feat/mobile-p3-erp`, lane A of the phone's sales, customers and money; [MOBILE.md](MOBILE.md), [RECORDS.md](RECORDS.md)): the sales form's items, price-draft and seed; a quotation straight to an invoice; list rows that say their status, next step, quick actions and days late; customer tabs the ERP reads (new, lapsed, leads) with city, stage and late days; the deal board with owners and lost reasons; the payment run's bills, a transfer's preview, the cash summary and the VAT position with the filing day; a claimant's own receipt read by the organisation's AI and taken back; and the route contract of 200 routes with response DTOs. Left: run migrations `1792410000000`, `100` and `200` on dev; the full test round; live proofs.

### Screens rebuilt from the v3 boards: buying, suppliers, payables, products, inventory, network *(asked 18 October 2026; built 18–19 October on `feature/screens-buy-products-stock`; API and web)* ([PROCUREMENT.md](PROCUREMENT.md), [SUPPLIER_MANAGEMENT.md](SUPPLIER_MANAGEMENT.md), [CATALOGUE.md](CATALOGUE.md), [STOCK_PLANNING.md](STOCK_PLANNING.md), [STOCK.md](STOCK.md), [TRADING_NETWORK.md](TRADING_NETWORK.md))
- **Procurement** (overview, purchase orders with Late and a four-step standing, receiving and returning as drawers, the quote comparison), **Suppliers** (the register with tabs and a row that says whether you can buy, the card a name opens, the page in six groups, the new-supplier drawer), **Payables** (overview, bills with the match, the bill's verdict, Pay suppliers as one drawer), **Products** (list with tabs and a card, the page and its variant drawer, Add an item as a drawer, units with a conversion, prices with a re-price preview), **Inventory** (Reorder levels, Order what needs it, Transfers, Stock counts with a phone count and blind counts, Stock classes), **Network** (an overview, Received documents, a connection's figures and what travels).
- Nothing was removed: every old control has a place (`design-handoff/feature-inventory/*.md`). The existing Cypress specs were re-pointed at the new screens and the live specs follow.
- Left: Any-match filter on bills (the match is not stored), overriding a match, bank balance and early-payment discount in Pay suppliers, withholding-tax rules there, the statement-mismatch "needs you", blind counts by role, the phone count's unit toggle and bin, a `network.overview` push.

### Finance boards: what the twelve v3 finance boards need from the API *(asked 24 October 2026; built 24–25 October on `feature/finance-api-needs`; API)* ([FINANCE.md](FINANCE.md#the-rebuilt-boards-25-october-2026))
- Package: `design-handoff/feature-inventory/finance.md` (A1–A8, acceptance 1–112). Built: chart balances, posting counts and type totals (A1) and where an account is used (A2); the journal's attention counts and status tabs (A3); close-checklist items that say where to fix them (A4); posting kinds by area with their refused counts (A5); currencies with rate, age, 30-day change and exposure with a projected revaluation (A6), and every currency's rate trend in one read; recurring journal entries as a schedule kind, migrated from `finance.recurring_journal`, with the next 30 days (A7), Make it recur and Post what is due; the profit and loss not-posted band, projection and comparative rows (A8); Check before you send, the effect card, Send back with a required reason; live updates for accounts, currencies, rates, fiscal years and periods.
- Decisions (by recommendation): one combined recurring list through the schedules engine (question 1); View ledger opens the general ledger report for the account, a web concern (question 2); posting areas sales, purchases, stock, tax, cash, payroll, assets, production, group (question 3). Post what is due is up to today, never ahead. Migrations `1789700000100`–`1789700000500`.
- Tests: unit specs run; `test/finance-boards.e2e-spec.ts` and the finance drill's new checks written, run with the full suite.
### Sales follow-ons from the v3 boards: campaigns, support, messages, messaging, announcements, sending *(asked 25 October 2026; API built 25 October on `feature/sales-follow-ons-api`)* ([COMMUNICATION.md](COMMUNICATION.md#the-v3-boards-campaigns-announcements-messages-sales-follow-ons-25-oct-2026), [CRM.md](CRM.md#support-tickets-for-the-v3-boards-sales-follow-ons-25-october-2026), [MESSAGING.md](MESSAGING.md), [NOTIFICATIONS.md](NOTIFICATIONS.md#the-sending-screens-tiles-what-and-to-whom-the-limits-dry-run-25-october-2026))
- Every API need of the fourteen boards (`design-handoff/feature-inventory/sales-follow-ons.md`): tickets numbered, owned, due, linked, counted and in context, with the pushed `crm.support-tickets` summary and the unowned-critical alert; campaign list facets and row figures, unsaved estimate and preview, audience facets and the `communication.campaigns` summary; unsaved announcement estimate, critical always acknowledged, the feed's publisher and acknowledgements, the `communication.announcements` summary; typed document references in messages resolved per reader; chat accounts' connection in words and tab counts; the sending day's tiles, subject and recipient name, the limits' dry run and the `communication.sending` summary.
- Migrations `1790200000100`–`1790200000400`. Left: the web lane builds the screens; the written e2e, drill steps and sweep fixtures run after every lane; announcement attachments (Drive reader rule for recipients); the campaign tiles' month in the organisation's zone.
### Billing, Help and the personal pages from the v3 boards (API) *(asked 25 October 2026; built 25 October on `feature/billing-help-personal-api`)* ([BILLING_HELP_PERSONAL.md](BILLING_HELP_PERSONAL.md), [CONSOLE.md](CONSOLE.md), [NOTIFICATIONS.md](NOTIFICATIONS.md), [ACCESS.md](ACCESS.md), [AUTH.md](AUTH.md)) ← **API built for all 11 boards**
- **Billing**: meters in words, the month projected to its end by the adapter, this month against the last invoice, an invoice's line reasons, billed to, the PDF, "I have paid by transfer" (a note and a Help case). Pay links stay null until the real rails.
- **Help**: the guide and `GET /help/suggest`, diagnostics the person left ticked, state words, a keyset case list with counts, live cases, the Console's case push; looks and changes on support access.
- **Personal**: Account settings in one read; leaving an organisation and closing an account after 14 days (the old "Delete account" mock made real; nothing deleted); `password_changed_at`; the photo; "Ask HR to change something" with HR's answer; the user menu's counts; notification settings by area and kind of document, honoured by delivery.
- Migration `1790100000000`; no new permissions. Left (named): the Console's projected figure, pay link and case push; fonts beyond System and Manrope; the Assistant's "ask a person".

### Engagement, the boards' API needs *(asked 25 October 2026; built 25 October on `feature/engagement-api`; API)* ([ENGAGEMENT.md](ENGAGEMENT.md))
- Package `design-handoff/feature-inventory/engagement.md`: the 15 engagement boards mapped to the API, what each still lacked, built here.
- **What's new**: the dot and New as two marks (`POST /engagement/whats-new/opened`, migration `1790300000000`), Show me steps and a second action, `WhatsNewMine` pushes.
- **Views and pins**: `GET /engagement/views/:id/reach` (who a sharing reaches, what a narrower reader sees), `sharedWith` and `summary` in words, `GET /engagement/pins/counts`; owners see role-shared views.
- **Next steps**: `?all=true`, link rules `review-approvals` and `pay-bills`, the reorder step in days of cover against the supplier's lead time.
- **Digest**: "runs out within N days" (`lowStockWithinDays`), the organisation's quiet hours on `GET digest/me`, the send times on `GET digest/setup`, `EngagementMine` on save.
- Left: money sums on views in Go to page, a member-deactivated event for view hand-over, the Console screen for release notes, the WhatsApp template's approval date.

### Services: read first, files with expiry, documents (API) *(asked 27 October 2026; built 27 October on `feat/service-items-view-files-docs`)* ([CATALOGUE.md](CATALOGUE.md#a-services-page-read-first-files-documents-27-oct-2026-branch-featservice-items-view-files-docs), [DRIVE.md](DRIVE.md))
- A service's files are Drive files attached by reference (permit, certificate, licence, contract, other) with an optional expiry day on the attachment (`drive.references.expires_on`, migration `1791640000000`); `expired` and `soon` (30 days) are said by the API.
- `GET /service-items/:id` and the list carry every use count; `GET /service-items/:id/documents` lists recent quotations, sales orders, invoices and purchase orders, only the kinds the reader may open.
- Left (named): a list-level flag for services with a lapsing file (needs Drive to expose a per-kind expiry query); notifying the owner before a permit lapses (Drive workflows have an `expiry` trigger on the file's own date, not on an attachment's).

## 5. To completion *(kept as work merges; last 17 October 2026)*

What is left before the application is complete, in the order it is
taken. Done phases are in section 4; this list is the remainder.

*(Done since 8 October: **the business-insights, reports and customise boards' API, 25 October** (every v3 board of RECOMMENDATIONS-D §2–§4 servable: KPI history, the drawer in one read, projections of provisional figures, "Agrees with the books" pushed, the Reports catalogue with pins and last runs, the ageing strip, test sends, reach and next run, Home card sizes; `feature/bi-reports-api`, below); **mobile phase 1, part A, 18 October** (the ERP pieces the web and the phone share: signed-in devices with remote sign-out, the generic `Idempotency-Key`, record versions with `If-Match` and the 409, and `GET /me/inbox`; `AUTH.md`, `WRITE_SAFETY.md`, `NOTIFICATIONS.md`; ES256 tokens and the Redis session copy come with the separations plan); Phase 4.6 — integrations, every connector, 10
October (Resend and ZeptoMail senders, Sage, the MCP writing tools and
SAML last); **customer pricing, 13 October** (Phase 4.16: price books,
agreements, tiers, commitments, rebates, promotions and the reports, in
every price path; `PRICING.md`); **inventory into work and assets, 17 October** (manufacturing following the stock-flow settings and the release step, stock to projects and maintenance with the Project dimension, maintenance accounting, assets under construction; `MANUFACTURING.md`, `PROJECTS.md`, `ASSETS.md`); Phase 4.7 — live everywhere, step 6 finished 10 October;
Phase 9 — HR and payroll, 8 October; Phase 4.10 — finance management, all
fourteen steps with wallets (15) and payment collection (16), 10
October.)*

**The read side (plan Part 2, `lane-async-over-polling.md`), 25 October 2026,
`feature/read-side-mongo`:** steps 1–4 and the first module of step 5 built
— the `ReadStore` port with Postgres read repositories and Redis in front,
the `projector` process and versioned `doc` pushes (LIVE_UPDATES.md
"Read-model rooms"), proven on quotations, orders and invoices, then customer
receipts. **Mongo deferred to the performance pass** (user, 25 October; the
design is PLATFORM_ARCHITECTURE.md §3). **Tier 1 finished 25 October,
`feature/read-side-tier1-rest`:** supplier payments, bills, stock on hand per
place and type (location-scoped, following the on-hand projection) and the
notification inbox (owner-scoped: the reader is part of the scope); a
document over 64 KB is pushed as `fetch: true` (PROJECTIONS.md "Tier 1").
**Follow-ups, 25 October, `fix/followups-1025`:** a related change (a
contact's or a type's rename) now reaches every document by the
`read-model-fanout` job past its first 500 (open problem 2 of #97), and
retention's redaction of notifications records `Notification-updated`; the
night-audit sweep's cross-tenant scan moved into its repository (the red
`system-scope.spec` on master); the API gaps the web lanes named: client
records' `treatmentConsent` on list rows, field service's `GET vans` and
`GET jobs`, HR's `GET /hr/overview`, `byStatus` and `contractEndsOn` on the
staff list. **Gaps, 25 October, `fix/api-gaps-1025b`:** the notification read
document carries the feed's words (who, the subject word, the action) and the
keyset inbox narrows by `kind`; `counts` by status on field service's jobs,
HR's change requests and leave requests; the overview names the pay
currency; leave cover against the rota and one person's attendance by
period. A pay group's minimum net followed (`fix/tsc-servername-and-minimum-net`):
the organisation's own `minimumNet` per group and `belowMinimumNet` on run lines.

1. **Phase 4.14** — Drive, all seven steps *(steps 1 and 2 built 10
   October, 3a, 3b and 3c too — 3c.2, document references, 11 October;
   the use-case refactor, 14 October; step 4, business document management,
   in parts — **4a, document types, details, tags and classification, and 4b,
   governance (retention, legal holds, expiry, lifecycle, disposal), built
   14 October, and 4c, approvals, 4d, workflows, 4e, templates and generation, 4f, e-signatures, 4g, the document inbox, and 4h, watermarks, download and print controls, built 14 October**; Drive step 4 is complete; **the v3 boards' API built 25 October** — `design-handoff/feature-inventory/drive.md`, DRIVE.md "The v3 boards")*.
2. **Phase 12** — supplier management in full, nine steps, the portal
   included *(all nine built 11 October: complete)*.
3. **Phase 10** — asset management, six steps *(all six built 11 October:
   complete — the register, operations, acquisition and money, control and
   analysis, in the field, and intelligence: telemetry and the fleet,
   predictions and anomalies, and the AI features; `ASSETS.md`)*.
4. **Phase 4.11** — the store front: the channel, its API *(steps 1 and 2
    built 12 October: API and web; step 3, "Create online store" and the
    Go store service `commerce-store-service`, built 13 October, with the
    Next.js storefront `commerce-storefront` and its look-and-content
    follow-up; `SALES_CHANNELS.md`)*, custom domains
    *(built 13 October: buy through Commerce, connect your own, renew, move
    out, redirects, certificates; `SALES_CHANNELS.md`)*, shopper accounts
    and company shoppers, delivery *(built 14 October: zones, rates,
    carriers, collection, tracking; `SALES_CHANNELS.md`)* and what brings
    shoppers back *(built 14 October: reviews, wishlists, back-in-stock
    alerts, display currencies from a rates provider, the storefront in four
    languages; `SALES_CHANNELS.md`)*,
    marketplaces *(built 17 October: Jumia, Konga and a generic contract with
    the organisation's own seller account; `SALES_CHANNELS.md`)*, dedicated
    containers.
5. **Phase 4.12** — the point of sale, on the channel model, printing
    Phase 14 step 7's till rolls *(step 1, the POS channel in the ERP,
    built 13 October: API and web; `POINT_OF_SALE.md`; step 2, the POS
    backend `commerce-pos`, built 13 October: sales posted once, shifts and
    cash, sync exceptions; steps 3 to 5, the Kotlin till online and offline
    and the React web till, built 13 October; POS completion, 13 October:
    returns as credit notes and refunds, every payment type booked, one-click
    account fix, actionable oversold, gift cards, CORS; step 7, terminal
    hardware, 13 October: detection and the Devices screen, Sunmi, PAX, Star,
    Epson/ESC-POS, camera scanning, customer display — never yet run on a real
    terminal; step 9, customers, loyalty, gift cards and the other ways of
    paying at the till, 14 October; reports, step 10, 14 October; tax and fiscal
    rules, step 8, 14 October — Nigeria against a simulated FIRS. Left: other
    countries' modules and the real authority connection, Commerce's own
    devices (11); iOS is written, not built, until Xcode is installed)*.
6. **Phase 15** — the trading network and organisation customers, ten
    steps *(written 12 October; every question answered; all ten steps built:
    party and organisation customers, passwordless shared links with the
    portal as a setting (12 October), joining from a link and the network
    foundation (12 October API, 13 October web), order to delivery and
    invoice to cash (13 October), and group companies on the network, with
    notifications for the network's records (13 October), and catalogues,
    RFQs and shared documents (step 8, 13 October), and Peppol and EDI
    (step 9, 13 October: AS2, SFTP, VAN and the country mandates not built),
    and netting and reports (step 10, 14 October); Phase 15 is complete)*.
7. **Phase 4.13** — inventory types for manufacturing; stock
    classifications *(built 11 October)*. **Stock flow** — stock per
    inventory type, the settings that set up the business flow and the
    release to sale *(built 12 October: API and web; `STOCK_FLOW.md`)*, made the
    general type transfer *(19 October)*.
8. **Phase 11** — manufacturing, nine steps *(complete, 11 October: all nine built)*.
9. **Phase T.2** — tenancy at scale: row-level security in force *(built
    14 October on `feat/tenancy-rls`, switch off until the integrator turns it
    on: TENANCY.md)*, truthful deletes, background clean-up; tenant-keyed
    entities still to do.

10. **Real rails and partners — held to the very end** (the user, 9
    October 2026: "make a list and hold on … for now we would be using
    the internal wallets prefunded"). Until then money moves through the
    organisation's prefunded internal wallets (the wallet service's
    `manual` and `sandbox` rails) and test-mode provider accounts.
    - **Wallet rails:** NIBSS NIP (inflow notifications, name enquiry,
      outward transfers); partner banks' APIs (virtual accounts,
      transfers, statements); payment providers as rails (Paystack and
      Flutterwave transfers and dedicated virtual accounts for wallets).
    - **The pool account** at a licensed bank, and the licensing that
      holding money for others needs (CBN).
    - **International:** a cross-border partner (multi-currency accounts
      and payouts, IBAN, SWIFT, ACH, sort code).
    - **FX:** a liquidity provider for live rates and settling
      conversions.
    - **Crypto:** directly on each blockchain, no custodian (the user,
      14 October 2026): the platform's own keys (HD deposit addresses,
      HSM or MPC signing, a small hot wallet), its own chain watchers and
      broadcasting, on the seven networks the service knows
      (wallet-service `docs/DESIGN.md`).
    - **Collections:** live merchant credentials for each provider and
      Hyperswitch connector an organisation uses, each certified by the
      conformance suite in sandbox first; card issuing; open banking and
      bank feeds.
    Each needs the user's choice of partner, its interface specification
    and credentials.
11. **After completion: an AI operator** (the user, 10 October) — an LLM
    in the app through which an organisation operates the system and gets
    its reports, on the MCP tools (permission-scoped, through the use
    cases) and the organisation's chosen AI provider (the `ai` slot).
12a. **Tax engine** — step 1 built 18 October 2026 (setup, presets NG GH KE ZA UK, groups with dated versions, rules, determination behind a provider port, several taxes per line on the four sales documents, the ledger by tax code, the shared document fields, the PDF; [TAX_ENGINE.md](TAX_ENGINE.md)). Step 2 built 19 October 2026 (purchases and input tax recoverable or not, reverse charge, withholding at payment and receipt, credit notes carrying the original taxes, rule editing with history, approval for tax changes, the India, EU and US presets, the price list and channel inclusive flags, a price list chosen by hand). Step 3: tax reports and returns, withholding certificates, the filing calendar, storefront and POS alignment.
12. **The Commerce Console** — a separate application
    (`~/SoftwareProjects/commerce-console`) in which Commerce's own staff
    run the platform; steps 1 to 3 built. **The ERP's side is done, 13
    October 2026** ([CONSOLE.md](CONSOLE.md)): the feature-switch client and
    guard with 21 switch points wired across the modules, the admin API for
    queues, schedules, the outbox, dead letters and consumer lag, the
    `organization.profile.changed` event (with a backfill), and the web's
    `FeaturesService`. **Console step 4, 14 October 2026:** the organisation's
    standing and the guard that enforces it, sign-up admission by country,
    the organisation's record, legal holds, export and legal erasure through the
    admin API, and the account-status page. **Console step 5, 14 October 2026:**
    the verification review queue moved into the Console (queue, case, decisions
    in the Console member's name through the admin API; the ERP's own screens
    retire behind `erp.network.platform_review`), the documents each country
    requires, verification that runs out and being asked to verify again, and a
    person's data for data-protection requests (a copy, a correction, an erasure).
    **Console step 6, 14 October 2026:** Help (cases raised in the app, forwarded
    to the Console's support desk and answered there) and consented access (owners
    answer Commerce support's requests for a length they choose; the session is
    checked on every request, read-only by default, and recorded) —
    [CONSOLE.md](CONSOLE.md#help-and-consented-access-console-step-6).
    **Console step 7, 14 October 2026:** billing — usage reported per organisation per
    metric per day in signed, idempotent batches, and the organisation's plan, usage
    against what it includes, invoices, and the owner's change of plan and features
    ([CONSOLE.md](CONSOLE.md#billing-console-step-7)).
    **Rate limits on outbound messages, 14 October 2026** (the user: reminders in
    documents can send email over and over and burn sending credits): one gate before
    every email, SMS and WhatsApp message (`OutboundGate`); the organisation's own
    limits (Communication settings, per channel and per minute, hour and day, per
    person, the repeat interval of a reminder, quiet hours, how long a held message
    waits) and the platform's (set in the Console, audited, pushed in the signed
    ruleset by plan tier); over a limit a message is held and goes when the window
    turns over, never lost; a reminder is not sent twice within its interval;
    campaigns are paced; what was sent, what waits and why is the **Sending** screen;
    credits used go to the Console's usage metering
    ([NOTIFICATIONS.md](NOTIFICATIONS.md#sending-limits-rate-limits-on-outbound-messages-14-october-2026)).

12. **The home dashboard** (the user, 13 October: "there are lots of
    features now, and the data needs to be richer") *(built 13 October: API
    and web — 37 widgets in ten sections, permission-, location- and
    currency-aware, each loading on its own and pushed live; arranged by the
    person or set per role; the shared SVG charts; `DASHBOARD.md`)*.

12. **Phase 16 — Commerce AI** *(the product document's ten steps; steps 1 and
    2, the service foundation and the capture of bills and expense receipts,
    built 13 October: API, web and the `commerce-ai` repository; the assistant,
    steps 4, 6, 7 and 8 together, built 14 October: voice notes of meetings into minutes and
    draft documents, the chat, reports on request, acting through MCP tools as the person;
    step 3, capture for every form and the Capture inbox with email, built 17 October on
    `feature/ai-capture`; the AI operator of item 11 is its step 8; the v3 D Assistant and Capture boards'
    API built 25 October on `feature/assistant-capture-api`)*.

13. **The remaining industry packs** *(25 October 2026, `feature/industry-packs-rest-api`: accommodation, field service, client records, rentals built; `feature/industry-packs-rest-api-2`: configurator, courses, fundraising, distribution built; `feature/industry-packs-final-3`: construction, property, classes built)*.

Smaller carried items: product-specific unit conversions and document
lines in units (Phase 1); copying an invitation link
(held back, Phase 2). Decisions waiting on the user: row-level security,
finance open-books, the supplier portal, posting pre-books history.

