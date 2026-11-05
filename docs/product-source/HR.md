# Human resources

> Status: **current** — checked against the code on 8 October 2026 (Phase 9
> step 4). Tests: see the "Human resources" row in [STATUS.md](STATUS.md).
> Organisation and staff are on screen (`/hr/staff`, `/hr/departments`,
> `/hr/teams`, `/hr/job-functions`, `/hr/compliance`), and time — shifts,
> rotation plans, the rota, holidays, attendance (`/hr/shifts`,
> `/hr/rotations`, `/hr/rota`, `/hr/holidays`, `/hr/attendance`); every
> member reads their own record at `/me`. Leave is on screen too
> (`/hr/leave/requests`, `/hr/leave/entitlements`, `/hr/leave/categories`,
> and "My leave" at `/me`), and pay (`/hr/payroll/…`, a person's pay on
> their page, "My payslips" at `/me`), and performance (`/hr/performance/…`,
> a person's reviews and goals on their page, "My performance" at `/me`,
> with each review at `/me/reviews/:id` and those a manager gives at
> `/me/reviews-to-give/:id`). HR analytics is the People dashboard.

The people the business employs: how it is organised, who works there and
what is kept about them; their time — shifts, holidays, attendance, leave;
their pay — components, structures, tax, payroll runs and payslips; and
their performance — goals, tasks, competencies and reviews.

## What works

Proved by four endpoint specs, each with a second organisation that sees
and changes none of it.

