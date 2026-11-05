# Memberships and subscriptions

> Status: **built (18 October 2026)** on `feature/packs-versioning-memberships-events`. Code: `src/modules/memberships`. An [industry pack](INDUSTRY_PACKS.md) (`memberships`) switches it on per place. Product: the *Industry Catalogue* (shared module 3: plans, recurring billing, member cards, access control, freezes, retainers and maintenance contracts); boards `erp4f-mem-plans`, `-members`, `-member`, `-billing-run`, `-contracts` (`design-handoff/erp-mockups/v3/mockups/f`).

For gyms, clubs, coworking spaces, schools and any business that bills by the period: **plans** with a price and a rhythm, **members** with a card, **freezes**, **billing runs** that are checked before any invoice is made, **access** (one entitlement for a door, a class and the till) and **contracts and retainers**, which are projects' own records seen together. Nothing here is a second engine: dates are the recurring invoice's own (`finance/schedules/schedule-math`), the invoice is made, approved, posted and emailed by the same path a recurring invoice takes, and a contract is a project.

## What a person does

| Board | Screen | Route |
| --- | --- | --- |
| `mem-plans` | Plans: cards (price, what it lets in, members, what they pay a month), the figures above them, the billing rules set once for all plans | `/memberships/plans` |
| `mem-members` | Members: the list by state (active, payment failed, frozen, ending, cancelled), search, a new member | `/memberships/members` |
| `mem-member` | A member: the card, billing history, freezes with the allowance, visits a week, access, change plan, cancel | `/memberships/members/:id` |
| `mem-billing-run` | A billing run: the check, what needs a look, Run, reminders only | `/memberships/billing-runs` |
| `mem-contracts` | Contracts and retainers: what is used and what is billed, raise a visit, renew | `/memberships/contracts` |
| (the desk) | Access: scan a card or type a number, the answer, the latest scans and refusals | `/memberships/access` |

## Data (schema `memberships`, migration `1788600000100`)

Every table starts its key with `organization_id`; tenant isolation policy; no foreign keys; expand only.

