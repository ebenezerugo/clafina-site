# Point of Sale — Product Document

*Live document: https://claude.ai/artifact/Gx6NHnhnxmwrWBCBLuL4rf (this file is its copy as of 12 October 2026).*

**Status:** Draft 3, 13 October 2026: every open question answered (section 14). **Roadmap:** Phase 4.12 (Point of sale: a channel with tills), built on the sales channels of Phase 4.11 (steps 1 and 2 built).

## 1. Summary

A till app for serving walk-in customers in a shop, a market stall, a pharmacy, a showroom or a warehouse counter. It runs on Android, iOS, macOS, Windows and Linux, and **keeps selling when the internet goes down**. When the connection comes back, every sale, payment, refund and cash movement made offline is sent to the ERP and lands as the ordinary record it already understands. The ERP decides in advance what each till may sell offline and how much of it, so a till working offline can never promise stock or credit the organisation has not allowed.

## 2. Decisions so far

- **The ERP is the only source of truth** for products, prices, stock, customers and money, as for the online shop. A till holds a copy of what it needs and a queue of what it did.
- **A point of sale is a channel** of kind *point of sale*. Creating one registers **tills** (devices) at its locations instead of starting a website.
- **Native tills in Kotlin** (decided 13 October): one Kotlin Multiplatform core and Compose screens for Android (phones, tablets, every maker's POS terminals and, later, Commerce's own devices), iOS and iPadOS, Windows, macOS and Linux. Kotlin is what talks to the hardware.
- **A web till in React** (decided 13 October): the same till in the browser, for counters without installed software, talking to the same POS backend.
- **One backend, `commerce-pos`:** a Go service beside the shop's, serving both the Kotlin and the React tills.
- **Commerce's own devices, later:** as the business grows, tills made for Commerce in China, running Android, with the till app built into the system.
- **Offline first:** a till sells with or without the internet, and resyncs on its own when it is back online.
- **Offline allowance set in the ERP:** products are marked as sellable offline, with how much each till may sell before it must reconnect (section 6).
- **Tax and fiscal rules per country** as settings (section 8.1).
- **A cashier signs in to a till, not to the ERP.**

## 3. Who uses it

- **Cashiers:** sell, take payment, print or send the receipt, handle returns within their limits, open and close their shift.
- **Supervisors:** approve what is above a cashier's limits (a large discount, a refund, a price override, a void, a no-sale drawer opening), by PIN or card on the till itself, even offline.
- **Store managers in the ERP:** set up tills, cashiers, products for the POS, offline allowances, payment types and receipts; see shifts, cash and sales live.

## 4. The till's day

1. **Open the till:** the cashier signs in with a PIN or badge, counts the opening float, and the shift starts.
2. **Sell:** scan barcodes, search by name, or tap favourites on a grid; change quantity and unit (a carton or a single); weighed items from a scale; the customer added by phone number for loyalty, or left as the walk-in customer.
3. **Price:** the channel's price book, the organisation's promotions and the cashier's discount limits; tax as the ERP's rules say.
4. **Pay:** cash with change, card through the terminal, bank transfer, payment link or QR code, wallet, gift card or store credit, or several in one sale (split payment); on account only for known customers within their credit limit.
5. **Receipt:** printed, or sent by SMS, WhatsApp or email; a reprint at any time.
6. **Hold and recall:** park a sale and serve the next customer.
7. **Returns and exchanges:** from the receipt or by search, within the return window and the cashier's limits.
8. **Cash:** cash in and cash out with a reason, safe drops, a no-sale opening needing approval.
9. **Close the till:** count the cash by denomination, see the difference from expected, and close the shift. The X report shows the shift so far; the Z report closes it.

## 5. Working offline

The till holds everything it needs to keep selling, and a queue of everything it did.

**Kept on the till** (refreshed while online):

- the products the POS sells, with barcodes, units, prices, promotions, tax rules and images;
- the offline allowance for each product (section 6);
- known customers the till may need (regulars, those with loyalty or credit), within limits the organisation sets;
- cashiers and their PINs (stored hashed), roles and limits;
- receipt layouts, the till's settings and its block of offline document numbers.

**While offline:**

- Sales, payments, refunds, holds and cash movements are written to the till's own encrypted database first, then queued to sync.
- Every record gets an id made on the till and an idempotency key, so a sale that is sent twice is recorded once.
- Receipt numbers come from a block reserved for that till in advance, so numbers never clash between tills.
- The till shows clearly that it is offline, how long it has been offline, and how much offline allowance is left.