| Area | Routes | What happens |
|---|---|---|
| Structure | `/departments`, `/job-functions`, `/teams` | A department at a location; teams in a department. |
| Staff | `/staffs` and, per member, `/contracts`, `/education-histories`, `/experience-histories`, `/staff-documents`, `/third-party-contacts`, `/work-authorizations` | Staff in a department, job and team; contracts, documents and permits carry an uploaded file. Each record is reached through its staff member, who must be the organisation's (404). Updates change only what they name. |
| Shifts and holidays | `/shifts` (`teamId`, `search`), `/holidays` | Shifts with times, breaks, headcount and the team whose they are; holidays by location (or the whole organisation), each with its location. |
| Rotas | `/rotation-plans`, `POST /rotation-plans/:id/generate { from, to }`, `/shift-assignments` (`from`, `to`, `teamId`, `staffId`, `shiftId`), `POST /shift-assignments`, `DELETE /shift-assignments/:id` | A plan is a team's shifts in the order they are filled, the working days, how places are filled (`strict`: one shift a day each, a place left empty is reported; `force_fill`: doubled up; `random`: a fresh order each period), how often people move on (day, Monday-to-Sunday week, month) and the grace for clocking in. Generating fills each working day of a range (≤ 92 days): the team as it stands that day (joiners from their first day, leavers to their last), holidays and approved leave left out, people already on the rota left as they are; run twice, it adds nothing (one assignment per person, shift and day). A fixed team works its default shift. Taking someone off is refused once attendance is recorded; removed assignments are kept, marked removed. Planner: `rota-planner.ts`. |
| Attendance | `GET /attendances?date&teamId&status`, `/attendances/clock-in`, `/clock-out`, `GET /attendances/me`, `POST /attendances/me/clock-in`, `/me/clock-out`, `/staffs/:id`, `GET /attendances/staffs/:id/period?from&to` | Clocking in is against the shift running or about to start (two hours early at most) — a night shift that began yesterday counts — in the organisation's time zone: on time within the assignment's grace, late after; clocking out before the end (less the grace) is recorded as leaving early. The day across the organisation: everyone on the rota with what was recorded, by team and status (`not-in`). Someone signed in sees their own day and clocks themselves in where the organisation allows it. One person's period (`hr.attendance.read`, at most 93 days): every day with their shifts and what was recorded (`state`: the status, `not_recorded` once the day has come — today in the organisation's zone — `ahead` before), approved leave (`onLeave`, `leaveCategory`) and the holiday where they work; `totals` by state, leave days, holidays, `attendanceRate` (attended of those due, a shift on a day of approved leave not counted as missed) and `punctualityRate` (on time of those attended), 0 to 1 or null. Four bounded reads by key. |
| Self-service | `GET /me/staff`, `GET /me/staff/:kind` (contracts, staff-documents, work-authorizations, education-histories, experience-histories, third-party-contacts, compliances) | Every member is staff; not every member of staff signs in. A member's staff record is made — or HR's record under their email linked — in the transaction that admits them (`member.joined`: an organisation made, an invitation accepted, `POST /users`); members from before were backfilled (migration `1780311600000`). Through `/me/staff` they read their own record and what is kept about them, with no HR permission, and nobody else's. |
| Leave | `/leave-categories`; `/leave-entitlements?year` (`staffId`, `categoryId`), `POST /leave-entitlements/grant { year, categoryId? }`, `PATCH /leave-entitlements/:id`; `/leave-requests` (`status`: `waiting`…, `staffId`, `categoryId`, `from`, `to`, `search`), `POST /leave-requests`, `POST /leave-requests/:id/cancel`; `/me/leave`, `POST /me/leave/requests`, `POST /me/leave/requests/:id/cancel`; read only: `/staffs/:id/leaves`, `/staffs/:id/leave-requests` | A kind of leave gives days a year and carries up to a limit into the next (or nothing). Giving a year's leave makes an entitlement for everyone working in it who has none, for each kind in use: its days, plus last year's leftover up to the carry-over; run twice, it adds nothing. An entitlement shows given, carried, taken, waiting and what can still be asked for. A request counts working days (Document settings → Leave: Monday–Friday by default) without holidays, half a day for a single day where allowed; it is refused when it overlaps the person's other leave, falls outside their employment, spans two years, needs more notice (self-service only) or more days than are left (unless allowed). It is numbered (`LVR-…`) and decided by the organisation's approval policy for **leave requests** — facts: days, kind, person, department, team, location; the `requesterManager` resolver is the person's team lead — and with no policy approved as asked. Approval takes the days; a refusal takes none; cancelling withdraws a waiting request's approval, or gives back an approved leave's days if it has not begun. Approved leave is left out of rotas and marks a missed shift `on_leave`. **Who covers** (`GET /leave-requests/:id/cover`): each day of the request (at most 62, `truncated` says so), the shifts the rota fills that the person's team works or they are on, with `needed` (the shift's headcount, the minimum the rota defines), `onRota`, `thisPersonOnRota`, `away` (others with approved leave), `waiting` (others whose leave is not yet decided), `atWork` if approved and `short`; a day the rota does not fill has `onRota: false`; `daysShort`, `shiftsShort`. The first page of `/leave-requests` carries `counts` (each status, `waiting`, `all`) under its filters but the status. The old create, change and delete routes were retired: they bypassed the balance and the approval. |
| Pay | `/pay-grades`, `/pay-groups`, `/salary-component-definitions`, `/salary-structures`, `/payroll-tax-tables`, `/payroll-periods`, `/payroll-runs`, `/payslips` | A structure gives a member of staff a base salary and components (allowances, deductions, pension…); a progressive tax table by country; a run for a pay group's period is calculated, approved and paid, and paying makes a payslip per line. Proved to the naira: 300,000 base and 50,000 housing, with brackets of 0% to 800,000, 15% to 3m and 25% above, gives 350,000 gross, 52,500 tax, 297,500 net; with a 24,000 pension deduction taken before tax, 46,500 tax and 279,500 net. Paying posts to the ledger and numbers the payslips (`PSL-…`), each printable (`/payslips/:id/pdf`). **Minimum net** (`minimumNet` on a pay group, the organisation's own amount in the group's currency, null for none; set on `POST`/`PATCH /pay-groups`, null clears it): each line of `GET /payroll-runs/:id/lines` carries `minimumNet` and `belowMinimumNet` (net under it, compared as decimals), the run's "needs a look"; nothing is changed or refused. Migration `1791200000000`. |
| Performance | `/performance-cycles` (`/launch`, `/close`, `/reopen`, `/progress`, `/board`), `/goal-categories` (and `/reorder`), `/staff-goals` (`/move`, `/tasks`), `/staff-goal-tasks` (`/remove`, `/checks`), `/staff-goal-task-checks` (`/remove`), `/competencies`, `/performance-reviews` (`/reviewer`, `/ratings`, `/finalise`, `/reopen`, `/remove`); `/me/reviews`, `/me/reviews-to-give`, `/me/goals`, `/me/goal-tasks`, `/me/goal-task-checks` | A cycle launched gives everyone in it a review of the competencies in use and their goals; a self-assessment, the manager's ratings, a score by the organisation's rules, an acknowledgement; goals on a board whose progress is their tasks' checklists. See *Performance on screen*. |
| Exit | `POST /staffs/:id/exit` `{ dateTerminated, exitReason, exitNote? }`, `POST /staffs/:id/reinstate` | A leaver's last day, why (`resigned`, `dismissed`, `redundancy`, `retired`, `contract-ended`, `mutual-agreement`, `deceased`, `other`) and a note. A person is `current`, `leaving` (an exit dated ahead: working their notice) or `left` — worked out from the date, never stored. An exit already recorded is 409 (reinstate first); a last day before they started is 400. A change (`PATCH /staffs/:id`) cannot set the date: the exit carries why. Phase 10's return checklist waits for `Staff-updated` with status `left`. |
| Lists | `GET /staffs`, `/departments`, `/teams`, `/job-functions` | Staff by `search` (name, full name, email, staff number — literally, `%` is a character), `departmentId`, `teamId`, `jobFunctionId`, `status` (`current`, `leaving`, `left`, `all`; absent: everyone who has not left), ordered by `lastname`, `firstname`, `identificationNumber`, `employmentDate`, `dateTerminated`, `createdAt`; each with their department, team and job, and `contractEndsOn` (the day the active contract in force ends; null when open-ended or none; one read for the page). Every page carries `byStatus` — `notLeft`, `current`, `leaving`, `left`, `all` — counted under the page's filters but not its status, for the pills. Departments (with their location and team count), teams (`departmentId`; with department and lead) and job functions by `search` and `name`; each with `staffCount`, the people in it who have not left. Every join names the organisation, so a page stays on one shard. |
| Overview | `GET /hr/overview` (`hr.staff.read`) | People analytics' attention items in one statement (migration `1791100000100` indexes each read): `staff` (not left, working, working their notice, left, joined and left in 30 days), `contractsEnding` (active contracts ending in 30 days: the count and the first 20 with names and the day). Each further section is held to its own permission and is `null` without it: `leave` (`hr.leave.read`: on leave today and waiting for a decision, counts and the first 20 named), `compliance` (`hr.compliance.read`: expired and expiring counts, the first 20 named), `reviewsOpen` (`hr.performance.read`: draft, submitted or with the manager), `payroll` (`hr.payroll.read`: the runs not yet paid — status, pay group and its `currency`, period, pay day, people, gross, net). Days are whole UTC days, as `hr.contracts_expiring` counts them. |
| Compliance | `/compliances` (`staffId`, `kind`, `state`, `search`), `/staffs/:id/disciplinary-records` | A person's certificates, licences, training, background checks, medicals and policies signed: what, number, issued, expires, a note and an uploaded copy. `state` is worked out against today — `expired`, `expiring` (within 30 days), `valid`, `no-expiry`; `attention` asks for the first two. Ordered by expiry, soonest first. A record stays with its person. Disciplinary records: when, what happened, what was done, latest first. |
| Records | `/communications`, `/analytics` | Listed per organisation. |

**Every action is the organisation's own.** Updates, deletes and actions —
payroll steps, review steps, goal moves, checklist changes, clocking in —
check the record (or the staff member it belongs to) is the organisation's
before doing anything; a delete that finds nothing is 404.

## Attendance settings

Document settings → **Attendance and rotas** (`attendance`), the
organisation's choice: the time zone shifts are kept in (default UTC);
whether people clock themselves in (on); whether people who did not clock
in are marked absent — or on leave, when their leave was approved — once
a shift has ended and a wait has passed (off; 60 minutes); and how many
days ahead every rotation plan in use keeps the rota filled (0: by hand).
`AttendanceDayJob` runs every five minutes for the organisations that
turned either on, each in its own transaction; it replaced a job that ran
for every organisation and was kept off by an environment switch.

## Permissions

`hr.*` — `create`, `read`, `update`, `delete` per area (`hr.attendance`,
`hr.leave`, `hr.performance`, `hr.payroll`, `hr.staff`…).

## Tests

| Kind | Where | Run with |
|---|---|---|
| Endpoint tests | `test/hr-people.e2e-spec.ts`, `test/hr-time.e2e-spec.ts`, `test/hr-pay.e2e-spec.ts`, `test/hr-pay-screens.e2e-spec.ts`, `test/hr-performance.e2e-spec.ts` | `npm run test:e2e` |
| API unit specs | the module's use-case specs | `npm test -- src/modules/human-resource` |
| Tenancy | every route, by another organisation and by its own, and every list | `npm run test:tenancy` |

## Known limits

- **A pay group's run chose leavers.** Until 8 October, a run with no
  staff named selected the people whose exit date had passed — those
  still employed were never paid. It now pays everyone in the group who
  started by the period's last day and had not left before its first.
- **Net pay without a bank account named** waits in net salaries payable (the screen asks for the account since
  31 October 2026, commerce-web);
  nothing yet records paying it out from there.
- **Payroll is not split by department** in the ledger (departments are not
  ledger dimensions).
- Communication records are stubs (no fields of their own).
- **Performance's live notices** reach those who may read HR's
  performance (`hr.performance.read`). A manager or an employee without it
  sees a review's change when they open it again.
- **Someone who leads their own team is rated by HR** (departments have no
  head to rate them); HR names another reviewer on the review.
- Paying a run asks which account the net pay leaves from (`{ bankAccountId }`; the list is
  `GET /banks/accounts/paying`, open to `hr.payroll.update` since 31 October 2026); paid outside the app, it waits
  in net salaries payable.
- A tax profile (resident or not, annual rent paid, other annual reliefs) is read by every run — see *Payroll after
  the audit* below.
- Leave that has begun is corrected by HR adjusting the entitlement; it is
  not cancelled.
- Self-service reads; changing one's own details goes through HR.
- Pickers (department, team, job, a team's lead) offer the first hundred
  by name; compliance is added from the person's page.
- Leave cover counts the rota (assignments), not attendance, and takes a
  shift's headcount as its minimum; a shift with nobody on it that day is
  not asked about.

## On screen (Phase 9 step 1, 8 October 2026)

- **Staff** (`/hr/staff`): found by name, number or email; narrowed by
  department, team, job and status; added in a drawer. Opens to the
  person.
- **A person** (`/hr/staff/:id`): details, changed in a drawer; an exit
  recorded (last day, why, a note) or undone after asking; compliance,
  contracts, right to work, documents, next of kin, education, experience
  and the disciplinary record, each added and changed in a dialog, a copy
  uploaded with the form and opened from the list.
- **Departments, teams, jobs** (`/hr/departments`, `/hr/teams`,
  `/hr/job-functions`): with where each is, who leads a team, and how
  many people each has.
- **Compliance** (`/hr/compliance`): everyone's records, opening on what
  has expired or expires within 30 days; renewed in place.
- **Live**: `Staff`, `Department`, `Team` and `JobFunction` are told to
  open screens (`hr.staff.read`, `hr.departments.read`); a person's page
  reads itself and its sections again.

Permissions: `hr.staff.*` for people and their records,
`hr.departments.*` for the structure (and the pickers), `hr.compliance.*`
for compliance and disciplinary records — a person without it sees
neither section.

## Pay on screen (Phase 9 step 3, 8 October 2026)

- **Pay groups, grades, components** (`/hr/payroll/groups`, `/grades`,
  `/components`): who is paid together and how often, the bands, and what
  can be added or taken (taxable, before or after tax).
- **Tax tables** (`/hr/payroll/tax-tables`): PAYE by country and state,
  for residents or not, from a date; a flat rate or brackets of a year's
  or a month's pay. A run divides a yearly table by its frequency (12, 26
  or 52 periods).
- **Periods** (`/hr/payroll/periods`): a pay group's year made at once,
  closed and reopened.
- **Runs** (`/hr/payroll/runs`, `/runs/:id`): made for a period; calculated
  (again), approved, paid — with a confirmation saying what it posts — or
  voided; totals, and each person's base, gross, tax, deductions and net
  with the components that made it; each payslip printed. Live
  (`PayrollRun`, `hr.payroll.read`).
- **Payslips** (`/hr/payroll/payslips`): found by person or number,
  narrowed by run; printed.
- **Everyone's pay** (`/hr/payroll/structures`): each person's group and
  salary in force today, and who is not set to be paid.
- **A person's pay** (on `/hr/staff/:id`): their pay group (in the details
  drawer), salary structures latest first with a new one from a date (a
  raise), and their tax profiles.
