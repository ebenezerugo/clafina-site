# Tax engine

> Status: **step 1 built, 18 October 2026** (sales taxes, setup, determination, ledger); **step 2 built, 19 October 2026** (purchases and input tax, withholding, credit notes and returns, rule editing, approval for tax changes, the US, EU and India presets, the price list and channel flags). Step 3 (reports, certificates, the filing calendar, storefront and POS alignment) follows. The research behind the model is `design-handoff/tax-engine/RESEARCH.md`.
> Tests: `src/modules/finance/tax/**/*.spec.ts` (calculation, rules, determination, presets, POS parity, purchases, withholding, credit tax, the US sandbox), `sales-tax.service.spec.ts`, `purchase-tax.service.spec.ts`, `printable-tax.spec.ts`, `tax-rate-periods.logic.spec.ts`, `test/tax-engine.e2e-spec.ts`, `test/tax-engine-2.e2e-spec.ts`, `npm run tax:drill`.

An international, multi-tax engine for the four sales documents (quotations, proforma invoices, sales orders and customer invoices) and, from step 2, for purchase orders and supplier invoices. Which taxes a line carries is **decided by rules the organisation owns**, from the seller's place, the buyer, the item and the date; every decision is kept on the line with its reasoning.

## What it does

- **Setup in Settings → Tax**: country presets, tax codes with dated rates, **tax groups with dated versions** (taxes applied together, in a compound order), **item tax categories**, **rules**, each location's tax country, tax id and registration, and each party's tax profile.
- **Determination** answers five questions in order for every line, and writes each answer to a trace stored with the line:
  1. **Where is the supply taxed?** (place of supply): where the seller is, unless the document or a `PLACE_OF_SUPPLY` rule says otherwise.
  2. **Is the seller registered there?** No registration means no tax is charged, and the line says **outside the scope: not registered**. Nothing is ever a silent zero.
  3. **What is the treatment?** A buyer's VAT exemption certificate in force; else the `TREATMENT` rule that wins; else what the item's tax category says; else taxable.
  4. **Which tax group?** The `GROUP` rule that wins, else the country's default group; then any `MAPPING` rule (a "fiscal position": for this buyer, that group becomes this one). The group *version* in force on the document's date is used, with each tax's rate in force that day.
  5. **The amounts**: compounding, inclusive back-calculation, rounding.
- **Several taxes on a line**: one row per tax per line in `finance.document_tax_lines`, with the rate (a percentage, as the code holds it), base, amount, amount in the books' currency, compound order, treatment, reason, source and trace. The older `tax_rate`, `tax_amount`, `line_tax` and `tax_total` columns stay as summaries.
- **A change on the go**: on a line, a permitted person may pick another group, pick taxes by hand, or make the line exempt, zero-rated, reverse-charged or untaxed, when the document's settings allow. The change keeps who, when, why, the permission used, the warnings accepted and what the rules would have said (`finance.tax_line_overrides`, immutable). "Remember this" makes a rule (see below).
- **The ledger**: posting an invoice credits each tax to its code's own payable account, or to the Output VAT role (scoped by the code) when the code names none. Revenue is the line's total less its tax, so prices that include the tax post correctly.
- **The provider seam**: determination runs behind `TaxProvider` (`quote`, `commit`, `void`, `refund`, `health`); the internal rules engine is the default. An outside service (Avalara, Vertex, Stripe Tax…) registers an adapter with `TaxProviderRegistry` and is chosen in `finance.tax_settings.provider`. **No outside adapter is built.** Fiscalisation (eTIMS, GRA E-VAT, e-invoicing) is a separate seam that reads posted tax lines.

## Where it is off

`finance.tax_settings.engine_enabled` is false until the organisation adopts a preset or turns it on. While it is off every document behaves as it did. It is also skipped for a document sent with `taxDetermination: given`: a till's sale and a conversion, which keep their taxes as charged.

## The model

