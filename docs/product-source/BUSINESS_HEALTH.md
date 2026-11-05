# Business health — "How the business is doing"

> Status: **built 16 October 2026; reworked the same day onto the KPI registry** (API and web). Asked by the user on 16
> October: the dashboard must show six numbers, each with one plain sentence,
> so an owner knows whether the business is healthy. Related:
> [DASHBOARD.md](DASHBOARD.md) (the page it sits on),
> [PROJECTIONS.md](PROJECTIONS.md), [LIVE_UPDATES.md](LIVE_UPDATES.md),
> [DOCUMENT_SETTINGS.md](DOCUMENT_SETTINGS.md),
> [PLATFORM_ARCHITECTURE.md](PLATFORM_ARCHITECTURE.md) §4, §5, §7.
> Part B of the [business-intelligence and financial-health PRD](business-intelligence-financial-health-prd.md#part-b--how-it-is-built-mapped-onto-what-exists-and-the-platform-standard)
> is the design this follows: registered KPIs over **metric facts** kept by the projector.
> Code: `src/modules/finance/health` (the KPIs and their arithmetic),
> `src/common/modules/projections/metric-facts` (the projection),
> `commerce-web/src/app/features/bi` (the cards).
>
> **16 October, later: this document is the six cards.** The six are only the
> default set of a dashboard that can show any registered KPI, kept as metric
> facts at day, month and running-total grains with dimensions, and widened to
> the whole business-intelligence PRD: see
> [BUSINESS_INTELLIGENCE.md](BUSINESS_INTELLIGENCE.md). The `business-health`
> projection and its `projection.health_*` tables this document first described
> were replaced by the `metric-facts` projection (the old tables stay, unwritten);
> the section below says how things are kept now.

## The six numbers

Shown on `/dashboard` above the widgets, in a 3-column grid under a **Period**
picker (This month / Last 3 months — the default — / This year). Each card:
a small label, the number in monospace, a status pill (words and a mark, never
colour alone), one plain sentence with the figures behind it, and **How this
is worked out**, which opens a drawer listing the inputs and the ledger
accounts behind them with links.

| # | Number | Worked out as | Status |
|---|---|---|---|
| 1 | **Gross margin** | (sales revenue − direct cost of delivering it) ÷ sales revenue. ₦500,000 charged, ₦200,000 to deliver: 60%. | Above / Below your floor (setting, 30%); *Costing more than you charge* below zero |
| 2 | **Net margin** | (revenue + other income − every cost: direct cost, salaries, marketing and selling, rent, fuel, data, tax, depreciation…) ÷ sales revenue | *Profitable*; *Below your floor* (10%); *Making a loss* |
| 3 | **Customer acquisition cost** | (what the chosen accounts cost + a share of salaries, setting) ÷ customers whose **first sold invoice** fell in the period | *Costs more than a customer brings* (CAC above the lifetime value), *Slow to pay back* (over 12 months), *Less than a customer brings* |
| 4 | **Customer lifetime value** | gross profit a customer brings over the whole time they stay (below), with **LTV ÷ CAC** and the **payback months** in the sentence | *14.5× what they cost* (3× or more good, 1–3× a look, under 1× bad); before any CAC, *From what customers spent so far* / *Projected over N months* |
| 5 | **Burn rate and runway** | gross burn = money out each month, net burn = out − in, averaged over the last three months (this month counts as far as it has gone; a younger business averages over its months). **Runway = cash and bank balances ÷ net burn, in days** (30 days a month). ₦1.2m a month out, ₦3.6m held: 90 days. | *Over 90 days* (setting), *Under 90 days*, *Cash is growing* (net burn zero or less: no infinite runway) |
| 6 | **Cash conversion cycle** | days stock sits (DIO) + days customers take to pay (DSO) − days taken to pay suppliers (DPO), from each balance averaged over the period against the period's sales (DSO) or cost of sales (DIO, DPO; other costs when no stock is sold). No stock: DIO 0. | *Longer by N days* / *Shorter by N days* than the same number of months just before |

**They are KPIs.** Nothing here is a separate endpoint: each number is one or
more registered KPIs ([ANALYTICS.md](ANALYTICS.md#a-kpi)), read under its own
permission through `GET /api/v1/analytics/kpis/:key`.

| Card | KPIs |
|---|---|
| Gross margin | existing `finance.gross_margin` (+ `finance.revenue`, `finance.cost_of_sales`) |
| Net margin | existing `finance.net_margin` (+ `finance.revenue`, `finance.net_profit`) |
| Customer acquisition cost | `crm.cac`, `crm.new_customers` |
| Customer lifetime value | `crm.ltv_historical`, `crm.ltv_predicted`, `crm.ltv_cac`, `crm.cac_payback_months` |
| Burn rate and runway | `finance.gross_burn`, `finance.net_burn`, `finance.unrestricted_cash`, `finance.runway_days` |
| Cash conversion cycle | `finance.ccc` = `finance.dio` + existing `ar.days_to_be_paid` (DSO) − existing `ap.payment_days` (DPO) |

The existing margin KPIs stay the one definition of gross and net margin (the
registry refuses two KPIs of one name); they gained a **target**: the
organisation's floor, which `GET /analytics/kpis/:key` now returns as
`target: { kind: 'floor', value }` (a new optional `KpiDefinition.target`).
`finance.runway_days` carries the runway alert the same way. Burn, runway and
the lifetime values stand as they are *now* (`asOfNow`); the others follow the
period. A KPI is `null` (unavailable, never zero) while the books are not open,
the facts are not built, or there is nothing to measure.

**Lifetime value.** A young business — under 12 months of ledger history, or
fewer than 5 customers who have gone — has no lifetimes to measure, so LTV is
**what customers have actually spent so far**: revenue per customer × the
gross margin of the last twelve months, labelled as such. An established one
projects: revenue a customer brings in a month × how long customers who left
stayed (never more than the horizon, 36 months) × the gross margin. A customer
has *gone* after 6 months without buying (setting). Revenue here is invoice
revenue without tax; credit notes are not netted against it.

**Edge cases.** No revenue: *No sales yet in this period*. No new customers:
*No new customers this period*. No money moved: *No money has moved yet*.
Cash growing: the word *Growing*, never an infinite runway. Stock held and
none sold: the cash cycle says so and shows no number. The books not open, or
the figures being built for the first time: one calm sentence instead of cards.

## How it is kept — incremental, never recomputed on a page open

```
journal entry posted / voided / changed ──┐
invoice posted / changed / deleted ───────┤  outbox → Kafka
                                          ▼
              MetricFactsProjection (projection "metric-facts"), handlers: ledger, customers
                 reads the document → compares with what it counted last time → adds the difference
                                          ▼
   projection.metric_facts         fact, grain (day / month / running total), period, dimension, second key → amount, n
   projection.metric_fact_sources  what each handler counted a document as (for exact undo; redelivery adds nothing)
   projection.metric_fact_state    per handler: version, built, rebuilding, last moved
                                          ▼  METRIC_FACTS_CHANGED
   KPIs read the facts through MetricFactReadPort (O(accounts that moved)), Redis-cached by the analytics service
                                          ▼  live summary analytics.facts.<module> {changedAt}, coalesced
   the dashboard reads the KPIs again — no timer, no refresh button
```

- **Cost per event is O(what it names)**: a journal entry's lines, or one
  customer's invoices. Never the ledger, never the history.
- **Safe under redelivery, out-of-order and voids**: each handler stores what it
  counted a source as and applies only the difference.
- **Cash in and out** are each entry's net effect on the accounts that hold
  money (bank, cash, wallet, mobile money); movements between the business's
  own accounts and anything touching equity are left out. Loans count as cash in.
- **Rebuild.** `npm run projections:rebuild -- metric-facts [orgId…]` clears an
  organisation's facts and rebuilds them from the ledger and the invoices in
  pages. While it runs (and before the first build) every value is *provisional*
  or *unavailable*, never a short number shown as final; the first read of an
  organisation whose facts were never built starts the build in the background.
- **Classes.** Accounts are read through their *posting roles*: revenue = income
  accounts; direct cost = `cost_of_sales`, stock adjustments and variances;
  salaries; depreciation; acquisition = the accounts the setting names (else
  expense accounts called marketing, advertising…); receivables, payables, stock;
  cash = bank accounts other than card and clearing, plus the `cash` role.

## Settings (Admin → Document settings → Business health)

One zod schema, `definitions/business-health.settings.ts`, for the whole
organisation; enforced by `BusinessHealthService`. Saving raises
`document-settings.saved`, which makes the summary recompute.

| Setting | Default | Does |
|---|---|---|
| Gross margin floor | 30% | the pill on card 1 |
| Net margin floor | 10% | the pill on card 2 |
| Runway alert | 90 days | the pill on card 5 |
| Acquisition accounts | none (named-for-marketing accounts) | which expense accounts are the cost of winning customers; a new `expense-accounts` picker validates they are this organisation's expense accounts |
| Share of salaries counted as selling time | 0% | added to CAC |
| LTV horizon | 36 months | the longest a customer is counted as staying |
| A customer has gone after | 6 months | when a customer without a purchase counts as gone |
| Variable cost accounts | cost of sales | accounts whose cost moves with sales (contribution margin, break-even, what-if) |
| Fixed cost accounts | operating expenses | accounts whose cost does not (an `asset-accounts` / `expense-accounts` picker validates they are this organisation's) |
| Capital spending accounts | property, plant, equipment, intangibles | asset accounts whose additions are capex (free cash flow) |

## API

No endpoint of its own for the six; everything else is in [BUSINESS_INTELLIGENCE.md](BUSINESS_INTELLIGENCE.md#api). The KPIs above are read through the existing
`GET /api/v1/analytics/kpis/:key?preset=&from=&to=&compare=` and listed (with
their formulas) by `GET /api/v1/analytics/kpis`.

| Piece | Permission | |
|---|---|---|
| finance KPIs | `finance.dashboard.view` | an organisation's ledger, never one shop's (the finance KPIs are not kept by location) |
| CRM KPIs (`crm.*` above) | `crm.dashboard.view` | |
| `/live` `analytics.facts.finance` (and `.crm`) | `finance.dashboard.view` / `crm.dashboard.view` | `{ changedAt }`: the facts moved, read the KPIs again |

The page asks for each KPI; a card whose KPI a person may not read is left out,
and a person who may read none has no section at all — not a heading, not a card.
The role templates *Finance manager (payments)* and *Finance manager
(manufacturing)* now carry `finance.dashboard.view` and `crm.dashboard.view`;
owners, administrators, managers and viewers already hold every module's
dashboard permission. (The templates are starting points copied into an
organisation's own roles, so there is nothing to sync for existing ones.)

## Limits and decisions

- **Seen live on 16 October and fixed** (branch `fix/business-health-live`):
  *Days to be paid* and *days to pay* counted a receipt or payment dated before
  its invoice or bill as a negative wait (a card showed customers taking −13
  days); a deposit or advance waited no time, so each pair now counts as at
  least 0 (KPI version 2). Values cached without a `target` made the screen
  read "above your 0%": the margin and health KPIs are version 2 so they are
  worked out again, and the page falls back to the setting defaults (30%, 10%,
  90 days) rather than 0. The projection counted card and clearing accounts as
  cash in and out while the balances left them out, so burn and cash disagreed:
  projection version 2 counts them alike (the new consumer group replays the
  log and corrects each entry; `projections:rebuild -- metric-facts` does it
  at once). The net margin card now names what delivering the sale cost and
  what running the business cost — a net margin equal to the gross one means
  nothing was spent on running the business in the period. The first-read build
  takes a Redis key, so one build runs per organisation across processes; the
  rebuild is serialised against events by the runner's advisory lock and lands
  on the same facts however often it runs, three at once included (the drill
  proves it).
- **Facts follow events.** An entry removed by a raw delete (a test cleanup, a
  repair script) raises no event, so its contribution stays until the next
  rebuild: `npm run projections:rebuild -- metric-facts <orgId>` repairs it.

- **Invoice revenue for customers, ledger revenue for margins.** Margins come
  from the ledger (so they agree with the books); customer counts and
  lifetime from posted invoices (the ledger has no customer). Walk-in sales
  with no customer invoice are in margins, not in customers.
- **Campaigns carry no spend.** `communication.campaigns` has no cost column,
  so acquisition spend is what is posted to expense accounts plus what is
  recorded by channel by hand (`POST /analytics/bi/customers/acquisition-spend`,
  which never touches the ledger).
- **Ledger facts are daily** (and monthly, and running totals), with department,
  project and cost-centre dimensions; **customer facts are monthly and by
  channel** (a window that starts mid-month counts that whole month's new
  customers and spend). Restricted cash is what is set aside on bank and cash
  accounts in the base currency (`restricted_amount`).
- **Cash of the base currency only:** lines are summed in base currency
  (`debit_base`/`credit_base`), as the treasury balances are.
- **Dates are the posting date's calendar month** and "today" is UTC.
- **Loans count as cash in**; repaying them as cash out.
- **Salaries are one class.** The ledger has no department split, so the
  *share of salaries* is a percentage of all salaries, not of the sales team's.

## Tests

| Kind | Where | Run |
|---|---|---|
| Unit — the calculations with the user's examples (500k/200k → 60%; CAC 150k vs 80k; LTV 2m ÷ CAC 200k → 10×; ₦1.2m burn on ₦3.6m → 90 days), windows, balances, the lifetime split | `finance/health/health.logic.spec.ts` | `npx jest --maxWorkers=1 src/modules/finance/health` |
| Unit — account classes | `health.classes.spec.ts` | same |
| Unit — the facts projection (incremental, idempotent, void, stale event, rebuild, customers by channel; 43 tests) | `common/modules/projections/metric-facts/metric-facts.projection.spec.ts` | `npx jest --maxWorkers=1 src/common/modules/projections` |
| Unit — settings schema | `document-settings/definitions/business-health.settings.spec.ts` | `npx jest src/modules/document-settings` |
| Web unit — the cards from KPI values (pills, sentences, empty states, growing cash, young business, left out for a person who may not read), the store, the formats | `features/bi/**/*.spec.ts` | `npx ng test --include 'src/app/features/bi/**/*.spec.ts'` |
| Endpoint — refused without the dashboard permissions, the figures from the facts, targets, unavailable before the build | `test/business-health.e2e-spec.ts` | `QUEUE_PREFIX=health npx jest --config ./test/jest-e2e.json --forceExit business-health` |
| Drill — rebuild equals the ledger to the cent (every account, every month), invoices, replaying every event twice changes nothing, cost per event, the KPIs, a cached KPI read | `finance/health/business-health-drill.ts` | `npm run health:drill` |

Needs migrations `1782500000000-business-health` and `1783000000000-metric-facts` applied. The endpoint spec was written for the first version and is part of the deferred test lane ([BUSINESS_INTELLIGENCE.md](BUSINESS_INTELLIGENCE.md#tests)).

## History

- 16 October 2026 — built: migration `1782500000000`, the projection, the
  settings, the dashboard section. First as a module of its own with its own
  endpoint; the same day reworked onto the KPI registry (PRD Part B): the
  endpoint, its use cases and the card text on the server are gone, the
  numbers are KPIs, the cards are drawn by the page from KPI values.
- 16 October 2026, later — the facts layer replaced the `business-health`
  projection (migration `1783000000000-metric-facts`): day / month / total
  grains, dimensions, status per value (actual, provisional, forecast,
  unavailable), customers by channel. The six cards became the default set of
  the home dashboard's KPI cards ([BUSINESS_INTELLIGENCE.md](BUSINESS_INTELLIGENCE.md)).
  The drill is still `npm run health:drill`; the unit specs of the arithmetic
  stay in `finance/health`, the projection's in `projections/metric-facts`.
