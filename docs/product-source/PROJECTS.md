# Projects and timesheets

> Status: **built, steps 1–5, 16 October 2026** on `feat/projects`.
> Tests: see "How to run what exists" below.

The shared module for every business that sells its people's time: agencies,
consultancies, construction, IT services, architects, event organisers, field
work. A **project** has a customer, a manager and a team, dates, a budget (in
hours and in money) and a way of being billed; **tasks** on a board; **time**
that people enter by the day and submit by the week; and **money**: what a
project earns, what it costs, and the invoices drawn up from approved time,
milestones and a fixed-price schedule. It is one of the first two shared
modules the user chose (the other is the booking engine). Code:
`src/modules/projects/`; ports in `src/modules/adapters/projects/`.

## One project, two families (decision)

Manufacturing already has projects (`manufacturing.projects`, with phases,
milestones, deliverables, nested tasks, four kinds of dependency, risks,
changes with versions and comments — [MANUFACTURING.md](MANUFACTURING.md),
step 3). There is **one project table**. A row has a `family`:

- `manufacturing` — everything that existed. Its life is manufacturing's
  longer line (approved, scheduled, in production, quality review); it has a
  plant, `has_production`, deliverables that become production orders, and
  tasks with machines, skills and materials. Manufacturing writes it.
- `service` — a services project. Its life is draft → planning → active →
  completed → closed, with on hold and cancelled on the way. The projects
  module writes it.

Why not a new table and a link? Two project tables would be two concepts
with two numbers, two customers and two budgets, and every report would have
to add them. Why not move the code? The manufacturing projects code is
12,000 lines tied to plant scope, the manufacturing audit trail and 152 SQL
references to `manufacturing.projects`; moving the schema renames a label.
So the table keeps its schema (`manufacturing`, historical), grows the
columns a services project needs, and each module keeps its hands off the
other's family:

- the projects module **reads** every project (so profitability, time and
  the project picker see manufacturing projects too) and **writes** only
  `family = 'service'` (time, billing and costs are the exception: they may be
  recorded against any project, as they are the projects module's own tables);
- manufacturing's lists, overview and cross-project task list ask for
  `family = 'manufacturing'`;
- the pure rules are shared, not copied: dependency checks and task roll-up
  are manufacturing's `dependency.logic.ts` and `task-rollup.logic.ts`, used
  by the projects module as they are.

The shared aggregate events `Project-*` and `ProjectTask-*` are raised for both
families (still on the manufacturing topic); the `/live` room admits whoever
holds the manufacturing or the projects read permission.

## Step 1 — the project

### What it does

- **A project** (`PRJ-…`, the manufacturing series): name, description,
  customer's reference, type (client service, consulting, construction,
  software and IT, creative and agency, event, field work, internal, other),
  category, customer, manager, location, start and end dates, priority,
  **billing type** (fixed price, time and materials, milestones, non-billable),
  currency, **budget** (cost) and **budget hours**, **revenue** (the contract
  value: the fixed price, or what is expected to be billed), default bill and
  cost rates. Made on its own or — from step 2 — from a template.
- **Life**: draft → planning → active → completed → closed; on hold (with a
  reason, back to where it was) and cancelled (always with a reason).
  Gates are settings: a manager before planning; start and end dates, and
  optionally a customer and a billing type, before work starts; every task done
  (and, optionally, every milestone accepted) before it is completed; all time
  approved (and, optionally, all billable work invoiced) before it closes.
  Closed and cancelled projects are kept as they were.
- **Team** (`projects.project_members`): a manager, members and viewers, each
  optionally with their own bill and cost rate for this project. A whole HR team
  can be put on at once. The manager is always on the team. A person with open
  tasks cannot be taken off.
- **Board columns** (`projects.stages`): a new project gets the columns of the
  setting (default *To do, In progress, In review, Done*); the first counts as
  to do, the last as done. Columns are renamed, reordered, limited (WIP) and
  retired when empty; a board keeps at least two.