- **My payslips** (on `/me`): the person's own paid, visible payslips,
  each printable — and no one else's.

Routes added: `GET /payroll-runs/:id/lines`, `GET /me/payslips`,
`GET /me/payslips/:id/pdf`, `GET /staffs/:staffId/salary-structures`,
`GET /pay-register/structures`, `GET|POST|PATCH
/staffs/:staffId/tax-profiles`; staff take a `payGroupId`; runs and
periods are filtered by pay group and period, and return them.

## Performance on screen (Phase 9 step 4, 8 October 2026)

- **Competencies** (`/hr/performance/competencies`): what everyone is
  rated on, each weighted; retired, never deleted — a finalised review
  keeps what it was rated on, new reviews leave it off.
- **Review cycles** (`/hr/performance/cycles`, `/cycles/:id`): made as a
  draft with the dates self-assessments and ratings are due; **launched**
  — everyone employed during it (or in one department) gets a review,
  rated by their team's lead, listing the competencies in use and their
  goals; launched again for newcomers; **closed** once every review is
  finalised (409 otherwise), reopened. A launched cycle, or one with goals,
  is never removed. The page shows how far its reviews have got, each one,
  and its board.
- **The board**: the cycle's columns (To do, In progress, Done to start
  with), each goal with whose it is, its progress and tasks done; moved
  with a picker; set for someone in a drawer. A goal opens to its tasks
  and their checklists: ticking a box moves the task (the share ticked),
  the task moves the goal (its tasks' progress, by weight). A goal is
  cancelled, never deleted; a task or a box is taken off (soft).
- **Reviews** (`/hr/performance/reviews`, `/reviews/:id`): the person
  rates themselves on each line and writes a summary, then submits (all
  lines rated); their manager rates each line — a low rating needs a
  reason — and finalises, which scores it; the person reads it and
  acknowledges, with a comment. The manager needs no HR permission: being
  the manager is the authority. A refused finalise saves nothing. HR
  changes who rates a review, rates and finalises for anyone, reopens a
  finalised review (its scores cleared), or removes one made by mistake
  (kept, soft-deleted). The employee sees the manager's ratings only once
  finalised (by setting); the manager sees the self-assessment only once
  submitted.
- **Scores**: a rating counts from the bottom of the scale (1 of 5 is 0%,
  3 is 50%); competencies by their weights; a goal blends its progress
  with its rating by the organisation's share; overall weighs goals
  against competencies — over what the review has (no goals: competencies
  alone). `review-scoring.ts`.
- **My performance** (on `/me`): my reviews (with "Your turn"), the
  reviews I give, my goals in open cycles, and adding my own.
- **A person's page**: their reviews and goals.
- **Notifications**: two rules on by default — a review opened (tells the
  person, or the manager where there is no self-assessment) and a review
  moving on (the manager on submission, the person on finalising, the
  manager on acknowledgement), in-app and by email.
- **HR analytics** (`/hr/analytics`) is the People dashboard, with
  reviews still open, reviews finalised, the average review score and the
  share of goals done.
- **Live**: `PerformanceCycle`, `PerformanceReview`, `StaffGoal`.

Document settings → **Performance reviews** (`performance-review`): the
rating scale (1 to 5), who rates (the team's lead, or HR), whether people
assess themselves first (on), whether competencies are rated (on), goals'
share of the overall score (40%), progress's share of a goal's score
(70%), the rating at or below which a reason is needed (2), whether people
see the manager's ratings once finalised (on), acknowledge their review
(on), and add their own goals (on).

## The payroll audit fixes (31 October 2026, `fix/payroll-percent-bases-and-employer-contributions`)

An accountant's run through payroll — 300,000 base, 50,000 housing, 30,000 transport, an 8% pension of gross, the
Nigeria Tax Act 2025 bands (0% to 800,000, 15% to 3m, 18% to 12m, 21% to 25m, 23% to 50m, 25% above) — found:

1. **Every percent was of base salary**, whatever it said (`resolvePercentBase` ignored gross and taxable). The
   pension came to 24,000, not 30,400; tax to 46,580, not 45,428; net to 309,420, not 304,172 — the pension
   remittance 6,400 short a month for one person. `computeAmounts` now works a structure out in order: fixed and
   percent-of-base first, then gross (base and the additions that count in it) for what is a percent of gross, then
   taxable pay (base and taxable additions less pre-tax deductions) for what is a percent of taxable pay.
2. **Nothing the employer pays on top reached the books** — employer pension (10%), NSITF, ITF, NHIS. A salary
   component may now be **`employerPaid`**: worked out like any other, kept on the person's line on the
   `employer` side, never in their gross, tax or net; paying the run posts it Dr salaries (or the account set
   for the component), Cr pension payable (a pension) or other payroll deductions payable. Migration
   `1792420000300`.

What was right: the run's entry matched its payslips to the naira, paid from the bank account named, and its void
reversed it.

Proved: the run above against the branch — line, payslip and entry by hand: Dr salaries 418,000 (with 38,000
employer pension), Cr pension payable 68,400, Cr PAYE 45,428, Cr bank 304,172 — and `salary-structure.amounts.spec`.

Still open when this was written, closed below: paying over PAYE and pension from the run, how a void of a paid run
gets its money back, and the tax profile (non-resident, reliefs).

## Payroll after the audit (31 October 2026, `fix/payroll2`)

Migration `1792435000000`: nullable columns and one table (`human_resource.payroll_remittances`, with RLS); nothing
dropped.

**1. Paying over what a run owes, from the run.** `GET /payroll-runs/:id/remittances` (`hr.payroll.read`) lists, for
a paid run, what it credited to each liability account — PAYE (one payable for each tax table its lines used),
pension (employee and employer together), each other deduction — with `remitted` (requests that were paid),
`requested` (requests not yet paid) and `outstanding`, the payees it may go to and their approved accounts.
`POST /payroll-runs/:id/remittances` (`hr.payroll.update`; `{ key, financialAccountId, method?, beneficiaryId?,
beneficiaryAccountId?, amount?, dueDate? }`) makes a **draft payment request** (kind tax, statutory or other,
debiting the liability account) through the same code as Finance's own; it is submitted, approved and paid there, and
paying it posts Dr the liability, Cr the bank. The payee is the one named on the salary component
(`remitToBeneficiaryId`) or on the tax table that taxed the line, unless the request names another. A remit for a run
that is not paid, or for a payable with nothing left, is 409; for more than is left, or with no payee named, 422. Web: a "Paying over" panel on a paid run with a Remit
drawer per payable; the payee is set on the salary component and the tax table.

**2. Voiding a paid run.** `PATCH /payroll-runs/:id/void` takes `{ recovery?, bankAccountId?, on?, reason? }`. A run
whose net pay left a bank account must say how it comes back (422 otherwise): `returned` reverses the bank line
into `bankAccountId` (the account it was paid from when absent) on `on` (today when absent), or `employees` leaves
the bank credit standing and issues each person an employee advance for their net pay (receivable 1540), so the
money is owed back. A run paid outside the app (net salaries payable) or not yet paid voids as before and asks
nothing. A void is refused (409, saying what to do) while a payment request made from the run is open — cancel it —
or paid — get it back first, marked returned on the request. The payslips are kept, marked void (`voided_at`; the
PDF says VOID); the run's `voided` carries the day, reason, choice and advances. The ledger side is
`LedgerPostingService.reverse`'s `redirect` (see FINANCE.md).

**3. The tax profile.** `/staffs/:id/tax-profiles` also takes `annualRentPaid` and `otherAnnualReliefs`. A tax table
takes `rentReliefRate` and `rentReliefCap`; a run takes the rate of the year's rent (up to the cap) plus the
profile's other reliefs off the year's taxable pay before the brackets, and shares them over the periods; the line
keeps `reliefs` and the `taxTableId` it used. A non-resident is taxed by a non-resident table at their work place,
else at the pay group's country, and by the resident table where the organisation has no non-resident table
(before, they were taxed nothing at all). A table with no rent relief rate gives none: nothing changes for a person
until an organisation sets one.

**The rent-relief rule's source is secondary commentary, not the statute.** Rent relief of 20% of the annual rent,
at most 500,000 (Nigeria Tax Act 2025, section 30(2)(a)(vi), on evidence under section 31) is taken from published
commentary (Forvis Mazars and Mondaq); the Act's own text was not checked, and Commerce ships no preset for it — an
organisation enters the rate and cap on its tax table.

Proved against the branch API (test organisation, one person on 300,000 base, 50,000 housing, 30,000 transport, 8%
pension of gross, 10% employer pension; probe rows removed after):

| What | Measured | By hand |
|---|---|---|
| Run paid | Dr salaries 418,000; Cr pension payable 68,400, PAYE payable 45,428, bank 304,172 | same |
| Outstanding to remit | PAYE 45,428.00; pension 68,400.00 | same |
| Both remitted and paid | Dr PAYE payable 45,428 / Cr bank 45,428; Dr pension payable 68,400 / Cr bank 68,400; remitted 45,428 and 68,400, outstanding 0 | same |
| Void with a request open, and after both were paid | 409 each | refused |
| Void of a paid run with no choice | 422 | refused |
| Void, `employees` | bank credit 304,172 stands; Dr employee advances 304,172 (ADV issued to the person); payslip void | same |
| Void, `returned` into another account on 3 November | Cr bank 304,172 at 31 October; Dr that account 304,172 dated 3 November; all other lines reversed | same |
| Void of a run paid outside the app | every line reversed, net zero | same |
| Rent 1,200,000 a year | relief 20,000 a month, taxable 329,600, tax 41,828, net 307,772 | 3,955,200 a year: 330,000 + 955,200 x 18% = 501,936 / 12 = 41,828 |
| Rent 3,000,000 a year (cap) | relief 41,666.67 a month, tax 37,928, net 311,672 | 500,000 capped: 3,695,200 a year: 330,000 + 695,200 x 18% = 455,136 / 12 = 37,928 |
| Non-resident, flat 10% table | tax 34,960, net 314,640 | 10% of 349,600 |

`npm run hr:drill`: 14 of 21 checks pass; the seven that fail are all "the open screen hears it" (a notice reaching a
socket through the dev API's outbox relay, which published the rows about sixteen seconds after the drill gave up
waiting) — staff, attendance, leave, reviews and goals, none of which this lane touches; they were not run against
master for comparison.

At merge: nothing to run but the migration. For existing organisations: a void of a paid-from-bank run now needs
`recovery`; a non-resident with no non-resident table is now taxed as a resident; Remit and the rent relief do
nothing until a payee, a rate and a cap are entered.

## History

- 25 October 2026 (`fix/tsc-servername-and-minimum-net`) — **a pay group's minimum net, decided by recommendation**
  (the standing decision rule; "organisation chooses"): a nullable `pay_groups.minimum_net` (numeric 14,2, at least 0,
  migration `1791200000000`) that the organisation sets per group, exposed as `minimumNet` on the pay group, and
  `belowMinimumNet` with `minimumNet` on each run line. A flag, not a block: approving a run is unchanged. A
  per-country statutory minimum can be layered on later (e.g. a country table read when the group has none). The pay
  group's answer now also carries its `description`, `currency`, `countryCode`, `stateCode`, `frequency`,
  `autoGeneratePeriods` and `isActive` (only `id`, `name` and `createdAt` were exposed); the code transforms keep an
  absent code absent.

- 25 October 2026 (`fix/api-gaps-1025b`) — the rest of web #32: the overview's payroll rows carry the pay group's
  `currency`; `GET /leave-requests/:id/cover` against the shifts' headcount; `GET /attendances/staffs/:id/period`;
  `counts` on `/leave-requests` and on `GET /staff/change-requests` (`{ open, done, declined }`, first page). A pay
  group's minimum net is left open: no data source (Known limits). No migration (the indexes were there).

- 25 October 2026 (`fix/followups-1025`) — the HR gaps the web lane named (commerce-web #32,
  RECOMMENDATIONS-C §7): `GET /hr/overview` in one read; `byStatus` counts and `contractEndsOn` on the staff
  list; indexes in migration `1791100000100`. Still open from that list: leave cover with the rota's
  minimum, per-person attendance, a pay group's minimum net.
- 16 October 2026 — fixes found by the demo data:
  - **holidays are kept per place**: unique by (organisation, name, date,
    location) instead of (organisation, name), so the same national holiday
    is recorded at each location that keeps it, once each, and comes back
    next year. No location is the whole organisation's, one per name and
    day (`NULLS NOT DISTINCT`, rows removed don't count). A repeat is 409
    "This holiday is already kept at that place on that day." Migration
    `1782750000000-holidays-per-location`. `POST /holidays` still takes one
    location; a holiday for several places is one call per place.
  - **a salary component's kind** is the database enum (allowance, bonus,
    deduction, tax, pension, loan, benefit, overtime_rate). A second,
    wider enum (housing, transport, basic…) sat unused beside it, and a
    caller that skipped the DTO got a 500; the service now answers 400 with
    the kinds on create and change. Housing and the like are components of
    kind `allowance` (the kind decides the payslip side and the ledger
    posting; the database enum was not widened). No migration.
  - Tests: `salary-component-definition.service.spec.ts` (5); `hr:drill`
    +3 (the same holiday at two places, a repeat is 409, `housing` is 400 —
    the holiday checks pass once the migration has run on the database).

- 8 October 2026 — Phase 9 step 4, performance on screen (above). Found:
  finalising a review with a goal on it crashed (it read `goal.id` off
  the line); its weights were fixed in code; a review without goals was
  marked down 40%; nothing rated the employee's own view, or acknowledged
  the outcome; goals' progress was never worked out from their tasks;
  reviews, goals, tasks and checklists were hard-deleted, and deleting a
  cycle cascaded to its reviews and goals; competencies and cycles came
  back without their fields (`excludeExtraneousValues` with nothing
  exposed); a cycle's status could be set to closed by a plain update.
  Migration `1780311800000`; tests `review-scoring.spec` (6),
  `goal-progress.spec` (6), `hr-performance.e2e-spec` (7), `hr:drill`
  (a review and a goal heard), Cypress `hr-performance` (7).

- 8 October 2026 — Phase 9 step 3, pay on screen (above). Found: a weekly
  or fortnightly run taxed a month's share of a yearly table (now divided
  by the group's frequency); a structure had to have a component; payroll
  runs and periods could not be filtered and lost their group; payslips
  were listed without the person. Tests `hr-pay-screens.e2e-spec` (8),
  `hr-pay.e2e-spec`, Cypress `hr-pay.cy.ts` (11).

- 8 October 2026 — Phase 9 step 2b, leave: entitlements by kind and year
  (granted, carried over, adjusted), requests counted in working days
  without holidays, checked, numbered and decided by the approval policy
  (the manager is the team's lead), taken from and given back to the
  balance, live (`LeaveRequest`), and in self-service ("My leave"). The old
  write routes, which bypassed all of it, were retired. Numbering now adds
  a type's default rule the first time an older organisation needs it.
  Migration `1780311700000`; tests `leave-days.spec`, `hr-leave.e2e-spec`
  (7), `hr:drill` (a leave heard).

- 8 October 2026 — Phase 9 step 2a, time, and self-service: rotation
  plans that generate (the old generator was unreachable and filled one
  day at a time), the rota read and changed, clock-in in the
  organisation's time zone (it mixed UTC days with server-local shift
  times), the day across the organisation, someone's own day, absences
  and rotas kept filled by the organisation's choice; holidays listed by
  their organisation (org-wide ones were missing; each was repeated once
  per team of its location). Every member is staff (`member.joined`,
  backfill) and reads their own record (`/me/staff`, `/me`). Events and
  live notices for `ShiftAssignment` and `Attendance`. Migrations
  `1780311500000`, `1780311600000`; `1780311400000` made to run in a
  transaction as this repository requires. Tests `rota-planner.spec`,
  `zoned-time.spec`, `hr-rota.e2e-spec`, `hr-self-service.e2e-spec`,
  `hr:drill` (a clock-in heard).

- 8 October 2026 — Phase 9 step 1, organisation and staff on screen: the
  lists' search, filters, order and headcounts; the exit and its undoing;
  compliance made real (it was a placeholder column) and disciplinary
  records reachable; contracts and permits listed with their copies;
  lifecycle events for staff, departments, teams and job functions (job
  functions were updated past the outbox). Found: a pay group's run paid
  only leavers. Migration `1780311400000`; tests
  `hr-organisation.e2e-spec`, `compliance-kind.spec`, `hr:drill`.

- 5 October 2026 — Phase 5 step 5, payroll in the ledger. Paying a run
  (`PATCH /payroll-runs/:id/pay`, optionally `{ bankAccountId }`) posts
  Dr salaries (base pay, and each addition by its component — an
  organisation can route an allowance to an account of its own); Cr PAYE,
  pension and other deductions payable; Cr the bank, or net salaries
  payable. Voiding a paid run reverses it. Payslips are numbered
  (`payslip` rule, `PSL-…`) and print: `GET /payslips/:id/pdf`. Found on
  the way: a salary structure kept only its first component (the lookup
  limited the joined rows to one), pension and loan components were added
  to pay instead of taken off it, and a run's components were never saved.

- 5 October 2026 — Phase T step 3:
  - **across organisations**: teams and payslips (pay!) were listed to
    everyone (compliance and communication records too, fixed on 4
    October); any organisation could
    calculate, approve, pay or void another's payroll, submit or finalise
    its reviews, move or progress its goals, change or delete its tasks and
    checklists, delete its payslips, clock in its staff, and change its
    holidays and attendance;
  - **nothing could be paid**: salary components were saved without their
    definition, so every run paid nothing; the target check, the period
    overlap query, a structure lookup, a staff lookup and the tax lookup
    each failed; runs could only be paid once "posted", which nothing did;
    no payslip was ever made; deleting a pay group or period failed;
  - **nothing could be clocked**: clock-in always answered "not found"
    (the day's attendance was looked up by an exact midnight and threw when
    absent), and assignments were matched to the clock-in time itself;
  - next-of-kin contacts lost every field (no validators: the whitelisting
    pipe stripped them); leave requests' dates could never validate; staff
    record updates required every field; a team, a department and a leave
    category each required a field that is optional; goal categories could
    not be reordered (the route was taken for an id); reviews could not be
    submitted or finalised (relations by the wrong name); tasks without a
    weight failed.
