# Fundraising (the fundraising pack)

Donors, gifts, campaigns, grants and tax receipts for charities and foundations (boards `erp4f-fund-*`;
RECOMMENDATIONS-F §10; package `design-handoff/feature-inventory/fundraising.md`). Built 25 October 2026 on
`feature/industry-packs-rest-api-2`.

## The pack

`fundraising`, version 1, kind `charity`. Features `fundraising.donors`, `.campaigns`, `.grants`, `.receipts`. Words:
Customer → Donor. Menu "Fundraising": Overview, Donors, Gifts, Campaigns, Grants, Tax receipts. Five Home cards
(declared). The installer writes nothing.

## Data (schema `fundraising`, migration `1790700000000`)

| Table | What it holds |
|---|---|
| `donors` | The donor role on a CRM customer (one each): kind, place, contact, how they like to be asked (channel, how often), what they give to, how they want receipts (per gift, yearly, none); what they have given (recounted from their gifts), promised, first and last gift, monthly. Read model `donor`. |
| `campaigns` | Number `CMP-…`, goal, dates, live or ended, restricted (default), the giving page (address, amounts, monthly); raised, promised, spent, gifts, donors (recounted). Read model `fundraising-campaign` (with its budget). |
| `grants` | Number `GRT-…`, the funder, programme, requested and awarded, stage (idea → applied → needs info → awarded → reporting → closed, or declined), the next step and its date, the period, the condition; received and spent. Read model `grant` (with budget, payments, reports). |
| `budget_lines` | A campaign's or grant's lines: what restricted money may be spent on, and what has been. |
| `gifts` | Money received: donor, fund (campaign, grant or purpose), amount, day, method and channel, the Finance receipt it came by (once), the pledge it pays, anonymous, monthly; the receipt state (to issue, issued, yearly, not wanted); thanked; refunded with the reason. Read model `gift`. |
| `pledges` | A promise with a date: paid so far, open, part, paid, cancelled; reminders sent. |
| `grant_payments`, `grant_reports` | Tranches expected and received; reports promised (due, submitted with the Drive file, accepted). |
| `spends` | Restricted money spent against a line (voided by a flag, never removed). |
| `tax_receipts` | Number `RCP-…`, the donor, one gift or a year's, the amount, the words as issued; issued, sent, bounced, voided with the reason, the one it replaces. Read model `tax-receipt`. |

## Rules (`logic/fundraising.logic.ts`)

- **Groups** (overlapping, for today): major from `majorDonorOver` given in all, monthly (a recurring gift in the last
  two months), new (first gift this year), lapsed (no gift for `lapsedAfterMonths`, monthly givers excepted), else
  regular.
- **A gift's receipt**: anonymous or "none" → not wanted; a yearly donor, a monthly gift or one under
  `receiptsYearlyUnder` → the yearly receipt; else its own.
