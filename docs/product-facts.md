# Product facts for the 21 product pages

Internal. Written 5 Nov 2026 from `docs/product-source/` and `commerce-web/docs/`. "Commerce" in the
sources is Clafina. Every capability names its source. "Not yet" lists what the docs say is left; the
owner has said all of it ships before go-live, so tag it **pre-launch**. Where a doc is silent: "unclear".

Rules that apply to every page:
- **Payments and tax authorities run in test or sandbox only.** Real rails and partners are "held to the
  very end" (ROADMAP §5 item 10). Fiscal modules talk to simulated FIRS, GRA and eTIMS (POINT_OF_SALE.md).
- Do not name payment providers, banks, SMS/email vendors, marketplaces or tax authorities as live.
- Do not publish internal counts (tests, KPIs, widgets, tool counts, load-test figures) or audit findings.
- Board names below are file names under `project/<dir>/`; `.dc.html` is left off.

---

## Platform-wide facts (Home and Platform pages)

**Surfaces the docs describe as built:** web app (ERP); till in two forms, a native Kotlin till
(desktop and Android) and a browser till that works offline (POINT_OF_SALE.md); online storefronts made in
Storefront Studio (STOREFRONT_STUDIO.md); phone app through a mobile service (MOBILE.md); the AI assistant
(assistant.md); our own video rooms, Meet (meet.md); shared document links and guest pages
(Trading-Network doc §10); supplier portal (ROADMAP Phase 12 step 9); public booking pages (BOOKINGS.md);
MCP server for outside AI clients (ROADMAP 4.6). **Kiosk: no doc describes a clock-in kiosk.** CONTEXT.md
lists one, but nothing in the sources does. Do not claim it until it is confirmed. Clock-in is self-service
in the app (HR.md).

**One record:** every sales, stock, buying, payroll, asset and production document posts to one general
ledger by posting role (ROADMAP Phase 5; SALES.md "In the ledger"). Stock is one append-only movement ledger
(STOCK.md). Tills and shops sell from the same stock and price books, and "can never sell the last unit
twice" (Online-Shop doc §4). Customers and suppliers share one party record (Trading-Network doc §4.4).
Dashboards read figures kept from ledger events, and report whether they "agree with the books"
(ROADMAP BI v3).

**Live:** screens update without refresh over one live socket. Nothing polls (LIVE_UPDATES via STATUS).

**Offline:** tills sell offline within allowances the ERP sets (POINT_OF_SALE.md). The shop-floor screen
syncs offline actions (MANUFACTURING.md step 6). Asset field checks work offline (ROADMAP Phase 10 step 5).
The phone queues some writes and not others: approvals and money need a connection (MOBILE.md "Offline").

**Languages:**
- Document templates take a locale: the recipient's, then the organisation's, then English (ROADMAP §3p).
- The storefront supports "four languages", which the docs do not name (ROADMAP §5).
- The web app ships de, en, es, fr and it translation files (features.md). Whether every screen is
  translated is unclear.
- Commerce AI plans Nigerian English, Pidgin, Yoruba, Igbo and Hausa (AI doc §2). These are plans; do not
  claim them as built.

**Currencies:** every amount carries its currency. The ledger keeps rates, base amounts, revaluation and
realised FX gain or loss (ROADMAP Phase 5; SALES.md). The storefront shows display currencies
(ROADMAP §5). A receipt in one currency against an invoice in another is not converted (SALES.md
limits).

**Security facts that are true and specific:**
- Two-step sign-in. Codes come by email only and expire (STATUS).
- Single sign-on by SAML or OIDC (ROADMAP 4.6).
- See your signed-in devices and sign them out remotely (ROADMAP §5).
- Connection secrets are sealed with AES-256-GCM and never shown again (ROADMAP 4.6).
- API keys are hashed and shown once (ROADMAP 4.6).
- Outgoing webhooks are signed with HMAC-SHA256 (ROADMAP 4.6).
- Finance keeps a hash-chained audit trail and enforces segregation of duties (STATUS).
- Money-moving requests take idempotency keys (STATUS).
- Commerce support reaches an account only with the owner's consent. The session is read-only by default
  and recorded (ROADMAP Console step 6).
- The client-records pack encrypts each organisation's records under its own key and logs every access
  (CLIENT_RECORDS.md).

**Do not claim:**
- Database row-level security as enforced. It is built but switched off until the integrator turns it on
  (STATUS, Phase T.2).
- Rate limits on every route. Only public routes are limited (STATUS).
- Data residency or a second region. Not built (ROADMAP §3p).
- Uptime figures, or any certification (SOC 2, PCI, ISO). None appear in the docs.

**Pricing and plans:**
- **PRICING.md is customer price books** (what an organisation charges its own customers). It is not
  Clafina's plans.
- Clafina's own billing is built in the Console: daily usage metering per organisation, the plan, usage
  against what the plan includes, invoices, and the owner's change of plan and features (ROADMAP Console
  step 7).
- The in-app Billing page shows meters, a month projection, invoices with PDF and "I have paid by
  transfer". Pay links stay empty "until the real rails" (ROADMAP Billing v3).
- Sending limits are capped by plan tier (ROADMAP §5).
- Whether integrations are gated by plan is still an open decision (ROADMAP 4.6).
- **No tier names or prices appear in any product doc.** CONTEXT.md's Free / $29 Growth / $99 Business /
  Enterprise is "proposed, not final".

---

## product-finance — Finance and accounting

**Job:** keep the books that every sale, purchase, payroll and stock movement posts into by itself.

**Jobs it does:** books that close on time; see what you owe and are owed; control spending before money
leaves.

**Built:**
- Chart of accounts from a country template, fiscal year from any month, posting accounts by role (ROADMAP Phase 5).
- Documents post their own journal entries; refused postings wait in a backlog and retry (SALES.md, STOCK.md).
- Period close with checklist, revaluation, year end and reopening (STATUS 5.6).
- Trial balance, profit and loss, balance sheet, cash flow, ageing; exports PDF, XLSX, CSV (ROADMAP 5.5).
- Recurring journals, invoices, bills and standing payments (STATUS 6a; ROADMAP finance boards).
- Budgets that warn or block at requisition, order and invoice (STATUS step 4).
- Payment requests with maker-checker and payment batches (STATUS 5b, 6b).
- Expenses, reimbursements, cash advances, mileage, per diem (STATUS step 7).
- Bank statement import (CSV, OFX, MT940, CAMT.053) and reconciliation sessions that lock on approval (STATUS 10a/10b).
- Transfers between own accounts, cash in transit, FX differences (STATUS step 9).
- Obligations and cash-flow forecast with three scenarios (STATUS step 11).
- Intercompany links and group consolidation with eliminations (STATUS step 13; ROADMAP BI follow-ups).
- Hash-chained audit trail; requester cannot approve their own finance documents (STATUS step 3).

