# Point of sale

> Status: **steps 1 to 5 and 7 to 10 built, and the known gaps of steps 2 to 5 closed (13–14 October 2026)**. Step 8 (14 October): [tax and fiscal rules](#step-8-tax-and-fiscal-rules), Nigeria first, the authority simulated. Step 10 (14 October): [the reports](#step-10-reports). Step 1: the POS channel in the ERP (tills, cashiers, offline allowances, POS settings, receipt number blocks, fiscal profiles, the channel API). Step 2: the POS backend `commerce-pos` (its own repository, [README](../../commerce-pos/README.md)) and what it needs from the ERP: sales posted as invoices, receipts and stock, shifts and cash, sync exceptions ([below](#step-2-what-the-tills-sold)). Steps 3 to 5: the Kotlin till online and offline and the React web till ([below](#steps-3-to-5-the-tills)). **POS completion**: a return is a credit note and a refund, every payment type a till accepts is booked, a missing treasury account is made in one click, an oversold sale says what to do, and the web till can call `commerce-pos` from its own origin ([below](#pos-completion-returns-payments-and-the-gaps-closed)).
> Related: [Point-of-Sale-Product-Document.md](Point-of-Sale-Product-Document.md) (the product), [ROADMAP Phase 4.12](ROADMAP.md), [SALES_CHANNELS.md](SALES_CHANNELS.md) (the channel it extends), [SALES.md](SALES.md) (credit notes, refunds, gift cards), [STOCK_FLOW.md](STOCK_FLOW.md), [OUTBOX.md](OUTBOX.md), [INTEGRATIONS.md](INTEGRATIONS.md).
> Not built: tills for every platform (step 6) and maker's hardware beyond what step 7 lists, the real authority connections (step 8 built Nigeria against a simulated FIRS; **Ghana and Kenya followed on 17 October**, against a simulated GRA and a simulated eTIMS), Commerce's own devices (11). What the tills lack today is listed under [Known limits](#known-limits-after-pos-completion).

## What step 1 is

The ERP side that the POS backend and the tills read through the channel API. A **point-of-sale channel** is a sales channel of kind `point_of_sale` (the kind existed; it is now `built`). Everything of an ordinary channel still holds — places, sell-from types, assortment, status, key, rate limit, events — and it adds:

| Part | What |
|---|---|
| **Tills** | A device registered on the channel at one of its places: name, code, status `active` / `blocked` / `retired` (never deleted), a "wipe on its next connection" flag, last seen, the app version it reported and its device label. |
| **Enrolment codes** | A one-time code pairs a device with a till. `ABCDE-FGHJK`: ten characters of an alphabet without look-alikes (about 50 bits), shown **once** when the till is registered or a new code is made, kept only as a SHA-256, valid for 24 hours by default (1 to 168), spent by one statement that finds it unspent, unvoided and in time (so a race of four devices has one winner). A wrong, expired, used or voided code gets the same answer. Making a new code voids any still waiting. |
| **Till credential** | What the enrolment returns: `tlc_…`, shown once, kept as a SHA-256. The device presents it on `connect` and `wiped`. Retiring or wiping a till clears it. |
| **Cashiers** | Staff (`human_resource.staffs`, not every one of whom signs in to the ERP) linked to the channel with a role (`cashier`, `supervisor`) and limits: largest discount %, may override a price, largest refund and void amount (0: none without a supervisor). Removed, never deleted; assigning again brings the record back without its old PIN. |
| **PINs** | 4–8 digits, not one digit repeated and not a run (1234, 8765). Set by a manager (`trade.pos.cashiers.manage`) or by the cashier (`PUT …/my-pin`, needs only `trade.pos.read` and a staff record linked to the user). Stored as a bcrypt hash (`HashHelper`, the auth module's). **Never returned by the admin API** — it says only whether one is set — nor written to the history. The hash goes to a till in `config`, because an offline sign-in needs it. |
| **Offline allowance** | Per product or category, per channel: sellable offline yes/no, and a mode: `fixed` (units per till), `share` (a percentage of the place's stock split across the place's tills) or `any` (nothing set aside). A product's own rule wins over its category's. Resolved per till **in SQL** (`AllowancesRepository.resolve`). |
| **Stock set aside** | Fixed and shared allowances are **reserved through the reservation ledger** (`StockReservationService`, source type `TillAllowance`, one source per till and item — the `till_allowances` row's id), so the units sit on the ledger's held side: the shop and other tills cannot sell them (proved end to end). Reservations take what is free (`partial`), never refuse, and draw from the channel's sell-from types. |
| **POS settings** | `settings.pos` on the channel (zod, only for the kind): see below. |
| **Receipt number blocks** | A block of numbers per till from a per-channel, per-document counter; the size is a setting; recorded with the till that holds it. |
| **Fiscal profiles** | Per organisation, per country (and, where it differs, per place): rules and a provider from the `fiscal` integration slot. Stored and exposed; no authority is called. |

## Step 2: what the tills sold

`commerce-pos` (Go, its own repository) is the POS backend a till talks to: tenancy, the offline journal, idempotent sale intake, shifts and cash, the terminal and fiscal slots. It keeps every sale a till makes as a fact and **posts it into the ERP through the channel API**, in the order the till made them. This section is the ERP's half. The wire contract with the till is `commerce-pos/api/openapi.yaml` and `docs/sync-protocol.md`; the service's own design is in its `README.md` and `docs/`.

### A sale in the ERP

`POST /api/channel/v1/pos/tills/:tillId/sales` (the channel's key; the `Idempotency-Key` is the till's sale id). The sale already happened, so it is **recorded, never refused for disagreeing**:

| Step | What happens |
|---|---|
| Once | `pos_sales` is keyed by the client sale id. The same body again answers the same documents with `replayed: true` (six concurrent sends make one invoice); the same id with other content is `409`. |
| Invoice | One AR invoice written as the till charged it (price, discount, tax; inclusive or exclusive), approved and posted, at the till's place, for the customer the till named or the channel's walk-in customer (`recordPosSale` on `ArInvoiceService`: no price-book or discount-policy judgement; the till already applied them). |
| Stock | Issued from the channel's sell-from types at the till's place through `StockMovementService.postDocument`. The system **does not refuse for lack of stock** (the goods have left), so the position is checked first and a shortfall is reported as `oversold`, in words, with the resulting figure. |
| Receipts | One AR receipt per payment that is money in hand (`cash`, `card`, a bank transfer once confirmed), into the treasury account of that kind at the place, once per payment id (`idempotencyKey: pos:<paymentId>`). A **bank transfer** waits (`pending`) and `POST …/sales/:clientSaleId/payments` makes its receipt when the money is confirmed, once. The other payment types (gift card, store credit, wallet, on account, QR, payment link) are booked as described under [POS completion](#every-payment-type-is-booked-or-said-not-to-be). |
| Returns and voids | The goods go back in stock **and** the money is put right: a credit note against the original sale's invoice, the already-paid part released from the receipts that paid it, and the refund paid out of a treasury account ([below](#a-return-is-a-credit-note-and-a-refund)). Until 13 October this was left to hand (`return_to_book`, still read on old returns). A return whose original the ERP never saw raises `return_original_unknown`. |
| Findings | Each disagreement is returned as an exception with a plain-words message: `price_changed`, `product_retired`, `oversold`, `stock_not_issued`, `payment_not_booked` (no account to receive into, or a payment type that cannot be booked, with the reason), `unknown_customer`, `return_original_unknown`, `unknown_cashier`, and, since POS completion, the ones listed [below](#findings-since-pos-completion). The sale is `posted_with_exceptions` and the invoice stays due where money could not be booked. |
| A blocked till | Still accepted: a sale made before the block is a fact. |

### Shifts

`POST …/tills/:tillId/shifts` keeps the **last report of each shift whole** (`pos_shifts`: one row per shift, replaced on every report, `reports` counts them). The figures are the POS backend's, summed from the sales and cash movements it holds: opening float, cash sales, refunds, cash in and out, safe drops, expected cash, counted cash, the difference, the cashier's explanation. The blind close hides them from the cashier at the till, never from here.

### Sync exceptions

`POST …/tills/:tillId/sync-exceptions` reports one (idempotent by its id) with the record **exactly as received** (`original`). A person with `trade.pos.exceptions.resolve` closes it: `accepted`, `adjusted` (put right elsewhere), `written_off` or `retry` (a sale the ERP refused is posted again). Resolving twice the same way is harmless; a different second decision is `409`. Each decision gets a number from a sequence, and `GET …/sync-exceptions/changes?since=<n>` gives the POS backend every decision after that cursor, oldest first, so the till sees `resolved`. Nothing is deleted.

### Data

Migration `1781050000000-pos-sales-shifts-exceptions`; every table leads with `organization_id`.

| Table | What |
|---|---|
| `pos_sales` | One row per client sale id: kind, receipt number, a hash of the request, status, customer, total, cashier, shift, offline flag, the invoice and receipts made, the stock state, fiscal status, the exceptions found, the request as received. |
| `pos_sale_payments` | Each payment and what became of it: `received` (with its receipt), `pending`, `not_booked` (and why); since POS completion also `refunded`, `credited`, `applied` and `on_account`, and `refs`, the documents it made (receipt, refund, credit applied, gift card spent, provider checkout). |
| `pos_shifts` | A shift's last report, replaced on each report. |
| `pos_sync_exceptions` | Reported exceptions, the original record, the decision, who decided and when, and `resolution_seq`. |

### Admin API (added)

| Method | Path | Permission | What |
|---|---|---|---|
| GET | `/sales-channels/:id/pos/sales`, `/:saleId` | `trade.pos.read` | The sales posted (search by receipt number; filter by till, kind, status); one with its payments and the sale as the till sent it. |
| GET | `/sales-channels/:id/pos/shifts`, `/:shiftId` | `trade.pos.read` | The shifts; one with its report (cash reconciliation, sales summary, movements). |
| GET | `/sales-channels/:id/pos/exceptions` | `trade.pos.read` | Open first; filter by status, till, kind; `open` is the count of open ones. |
| POST | `/sales-channels/:id/pos/exceptions/:exceptionId/resolve` `{ resolution, note? }` | `trade.pos.exceptions.resolve` | Decide. |
| POST | `/sales-channels/:id/pos/exceptions/:exceptionId/create-account` `{ name?, accountNumber?, bankName?, scope? }` | `trade.pos.exceptions.resolve` and `finance.bank.create` | Make the missing treasury account, book what waited for it, resolve those exceptions as `adjusted`. |

### Channel API (added)

| Method | Path | What |
|---|---|---|
| POST | `/tills/:tillId/sales` | Post a sale, return or void (above). |
| POST | `/tills/:tillId/sales/:clientSaleId/payments` | A payment that arrived later (a confirmed bank transfer). |
| POST | `/tills/:tillId/sales/:clientSaleId/fiscal` | The fiscal stamp the POS backend obtained. |
| POST | `/tills/:tillId/shifts` | A shift's report. |
| POST | `/tills/:tillId/sync-exceptions` | An exception. |
| GET | `/sync-exceptions/changes?since=` | The decisions after a cursor. |
| POST | `/tills/:tillId/payments/checkouts` | Open a single-use payment link for a QR or link payment (online only). |
| GET | `/tills/:tillId/payments/checkouts/:paymentId` | Its state. |
| POST | `/gift-cards/lookup` | A gift card's balance by code. |
| GET | `/` (the channel) | Now includes `organizationId`, so a POS backend that serves many organisations knows whose channel a key is. |

### Events

On `commerce.channel.v1`, each carrying `organizationId`: `pos.sale.posted`, `pos.sync_exception.opened`, `pos.sync_exception.resolved`.

### Permission

`trade.pos.exceptions.resolve` (seed `sync-permission-catalog-v77`): owner, admin and manager.

### Web (step 2)

A POS channel's page gains three tabs: **Sales** (the sales with a status filter and receipt search; each opens in a drawer with its invoice link, items, payments and what the ERP found), **Shifts & cash** (counted against expected, "20.00 short", the cash and sales summary, the cashier's explanation) and **Sync exceptions** (open first with the count; each in plain words; *Resolve* in a drawer with the four decisions and a note, and *Post it again* offered only for a sale the ERP refused). The tills tab shows the channel id beside the one-time code, because the device needs both.

### Tests (step 2)

| Kind | Where |
|---|---|
| Unit | `pos-sales.logic.spec.ts` (totals, tax-inclusive lines, request hash, account choice); `commerce-pos`: domain, application and transport unit tests |
| Endpoint | `test/pos-sales.e2e-spec.ts` (17: one invoice, receipt and stock movement under six concurrent sends; price changed; tax-inclusive total; oversold; walk-in and found customers; a blocked till; stock leaves the till's place; no account to receive into; a bank transfer confirmed once into the bank account; an unbookable payment type; a return; the last shift report; an exception once, resolved once, read back by a cursor; a clerk's read; events against their contracts) |
| Drill | `npm run channel:drill`: an exception once, resolved once, read by a cursor; a shift replaced by each report |
| Tenancy | `test/tenancy.sweep-spec.ts` now posts a sale, a shift and an exception; `TENANCY_ROUTES=/api/v1/sales-channels/` |
| Integration | `commerce-pos`: `make test-integration` against real Postgres and Redis and a fake ERP (offline ordering, idempotency, gap handling, posting order and retries, shift totals, payments, device lifecycle) |
| Smoke | `commerce-pos/scripts/smoke.sh`: sets a channel up through the ERP's API, enrols a till, sells offline (cash and card), sends the journal twice, closes the shift, and checks the ERP |
| Web | `pos.model.spec.ts`; stubbed `cypress/e2e/pos-sales.cy.ts` (9, with axe); live `cypress/e2e/live/pos-sales.cy.ts` (written; the integrator runs it) |

### Known limits (step 2)

Most of the limits of step 2 were closed by [POS completion](#pos-completion-returns-payments-and-the-gaps-closed). What stays true is in [Known limits (after POS completion)](#known-limits-after-pos-completion).

## Steps 3 to 5: the tills

Both tills are the same till: one Kotlin core (money, pricing and tax, cashier limits and approvals, the offline rules, the journal, the sync engine, receipts), once as native screens and once compiled to JavaScript for the browser. They speak only to `commerce-pos`, which speaks to this channel API. The contract between them is `commerce-pos/api/openapi.yaml` and `docs/sync-protocol.md`.

### Steps 3 and 4: the Kotlin till, online and offline (`commerce-pos-app`)

Kotlin Multiplatform core and Compose screens for desktop (macOS, Windows, Linux) and Android. **Always journal, then sync**: online selling is the same path as offline with a short queue. A sale, return, void, shift, cash movement, bank transfer and card intent is one journal entry (gapless per till, written in one local transaction with the sale), sent oldest first in batches, acknowledged by the server, retried for ever, deleted only up to the server's acknowledgement. The device enforces what the ERP set in the allowances, the maximum hours offline, the value per shift, the payment types allowed offline and the card limit, **before** the customer is charged; the server verifies and flags (`oversold`, `price_changed` and so on). Receipt numbers come from blocks issued here (`numbers/next`). A PIN is checked on the device against the bcrypt verifier in `config`; five wrong PINs lock a cashier for five minutes. Screens: enrol, PIN sign-in, shift (float by denomination, cash in and out, safe drops, X and Z reports, blind close), sell (search, scan, favourites, decimals for weighed goods, price breaks, discounts and price changes within limits and above them a supervisor's PIN), tender (cash with change, card through the terminal port, bank transfer confirmed later, split payments, cash rounding), receipt (ESC/POS over the network or Bluetooth, reprint as a copy, fiscal fields and QR), returns and voids, sending and problems (exceptions listed until the cashier dismisses them), settings. Storage is SQLite (SQLCipher on Android; the desktop relies on the disk's encryption).

Tests: 166 on the JVM and 170 on Node in the shared core, 9 for the SQLite store, 16 Compose desktop UI tests with accessibility and contrast checks, against a fake `commerce-pos` that follows the contract (idempotency, ordering, gaps, acknowledgement, exceptions, blocks, heartbeat).

**Not verified or not built:**

- **iOS is written, not built.** The sources exist (Darwin HTTP, Keychain, network monitor, native SQLite, the view controller) but there is no Xcode on the build machine; nothing has been compiled or run.
- **Android** builds and runs on a tablet emulator (enrol, PIN sign-in, selling grid) with its database encrypted; it has not run on a physical POS terminal or against a live `commerce-pos`.
- **Hardware** beyond ESC/POS receipt printing, the drawer pulse and keyboard-wedge scanners is sandbox only: card terminals, scales, customer displays and the makers' adapters are step 7 of the product document. What exists was tested against fakes, not against a device.
- **The payment types it offers** were cash, card and bank transfer until step 9 (14 October), which added the screens and contract calls for loyalty points, gift card, store credit, wallet, on account, QR and payment link, and the customer at the till ([below](#step-9-customers-loyalty-gift-cards-and-the-other-ways-of-paying-at-the-till)).
- (Step 8 since added the Nigerian fiscal module: see [Step 8](#step-8-tax-and-fiscal-rules).) the catalogue item has one unit (no UoM cartons), no serial or batch capture.

### Step 5: the web till (`commerce-pos-web`)

React screens (Next.js static export) over the same core compiled to JavaScript (`./gradlew :shared:webCore`, an ES module), so the rules and the journal are the Kotlin till's own. Offline-first in the browser: IndexedDB for the journal and catalogue (one atomic write per transaction), a service worker so the app opens with no network, Background Sync, the sync engine's own retry. The till credential is sealed with a non-extractable WebCrypto key. Printing through the browser's print dialog laid out for 58 or 80 mm paper, or straight to a thermal printer over WebUSB, Web Serial or Bluetooth serial as ESC/POS (also opening the drawer). Keyboard-wedge scanners, touch first, light and dark, axe-clean. Tests: 103 Vitest, 45 stubbed Playwright (offline then reconnect, printing, vault, PWA, axe on every screen, phone and tablet), a production-build run, and a live spec against a real `commerce-pos` (since step 9: 122 Vitest and 52 Playwright).

**What it cannot do:**

- **No card terminal.** A browser has none; the card button is hidden and the screen says why. Card is taken on a native till. A maker's web SDK would be one adapter behind the core's `CardTerminal` port.
- **No raw network printers** (`host:9100`): a page cannot open a TCP socket. Use the print dialog, USB, or Bluetooth serial. WebUSB and Web Serial exist only in Chrome and Edge over https; Firefox and Safari print through the dialog. Silent printing with the dialog needs Chrome's `--kiosk-printing`.
- WebUSB, Web Serial and the drawer are tested against fake devices that follow the browser APIs, not against a physical printer.
- Sales not yet sent live in the browser profile's storage, which a browser may evict (Safari clears a site's data after seven days without a visit): keep a web till online whenever it can be.
- Fiscal receipts (step 8) are printed by this till too, from the same core.
- **Another origin needs CORS.** `commerce-pos` now answers it for the origins in `HTTP_CORS_ALLOWED_ORIGINS` (default none); see [the web till on another origin](#the-web-till-on-another-origin).

## POS completion: returns, payments and the gaps closed

13 October 2026, API, web and `commerce-pos` (branch `feat/pos-complete` in each). It closes the limits step 2 listed.

### A return is a credit note and a refund

A till's return is settled by `PosReturnsService` in the order that keeps the books right if a step fails:

1. **The credit note** is an AR memo (a decrease) against the original sale's invoice, made *approved* (the till has already judged the return, as it judged the sale), carrying the returned lines at the price and tax the customer paid (a memo line may carry `fixedTaxAmount`, so the tax is the till's exact figure) and posted at once.
2. **The paid part is released.** What the customer had actually paid is split from what was still owed (`splitCredit`): the still-owed part is simply forgiven by the credit note; the paid part is **released from the receipts that paid the invoice**, so it becomes credit on a receipt (`planRelease` chooses receipts of the same method as the refund first).
3. **The refund** is an `ar-refund` document (below) per refunded payment, paid out of the treasury account of that payment's kind at the place (cash back from the till's cash account, a card reversal from the card clearing account, a transfer from the bank account): Dr customer deposits, Cr the account. A refund onto **store credit** needs no document: the released credit stays on the receipt for the customer's next sale.
4. **Stock goes back** at the place the till sold from, as before.

A void is a return of every line. A return and its refunds are made **once however often the till sends them**. Where something cannot be done, the return is still recorded and says so in words ([findings](#findings-since-pos-completion)); the goods are back in stock in every case. `return_to_book` is no longer raised; old rows keep their label ("an older return").

#### Customer refunds (`ar-refund`, Sales → Refunds)

A refund is a document in its own right (standalone-documents rule: it can be made alone, from the credit a customer holds; a return only pre-fills it). Table `ar_receipt.ar_refunds`: customer, the treasury account it is paid from, method (cash, bank transfer, card, mobile…), currency and rate, amount, date, reference, a reason (required by default), what it is *backed* by (a receipt's credit or a credit note's credit left on account), the receipt, credit note and invoice it relates to, status `posted` / `voided`, source `manual` / `pos`, the journal entry (and the reversal when voided), the posting failure if there was one.

- **Posting:** Dr customer deposits, Cr the paying account's GL. A refund above the credit actually held, in another currency than its account, or for fractions of a cent is refused with the reason in words. Voiding reverses the entry and gives the credit back.
- **Settings** (Document settings → AR refund): `requireReason`, `maxAmount`. Numbering prefix `RFD`.
- **Register:** the money register projects each posted refund as source `ar-refund`.
- **API:** `GET /ar-refunds`, `GET /ar-refunds/credit?customerId` (what a customer holds, by receipt and credit note), `GET /ar-refunds/:id`, `POST /ar-refunds`, `POST /ar-refunds/:id/post`, `POST /ar-refunds/:id/void`. Permissions `trade.ar-refunds.read|create|void`.
- **Web:** Sales → Refunds: the list with filters, a drawer to refund (customer, the credit offered, the account, the amount) and to void with a reason.

### Every payment type is booked, or said not to be

The sale's payments are booked in the order the till took them. The treatment is chosen by `paymentTreatment`:

| Payment | What the ERP does |
|---|---|
| `cash`, `card`, `bank_transfer` | As step 2: a receipt into the account of that kind, or `pending` for a transfer until confirmed. |
| `on_account` | The invoice is left due on the customer's account. The **credit limit** is checked against what the customer owes *now* (read from the invoices, not the lagging projection) plus this sale: over it raises `credit_limit_exceeded`; a customer on credit hold raises `credit_on_hold`; no customer at all raises `on_account_needs_customer`. The sale stays posted (it is a fact); the manager sees the finding. |
| `store_credit` | The customer's receipt credit (any receipt) is applied to the invoice. No customer: `store_credit_needs_customer`. Less credit than asked: the invoice stays due for the rest and says so. |
| `wallet` | The customer's wallet is their credit from `wallet-funding:%` receipts (the ERP's internal, prefunded wallets); it is applied the same way. |
| `gift_card` | The till names the card's code; the redemption **debits the card inside the receipt's posting** and a void gives it back ([gift cards](#gift-cards)). A code that is unknown, blocked, expired, in another currency or short of balance says so and leaves the invoice due. |
| `qr`, `payment_link` | Through the payment links already integrated (**sandbox / test gateway only**; real rails are held to the end): the till opens a single-use fixed payment link (`POST /pos/tills/:id/payments/checkouts`), the customer pays it, and when the sale is posted the provider's *confirmed* receipts are applied to the invoice. Not confirmed: the payment stays `pending` with `payment_not_confirmed`. A reference that matches none of our checkouts but is marked confirmed by the till is booked as money in hand, with a note that no provider's record backs it. |
| anything else | `payment_not_booked`, saying why. |

No supported method now ends as `payment_not_booked` without a reason you can act on.

### A missing treasury account is made in one click

When no account of the payment's kind exists in the sale's currency, the exception carries a `fix`: the kind to make (cash → cash, card and payment link → clearing, bank transfer → bank, QR → mobile money), the currency, the place, and what is still needed (a bank and account number for the last two). In the Sync exceptions tab, **Actions → Make the account…** opens a drawer: name (pre-filled), bank and number where needed, place or whole organisation. `POST /sales-channels/:id/pos/exceptions/:exceptionId/create-account` makes the account, then **books every open exception of that method, currency and place** (not only this one), resolves each as `adjusted` and returns what it booked. It needs `trade.pos.exceptions.resolve` and also `finance.bank.create`. A closed exception offers no fix.

### Oversold: keep the facts, show what to do

Two offline sales for the last unit both post and are reported `oversold` (an offline sale is a fact; the goods have gone). The exception's details now carry the item, how many short, the place, and `sources`: the other places with sellable stock. The Sync exceptions tab turns them into links: **Transfer N from <place>** opens the stock transfer form pre-filled (from, to, item, quantity), and the item's page is linked for a purchase.

### Gift cards

`sale.gift_cards` with `sale.gift_card_movements` (`issue`, `redeem`, `reverse`). A card is a **bearer code** shown once at issue, kept as a SHA-256 plus a short hint; it has a currency, an initial amount and a balance, an optional customer and expiry, status `active` / `blocked`, and is issued by staff for money received into a treasury account.

- **Ledger:** posting role `gift_card_liability`, account **2440 "Gift cards owed"** (in the chart templates and, by migration, existing charts). Issue posts Dr the account paid into, Cr gift-card liability. A redemption is a receipt with method `gift-card` (no bank account, like loyalty points) that debits the liability; a void gives the balance back. Issuance appears in the money register as source `gift-card`.
- **Redeeming** locks and debits the card in one statement, so two tills cannot spend the same balance; each spend carries an idempotency key.
- **API:** `GET /gift-cards`, `GET /gift-cards/:id`, `POST /gift-cards` (issue), `POST /gift-cards/lookup` (code → card), `POST /gift-cards/:id/block|unblock`, `PUT /gift-cards/:id/expiry`. Permissions `trade.gift-cards.read|issue|manage`. The channel API has `POST /pos/gift-cards/lookup` for the balance a till shows.
- **Web:** Sales → Gift cards: list, issue in a drawer (the code shown once), block, unblock, expiry.

### Checkouts and lookups for the tills (online only)

`POST /api/channel/v1/pos/tills/:tillId/payments/checkouts` `{ paymentId, method, amount, currency, customer?, description?, expiresInMinutes? }` opens a fixed single-use payment link (marker note `pos-payment:<paymentId>`; customer = the sale's customer or the walk-in), `GET …/checkouts/:paymentId` reads its state, and `POST /api/channel/v1/pos/gift-cards/lookup` `{ code }` reads a gift card's balance. `commerce-pos` passes these through (`POST /pos/v1/payments/checkouts`, `GET /pos/v1/payments/checkouts/{paymentId}`, `POST /pos/v1/gift-cards/lookup`); nothing is stored there.

### The web till on another origin

`commerce-pos` has a setting, `HTTP_CORS_ALLOWED_ORIGINS` (comma-separated exact origins, default none), applying to `/pos/` only: the preflight is answered `204` before authentication with `Authorization, Content-Type, If-None-Match, Idempotency-Key` allowed, `ETag` and `Retry-After` exposed, `Vary: Origin`, no credentials, no wildcard; an unlisted origin's preflight is `403`. The alternative needing no CORS is one origin through a reverse proxy (till at `/`, `commerce-pos` at `/pos/`; never proxy `/admin/`). Both, with an nginx example, are in `commerce-pos`'s README ("The web till on another origin").

### Findings since POS completion

| Kind | When |
|---|---|
| `credit_note_not_posted` | The credit note could not be made or posted (the reason is given); the goods are back; make it by hand from Sales → Credit notes. |
| `refund_not_paid` | A refund the till paid out could not be recorded: no account of that kind in the currency, above what the sale was paid with, or onto a gift card or points that could not take it (a blocked card, no member); the customer keeps the credit and Sales → Refunds pays it. |
| `return_credit_kept` | Nothing was paid back at the till; the credit note stays as credit on the customer's account. Information only. |
| `return_exceeds_sale` | Returns of a sale now come to more than the sale. Recorded as made. |
| `return_unmatched_payment` | Part of the return was paid on the sale by a payment the ERP cannot trace to a receipt; held as credit. |
| `credit_limit_exceeded`, `credit_on_hold`, `on_account_needs_customer`, `store_credit_needs_customer` | Sales on account or store credit, as above. |
| `payment_not_confirmed` | A QR or payment-link payment the provider has not confirmed. |
| `oversold` | Now with `sources` and links. |

### Data (POS completion)

| Migration | What |
|---|---|
| `1781200000000-ar-refunds` | `ar_receipt.ar_refunds` (organisation first; unique number; idempotency key). |
| `1781200000100-pos-returns-and-payments` | `pos_sales.refund_ids`, `pos_sale_payments.refs`; the payment state check widened to `received, pending, not_booked, refunded, credited, applied, on_account`. |
| `1781200000200-gift-cards` | `sale.gift_cards`, `sale.gift_card_movements`; receipt method `gift-card` and the bank-account check widened for it; account 2440 and its posting role for existing charts. |
| seed `1781200000001-sync-permission-catalog-v80` | `trade.ar-refunds.*`, `trade.gift-cards.*`, granted to the roles whose defaults have them. |

### Tests (POS completion)

| Kind | Where |
|---|---|
| Unit | `ar-refund.logic.spec.ts` (credit arithmetic, refusals, entry lines, `planRelease`); `gift-card.logic.spec.ts`; `pos-sales.logic.spec.ts` (treatments, `splitCredit`, `accountFixOf`, credit-note lines); the register projector spec |
| Endpoint | `test/ar-refunds.e2e-spec.ts`; `test/pos-sales.e2e-spec.ts` (extended); `test/pos-returns-payments.e2e-spec.ts` (19: credit note, release and refund once; payment types; credit limit; gift card spend, void and double spend; checkout and confirmation; one-click account fix; oversold sources) |
| Drill | `npm run channel:drill`: an exception about a missing account offers a fix and a closed one offers none |
| Tenancy | `test/tenancy.sweep-spec.ts` fixtures (cash account, customer, receipt, refund, gift card, return); routes `/api/v1/(ar-refunds\|gift-cards\|sales-channels/)` |
| Web | unit for `channels`, `refunds`, `gift-cards`; stubbed Cypress `pos-sales.cy.ts`, `refunds.cy.ts`, `gift-cards.cy.ts`; live `live/pos-sales.cy.ts` (a return → credit note) and `live/gift-cards-refunds.cy.ts` (written; the integrator runs them) |
| `commerce-pos` | `make check`, `make lint`, `make test-integration` (CORS, checkout, the Kotlin till's journal accepted as-is), `scripts/smoke.py` (a return with a cash refund: the ERP made the credit note and the posted refund) |

### Known limits (after POS completion)

- **QR and payment link run on the sandbox / test gateway only.** Live merchant credentials and real rails are held to the end of the programme.
- A **refund onto a gift card** is booked since step 9: it goes back on the card that paid (a card that is blocked, expired or in another currency keeps the credit with the customer and says so).
- **Loyalty points** are taken back on a return since step 9.
- **Expired gift-card balances** stay as a liability; whether they become income (breakage) is a policy not yet decided.
- Gift cards are **issued by staff** in the ERP and, since step 9, **sold and topped up at the till**.
- Card settlement and reversal with the acquirer are not modelled; a card refund is money out of the clearing account.
- Receipts need a treasury account of the payment's kind in the sale's currency: the one-click fix makes it, but only someone with `finance.bank.create` can use it.
- `StockMovementService.postDocument` never refuses for lack of stock, so oversold is found by checking the position first; two sales racing for the last unit both succeed and both are reported (now with what to do).
- Tax is booked as the till charged it; an inclusive total is exact to the cent.
- The fiscal stamp is stored on the sale; the country modules arrived with step 8.

## Step 9: customers, loyalty, gift cards and the other ways of paying at the till

Built 14 October 2026, branch `feat/pos-loyalty` in each repository (`commerce-api`, `commerce-web`, `commerce-pos`, `commerce-pos-app`, `commerce-pos-web`). The ERP holds all of it; the tills show it, do the same arithmetic as the ERP, and send what they did on the sale.

### What the cashier can do

- **Find or make the customer** by the digits of a phone number, a name or the start of an email. A new customer needs a first name and a phone or email (`allowNoEmail`: a phone-only contact is stored with an empty email); the cashier records the customer's answer to the marketing question (the wording read out is kept with it, `settings.pos.customers.consentWording`) and may enrol them in the scheme. The customer's **standing** shows on the sale: points and what they are worth, tier, store credit, wallet, and for credit customers the limit, what is owed and whether they are on hold.
- **Loyalty.** A sale earns `floor(net x pointsPerUnit x tier multiplier)` points, once its payments are booked, on the part not paid in points and not on gift card lines; points are spent as a payment (`loyalty_points`): `ceil(amount / pointValue)` points per amount, at most `maxRedeemPercent` of the sale, at least `minRedeemPoints`. A **return** takes back the points the goods earned (in proportion, cumulatively, never more than are still held, and says when they were already spent) and gives back the points that paid for it. The tier's `earnMultiplier` is a benefit of the tier (Customers → Loyalty → Tiers).
- **Pay** with any of loyalty points, **gift card** (the code, looked up for its balance), **store credit**, **wallet**, **on account** (credit limit, hold and a supervisor's PIN beyond the offline allowance), **QR code** and **payment link** (online only: the till shows the picture and the address, waits, times out after ten minutes, can be cancelled; the sale cannot finish while one is open). Any mix is a split tender. Every refusal is decided on the till before the customer is charged, in words.
- **Sell and top up gift cards.** The till makes the code (16 characters from a 31-symbol alphabet without look-alikes, from the platform's secure random), prints it on the receipt, and sends the ERP **only its SHA-256 and a four-character hint**; the ERP never holds a code. The invoice line (`type GIFT_CARD`) credits **Gift cards owed (2440)**, not income, and the card is made when the sale is posted (once per line, however often it is sent). A top-up adds to a card by its hash.
- **Returns go back the way the sale was paid:** cash to cash, card to the card, points as whole points (the part of a point left over stays as credit on the receipt), store credit as store credit, **a gift card back onto that card** (movement `refund`, Dr customer deposits, Cr gift cards owed), on account off what the customer owes. The cashier may switch to cash. Gift cards sold cannot be returned or voided at the till (`gift_card_returned` tells the manager).

### Offline

| | |
|---|---|
| Customers | The till keeps the channel's regulars (`keepOnTill`, refreshed by the heartbeat every six hours) and every customer it looked up; a customer made offline is kept under a local id and the ERP finds them by phone when the sale arrives. |
| Points | Spent up to `offlineRedeemPoints` and the balance the till last saw, less what it has already let that customer spend; **earned points are queued**, not shown. |
| Store credit | Against the balance last seen, less what this till has let them spend. |
| On account | Up to `onAccountOfflineLimit` and the credit last seen; beyond it a supervisor approves (an approval of kind `other` with the reason). A customer on hold is refused offline too. |
| Gift card | Spendable offline only if this till looked the card up before, up to the balance it saw. Selling one offline needs `giftCards.sellOffline`; the card works once the sale arrives. |
| Wallet, QR, payment link | Online only (the schema refuses to allow them offline). |

### Settings (`settings.pos`)

`payments.loyalty_points` joins the payment types (default off). New groups, each strict and refused when misspelt:

| Group | Setting | Default |
|---|---|---|
| `loyalty` | `earn`, `redeem`, `maxRedeemPercent` (1-100), `minRedeemPoints`, `offlineRedeemPoints` | on, on, 100, 0, 0 |
| `customers` | `quickCreate`, `askForConsent`, `consentWording`, `keepOnTill` (0-5000), `onAccountOfflineLimit` | on, on, a plain sentence, 200, 0 |
| `giftCards` | `sell`, `topUp`, `sellOffline`, `minAmount`, `maxAmount` (0: no limit), `expiryMonths` (0: none) | all off, 0, 0, 0 |

The scheme itself (on or off, points per unit, the value of a point, tiers) stays the organisation's, in Customers → Loyalty; the channel config sent to a till carries it already combined with these switches (`loyalty.scheme`, `earn`, `redeem`, `pointsPerUnit`, `pointValue`). The channel's **Payments & offline** tab in the ERP web gains the loyalty, customer and gift card groups.

### Channel API (added)

| Call | What |
|---|---|
| `GET /pos/customers/search?q=&limit=` | By phone digits, name or email start; exact phone matches first; never the walk-in. |
| `GET /pos/customers/regulars?offset=&limit=` | The customers the till keeps (recent buyers, then members with most points). |
| `GET /pos/customers/:id` | One standing, with credit terms (calculated live from the invoices). |
| `POST /pos/customers` | Make (or find by phone) a customer: `{ firstName, lastName?, phone?, email?, organizationName?, consent?, joinLoyalty? }`. |
| `POST /pos/customers/:id/enrol`, `POST /pos/customers/:id/consent` | Join the scheme; record a consent answer (also a withdrawal). |
| `POST /pos/gift-cards/lookup` | Balance and state by code (unchanged). |
| `POST /pos/tills/:id/sales` | A sale line may be `kind: gift_card` or `gift_card_topup` with `giftCard { codeHash, hint, expiresOn }`; a payment may be `loyalty_points` with `points`; a refund may name `gift_card` with the card's code as `reference`; the response says what the sale did to the points (`loyalty`: earned, redeemed, taken back, given back, balance). |

`commerce-pos` passes the customer calls through and checks the sale document (`internal/domain/sale`). Every customer query names the organisation first.

### Findings (added)

| Kind | When |
|---|---|
| `gift_card_not_issued` | A card could not be made or topped up (a hash that is already another card's, no such card, blocked, expired, another currency); the money was taken: the card has to be issued by hand. |
| `gift_card_returned` | A sale that sold a card was returned: the card is left alone. |
| `loyalty_not_reversed`, `loyalty_points_already_spent`, `loyalty_earned_differs` | Points could not be taken back, were already spent, or the till's figure differs from the ERP's. |
| `refund_not_paid` (extended) | A refund onto a gift card or points that could not be put back (the reason in words). |

### Data

| Migration | What |
|---|---|
| `1781650000000-pos-loyalty` | `sale.gift_card_movements.kind` gains `topup` (keeping `expire`, `restore`); `sales_channel.pos_sales.loyalty` (what the sale did to the points); `crm.phone_digits()` and a trigram index on it for the phone search. |
| `1781650000001-gift-card-refund-kind` | the movement kind `refund`. |

No seed: no new permission. Events `pos.gift_card.sold` and `pos.customer.created` (contracts in `contracts.ts`); the sale events carry `pointsEarned` and `pointsRedeemed`.

### Web

The channel's tabs gain the loyalty, customer and gift card settings; the sale detail shows the customer's points for the sale; Customers → Loyalty → Tiers has the earn multiplier; Sales → Gift cards words the new movements ("Money added at the till", "Refund of a sale put back on the card") and the source "point of sale".

### Tests (step 9)

| Kind | Where |
|---|---|
| Unit | `loyalty.logic.spec.ts` (earning, covering, the share, take-back, whole points), `pos.logic.spec.ts` (the new settings), `pos-sales.logic.spec.ts` |
| Endpoint | `test/pos-loyalty.e2e-spec.ts` (28: customers made, found, standing and consent; points earned once, at a tier's multiplier, spent, refused; returns taking points back and refunding onto points and onto a gift card, and a blocked card; cards sold, topped up and spent; events against their contracts) |
| Drill | `npm run channel:drill` (a customer made and found by its digits, joining the scheme once, a gift card sold once however often the sale is posted, a top-up, another currency refused) |
| Tenancy | `test/tenancy.sweep-spec.ts` fixtures (a customer, a member sale, a gift card line) |
| Web | `pos.model.spec.ts`; stubbed Cypress `pos-channel.cy.ts` and `pos-sales.cy.ts`; the live spec for the tills is in each till's repository |
| `commerce-pos` | `make check`, `make test-integration` (`customers_test.go`) |
| Kotlin till | 294 tests on the JVM (shared core, SQLite store, hardware, Compose screens with accessibility and contrast checks), 246 on Node, Android assembles |
| Web till | 122 Vitest, 52 stubbed Playwright with axe, two steps in the live spec |

### Known limits (step 9)

- **QR and payment link run on the sandbox gateway only**; the ERP cannot cancel a checkout, so cancelling at the till takes the payment off the sale and the link lapses at its expiry.
- **A refund onto a gift card** uses receipts paid by gift card; if the sale was paid with two cards the money goes on the card the cashier names, drawn from either's receipt.
- **Wallet refunds** are paid out of the provider-wallet account like any other money out (the customer's prefunded wallet is not topped up).
- Earned points reach the customer when the sale is **posted** by the ERP; offline, earning is queued until then.
- A **customer made offline** is merged with the ERP's by phone number when the sale arrives.
- **iOS is not built**; the hardware and the QR scan of a real phone were never tried; breakage on unspent gift cards is a policy not yet decided.

## Step 10: reports

Built 14 October 2026, branch `feat/pos-reports-fiscal` in `commerce-api`, `commerce-web` and `commerce-pos`. Every report is a definition on the analytics report framework ([ANALYTICS.md](ANALYTICS.md#reports)), in a module of its own, `pos` (**Point of sale**), so it gets that framework's whole behaviour: filters, a period, grouping, sorting, totals, exports (CSV, Excel, PDF), saved views, schedules, the location scope, caching and the live notice. A reader needs `pos.report.view` and `trade.pos.read` (seed v95); exporting needs `pos.report.export`, scheduling `pos.report.schedule`. Owners and administrators hold all six `pos.*` permissions, managers view, export and analyse, viewers view.

### The reports

| Key | Type | What it shows | Opens |
|---|---|---|---|
| `pos.sales_by_till` | grouped | Per till: sales, sold, returned, voided, **net**, tax, items | grouped by till, this month |
| `pos.sales_by_cashier` | grouped | The same per cashier | by cashier |
| `pos.sales_by_hour` | grouped | The same per hour of the day, **on the place's own clock** | by hour |
| `pos.payment_mix` | grouped | Payments and amount by method (cash, card, transfer, QR, link, wallet, gift card, store credit, points, on account), and what was paid back | by method |
| `pos.cash_differences` | exception | Each shift: opening float, cash sales, refunds, **expected, counted, difference**, outcome (Short / Over / Balanced / Open / Not counted) and the cashier's explanation; group by cashier or month to see who and when | the shifts |
| `pos.offline_activity` | activity | Per till and day: times offline, minutes offline, the longest, sales taken offline and their value, the offline allowance used (units), limits exceeded | the days |
| `pos.sync_exceptions` | exception | Each exception: kind, severity, open or resolved, **age in hours**, who resolved it and how | the exceptions |
| `pos.fiscal_status` | exception | Each sale that must be reported to a tax authority: Waiting / Reported / Accepted / Rejected / Overdue, the authority's reference and message, the deadline, the attempts | the sales |
| `pos.voids_returns_discounts` | comparative | Per cashier: voids and what they voided, returns and what they took back, sales discounted and the discounts given, price overrides, supervisor approvals | by cashier |

**Filters:** place (the report's location picker, held to the places the reader may see), **channel, till and cashier chosen by name** (pickers read when the report opens, within the reader's places, `GET /analytics/reports/:key/filters/:filterKey/choices`), a search (till, cashier, place, receipt), and each report's own (payment method, outcome of a shift, status, severity, kind, country, "rejected or overdue", "open for more than a day", "only shifts that were short or over"). The period is the framework's (presets or from and to; the reports open on this month). Money is never added across currencies: with more than one, the total is blank and the rows say their own.

**Net** is `sold − returned − voided`: a return or void is counted on the day and hour it was rung, not on the sale it undoes.

### Where the figures come from

Nothing reads the history of sales. The `pos-activity` projection ([PROJECTIONS.md](PROJECTIONS.md)) keeps five read models, each recomputed from its sources when an event names its slice (never accumulated, so a repeated event, a late payment and a rebuild all land on the same rows; the e2e proves the stream equals a rebuild):

| Table | One row per | Fed by |
|---|---|---|
| `projection.pos_activity_hours` | till, cashier, local hour and currency | `pos.sale.posted` |
| `projection.pos_payment_hours` | the same, and payment method | `pos.sale.posted` |
| `projection.pos_shift_cash` | shift | `pos.shift.reported` |
| `projection.pos_offline_days` | till and local day | `pos.sale.posted`, `pos.offline_spell.recorded`, the sync-exception events |
| `projection.pos_exceptions` | sync exception | `pos.sync_exception.opened` / `.resolved` |

Names (till, cashier, place, channel) are copied onto the rows so a report reads one table; they are those of the last time the row was recomputed. A sale belongs to **the hour it was rung in, in the time zone of its place** (`tenant.location_setting.timezone`; UTC where none is valid), so "by hour" is the shop's own clock, including half-hour zones. The fiscal report reads `sales_channel.pos_sale_fiscal`, written by one service that records `pos.sale.fiscal_changed` in the same transaction.

**Cached only because everything is announced.** A report is cached when every table it reads announces its changes: the projection tables by `projection.applied` for `pos-activity`, `pos_sale_fiscal` by `ANNOUNCED_BY_HAND`. `pos.reports.spec.ts` fails if a POS report reads anything else, and the e2e proves a cached run is served until the projection applies and is dropped when it does. A finding on the way: a table in a schema no entity lives in (`sales_channel`) made a report look as if it read nothing — so it was cached, with no way to be told it was stale; such schemas are now known to the framework (`RAW_SQL_SCHEMAS`).

### How long tills were offline

The sales say what a till sold offline; only the till can say for how long it could not be reached. `commerce-pos` keeps the stretch when a till that reported `offlineSince` is heard from again and tells the ERP once: `POST /api/channel/v1/pos/tills/:tillId/offline-spells` `{ spellId, startedAt, endedAt }` (idempotent by `spellId`; a spell that ends before it begins, or is over 60 days, is `400`), table `sales_channel.pos_offline_spells`, event `pos.offline_spell.recorded`. A spell is attributed to the local day it began. A till that is offline now is not in the report until it returns (the Tills widget shows who is quiet now).

### The fiscal record

`sales_channel.pos_sale_fiscal` (migration `1781950000100`): per sale that a profile says must be reported, its status (`queued`, `submitted`, `accepted`, `rejected`, `overdue`), the country and provider, the authority's reference and fiscal number, its message, the deadline, the attempts and when it last answered; the till, place, receipt and total are copied on. It is filled when a sale is posted with a fiscal stamp and by every stamp the POS backend reports (`POST …/sales/:id/fiscal`, whose body gained `dueBy`, `attempts`, `submittedAt`); a late or repeated answer never takes a sale back from accepted. Each change records `pos.sale.fiscal_changed`.

### Dashboard

Five widgets in the Channels section, all needing `trade.pos.read` at the places they cover: `channels.pos-hours` (today's sales by hour), `channels.pos-payments` (the payment mix over seven days), `channels.pos-cash` (shifts short or over in 14 days, the largest first), `channels.pos-fiscal` (what needs work: rejected, overdue, waiting) and `channels.pos-offline` (offline time over seven days). The shop-and-till page shows the hours and cash widgets. Each leads to its report.

### Web

A POS channel's page gains a **Reports** tab: the nine reports as links that open the reports screen narrowed to the channel (`/reports/pos.sales_by_till?channelId=…`). The reports screen gained pickers by name, and a report that is one view of the same rows opens grouped the way its title says and on this month.

### Framework changes (shared files)

`ReportFilter.choices`, `ReportDefinition.defaultGroupBy` / `defaultPreset` (validated at start), the choices route, `report-sources.ts` (`PROJECTION_TABLES`, `RAW_SQL_SCHEMAS`, the fiscal table), `ANALYTICS_MODULES` (`pos`), `contracts.ts` (three events), `permission.catalog.ts` (through the modules), the dashboard's widget classes and shop persona, the projections module.

### Tests (step 10)

| Kind | Where |
|---|---|
| Unit | `pos.reports.spec.ts` (nine reports valid, registered, reading only announced tables, scoped by place and date, opening as titled, with pickers), `pos.widgets.spec.ts`, `projections.spec.ts` (the projection scopes every query to the organisation), `repositories.sql.spec.ts` (the widgets' queries); `commerce-pos`: a domain test (a spell closes once with its own id) |
| Endpoint | `test/pos-reports.e2e-spec.ts` (15: every report's figures from posted sales, returns, a void, a discount, an offline sale, a shift, a spell, an exception and two fiscal sales; a spell sent twice is one; the read models following the events equal a rebuild; cached and live; pickers; the permission; export; another organisation sees none) |
| Drill | `npm run channel:drill`: a spell kept once, the read models hold the shift, the spell and the exception, a rebuild twice leaves one row per shift |
| Tenancy | `test/tenancy.sweep-spec.ts` fixture (an offline spell); `TENANCY_ROUTES='/api/v1/(analytics/reports\|sales-channels\|dashboard)/'` |
| Integration | `commerce-pos`: `make test-integration` (offline then back reports one spell; a second spell is a second row) |
| Web | `reports.models.spec.ts`, `pos.model.spec.ts`; stubbed Cypress `pos-reports.cy.ts` (4, axe); live `cypress/e2e/live/pos-reports.cy.ts` (written; the integrator runs it) |

### Known limits (step 10)

- The first time the API runs with this code, the projection follows the channel topic from its beginning (a new consumer group), so history fills in by itself; `npm run projections:rebuild -- pos-activity` does it at once.
- Names are those at the last recompute: a renamed till shows its old name on rows until an event touches them.
- A report by hour has an hour per local clock hour; a sale rung offline carries the time the till stamped, which is the till's clock.
- Offline minutes are those the device reported; a till that never comes back is not counted until it does.
- Cash differences are the POS backend's last report of the shift; a shift never reported is not there.

## Step 8: tax and fiscal rules

Built 14 October 2026, branch `feat/pos-reports-fiscal` in `commerce-api`, `commerce-web`, `commerce-pos`, `commerce-pos-app` and `commerce-pos-web`. A country's tax and fiscal rules are a **module** of the POS backend ([`commerce-pos/docs/fiscal.md`](../../commerce-pos/docs/fiscal.md)) behind this repository's `fiscal` integration slot. The organisation's fiscal profile for a country (step 1) says how that country's sales are reported; the POS backend applies the country's rules and reports to its authority; the tills print what the country requires; this repository shows where each sale stands and lets a person work through the rejections.

### Which countries have a module, and what is simulated

| | Built | Simulated or not connected |
|---|---|---|
| **Nigeria (`NG`)** | The rules: VAT 7.5% (a line may carry 7.5% or 0%), prices inclusive or exclusive by the profile, the seller's TIN, the buyer's TIN for a business, the receipt it requires, the reporting deadline, the checks FIRS would make; provider `ng-firs-sandbox` | **`ng-firs-sandbox` is a pretend FIRS** (checks the e-invoice, accepts with a stamp and QR, rejects with reasons, can be slow or down): nothing reaches FIRS, and it is **refused in production**. **`ng-firs` (the real connection) is not connected**: the sale is mapped to FIRS's e-invoice and not sent; the mapping is from the published data dictionary as understood and has never run against FIRS. |
| **Ghana (`GH`)** (17 October) | VAT with the NHIL and the GETFund Levy (and the COVID-19 levy while a schedule has it), the rate schedule and how the levies combine with VAT set in the ERP with dates; the TINs; the receipt (each tax, the GRA invoice number, signature, QR); credit notes that name the invoice they undo. [Step 8b](#step-8b-ghana-and-kenya-17-october-2026) | **`gh-gra-sandbox` is a pretend GRA E-VAT** (refused in production). **`gh-gra` is not connected**: the sale is mapped to the E-VAT invoice and not sent; the mapping is from public guidance as understood and has never run against the GRA. |
| **Kenya (`KE`)** (17 October) | eTIMS tax types A to E from the rate schedule and the item's mapping; the PINs; an item classification code and units for every item; the device and branch registered with the authority; the receipt (control unit serial and count, internal data, signature, QR); credit notes. [Step 8b](#step-8b-ghana-and-kenya-17-october-2026) | **`ke-etims-sandbox` is a pretend eTIMS control unit** (refused in production). **`ke-etims` is not connected**: the sale and the device initialisation are mapped and not sent; never run against KRA. |
| any other country | None. A profile is stored and given to the tills; its sales wait and are flagged overdue, "no fiscal module is set up" | provider `sandbox` (any country, for tests; refused in production) |

Real calls to a tax authority are held to the end of the programme, as the payment rails are. The module is not a certified fiscal device and is not advice on a business's Nigerian tax obligations. The TIN check is of the shape (8 to 14 digits, an optional four-digit branch suffix), not a lookup.

### The profile (Fiscal tab, step 1, extended)

The `fiscal` slot's providers now carry the countries they report for and whether they are simulated (`ProviderDefinition.countries`, `.simulated`; shared file `integrations.catalogue.ts`). Saving a profile refuses a provider that does not report for its country and a simulated provider in production (`FiscalService`); each profile says, in words, **what is wrong or doubtful with it** (`problems`: reporting required with no provider, a provider that is not connected, a simulated provider, no seller's TIN), so a manager sees it before a sale waits. The Fiscal tab shows those problems and describes each provider, saying so when it is simulated or not connected.

### What the tills print

The till configuration carries the country's receipt requirements from the profile; the Kotlin and web tills print: the seller's TIN, VAT by rate, "Prices include VAT" or the tax added, the invoice reference number (IRN), the authority's stamp and the QR payload; a sale rung offline prints the plain provisional receipt marked as such, and the stamp is added when the sale is reported. Tills that were offline queue the sales, which are reported by the POS backend within the deadline.

### The fiscal record and its history

`sales_channel.pos_sale_fiscal` (step 10) gains `reasons` (one to a line), the authority's `signature`, when a retry was last asked for and how many were (migration `1781960000000`); `sales_channel.pos_sale_fiscal_events` is its history, appended and never changed: each move of the sale's standing (waiting, reported, accepted, rejected, overdue) and each retry, with the authority's words and who asked. A late or repeated answer never takes an accepted sale back, and the history records the standing the record ended in, not the answer that arrived. The POS backend tells the ERP each status reliably (a status it could not tell is told on a later pass).

### API (added; `trade.pos.read`, retry needs `trade.pos.exceptions.resolve`)

| Route | |
|---|---|
| `GET /sales-channels/:id/pos/fiscal/sales` | The sales that must be reported, rejected and overdue first. Filters: `status` (comma-separated), `needsWork` (rejected or overdue), `tillId`, `search`; paged |
| `GET /sales-channels/:id/pos/fiscal/sales/:saleId` | One sale's record with its history and open exception |
| `POST /sales-channels/:id/pos/fiscal/sales/:saleId/retry` `{ note? }` | Report a rejected or overdue sale again |

A **retry** resolves the sale's open `fiscal_rejected` or `fiscal_overdue` exception with the resolution `retry` (and the note) and writes a retry to the history. It is the POS backend that reads that resolution and queues the sale again; the ERP then shows it waiting, then accepted or rejected again. A sale that is not rejected or overdue, or whose exception is not open, answers `409` with the reason.

### Web

A POS channel's page gains a **Tax reporting** tab: a list of the sales that must be reported (rejected and overdue first, with the authority's reference and reasons, filters by status, needs-work and search), one sale's drawer with its history, and **Report it again** (the retry) in the row's Actions menu with a note. The Fiscal tab gains the profile's problems and the providers' notes. The `pos.fiscal_status` report (step 10) shows the same figures.

### Tests (step 8)

| Kind | Where |
|---|---|
| Unit | `pos-fiscal.logic.spec.ts` (what is wrong with a profile), `fiscal.service.spec.ts` (provider and country, simulated refused in production), `integrations.spec.ts` (the slot's providers); `commerce-pos`: the Nigerian module, the adapters, the registry and the sale's fiscal state |
| Endpoint | `test/pos-fiscal.e2e-spec.ts` (7: a profile names the authority and is refused what cannot work; a sale that must be reported has a record and a history; rejections first with reasons; a retry resolves the exception once and is kept; an overdue sale is retried the same way; the permission and another organisation; the fiscal report equals the screen) |
| Integration | `commerce-pos`: `make test-integration` (online stamp, offline queue, rejection and retry, overdue, authority down and back, sandbox refused in production) |
| Smoke | `commerce-pos/scripts/smoke.py` section 7: the sales of a run reported through the worker, a rejection made, the ERP's retry, acceptance. Extended and compiled; **not run by the author** (see below) |
| Tills | Kotlin `FiscalReceiptTest`; web till unit and Playwright `e2e/tests/fiscal.spec.ts` |
| Web | `pos.model.spec.ts`; stubbed Cypress `pos-fiscal.cy.ts` and `pos-channel.cy.ts` (axe); live `cypress/e2e/live/pos-fiscal.cy.ts` (written; the integrator runs it) |

### Known limits (step 8)

- Only Nigeria has a module; the authority it reports to is simulated and the real adapter's request is unverified and never sent.
- A change to a country module's requirements reaches a till with its next configuration change or bootstrap.
- The buyer's TIN is carried on the sale but the tills do not yet capture it at the counter.
- Return and void credit notes refer to the receipt number they undo, not to the original sale's IRN.
- The simulated authority's memory of accepted invoice numbers is lost when the POS backend restarts.
- The extended `scripts/smoke.py` was not run against a live ERP by the author: it signs in as the shared test owner (ending that owner's other sessions), and the new events (`pos.shift.reported`, `pos.offline_spell.recorded`, `pos.sale.fiscal_changed`) have no contract on a master that does not yet have this branch, so a master relay would hold the test organisation's outbox. Run it after the merge.


## Step 8b: Ghana and Kenya (17 October 2026)

Built 17 October 2026, branch `feature/fiscal-gh-ke` in `commerce-api`, `commerce-web`, `commerce-pos` (and a note in `commerce-pos-web`). Two more country modules on the step 8 port, each with a simulated authority; real connections stay held with the real rails. What the POS backend does is in [`commerce-pos/docs/fiscal.md`](../../commerce-pos/docs/fiscal.md); this is the ERP's half: where the rates and options are set, the profile's device, the catalogue mapping, the screens, the events and the reports.

### Assumptions (written down, not advice)

- **Ghana.** The Value Added Tax Act, 2025 (Act 1151) as public summaries describe it: from 1 January 2026 VAT 15%, NHIL 2.5% and the GETFund Levy 2.5%, all on the same base (20% together; the levies are input-creditable); the 1% COVID-19 Health Recovery Levy repealed from the same day. Up to 31 December 2025 the levies were charged first and VAT on top of them (21.9% together with the COVID levy). These are the **defaults of the organisation's schedule**, not rates in code; when the law is read differently or changes, the organisation edits the schedule.
- **Kenya.** eTIMS sorts items into tax types A (exempt), B (standard-rated, 16%), C (zero-rated), D (non-VAT) and E (the 8% rate that applied to petroleum products until they moved to the standard rate on 1 July 2023). The default schedule says exactly that; an organisation that sells nothing at 8% never sees E.
- **Deadlines.** Neither authority's offline window is known here, so the default reporting deadline stays 24 hours (the profile's own value wins).
- **The API shapes** the real adapters map to are from the authorities' public guidance as understood and **have never run**: see the owner's list in `commerce-pos/docs/fiscal.md`.

### Where each thing is set

| What | Where |
|---|---|
| That a country is reported, the authority, the tax number, the deadline | the **fiscal profile** (Fiscal tab), as for Nigeria; a place can have its own |
| **The taxes in force and the days each applies** | the country's **document settings**: `fiscal-ghana` and `fiscal-kenya` (Admin → Document settings; organisation, or one place). `rateSchedule` is lines of text (`NHIL 2.5 2013-01-01`, a last day optional); a change of law is a new line. Saving refuses a line it cannot read, naming it, and a schedule without VAT (Ghana) or type B (Kenya) |
| How Ghana's levies combine with VAT, and what a Ghanaian item with no tax is | `fiscal-ghana`: `levyBeforeVatUntil` (a day; the cascade up to and including it), `zeroRateTreatment` |
| What a Kenyan item with no tax is, and the classification code and units for an item not mapped | `fiscal-kenya`: `zeroRateCategory` (A, C or D), `defaultItemClassCode`, `defaultPackageUnit`, `defaultQuantityUnit`, `defaultOrigin` |
| **The branch and the device** an authority registers (Kenya) | the profile: `branchId` (two digits, `00` the head office) and `deviceSerial`; a different PIN, branch, serial or provider starts the registration again |
| **The catalogue mapped to the authority** | the **Item codes** tab: per item or per category, the classification code, the tax type and the units (Kenya), the tax type (Ghana); the item's own fills over its category's, field by field; retired, never deleted |

The item's own tax code in the ERP carries the **combined** rate for a standard-rated sale (the Fiscal tab says what it is today: 20% in Ghana from 2026, 16% in Kenya); the module splits the tax the till charged among VAT and the levies in the schedule's proportion, so the invoice always adds up to the receipt. A line at another rate is a warning for Ghana and a refusal for Kenya (eTIMS has only its tax types).

### Data (migrations `1784000000000`, `1784000000100`; no seed)

- `sales_channel.fiscal_profiles` gains `branch_id`, `device_serial`, `device_status` (`none`, `requested`, `registered`, `failed`), `device_unit_id`, `device_mrc_no`, `device_message`, `device_registered_at`, `device_requested_at`. **The communication key is never here**: the POS backend seals it and nothing sends it.
- `sales_channel.pos_sale_fiscal` gains `kind` (`invoice`, `credit_note`), `document_no`, `original`, `qr_data`, `lines` and `tax` (jsonb: the sale's tax by tax), and an index by country and day.
- `sales_channel.fiscal_item_codes` (organisation first): country, scope (`item` or `category`), the variant or category, `class_code`, `tax_category`, `package_unit`, `quantity_unit`, `origin`, `product_type`, status. One live mapping per country and item or category.
- Numbering rules for the two settings documents (`fiscal-ghana` `FGH`, `fiscal-kenya` `FKE`; nothing is numbered).

### API

| Route | |
|---|---|
| `GET /sales-channels/:id/fiscal/countries` (`trade.pos.read`) | The countries whose module reads a schedule, their authority, whether they register a device, and the settings document |
| `GET /sales-channels/:id/fiscal/setup?country=&locationId=` | A country's schedule as read, what could not be (by line), the taxes in force today, the rate for the items' tax code, and what is wrong |
| `POST /sales-channels/:id/fiscal/:profileId/register-device` (`trade.pos.fiscal.manage`) | Ask for the device to be registered now; `409` for a country with no devices, a retired profile, or a profile missing its provider, tax number, branch or serial |
| `GET /sales-channels/:id/fiscal/items?country=&scope=&search=&includeRetired=&before=&limit=` (`trade.pos.read`) | Mappings, newest change first; keyset (`before` is the last row of the page before) |
| `PUT /sales-channels/:id/fiscal/items` (`trade.pos.fiscal.manage`) | Map an item or a category (changes the live mapping if there is one); refused in words: a code that is not ten digits, an unknown tax type, nothing said, both an item and a category, a country with no module |
| `POST /sales-channels/:id/fiscal/items/:itemCodeId/retire` | Retire (kept) |
| `GET /sales-channels/:id/pos/fiscal/sales?country=` | The tax reporting list gains a country filter; each record gains `kind`, `documentNo`, `original`, `qrData`, `lines`, `tax` |
| Channel API `POST /channel/v1/pos/fiscal/items` | For the POS backend: `{ country, variantIds }` → how those items are mapped (items with no mapping are absent) |
| Channel API `POST /channel/v1/pos/fiscal/devices` | For the POS backend: where a device's registration stands (`registered` or `failed`, the control unit, the authority's words); a report about a branch or serial the profile no longer names is ignored |
| Till configuration (`GET /channel/v1/pos/tills/:tillId/config`) | `fiscal` gains `branchId`, `deviceSerial`, and for Ghana and Kenya `rates` (parsed, with days) and `settings` for the till's place |

### Events

`pos.fiscal.changed` (a profile saved or retired: one per POS channel, so every till reads the new rules), `pos.fiscal.device_requested`, `pos.fiscal.device_changed` (contracts in `contracts.ts`, on `commerce.channel.v1`). The POS backend consumes the first two. Live: the room **`doc:PosFiscal:<channelId>`** (`trade.pos.read`; the channel must be a POS channel of the organisation) is told by `pos.sale.fiscal_changed`, `pos.fiscal.changed`, `pos.fiscal.device_requested` and `pos.fiscal.device_changed`; the Fiscal and Tax reporting tabs read again once when told and once after a reconnect.

### Web

- **Fiscal tab:** for a country whose authority registers a device, the drawer asks for the branch id and the serial number; the table shows the device (not registered, asked for, registered with its control unit, refused with the authority's words) and **Register the device** is in the row's Actions menu; below the table each country with a module and a live profile shows its taxes in force today, the rate to put on the items' tax code, anything wrong with the schedule, and a link to the settings that hold it.
- **Item codes tab** (new): the mappings with a country, scope and search filter and "Show more"; a drawer maps an item (found by name or SKU among what the channel sells) or a category; Actions: Change, Retire.
- **Tax reporting tab:** a country filter; credit notes marked; the drawer gains **Tax reported** (tax by tax), the invoice a credit note undoes, and what the authority adds to the receipt.

### Reports and the dashboard

`pos.fiscal_status` already grouped and filtered by country. New: **`pos.fiscal_tax`** (Tax reported to the authorities): the tax of every accepted document, tax by tax (credit notes taken off), by country, rate, document, day and place; it is the figure behind a VAT return, not the return (the ledger's VAT report is that). It reads `pos_sale_fiscal`, which announces its changes, so it is cached.

### Tests (step 8b)

| Kind | Where | Run |
|---|---|---|
| Unit | `fiscal-rates.logic.spec.ts` (the schedule text, the days, the settings), `fiscal.service.spec.ts` (Ghana and Kenya providers, branch and serial, device request and report), `fiscal-item-codes.service.spec.ts` (what eTIMS and the GRA would refuse), `pos-fiscal.logic.spec.ts` (device and schedule problems), `pos-fiscal-live.spec.ts`, `pos.reports.spec.ts`; `commerce-pos`: both modules, both authorities, both mappings, the preparation of a sale | `env -i PATH="$PATH" HOME="$HOME" npx jest --maxWorkers=2 src/modules/sales-channel/pos src/modules/integrations src/modules/analytics/reports`; `go test -p 2 ./...` |
| Drill | `channel:drill` (the Ghana and Kenya section, 14 checks): run as the application role under row-level security on a scratch copy | `QUEUE_PREFIX=drill-channel TS_NODE_PROJECT=$PWD/tsconfig.json npm run channel:drill` |
| Integration | `commerce-pos` `test/integration/fiscal_ghke_test.go` (a Ghana sale stamped with its taxes and the ERP told them; a return waiting for its sale and going as a credit note; a return of an unknown sale refused in words; Kenya's device registered on the first sale and invoices numbered; an unmapped item refused then accepted; the device asked for ahead of a sale, a second serial refused) | `make test-integration` |
| Web | `pos.model.spec.ts` (item summaries, tax types, device words, the report list) | `npx ng test --watch=false --include src/app/features/channels` |

**Deferred tests (the test lane, with CI):** an endpoint spec `test/pos-fiscal-gh-ke.e2e-spec.ts` (profiles for both countries and what each refuses; the settings refusing an unreadable schedule and the till reading the changed one; a device asked for, reported, a stale report ignored, a changed serial starting again; item mappings merged, refused, retired, and another organisation seeing none; a stamp's tax lines, a credit note, the country filter and the report's figure; events against their contracts), tenancy sweep fixtures for the new routes (a Kenyan profile and a mapping), stubbed Cypress for the Fiscal, Item codes and Tax reporting tabs (with axe) and a live spec, the Playwright web till printing a Ghanaian and a Kenyan receipt (needs the Kotlin core change below), and a run of the extended `scripts/smoke.py`.

### Known limits (step 8b)

- **Nothing reaches a real authority.** Both real adapters are mapped and unconnected; see the owner's list.
- **The tills print each tax and the control unit's lines** since 17 October 2026: the Kotlin core reads `requirements.showTaxes`, `requirements.authorityLines` and the stamp's `tax`, `lines` and `kind` (commerce-pos-app `a713970`); credit notes print as such and name the invoice they undo. A till that predates it prints the number, signature and QR code; nothing is harmed.
- Item mappings are by item and by exact category (no parent categories); a Ghanaian mapping is the tax type only.
- Kenya's authority wants an invoice number from the client: it is a sequence per device kept in the POS backend, so a second POS backend on the same branch would clash (one device per branch is the rule eTIMS itself sets).
- A return of a sale made before the profile reported to the authority cannot be a credit note (the authority never had the invoice): it is refused in words and a manager decides.
- Place-specific fiscal settings follow the document-settings pattern (a place overrides the organisation); the Fiscal tab previews the organisation's schedule only.
- The `pos.fiscal_tax` report counts accepted documents only, and in the document's own currency.

## Step 7: terminal hardware (built 13 October 2026, `commerce-pos-app`)

The user's decision: start with the most popular makers; the goal is to support every maker. **None of it has run on a real terminal yet** — only the Android emulator and fakes were available; the support matrix, licences and what was and was not tested are in `commerce-pos-app/docs/hardware.md`.

- **Detection and the Devices screen:** each slot (printer, drawer, scanner, camera, customer display, card terminal, scale) has adapters; the till recognises Sunmi, PAX, Ingenico, Verifone, Newland, iMin, Urovo, Telpo, Nexgo, Castles and Landi by manufacturer and model (Topwise is to be added, see wave 2) and picks an adapter, which the installer can override or switch off per slot without a restart. *Settings → Devices* shows what was found, the status of each slot and test buttons (page, drawer, scanner, camera, second screen, card terminal).
- **Printing:** a receipt is laid out once and encoded per printer; ESC/POS with eight printer profiles, 23 code pages, QR codes, barcodes, cutter, drawer pulse and status read-back; scripts the printer cannot draw (Arabic, Hebrew, Thai, Hindi, Chinese) printed as pictures; network, Bluetooth, USB and device-file links.
- **Built (wave 1):** Sunmi printer, drawer and built-in scanner; Sunmi card payment through the Tapro payment app (test mode); PAX printer (through the NeptuneLite library the terminal's owner installs); Star printers (StarXpand); Epson TM and any ESC/POS printer; camera scanning (CameraX and ZXing, no Google Play Services); a customer display on any Android second screen; Urovo and Newland scanner broadcasts.
- **Designed (wave 2):** Ingenico, Verifone, Newland, iMin, Urovo, Telpo, Nexgo, Castles, Landi, and **Topwise** (added 20 Oct 2026 at the user's request: Shenzhen Topwise's Android smart POS and payment terminals, https://www.topwisesz.com/; its entry in the till's maker catalogue is still to be built) — detected, with camera and second-screen support; their printers and card terminals say "not connected" and what is needed from the maker.
- **Ports only (wave 3):** scales (CAS, Mettler-Toledo, Dibal), ZPL label printers, NFC.
- **What the team must obtain:** PAX's NeptuneLite library and service; a SUNBAY sandbox account and the Tapro app for Sunmi card payments; each wave-2 maker's SDK or integration guide (for Topwise: its device SDK for the printer, scanner and card reader, and the list of models to support); a legal review of Star's SDK licence (it allows object-code distribution in an application but also speaks of internal business use; without it, Star printers still work over ESC/POS); at least one real Sunmi, PAX, Epson TM and Star device to turn "built" into "verified".

## Allowances, in detail

`reconcile` (`PosAllowancesService`) brings the units held for the channel's tills to what the rules resolve to — all tills, or one:

- **When:** rules saved; a till paired (the others' shares shrink), blocked, unblocked or retired; the channel going live, paused or retired (`ChangeChannelStatusUseCase`); `POST …/allowances/refresh` (admin) and `POST …/tills/:id/allowances/refresh` (the POS backend's top-up after a sync).
- **What counts:** only tills that are **active and paired** hold or share anything; a channel that is not `active` holds nothing. A till still waiting for its code takes no share.
- **Fixed:** `fixed_quantity` per till. **Share:** `trunc((sellable at the place + what the channel's tills already hold there) × percent ÷ 100 ÷ tills at that place, 4 decimals)` — the held part is counted so setting stock aside does not shrink the next share. **Any:** nothing held. **Not sellable offline:** 0.
- **Surplus** (rule gone, till stopped, target lowered) is released; a **shortage** is reserved as far as stock allows. Work is done in order of item, place, then till so two passes never wait on each other; each reservation takes the same (item, place) advisory lock orders take.
- **Selling syncs back:** the POS backend calls `…/allowances/release` with the units sold offline **before** posting those sales (they go back to the sellable side so the sale can issue them), then `…/allowances/refresh` to top the allowance up. Never more than the till holds is released.

## POS settings (`settings.pos`)

| Group | Setting | Default |
|---|---|---|
| `offline` | `maxOfflineHours` (1–720) | 24 |
| | `maxOfflineSalesValuePerShift` (0: no limit) | 0 |
| | `offlineCardLimit` (0: no card offline) | 0 |
| `payments` | for each of `cash`, `card`, `bank_transfer`, `payment_link`, `qr`, `wallet`, `gift_card`, `store_credit`, `on_account`: `enabled`, `allowedOffline` | cash, card, bank transfer accepted; cash and bank transfer offline |
| `shift` | `blindClose`, `floatAmount` | off, 0 |
| `sale` | `becomes` (`invoice_and_receipt` / `sales_order_and_receipt`), `askForPhone`, `returnWindowDays`, `walkInCustomerId` (checked to be one of the organisation's contacts) | invoice and receipt, off, 14, none |
| `receipts` | `numberBlockSize` (10–100,000), `heldAppVersion` (empty: the newest) | 500, empty |

A payment type that needs the payer's bank (`payment_link`, `qr`, `wallet`) cannot be `allowedOffline` — the schema refuses it. Unknown keys are refused. Changed through `PATCH /sales-channels/:id` with `settings: { pos: { … } }` (only what changes; two levels deep), permission `trade.channels.update`. The `pos` section is part of the settings schema only for this kind; every other kind refuses it, and online-store behaviour is unchanged.

## Data

Schema `sales_channel`, migration `1780850000000-pos-channel`; every table leads with `organization_id`.

| Table | What |
|---|---|
| `tills` | The device: channel, place, code (unique per channel), status, wipe flag, `credential_hash`, device label, app version, last seen. |
| `till_enrolments` | Code hash, hint (last three characters), expiry, used / voided. |
| `cashiers` | Staff link, role, limits, `pin_hash`, who set it and when. Unique per channel and staff. |
| `allowance_rules` | Variant **or** category (a check says exactly one), `sellable_offline`, mode, fixed quantity, share percent. |
| `till_allowances` | What each till was last given per item: mode, target, `reserved`, the place. Its id is the reservation source. |
| `number_counters`, `number_blocks` | The counter per channel and document (`receipt`, `return`), and each block (`from_seq`..`to_seq`, unique start) with its till. |
| `fiscal_profiles` | Country, optional place, `tax_inclusive`, `receipt_requires_tin`, `reporting_required`, `reporting_deadline_hours`, `tax_number`, `provider`, status. One live profile per country and per place. |

## API

### Admin — `/api/v1/sales-channels/:id/…` (kind `point_of_sale` only; others answer 422)

| Method | Path | Permission | What |
|---|---|---|---|
| GET / POST | `/tills` , `/tills?includeRetired=true` | read / `tills.manage` | List; register `{ name, code?, locationId, enrolmentHours? }` → `{ till, enrolment: { code, hint, expiresAt } }` (the code, once). |
| GET / PATCH | `/tills/:tillId` | read / manage | One till with the state of its codes (never a code); rename. |
| POST | `/tills/:tillId/enrolment` `{ hours? }` | manage | A new code (older ones voided); an active till only. |
| POST | `/tills/:tillId/block` `{ reason?, wipe? }`, `/unblock`, `/retire` `{ reason? }`, `/wipe` | manage | Status moves and the wipe flag. Block and retire release the till's stock. |
| GET | `/number-blocks?tillId&limit` | read | Blocks given, newest first. |
| GET / POST | `/cashiers` , `/cashiers/staff?search` | read / `cashiers.manage` | List; assign `{ staffId, role?, maxDiscountPercent?, mayOverridePrice?, maxRefundAmount?, maxVoidAmount? }`; the staff picker (those not yet cashiers, needs no HR access). |
| PATCH / DELETE | `/cashiers/:cashierId` | manage | Change role and limits; remove (the PIN goes). |
| PUT | `/cashiers/:cashierId/pin` `{ pin }` ; `/my-pin` `{ pin }` | manage ; read | Set a PIN. |
| GET / PUT | `/allowances` | read / `allowances.manage` | The rules; replace them (and set the stock aside). |
| GET | `/allowances/resolved?tillId&after&limit` | read | What the rules come to per till and item: `target` and `held`. |
| POST | `/allowances/refresh` `{ tillId? }` | allowances.manage | Reconcile now. |
| GET / PUT | `/fiscal` , `/fiscal?includeRetired=true` | read / `fiscal.manage` | Profiles and the `fiscal` slot's providers; set the profile of a country (and place). |
| POST | `/fiscal/:profileId/retire` | fiscal.manage | Retire (kept). |

### Channel API — `/api/channel/v1/pos/…` (the channel's own key; plain JSON)

| Method | Path | What |
|---|---|---|
| POST | `/tills/enrol` `{ code, deviceLabel?, appVersion? }` | Swap a code for `{ tillId, credential, till, config }`. 400 for any bad code. Pairing runs `reconcile` for the channel. |
| POST | `/tills/:tillId/connect` `{ credential, appVersion? }` | Check in: `{ status, locked, wipe, heldAppVersion, maxOfflineHours, serverTime }`. 401 for a wrong credential. |
| POST | `/tills/:tillId/wiped` `{ credential }` | The device has wiped itself; the credential is cleared. |
| GET | `/tills/:tillId/config` | The till, channel, place, settings (`offline`, `shift`, `sale`, `receipts`), `paymentTypes` with `allowedOffline` (and the offline card limit), `cashiers` with **hashed PINs** and limits, `allowances` (per item the most it may sell offline; `null`: any amount), the matching `fiscal` profile (the place's own, else its country's). |
| POST | `/tills/:tillId/allowances/release` `{ sold: [{ variantId, quantity }] }` | Units sold offline have synced (call before posting the sales). |
| POST | `/tills/:tillId/allowances/refresh` | Top up and return the allowances. |
| POST | `/tills/:tillId/numbers/next` `{ document? }` | The next block: `{ document, prefix, from, to, size, padding, first, last }`. Numbers are `<ORDERPREFIX>-R-000123` (`-RT-` for returns). |

A key of a shop opens none of it (422); another channel's key cannot reach this channel's till (404).

## Events

On `commerce.channel.v1`, each carrying `organizationId`: `pos.till.registered`, `pos.till.blocked` (with `wipe` 0/1), `pos.till.unblocked`, `pos.till.retired`, `pos.allowance.changed` (`cause`, `items`, optional `tillId`). Contracts in `contracts.ts`. The channel's history (`channel_events`) also records cashier, PIN (who, never what), fiscal and wipe steps.

## Permissions

Seed `sync-permission-catalog-v74`.

| Permission | Allows | Default roles |
|---|---|---|
| `trade.pos.read` | See tills, cashiers (never PINs), allowances and fiscal profiles; set one's own PIN | owner, admin, manager, viewer |
| `trade.pos.tills.manage` | Register, pair, block, wipe, retire tills | owner, admin |
| `trade.pos.cashiers.manage` | Assign cashiers, limits and PINs | owner, admin, manager |
| `trade.pos.allowances.manage` | Offline rules; set the stock aside | owner, admin |
| `trade.pos.fiscal.manage` | Fiscal profiles | owner, admin |

## Web

Sales → Channels → a POS channel's page gains tabs (shown to `trade.pos.read`): **Tills** (list, register in a drawer, the code shown once, block / unblock / wipe / retire and "make a code" in one Actions menu, the number blocks below), **Cashiers** (assign in a drawer, change limits, set a PIN — typed twice, kept out of the form after — remove; "Set my PIN" for any cashier), **Offline allowance** (rules edited as a list and saved whole, then what they come to for a chosen till), **Payments & offline** (the settings above; only what changed is sent) and **Fiscal** (profiles in a drawer). Every list uses `ui-list-state`.

## Tests

| Kind | Where | Run with |
|---|---|---|
| Unit | `sales-channel/pos/pos.logic.spec.ts` (share arithmetic, reconcile, number blocks, codes, PINs, fiscal choice, POS settings) | `env -i PATH="$PATH" HOME="$HOME" npx jest --maxWorkers=2 src/modules/sales-channel` |
| Endpoint | `test/pos-channel.e2e-spec.ts` (33: channel and settings, tills, enrolment once / race / expiry / voiding, credentials, wipe, cashiers and PINs never returned, hashes in config, allowances reserving stock the shop cannot sell, release and top-up, rules refused, number blocks never overlapping under concurrency, fiscal profiles, tenancy 404, events against their contracts) | `env -i PATH="$PATH" HOME="$HOME" QUEUE_PREFIX=e2e-pos npx jest --config ./test/jest-e2e.json --forceExit test/pos-channel.e2e-spec.ts` |
| Drill | `npm run channel:drill` gains a POS section: a till paired once, an allowance reserved in the ledger and released as sales sync, topped up, number blocks following each other, a blocked till giving its stock back | `QUEUE_PREFIX=drill-channel TS_NODE_PROJECT=$PWD/tsconfig.json npm run channel:drill` |
| Tenancy | `test/tenancy.sweep-spec.ts` fixture (a POS channel with a paired till, cashier, rule, profile and block) | `TENANCY_ROUTES=/api/v1/sales-channels/ npx jest --config ./test/jest-tenancy.json --forceExit` |
| Web | `pos.model.spec.ts`; stubbed `cypress/e2e/pos-channel.cy.ts` (27, with axe); live `cypress/e2e/live/pos-channel.cy.ts` (written, not run) | `npx ng test --watch=false --include src/app/features/channels` |

## Known limits

- **Nothing enforces the allowance on a device yet** (steps 2–4): the ERP sets the stock aside and sends the numbers; the till and `commerce-pos` honour them.
- **Reconciliation runs inside the request** that changes the rules: it is a pass over (assortment items with a rule) × (paired tills). Fine for a shop; a very large category rule on many tills wants a queued job (performance pass).
- A till's share is split across the **paired, active tills at its place**; shares are not stored per till, so changing the number of tills moves everyone's share at the next `reconcile` (which pairing, blocking and retiring run).
- Serial and batch items are not yet sent only the serials or batches meant for a till; `any` ignores stock.
- Receipt numbers come from their own counter, not the channel's order numbering (`order_seq`): `<ORDERPREFIX>-R-` and `-RT-`. Blocks are never returned, so a till that does not use its block leaves a gap.
- The credential is a bearer secret held by the device; there is no per-request signing between the POS backend and the till yet (step 2).
- The `fiscal` slot has one provider, `none`; each country's module is a later step. Profiles are organisation-wide, shown on every POS channel.
- `event-coverage.spec` has failures on `master` already (the party repositories); not from this work.

## Live updates (16 October 2026)

The allowances page follows `doc:PosAllowances:<channelId>`: a reconcile (rules
saved, channel live or paused, a till enrolled, or someone pressing "Set the
stock aside again" — kept, it is a command) raises `pos.allowance.changed` and
the page reads the till on screen once. See
[LIVE_UPDATES.md](LIVE_UPDATES.md#push-not-poll-part-2-16-october-2026). Tests:
`pos-allowances-live.spec.ts`, Cypress `pos-channel`.

## History

- 16 October 2026: **a till channel comes with its card-payments account** (found by the demo data: the first card sale posted "payment not booked"). `CreateChannelUseCase` makes a "Card payments <currency>" clearing account for the whole organisation when a point-of-sale channel is made, unless every place it sells from already has a card or clearing account in its currency (`PosSettlementAccountsService`, `cardClearingNeeded`). Chosen over refusing such a sale: a till sells offline and syncs after the customer has gone, so a refusal would lose a sale that happened. The place's own account is still used first; the organisation renames or replaces this one as it likes; if finance refuses it (a currency not yet the organisation's), the channel is still made and a card sale reports the missing account as before. **Channels made before this** keep their open "payment not booked" exceptions: **Actions → Make the account…** books every one of them (with the account made or one already there); nothing posted is touched. A **bank transfer** in `pending_confirmation` still waits for its confirmation by design (it is not money in hand). No migration. Tests: `pos-settlement-accounts.service.spec.ts` (8), `channel:drill` +1.

- 17 October 2026: step 8b (API, web, `commerce-pos`): the fiscal modules for Ghana (GRA E-VAT: VAT, NHIL, GETFund Levy) and Kenya (KRA eTIMS: tax types A to E, item classification codes, a registered device), each with a simulated authority and an unconnected real adapter; rate schedules with dates in the country's document settings; the profile's branch and device; the catalogue mapped to the authority; credit notes that name the invoice they undo; the Item codes tab; the `pos.fiscal_tax` report; `doc:PosFiscal` live. Migrations `1784000000000`, `1784000000100`; no seed.
- 14 October 2026: step 8 (API, web, `commerce-pos`, both tills): the Nigerian fiscal module (VAT, inclusive or exclusive, TIN, the receipt FIRS e-invoicing requires) with a simulated FIRS and a real adapter that is mapped but not connected, fiscal providers that name their countries and are refused when simulated in production, a fiscal history per sale, a Tax reporting tab with rejections and retry. Migration `1781960000000`; no seed.
- 14 October 2026: step 10 (API, web, `commerce-pos`): nine point-of-sale reports in a `pos` analytics module over the `pos-activity` projection, pickers by name in the reports screen, a fiscal record per sale, offline spells reported by the POS backend, five dashboard widgets, a Reports tab on the channel. Migrations `1781950000000`, `1781950000100`; seed v95.
- 14 October 2026: step 9 (API, web, `commerce-pos`, both tills): customers found and made at the till with the consent answer, loyalty earned, spent and taken back, gift cards sold, topped up, spent and refunded onto, store credit, wallet, on account, QR and payment link at the till, split tenders, refunds the way the sale was paid. Migrations `1781650000000`, `1781650000001`.
- 13 October 2026: POS completion (API, web, `commerce-pos`): a till's return or void is a credit note against the sale's invoice, the already-paid part released from the receipts that paid it and the refund paid out of the right treasury account (customer refunds, `ar-refund`, are a document of their own); gift card, store credit, wallet, on account (with the credit-limit check), QR and payment link are booked; a missing treasury account is made in one click; an oversold exception suggests a transfer; gift cards as an instrument (posting role `gift_card_liability`, account 2440); CORS for the web till; the checkout and gift-card calls through `commerce-pos`; steps 3 to 5 documented. Migrations `1781200000000`, `1781200000100`, `1781200000200`; seed v80.

- 13 October 2026: step 2 (API and web, with the new repository `commerce-pos`): sales posted once as invoice, receipts and stock; shifts and cash; sync exceptions with a resolution flow and a cursor for the POS backend; the permission `trade.pos.exceptions.resolve`.
- 13 October 2026: step 1 (API and web): the POS channel, tills with one-time enrolment, cashiers with limits and hashed PINs, offline allowances reserved through the ledger, POS settings, receipt number blocks, fiscal profiles, the channel API for the POS backend, events and permissions.