| Table | What |
|---|---|
| `finance.tax_code` (extended) | country, region, `recoverable_pct`, return boxes; `tax_rate.rate` is `numeric(9,6)`, **a percentage** (7.5), with a legal reference |
| `finance.tax_groups`, `tax_group_versions`, `tax_group_members` | a group has dated versions; a member has `compound_order`, `compounds` (its base includes the taxes of lower orders that `affects_base_of_next`) and `included_in_price` |
| `finance.tax_categories` | standard, reduced, zero-rated, exempt, out of scope, custom; set on products (`item.products.tax_category_id`) and services (`service_items.tax_category_id`) |
| `finance.tax_rules` | one table: stage, direction, priority, validity, typed `conditions`, one `outcome`, `specificity`, source (`preset`, `manual`, `remembered`), status (`active`, `proposed`, `declined`) |
| `finance.location_tax_profiles` | the seller's country, region, tax id and registration, per location |
| `party.tax_profiles` | registered, country, reverse charge, government; the party's TIN, VAT number, withholding status and certificates stay where they were |
| `finance.document_tax_lines` | the taxes of a document line (one polymorphic table for the four documents) |
| `finance.tax_line_overrides` | every change by hand |
| `finance.tax_settings` | engine on or off, provider, home country, adopted preset and its version |

Header fields on all four documents (`1787000000100`): `salesperson_id`, `customer_reference`, `note_to_customer`, `internal_note`/`terms` (a quotation and a proforma already had theirs: `notes`, `terms_and_conditions`/`terms`), `price_list_id/name/reason`, `fx_note`, `place_of_supply_country/region`, `tax_rounding`, `tax_scenario`, `seller_tax_id`, `buyer_tax_id`, `tax_treatment`, `taxes_determined`, `copied_from`.

### Rates are percentages

`tax_rate.rate` and `document_tax_lines.rate_percent` are percentages (7.5). The sales lines' older `tax_rate` is a fraction (0.0750); it is kept only as a summary (the line's effective rate). So is a purchase order item's, a supplier invoice line's and a customer invoice line's `taxRate`, and since 26 October 2026 a value above 1 is refused there (customer invoices from the same day, one shared rule `IsTaxRateFraction` in `src/common/validators/tax-rate.validator.ts`) (400, "The tax rate is a fraction between 0 and 1 (0.075 is 7.5%)."): the demo data had sent "7.5", making every VAT line on dev a hundred times too big (input VAT ₦428,521,500 where ₦4,285,215 was owed). A credit or debit note line's `taxRate` is the other way round, a **percentage** (7.5; the note prices net × rate ÷ 100): `IsTaxRatePercent`, 0 to 100. Quotation, proforma and sales order lines take no rate, only `lineTax` and the engine's `taxes` (percentages). Existing lines with tax were given one `document_tax_lines` row from their rate and amount (source `DEFAULT`) by migration `1787000000200`.

### Compounding

Components are worked out in `compound_order`. A member that `compounds` is charged on the net amount plus the taxes of the **lower orders that affect the base of the next**; one that does not, on the net alone. Members of one order share one base.

### Inclusive prices

The price is the gross. The net is `gross / F`, where `F = 1 + Σ(taxes of a net of 1)` over the members included in the price (compounding honoured); the tax is what is left. A member **not** included in the price is charged on top. Taxes are rounded and the net takes the remainder, so the price is exact.

### Rounding (a document setting)

- `line`: each tax of each line is rounded to the currency's decimals.
- `line-total`: a line's taxes are added up, the sum rounded once and shared among the taxes (largest remainder): what a till does with one combined rate. The ERP and the POS give the same tax to the cent for Ghana in this mode (`pos-parity.spec.ts`).
- `document`: the tax of each **code** is added up over the document, rounded once, and the lines are made to agree with it.

### Rules

Conditions are typed and whitelisted (`tax-rules.logic.ts`): `sellerCountry`, `sellerRegion`, `sellerLocationId`, `shipToCountry`, `shipToRegion`, `crossBorder`, `buyerStatus` (registered, unregistered, exempt, reverse-charge, government), `partyId`, `itemCategoryIds`, `itemCategoryKinds`, `goodsCategoryIds`, `variantIds`, `serviceItemIds`, `documentTypes`, `amountMin`, `amountMax`. Nothing else is accepted, so a condition nobody evaluates never looks like a rule that works.