**Not yet (pre-launch):** real rails and live provider checks; the performance pass (ROADMAP 4.10). Also
consolidated cash flow and a comparative column, staged acquisitions, and automatic dividend elimination
(ROADMAP BI follow-ups). Payroll is not split by department in the ledger (STATUS).

**Surfaces:** web app; phone (cash summary, transfer preview, payment-run approval; MOBILE.md).

**Connects to:** sales, procurement, stock valuation, payroll, assets (depreciation), manufacturing (WIP),
wallets, tax engine.

**Avoid:** "IFRS-compliant" (the doc says "IFRS for SMEs layout" for Nigeria only); named banks; the
"NIBSS-style" bank file as a bank partnership.

**Words:** Posting accounts, Backlog, Journal entry, Close checklist, Payment request, Payment batch,
Reconciliation session, Money to identify, Cash in transit.

**Boards:** erp-finance, erp4d-finance-books, erp4d-finance-accounts, erp4d-finance-journals,
erp4d-finance-reports, erp4d-finance-currencies.

---

## product-payments — Payments and wallets

**Job:** get paid online and pay out, with every payment landing in the books.

**Jobs it does:** customers pay from the invoice link; pay suppliers and staff in runs; hold money in
business wallets.

**Built:**
- Payment links and a branded hosted checkout; payers become customers (STATUS 16d).
- Invoices and proformas paid online from the shared page; the provider's confirmation posts the receipt (SALES.md).
- Refunds, disputes and settlements, with fees posted to bank charges (STATUS steps 1–2).
- Routing between providers with fallbacks and reasons kept on every attempt (STATUS 16c).
- Refunds above a limit approved by a second person; payment alerts and reports (STATUS 16e).
- Beneficiaries checked, sealed and changed only by approval; payouts never sent twice (STATUS 5a).
- Virtual account numbers per customer; deposits become receipts by themselves (STATUS step 14; SALES.md).
- Wallets in the books; pay from wallets; customer collection wallets (STATUS step 15).
- Bills paid from a wallet (STATUS wallet bills).
- Virtual cards with limits, plus card expenses to categorise (wallet-cards.md).
- Foreign accounts and payments abroad at a locked rate (wallet-foreign.md).
- USDT and USDC stablecoin wallet (wallet-crypto.md).
- Business verification before any money service unlocks (wallet-verification.md).

**Not yet (pre-launch):** all real rails (ROADMAP §5 item 10):
- bank transfer rails and partner banks;
- a pool account at a licensed bank, with its licensing;
- a cross-border partner;
- an FX liquidity provider;
- direct blockchain custody;
- live merchant credentials for each provider;
- card issuing;
- open banking and bank feeds.

Also: payments abroad, and stablecoin withdrawals and conversions, are off until an operator switches them
on (wallet-foreign.md, wallet-crypto.md). Invoices have no payment section yet (STATUS step 15).

**Surfaces:** web app; shared invoice page; till (QR, link and wallet, all on a sandbox; POINT_OF_SALE.md).

**Connects to:** sales receipts, finance ledger, procurement payables, payroll remittances, bookings
deposits.

**Avoid:**
- Naming Paystack, Flutterwave, Hyperswitch or NIBSS.
- "162 providers" (that is a catalogue, not live connections).
- CBN licensing, countries, or "instant".
- Stablecoins and cards as live.

**Words:** Payment link, Pay abroad, Foreign accounts, Stablecoin wallet, Cards, Beneficiaries, To pay.

**Boards:** erp-finance, erp4b-pay-suppliers, erp4a-receipts, erp4a-receipt-new, erp4d-billing.

---

## product-tax — Tax engine

**Job:** decide the right taxes on every line from rules the business owns, and show why.

**Jobs it does:** charge VAT correctly without thinking about it; handle withholding at payment; keep an
explainable trail.

**Built:**
- Five-question determination per line, with the trace stored on the line (TAX_ENGINE.md).
- Several taxes per line, compounding, inclusive prices, three rounding modes (TAX_ENGINE.md).
- Tax groups with dated versions; item tax categories; rules by place, buyer and item (TAX_ENGINE.md).
- Country presets NG, GH, KE, ZA, UK, IN, the 27 EU states, and US as a base-rate sandbox (TAX_ENGINE.md).
- Line overrides by permission, with warnings to acknowledge; "Remember this" proposes a rule (TAX_ENGINE.md).
- Tax changes the rules block are saved only with an approval (TAX_ENGINE.md step 2).
- Purchases: recoverable and cost parts, reverse charge (TAX_ENGINE.md step 2).
- Withholding suggested or enforced at payment and receipt (TAX_ENGINE.md).
- Credit notes carry the original taxes (TAX_ENGINE.md).
- Warning when you are registered for VAT and no rule applies (SALES.md).
- Bad-debt VAT relief by country (SALES.md).
- "Test a sale" simulator (TAX_ENGINE.md API).
- VAT return report and VAT position with filing day (ROADMAP 5.6; MOBILE.md A8).

**Not yet (pre-launch):** step 3, which covers:
- the tax return by box;
- exempt and zero-rated schedules;
- withholding certificates;
- the filing calendar;
- storefront and till reading the same determination.

Also not built: EU OSS, local US rates (need a paid provider), cash-basis tax points, and any outside tax
provider adapter (TAX_ENGINE.md).

**Surfaces:** web app (Settings → Tax); phone (VAT position).

**Connects to:** sales and purchase documents, ledger (tax by code), price lists and channels.

**Avoid:**
- "Compliant" or "certified".
- Naming FIRS, GRA, KRA or Avalara.
- Presets as tax advice. Each pack records its sources, and the presets are "not advice".
- Exact rates as guaranteed.

**Words:** Tax groups, Rules, Remember this, Changes needing approval, Suggest withholding, Test a sale,
outside the scope: not registered.

**Boards:** erp4d-finance-report-vat, erp-invoice-new, invoice-new-v2, erp3-document-settings.

---

## product-business-health — Business health, reports, BI, dashboards

**Job:** tell an owner in plain sentences whether the business is healthy, with the working shown.

**Jobs it does:** know margin, runway and cash cycle at a glance; get the reports you need on a schedule;
see one number explained back to the books.

