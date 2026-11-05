# Events and ticketing

> Status: **built (18 October 2026)** on `feature/packs-versioning-memberships-events`. Code: `src/modules/events`. An [industry pack](INDUSTRY_PACKS.md) (`events`) switches it on per place. Product: the *Industry Catalogue* (shared module 4: events, sessions, ticket types, seating, ticket sales, QR check-in, sponsors); boards `erp4f-ev-list`, `-event`, `-new` (`design-handoff/erp-mockups/v3/mockups/f`).

For conferences, fairs, concerts, races, galas and any business that sells entry: **events** with sessions and ticket types, a **seating plan** whose tables are held while a buyer pays, **one sale** that the desk, the door, a customer on an invoice, the till and the storefront all call, **tickets** whose QR codes are signed by the event, a **gate** that records every scan and refuses a second one, **sponsors** and **venues**. Nothing here is a second engine: a sale to a customer on an invoice is made, approved and posted by the sales invoice path, a number is the numbering module's, a setting is a document-settings document.

## What a person does

| Board | Screen | Route |
| --- | --- | --- |
| `ev-list` | Events: the figures (under way, on sale, tickets sold, almost sold out, the year’s sales), tabs On sale / Now / Drafts / Past with counts, search | `/events` |
| `ev-new` | New event (a drawer): the event, its ticket types, seating and entry, a summary of the most it can sell, what happens next | `/events` (New event) |
| `ev-event` | An event: the gate’s figures, ticket types, sessions, sponsors, the hall, sales by day; Door sales, Open check-in, put on sale, close, cancel | `/events/:id` |
| (sales) | Tickets sold: every order across the events a person reaches, an order with its tickets and refund | `/events/orders` |
| (the gate) | Check-in: choose an event, scan a code or type a number, the answer, the latest scans and refusals | `/events/check-in` |
| (set-up) | Venues | `/events/venues` |

## Data (schema `events`, migration `1788600000200`)

Every table starts its key with `organization_id`; tenant isolation policy; no foreign keys; expand only.

| Table | What it holds |
| --- | --- |
| `venues` | Where events are held, with a capacity. The organisation’s, not a place’s. |
| `events` | An event: `EVT-…` number, kind (`ticketed`, `free`, `internal`), when, venue, status (`draft`, `on_sale`, `closed`, `cancelled`), seating (`general`, `reserved`), names on tickets, currency, tax rate, the refund window, and `qr_secret`, the key its tickets’ QR codes are signed with (never sent to a client). |
| `sessions` | A room and a time each, within the event’s dates. |
| `ticket_types` | A price, a number, a sales window, a limit per order, invitation-only, seated, the sessions it admits to. `sold` and `revenue` are kept by the statement that sells (a CHECK keeps `sold` between 0 and `quantity`). |
| `seat_units` | A table or a seat on the plan, sold by one seated ticket type: `free`, `held` (until a time, for a holder) or `sold` (to an order). |
| `orders` | A sale: the buyer (a customer or a name), the channel, how it is paid, the status (`paid`, `pending` on an unpaid invoice, `refunded`, `cancelled`), the invoice it made, a `request_key` that makes a retried sale one sale. |
| `tickets` | One per person admitted: a readable number (`T-…`), the holder, `valid` / `pending` / `void`, when it got in. |
| `scans` | Every scan at the gate or a session, allowed or refused, with the code of the refusal, the holder and number at the time, and a `scan_ref` that makes a replayed scan one scan. A unique key lets a ticket into a session once. |
| `sponsors` | What a sponsor agreed and has paid (never more than agreed), their passes and what they get. |

## Rules

**Making and selling.** An event is made as a **draft** with its ticket types and sessions. It cannot go on sale without a ticket type, and a **seated type needs a table or seat drawn for every ticket it sells** (“Draw the hall first: VIP table sells 12 but 10 are drawn”). An event with tickets sold cannot go back to a draft; cancelling needs a reason; a cancelled event is not changed and sells nothing. The currency, the tax rate and the seating cannot change once tickets are sold.

**One sale** (`planSale`, pure; `TicketSalesService`). The desk, the door, a customer on an invoice, the till (`pos`) and the storefront all call `POST events/:id/orders`. The rules: the event is on sale and not over; each type is active, inside its sales window, within its limit per order and the settings’ most tickets in an order, and has enough left; an **invitation-only** type is sold by staff (desk, sales, invite), never on the storefront or the till; a seated type takes one table or seat per ticket; an event that names its tickets wants a name for each; **free** is only for an order that costs nothing. The claim is **atomic**: a ticket type’s count changes in the one statement that checks there are enough (`sold + n <= quantity`), and a table changes in the one statement that checks it is free or held by this buyer, so two sales at once cannot sell the last ticket or the same table twice; a failure rolls the whole sale back. Send a `requestKey` and a retried sale (a phone that lost its connection) comes back as the first order.

