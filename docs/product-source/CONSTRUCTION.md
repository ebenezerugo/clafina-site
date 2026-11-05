# Construction (the construction pack)

Progress billing by stage with retention and variations, the site diary, the snag list and subcontractors' papers and
payment certificates, built on Projects (boards `erp4f-con-*`; RECOMMENDATIONS-F §12; package
`design-handoff/feature-inventory/construction.md`). Built 25 October 2026 on `feature/industry-packs-final-3`.

## The pack

`construction`, version 1, kind `site` (Construction site). Features `construction.billing`, `.diary`, `.snags`,
`.subcontracts`. Menu "Construction": Progress billing, Site diary, Snag list, Subcontractors. Four Home cards
(declared). The installer writes nothing.

## Data (schema `construction`, migration `1790800000000`)

| Table | What it holds |
|---|---|
| `contracts` | The construction terms of one Projects project (one contract a project): client, contract sum, retention percent, VAT and WHT rates, the defects period, the programme's percent, completion and the defects end; retention held and released and the net certified to date (kept from the valuations); counters for its own numbers. |
| `stages` | The contract sum in stages, each with the percent the client has certified and, if it is one, the project milestone. |
| `variations` | `VO-0001`… on a stage: proposed, priced, agreed, instructed or rejected; valued with its stage when its state is billable (a setting). |
| `valuations`, `valuation_lines` | `VAL-…`, valuation 1, 2… of a contract to a day: measuring → valuing → approval → approved → certified (one open at a time); each line's percent before and to date, the engineer's and surveyor's percents, values; the totals as worked out; the invoice once certified. Read model `construction-valuation` (with lines). |
| `retention_movements` | Append-only: held on a valuation, released at completion and after the defects period (with the invoice). |
| `site_diary_entries` | A day on site: weather, people (own and subcontract), hours lost and why, equipment, safety and incidents, work done, delays, instructions, photos (Drive file ids); draft → submitted → signed off (locked) or returned. |
| `snags` | `S-0001`… by floor, unit, place, trade and subcontractor; open → fixed → closed (or reopened); photos before and after. Read model `construction-snag`. |
| `subcontracts`, `subcontract_papers` | `SC-0001`… a supplier on the contract with its sum, retention and tax rates, certified to date, retention held, paid before; papers by kind with an expiry (append-only: a renewal is a new paper). |
| `payment_certificates`, `paper_exceptions` | A subcontractor's certificate: work to date, back-charges, the totals, draft, blocked (and why) or approved, the supplier bill; an exception log (append-only) of who let an expired paper through and why. |

## Rules (`logic/construction.logic.ts`)

- **A line**: worth to date = sum × percent to date; this valuation's value = sum × (to date − before). A percent never
  goes below what the client certified, nor above 100.
- **A valuation**: worth to date − retention (the contract's percent) = net to date; − certified before = this
  valuation before tax; VAT and WHT on it (none on a valuation that gives money back); the client pays net + VAT − WHT.
  VAT and WHT appear on the certificate, never in the stage maths.
- **Steps**: start and measure (`construction.valuations.measure`), value or send back (`.value`), approve (`.approve`),
  certify (`.certify`). A line's percent is set by whoever holds the step it is at.
- **Certifying**: the stages and variations take their percents, retention held moves by the difference, the contract's
  net certified moves, and the customer invoice is made through `PackInvoicer` for the net with the contract's VAT (WHT
  in the line's words). Nothing is invoiced before.
- **Retention**: released at practical completion (`completionReleasePercent` of what is held) and the rest at the end
  of the defects period (completion + `defectsMonths`), each part invoiced to the client.
- **Variations**: proposed → priced → agreed → instructed (or rejected); amounts fixed once part is certified.
- **Papers**: the newest paper of each required kind counts; missing or expired blocks a payment certificate (checked
  again at approval); ending within `paperWarningDays` is shown. An exception (`construction.subcontracts.exception`)
  lets one certificate through and is logged with the problems.
- **A payment certificate**: the same sums with the subcontract's rates, less back-charges before tax (kept, never paid
  back); approving it moves certified to date, retention and paid before, and makes a draft supplier bill on Payables
  (`PackBiller`, when `subcontractBills`).