**What works offline and what waits:**

| Works offline | Waits for the connection, or works offline only if the organisation allows it |
| --- | --- |
| Selling the products allowed offline, within their allowance | Card payments: offline only if the card terminal supports offline approval and the organisation turns it on, up to a limit |
| Cash, and payment types recorded for later confirmation (transfer reference, voucher) | Payment links, QR payments and wallets (they need the payer's bank to confirm) |
| Supervisor approvals by PIN | Sales on account (credit) beyond an offline credit allowance per customer |
| Returns of sales made on this till | Returns of sales made elsewhere, unless the receipt is in the till's copy |
| Loyalty points earned (credited when synced) | Loyalty points spent, beyond an offline allowance |
| Receipts printed; SMS, WhatsApp and email sent when back online | New customers created (kept on the till and matched by phone or email on sync) |

**When the connection is back:**

1. The till sends its queue in order, oldest first, with each record's idempotency key.
2. The ERP records each sale as an invoice and receipt at the till's location (or a sales order and receipt, as the settings say), moves the stock, books the money and credits loyalty.
3. The till then fetches what changed: prices, promotions, products, stock levels, allowances and customers.
4. Anything the ERP could not accept is not lost: it is kept as a **sync exception** for the store manager (section 7).

## 6. Offline allowance, set in the ERP

The organisation decides, per product (or category) and per POS channel, what a till may do without the ERP.

- **Sellable offline:** yes or no. A product not allowed offline (a serialised phone, a controlled medicine, an item in short supply) is shown but cannot be sold until the till is back online.
- **Offline quantity per till:** how many units each till may sell offline before reconnecting. The ERP sets it aside from that location's available stock, as it does for the shop's reservations, so the shop, other tills and the warehouse cannot sell the same units twice.
- **How it is set:** a fixed number, or a share of the location's stock split across its tills, or "any amount" for plentiful items where overselling is acceptable (bread, water, sachets).
- **Refreshed whenever the till is online:** units sold offline are released from the allowance as the sales sync, and the allowance is topped up again.
- **Limits on time and money:** how long a till may stay offline before it locks and asks for a supervisor, **24 hours by default, which the organisation can change** per channel or per till; and a maximum value of offline sales per shift.
- **Prices offline:** the till uses the prices it last received; a price change made in the ERP while the till is offline applies from the next sync, and the sale keeps the price the customer paid.
- **Serial and batch items:** sold offline only from the serials or batches sent to that till.

## 7. Resync and conflicts

A sale made offline is a fact: the customer has paid and left. The resync records it as it happened and flags anything that needs a person, rather than rejecting it.

| What happened | What the ERP does |
| --- | --- |
| Stock ran out elsewhere while the till was offline | Records the sale; stock goes negative only if the location's inventory type allows it, otherwise the sale is recorded and flagged as **oversold** for a transfer or an adjustment |
| The price changed in the ERP meanwhile | Keeps the price charged; reports the difference |
| The customer's credit limit was exceeded | Records it; flags it for the credit controller |
| A product was retired meanwhile | Records the sale; flags it |
| The same sale arrives twice | Recorded once (idempotency key) |
| A card payment approved offline is later declined | The receipt stays; the amount becomes a debt to recover, with the customer's details if known |

**Sync exceptions** are listed for the store manager with each record's original content; each is resolved (accepted, adjusted, written off), never silently dropped. The till also shows its own sync status: queued, sent, accepted, needing attention.

## 8. Shifts, cash and control

- **Shifts:** open with a float, close with a count by denomination; expected cash from the shift's sales and movements; over and short recorded and explained; blind close (the cashier does not see the expected amount) as a setting.
- **Cashier limits:** discount, price override, refund and void limits per role; anything above needs a supervisor's PIN or card, logged with both people.
- **Audit trail on the till and in the ERP:** every sale, void, discount, refund, drawer opening and approval, with time, cashier and till, including those made offline.
- **Device lock:** a till is registered to one location and channel; it can be blocked remotely (on its next connection) or wiped if lost.

### 8.1 Tax and fiscal rules

Many countries require each sale to be processed for tax: a fiscal receipt, a till registered with the tax authority, or every sale reported to it (e-invoicing). These are set in the organisation's settings for each country and location it sells in.

- **Per country, a fiscal slot:** which rules apply (tax rates and inclusive or exclusive pricing, fiscal receipt layout, till registration, reporting to the tax authority), and through which provider or authority service, as with every other integration the organisation chooses.
- **On the till:** the receipt carries what the country requires (tax numbers, fiscal number or signature, QR code for verification); a sale the rules say must be reported is reported as soon as the till is online, and queued with the sale while it is offline, within the time the country allows.
- **In the ERP:** the fiscal status of each sale (reported, accepted, rejected, waiting) and the authority's reference, with rejections listed for someone to correct.
- **Country by country:** each country's rules are added as their own module behind the slot, starting with the countries Commerce's organisations sell in.

## 9. Devices and hardware

**Kotlin for every installed till, React in the browser:** the native tills share one Kotlin core and one set of Compose screens; the web till is React; all of them talk to the same POS backend (section 12).

| Platform | Devices |
| --- | --- |
| Android | Phones, tablets, and every maker's all-in-one POS terminals (Sunmi, PAX, Topwise, iMin, Urovo, Telpo, Nexgo and others, with built-in printer and scanner); later Commerce's own devices |
| iOS and iPadOS | iPhones and iPads |
| Windows, macOS, Linux | Desktop and touch-screen tills |
| Browser (React web till) | Any counter PC or Chromebook; hardware through the browser where it allows (USB and serial printers and scanners in Chrome and Edge) |

**Every terminal maker:** the Kotlin till reaches each maker's printer, scanner, drawer and card reader through an adapter per maker, behind one hardware interface, with standard ESC/POS printing for everything else. A new maker is a new adapter, not a change to the till.

**Hardware supported:** receipt printers (ESC/POS over USB, Bluetooth and network; receipt layouts from the Studio, Phase 14 step 7); barcode scanners (keyboard-style and camera); cash drawers (opened by the printer); card terminals (through the payment providers the organisation chooses); scales; customer-facing displays; label printers.

**Updates:** a till never updates mid-shift; an update waits for the shift to close, and the ERP can hold a channel on a given version.

## 10. Settings the organisation chooses

- Products and categories on the POS; favourites grid per till; offline allowance per product (section 6).
- Payment types per POS channel (cash, card, bank transfer, payment link or QR, wallet, gift card, store credit, on account) and which of them may be used offline; offline card payments where the terminal supports them, up to a limit.
- Maximum time offline (24 hours by default) and maximum offline sales value per shift.
- What a sale becomes in the ERP: invoice and receipt (default), or sales order and receipt.
- Walk-in customer account; whether a phone number is asked for; customers kept on the till.
- Cashier limits per role; blind close; float amount; supervisor approvals.
- Receipt layout, footer, delivery (print, SMS, WhatsApp, email) and the receipt number block per till.
- Tax and fiscal rules per country and location, and the provider or authority service for each (section 8.1).
- Return window and conditions at the till.
- Tips and service charge; rounding of cash totals.
- Version held per channel; when updates install.

## 11. Permissions

In the ERP: set up POS channels and tills; manage cashiers and their limits; set products and offline allowances; see shifts, cash and sales; resolve sync exceptions; block or wipe a till.

On the till: sell; give discounts and returns within limits; approve as supervisor; open the drawer without a sale; cash in and out; close a shift.

## 12. Architecture

- **The POS backend, `commerce-pos`:** a Go service from `go-cqrs-boilerplate`, as for the online shop, holding tills, shifts, cash counts, offline number blocks, fiscal reporting and the sync endpoint. It serves the Kotlin and the React tills alike, and talks to the ERP only through the channel API (with the per-channel credentials) and events.
- **The native tills, in Kotlin (`commerce-pos-app`),** built with Kotlin Multiplatform:
  - **`shared`** (Kotlin Multiplatform): the sale, pricing and tax rules the till applies, the offline queue and sync engine, the API client for `commerce-pos`, the local SQLite database (SQLDelight, encrypted), and state. Written once and used on every platform.
  - **`ui`** (Compose Multiplatform): the till's screens, written once for Android, iOS, Windows, macOS and Linux, with the design tokens of Commerce's other apps.
  - **`android`:** phones, tablets and every maker's POS terminals through per-maker hardware adapters; Bluetooth, USB and network printers; the camera as a scanner.
  - **`ios`:** the iOS and iPadOS app on the shared core; Swift where iOS needs it (Bluetooth printers, Apple Pay, the App Store).
  - **`desktop`:** Windows, macOS and Linux, with USB, serial and network printers, cash drawers and scales; installers built with Java bundled in.
- **The web till, in React (`commerce-pos-web`):** the till in the browser, talking to `commerce-pos` like the native tills. It uses the Kotlin `shared` core compiled to JavaScript (with TypeScript types), so a sale totals, queues and syncs exactly as on a native till; its screens are React. Offline it keeps its queue in the browser's persistent storage; printers and scanners where the browser allows.
- **On the device:** SQLite holds the catalogue copy and the queue; the sync engine sends the queue in order with idempotency keys and fetches changes since a cursor; nothing is lost if the app closes mid-sync.
- **Updates outside shifts:** Android through the app stores, device management or Commerce's own update server; iOS through the App Store; desktop through an updater we build or a packaging tool; the web till between shifts; never mid-shift.
- **Into the ERP:** each sale is posted as an invoice and receipt (or a sales order) at the till's location through the channel API's order intake; stock, money, loyalty and customers follow the ERP's existing documents.

### 12.1 Why Kotlin

Compared 13 October with Flutter, React Native, Tauri 2 and Go Wails with React, and native Swift and Kotlin apps for each platform.

- **Commerce's own devices will run Android.** Tills made in China (as Sunmi, PAX, Topwise and iMin make theirs) run a custom Android, and their makers supply printer, scanner, drawer and card-reader libraries in Java or Kotlin. On its own device the till becomes a system app: it starts at boot, locks the device to the till, talks to the hardware directly, and updates the app and the device from Commerce's servers. That is native Android work, and Kotlin is Android's own language.
- **One language, every installed till:** Kotlin Multiplatform shares the core with iOS and the desktop, and Compose Multiplatform shares the screens, so a till looks and behaves the same on a Sunmi terminal, an iPad and a Windows PC.
- **Kotlin over Java:** Google's Android work is Kotlin-first and its modern screens (Compose) are Kotlin-only; Kotlin Multiplatform does not exist for Java; Kotlin calls every Java library the device makers ship. Kotlin is open source (Apache 2.0), backed by JetBrains and Google through the Kotlin Foundation.
- **Fast on cheap terminals:** native screens stay smooth on low-end chips, where web views can lag.
- **The browser too:** the same Kotlin core compiles to JavaScript for the React web till, so the rules are written once.
- **Costs accepted:** larger desktop installers (Java bundled, about 50 to 100 MB) and no built-in desktop updater.
- **Languages over time:** Kotlin for the installed tills; React and TypeScript for the web till; Swift where iOS needs it; Go for the backend; C or Rust for drivers and firmware once Commerce designs its own hardware.

## 13. Proposed build order

1. **The POS channel in the ERP:** tills, cashiers and limits, products for the POS and offline allowances, payment types, receipt number blocks, fiscal settings.
2. **The POS backend, `commerce-pos`:** tills and enrolment, shifts and cash, the sync endpoint with idempotency, posting sales into the ERP, sync exceptions.
3. **The Kotlin till, online:** selling, payment, receipts, holds, returns, shifts, X and Z reports, on Android first, then desktop.
4. **Offline:** the device database, the queue and resync, offline allowances enforced, conflict handling, offline time and value limits.
5. **The React web till** on the shared core compiled to JavaScript.
6. **Every platform:** Android (every maker's POS terminals through adapters), iOS and iPadOS, Windows, macOS and Linux installers, updates outside shifts.
7. **Hardware:** printers, scanners, cash drawers, scales, customer displays, card terminals (offline card payments where supported).
8. **Tax and fiscal rules,** country by country behind the fiscal slot.
9. **Loyalty, credit and customers at the till,** with their offline allowances.
10. **Reports:** sales by till, cashier and hour; cash differences; offline activity, sync exceptions and fiscal status.
11. **Commerce's own devices,** when the business is ready: a custom Android build with the till as a system app, device management and updates from Commerce's servers.

## 14. Your answers (13 October)

1. **The POS backend:** a Go service, `commerce-pos`, beside the shop's, serving the Kotlin and React tills.
2. **The till apps:** Kotlin (Multiplatform and Compose) for every installed till and the hardware; React for the web till; both on the same backend.
3. **Offline card payments:** yes, where the terminal supports them, up to a limit the organisation sets; bank transfers are accepted too (recorded and confirmed when they arrive).
4. **Maximum time offline:** 24 hours by default; the organisation can set another figure.
5. **Devices:** every maker's POS terminals, through an adapter per maker.
6. **Fiscal rules:** yes; tax processing per country is set in the organisation's settings, with a fiscal slot per country (section 8.1).