**Built:**
- Six cards: gross margin, net margin, CAC, lifetime value, burn and runway, cash conversion cycle (BUSINESS_HEALTH.md).
- Each card has a status pill in words, one sentence, and a "How this is worked out" drawer (BUSINESS_HEALTH.md).
- The organisation sets its floors (margin floors, runway alert) (BUSINESS_HEALTH.md).
- Figures kept incrementally from ledger events; never a short number shown as final (BUSINESS_HEALTH.md).
- Home dashboard: widgets aware of permissions, locations and currencies; arranged per person or role (STATUS home dashboard).
- Nine KPI dashboards with Customise (ROADMAP BI).
- KPI history and "Agrees with the books" (ROADMAP BI v3).
- Cash forecast with three scenarios and checkpoints (ROADMAP BI).
- Reports hub: filters, grouping, exports, saved views, pins, schedules with test sends (ROADMAP BI v3; STATUS 5.5.3).
- Alerts on KPIs and conditions, in-app and email (STATUS 5.5.5).
- Insights, quality checks and forecasts (STATUS 5.5.4).
- Group consolidation dashboards (ROADMAP BI follow-ups).
- AI analyst tools to read a KPI, explain a change and run what-if (ROADMAP BI).

**Not yet (pre-launch):** the industry packs' own KPIs; memberships as the source of recurring revenue;
browser and accessibility test runs (ROADMAP BI). Tasks that wait on records the product does not keep yet:
tax filings, delivery cost (STATUS 5.5.7).

**Surfaces:** web app; phone (three home KPI cards; MOBILE.md); assistant (reports on request).

**Connects to:** finance ledger, sales invoices (customers), every module's KPIs.

**Avoid:** counts of KPIs, reports or widgets; "real-time" for finance KPIs. They are not kept by location
(BUSINESS_HEALTH.md).

**Words:** How the business is doing, How this is worked out, Agrees with the books, Customise, Reports,
Schedule.

**Boards:** erp-home, erp4d-bi-executive, erp4d-bi-cash, erp4d-bi-kpi-drawer, erp4d-reports-hub,
erp4d-dashboard-customise.

---

## product-sales — Sales and invoicing

**Job:** take a sale from quotation to receipt, with stock and books following each step.

**Jobs it does:** send quotes customers can answer; get paid before supply when needed; deliver and prove
delivery.

**Built:**
- Quotation, sales order, invoice and receipt, each usable on its own; converting only pre-fills (SALES.md).
- Approval policies per document; numbering per kind and location (SALES.md).
- Customers propose other prices from the shared quotation; every offer is kept (SALES.md negotiation).
- Proforma invoices ask for all or a deposit; never posted; held as customer credit (SALES.md).
- Discount policies with limits and approval thresholds (SALES.md).
- Prices from the price book: base, wholesale, quantity breaks (SALES.md).
- Lines in any unit (sold by the case, counted singly) (SALES.md units).
- Waybills: approved, dispatched with stock, followed, delivered, signed for, disputed (SALES.md).
- Credit notes with goods back to stock; refunds; bad-debt write-off (SALES.md).
- Gift cards (SALES.md).
- Service lines on every document (SALES.md).
- PDFs from Studio designs; till slip and receipt-printer output (SALES.md Web).
- Make a copy; a quotation straight to an invoice (SALES.md phone; TAX_ENGINE.md).

**Not yet (pre-launch):**
- Stock is not reserved when an order is confirmed.
- Location scope is not enforced on writes.
- Lists search by customer only for invoices and waybills.
- No void for a part-paid invoice.
- A header discount is stored but not applied.
- Selling a gift card as an item at the till (SALES.md known limits). The till later sells gift cards
  (POINT_OF_SALE.md step 9), so check whether this item is still open.

**Surfaces:** web app; phone (quotes, orders, invoices, proformas, receipts; MOBILE.md); shared customer
page.

**Connects to:** stock (fulfilment and dispatch), finance ledger, payments, tax engine, CRM customer page,
Studio, approvals.

**Avoid:** "automated reminders" beyond what sharing and reminder settings do; counts of tests.

**Words:** Quotation, Proforma invoice, Sales order, Invoice, Receipt, Waybill, Proof of delivery, Credit
note, Refund, Record a payment, Propose other prices, Payment before supply, Till slip.

**Boards:** erp4a-sales-home, erp4a-quotation-detail, erp-invoices, invoice-new-v2, erp4a-waybill-detail,
erp-phone-invoices, erp4a-phone-waybill.

---

## product-crm — Customers and CRM

**Job:** one page per customer with what they bought, owe and said, plus deals, support, loyalty and
outreach.

**Jobs it does:** follow up on deals; answer support on time; bring customers back with points and
campaigns.

**Built:**
- Customers with what each owes; the customer page of documents and transactions (ROADMAP Phase 8; STATUS).
- Organisation customers with legal identity, sites, buyers and buyer limits (Trading-Network doc §4; SALES.md).
- Deals on pipeline boards, activities, lists, merge, CSV import and export (ROADMAP Phase 8).
- Support tickets with first-response and resolution times (ROADMAP Phase 8).
- Tickets numbered, owned, due and linked (ROADMAP sales follow-ons).
- Service levels with escalation (STATUS).
- Loyalty scheme, tiers and points ledger; points earned and spent, both in the books (ROADMAP Phase 8).
- Gift cards issued by staff (SALES.md).
- Campaigns by email, SMS, WhatsApp and in-app, with opens, clicks and conversions (ROADMAP 13 step 7).
- Saved audiences; consent records, preference centre, one-click unsubscribe (ROADMAP 13 step 7).
- Announcements with acknowledgement (ROADMAP 13 step 7).
- Campaign cost from the books; CAC by channel (ROADMAP BI follow-ups).
- Customer pricing: price books, agreements, tiers, rebates (PRICING.md).

**Not yet (pre-launch):** points expiry, dynamic lists, sending reminders (ROADMAP Phase 8, "Not built").
Breakage policy for gift cards is undecided (POINT_OF_SALE.md).

**Surfaces:** web app; phone (customers with tabs, deal board, tickets; MOBILE.md); till (customer
lookup, loyalty); storefront (loyalty in the account).

**Connects to:** sales documents, finance (loyalty posting roles), communication inbox, BI (CAC, LTV).

**Avoid:** naming SMS or WhatsApp vendors; open-rate numbers; the "NDPR/GDPR compliant" label (the doc says
only that optional messages "respect NDPR and GDPR").