- **Site diary**: one entry a day per contract, never for a day to come; changes until submitted; locked once signed
  off; returned with a note. Hours lost are summed for the month.

## Settings (`DocumentType.VALUATION`)

`retentionPercent` (5), `completionReleasePercent` (50), `defectsMonths` (12), `vatRate` (0.075), `whtRate` (0.05),
`billableVariations` (agreed, instructed), `valuationInvoices` (submit), `valuationDueInDays` (30),
`valuationServiceItemId`, `requiredPapers` (tax clearance, insurance, safety card), `paperWarningDays` (14),
`subcontractBills` (true).

## API (`/api/v1/construction`)

| Route | Permission |
|---|---|
| `GET contracts` (keyset) · `GET contracts/:id` | `construction.contracts.read` |
| `POST contracts` · `PATCH contracts/:id` · `POST contracts/:id/stages` · `PATCH stages/:id` · `POST contracts/:id/variations` · `PATCH variations/:id` · `POST contracts/:id/complete` · `…/close-defects` | `construction.contracts.manage` (making a project also needs `projects.projects.create`) |
| `GET valuations` (keyset, read store; `contractId`) · `GET valuations/:id` | `construction.valuations.read` |
| `POST valuations` · `POST valuations/:id/measure` | `construction.valuations.measure` |
| `PUT valuations/:id/lines/:lineId` | measure, value or approve (the valuation's step decides) |
| `POST valuations/:id/value` · `…/return` | `construction.valuations.value` |
| `POST valuations/:id/approve` | `construction.valuations.approve` |
| `POST valuations/:id/certify` | `construction.valuations.certify` |
| `GET site-diary?contractId&date|month` | `construction.diary.read` |
| `POST site-diary` · `PATCH site-diary/:id` · `…/submit` | `construction.diary.manage` |
| `POST site-diary/:id/review` | `construction.diary.sign` |
| `GET snags` (keyset, read store; `contractId`, `unit`, `trade`, `subcontractId`, `status`) · `GET snags/plan?contractId` · `GET snags/:id` | `construction.snags.read` |
| `POST snags` · `PATCH snags/:id` · `…/fix` · `…/close` · `…/reopen` | `construction.snags.manage` |
| `GET subcontracts?contractId` · `GET subcontracts/:id` · `GET subcontracts/:id/papers` | `construction.subcontracts.read` |
| `POST subcontracts` · `PATCH subcontracts/:id` · `POST subcontracts/:id/papers` | `construction.subcontracts.manage` |
| `POST subcontracts/:id/certificates` · `POST certificates/:id/approve` | `construction.subcontracts.certify` |
| `POST certificates/:id/exception` | `construction.subcontracts.exception` |

Seed `1790800000101`. Events `ConstructionContract`, `ConstructionValuation`, `SiteDiaryEntry`, `ConstructionSnag`,
`Subcontract` (created, updated), topic `commerce.construction.v1`. Read models `construction-valuation` and
`construction-snag` (location-scoped, keyset indexes). Drive references: `construction_snag`, `site_diary_entry`,
`subcontract`.

## Tests

Unit (run): `logic/construction.logic.spec.ts`, `construction-permissions.spec.ts`, `construction.settings.spec.ts`.
Written, not run: `test/construction.e2e-spec.ts`, the tenancy-sweep fixtures and the read-store lists.

## Not yet

Retention and the released parts posted to a liability account in the ledger (the invoice carries the net); VAT and WHT
rates from the tax engine (the contract's rates, defaulted from settings); hours lost feeding a programme (no Gantt yet);
the subcontractor's own view of their snags (the portal); the client's certification screen; drawings and RFIs, the
final account, a handover pack.

## History

- 25 October 2026: built.