| Table | What it holds |
| --- | --- |
| `plans` | What members buy: kind (`recurring`, `pack`, `day_pass`, `corporate`), price, currency, cadence, visits limit, validity, seats, freeze days a year, trial days, ID needed, billing day, its own pause rule, tax rate, the service item it is sold as, what it includes, and the areas and hours it lets in. A change applies to new members. |
| `memberships` | A customer (`crm.accounts`) on a plan: status, the days (started, anchor, paid to, next bill), the price **they** pay (a plan's price change does not move them), a pending price change, a scheduled end, a corporate plan's payer, adjustments waiting for the next invoice. |
| `freezes` | Pauses, never overlapping (checked under a lock on the membership). |
| `cards` | The QR token, the wallet pass id and the fob. |
| `visits` | Every scan, allowed or refused and why, and whether it counted. |
| `invoices` | The invoices a membership made, **one a period** (a unique key holds a period to one invoice): the member's billing history. |
| `billing_runs`, `billing_run_items` | A run, and each member in it with what needs a look, the amount and what became of it. One live run for a day and place. |

Projects, **extended** rather than copied: `projects.contract_terms` and `projects.contract_visits` (a maintenance contract's terms and visits), `projects.retainers.hours_per_period` and `.number`, and the project type `maintenance_contract`.

## Rules

**Plans.** `normalisePlan` (pure) holds each kind to its rules: a pack never renews and says how many visits it holds, a day pass is a day, a corporate plan has 2 to 5000 seats, a billing day is the 1st to the 28th and only on a monthly, quarterly or yearly plan, access rules are lower-case areas with times in pairs. The currency must be one of the organisation's active currencies and a service item must exist.

**Joining.** The first bill is worked out from the plan and the organisation's proration setting (`firstBill`): a plan billed on its anniversary starts a whole period; billed on a day of the month, the days before that day are charged **by the day** (`from_join`, the line says "14 of 31 days"), as a full first period, or not at all. A trial bills nothing until it ends (the sweep makes it a membership; the run bills it). A card is made. The customer can be made while joining. The same customer cannot join the same plan twice (409).

**Billing.** One engine for dates: `dateOf`, `periodOf`, `firstDate` of `schedule-math`, anchored at the join (or the trial's end) on the plan's billing day. `billFor` works out a bill: the first bill or a regular period at the price in force on its first day, the adjustments waiting (a plan change, a freeze credit), and the credit for days frozen **in this period**; a period frozen throughout is skipped, credits that cover a period leave nothing to invoice and carry the rest.

**Freezes.** An allowance of days per plan per calendar year (counted across a year end), a shortest freeze and a notice (settings), no overlap, not while a payment is owing unless the setting allows it. The days **already paid for** come back as a credit on the next invoice; days in a period still to be billed are taken off when it is billed. A freeze that has not started can be cancelled (its credit goes); one under way ends yesterday. Access is blocked while frozen; the hourly sweep starts and ends freezes.

**Plan change.** To another plan of the same rhythm. Now: the new price starts today and, when the setting is on, what is left of the old price is credited and what is left of the new one charged as **lines on the next invoice** (explicit, never hidden in a price). Next bill: the plan changes and the new price starts at the next bill. A company's plan and its seats are not changed this way.

**Price changes.** Changing a plan changes what new members pay. `POST plans/:id/move-members { from }` sets the plan's price as the next price of live members who pay another one, from a day after today; the billing run flags each as a *price change*, and the price becomes theirs when that period is billed.

**Cancelling.** The organisation's setting: at the end of what is paid for (access runs to the paid-to date; the sweep ends it on that day), immediately, or whoever cancels chooses. A cancellation that has not taken effect can be taken back. A company's seats go with it. A pack or a pass has nothing to renew and ends at once.

**Late payment.** An open invoice past its due date marks the member as owing (`past_due_since`: the oldest due date). The sweep sends the way to pay again on the **retry days** (the invoice's own reminder machinery) and **access pauses after N days unpaid** (the setting, or the plan's own); paying (the `ArInvoice-updated` listener) clears it and access opens at once, because the entitlement reads what is owing, not a flag someone must unset. A card on file needs a payment rail, which is held to the end: until then a member marked `card` is invoiced and flagged *No payment method* in the run.

**Access, one entitlement.** `entitlementOf` (pure) answers what a member may enter or book now, in this order: not started, cancelled, ended, expired, frozen, a company that has ended, overdue, ID not checked, visits used up, the area and hours the plan lets in. The same function serves the desk, a door and the till (`CheckInService`). A scan finds the member from the card, a fob, a number or an id; **the member is locked while it works**, so two scans at once cannot both take the last visit; a second scan of the same member at the same area within the setting's window is let through and **not counted** as another visit; staff with the check-in permission can let someone in once with a reason (logged). The card's QR holds `mem:<random token>`, never the member's number; a new card stops the old one working.

**Billing runs.** `POST billing-runs` checks a day (a dry run): every member due is looked at; those that need a person are listed with why (*payment overdue, skipped, ends, price change, check seats, no payment method, plan change*) and the totals are worked out. One live run for a day and place: asking again returns it; a day that was billed is 409. **Nothing is invoiced or charged by the check.** `POST :id/start` queues the batches (after the change commits); each member is invoiced **in their own transaction** (the membership locked, the period looked up first, a unique key behind it), a failure is marked on the item with its reason and the rest go on, and an item that failed can be tried again without billing anyone twice. People can leave a member out or put them back before the run starts, send reminders only, or cancel a run that has not started. What a run does with each invoice (leave it a draft, submit it for approval, post and send it) is a setting. **A run is in one currency** (`billing_runs.currency`, migration `1788600000160`): the totals are sums of money, so a day on which members are due in more than one currency is refused (422) and is checked place by place or plan by plan. The default list of items (`flagged=true`) holds the members that need a look **and those whose invoice failed**, read through a partial index (migration `1788600000150`); `flagged=false` lists everyone.

**Corporate plans.** A company pays one invoice for its seats; seats are named members under it (a seat is refused beyond the plan's, and is as good as its payer: a company that owes or has ended stops its seats at the door). The run flags unused seats ("10 seats, 9 used"); unused seats are not refunded.

**Contracts and retainers.** A view over projects' own records: a **retainer** or **prepayment** is the project's `retainer`; a **maintenance contract** is a project of type `maintenance_contract` with a visit allowance and an instalment each period (billing items). What is used is **counted, never typed**: visits from the jobs (a visit is a project task, done when the task is), hours from the time logged in the period (`hours_per_period`), money from what was funded and drawn. State: on track, running low (80%), used up, ended; renewing within 60 days. Raising a visit creates the task; making a contract creates the project, its terms, numbering (`CT-…`) and instalments, and renewing starts a new term (visits start again). These go through the projects module, so **the person also needs the Projects permissions** (the *Memberships manager* role template includes them).

## Settings (document type `membership`, per place)

`billsOnDay`, `proration`, `retryDays`, `pauseAccessAfterDays`, `postInvoices`, `sendInvoices`, `dueInDays`, `serviceItemId`, `minFreezeDays`, `freezeNoticeDays`, `freezeWhileOwing`, `cancelMode`, `planChangeProration`, `visitDuplicateMinutes`, `reminderDaysBeforeRenewal` (`membership.settings.ts`, each with the code that enforces it named in `definitions/index.ts`). The pack starts the first four (the plans board's "Billing, set once for all plans"), so a pack upgrade moves only the ones nobody changed.

## API (`/api/v1/memberships`)

| Method, path | Permission | What |
| --- | --- | --- |
| `GET plans`, `GET plans/overview`, `GET plans/:id` | `memberships.plans.read` | Plans with their members and monthly revenue; the figures over the cards. |
| `POST plans`, `PATCH plans/:id`, `POST plans/:id/active` | `memberships.plans.manage` | Make, change, retire or bring back. |
| `POST plans/:id/move-members` | `memberships.members.update` | Move live members to the plan's price from a day. |
| `GET members`, `GET members/counts`, `GET members/:id` | `memberships.members.read` | The list by tab (keyset, newest first), the tab counts (capped at 10,000), a member. |
| `POST members`, `GET members/lookups/customers?search=` | `memberships.members.create` / `.read` | Sign a customer up; find a customer by name, email or phone (two letters or more). |
| `GET members/:id/seats\|billing-history\|visits\|entitlement\|freezes\|card` | `memberships.members.read` | A company's seats; billing history; visits and a bar a week; what they may enter now; freezes and the allowance; the card with its QR. |
| `POST members/:id/cancel\|keep\|change-plan` | `memberships.members.update` | Cancel, take it back, change plan. |
| `POST members/:id/freezes`, `POST members/freezes/:freezeId/end` | `memberships.members.update` | Freeze, cancel or end a freeze. |
| `POST members/:id/card/reissue\|send`, `PUT members/:id/card/fob` | `memberships.members.update` | A new code, email the card, give or take off a fob. |
| `POST access/check-ins`, `GET access/visits` | `memberships.access.checkin` / `.read` | Check a member in; the latest scans and refusals. |
| `GET billing-runs`, `GET billing-runs/:id`, `GET billing-runs/:id/items` | `memberships.billing.read` | Runs, one with its rules, its items (flagged first). |
| `POST billing-runs` | `memberships.billing.run` | Check a day (dry run). |
| `POST billing-runs/:id/start\|cancel\|reminders`, `PUT …/items/:membershipId/included`, `POST …/items/:membershipId/retry` | `memberships.billing.run` | Run, cancel, remind only, leave out, try again. |
| `GET contracts`, `GET contracts/:kind/:id` | `memberships.contracts.read` | Contracts with what is used; one with its schedule and visits. |
| `POST contracts`, `POST contracts/maintenance/:id/visits`, `POST contracts/:kind/:id/renew` | `memberships.contracts.manage` | Make, raise a visit, renew. |

Scope: a person attached to places sees and works the records there; those who hold `memberships.plans.manage` reach every place; another place's record is "not found". Every list is a keyset page on an `organization_id`-prefixed index (the member list on `(status, created_at, id)`; a tab's count is a bounded read); the contracts list reads at most 1,000 contracts (an organisation keeps tens to a few thousand). Role templates: *Front desk (memberships)*, *Membership billing*, *Memberships manager*.

## Events

`MembershipPlan`, `Membership`, `MembershipBillingRun`, `MembershipVisit`, `MembershipContract` (`created`/`updated`; topic `commerce.memberships.v1`; `/live` entities, each behind its read permission). Every payload carries `organizationId`; `status` says where a membership, run or visit now is. The invoice a membership made moving on (`ArInvoice-updated`) is followed by `MembershipInvoiceListener`.

## Jobs

The `memberships` queue: a run's batches (each asks for the next until nothing is pending) and an **hourly sweep** (one cross-tenant read finds the organisations with work; each works in its own transaction): freezes start and stop, trials become memberships, scheduled ends and expired validity close memberships (a company's seats with them), members who owe are marked and chased on the retry days, members who no longer owe are cleared, and a yearly renewal is announced beforehand. Every step is idempotent.

## Tests

- Unit (pure rules): `billing.logic`, `bill.logic`, `run.logic`, `entitlement.logic`, `freeze.logic`, `member-state.logic`, `contracts.logic`, `plan.logic`, `memberships-permissions.spec.ts` (every route held to a pack permission), `membership.settings.spec.ts`, `pack-location-clock.spec.ts`.
- Drill: `QUEUE_PREFIX=drill-memberships npm run memberships:drill` (a plan, joining mid-month, the card and check-in, the overdue pause, freezes, a plan change, a billing run checked then run, cancelling and the sweep, a maintenance contract and a visit; invoices stay drafts and are deleted; the probe puts the organisation back).
- E2E: `test/memberships.e2e-spec.ts`; tenancy sweep fixtures for the new tables (`test/tenancy.sweep-spec.ts`).
- Stubbed Cypress: `cypress/e2e/memberships.cy.ts`.

## Not yet (and why)

- **Card on file and wallet charging**: real payment rails are held to the end. A member marked `card` is invoiced and flagged in the run; the invoice goes out with the way to pay.
- **The member's own app and a web join page**, wallet pass issuing (Apple, Google), door hardware set-up: not drawn. The card is the QR (also emailed as an image) and a fob id.
- **Offline door scanning**: check-in is online; the mobile phase downloads valid cards and syncs scans.
- **Refund rules on cancellation**, plan comparison for a member, notes on a member: not drawn.
- **Class bookings** use the booking engine; entitlements and the check-in are ready for it (`source: 'class'`), the schedule board (`cls-schedule`) is a separate piece.
- **Home cards** (active members, renewing, payment failed…) are declared by the pack; their figures are served by `GET plans/overview` and drawn when Home takes pack cards.

## History

- 18 October 2026: plans, members, cards, freezes, check-in and the entitlement, billing runs and the sweep, contracts and retainers (over Projects), the pack and its three role templates.
- 25 October 2026: `CheckInService` (with `whoIs`, who a card or number is) on `memberships/public-api.ts` and exported by the module, for the classes pack's bookings and check-in (`feature/industry-packs-final-3`).