- **Restricted spend** is refused off the fund's lines, over a line's remainder, and over what came in and is not spent.
- **Tax receipts**: one per gift (`issue`, the waiting ones at the person's places, at most 500) or the year-end batch
  (one per donor for the year's yearly gifts); the words from `receiptWording` with `{amount}`, `{donor}`, `{date}`,
  `{fund}`, `{method}`, `{registration}`, `{year}`; voiding puts the gifts back to waiting, `replace` issues anew. A gift
  under a receipt is not refunded until the receipt is voided.
- **Pledges**: paid by gifts naming them (part, then paid); reminders at most `pledgeRemindersMax`,
  `pledgeReminderGapDays` apart.
- **Suggested ask**: the most given in a year (this or last), rounded up, at the next campaign for their interests,
  else a year after the last gift; in a sentence.
- **Campaign projection**: the pace of the last 28 days carried to the end date (dashed: `projection: true`).

## Settings (`DocumentType.DONATION_RECEIPT`; campaigns and grants are held to them)

`majorDonorOver` (1,000,000), `lapsedAfterMonths` (12), `thankYouOver` (100,000), `thankYouWithinDays` (3),
`receiptsYearlyUnder` (0), `receiptWording`, `registrationNumber`, `signatory`, `pledgeRemindersMax` (3),
`pledgeReminderGapDays` (7).

## API (`/api/v1/fundraising`)

| Route | Permission |
|---|---|
| `GET overview` · `GET donors` (keyset, read store; `group`, tabs) · `GET donors/:id` · `GET donors/:id/card` · `GET gifts` · `GET gifts/:id` · `GET gifts/:id/receipt-preview` · `GET campaigns` · `GET campaigns/:id` · `…/progress` · `…/spend` · `GET tax-receipts` · `GET tax-receipts/:id` | `fundraising.read` |
| `POST donors` · `PATCH donors/:id` | `fundraising.donors.manage` |
| `GET lookups/receipts` (the gift form's Finance receipt picker) · `POST gifts` · `POST gifts/:id/refund` · `…/thank` · `POST pledges` · `POST pledges/:id/remind` · `…/cancel` | `fundraising.gifts.record` |
| `POST campaigns` · `PATCH campaigns/:id` · `POST campaigns/:id/status` · `POST campaigns/:id/budget-lines` | `fundraising.campaigns.manage` |
| `GET grants` · `GET grants/:id` · `GET grants/:id/spend` | `fundraising.grants.read` |
| `POST grants` · `PATCH grants/:id` · `POST grants/:id/stage` · `…/payments` · `POST grant-payments/:id/received` · `POST grants/:id/reports` · `POST grant-reports/:id/submit` · `…/accept` · `POST grants/:id/budget-lines` | `fundraising.grants.manage` |
| `PATCH budget-lines/:lineId` | either manager, for its own kind of fund |
| `POST spends` · `POST spends/:id/void` | `fundraising.funds.spend` |
| `POST tax-receipts/issue` · `…/yearly` · `POST tax-receipts/:id/void` · `…/sent` · `…/bounced` | `fundraising.receipts.issue` |

**The Finance receipt a gift came by** (25 October): `GET lookups/receipts` (`fundraising.gifts.record`, so whoever
records gifts needs no Finance or sales rights) is the picker for `arReceiptId`: Finance's receipts of the places the
person reaches (all of them for someone not tied to places), newest first, a keyset page `{ items, nextCursor }` on
`IDX_ar_receipts_keyset_created` (`limit` ≤ 100, default 25; `cursor`). `q` matches the start of the number or the
reference, or the customer's name; `donorId` keeps to that donor's customer; `free` (default `true`) leaves out
receipts a gift has already (`free=false` lists them too). Voided and deleted receipts never show. Each item: `id`,
`number`, `status`, `on`, `customerId`, `customerName`, `locationId`, `currency`, `amount`, `method`, `reference`,
`giftId` (null when free). `POST gifts` now checks the `arReceiptId` it is given: 404 when it is not this organisation's
(or is deleted), 409 when it is voided, refused outside the person's places; the unique index still keeps it to one
gift (409).

Seed `1790700000101`. Events `Donor`, `Gift`, `Pledge`, `FundraisingCampaign`, `Grant`, `TaxReceipt` (created,
updated), topic `commerce.fundraising.v1`. Read models as above (location-scoped, keyset indexes in the migration).

## Tests

Unit (run): `logic/fundraising.logic.spec.ts`, `services/receipt-lookup.service.spec.ts`, `fundraising-permissions.spec.ts`, `fundraising.settings.spec.ts`.
Written, not run: `test/fundraising.e2e-spec.ts`, the tenancy-sweep fixtures and the read-store leg.

## Not yet

Posting gifts to the ledger with the fund as a Finance dimension and checking payables against budget lines in Finance
(the restriction is enforced on the pack's spends), emailing receipts (recorded as sent or bounced), the giving page on
the store service with the payment orchestrator, soft credits, tributes, volunteers, the donor's own page.

## History

- 25 October 2026: built.
- 25 October 2026: the Finance receipt picker (`GET lookups/receipts`) and a gift's `arReceiptId` checked.