**The most specific rule of a stage that matches wins**; priority breaks a tie, then the newest, then the id. Weights: an item 1024, a customer 512, a kind of buyer 256, the item's category of goods 128, its tax category 64 (by kind 48), ship-to region 32, ship-to country or crossing a border 16, selling location 8, seller region 4, seller country 2, document type 1. A rule about an item therefore beats every rule about countries together.

Every rule a preset ships carries the preset's own `sellerCountry`, so an organisation that adopted two countries is never charged by the wrong one.

### Overrides and "remember this"

The document's setting **Changing the taxes on a line** is `locked` (default), `choose-from-allowed` (another group of the place) or `any-with-reason`. Permissions: `finance.tax.override` (change a line), `finance.tax.override-exempt` (take tax off a line the rules charge it on), `finance.tax.rules.manage` (create rules; a remembered choice becomes a rule at once).

After the rule-derived answer is worked out, the chosen one is compared and each difference is classed: **BLOCK** (tax removed from a taxed line without a certificate: needs the permission to exempt), **WARN** (a lower tax, a group of another jurisdiction), **INFO** (a higher tax). BLOCK and WARN must be acknowledged (`acknowledgedWarnings`), or the request is refused with `TAX_WARNINGS_UNACKNOWLEDGED` and the warnings.