- **Drive**: *Make workspace* creates the project's workspace in Drive (the
  team become editors); its id is kept on the project. Files on the project
  record itself and on its tasks go through Drive references (`project`,
  `project_task`).
- **The ledger**: each project is a value of the ledger's Project dimension
  (setting `ledgerProject`), renamed with the project and taken out of use when
  it closes or is cancelled.
- **The feed**: every change is a line in the project's activity (keyset pages).
- **Tags**: projects and tasks carry the organisation's tags (`project`,
  `project_task` target types).

### Data

| Table | Holds |
|---|---|
| `manufacturing.projects` (shared) | + `family`, `billing_type`, `budget_hours`, `default_bill_rate`, `default_cost_rate`, `is_template`, `template_id`, `workspace_id`, `category`, `logged_minutes`, `approved_minutes` (kept by the time commands); `project_type` and `status` widened |
| `manufacturing.project_tasks` (shared) | + `stage_id`, `start_on`, `due_on`, `billable`, `milestone_id`, `logged_minutes`, `board_rank` |
| `manufacturing.project_milestones` (shared) | + `acceptance` (none, awaiting, accepted, rejected), `accepted_on`, `accepted_by`, `acceptance_note` |
| `projects.project_members` | the team: role, own rates |
| `projects.stages` | the board's columns: category, WIP limit |
| `projects.staff_rates` | the rate card: what a person costs and is billed an hour, from a date |
| `projects.activity` | the feed |

Every table leads its key with `organization_id`, has a `tenant_isolation`
policy, and every query names the organisation. Migration
`1782700000000-projects-core`.

### API (step 1)

| Method | Path | Permission | What it does |
|---|---|---|---|
| GET | `/projects` | `projects.projects.read` | a keyset page (`cursor`, `limit`) of projects, newest first; filters family, status, open, type, category, priority, billing type, customer, manager, location, search, late, templates, mine |
| GET | `/projects/overview` | `projects.projects.read` | counts by status, late, over their hours |
| GET | `/projects/:id` | read, or on the team | the project with team, board, events, facts and the moves open with what each asks for |
| POST | `/projects` | `projects.projects.create` | make one (at a location the person holds the permission at) |
| PATCH | `/projects/:id` | `projects.projects.update` | change one |
| POST | `/projects/:id/move` | `projects.projects.update` (`.close` for hold, cancel, complete, close) | move along its life |
| POST/DELETE | `/projects/:id/members[/…]` | `projects.projects.update` | the team |
| POST/PATCH/DELETE | `/projects/:id/stages[/…]` | `projects.tasks.update` | the board's columns |
| POST | `/projects/:id/workspace` | `projects.projects.update` + `drive.drives.create` | the Drive workspace |
| GET | `/projects/:id/activity` | read, or on the team | the feed |
| GET | `/projects/lookups/{customers,staff,teams}` | read | pickers |

Reads are narrowed to the person's locations (`user_location_roles`); a project
at no location is the organisation's. A write at another location is a 403, and a
project outside the person's places is not found.

### Settings (Settings → Documents → Projects and timesheets)

Organisation-wide. Lifecycle gates, the default columns, and the time, rate and
invoicing settings of the later steps — see
`document-settings/definitions/projects.settings.ts`.

### Permissions

`projects.projects.{read,create,update,close}`, `projects.templates.manage`,
`projects.tasks.{read,create,update}`, `projects.milestones.{manage,accept}`,
`projects.comments.create`, `projects.time.{read,manage,approve}`,
`projects.rates.{view,manage}`, `projects.costs.view`,
`projects.billing.{read,manage,invoice}`, `projects.profitability.view`. What
shows pay or profit ends in `.view`, so the default manager and viewer sets
(every `.read`) do not reach it. Time on one's own tasks is every member of
staff's own (`/me/…`) and needs no permission. Role templates: *Project manager
(services)*, *Project billing*, *Timesheet approver*. Seed:
`1782700000001-sync-permission-catalog-projects`.