**Words:** Customers, Deals, Pipelines, Activities, Support tickets, Loyalty scheme, Tiers, Points ledger,
Campaigns, Audiences, Announcements.

**Boards:** erp4a-customers-home, erp-customer, erp4a-organisation-page, erp4a-support-tickets,
erp4a-loyalty-scheme, erp4a-campaign-editor, erp4a-phone-ticket.

---

## product-pos — Point of sale

**Job:** a till that keeps selling when the internet goes down and lands every sale in the ERP.

**Jobs it does:** serve the queue online or off; close the shift with cash counted; see sales by till,
cashier and hour.

**Built:**
- Kotlin till for desktop (macOS, Windows, Linux) and Android; the browser till is offline-first (POINT_OF_SALE.md).
- Always journal, then sync: sales offline within allowances the ERP sets per product (POINT_OF_SALE.md).
- Enrolment codes, cashier PINs, supervisor limits for discounts, refunds and voids (POINT_OF_SALE.md step 1).
- Shifts, cash and sync exceptions; sales posted once as invoices and receipts (POINT_OF_SALE.md step 2).
- Returns as credit notes and refunds, back the way the sale was paid (POINT_OF_SALE.md).
- Split tender: cash, card, transfer, points, gift card, store credit, wallet, on account, QR, payment link (POINT_OF_SALE.md step 9).
- Customers found at the till; loyalty earned and spent (POINT_OF_SALE.md step 9).
- Gift cards sold and topped up at the till (POINT_OF_SALE.md step 9).
- Reports: sales by till, cashier and hour; payment mix; cash differences; offline time; voids (POINT_OF_SALE.md step 10).
- ESC/POS receipt printing and cash drawer (POINT_OF_SALE.md).
- Browser printing over USB or Bluetooth (POINT_OF_SALE.md).
- Restaurant mode: floor plan, table service, kitchen display, recipes taking stock (RESTAURANT.md).

**Not yet (pre-launch):**
- iOS is written but not built.
- No real terminal tried; wave-2 makers' printers and card terminals are not connected; scales are
  ports only.
- Real tax-authority connections.
- Tills for every platform (step 6).
- Commerce's own devices.
- QR and payment link run on a sandbox.

(All from POINT_OF_SALE.md.)

**Surfaces:** till (native and browser), tablet and phone tills (Android), kitchen display.

**Connects to:** sales (invoices, receipts, credit notes), stock (allowances reserved), finance, CRM
loyalty, gift cards, analytics reports.

**Avoid:**
- Device makers as supported (Sunmi, PAX, Star, Epson). The doc says "never yet run on a real terminal".
- "Fiscal certified". The doc says "not a certified fiscal device".
- FIRS, GRA or eTIMS as connected.
- iOS.

**Words:** Till, Shift, Opening float, X report / Z report (product doc), Cash differences, Offline
allowance, Supervisor, Hold and recall, Kitchen.