**Tables.** `POST events/:id/seating/hold` holds tables for the settings’ minutes for a holder (a storefront session, or the person at the desk). A hold is a time: an expired hold is free, so nothing sweeps. A held table is sold only to its holder; a second holder is refused with 409, naming the table.

**Paying.** Cash, card, transfer, the till or free: the order is `paid` and its tickets `valid`. **On an invoice** (a customer is needed): a draft invoice is made through `ArInvoiceService`, submitted and posted as the settings say, the order is `pending` and its tickets `pending` (refused at the gate as “not paid yet”); when the invoice is paid (`ArInvoice-updated`, `EventInvoiceListener`) the order is settled, the tickets become valid and are emailed; if the invoice is cancelled the order is cancelled and its tickets and tables go back.

**Tickets and codes.** A ticket’s QR holds `evt:<ticket id>.<signature>`, the signature an HMAC of the id with **the event’s own secret**: a code cannot be made up by someone who has seen others, and a scanner that holds the event’s secret can check one without asking the server (offline scanning is the mobile phase). The number a person can type (`T-` and ten characters, no 0/O or 1/I/L) is a separate readable thing. Tickets are emailed as images when an order is paid and `sendTickets` is on, and again on request.

**The gate** (`decideScan`, pure; `TicketCheckInService`). A scanned code is checked against the event’s signature before the database is asked; a number is tidied (case, spaces, a missing `T-`). The ticket is **locked while the scan is decided**, so two phones scanning one ticket cannot both let it in. The first rule broken is the reason, always in this order: not a ticket of this event (`bad_code`, `wrong_event`), cancelled, void, not paid, too early (before the settings’ minutes), over (after the end and the settings’ minutes), the session is not part of the event or not one the ticket admits to, already in. A scan into a **session** is separate from the gate: a ticket gets into each session once and the gate is not used up by it. Every scan, allowed or refused, is recorded, and a scan sent twice with the same `scanRef` (a phone back online) returns the first answer and records nothing again.

**Refunds** (`refundVerdict`, pure; `TicketRefundService`, needs `events.tickets.refund`). Free until the event’s refund window closes (days before the start; the settings start each event with 7); after it, with a reason. A ticket already scanned in cannot be refunded; an order cannot be refunded twice; an event that is over cannot be refunded into. A refund voids the tickets, gives each type its count and takings back and frees the tables. **The money goes back through finance**: the answer names the invoice to credit, or what to hand back for a cash order; a credit note is not raised here.

**Sponsors.** What each agreed and paid; paid never exceeds agreed; the event page adds them up. Passes are a number, not tickets (issue them as invitation tickets).

## Settings (document type `event`, per place)

`holdMinutes`, `maxTicketsPerOrder`, `refundUntilDays`, `defaultTaxRate`, `postInvoices`, `sendTickets`, `serviceItemId`, `checkInOpensMinutes`, `checkInClosesMinutes` (`event.settings.ts`, each with the code that enforces it named in `definitions/index.ts`). The pack starts `refundUntilDays`, `holdMinutes` and `checkInOpensMinutes`, so a pack upgrade moves only the ones nobody changed.

## API (`/api/v1/events`)

Fixed paths come before `events/:id` (`events/venues`, `events/orders`, `events/tickets`, `events/lookups`, `events/overview`), and the module lists their controllers first.