**Remember this** (scope: this item, this item for this customer, the item's category of goods, this customer, this location) creates a `GROUP` or `TREATMENT` rule: live for a holder of `finance.tax.rules.manage`, **proposed** for anyone else who may change taxes (approved or declined on the Rules screen). It never rewrites a document that already exists.

## Country presets

The demo organisation adopts the NG pack and maps its items through the use cases a person would use (`src/database/demo/eben/eben-tax.ts`, DEMO.md): its documents are decided by the engine, and `demo:eben:check` holds output and input VAT to 7.5% of net.

Versioned data (`presets/packs.ts`) carrying `reviewedOn`, `confidence`, `sources` and `notes`. Adopting copies a pack into the organisation as its own (codes and rates, groups and versions, categories, locked rules), sets the home country, switches the engine on, and gives each location without a profile the pack's country. Re-adopting adds only what is missing and never overwrites. A pack never states which items are zero-rated or exempt (the lists differ between advisers and changed in 2025 and 2026): it ships the category **slots** and the organisation maps its items.

| Pack | Taxes | Assumptions |
|---|---|---|
| **NG** | VAT 7.5%; zero group | Unchanged by the Nigeria Tax Act 2025. Withholding is on receipts and payments (step 2). |
| **GH** | VAT 15%, NHIL 2.5%, GETFund 2.5%, COVID-19 levy 1% (to 2025-12-31) | **Group `GH-STD` has three versions.** To 2020-12-31 and to 2025-12-31 the levies come first and VAT is charged on the amount plus the levies (21.9% with the COVID levy). **From 2026-01-01 (VAT Act 2025, Act 1151) VAT, NHIL and GETFund are charged on the same amount, no compounding: 20%.** Sources: EY (12 Jan 2026), Crowe, UKGCC. Imports may still cascade and are not covered. |
| **KE** | VAT 16%; zero group | eTIMS types A exempt, B 16%, C zero. Finance Act 2025 reclassifications are not verified. |
| **ZA** | VAT 15%; zero group | The 2025 increase was reversed. |
| **UK** (`GB`) | VAT 20%, 5%, 0% | Reverse charges (overseas services, construction) are rules the organisation adds. |

Every pack also records `badDebtVatRelief` (`allowed`, `basis`): whether its country gives VAT back on a debt written
off as bad — the default of the invoice setting `taxBadDebtRelief` (SALES.md, *VAT on sales*). Allowed: UK (VATA 1994
s36), KE (VAT Act 2013 s31), ZA (VAT Act s22), the EU (Directive art. 90; member-state conditions) and the US (most
states). Not allowed: NG, GH (not confirmed), IN.

## API

`GET /tax/settings` also answers `salesVat` — registered for VAT with no rule charging an ordinary sale, the warning
"No VAT rule applies to your sales — check Tax › Rules" and its link (`engine/sales-vat-check.logic.ts`, SALES.md
*VAT on sales*) — and `badDebtRelief`, what the adopted preset says of bad-debt relief.

Under `/api/v1/tax`: `settings`, `presets`, `presets/:key`, `presets/:key/adopt`, `groups`, `groups/:id/versions`, `categories`, `rules`, `rules/remember`, `rules/:id/approve|decline`, `locations`, `locations/:locationId/profile`, `party-profiles/:partyId`, `simulate` ("test a sale": the lines, amounts and the step trace, writes nothing), `documents/:type/:id`. Codes and rates remain `tax/codes`. Permissions `finance.tax.read|create|update` and the three above.

On the four documents (create and update): `salespersonId`, `customerReference`, `noteToCustomer`, `internalNote` and `terms` (an order, an invoice), `priceListId/Name/Reason`, `fxNote`, `placeOfSupplyCountry/Region`, `taxTreatment` (`exclusive`, `inclusive`, `none`; a quotation and a proforma also keep `taxMode`, an order `priceIncludesTax`), `taxDetermination` (`auto`, `given`), `copiedFrom: { type, id }`, and per line `taxOverride`. Responses carry `taxBreakdown` (by code), per line `taxes`, and the derived header fields.

What the sales forms read while a document is written (`/api/v1/sales-form`, open to anyone who may create any of the four documents, never to Finance only): `defaults` (is the engine on, home country, the treatment, rounding and override settings, default terms, what this person may do about taxes, and the groups a line may be changed to), `tax-quote` (the taxes as the form stands: per line the taxes, why, warnings; totals by code; writes nothing), `fx-rate` (the books' rate for a currency on a day) and `salespeople`.

## Documents

- **Make a copy** is a form feature, not an endpoint: the form reads the document, starts a new draft from its lines, notes and terms (the customer's reference is cleared), asks the book and the engine for today's prices and taxes, and says how many changed. The new document stores `copiedFrom: { type, id, number }` so the page can link back. An order or invoice can also start a copy as an earlier document (a quotation, a sales order).

- **Totals** are the sum of the lines: each line is quantity × price, less its discount, plus its tax (tax inside the price when inclusive); the header's subtotal is the lines' totals less tax plus discount.
- **Conversions** (quotation → order → invoice, proforma → order or invoice, order or quotation → proforma) keep the taxes as charged (`taxDetermination: given`, the tax rows copied) and carry the customer's reference, notes, salesperson, price list and place of supply.
- **The salesperson**'s discount limits apply (the judge is asked for them, not for whoever typed). They default to the signed-in person.
- **Terms** are pre-filled from the document settings' *Terms and conditions* when a new document names none.
- **The PDF** prints one row per tax with what it was charged on, says when prices include the tax, names exempt and zero-rated parts with their reason, and prints the customer's reference and both tax ids; the note to the customer comes before the terms. Internal notes are never printed.
- **A bug fixed on the way:** an order converted to an invoice always set the invoice inclusive (`'no'` is truthy).

## Settings (per document type)

*Prices and tax* (exclusive, inclusive, none), *Round tax*, *Changing the taxes on a line*, *Terms and conditions*: on quotations, proforma invoices, sales orders and customer invoices (`sales-tax.settings.ts`).

## Step 2 (19 October 2026)

### Purchases and input tax

Purchase orders and supplier invoices (`ap-invoice`) are determined by the same five questions with the roles turned round: in the determination, **"seller" is always our side and "buyer" the supplier**. What changes:

- **An unregistered supplier charges no tax** (outside the scope: *supplier not registered*). **Our own non-registration** means nothing can be claimed (`recoverablePct` 0): the tax is a cost.
- **Recoverable or not, per tax code.** A code carries `isRecoverable` and `recoverablePct`; a group member can override the share. The tax of a line splits into a **claimable part** (input tax, to the code's input account, else the `input_vat` role scoped by the code) and a **cost part** (`ComputedTax.recoverableAmount` / `nonRecoverableAmount`). The two always add up to the tax. `finance.tax_code.input_account_id` is new; editing a code keeps its flag and share together.
- **The cost part goes where the cost goes**: into the line's expense, or, on a stock line, into goods received not invoiced and the landed cost, so stock is valued with the tax nobody can claim.
- **Reverse charge** on a purchase gives `selfAssessed` components: owed to the authority as output tax **and** claimed as input tax in the same posting, so the net effect is nil when fully recoverable. They are excluded from the document's total (the supplier did not bill them) and shown apart (`selfAssessedTaxTotal`).
- **Rules** gained three conditions: `supplyTypes` (goods, services, digital, professional fees), `crossRegion` and `partnerCountryIn` (the supplier's country), plus `direction` (`SALES`, `PURCHASES`, `BOTH`) so a purchase never picks up a sale's rule. An item category carries a `supplyType`.
- **On the documents**: the same header fields as the sales documents (`taxTreatment`, `taxDetermination`, `placeOfSupplyCountry/Region`, `taxesDetermined`, `taxRounding`, `taxScenario`, `supplierTaxId`, `buyerTaxId`), `recoverableTaxTotal`, `selfAssessedTaxTotal`, per line `taxes` and `taxOverride`. Each tax is one row in `finance.document_tax_lines`.
- **What the purchase forms read** (`/api/v1/purchase-form`, open to anyone who may write a purchase document): `defaults` and `tax-quote`, the mirror of `sales-form`; `tax-quote` returns, per line, the claimable and the cost part and, in the totals, `recoverable` and `selfAssessed`.
- **Settings** (`purchase-order` and `ap-invoice`): *Prices and tax*, *Round tax*, *Changing the taxes on a line* (the same four policies as sales).
- Posting a supplier invoice uses the tax rows when the engine determined them (net = line total less its tax) and the old summary columns when it did not.

### Withholding tax

Withholding is tax a payer holds back and pays to the authority instead of the other party: **we deduct it from a supplier's payment**, or **a customer deducts it from a receipt**. It is decided by rules of the stage `WITHHOLDING` (conditions as above; outcome: the withholding tax codes to apply), worked out **on the part of the invoice the payment settles, before its VAT**, so a partial payment withholds in proportion.

- `POST /tax/withholding/assess { documentType: 'ap-invoice' | 'ar-invoice', documentId, settled, date? }` returns the entries (code, rate, base, amount, the rule behind it), the total and notes (why nothing is withheld, when nothing is). It writes nothing. The web payment and receipt forms offer it as **Suggest withholding**: the withheld amount is filled in and the cash applied falls by the same amount, so the invoice is cleared by the same total.
- The payment or receipt keeps what was withheld by code, rate and base in `finance.withholding_deductions` (one set per settlement, replaced when the settlement changes, reversed when it is voided or deleted). `GET /tax/withholding` lists them (`finance.tax.read`), with the state of the certificate (step 3).
- **Setting** `withholding: off | suggest | enforce` on *Supplier payments* and *Customer receipts* (default `suggest`). Off: nothing is suggested and what is typed is kept as typed (entered by hand). Suggest: the forms fill it in; what is typed is kept, and withholding entered where the rules give none (goods, an exempt supplier, a customer that is no agent) is accepted **with a warning** (`withholdingWarnings` on the create and update answer). Enforce: what a line withholds must be the assessment **to the currency's smallest unit**, under the code the rules give, unless the line carries `withholdingOverrideReason` (up to 280 characters); refused (400) otherwise, saying what the rules give. The reason is kept on the line (`ap_payment_lines` / `ar_receipt_allocations.withholding_override_reason`) and on the deduction it records (`reason: "Entered by hand: …"`, `trace.overrideReason`). Audit finding 10, 31 October 2026.
- **Codes.** `GET /tax/withholding/codes?date=` lists the organisation's withholding taxes (code, name, the rate in force, what the `WITHHOLDING` rules apply each to, switched on or off) for the payment form's picker. **While the engine is on**, a `withholdingCode` on a payment line must be one of them, switched on (case does not matter); any other is refused (400) naming the valid ones. A deduction entered by hand is recorded under the code named.
- **Engine off:** nothing is checked — a code is free text, any amount is accepted, no warning — as before; the settings' descriptions say so.
- **Nigeria** ships the rates as preset data (the Deduction of Tax at Source Regulations 2024, from 2025-01-01): 5% on professional, consultancy and management fees; 2% on construction and on other goods and services; 10% on a payment to a non-resident company; and codes for 10% on dividends, rent, interest and royalties, which a rule of the organisation's own selects. The four rules (non-resident, professional services, construction, everything else) apply to both directions, so a customer's deduction from a receipt uses them too. They are rules the organisation owns and edits.

### Credit notes and returns

A credit or debit note line may name the invoice line it reverses (`reversesDocumentType` `ar-invoice` or `ap-invoice`, `reversesDocumentId`, `reversesLineId`). The note then carries the original line's taxes **as they were charged**, in proportion to the amount given back: the same codes, rates and recoverable share, not worked out again from today's rules. The last credit takes exactly what is left of each tax (a tolerance of one currency unit as a share of the line absorbs rounding), and more than what is left is refused. The note has its own `document_tax_lines` (`reverses_line_tax_id` points at the row it reverses), `adjustment_memos.taxes_determined` is set, and the memo ledger posts per code (output tax back for a sales note, input tax back for a purchase note). `GET /tax/credit-lines?documentType&documentId` lists an invoice's lines with what is left to give back and the taxes each was charged.

### Rule editing

Before step 2 a rule could be created, switched off, given a priority and retired. Now `PATCH /tax/rules/:id` changes its name, direction, validity, conditions and outcome (`finance.tax.rules.manage`). Every change is a **revision** (`finance.tax_rule_revisions`: before, after, who, when, a note), listed oldest first by `GET /tax/rules/:id/revisions`. A rule that came from a preset is locked (switch off and priority only); **`POST /tax/rules/:id/customise`** makes an editable copy and switches the preset's own off. Editing a rule never rewrites a document already written. A rule that reads the same as another live rule is flagged (`warnings`).

### Approval for a change of taxes

The policy `any-with-approval` (a fourth value of *Changing the taxes on a line*, on all six documents) lets a person with `finance.tax.override` try any change, but **a change the rules BLOCK** (taking tax off a taxed line, claiming input tax the rules do not allow) is saved only with an approval. The approval uses the existing engine: the document type `tax-override` (numbering prefix TXO, in the segregation-of-duties list), with an approval policy the organisation defines (**with none, a request is refused**: it would otherwise approve itself).

1. `POST /tax/override-requests` with the document's date, party, the line and the change. The request keeps the warnings and goes to the approvers.
2. The decision is made in the Inbox. `GET /tax/override-requests?scope=mine|all`, `GET /:id`, `POST /:id/withdraw`; the web lists them under Tax → Changes needing approval.
3. The person saves the document with the change and `approvalRequestId`. The request must be approved, for **the same person, the same party, the same line and the same change**, and unused; saving spends it (`used`). A document that no longer matches is refused in words.

### Presets: India, the EU and the US

- **India** (`IN`): GST 2.0 from 22 September 2025: the 5%, 18% and 40% slabs, plus zero-rated and exempt. CGST + SGST (each half the rate) inside a state and IGST (the whole rate) across a state border, chosen by the `crossRegion` rule on the seller's state (the location's tax profile) against the buyer's (the customer's site state, compared as text, so write the state names alike). UTGST is shipped; cess, HSN/SAC codes, e-invoice IRNs and TDS/TCS are outside the pack. The slab of an item follows its tax category: the organisation maps its items.
- **EU**: one preset per member state (27), each with the **standard rate** (dated), a zero group, the reduced-rate **slot** (reduced rates differ in every state and change every budget, so the organisation adds its own code and group) and the imported-services reverse-charge rule. The seller's country is what a rule is for, so the organisation adopts the pack of the state it sells from. The screen shows the 27 as one card with a member list. **OSS** (the customer's state's VAT on distance sales above EUR 10,000) is **not applied**: it is documented in each pack's notes; the organisation adds the rules it needs.
- **United States** (`US`): **no rates in the pack.** US sales tax depends on the destination's state, county, city and district, so the pack selects the **`us-sandbox` provider** and the *nexus* model: the organisation registers per state (`location_tax_profiles` with a region) and tax is charged only in a state where it has nexus (`regionScopedCountries`). The sandbox provider returns the state's **base rate** from a dated table (Tax Foundation, 2026) and nothing local, and is labelled as such in the trace. A paid provider (Avalara, Vertex, Stripe Tax) is a registered adapter, never built here. There is **no input credit** in the US: purchase tax is a cost.
- Adopting a preset widens a preset's tax groups to both sales and purchases, fills the recoverable share of codes the organisation has not touched, and selects the pack's provider.
- Sources: EU rates from the vatupdate.com 2026 table, US state rates from the Tax Foundation 2026 table; **the European Commission's TEDB was not read**. Every pack carries `reviewedOn`, `confidence` and `sources`.

### Prices that hold the tax: price list, channel, forced list

- `pricing.price_books.prices_include_tax` and `sales_channel.channels.prices_include_tax` (new) are `true`, `false` or null. A price list screen and a channel screen set them; the price lists API returns `pricesIncludeTax`.
- A new sales document starts as: **what the document says, else its price list, else its channel, else the document settings** (a setting of *none* stays none). `GET /sales-form/price-treatment?documentType&priceListId&channelId&locationId` answers with the treatment and who decided it.
- **A forced price list**: with *A document may be priced from a price list chosen by hand* on (Sales pricing settings), `GET /sales-form/price-lists` lists the lists in force in the document's currency, and a document is saved with `priceListId` and `priceListForced: true`. The pricing engine prices every line from that list alone (`resolveInBook`), `POST /sales-pricing/resolve` and the discount check take `priceListId` so the form and the server agree, and discounts are judged against that list. A list not in force, or the setting off, is refused.

### Migration

`1788200000000-tax-purchases-withholding`, expand only, org-first keys, RLS on the new tables: `finance.withholding_deductions`, `finance.tax_override_requests`, `finance.tax_rule_revisions`; purchase header columns on `procurement.purchase_orders` and `ap_invoices`; `finance.tax_code.input_account_id`; `sales_channel.channels.prices_include_tax`; `adjustment_memo_lines.reverses_*` and `adjustment_memos.taxes_determined`; `price_list_forced` on the four sales documents; an index on `document_tax_lines.reverses_line_tax_id`. Proved on a scratch database and applied to `commerce_dev`.

### Permissions and numbering

No new permission: `finance.tax.override` asks for approval, `finance.tax.rules.manage` edits rules, `finance.tax.read` reads withholding and credit lines. The document type `tax-override` has numbering prefix `TXO` and no document settings of its own (`WITHOUT_SETTINGS`).

### Tests

`tax-purchases.logic.spec.ts`, `withholding.logic.spec.ts` (+ service), `credit-tax.logic.spec.ts`, `us-sandbox.logic.spec.ts`, `tax-override-requests.service.spec.ts`, `tax-rules.service.spec.ts`, `purchase-tax.service.spec.ts`, `tax-rate-periods.logic.spec.ts`, `sales-tax.service.spec.ts` (extended); `test/tax-engine-2.e2e-spec.ts`; `tax:drill` steps for purchases, withholding, credit notes, rule history, approval and the flags. The e2e spec and the drill extension are **written and run by CI**, not by the author.

## Limits and what is next

- **Step 3:** the tax return by box, exempt and zero-rated schedules, **withholding certificates**, the filing calendar, the storefront and POS reading the same determination.
- Not built: OSS for EU distance sales; local (county, city, district) US rates, which need a paid provider; tax groups priced per date range of the *rate* beyond the dated rates; cash-basis tax points; place-of-supply rules for services and digital supplies beyond what a rule can express; a cache of the snapshot (the performance pass is deferred).
- Editing a saved purchase order or supplier invoice re-determines its taxes: a change made by hand on a line must be made again (the form does not yet restore an override from the saved document).
- Credit lines are listed for invoices still open (the memo form's invoice list); crediting a fully paid invoice is by choosing it by number in a later pass.