**Boards:** Till Main, Retail, Payment, Floor, Kitchen; trade/Sell, trade/Checkout; phone/*; tablet/*;
erp4c-rest-floor-plan, erp4c-rest-kitchen.

---

## product-online-shop — Online shop and Storefront Studio

**Job:** open online shops from the ERP, designed in Studio, selling the ERP's stock at its prices.

**Jobs it does:** sell online without a second catalogue; give business buyers their own prices and
terms; change the look without a developer.

**Built:**
- "Create online store": channel, API credentials, subdomain and first feed in one step (Online-Shop doc §6; ROADMAP 4.11).
- Many shops per organisation, by location, inventory type or brand (Online-Shop doc §2).
- Orders come back as sales orders tagged with the channel (ROADMAP 4.11).
- Assortment is a rule; availability is shared with the till (ROADMAP 4.11).
- Custom domains: buy, connect your own, renew, certificates (ROADMAP §5).
- Shopper accounts and company shoppers; delivery zones, rates, collection, tracking (ROADMAP §5).
- Reviews, wishlists, back-in-stock alerts, display currencies (ROADMAP §5).
- Studio: theme, pages, menus and collections as versions; preview, approval, publish, roll back (STOREFRONT_STUDIO.md).
- A contrast guard on theme colours (STOREFRONT_STUDIO.md §2).
- Visual designer (STOREFRONT_STUDIO.md §12).
- B2B: account prices, contract catalogues, credit terms, POs, quotes, returns, coupons (STOREFRONT_STUDIO.md §13).
- Journeys: subscriptions, bookings, warranties, ordering for a time (STOREFRONT_STUDIO.md §14).
- Archive and restore a storefront (STOREFRONT_STUDIO.md).

**Not yet (pre-launch):**
- Storefront analytics: sessions, conversion, page speed (STOREFRONT_STUDIO.md).
- Scheduled publication (STOREFRONT_STUDIO.md §10).
- Dedicated containers (ROADMAP §5).
- Tax engine alignment, which is step 3 (TAX_ENGINE.md).
- Live payment rails.
- Channel kinds marked "later": social or WhatsApp catalogue, plain API (ROADMAP 4.11).

**Surfaces:** storefront (desktop and phone); web app (Studio, Channels).

**Connects to:** stock (sell-from types), pricing, sales orders, payments, CRM (accounts, loyalty,
tickets), Drive (images), booking engine.

**Avoid:**
- Naming Hostinger, Jumia or Konga.
- "SEO-ranked".
- Speed claims.
- The four languages by name (the docs do not give them).

**Words:** Storefronts, Look and content, Publish, Publication, Collections, Sales channel, Create online
store.

**Boards:** studio/storefronts, studio/designer, studio/theme, studio/catalogue, studio/publishing; shops/*-desktop, shops/*-phone; erp4a-sales-channels, erp4a-channel-detail, erp3-studio-publishing.

---

## product-trading-network — Trading network

**Job:** two businesses on Clafina trade without re-typing; one side's purchase order becomes the other's
sales order.

**Jobs it does:** stop keying in partners' documents; see the partner's progress on each order; reconcile
statements line by line.

**Built (all ten steps; ROADMAP Phase 15):**
- Organisation customers on a shared party record, with sites, buyers and limits (Trading-Network doc §4).
- Passwordless shared links for every document kind; acting needs a one-time code (doc §10.1).
- Joining from a link; shared documents offered into the new organisation's books (doc §10.2).
- Verified network profiles; consent by both sides; both directions on one connection (doc §5).
- Item mapping by barcode, then supplier code, then by hand; remembered (doc §6).
- PO to incoming order, confirmations, change requests, delivery note to expected receipt (doc §7).
- Invoice to draft bill with three-way match; credits, returns, remittances, mutual statements (doc §7, §9).
- Every arrival is a draft; auto-accept is off by default (doc §7).
- A thread per document; disputes with owner and outcome (doc §8).
- Group companies trading over the network into intercompany (doc §13 step 7).
- Catalogues, RFQs and shared quality documents (doc §13 step 8).
- Peppol and EDI as translations of the same envelopes (ROADMAP §5).
- Netting and network reports (ROADMAP §5).

**Not yet (pre-launch):** AS2, SFTP, VAN and the country e-invoicing mandates (ROADMAP §5). Real bank money
movement is out of scope (doc §2).

**Surfaces:** web app; shared link pages for partners outside Clafina.

**Connects to:** sales, procurement, supplier management, intercompany, finance.

**Avoid:** "Peppol-certified" or "access point"; country mandates; KYC/KYB vendor names.

**Words:** Network, Connection, Connect on Commerce (rename to Clafina), Verified, Connected, Envelope,
Received documents, Item map.

**Boards:** erp4b-network-home, erp4b-network-connection, erp4b-network-received, erp4a-organisation-page.

---

## product-stock — Stock and warehouses

**Job:** know what you hold, where and what it is worth, from one movement ledger.

**Jobs it does:** never run out; count with confidence; move stock between places and types under
control.

**Built:**
- Append-only movement ledger; position at any past date (STOCK.md).
- Valuation by moving average or FIFO, landed costs, stock account equal to stock value (STOCK.md; ROADMAP 5 step 2).
- Inventory types: raw materials, WIP, finished goods and more; hide built-ins, add your own (ROADMAP 4.13).
- Stock per inventory type; settings for which types a sale draws from (ROADMAP Stock flow).
- Type transfers with the organisation's reasons; reverse (ROADMAP).
- Transfers between places, in transit, through approvals (ROADMAP).
- Reorder levels: minimum, safety, reorder point and quantity; "Order what needs it" (ROADMAP 4.13, screens).
- ABC stock classes and cycle counts (ROADMAP 4.13).
- Count sheets with blind counts; a count on a phone (STOCK.md).
- Batches and expiry (STOCK.md).
- Adjustment requests through approval above a value; "only through documents" mode (STOCK.md).
- Products with variants; units of measure with conversions; service items (ROADMAP screens; STATUS).
- Vehicle or asset named on a dispatch (STOCK.md).

**Not yet (pre-launch):** product-specific unit conversions and document lines in units (ROADMAP §5); prices
per unit; blind counts by role; the phone count's unit toggle and bin (ROADMAP screens); location scope on
stock moves (STOCK.md).

**Surfaces:** web app; phone (count, receive goods).

**Connects to:** sales, procurement, finance (valuation), manufacturing, projects, assets, POS and storefront
availability.

**Avoid:** "real-time across warehouses" as a scale claim; counts.

**Words:** Inventory, Inventory types, Type transfer, Transfers, Reorder levels, Order what needs it, Stock
counts, Stock classes, Units of measure, Variant, Awaiting release.

**Boards:** erp-stock, erp4b-products, erp4b-product-page, erp4b-reorder-levels, erp4b-stock-count,
erp4b-stock-count-phone, erp4b-units-of-measure.

---

## product-purchasing — Procurement, suppliers, payables

**Job:** buy from requisition to payment, with suppliers checked and bills matched.

**Jobs it does:** compare quotes and order at the right price; never pay an unreceived or doubled bill;
keep suppliers' papers in date.

**Built:**
- Requisitions, requests for quotes, quote comparison, award to an order (ROADMAP Phase 6).
- Purchase orders sent as PDF or shared link; received in part or whole (ROADMAP Phase 6).
- Goods receipts, quality inspections, returns to supplier (ROADMAP Phase 6).
- Supplier bills with the three-way match and variance; payments with discount and withholding (ROADMAP Phase 6).
- Purchasing posts to the ledger: GRNI, landed cost, variances (STATUS 5.4).
- Supplier lifecycle with thirteen statuses; separate blocks for buying and for paying (ROADMAP Phase 12).
- Bank account changes need three people (ROADMAP Phase 12).
- Compliance documents with expiry and automatic restriction (ROADMAP Phase 12).
- Qualification questionnaires and evaluation programmes (ROADMAP Phase 12).
- Scorecards from receipts, inspections, prices and disputes; corrective actions (ROADMAP Phase 12).
- Price lists and contracts feeding the order price (ROADMAP Phase 12).
- Supplier 360 page, spend analytics, comparison (ROADMAP Phase 12).
- Supplier portal with code sign-in (ROADMAP Phase 12; Trading-Network doc §10.1).
- PDFs and "Make a copy" for buying documents (ROADMAP BI v3 list).

**Not yet (pre-launch):** Any-match filter on bills; overriding a match; bank balance, early-payment
discount and withholding rules in Pay suppliers (ROADMAP screens). Units only on goods receipt lines.
An inspection moves no stock (STATUS). Whether the portal is on by default is a decision for the owner
(ROADMAP §5).

**Surfaces:** web app; phone (receive goods); supplier portal and links.

**Connects to:** stock, finance ledger and budgets, payments, tax engine, manufacturing (shortages raise
requisitions), trading network.

**Avoid:** naming banks; "fraud-proof".

**Words:** Requisition, Request for quotes, Compare quotes, Purchase order, Goods received, Return goods,
Supplier bills, Bill and three-way match, Pay suppliers, Payables.

**Boards:** erp4b-procurement-home, erp4b-quote-compare, erp4b-purchase-order, erp4b-bill-match,
erp4b-supplier-page, erp4b-receive-goods-phone.

---

## product-manufacturing — Manufacturing

**Job:** plan, schedule, make and cost products, from bill of materials to finished goods in stock.

**Jobs it does:** know if you can deliver by a date; keep machines and people on the right work; see what
each work order really cost.

**Built (MANUFACTURING.md, all nine steps):**
- Bills of materials with versions, co-products, by-products, phantoms, scrap.
- Routings, work centres, revisions released through approval, engineering change.
- Plants, lines, work-centre calendars, machines kept as events, tools with calibration, skills.
- Manufacturing projects: phases, milestones, deliverables, risks, changes.
- Production orders; a planning engine for sub-assemblies; materials held or short; shortages raise requisitions.
- "Can we deliver by…?" with its factors.
- Finite-capacity scheduler around maintenance and breakdowns; board by machine, person or order; critical path; scenarios.
- Operator's screen: start, pause, good and spoilt units, stops with reason codes; offline sync; scan labels with QR.
- Quality: inspection plans, gates, non-conformance reports, corrective actions, traceability both ways.
- Work-order cost from what happened; WIP in the ledger; variances; earned value.
- Automations for shortage, delay and breakdown.
- Dashboards with OEE and scrap rate.
- Output held in "Awaiting release" until quality releases it (ROADMAP).

**Not yet (pre-launch):**
- Statistical sampling (AQL) and control charts.
- Machine states from IoT not joined to the floor.
- Sequence-dependent setup.
- Energy read from meters.
- Capacity overload net of maintenance and leave.
- A work order from a configured order (ROADMAP configurator).

**Surfaces:** web app; shop-floor screen (any phone camera opens a label).

**Connects to:** stock, procurement, finance, HR (people, rosters), asset management (maintenance), projects.

**Avoid:** "Industry 4.0 / IoT-ready" as live; OEE benchmarks.

**Words:** Bill of materials, Routing, Work centre, Production order, Work order, Shop floor, Output awaiting
release, Non-conformance report.

**Boards:** erp4c-mfg-production, erp4c-mfg-production-orders, erp4c-mfg-work-order, erp4c-mfg-quality,
erp4c-mfg-materials, erp4c-mfg-maintenance.

---

## product-bookings — Bookings and calendar

**Job:** one engine for anything booked (rooms, tables, staff, equipment, vehicles, spaces), plus team
calendars and booking links.

**Jobs it does:** take bookings online without double booking; take deposits; run the front desk's day.

**Built:**
- Resources, offers (service, table, stay, hire), rate plans, hours and closures (BOOKINGS.md).
- No double booking, enforced in the database (BOOKINGS.md).
- Availability slots, stays and nights, with why something is not offered (BOOKINGS.md).
- Pricing from the price book, plus rate plans (BOOKINGS.md).
- Reservations: held, confirmed, checked in, completed, no-show (BOOKINGS.md).
- Deposits by payment link; confirms itself when paid (BOOKINGS.md).
- Cancellation and no-show fees by setting (BOOKINGS.md).
- Waiting list offered freed places for a set time (BOOKINGS.md).
- Public booking pages; guests move or cancel by their own link (BOOKINGS.md step 3).
- Guest emails with a calendar file; staff notified (BOOKINGS.md).
- Timeline (drag to move), day sheet, reservations, waitlist (BOOKINGS.md step 4).
- Invoice from a completed stay or service (BOOKINGS.md).
- Calendar by day, week, month, year and agenda; appointment types; booking links; reminders (ROADMAP 13 step 1).

**Not yet (pre-launch):** SMS and WhatsApp guest messages; a channel manager (ROADMAP booking engine);
the test lane.

**Surfaces:** web app; public booking pages; phone (day sheet; calendar in MOBILE.md phase 4); storefront
booking journey.

**Connects to:** pricing, payments, sales invoices, CRM customers, restaurant tables, accommodation and
classes packs, Meet links.

**Avoid:** naming OTA channels; "channel manager".

**Words:** Timeline, Day sheet, Reservations, Waiting list, Offers, Booking pages, Hold, No-show, Check in.

**Boards:** erp4c-bookings-timeline, erp4c-bookings-day-sheet, erp4c-bookings-reservation,
erp4c-bookings-pages, erp4c-calendar-links, erp4c-phone-bookings-day-sheet.

---

## product-projects — Projects and timesheets

**Job:** run service projects with tasks, time and money, and invoice what was approved.

**Jobs it does:** see which projects are late or over hours; get timesheets in and approved; bill time
and milestones.

**Built (PROJECTS.md, steps 1–5):**
- A project with customer, manager, team, dates and budget in hours and money.
- Billing type, lifecycle with gates, templates.
- A Drive workspace per project; the ledger's Project dimension.
- Tasks on a board and list; sub-tasks roll up; dependencies, checklists, files.
- Milestones with acceptance.
- Time by hand, timer or import, costed at the person's rate.
- Weekly timesheets through approval, locked once approved.
- Invoices from approved time, milestones and fixed-price schedules; retainers and prepayments.
- Profitability, budget burn and forecast.
- Stock issued to a project at cost, with a Materials tab.
- Overview: late, over hours, timesheets waiting, time to bill with projection.
- Live screens; one project table shared with manufacturing.

**Not yet (pre-launch):** notifications for assignment and mentions; a retainer-period job; time zone
on timers; cost rates beyond base salary (PROJECTS.md limits).

**Surfaces:** web app; phone (timesheet board erp4c-phone-timesheet).

**Connects to:** sales invoices, stock, finance ledger, HR (rates, timeclock), manufacturing projects,
construction pack.

**Avoid:** utilisation numbers.

**Words:** Projects, My tasks, My timesheet, Timesheet approvals, Time to bill, Materials, Retainer.

**Boards:** erp4c-projects-overview, erp4c-projects-list, erp4c-project-detail, erp4c-timesheet,
erp4c-timesheet-approvals, erp4c-phone-timesheet.

---

## product-assets — Assets and maintenance

**Job:** a register of what the business owns, kept maintained, depreciated and accounted for.

**Jobs it does:** know where every asset is and who holds it; keep machines and vehicles maintained;
depreciate and dispose correctly in the books.

**Built (ROADMAP Phase 10, all six steps):**
- Register with classes, places, custody, assignment, components, bundles.
- Tags with QR codes; imports and exports.
- Transfers through approval.
- Work orders with parts from stock and labour.
- Preventive schedules by date and meter; inspections; warranties; service contracts.
- Assets from goods received or stock; a capitalisation threshold.
- Monthly depreciation by four methods, posted as one entry.
- Revaluation, impairment, disposal with gain or loss, lost and stolen, insurance claims.
- Verification counts by scan; cost of ownership; replacement planning.
- Leaver's return checklist from HR exit.
- Phone field checks offline with photos; meter readings; damage reports.
- Trackers and fleet (fuel, cost a km); failure risk; anomaly scan.
- Maintenance expense or capitalise; assets under construction (ROADMAP inventory into work).

**Not yet (pre-launch):** none listed. ASSETS.md is not in product-source, so unclear.

**Surfaces:** web app; phone (field checks; board erp4c-phone-maintenance).

**Connects to:** procurement, stock, finance ledger, HR, manufacturing scheduling, waybills (asset on
dispatch).

**Avoid:** RFID/NFC and tracker hardware as tested; the AI features rely on the organisation's own AI
provider (ROADMAP 6c).

**Words:** Asset register, Maintenance, Schedules, Work order, Depreciation run, Disposal, Verification
count, Assets under construction.

**Boards:** erp4c-assets-overview, erp4c-assets-register, erp4c-asset-page, erp4c-assets-maintenance,
erp4c-assets-schedules, erp4c-phone-maintenance.

---

## product-hr — HR and payroll

**Job:** people, time, leave, pay and performance in one place, with payroll posted to the books.

**Jobs it does:** pay everyone correctly and remit what is owed; plan rotas and track attendance;
handle leave and reviews.

**Built:**
- Staff, departments, teams, jobs, contracts, right to work, documents, exit (HR.md).
- Compliance records with expiry (HR.md).
- Shifts, rotation plans that generate the rota, holidays (HR.md).
- Attendance with clock-in and clock-out against the shift, in the organisation's time zone; self clock-in (HR.md).
- Leave entitlements with carry-over; requests by approval policy; "My leave" (HR.md).
- Pay groups, grades, components, salary structures, tax tables by country and state (HR.md).
- Payroll runs: calculated, approved, paid, voided; payslips printed; "My payslips" (HR.md).
- Employer contributions posted (HR.md audit fixes).
- Paying over PAYE and pension from the run as payment requests (HR.md payroll2).
- Voiding a paid run, with how the money comes back (HR.md).
- Tax profiles with reliefs; non-resident tables (HR.md).
- Performance cycles, goals board, reviews self-assessed and rated (HR.md).
- People dashboard; HR overview of contracts ending and leave (HR.md).
- Every member is staff and reads their own record (HR.md).

**Not yet (pre-launch):** recording payout of net pay left in "net salaries payable"; payroll split by
department; self-service changes go through HR (HR.md limits). **Kiosk clock-in: not in any doc.**

**Surfaces:** web app; self-service at /me; phone (leave board). Kiosk unclear.

**Connects to:** finance ledger and payment requests, approvals, projects (cost rates, timeclock),
manufacturing (rosters, skills), assets (leaver checklist), courses pack.

**Avoid:** "statutory compliant payroll"; country tax presets. The organisation enters its own tables, and
rent relief came from commentary, not the statute (HR.md).

**Words:** Staff, Rota, Attendance, Clock in, Leave, Pay groups, Payroll run, Payslips, Paying over, My
payslips, Performance.

**Boards:** erp4c-hr-overview, erp4c-hr-staff, erp4c-hr-staff-page, erp4c-hr-payroll-run, erp4c-hr-leave,
erp4c-phone-hr-leave.

---

## product-communication — Inbox, chat, Meet, templates, email

**Job:** every conversation tied to the record it is about, plus team chat, our own video, and every
document sent in the business's look.

**Jobs it does:** answer customers from one inbox; talk and meet without another tool; send documents
that look like yours.

**Built:**
- Conversations tied to records: notes, mentions, assignment, the customer's own link (ROADMAP 13 step 2).
- Channels: email (SMTP and IMAP), SMS, WhatsApp, web chat widget; retries and backup accounts (ROADMAP 13 step 3).
- Team chat: channels by department, team, project or document; direct messages; search (ROADMAP 13 step 4).
- Templates with variables and languages; transactional rules writing to customers and suppliers (ROADMAP 13 step 5).
- Routing rules and service levels with escalation (ROADMAP 13 step 6).
- Send later (ROADMAP 13 step 6).
- Announcements, campaigns, consent (ROADMAP 13 step 7).
- Communication history, cost, retention and search (ROADMAP 13 step 8).
- Meet: our own media server; waiting room; access rules; recording; transcripts (ROADMAP 13 step 9; meet.md).
- Start now, calls from a chat, voice-only rooms, Take notes into minutes (meet.md).
- Chat platforms as ways into the inbox, Capture and the assistant (messaging.md).
- Studio: brand kit, email layouts, document designer, till rolls, labels, versions and publishing (STATUS Studio).
- Sending limits; messages held, never lost (ROADMAP §5).
- Approvals inbox (erp shell; STATUS approvals).

**Not yet (pre-launch):** a first real connection of each chat-platform account; TikTok fields; presence
dots (messaging.md, meet.md). Also notification chat-to-a-person and the webhook step (STATUS).

**Surfaces:** web app; phone (calendar, Meet, calls; MOBILE.md phase 4); public guest pages.

**Connects to:** every document (templates, sharing), CRM, notifications, assistant (minutes), Drive
(recordings).

**Avoid:** naming Twilio, Termii, Africa's Talking, WhatsApp Cloud or Whisper providers; "rooms of a
hundred" as tested scale; "end-to-end encrypted" (not stated).

**Words:** Inbox, Messages, Channels, Meet, Start now, Take notes, Templates, Announcements, Campaigns,
Sending, Chat platforms.

**Boards:** inbox-v2, inbox-v2-message, erp4a-messages, erp5-meet-home, erp5-chat-call, erp5-start-now,
erp5-phone-call, phone-inbox-v2.

---

## product-mobile — The phone app

**Job:** the ERP in your pocket for owners and staff. The phone shows the ERP's answers and never works
out a price or status itself.

**Jobs it does:** approve and act on the go; sell and chase payment from the road; record meetings and
receipts.

**Built (MOBILE.md, RECORDS.md):**
- Approvals with facts and money; declining needs a reason.
- Home counts by area; KPI cards for sales today, cash and needs ordering.
- Records: follow, comments with @mentions, history, glance; quotations, orders, invoices, proformas, receipts, tickets, customers.
- Search across everything with status and amounts.
- Sales form priced by the ERP: quotations, orders, invoices, proformas.
- A quotation straight to an invoice; send, copy, payment link from a document.
- Invoice rows with days late.
- Customers with new, lapsed and leads tabs; the deal board.
- Payment-run bills to approve; transfer preview; cash summary; VAT position.
- Expense receipt photo read by AI.
- Assistant about a record; record a meeting from the composer.
- Calendar, find a time, rooms, Meet, shared links.
- Signed-in devices; some writes queue offline (comments, follows, invitation answers).
- "Open on a computer".

**Not yet (pre-launch):** run migrations on dev; the full test round; live proofs; the AI service accepting
"about"; describing older routes in OpenAPI (MOBILE.md, ROADMAP shell). **App platform (iOS, Android) and
store availability: unclear.**

**Surfaces:** phone app (through the mobile service); tablet board for Home KPIs.

**Connects to:** everything through the ERP's routes.

**Avoid:** "native iOS and Android"; app-store badges; "works fully offline".

**Words:** Inbox, Follow, Glance, Open on a computer, Payment runs waiting for you.

**Boards:** erp-phone-home, erp-phone-invoices, phone-inbox-v2, erp4d-phone-assistant,
erp4d-phone-capture; Mobile m1–m4 mockups.

---

## product-assistant — AI assistant

**Job:** a chat that turns a meeting voice note into minutes and draft documents, answers from your
records, and acts as you, with nothing sent until you confirm.

**Jobs it does:** come out of a meeting with the quote and tasks drafted; ask for any report in words;
do work across the app through its own tools.

**Built:**
- Assistant page and a drawer on every page (assistant.md).
- Voice note recorded in the browser or phone, or attached; transcript, minutes, next steps (assistant.md; ROADMAP Phase 16 step 4).
- Draft cards: quotations, sales orders, purchase orders, RFQs, tasks, calendar, messages (ROADMAP Phase 16 step 8).
- "Where this came from" plays the moment in the recording (assistant.md).
- Questions when something is unclear; Change this; revision history (assistant.md).
- Answers from records and documents, shown only to who may open them (ROADMAP step 6).
- Reports on request as table or chart; Save as report; Add to dashboard (assistant.md; ROADMAP step 7).
- Acts as the person, with their permissions; every call audited; "never sends, posts or pays by itself" (assistant.md; AI doc §3).
- Every API route available as a tool; long work returns as tasks (ROADMAP step 8, 1 Nov).
- Share a conversation read-only (assistant.md).
- In a chat platform for linked colleagues (ROADMAP step 5).
- MCP server for outside AI clients (ROADMAP 4.6).
- Communication AI: suggested replies, summaries, translation (ROADMAP 13 step 10).

**Not yet (pre-launch):**
- The training loop: fine-tuning and opt-in data (step 9).
- Live dictation (step 4).
- The tool-choice evaluation's numbers; live clients (step 8).
- "Ask a person" (ROADMAP Billing v3).
- Draft tools do not offer a service line yet (ROADMAP document lines).

**Surfaces:** web app, phone, chat platforms, outside MCP clients.

**Connects to:** sales, procurement, calendar, CRM tasks, reports, Drive, Meet.

**Avoid:**
- Model or vendor names (Llama, gpt-oss, Anthropic, OpenAI).
- "Runs on our own GPUs". The AI doc says it runs "on your Mac for now"; production hosting is unclear.
- Nigerian languages as supported.
- "Trained on your data".

**Words:** Assistant, Drafts to check, Where this came from, Copy as minutes, Save as report, Add to
dashboard.

**Boards:** erp4d-assistant-chat, erp4d-assistant-meeting, erp4d-phone-assistant.

---

## product-capture — Document capture

**Job:** photograph or forward a bill or receipt and get a checked draft, not a typing job.

**Jobs it does:** stop keying in supplier bills and receipts; catch duplicates before they are paid;
keep the original beside the record.

**Built:**
- Capture from photo, upload, Drive file, forwarded email to a capture address, or a chat platform (capture.md; ROADMAP Phase 16 steps 2, 3, 5).
- Fourteen document kinds: bills, receipts, purchase orders, delivery notes, customers' orders, RFQs, products, assets, journal vouchers, count sheets and more (ROADMAP step 3).
- "Fill from a document" on forms; "Create from this file" in Drive (capture.md).
- Review beside the original: boxes on the picture, confidence in words, reasons to check (capture.md).
- Supplier matched with why: same tax number, chosen before (capture.md).
- Coding suggested from your history (capture.md).
- Duplicate checks that must be answered (capture.md).
- Makes a draft bill or expense claim; nothing posted (capture.md).
- Inbox with tabs, an attention band and manager measures (capture.md).
- Phone camera page with a steadiness hint (capture.md).
- Waits and retries on a weak connection (capture.md).
- Originals kept in Drive (ROADMAP step 2).

**Not yet (pre-launch):** test lane runs; page-by-page progress (ROADMAP step 3, v3 API); phone-app
capture with offline queueing (Commerce AI step 10, status unclear).

**Surfaces:** web app, phone layout, chat platforms, email.

**Connects to:** procurement bills, expenses, Drive, assistant, suppliers.

**Avoid:** accuracy percentages, "hours saved", and OCR or model names.

**Words:** Capture, Fill from a document, Create from this file, Check, Make the draft bill, Possible
duplicate, Ready to review.

**Boards:** erp4d-capture-inbox, erp4d-capture-review, erp4d-phone-capture.

---

## product-integrations — Integrations and API

**Job:** connect Clafina to the tools a business already uses, without code where possible.

**Jobs it does:** send email from your own domain; push events to your systems; let your scripts and
AI tools use the API safely.

**Built (ROADMAP Phase 4.6; STATUS):**
- Integrations area: providers in slots, per organisation or location, with connection health.
- Own email sending: own SMTP, Google Workspace or Microsoft 365 by OAuth, and seven email providers with delivery webhooks.
- OAuth connect with refresh; failures shown to admins.
- Outgoing webhooks: signed, retried, logged, replayable, paused after failures.
- API keys scoped to permissions, hashed, shown once.
- Zapier, Make and n8n via REST hooks.
- Accounting export to three packages.
- CRM sync with four CRMs.
- Document archive to cloud storage.
- Single sign-on (SAML, OIDC).
- MCP server: read, draft and confirm tools with OAuth sign-in.
- Payment, SMS/WhatsApp and chat-platform slots (ROADMAP 4.9, 4.10; messaging.md).
- Channel API keys with their own rate limit and webhooks (ROADMAP 4.11).

**Not yet (pre-launch):**
- Statutory e-invoicing connector, still "its own decision" (ROADMAP 4.6).
- Zapier and Make apps "made in their consoles"; whether they are published is unclear.
- Outside tax-provider adapters (TAX_ENGINE.md).
- Plan gating, which is undecided.

**Surfaces:** web app (Admin → Integrations); API; MCP.

**Connects to:** every module through events and the API.

**Avoid:**
- Partner logos and claims of being "official".
- Naming QuickBooks, Xero, Sage, HubSpot or Salesforce without checking that live use is confirmed.
- "3,950 tools".

**Words:** Integrations, Connections, Outgoing webhooks, API keys, Single sign-on, Email sending.

**Boards:** none specific. Use erp3-notification-rules, erp4a-sending, erp4a-messaging (closest), or
Settings mockups.
