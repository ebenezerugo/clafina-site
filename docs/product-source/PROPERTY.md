# Property (the property pack)

Properties, units and owners; leases with rent, deposits and renewal; the rent roll and landlords' statements;
inspections and deposits; tenants' requests; owners' association levies (boards `erp4f-prop-*`; RECOMMENDATIONS-F §13;
package `design-handoff/feature-inventory/property.md`). Built 25 October 2026 on `feature/industry-packs-final-3`.

## The pack

`property`, version 1, kind `property`. Features `property.units`, `.leases`, `.rent`, `.inspections`, `.requests`,
`.levies`. Menu "Property": Properties and units, Leases, Rent roll, Inspections, Tenant requests, Owners' levies. Four
Home cards (declared). The installer writes nothing.

## Data (schema `property`, migration `1790850000000`)

| Table | What it holds |
|---|---|
| `properties` | A building or estate at a place. |
| `owners` | A customer who owns units (statements, levies), perhaps with a supplier account (paid out), their own fee and repair limit. |
| `units` | Under a property: code, kind, bedrooms, floor, size, share (levies), asking rent and cadence, owner; vacant, let, under notice, off the market (and since when). Read model `property-unit` (with the lease in force). |
| `leases` | `LSE-…`: unit, tenant (a customer), term, rent a month, quarter or year, the caution deposit and what is held, the agency fee and its invoice, notice; draft → active → notice → ended (or terminated early); the renewal (none, reminded, offered with a rise and a day to answer, accepted into the next lease, declined); what is owed, since when and paid to (kept from the schedule). One lease in force a unit (a database constraint). Read model `property-lease` (with the next due). |
| `lease_terms` | Each term, append-only (start, renewal). |
| `rent_schedule`, `rent_receipts` | Each period's due (a short last period by its days), its invoice and what is paid; receipts, append-only, carrying the unit's owner. |
| `owner_statements` | A landlord's month issued: collected, fee, repairs, payout, the lines and the payout bill (append-only). |
| `inspections`, `inspection_items`, `inspection_deductions` | Move-in, routine and move-out against the last finished inspection of the unit; rooms and items with their condition then and now and photos; deductions with a reason and a photo (append-only); the tenant's answer; the deposit settled. |
| `tenant_requests` | `REQ-…`: a fault or question on a unit or a common area, its channel and priority; new → assigned (or waiting for the owner) → in progress → done (or cancelled); the contractor, the cost and who pays; the owner's decision; the tenant's invoice or the budget line. |
| `levy_budgets`, `levy_budget_lines`, `levy_spend`, `levies`, `levy_charges` | The owners' budget for a year by lines and its rule (equal, by size, by share), approved; spending (append-only); each levy raised and each owner's charge with its invoice and what is paid. |

## Rules (`logic/property.logic.ts`)

- **Rent** is a schedule: a due each period from the start, due on its first day; a short last period is charged by its
  days. Signing writes it; notice or an early end waives the dues after the new end.
- **Lateness**: a due unpaid after its day is late by days, in the board's buckets (up to 14, 15–30, 31–60, over 60).
- **A landlord's statement**: rent received for their units in the month, less the fee (theirs or
  `managementFeePercent`), less repairs charged to them and done that month = the payout, billed to their supplier
  account (`PackBiller`) when issued.
- **Renewal**: reminded, offered (`rent × (100 + percent) / 100`, answer within `renewalAnswerDays`), accepted into a new
  draft lease that follows on (no agency fee again, the deposit carried over), signed when it starts (the lease it
  renews ends on its own day); declined.
- **Inspections**: each room and item against the last finished inspection (worse is flagged); deductions only at a
  move-out, each with a reason and a photo; the tenant is sent the report and may answer within `tenantReplyDays`; the
  deposit is settled after the answer or the days, the rest refunded (never below nothing).
- **Requests**: over the owner's limit (theirs or `ownerApprovalLimit`) a repair the landlord or the owners' fund pays
  waits for the owner's yes; done, the tenant is invoiced, the landlord's statement takes it off, or the owners' budget
  line pays it.