### Events

`Project-created/updated` (shared with manufacturing), `ProjectTask-*` (shared);
`TimeEntry-*`, `Timesheet-*`, `ProjectMilestone-*`, `ProjectComment-*`,
`ProjectBilling-*`, `ProjectCost-*` on `commerce.projects.v1`; bespoke:
`Timesheet-submitted/approved/rejected`, `TimeEntry-approved`,
`ProjectInvoice-created`, and the inbound `timeclock.job-time.recorded`. Every
payload carries `organizationId`.

## Step 2 — tasks, the board, milestones, templates

### What it does

- **A task** is the shared task row (`PRJ`'s `TSK-…` series): title, description,
  priority, **start and due dates**, **estimate** (minutes), whether its time is
  **billable**, its **column** on the board, its **milestone**, and its sub-tasks
  (up to five levels). Several **assignees** (the first is also the row's owner);
  assigning someone puts them on the project's team.
- **Board and list.** A project's tasks come in one read with its columns and links
  (`GET /projects/:id/tasks`, bounded to 2,000). The board shows leaf tasks; the
  list shows the tree. A card moves to a column and to a place in it
  (`before`/`after` a neighbour): one row is written, by a rank between its
  neighbours (`board.logic.ts`). A column gives the status (to do / in progress /
  done); moving into a column that is full (WIP limit) is refused; moving a task
  onto a project that is on hold is refused. A blocked task stays blocked while it
  moves between working columns.
- **Dependencies** are finish-to-start: a task cannot start or finish until what it
  waits for is done (setting `tasksFollowDependencies`); loops, self-links, links
  to a task's own parts and repeats are refused. The rules are manufacturing's
  `dependency.logic.ts`, used as they are.
- **Sub-tasks roll up** into their parent (progress weighted by effort, first start
  to last due, effort) and the top-level tasks into the project's progress, after
  every change (`task-rollup.logic.ts`, shared). O(tasks of the project).
- **Checklists** (up to 100 steps), **comments** with mentions and replies on a
  project or a task (the table manufacturing's comments use), **attachments** by
  Drive references (`project_task`), **tags** (`project_task`).
- **Working one's own task** — move, start, finish, tick a step — needs no
  permission beyond being an assignee; planning needs `projects.tasks.update`.
  *My tasks* (`GET /me/tasks`) lists the person's open tasks across projects, due
  soonest first.
- **Milestones**: a name, a due date, and whether it **needs acceptance**. The team
  *achieves* it (all its tasks done); where acceptance is needed it then waits for
  *accept* (`projects.milestones.accept`) or *turn back* (with what is missing: it
  is pending again). A project cannot complete with unaccepted milestones when
  the setting says so. Billing by milestone (step 4) waits for the acceptance.
- **Templates**: *Save as template* keeps the board's columns, milestones, nested
  tasks (estimates, checklists, finish-to-start links) without customer, people
  or numbers. Making a project from a template (`templateId`) copies them, every
  date moved by the days between the template's start and the new project's.

### Data

Migration `1782700000100-projects-tasks`: `projects.task_assignees`,
`projects.task_checklist_items`. Everything else is the shared tables widened in
step 1.

### API

| Method | Path | Permission | What it does |
|---|---|---|---|
| GET/POST | `/projects/:id/tasks` | team may read / `projects.tasks.create` | the board; add a task |
| GET | `/project-tasks` | `projects.tasks.read` | tasks across projects (keyset) |
| GET | `/me/tasks` | none (own) | my open tasks |
| GET/PATCH | `/project-tasks/:id` | team may read / `projects.tasks.update` | one task; change it |
| PUT | `/project-tasks/:id/assignees` | `projects.tasks.update` | assign |
| POST | `/project-tasks/:id/move`, `…/act` | planner or assignee | a column and place; start, complete, reopen, cancel, block, unblock |
| POST/PATCH/DELETE | `/project-tasks/:id/checklist[/:itemId]` | planner or assignee | steps |
| POST/DELETE | `/project-tasks/:id/dependencies[/:depId]` | `projects.tasks.update` | wait for another |
| GET/POST | `/project-tasks/:id/comments`, `/projects/:id/comments` | team / `projects.comments.create` | talk |
| PATCH/DELETE | `/project-comments/:id` | author (remove: or planner) | |
| GET/POST | `/projects/:id/milestones` | team may read / `projects.milestones.manage` | milestones |
| PATCH/DELETE, POST `…/achieve` | `/project-milestones/:id` | `projects.milestones.manage` | |
| POST | `/project-milestones/:id/accept`, `…/turn-back` | `projects.milestones.accept` | |
| POST | `/projects/:id/save-as-template` | `projects.templates.manage` | |

## Step 3 — time and timesheets

### What it does

- **A time entry** is a person's minutes on a project (and a task) on a day:
  typed in, from a running **timer**, or **imported** from the timeclock. It is
  billable by default unless the project is non-billable or the setting says
  otherwise; it is rounded up to the setting's step; a day holds at most the
  setting's hours across all projects; a day ahead, or older than the limit, is
  refused. Time goes on the staff member's own team projects (managers and
  `projects.time.manage` may enter for others); a viewer on a team does not enter
  time; a project that is draft, on hold, closed or cancelled does not take it;
  time goes on a leaf task (log it on a sub-task). A person has one running timer:
  starting another stops the first. A timer that ran under a minute leaves
  nothing; a stopped one becomes an ordinary open entry (its day is the day it
  started, in UTC).
- **Cost** is the person's hourly cost on that day: their own rate on the
  project; else the rate card (`projects.staff_rates`, by date); else HR pay —
  the salary structure in force, a year's pay over the setting's working hours;
  else the project's, then the organisation's default (setting `costRateSource`
  says rate card or HR first). The **bill rate** is the person's on the project,
  else the rate card's, the project's default, the organisation's. Rates in
  another currency than the project's are not used. The rate and the amount are
  **kept on the entry** and looked at again when the week is sent, so a card
  changed later re-costs nothing approved (`costing.logic.ts`). Cost and bill
  amounts are shown only to those who hold `projects.costs.view` or
  `projects.billing.read`.
- **The weekly timesheet** (`TMS-…`, taken at submission) holds a person's week
  (Monday to Sunday, or as the setting says). It is **open** while filled,
  **submitted** (no running timer, at least one entry), then **approved** (time
  locked, counted as approved on its projects, `Timesheet-approved` and one
  `TimeEntry-approved` per entry announced) or **rejected** (back to its owner
  with a note, corrected, sent again). Approval goes through the shared engine:
  a policy for the type `project-timesheet` can condition on the week's cost,
  hours, billable hours, overtime hours (over 40) and the person's department;
  with no policy the week is approved at once. The person who sent a week never
  approves it through the engine (segregation of duties) nor by the direct route.
  An owner may withdraw a week that waits; an approver may **reopen** an approved
  week that has not been invoiced (with a reason). Locked time is never edited.
- **Importing time** (`POST /time-entries/import`, or the event
  `timeclock.job-time.recorded` on `commerce.projects.v1`): fields `sourceRef`
  (the source's own id: the same id is imported once), `staffId`, `projectId`,
  optional `taskId`, `workDate`, `minutes`, optional `note`. The entry is made open
  in the person's week for them to check, submit and have approved; a record the
  week cannot take (submitted or approved week, project not taking time) is
  reported, not lost silently. The Go timeclock service publishes the event; the
  ERP subscribes (`TimeclockImportListener`).
- **My week** (`GET /me/timesheet`): the sheet, my entries, the running timer, and
  the projects I may enter time on. Time on one's own projects needs no
  permission beyond being on the staff.

### Data

Migration `1782700000200-projects-time`: `projects.timesheets`,
`projects.time_entries` (one running timer a person, one import per source
reference), and numbering rules for `projects` and `project-timesheet` for the
organisations that exist. Counters kept by the commands: `projects.logged_minutes`,
`projects.approved_minutes`, `project_tasks.logged_minutes` (and of every parent).

### API

| Method | Path | Permission | What it does |
|---|---|---|---|
| GET | `/me/timesheet` | own | my week |
| POST/PATCH/DELETE | `/me/time-entries[/:id]` | own (manage: others) | enter, change, remove time in an open week |
| POST/DELETE | `/me/timer/{start,stop}`, `/me/timer` | own | the timer |
| POST | `/me/timesheets/:id/{submit,withdraw}` | own | send the week; take it back |
| GET | `/project-timesheets`, `/project-timesheets/:id` | `projects.time.read` or `.approve` (owner: own) | weeks, newest first (keyset) |
| POST | `/project-timesheets/:id/{approve,reject,reopen}` | `projects.time.approve` | decide where no policy is in review |
| GET | `/time-weeks/:staffId` | `projects.time.read` | someone's week |
| GET | `/projects/:id/time` | `projects.time.read` | a project's time (keyset) |
| POST | `/time-entries/import` | `projects.time.manage` | import time, once per `sourceRef` |
| GET/POST | `/project-rates` | `projects.rates.view` / `.manage` | the rate card |

### Events

`TimeEntry-created/updated/deleted`, `Timesheet-created/updated` (live),
`Timesheet-submitted`, `Timesheet-approved`, `Timesheet-rejected`,
`TimeEntry-approved` — contracts in `common/modules/events/contracts.ts`; every
payload carries `organizationId`.

## Step 4 — what projects earn and cost

### What it does

- **Invoices from approved time.** Approved, billable, not yet billed time becomes a **draft sales
  invoice with SERVICE lines** (`item_type = 'SERVICE'`, optionally a chosen service item for the
  income account and tax): one line for each task, person, day or the whole project (setting
  `invoiceGroupBy`) and for each distinct bill rate, in hours at the rate. The invoice goes through
  sales' own approval and posting. The time is marked invoiced (with the invoice), so it is billed
  once; **cancel or void the invoice and its time, costs and schedule items are billable again**.
  Time with no bill rate is never billed at nothing: the request stops and says how many entries
  lack one (or goes on without them). Only a project billed by time (time and materials, or not yet
  said) is invoiced by time; fixed price and milestones are billed by the schedule; non-billable
  invoices nothing. Time that will not be billed is **written off** with a reason.
- **The schedule.** A fixed price (or milestones) is billed by **items**: an instalment (an amount or
  a share of the contract value, from a date) or an amount tied to a **milestone**. An item is ready
  by its date, or when its milestone is achieved (and accepted, where the milestone needs it and the
  setting asks). The schedule may not pass the contract value. Invoicing an item makes a draft with
  one service line.
- **Retainers and prepayments.** A prepayment (or a retainer, an amount each period) is **funded by
  an invoice**, drawn up from the project; the money counts once that invoice is **issued**
  (approved, posted, paid), and is released if it is cancelled. Approved billable time on a project
  with a balance is **drawn from it first** (setting `retainerDrawsFirst`): whole entries, in date
  order, up to the first the balance does not reach; they become `covered` (earned when drawn) and
  only the rest is invoiced. Closing a retainer releases what is left.
- **Costs.** A supplier bill, a purchase order or an expense claim can be **tagged** to a project
  (or a cost typed in); expense claims that name the project in their own project field count
  without tagging. A posted bill and an approved claim are spent; a sent purchase order is
  *committed*; documents in another currency than the project's are left out and counted. A cost
  can be **passed on** to the customer (with the setting's mark-up) on its own draft invoice.
- **Profitability** (`GET /projects/:id/profitability`, `projects.profitability.view`): revenue
  (issued invoices of time, milestones, schedule, costs and time drawn from retainers; drafts are
  *pipeline*), cost (approved labour at the rate kept on each entry, expenses, bills, other costs;
  labour still waiting for approval is shown apart), margin and its percent, what a fixed price has
  *earned* by progress, **budget burn** (hours and money against the budget, ok / near / over by the
  setting), the **pace** over the last four weeks and the date the hours run out at it, and a
  **forecast**: cost at completion (spent plus the remaining estimate at the average cost an hour; else
  by progress; else the budget) and revenue at completion (the contract value; for time and materials
  what is billed and waiting plus the hours to go at the average bill rate). `GET /project-portfolio`
  lists open projects against their hours and the organisation's billable utilisation.
- **KPIs** in the analytics registry (module `projects`): projects under way, over their hours,
  budget burn, billable utilisation, project profitability (labour margin) and time waiting to be
  billed. The money ones also need `projects.profitability.view`.
- **Close gates** now know the money: a completed project closes once all time is approved and, where
  the setting says, all billable time and the schedule are invoiced.

### Data

Migration `1782700000300-projects-money`: `projects.billing_items`, `projects.project_invoices`
(the revenue side, and the way back from an invoice), `projects.project_costs`,
`projects.retainers`, `projects.retainer_movements`.

### API

| Method | Path | Permission | What it does |
|---|---|---|---|
| GET | `/projects/:id/profitability`, `/project-portfolio` | `projects.profitability.view` | profit, burn, forecast; the portfolio |
| GET | `/projects/:id/billing/unbilled`, `…/invoices` | `projects.billing.read` | what waits; the invoices drawn up |
| POST | `/projects/:id/billing/invoice-time`, `…/invoice-costs` | `projects.billing.invoice` | draft invoices |
| POST | `/projects/:id/billing/write-off` | `projects.billing.manage` | write time off |
| GET/POST | `/projects/:id/billing/schedule` | read / manage | the schedule |
| PATCH/DELETE | `/project-billing-items/:id` | manage | change or call off a planned item |
| POST | `/project-billing-items/:id/invoice` | invoice | invoice a ready item |
| GET/POST | `/projects/:id/retainers`; POST `/project-retainers/:id/{fund,close}` | read / manage / invoice | retainers |
| GET/POST | `/projects/:id/costs` (`projects.costs.view` / manage); PATCH/DELETE `/project-costs/:id` | | costs |

### Events

`ProjectInvoice-created` (bespoke), `ProjectBilling-created/updated`, `ProjectCost-*`. The module
listens to `ArInvoice-updated` for its own invoices.

## Step 5 — the screens, live, and how it is checked

- **Web** (`features/projects`): *Projects* (a keyset list with a strip of counts, filters and *New
  project* in a modal, from a template if wished), a project page with tabs — *Overview* (progress,
  hours and budget burn, margin and forecast for those who may see profit, the team, milestones with
  *Achieved / Accept / Turn back*, comments and the feed), *Tasks* (a board with columns, WIP counts,
  drag or a menu on each card, and a list; a drawer for one task with checklist, assignees, what it
  waits for, parts, talk and files), *Time*, *Billing* (what waits and the invoice it would make,
  the schedule, retainers, costs, invoices) and *Files* (Drive references and the project's
  workspace) — *My tasks* and *My timesheet* (in the user menu: a week grid, a timer, send the week),
  *Timesheet approvals* and *Projects settings* (rate card, templates, the way to the settings).
- **Live over `/live`, no polling and no refresh buttons.** Every list and page follows the entity
  rooms (`Project`, `ProjectTask`, `TimeEntry`, `Timesheet`, `ProjectMilestone`, `ProjectComment`,
  `ProjectBilling`, `ProjectCost`); a person's own time, week and tasks follow their *own* room
  (`ProjectsOwnLive` tells the owner of an entry, a week, or the people a task is given to). A failed
  load keeps *Try again*; `<ui-live-status>` shows Live / Reconnecting / Offline · Retry. The only
  clock is the running timer's elapsed time, which reads nothing from the server.
- **Importing time from the timeclock.** The Go timeclock service publishes
  `timeclock.job-time.recorded` on `commerce.projects.v1` — `organizationId`, `sourceRef` (its own
  id for the record: the same id is imported once), `staffId`, `projectId`, optional `taskId`,
  `workDate` (`YYYY-MM-DD`), `minutes`, optional `note`. The ERP's `TimeclockImportListener` makes an
  open entry in that person's week, costed like any other; a record the week cannot take (submitted
  or approved) or a project that takes no time is logged, not silently lost. The same import is
  `POST /time-entries/import` (≤ 500 rows; `projects.time.manage`).

### Limits (known)

- Profitability sums a project's entries on read: fine for thousands of entries a project; a
  maintained summary table is the performance pass's job.
- A week that waits for approval under a policy is decided in the approvals inbox; the direct
  approve/reject routes answer 409 while a request is in review.
- Retainer periods are invoiced by a person (*Invoice to fund it*), not by a schedule job.
- No notification subjects for task assignment or mentions yet (the events exist; comments hold the
  mentioned user ids).
- Cost rates from HR are one salary structure in force (base salary), not allowances or overtime.
- Time is entered in UTC dates; the person's time zone is not applied to a timer started near midnight.

### Stock to a project (17 October 2026)

Part of "inventory into work and assets". A service, installation or manufacturing project takes **items from stock at what they cost there** and gives back what it did not use:

- `POST /projects/:id/stock/issue` and `/return` (`projects.stock.issue`; owners, administrators, managers and the *Project manager (services)* role), `GET /projects/:id/stock` (`projects.costs.view`), `GET /project-stock-items?search=` (items with stock **free to take** — not held for work orders, not waiting out of sale — and where each is held).
- Each is a **stock movement charged to the project** (`ProjectIssue` / `ProjectReturn`; `stock_movements.project_id`): Dr project materials (`project_materials`, 5500, falling back to cost of sales), Cr stock, **both lines under the project's value in the ledger's Project dimension**; and one of the project's **costs** of the kind `stock` (`project_costs`: the movement, the item, the place, the base quantity — negative for a return — the task, and an amount that is stock's value of the movement to the cent). Never a figure typed beside it.
- A **return** takes off what the project is charged for the item (its net issues, averaged) and is received back at that cost; more cannot come back than is charged. A cost from stock is never removed: the stock goes back instead. A cost may be **passed on** to the customer like any other (`billable`).
- A draft, on-hold, closed or cancelled project takes no stock.
- **Profitability** (`figures.materials`) counts the net materials in the project's cost, its **budget burn** and its **forecast**.
- Web: the project's **Materials** tab (issue with a search over what is free, give back, the total charged), following the project live.

Tests: `logic/stock.logic.spec.ts` (when stock is refused, what a return takes off, cents), `logic/profitability.logic.spec.ts` (materials in cost, burn and forecast), `stock-ledger.logic.spec.ts`; `npm run projects:drill` (four cables issued at 4 × 40, the journal read back under the project's dimension, profitability, refusals, a return, everything back). Deferred: e2e route specs, tenancy sweep for `/api/v1/projects/*/stock`, Cypress.

### The screens rebuilt from the v3 boards (19 October 2026)

The Projects module's screens were rebuilt from `erp4c-projects-*`, `erp4c-project-*`, `erp4c-timesheet*` and
`erp4c-phone-timesheet` (lane `feature/screens-operations-people`; inventory `design-handoff/feature-inventory/projects.md`).
What the API gained, all additive:

- **`GET /projects/overview`** (`projects.projects.read`) answers the module's home: `byStatus`, `late`, `overHours`
  (and `overBudget`, its old name), `underway`, `planning`, `startedThisMonth`, the first projects past their end
  date and over their hours, `timesheetsWaiting {count, oldestDays}`, `toInvoice {hours, entries, first}`,
  `awaitingAcceptance {count, first}`, `noManager {count, first}`, `utilisation` (the month so far: billable,
  internal and unapproved hours, the share against last month's), `topBurn[]` (five open projects by share of their
  hours used), `nearBudgetPercent` (the setting) and `timeToBill`: **only for those who hold
  `projects.profitability.view`**, else `null` (the hours are in `toInvoice`). `timeToBill` is the money of approved
  billable time not yet invoiced on projects billed by time, plus the schedule items that are ready (an instalment
  that has fallen due, a milestone achieved and, where the setting asks, accepted), in the books' currency, with
  `trend[14]` (what was approved each of the last 14 days) and `projection {by, amount}` (what waits now plus the
  average approved a day for the days left in the month, if nothing is invoiced: a projection, said as one).
  *Late* means planning or active and past the end date; *over their hours* counts hours **logged** (the list's
  "Over its hours" counted the same; the old overview counted approved hours).
- **The pushed summary `project.summary`** (`@modules/projects/definitions/project-summary.metric.ts`, registered in
  the metric registry) carries the same figures **without money or the setting**: it is cached once for everyone who
  reads projects, so nothing in it depends on who looks. A change to a project, a milestone, a week or its time makes
  it stale. The page follows it over `/live` and reads `GET /projects/overview` again, a moment after a push, for the
  money and the setting.
- **`GET /projects`**: the first page also answers `counts {all, open, late, mine}` computed from the same
  conditions as its rows (the status, type, billing, search and place filters are applied; the three pills are
  counted, never filtered by); new filters `overHours` and `noManager`. `GET /projects/rules` (any reader of
  projects) gives the few rules a screen explains itself with: the four start rules, `nearBudgetPercent`,
  `defaultStages`, `maxHoursPerDay`, `weekStartsOn`. `GET /projects/:id` carries `nextMove` (the step forward along
  the line, with `blockers[]` = its `problems`).
- **`GET /project-timesheets`** (and the detail): every week has `flags[]` (`over_daily_limit`, `over_hours`,
  `no_task`, `future_entry`) and `hoursByDay[7]`; a day is read once for the whole page, never a read for each week.
  A week is *over hours* above 50 (`WEEK_FLAG_HOURS`); the daily limit is `maxHoursPerDay`. The first page carries
  `counts` by status under the person and week filters. `GET /me/timesheet` also carries `today` and `limits` (the
  daily limit, future entries, the lock, whether a task or a note is required, the rounding) so a cell can refuse a
  length as it is typed. **`GET /me/timer`** answers the person's running timer or `null` (no permission; null for
  someone not on the staff): the chip in the app bar asks it on every page.
- Saved views: the list key `projects.all` is registered (`list-registry.ts`).
- Tests: `logic/overview.logic.spec.ts`, `logic/timesheet.logic.spec.ts` (flags, hours by day),
  `logic/service-lifecycle.logic.spec.ts` (`nextMoveOf`), `repositories/projects-overview.repository.spec.ts` and
  `projects-list-counts.spec.ts` (what each query asks for: the organisation in every one, every parameter named,
  the places and a project at no place, the pills counted under the other filters), `projects.permissions.spec.ts`.
  Not run: an e2e or a drill for the new reads (deferred to CI; no new write path).

### How to run what exists

- Unit: `env -i PATH="$PATH" HOME="$HOME" npx jest --maxWorkers=1 src/modules/projects` (lifecycle, board,
  cursors, shared dependency and roll-up rules, rates and money, the week, invoicing, profit and forecast).
- Drill: `QUEUE_PREFIX=drill-projects TS_NODE_PROJECT=$PWD/tsconfig.json npm run projects:drill`
  (needs the test organisation: `npm run test:org`; the whole path from a project to a draft invoice
  and a cancelled one). Run it, and `manufacturing:drill`, on a scratch database: the projects tables
  are shared with manufacturing.
- Migration: on a scratch database (schema-only dump of the dev database, then
  the pending migrations) — never `migration:run` in the worktree.