| Method, path | Permission | What |
| --- | --- | --- |
| `GET events`, `GET events/overview`, `GET events/:id` | `events.events.read` | The list by tab (soonest first; past, latest first; keyset) with each tab’s count; the figures over it; one event with stock, types, sessions, sponsors, the gate’s figures and the plan’s totals. |
| `POST events`, `PATCH events/:id`, `POST events/:id/status` | `events.events.manage` | Make a draft with its types and sessions; change; put on sale, close, back to draft, cancel. |
| `POST events/:id/ticket-types`, `PATCH events/ticket-types/:id` | `events.events.manage` | Add a ticket type; change or retire (never below what is sold). |
| `POST events/:id/sessions`, `PATCH`/`DELETE events/sessions/:id` | `events.events.manage` | Add, change; remove (a session scanned into is cancelled instead). |
| `GET events/:id/seating`, `POST events/:id/seating` | `events.events.read` / `.manage` | The plan; add tables or seats (numbered on from what is there). |
| `POST events/:id/seating/hold`, `…/release` | `events.tickets.sell` | Hold tables for a holder; let a hold go. |
| `GET events/:id/availability` | `events.tickets.read` | What can be bought: each type with what is left and whether it is on sale now (for a till or a storefront). |
| `POST events/:id/orders` | `events.tickets.sell` | **The sale.** |
| `GET events/orders`, `GET events/orders/:id`, `GET events/tickets/:id`, `GET events/:id/sales-by-day` | `events.tickets.read` | Orders (keyset, newest first; by event, status, buyer, code or ticket number); an order with its tickets; a ticket with its QR as an image; tickets and takings a day. |
| `POST events/orders/:id/send` | `events.tickets.sell` | Email the tickets again. |
| `POST events/orders/:id/refund` | `events.tickets.refund` | Refund. |
| `POST events/:id/check-ins`, `GET events/:id/scans` | `events.checkin.scan` / `.read` | Scan a ticket (a refusal is an answer, 200, with its reason); the latest scans and refusals. |
| `GET`/`POST events/:id/sponsors`, `PATCH`/`DELETE events/sponsors/:id` | `events.events.read` / `events.sponsors.manage` | Sponsors. |
| `GET`/`POST events/venues`, `PATCH events/venues/:id` | `events.events.read` / `.manage` | Venues. |
| `GET events/lookups/customers` | `events.events.read` | Find a customer to sell to or to name as a sponsor. |

Scope: a person attached to places sees and works the events there; those who hold `events.events.manage` reach every place; another place’s event is “not found”. The list reads each event’s stock from its ticket types (one small lateral read per event on the page); orders and scans are keyset pages on indexes that start with `organization_id`. Role templates: *Box office (events)*, *Door scanner (events)*, *Events manager*.

## Selling from other products

The till and the storefront call the same sale with `channel: 'pos'` / `'storefront'`, a `requestKey`, and (for a chosen table) the `holder` they held it for; `GET availability` is what they draw. The wiring in the Go storefront and the Kotlin till (a service account with `events.tickets.sell`) is theirs to do; the API they call is this one.

## Events

`Event`, `EventOrder`, `EventScan` (`created`/`updated`; topic `commerce.events.v1`; `/live` entities, behind `events.events.read`, `events.tickets.read` and `events.checkin.read`). Every payload carries `organizationId`; `status` says where an event, order or scan now is, and `eventId` rides on orders and scans. A sale announces the order and the event (its stock changed), so an open event page refreshes on the push, with no timer.

## Tests

- Unit (pure rules): `ticket-code.logic`, `event-state.logic`, `sale.logic`, `refund.logic`, `checkin.logic`, `seating.logic`, `events-permissions.spec.ts` (every route held to a pack permission), `event.settings.spec.ts`.
- Drill: `QUEUE_PREFIX=drill-events npm run events:drill` (a draft with a venue, types and sessions; the hall before sale; two buyers and one table; a retried sale; two sales for the last tickets; invitation-only on the storefront; an order on an invoice not valid until paid; a forged code, a typed number, a second scan, a replayed scan, a session door; refunds after the window; sponsors; a cancelled event; invoices stay drafts and are deleted; the probe puts the organisation back).
- E2E: `test/events.e2e-spec.ts`; tenancy sweep fixtures for the new tables (`test/tenancy.sweep-spec.ts`).
- Stubbed Cypress: `cypress/e2e/events.cy.ts`.

## Not yet (and why)

- **Offline scanning**: the gate is online. The signature is built for it (a scanner holding the event’s secret can verify a code), but downloading the secret and syncing scans is the mobile phase.
- **The online ticket page and checkout** on the storefront, and the till’s ticket screen: the API is ready (`availability`, `seating/hold`, `orders` with `channel`, `holder`, `requestKey`); the Go storefront and the Kotlin till build their sides.
- **Card, transfer and wallet payment of a ticket order** by the buyer: real payment rails are held to the end. Orders are paid at the desk or door (recorded), free, or on an invoice.
- **A credit note on refund**, and refunding every order when an event is cancelled in one step: the refund names what to credit; the cancelled event is refunded order by order.
- **Releasing unpaid invoice orders after a time**, and reminders to people who have not paid: an unpaid order holds its tickets until it is refunded or its invoice cancelled.
- **Sponsor passes as tickets, a seat map drawn freehand** (the plan is sections of numbered tables or seats), **waitlists**, **resale and transfer of a ticket**, **an override at the gate**: not drawn.
- **Home cards** (events on sale, happening now, almost sold out, ticket sales this year) are declared by the pack; their figures are served by `GET events/overview` and drawn when Home takes pack cards.

## History

- 18 October 2026: events, sessions, ticket types, the seating plan, the sale, tickets with signed codes, the gate, refunds, sponsors and venues, the pack and its three role templates.