- **Levies**: shared by the rule (the remainder on the last owner so they add up); raised only on an approved budget, a
  period once; spending never past a line, never past what the levy has collected.
- **The daily sweep** (`property` queue, 05:17): rent due within `rentInvoiceDaysAhead` invoiced, leases past their end
  with no renewal ended (the unit vacant); each organisation in its own transaction, found by the one cross-tenant read
  (`EstateRepository.organisationsWithLeases`, ids only).

## Settings (`DocumentType.LEASE`; `TENANT_REQUEST` held to it)

`depositPeriods` (1), `agencyFeePercent` (10), `managementFeePercent` (10), `noticeMonths` (3), `renewalNoticeDays`
(90), `renewalAnswerDays` (15), `rentInvoices` (submit), `rentInvoiceDaysAhead` (14; 0 by hand only), `rentDueInDays`
(0), `rentServiceItemId`, `ownerApprovalLimit` (200,000), `tenantReplyDays` (7), `levyInvoices` (submit),
`levyDueInDays` (30), `levyServiceItemId`, `tenantPortal` (off), `landlordPortal` (off).

## API (`/api/v1/property`)

| Route | Permission |
|---|---|
| `GET overview` · `GET properties` · `GET units` (keyset, read store; `propertyId`, `ownerId`, `status`) · `GET units/:id` | `property.units.read` |
| `POST properties` · `PATCH properties/:id` · `POST units` · `PATCH units/:id` (`offMarket`) | `property.units.manage` |
| `GET owners` (keyset) · `GET owners/:id/statement?month` | `property.owners.read` |
| `POST owners` · `PATCH owners/:id` · `POST owners/:id/statements` | `property.owners.manage` |
| `GET leases` (keyset, read store; `tab` active, ending, arrears, draft, ended; `counts`) · `GET leases/:id` | `property.leases.read` |
| `POST leases` · `PATCH leases/:id` · `…/sign` · `…/deposit` · `…/notice` · `…/end` · `…/renewal-reminder` · `…/renewal-offer` · `…/renew` · `…/decline-renewal` | `property.leases.manage` |
| `GET rent-roll?month&tab` | `property.rent.read` |
| `POST rent/raise` · `POST rent-schedule/:id/receipts` | `property.rent.collect` |
| `GET inspections` · `GET inspections/:id` | `property.inspections.read` |
| `POST inspections` · `PUT inspections/:id/items` · `…/deductions` · `…/complete` · `…/reply` | `property.inspections.manage` |
| `POST inspections/:id/settle-deposit` | `property.inspections.settle` |
| `GET requests` (the board) · `GET requests/:id` | `property.requests.read` |
| `POST requests` · `…/assign` · `…/start` · `…/done` · `…/cancel` | `property.requests.manage` |
| `POST requests/:id/owner-decision` | `property.requests.approve` |
| `GET levies?propertyId&year` | `property.levies.read` |
| `POST levy-budgets` · `…/approve` · `…/spend` · `POST levies/raise` · `POST levy-charges/:id/payments` | `property.levies.manage` |

Seed `1790850000101`. Events `PropertyUnit`, `Lease`, `PropertyInspection`, `TenantRequest`, `LevyBudget` (created,
updated), topic `commerce.property.v1`. Read models `property-unit` and `property-lease` (location-scoped, keyset
indexes).

## Tests

Unit (run): `logic/property.logic.spec.ts`, `property-permissions.spec.ts`, `property.settings.spec.ts`. Written, not
run: `test/property.e2e-spec.ts`, the tenancy-sweep fixtures and the read-store lists.

## Not yet

Receipts from the rent invoices' own payments (recorded here by staff); the deposit and the owners' fund in liability
accounts and the refund paid (rails held); listings, offers and viewings (a vacant unit is not yet a listing); the
landlord and tenant portals (settings only); meter readings and service charges; property portal feeds; commission and
deals; the landlord's statement in the owner's currency (naira assumed).

## History

- 25 October 2026: built.
