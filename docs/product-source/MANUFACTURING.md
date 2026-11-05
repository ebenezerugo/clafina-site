# Manufacturing: projects, production and the shop floor

ROADMAP Phase 11, in nine steps. The source is the user's *Manufacturing
Project & Production Management Platform* document (untracked, in this
folder). Manufacturing is the orchestration layer: stock, procurement,
finance, HR, asset management and the Drive stay the systems of record, and
manufacturing reaches them through ports (`src/modules/adapters/`).

| Step | What | State |
|---|---|---|
| 1 | What is made, and how: bills of materials, routings, work centres, product lifecycle, engineering change | **built 11 October 2026** |
| 2 | Plants and resources: plants, lines, work centre capacity and calendars, machines and their state, tools, people and skills | **built 11 October 2026** |
| 3 | Projects: lifecycle, phases, milestones, deliverables, nested tasks and dependencies, risks, changes with versions, comments | **built 11 October 2026** |
| 4 | Production planning: production orders, work orders, the planning engine, materials held and short, whether a date can be met | **built 11 October 2026** |
| 5 | Scheduling: the finite-capacity scheduler, maintenance and breakdowns, people, the board, moves, critical path, scenarios | **built 11 October 2026** |
| 6 | The shop floor: the operator's screen, stock that moves with the work, scans and labels, offline sync, the dashboard | **built 11 October 2026** |
| 7 | Quality: inspection plans and inspections (incoming, in process, final), defects, gates, non-conformance reports and corrective actions, traceability both ways | **built 11 October 2026** |
| 8 | Cost and the ledger: what a work order cost from what happened, work in progress in the books, completion clearing what is left, project budgets, forecast and earned value, profitability | **built 11 October 2026** |
| 9 | Automation, alerts and analytics: shortage, delay and breakdown automations; dashboards, KPIs, reports and alerts on the analytics platform; roles; the audit trail with where a change came from; events; search within the plant | **built 11 October 2026** |

## Step 1: what is made, and how

Code: `src/modules/manufacturing/` (`engineering/` with `use-cases/`,
`controllers/`, `services/`, `repositories/`, `dtos/`, plus the pure rules in
`bom.logic.ts`, `routing.logic.ts`, `lifecycle.logic.ts`) and the ports in
`src/modules/adapters/manufacturing/` (the item catalogue, and people and
partners: HR competencies, suppliers). Every operation is one use case; the
controllers call nothing else; every query is in a repository and names
`organization_id`.

### Bills of materials

- A **bill** (`BOM-…`) belongs to one product (a variant) and has
  **versions**. A version is a **draft** (lines changed freely), then
  **released** from a day; the version in force ends the day before the next
  begins. A released version is never changed: a new version is drawn up from
  the last (one draft at a time).
- **Lines**: a component, a co-product or a by-product; the quantity in the
  item's unit (stock sums base quantities, UNIT_OF_MEASURE.md); a **scrap
  percent** for components (more is drawn than the bill says); **alternatives**
  (a group, ranked: the first is drawn, the others offered); the **operation**
  at which the material is drawn; optional lines; a **cost share** for
  co-products.
- **Kinds**: *standard* (made and stocked) and *phantom* (read through into
  the bill above, never made on its own).
- **Checks** before release (`POST …/check` lists them, release refuses
  them): at least one component; no repeated product in a loop; no more levels
  than the setting; co-product shares add up to 100% (setting); alternatives
  ranked differently; stock types suit their place (setting).
- **Explosion** (`GET boms/explode/:variantId?quantity&on`): what a quantity
  needs to every level on a day, with scrap, through phantoms, with the
  assemblies to make first, the co-products and by-products made, the
  materials at today's stock cost, and a loop reported rather than followed.
  **Where used** (`GET boms/where-used/:variantId`) is the reverse.
- A bill can be tied to one plant; a person whose role covers only some plants
  sees and changes only theirs (`ManufacturingScope`, over `LiveAccessService`
  and `user_location_roles`); a bill with no plant is the whole organisation's.
- **Retire**, never delete: a retired bill leaves its product to be bought.

### Routings and work centres

- A **routing** (`RTG-…`) is for a product, optionally goes with a bill, and
  has versions like a bill. Its **operations** are numbered (10, 20…), each
  with a work centre, setup (once), run (per unit), queue, move and inspection
  minutes, crew size, work instructions, the **skills** it needs (HR
  competencies, with a lowest level) and the **tools** it uses.
- An operation can be **subcontracted**: it names a supplier, the charge per
  unit and the days away, and has no work centre. (Raising the purchase order
  is step 4.)
- `GET routing-versions/:versionId/times?quantity` works out the work, the
  labour and the start-to-finish time of a quantity, the days away and the
  subcontracting cost.
- **Work centres** (`/manufacturing/work-centres`) are the places work is
  done: a code, a name, an optional plant and line. Retired, never deleted;
  a retired one cannot be named by a release. Step 2 grows them into plants,
  lines, capacity, calendars, machines and rates.

### Product lifecycle, revisions and change

- A product moves **concept → engineering → bill → routing → approval →
  released**, one stage at a time; each move asks for what the stage before
  made (a bill with components; a routing with operations), says so when it
  refuses, and is kept as an event. *Obsolete* ends it.
- A **revision** (`REV-…`, code A, B…) is a release package: one draft bill
  version and, optionally, one draft routing version, released **together**
  once checked (bill lines drawn at an operation the routing lacks stop it).
  It goes through the approval engine when a policy covers it
  (`product-revision`), is released at once when none does, and supersedes the
  one before. **An order stays tied to the version that was released with
  it**: later steps read the revision's versions, never "the latest".
- An **engineering change** (`ECR-…`) asks for a change to a product: the
  reason, the impact, what changes, the priority and the day it is wanted from.
  Drafted, submitted (through the approval engine, `engineering-change`),
  approved or rejected, called off by its requester or an administrator,
  implemented (a drawings-only change is marked done; any other is implemented
  by the revision that carries it). Once a product is released, a new
  revision needs an approved change (setting).
- **Drawings and specifications live in the Drive.** A product, bill, routing
  or change links files by their Drive document; each link is **pinned** to the
  version it was made at, says when a newer one is out, and can be moved to the
  current version by hand. A file removed from Drive shows as missing.

### Data

Schema `manufacturing` (migration `1780600300000-manufacturing-engineering`),
every table keyed by `organization_id` first, no deletes:
`work_centres`, `boms`, `bom_versions`, `bom_lines`, `routings`,
`routing_versions`, `routing_operations`, `routing_operation_skills`,
`routing_operation_tools`, `engineering_changes`, `engineering_change_items`,
`product_lifecycles`, `product_lifecycle_events`, `product_revisions`,
`document_links`, and `audit` (every change with what it was and what it
became, shown as each page's history). Numbers come from the numbering rules
`BOM`, `RTG`, `ECR` and `REV`.

### API

All under `/api/v1/manufacturing`, every route behind a permission.

| Route | |
|---|---|
| `boms` (GET list, POST), `boms/:id` (GET, PATCH), `boms/:id/versions` (POST new version), `boms/:id/retire`, `…/reinstate` | bills |
| `bom-versions/:versionId` (GET, PUT `lines`), `…/check`, `…/release` | a version |
| `boms/explode/:variantId`, `boms/where-used/:variantId` | read the bills |
| `routings` (GET, POST), `routings/:id` (GET, PATCH), `…/versions`, `…/retire`, `…/reinstate` | routings |
| `routing-versions/:versionId` (GET, PUT `operations`), `…/times`, `…/check`, `…/release` | a version |
| `work-centres` (GET, POST), `work-centres/:id` (GET, PATCH), `…/retire`, `…/reinstate` | work centres |
| `changes` (GET, POST), `changes/:id` (GET, PATCH), `…/submit`, `…/cancel`, `…/implement` | engineering changes |
| `products` (GET), `products/:variantId` (GET), `…/start`, `…/stage`, `…/revisions` | lifecycle |
| `revisions/:id` (GET), `…/check`, `…/submit`, `…/discard` | a revision |
| `documents/:entityType/:entityId` (GET, POST), `document-links/:linkId` (DELETE, `…/repin`) | drawings |
| `lookups/items`, `lookups/competencies` | pickers |

### Permissions (seed v61)

`manufacturing.boms.{read,create,update,release}`,
`manufacturing.routings.{read,create,update,release}`,
`manufacturing.work-centres.{read,create,update}`,
`manufacturing.changes.{read,create,update}`,
`manufacturing.lifecycle.{read,update}`. Owners and admins hold all of them,
managers read and create (draw up bills, routings, work centres and change
requests; changing, retiring and releasing are not theirs by default), viewers
read. Releasing is separate from drawing up so that policy can keep them apart.

### Settings (Settings → Documents)

| Document | Settings |
|---|---|
| Bill of materials | deepest level read (12); scrap a component starts with; a version may take effect on a later day; co-products must share the cost in full; stock types must suit their place; release only as part of a revision |
| Routing | every operation names its work centre; has a run time; a subcontracted operation names the supplier; materials are drawn at operations that exist; the last operation is an inspection |
| Engineering change | a released product changes only through an approved request; a reason; the impact; implemented within (30 days, shown late after) |

### Events, live updates, notifications, approvals

- Outbox aggregates `Bom`, `BomVersion`, `Routing`, `RoutingVersion`,
  `WorkCentre`, `EngineeringChange`, `ProductRevision` (`created`/`updated`,
  the payload carrying `organizationId`, `entityId`, `status`,
  `previousStatus` and the place). All are in `LIVE_ENTITIES`, so the lists and
  pages follow them.
- Notification subjects `EngineeringChange` and `ProductRevision`; rules
  every organisation starts with: *Your change request was approved / rejected*
  (to whoever raised it) and *A product revision took effect* (to those who read
  the lifecycle). Asking for a decision, overdue and decided are the approval
  engine's own rules.
- Approval document types `engineering-change` (facts: kind, priority) and
  `product-revision` (facts: first release, made for a change request) are in
  the policy preview, so a policy can be drawn on them.

### Screens (web, `/manufacturing`)

Product lifecycle (list; a product's stages, moves with the reason one is
refused, revisions, bills and routings, drawings, history), Bills of materials
(list; a bill's versions, the lines editor, check, release, what a quantity
needs, drawings, history), Routings (list; the operations editor with skills
and tools, the time a quantity takes), Work centres, Engineering changes (list;
a change's steps and drawings). Lists use `ui-list-state`; creating opens a
modal; row actions are one menu; axe passes.

### Tests

- Unit: `npx jest src/modules/manufacturing` (45: the bill rules, explosion,
  routing times, lifecycle).
- Endpoint: `QUEUE_PREFIX=e2e-mfg npx jest --config ./test/jest-e2e.json --forceExit manufacturing-engineering` (33).
- Drill (live, the test organisation, probes retired after):
  `QUEUE_PREFIX=drill-mfg TS_NODE_PROJECT=$PWD/tsconfig.json npm run manufacturing:drill`.
- Tenancy sweep: `TENANCY_ROUTES=/api/v1/manufacturing/ npx jest --config ./test/jest-tenancy.json --forceExit`.
- Web: stubbed `cypress/e2e/manufacturing-engineering.cy.ts` (11, axe on
  every screen and dialog); live `cypress/e2e/live/manufacturing-engineering.cy.ts`.

### Known limits

- Alerts for late changes and the manufacturing analytics module come with
  step 9 (the analytics module list has no manufacturing entry before it).
- Raising purchase orders for subcontracted operations is step 4.

## Step 2: plants and resources

Code: `src/modules/manufacturing/resources/` (same layers as step 1; pure
rules in `calendar.logic.ts`, `machine-state.logic.ts`, `skills.logic.ts`)
and, in the people-and-partners port, what is read of HR: staff, their
certificates (HR → Compliance), shifts, holidays, shift assignments and
approved leave. HR stays the system of record for all of it.

### The hierarchy

Organisation → plant → production line → work centre → machine (§6). A
**plant** is one of the organisation's locations (`tenant.locations`);
manufacturing adds only a short code, a kind (plant, warehouse, workshop), a
manager and notes (`PUT /manufacturing/plants/:locationId` registers a
location). An unregistered location is still listed and usable. A **line**
belongs to a plant (`production_lines`, code unique within it); a work centre
stands on a line **of its own plant**. Plants, lines, work centres, machines
and tools are all retired, never deleted; a plant or line is retired only when
nothing active stands in it, a work centre only when it has no active machines.
Step 1's free-text line on a work centre became a real line (the migration made
lines of the names it found).

### Work centres

Grown from step 1's registry: **capacity** (how many it can work on at once),
**efficiency %**, a **utilisation target %**, **cost rates** per hour (labour,
machine, overhead), whether it **works on public holidays**, a line, and its
machines. Moving a work centre to another plant takes its machines with it, drops
its line (unless a new one is named) and is refused while routings use it.

**Calendar** (`/work-centres/:id/calendar`): its own weekly hours (several
windows a day, a break taken off), the **HR shifts** it runs on chosen weekdays,
and exceptions — **closed** days or **extra hours**. `GET …/calendar/plan?from&to`
works out each day (up to 62): windows that overlap or touch count once with
the longest break off; a night shift's tail past midnight belongs to the next day
unless the day it began on was closed; an HR holiday (organisation-wide or at the
plant) closes the regular hours unless the centre works on holidays — extra hours
still count; a closed exception closes everything; capacity minutes = work minutes
× capacity × efficiency. This is what step 5's scheduler reads.

### Machines

`MCH-…` numbered (or a number given), each in a work centre (a setting allows
standing alone at a plant) and so at its plant; make, model, serial, capacity per
hour, operating cost, in-service date and an optional `assetId` (the Phase 10
asset register; no foreign key, that register is another module's). Its **state**
(available, running, idle, setup, maintenance, breakdown, offline, reserved) is
**kept as events**: changing it closes the open event and opens the next, from
now or a past moment (never before the state it follows, never in the future).
Settings can require a reason for downtime and make a machine that was down
**available first** before it sets up or runs. Availability (planned time less
maintenance and breakdown) and utilisation (running plus setup over the time it
could work) are read off the events over the last N days — never stored. Taking a
machine out of use puts it offline with a reason; bringing it back makes it
available. A routing operation may name the machine it is done on (one of its
work centre's); a release is refused if one named is out of use.

### Tools

`TLN-…` fixtures, dies, gauges: type, serial, quantity, where kept (work centre
or plant), state (available, in use, maintenance, lost), a calibration due date
and interval. Standing is worked out: *ok*, *due* (within the warning days) or
*overdue*; `POST …/calibrated` sets the next due date. A routing operation's tools
may be chosen from the register (name taken from it) or named freely as before.

### People

HR keeps the person. Manufacturing keeps a **profile** (`staff_profiles`): role
(operator, engineer, supervisor, inspector, technician), home work centre, the most
hours a day and a week (else the organisation's), a cost rate, whether on the floor;
and **skills** (`staff_skills`): an HR competency held at a level 1–10 (HR keeps
only review competencies, not who holds which). **Certificates** are HR's
compliance records of kind certification, shown with how far they have run
(valid, running out, expired). `GET people/qualified?skills=id:3,id` lists who holds
every skill at its level (optionally at one work centre; a setting leaves out
people with an expired certificate). `GET people/:id/availability` gives each day's
rostered shifts, holiday and approved leave.

### Data

Migration `1780600400000-manufacturing-resources`: `plants`, `production_lines`,
`work_centre_hours`, `work_centre_shifts`, `work_centre_exceptions`, `machines`,
`machine_state_events` (one open event per machine), `tools`, `staff_profiles`,
`staff_skills`; new columns on `work_centres`; `machine_id` on
`routing_operations`, `tool_id` on `routing_operation_tools`. Numbering `MCH`, `TLN`.

### API (all under `/api/v1/manufacturing`)

| Route | |
|---|---|
| `plants` (GET), `plants/:locationId` (GET, PUT register), `…/retire`, `…/reinstate` | plants |
| `lines` (GET, POST), `lines/:id` (GET, PATCH), `…/retire`, `…/reinstate` | production lines |
| `work-centres/:id/calendar` (GET), `…/calendar/plan`, `…/calendar/hours` (PUT), `…/calendar/shifts` (PUT), `…/calendar/exceptions` (POST), `…/calendar/exceptions/:exceptionId` (DELETE) | calendars |
| `machines` (GET, POST), `machines/overview`, `machines/:id` (GET, PATCH), `…/state` (POST), `…/events`, `…/summary`, `…/retire`, `…/reinstate` | machines |
| `tools` (GET, POST), `tools/:id` (GET, PATCH), `…/calibrated`, `…/retire`, `…/reinstate` | tools |
| `people` (GET), `people/staff`, `people/qualified`, `people/:staffId` (GET, PUT), `…/skills` (PUT), `…/availability` | people |
| `lookups/shifts` | the shifts HR keeps |

### Permissions (seed v62)

`manufacturing.plants.{read,update}` (plants and lines),
`manufacturing.machines.{read,create,update,state}`,
`manufacturing.tools.{read,create,update}`, `manufacturing.people.{read,update}`;
work centre capacity, rates and calendars stay under `manufacturing.work-centres.*`.
`machines.state` is its own so people on the floor can say what a machine is doing
without being allowed to change it. Owners and admins hold all; managers read and
create; viewers read.

### Settings (Settings → Documents → Plants and resources)

Every machine in a work centre; every work centre on a line (off); downtime needs a
reason (on); a machine that was down is made available before it works (on);
holidays close work centres (on); utilisation window (7 days); tool calibration
warning (14 days); certificate warning (30 days); leave out people with an expired
certificate (off); most hours per day (10) and week (48) for people without limits
of their own.

### Events, notifications

Aggregates `Plant`, `ProductionLine`, `Machine`, `Tool`, `MfgPerson` (and
`WorkCentre` for calendar changes), all live entities. Every state change announces
`Machine-updated` with the new state and `previousStatus`. Notification subject
`Machine` and a starting rule *A machine broke down* (to those who read machines at
its plant, with the reason).

### Screens

Plants (list with set-up dialog; a plant's lines, work centres and machines as a
tree, tools, history), Work centres (list with the full make/change dialog; a detail
page with overview, **calendar editor** — weekly hours, shifts, closed days and
extra hours, and the next two weeks worked out — machines, history), Machines (list
with a count by state; detail with state, availability, utilisation, history and the
change-state dialog), Tools (list, calibration), People (list, add; detail with
profile, skills editor, certificates, the next two weeks). The routing editor now
chooses a machine (of the operation's work centre) and tools from the register.

### Tests

Unit `src/modules/manufacturing/resources/*.spec.ts` (16: calendar, states,
skills); endpoint `test/manufacturing-resources.e2e-spec.ts` (24); drill step 2
checks in `manufacturing:drill`; stubbed `cypress/e2e/manufacturing-resources.cy.ts`
(10, axe on every screen and dialog) and live `cypress/e2e/live/manufacturing-resources.cy.ts`.

### Known limits

- Maintenance orders do not yet block machine time: that is step 5's scheduling with
  Phase 10 (a maintenance event can already be recorded as a machine state with
  source `maintenance`).
- Late-calibration and certificate alerts, and the resource analytics, are step 9.
- A person's availability shows rostered shifts, holidays and leave; checking it
  against the hours limits belongs to scheduling (step 5).

## Step 3: projects

Code: `src/modules/manufacturing/projects/` (same layers as steps 1–2; pure rules in
`project-lifecycle.logic.ts`, `task-rollup.logic.ts`, `dependency.logic.ts`, `risk.logic.ts`,
`project-change.logic.ts`) and, in the ports, what is read of the ledger's Project dimension
(`LEDGER_PROJECTS_ADAPTER`), customers and teams (people-and-partners) and stock on hand
(item catalogue `onHand`, from `projection.inventory_on_hand`).

### Projects and their life

A **project** (`PRJ-…`) has every field of §7: customer, type (manufacturing, custom build, new product
introduction, installation, expansion, engineering, other), manager and sponsor (HR staff), plant (a location, or
none: the whole organisation's), start, target and actual dates, priority, budget, estimated and actual cost, revenue,
profit (revenue less actual cost), progress and risk level (both kept from the tasks and risks beneath it), and
`hasProduction` (an installation or expansion has tasks, milestones and costs only).

Life (§8): **draft → planning → approved → scheduled → in production → quality review → completed → closed**, and
**on hold**, **blocked** (both come back to where they were) and **cancelled**. One step at a time; one step back to plan
again (approved or scheduled → planning) or to rework (quality review → in production); a project with no production
skips quality review. Each move says what it asks for (`gateProblems`, settings): a manager to plan; dates (and, if set,
a task) to send for approval; every open task planned to be scheduled; every task done or called off (and, if set,
every deliverable accepted) to complete; no change waiting (and, if set, no open risk) to close. Hold, block and cancel
take a reason. **Approval** (planning → approved) and **closure** (completed → closed) go through the approval engine
as one document type `mfg-project` (`processType` approval or closure; facts: budget, project type, risk level,
priority, customer, the manager's department); where no policy asks, they happen at once. The first task started in a
scheduled project puts it in production. After approval the budget, dates and `hasProduction` change only by an
approved **project change** (setting `lockPlanAfterApproval`, on).

**The ledger.** Each project is also a value of the organisation's Project dimension (`finance.dimension_value`; the
dimension is made if the organisation has none), kept in step: renamed with the project and taken out of use (never
deleted) when it is closed or cancelled. `dimension_value_id` is on the project.

### Phases, milestones, deliverables

Phases (the nine of §9 are the organisation's *standard phases*, a setting; `POST projects/:id/phases/standard`),
milestones (pending/achieved, never achieved in the future) and deliverables (a product and quantity or just a name;
planned → in progress → delivered → accepted or rejected; an accepted one's quantity moves only by a project change).
Nothing is deleted: a phase, milestone or deliverable is called off.

### Tasks and dependencies

A **task** (`TSK-…`) has every attribute of §10: type, priority, status (to do, in progress, blocked, done, called
off), planned and actual dates, estimated and actual minutes, team, assignee, work centre, machine, skills (HR
competencies with a lowest level), materials (item, quantity in its unit and in base units), progress, estimated and
actual cost. Tasks nest (§11): a task made of sub-tasks takes status, progress (weighted by effort), dates, effort and
cost from them (`rollup`), kept in step after every change; its own such fields are refused. Starting needs the project
approved (setting lets early tasks go ahead), finishing may not precede the start, and a task called off takes its
open sub-tasks with it. A person holding `manufacturing.tasks.progress` reports progress, starts, finishes and blocks
without being able to change the plan.

**Dependencies** (§12): finish-to-start, start-to-start, finish-to-finish, start-to-finish with lag or (negative) lead;
no loop, no link between a task and its own parts, within one project. With `tasksFollowDependencies` (on) planned
dates may not break a link (a drag, a schedule or a scenario in step 5 uses the same `scheduleViolations`), a task starts
only when what it waits on allows (links on a summary above it hold it too), and finish-to-finish / start-to-finish
hold the finish back. Conditions: *conditional*, *approval* and *quality* are signed off by someone holding
`manufacturing.tasks.release` (recorded, withdrawable); *material* is met by stock on hand at the project's plant
covering the quantity (`GET` shows `materialOk`). A removed link is kept (`removed_at`). `GET projects/:id/checks` lists
the links the plan breaks, the open tasks with no dates and those late.

### Risks, changes, comments, documents

**Risks** (`RSK-…`; §37): risk, issue, assumption, dependency, constraint; probability × impact (1–5 each) = score; an
issue has happened (probability 5); assumptions and constraints are not scored. The project's level is the worst live
(open, mitigating, occurred) risk, issue or dependency, banded by settings (5 / 10 / 15). **Changes** (`PCR-…`; §38):
scope, quantity, deadline, material, cost, bom, routing, other; reason, impact, new target date or days, new budget or
amount, a deliverable's new quantity, a link to an engineering change; draft → submitted → approved/rejected →
**implemented** (approval document type `mfg-project-change`, at once where no policy asks). Applying moves the date and
budget, sets the deliverable's quantity, raises the project's `version` and keeps a snapshot of it
(`project_versions`; version 1 is the project as drawn up). **Comments** (§40) on projects, tasks, risks, project
changes, purchase requisitions and maintenance orders (work orders and production orders joined with step 4; quality issues join with their step): replies, `@person@example.com` mentions (stored as user ids), edited by the author, taken down by the author or a
moderator (soft). Those concerned are told by the notification centre. **Documents** (§39): the Drive links of step 1
now also hang on a project, a task and a project change, with kinds CAD, purchase, inspection, safety, supplier and
delivery.

### Data

Migration `1780600500000-manufacturing-projects`: `projects`, `project_events`, `project_phases`,
`project_milestones`, `project_deliverables`, `project_tasks`, `project_task_skills`, `project_task_materials`,
`task_dependencies`, `project_risks`, `project_changes`, `project_versions`, `comments`; `document_links.kind` widened.
Numbering `PRJ`, `TSK`, `RSK`, `PCR`.

### API (all under `/api/v1/manufacturing`)

| Route | |
|---|---|
| `projects` (GET, POST), `projects/overview`, `projects/:id` (GET, PATCH), `…/move`, `…/submit`, `…/close` | projects |
| `projects/:id/plan`, `…/phases`, `…/phases/standard`, `phases/:id`, `…/milestones`, `milestones/:id`, `…/deliverables`, `deliverables/:id` | the plan |
| `projects/:id/tasks` (GET tree, POST), `projects/:id/checks`, `projects/:id/dependencies`, `tasks` (GET), `tasks/:id` (GET, PATCH), `tasks/:id/{start,complete,block,unblock,cancel,reopen,progress}`, `tasks/:id/{skills,materials}` (PUT), `tasks/:id/dependencies` (POST), `dependencies/:id` (PATCH, DELETE), `dependencies/:id/{sign-off,withdraw-sign-off}` | tasks |
| `risks` (GET, POST), `risks/:id` (GET, PATCH) | risks |
| `project-changes` (GET, POST), `project-changes/:id` (GET, PATCH), `…/submit`, `…/cancel`, `…/implement` | changes |
| `comments` (GET, POST), `comments/:id` (PATCH, DELETE) | comments |
| `lookups/customers`, `lookups/staff`, `lookups/teams`; `documents/:project\|task\|project-change/:id` | pickers, files |

### Permissions (seed v63)

`manufacturing.projects.{read,create,update,close}`, `manufacturing.tasks.{read,create,update,progress,release}`,
`manufacturing.risks.{read,create,update}`, `manufacturing.project-changes.{read,create,update,implement}`,
`manufacturing.comments.{read,create,moderate}`. Owners and admins hold all; managers read and create, and report
progress on tasks; viewers read. Plant scope as before: a project at a plant is seen and changed by those whose role
covers it; a project at no plant is the whole organisation's, read by all, changed by those with organisation-wide roles.

### Settings (Settings → Documents → Manufacturing projects)

Manager before planning (on); dates before approval (on); a task before approval (off); every open task planned before
scheduling (on); tasks done before completing (on); deliverables accepted before completing (off); no open risk at
closing (off); reasons to hold, block (on); tasks follow dependencies (on); tasks inside the project's dates (off);
budget and dates locked after approval (on); tasks may start before approval (off); the ledger project (on); risk bands
(5 / 10 / 15); the standard phases.

### Events, live updates, notifications

Aggregates `Project`, `ProjectTask`, `ProjectRisk`, `ProjectChange`, `MfgComment` (all live entities). Notification
subjects `Project`, `ProjectChange`, `ProjectTask`, `MfgComment`; starting rules: a project was approved; a project is
blocked or on hold; your project change was decided; a task was assigned to you; a task is blocked; someone commented on
your work. Policy preview types `mfg-project` and `mfg-project-change`.

### Screens (web, `/manufacturing`)

Projects (list with a key-figures strip; New project in a modal), a project (header with the next step, what is missing,
Actions; tabs Plan, Tasks, Risks, Changes, Documents, Discussion, History; a task opens in a drawer with dependencies and
sign-off, skills, materials, files and talk), Tasks (across projects, *Mine*, start and finish), the **Risk register**
(`/manufacturing/risks`: every risk, issue and assumption of every project, worst first, filtered by kind, status, score and
*still to watch*; a row opens its project or moves on — mitigating, accepted, happened, closed, reopened) and **Project
changes** (`/manufacturing/project-changes`: every change asked for, what it moves and where it stands; send for a decision,
call off, apply). Lists use `ui-list-state`; row actions are one menu; axe passes.

### Tests

- Unit: `src/modules/manufacturing/projects/*.spec.ts` (39: lifecycle and gates, roll-up, dependencies, risk, change).
- Endpoint: `QUEUE_PREFIX=e2e-mfg npx jest --config ./test/jest-e2e.json --forceExit manufacturing-projects` (37).
- Drill: `manufacturing:drill` (step 3 section: a project from draft to closed with a loop and a broken date refused).
- Tenancy sweep: `TENANCY_ROUTES=/api/v1/manufacturing/` (fixtures for a project, tasks, link, risk, change, comment).
- Web: stubbed `cypress/e2e/manufacturing-projects.cy.ts` (16, axe on each screen and dialog); live
  `cypress/e2e/live/manufacturing-projects.cy.ts` (written, not run).

### Known limits

- Costs on tasks are entered; costs from what happened (materials issued, labour, machine time) and the project's
  budget against committed and forecast came with step 8. `projects.actual_cost` stays the sum of task actual costs; `production_cost` is what its work orders cost, and the project shows both.
- The scheduler, critical path and Gantt are step 5; a project's tasks only carry dates for now.
- Production orders from a deliverable and shortage requisitions: built in step 4 (below).
- A task's tree is returned whole (a project of a few thousand tasks is fine; rolling up reads them all per change).

## Step 4: production planning

Code: `src/modules/manufacturing/production/` (same layers as steps 1–3; the engine's arithmetic is pure and has no database
in `planning.logic.ts`, `working-time.logic.ts` and `capacity.logic.ts`) and the ports it reaches the other modules through:
`src/modules/adapters/stock/stock-reservations.adapter.ts` (stock held for a work order), `adapters/manufacturing/procurement.adapter.ts`
(what is on order, supplier lead times, a draft requisition for a shortage, a draft purchase order for work sent out),
`sales-demand.adapter.ts` (a sales order's lines as demand) and the item catalogue (items below their reorder point). Stock,
procurement and sales stay the systems of record.

### Production orders (§14)

A **production order** (`PRO-…`) is planned demand for one product: a quantity (kept in the product's base unit, with what was
typed and its unit), the day it is needed by, a priority, the plant it is made at (stock for it is held there), and where the
demand came from — a **project deliverable** (`POST production-orders/from-deliverable`: the product and the quantity not yet
covered by other orders, the deliverable's due date), a **line of a sales order** (`…/from-sales-order`: confirmed or later; the
quantity not yet covered, the requested delivery date), a **plan** (made-to-stock replenishment, see *Suggestions*) or **by hand**
(optionally naming a project). Conversion only pre-fills: every field can be changed, and *Every production order comes from a
project, a sales order or a plan* is a setting (off). The demand is remembered (`demand_quantity`, `demand_date`), so an order
whose deliverable has since moved shows **demand changed**. Statuses: draft → planned → released → in progress → completed, or
called off (in progress and completed arrive with step 6). A project without production (an installation) takes no order, and a
closed or cancelled project takes none.

### The planning engine (§56)

`POST production-orders/:id/plan` works the order out, in this order:

1. **Demand and bill.** The bill of materials in force today is read to every level (`BomExplosionService`); phantoms are read
   through. The version used is pinned on the order (`bom_version_id`, `routing_version_id`, the day it was planned): **an order
   stays tied to the versions it was planned with**.
2. **Work orders.** One for the product, and one for each sub-assembly that stock cannot cover — what stock holds free is used
   first (`netSubAssembliesAgainstStock`, on), so 20 frames needed with 3 in stock means a work order for 17. Each work order
   carries the routing in force for its product, copied operation by operation with setup, run, queue, move and inspection times
   worked out for its quantity (`work_order_operations`), the sub-assembly it belongs under, the co- and by-products the bill
   makes, the inspections its routing asks for, and an estimated cost (materials at stock cost, operations at the work
   centre's hourly rates, work sent out at its charge).
3. **Materials.** Each work order's lines (`work_order_materials`) are the components of its bill with scrap. Free stock at the
   plant — on hand less what is already held for other work orders — is allocated line by line, the soonest needed first.
   Where the preferred component of a set of alternatives is short and an alternative is held in full, the alternative is drawn
   (`useAlternativesWhenShort`, on; the line remembers what the bill named). What cannot be covered is **short**, and is given a
   date it can be had by: from purchase orders still to arrive (approved, sent or part-received, ordered less received) as
   they land, then by buying — the item's preferred supplier's lead time (`supplier.items`), else
   `defaultPurchaseLeadDays` (14).
4. **Capacity requirement and the schedule.** Dates run **back from the day the product is needed** along each work centre's
   calendar (step 2: own hours, HR shifts, closed days, holidays; efficiency applied): operations follow one another, work sent
   out goes back by the days it is away, and a sub-assembly must be done by the time the operation that draws it begins. A work
   centre with no working hours set is taken as Monday to Friday, eight hours, and the plan says so. Material dates, work-order
   dates and operation dates are kept on the rows.
5. **Projection.** The same work is also scheduled **forward from today** — materials ready, sub-assemblies done, queued behind
   the work already booked at each work centre — to give the earliest finish (`projected_finish`). If it is after the required
   date, or work should already have begun, the plan lists that in `plan_problems`.
6. **Stock held.** With `reserveWhenPlanned` (on), the free stock is held for each line in stock's reservation ledger (below);
   otherwise at release. The status of each work order's materials (*available*, *partial*, *short*) and of the order is read
   back from what stock holds.

Planning an already planned order plans it again: the previous work orders are **called off and kept** (`replacedWorkOrders`), their
stock given back first so the new plan sees it free, and new work orders are numbered. Planning refuses (and changes nothing)
when the product has no bill in force, a bill loops, or — with `requireRoutingToPlan` (on) — something made has no routing in force.
**Recalculation**: changing the quantity, date or plant of a planned or released order plans it again (`replanOnChange`, on); with it
off, a planned order goes back to a draft, and a released one must be called off. Changing a deliverable shows on the order as
*demand changed* until it is planned again. Maintenance, machine, person and quality triggers join with steps 5, 6 and 7.

### Materials and stock (§25, §26)

Stock owns the count. `item.stock_reservations` is an **append-only ledger** beside the movements (`RESERVE` adds, `RELEASE` and
`CONSUME` take away; the application may insert and read, nothing else), written by `StockReservationService` in the stock module and
reached through `STOCK_RESERVATIONS_ADAPTER`. What is free to promise is on hand (the movements' sum) less what the entries sum to;
reserving serialises on item and place, so two work orders cannot both be given the last of it. A material row is held under source
`WorkOrderMaterial` and its id. The states of §26 are stock's, read back for the work order: *reserved*, *part reserved*,
*available* (free but not yet held), *short*, *made* (a sub-assembly its own work order makes) and *consumed*; issued, returned and
damaged come with step 6's movements. `POST work-orders/:id/materials/reserve` holds what is free now (all lines, or those given),
`…/release` gives it back, and `POST production-orders/:id/reserve` does it for every work order of an order.

**Stock held for production (decided 11 October 2026).** Stock set aside for a work order is **its own kind of inventory, not for sale** — the
system-defined type *Held for production*. A hold is no longer only an entry in the reservation ledger: it is a pair of stock movements at the
plant, out of the stock that can be sold and into the held side of the ledger (`StockReservationService` makes them with the entry, through the
same port); releasing, calling off and replanning move it back; **issuing to a work order leaves the held side** (the part the line holds is
drawn from it, the rest from what can be sold, as two movements each noted on its own in `work_order_moves`). So there is one count — the
ledger and its projection — and the reservations only say which work order holds what; the drill checks the held side equals what they hold.
Sales, a hand-made issue, a transfer and a write-off see only what can be sold and cannot take the held side; free stock for planning is what
can be sold, as it was. Details, the books and rolling out (`npm run stock:move-holds`) are in [STOCK.md](STOCK.md).

**Shortage to requisition (§27).** `GET planning/shortages` lists what live work orders still lack, one line per item and plant: how
much, when it is needed, when it can be had, what is free now, whether a requisition has been raised. `POST planning/requisitions`
(`materialIds`) — or `…/work-orders/:id/requisition`, `…/production-orders/:id/requisition` — raises a **draft purchase requisition**
through procurement's requisition port: one per plant, a line per item adding up every work order that needs it, at the supplier's
price when one is recorded, tagged with the project's ledger dimension. Only what has not been asked for is asked for, unless
`again`. `requisitionOnShortage` (off) raises it as soon as an order is planned. **Subcontracted operations**:
`POST work-orders/:id/subcontract` raises one draft purchase order per supplier, a line per operation at its charge per unit, with
the work order, production order and project on its context.

### Can we deliver by 30 November? (§66)

`GET planning/can-deliver?variantId&quantity&by[&locationId]` plans the quantity as a dry run — nothing is kept, no stock held —
and answers yes or no with `projectedFinish`, `slackDays` (days to spare after `deliveryBufferDays`, negative when short), the
latest day work must begin, the work orders it would need with dates, and **the factors that decide it**: *materials* (what is short
and when the last can be had), *suppliers* (the slowest lead time, which have none recorded), *capacity* (days of booked work queued
at each work centre ahead of this), *maintenance* (machines down or in maintenance at these work centres), *workforce* (skills the
operations ask for that nobody on the floor, or only one person, holds) and *routing* (what has none, so its time is not counted).
The new work is taken to queue behind what is booked; step 5's finite-capacity scheduler replaces that assumption.

### Capacity and suggestions

`GET planning/capacity?from&weeks&locationId` (up to 26 weeks) sets the work waiting at each work centre — each operation's minutes spread
over the weekdays it is planned across — against what the centre can do each week (calendar × places × efficiency), flags weeks over
the centre's utilisation target and lists the bottlenecks. `GET planning/suggestions` lists made items at or below their reorder point
(counting what is being made) with a quantity to make; *Make* creates a production order with source *plan*.

### Data

Migrations `1780600600000-manufacturing-production` and `1780600700000-manufacturing-production-projection`: `item.stock_reservations`
(append-only); `manufacturing.production_orders`, `work_orders`, `work_order_operations`, `work_order_materials`
(`projected_finish`, `plan_problems` on orders). Numbering `PRO` (production order), `MWO` (work order). Comments are kept on `work_order`
and `production_order`; a work order's discussion and an order's are on their pages.

### API (all under `/api/v1/manufacturing`)

| Route | |
|---|---|
| `production-orders` (GET, POST), `production-orders/overview`, `…/from-deliverable`, `…/from-sales-order`, `production-orders/:id` (GET, PATCH), `…/plan`, `…/release`, `…/cancel`, `…/reserve`, `…/requisition` | production orders |
| `work-orders` (GET), `work-orders/counts`, `work-orders/:id` (GET, PATCH), `…/release`, `…/cancel`, `…/materials/reserve`, `…/materials/release`, `…/requisition`, `…/subcontract`, `work-order-operations/:operationId` (PATCH machine, dates) | work orders |
| `planning/overview`, `planning/can-deliver`, `planning/capacity`, `planning/shortages`, `planning/requisitions` (POST), `planning/suggestions` | planning |
| `lookups/deliverables`, `lookups/sales-orders` | pickers |

### Permissions (seed v64)

`manufacturing.production-orders.{read,create,update,release}`, `manufacturing.work-orders.{read,update,release}`,
`manufacturing.materials.{read,reserve,request}`, `manufacturing.planning.read`. Owners and admins hold all; managers read and create; viewers read.
Plant scope as before: an order at a plant is seen and changed by those whose role covers it; one at no plant is the organisation's.

### Settings (Settings → Documents → Production planning)

Planning holds the stock a work order needs (on); sub-assemblies in stock are used before more are made (on); an alternative is taken
when the preferred is short (on); everything made has a routing in force (on); changing a planned order plans it again (on); every order
comes from a project, a sales order or a plan (off); materials held before release (off); a project's production released once the
project is approved (on); a shortage raises a requisition at once (off); days to get a bought item when no supplier says (14); days of
margin kept in a delivery promise (0).

### Events, notifications

Aggregates `ProductionOrder` and `WorkOrder` (live entities). Notification subjects with starting rules *A production order was released*
(project manager and creator), *A production order is short of materials* (when planned with materials not held) and *A work order was
released to you* (its operator). Comments on production and work orders notify their creator, operator and project manager.

### Screens (web, `/manufacturing`)

Production orders (list with key figures and filters; *New production order* in a modal, *From a deliverable* and *From a sales order*; an
order's page: facts, what is wrong with the plan, work orders with operations and materials and their states, discussion, history; Actions: plan,
release, hold stock, ask for the shortage, change, call off), Work orders (list; a page with operations, materials, machine and operator,
sub-assemblies, subcontract, discussion) and Planning (can we deliver by…, capacity by week, shortages with *Raise requisition*, suggestions).

### Tests

- Unit: `src/modules/manufacturing/production/*.spec.ts` (28: working time, structure, netting, scheduling back and forward, materials and
  alternatives, verdict, cost, capacity) and `stock-reservation.service.spec.ts` (7).
- Endpoint: `QUEUE_PREFIX=e2e-mfg npx jest --config ./test/jest-e2e.json --forceExit manufacturing-production` (32).
- Drill: `manufacturing:drill` (step 4 section: a widget order planned into two work orders, stock held, a second order seeing it taken, a
  shortage asked of procurement, a date that can and cannot be met, planned again, called off).
- Tenancy sweep: `TENANCY_ROUTES=/api/v1/manufacturing/` (fixtures: a planned order with stock held).
- Web: stubbed `cypress/e2e/manufacturing-production.cy.ts`; live `cypress/e2e/live/manufacturing-production.cy.ts` (written, not run).

### Known limits

- Stock is held **at the order's plant only**: bringing stock from another warehouse is a transfer a person makes. Purchase order lines are
  taken as being in the item's base unit.
- The delivery promise and the plan queue new work behind what is booked and let a work order's operations run one after another; the
  finite-capacity scheduler, people allocation and maintenance windows read from Phase 10 came with step 5 (below), and planning now runs it.
  Issue, return, finished goods and scrap are step 6 (below); costs from what happened are step 8.
- A work order's operations are copied when planned: changing the routing later does not change them (plan again to take the new version).
- Co- and by-products are kept on the work order; step 6 receives them with the finished goods.

## Step 5: scheduling

Code: `src/modules/manufacturing/production/` again. The rules are pure and have specs of their own: `scheduling.logic.ts` (working time, the
scheduler, the check of a schedule), `critical-path.logic.ts` and `workforce.logic.ts`. `ScheduleModelBuilder` reads what they need;
`SchedulingService`, `ScheduleBoardService`, `ScheduleScenariosService` and `CriticalPathService` use them. Asset maintenance is reached through
`adapters/manufacturing/maintenance.adapter.ts` (read only, no foreign key). Step 4's "queue behind what is booked" is replaced by finite
capacity; the planning engine's forward projection and the delivery promise are unchanged.

### The scheduler (§19, §21, §24, §33)

Time is one number, the plant's own clock (no zones): whole days since 1970 times 1440 plus the minute of the day. A work centre's working time
comes from its calendar (step 2: own hours, HR shifts, closed days, extra hours, holidays); the break of a window is taken off the **end** of
that window (the calendar knows how long it is, not where), so the minutes worked each day are the calendar's work minutes.

**Resources.** An operation that names a machine runs on it; one that does not runs on whichever **machine at its work centre** finishes it
soonest (setting *An operation may run on any machine at its work centre*, on); a work centre with no machines (or the setting off) has **places**
(its capacity, rounded: two places, two jobs at once). Work sent out takes calendar days and no resource. One machine, one job at a time; a
**changeover** setting keeps a machine idle between jobs.

**Dispatch.** Jobs are placed one at a time, the most urgent first (*priority*, then the day needed; or by the day needed alone), each on the
resource that finishes it soonest, never earlier than: today (now), the day its materials can be had (`work_order_materials.ready_on`), the end of
the operation before it in its work order, and the end of the last operation of the sub-assembly it draws (`made_by_work_order_id`). The
minutes an operation takes are the step 4 ones (work at the centre's efficiency, queue, move, inspection). A job pauses for non-working time and
for maintenance, but is never interrupted by another job, so **no machine is booked twice**.

**Maintenance and breakdowns (§33).** With *Maintenance and breakdowns block a machine's time* (on):
- an open asset-management work order (`approved`, `scheduled`, `assigned`, `in_progress`) on the machine's asset (`machines.asset_id`) takes the
  machine out on its scheduled day (else its due day) — *Hours of a day a maintenance order takes the machine out* (8) of that day's working time;
  under way, from the day it began to its due day and at least today. Maintenance orders carry a day, not hours, so a day is what is blocked;
- a machine whose state is `maintenance`, `breakdown` or `offline` is out from now until the end of its open maintenance order, else for the whole
  horizon. Nothing is placed on it; jobs go to the other machines of the centre, and `machinesDown` names it in a run.

**People (§23).** With *People are given the work* (on) every operation is given `crewSize` people from the active manufacturing profiles
(step 2): the operation's **skills at their level**, a valid certificate (the step 2 setting), **rostered** on a shift when it is worked (HR's shift
assignments: a person with a roster works only those shifts and days; one with none follows the work centre's hours unless *Only people rostered on
a shift are scheduled* is on), **not on leave**, **not doing other work then**, and within **hours a day and a week** (their own limit, else the
organisation's). Without skills only operators and technicians are taken. Best first: at the operation's work centre, least busy, most skilled.
*An operation waits until it can be staffed* (off) makes staffing part of the search; off, an operation that cannot be fully staffed is placed and
shown as unstaffed. People a person gave an operation by hand (`manual`) are kept if they still may do it.

**What a run leaves alone.** An operation that has begun, one a person **pinned**, and — *A run leaves released and started work where it is* (on) —
those of released work orders that already have a time. A run for chosen orders moves only those. Everything else is booked around.

**What it writes.** `work_order_operations`: `scheduled_start` / `scheduled_finish` (the plant's clock), `assigned_machine_id` (when the routing
named none), `schedule_locked`, and the day columns `planned_start` / `planned_finish`; the work order's and the order's planned dates follow, and the
order's `projected_finish` is the schedule's finish. People go to `operation_assignments`. If an order finishes after the day it is needed, its
plan problems say when, and the list shows it late. With *Planning an order also schedules its operations* (on) planning does all this; the work is
placed **as soon as materials and capacity allow**, so it usually finishes well before the day needed (the backward dates of step 4 stay on the
materials: when each is needed).

### Checking and moving (§20)

`POST scheduling/operations/:id/move` (and `check-move`, which changes nothing) puts an operation at a time, on a machine of its work centre. The
rules are the scheduler's, and a move never breaks one: a start that is not a working moment is **snapped** to the next; another job at the same
time on the machine, a start in maintenance or a breakdown, a start outside working hours, an operation before one it follows, and a person who may
not do it then are refused with the reason. `cascade` plans the operations after it around the move instead of refusing (it cannot move one that has
begun or is pinned — it says so). A moved operation is **pinned** where it was put (`lock`, default). The older `PATCH work-order-operations/:id`
goes through the same move when the operation is on the schedule; its finish follows from the start and the work.

### Critical path (§45)

`GET scheduling/critical-path/projects/:id` — the tasks with dates, linked by the four kinds with their lag, done work where it happened, held to
the project's target date: earliest and latest start and finish, **slack**, the critical tasks, and with `delayTaskId&delayDays` what a delay does to
the end date. A task made of others is read through its parts. `…/orders/:id` does the same for an order's operations as scheduled — the order of
operations and sub-assemblies, and the queue for a machine — held to the day needed; `delayOperationId&delayMinutes` shows the effect.

### The board (§20, §21)

`GET scheduling/board?view=machine|work_centre|person|line|order&from&days` returns rows, each with its operations (start, finish, status, people,
pinned, critical, late, the rules it breaks), maintenance and leave blocks, and the load on each day (available against scheduled minutes). The web
shows it as a **timeline** (a Gantt for orders), a **calendar** and a **kanban**. `GET scheduling/bottlenecks` sets, per work centre, what can be
worked against what is scheduled and what still waits to be scheduled, and names those over their utilisation target. `GET scheduling/conflicts`
lists what the schedule as kept breaks and what is not scheduled; `GET scheduling/maintenance-windows` the times machines are out. `GET
scheduling/operations/:id/people` says who could do an operation then and why not the rest; `PUT` gives it to chosen people, each checked.

### Scenarios (§46)

`POST scheduling/scenarios` works a what-if out on a **copy**: *a machine is out* (a day range), *a work centre is closed*, *deliveries are late*
(by days, for one item or order, or all that are on their way), *a person is away*. Both the plan and the changed plan are scheduled afresh by the same
rules (released work may move, since the question is what could be done) and compared: the new **completion date**, the **work orders affected**, the
conflicts it creates (jobs that cannot be placed, rules broken, orders newly late), the **cost** of machine and labour time at the machines' and
centres' rates, and the **delivery** impact by order. The answer is kept (`schedule_scenarios`); the live schedule is never touched. A scenario is set
aside, not deleted.

### Data

Migration `1780600800000-manufacturing-scheduling`: `work_order_operations.scheduled_start`, `scheduled_finish` (`timestamp`, no zone),
`assigned_machine_id`, `schedule_locked`, `scheduled_at`; `manufacturing.operation_assignments`; `manufacturing.schedule_scenarios`.

### API (all under `/api/v1/manufacturing/scheduling`)

| Route | |
|---|---|
| `board`, `bottlenecks`, `conflicts`, `maintenance-windows` (GET) | the schedule |
| `run` (POST: `orderIds`, `dryRun`) | the scheduler |
| `operations/:id/move`, `…/check-move` (POST), `…/pin` (PATCH), `…/people` (GET, PUT) | moving and staffing |
| `critical-path/projects/:id`, `critical-path/orders/:id` (GET) | critical path and a delay's effect |
| `scenarios` (GET, POST), `scenarios/:id` (GET), `scenarios/:id/discard` (POST) | what-ifs |

### Permissions (seed v65)

`manufacturing.schedule.{read,update,run}`, `manufacturing.scenarios.{read,create}`. Owners and admins hold all; managers read and make scenarios; viewers
read. Plant scope as before: an operation of an order at a plant is seen and moved by those whose role covers it.

### Settings (Settings → Documents → Scheduling)

Planning an order also schedules it (on); dispatch rule (priority, or due date); days ahead the scheduler looks (180); minutes a machine stands idle
between jobs (0); any machine at the work centre (on); maintenance and breakdowns block time (on); hours of a day a maintenance order takes (8);
a run leaves released and started work (on); people are given the work (on); an operation waits until it can be staffed (off); only people rostered
on a shift (off).

### Events, live updates

Aggregates `ScheduleRun` (a run or a move happened: the board reads again) and `ScheduleScenario`; `ProductionOrder` and `WorkOrder` are announced as
their dates change.

### Screens (web, `/manufacturing/schedule`)

*Board* (rows: machines, work centres, people, lines, orders; shown as timeline, calendar or kanban; earlier, later, today; a bar opens the operation,
and dragging one onto a time moves it, with the refusal in words and an offer to plan the rest around it), *Needs attention* (not scheduled, with
*Schedule the order*; rules broken or at risk), *Bottlenecks*, *Scenarios* (the list, *New scenario*, the answer with its orders, work orders,
conflicts, cost and delivery). The operation dialog moves (check, then move), pins, and gives the work to people. *Run the scheduler* and *Try the
scheduler* in the header. *Critical path* from an order's and a project's Actions, with *What does that do?* for a delay. A work order's operations
show their time, machine and people.

### Tests

- Unit: `scheduling.logic.spec.ts` (21: working time, no machine twice, alternatives, maintenance, changeover, dependencies, urgency, work sent out,
  held jobs, loops, strict staffing, the check of a schedule), `critical-path.logic.spec.ts` (7), `workforce.logic.spec.ts` (7); web
  `scheduling.models.spec.ts` (5).
- Endpoint: `QUEUE_PREFIX=e2e-mfg npx jest --config ./test/jest-e2e.json --forceExit manufacturing-scheduling` (25: planned orders scheduled within
  hours, none twice on a machine, a breakdown, asset maintenance, a dry run, refused / snapped / cascaded / pinned moves, people by skill, the critical
  path of an order and a project, four kinds of scenario, events, a reader, another organisation).
- Drill: `manufacturing:drill` (step 5 section: two machines, orders scheduled within the hours, a breakdown, a refused and a snapped move, a critical
  path, a scenario that leaves the schedule alone).
- Tenancy sweep: `TENANCY_ROUTES=/api/v1/manufacturing/` (fixture: a scheduled order and a scenario).
- Web: stubbed `cypress/e2e/manufacturing-scheduling.cy.ts` (12); live `cypress/e2e/live/manufacturing-scheduling.cy.ts` (written, not run).

### Known limits

- Moments are the plant's clock with no zone: "now" is read as UTC. A window's break is taken at its end. Maintenance orders carry a day, so a
  maintenance day blocks a number of working hours from the start of that day (the setting), not a time of day; preventive schedules not yet raised as
  an order do not block.
- A machine that is down with no open maintenance order is out for the whole horizon; bringing it back and running the scheduler again puts work on it.
- A person is judged on HR's rosters, leave, the manufacturing profile's hours and the work already given them; breaks, travel and overtime are not.
  People are chosen for an operation as a whole: the same people work all of it.
- Work centre places are not named in the routing; the places are numbered 1, 2…, and placed by first fit when read back.
- Sequence-dependent setup is not modelled (a flat changeover is). Scenarios compare two runs of the same rules, so they show what a change costs, not
  what the plan on the floor will do: released work that a scenario would move is shown moving.
- Stock held for a work order is its own kind of inventory, not for sale (decided 11 October 2026, below under *Stock held for production*): a hold
  moves it out of what can be sold, so sales no longer promises it.
- Issue, return, finished goods and scrap came with step 6; costs from what happened are step 8.

## Step 6: the shop floor

Code: `src/modules/manufacturing/shopfloor/` (`controllers/`, `use-cases/`, `services/`, `repositories/`, `dtos/`; the rules without a database in
`shopfloor.logic.ts`) and the stock port `src/modules/adapters/manufacturing/production-stock.adapter.ts`. Every operation is one use case; all SQL is in
repositories and names `organization_id`. Stock stays the system of record: everything the shop floor draws or makes is a **stock movement**, costed there;
manufacturing keeps a note (`work_order_moves`) of which movement it made for which work order and line, never a count.

### The operator's screen (§28, §57)

`GET shop-floor/my-work` lists the operations **given to the person** (the people of step 5 — `operation_assignments` — or a work order given to them, or one
they are clocked on to), running ones first, with the work order, the quantities (required, done, left), the machine and its state, how many of the
materials are issued, and why an operation cannot start yet. `?all=true` lists the floor at the person's plants instead. `GET shop-floor/operations/:id` is
the screen of one operation: **quantities** (required, completed, scrapped, left, and how many the operation before has passed on), **materials** (each line
with issued, given back, written off, held, short and its state; those drawn at this operation marked), the **instructions** and **safety requirements**
(a routing operation's `safetyNotes`, copied onto the work order's operation), **quality** (the work order's requirements and the inspection time; checkpoints
arrive with step 7), the **machine** and any stop open on it, **tools** the routing names, the **crew** clocked on, **drawings** linked in the Drive to the
product, bill and routing, the events so far and what the person may do now.

Actions, each a record in `operation_events` and an announced `FloorReport`:

- **Start** — refused unless the work order is released and (setting) the operations before are done, and (settings) the materials drawn here are issued, the
  machine is not down, and the machine is not running another operation. The machine goes to *running*, the person's clock starts (a supervisor starting
  work given to others starts the clocks of those people), the work order and the production order go *in progress*.
- **Pause** (a *pause* reason) and **resume** — the machine goes idle and back, the clocks stop and start, minutes worked are settled; a work order whose
  running operations are all paused is *paused*.
- **Report** good and spoilt units (a *scrap* reason) — good units may not exceed the quantity ordered (plus a percentage the organisation allows) nor what
  the operation before passed on; spoilt units are never refused. At the **last operation** good units are the work order's *produced* quantity and are
  **received into stock** (below).
- **Complete** — the rest of the quantity is reported good unless said otherwise (never more than the operation before passed on); fewer than ordered needs a
  reason (setting). The last operation cannot complete while a sub-assembly it draws is unfinished. Work sent out is completed when it comes back, with no
  start. When every operation is done the **work order is completed** (setting; else a supervisor completes it): what is still to be received comes in, what is
  held for it is given back, the production order follows when all its work orders are done.
- **Clock on / off** — a person joins or leaves a running operation (a supervisor does it for others); the time is `time_entries`, for step 8.
- **Comment** on the work order (the discussion of step 4), from the floor.

An operator acts only on operations given to them; **a supervisor** (`manufacturing.shop-floor.supervise`) on any at the plants their role covers. Reports are
serialised on the work order, so two cannot interleave.

### Stock moves with the work (§25–26)

- **Issue** (`POST work-orders/:id/materials/:materialId/issue`): the hold for the line (step 4) is drawn first, then what is free at the plant beyond other work
  orders' holds; refused beyond what the bill needs from stock — plus what a sub-assembly has actually put into stock, plus a margin the organisation allows —
  and refused when stock cannot cover it. An alternative the bill names may be issued instead of the line's item. The lot used is recorded as the movement's
  batch. Movement source `WorkOrderIssue`, the work order's id.
- **Return** — material not used goes back at what it cost going out (`WorkOrderReturn`); never more than is out.
- **Scrap** — damaged material is written off against the work order with a reason (`WorkOrderScrap`): drawn from stock beyond the bill by nature, and counted in
  what the work order cost.
- **Backflush** (setting, off) — reporting units draws the materials of that operation in proportion to the units reported (good and spoilt) so far; a report
  stock cannot cover is refused with the reason.
- **Finished goods** — good units on the last operation are received as reported (setting; else at completion) at the work order's plant under **a batch named
  after the work order** (setting). **Co-products and by-products** are received in step with the product (and the rest at completion), in proportion to what
  was actually made. Movement source `WorkOrderReceipt`.
- **Cost**: the cost carried by the work order (drawn and written off, less returned and received) is shared over the units still expected, so each receipt takes its
  share and the last clears it; co-products carry their cost share, the product the rest, by-products nothing. `GET work-orders/:id/moves` lists every line with
  its stock movement and value, and the cost still in progress. What a work order drew and made equals stock's movements (the drill and the endpoint tests check
  it). Materials and stock states (§26): *reserved, part reserved, available, short, made, part issued, issued, consumed*, with issued, given back and written
  off per line.
- The four source types are reserved to the shop floor: a hand-made stock movement cannot be labelled with them.
- The other side of these movements in the books is **work in progress** (step 8; before it, stock adjustments).

### Stops and reason codes (§28)

**Reason codes** (`/manufacturing/reason-codes`): the organisation's own list of why work stops (*downtime*, with the machine state the stop puts the machine in and
whether it was planned), why an operation is paused, and why units are scrapped. A usual list is made the first time anyone needs it; codes are added, renamed,
retired (kept on past records), never deleted. `POST shop-floor/downtime` reports a problem on an operation (which stops: paused, with the reason), on a machine, or
both; the machine goes to the reason's state; **one stop is open on a machine at a time**. `POST shop-floor/downtime/:id/end` (or `downtime/end` with the machine)
closes it — the machine is made available again — and the minutes are the downtime the dashboard and OEE read. The operation is resumed by hand.

### Offline (§57)

`POST shop-floor/sync {deviceId, items:[{clientRef, kind, capturedAt, payload}]}` (at most 200, in the order they were done): `start`, `pause`, `resume`, `complete`,
`report`, `clock_on`, `clock_off`, `downtime_start`, `downtime_end`, `issue`, `return`, `scrap_material`, `comment`. Each item is run by the rules of its own route **as
of the moment it was done**; one that fails undoes only itself (a savepoint) and is answered `rejected` in words; `(device, clientRef)` is unique per
organisation, so an item sent again — applied or rejected — is answered as it was and not done twice. An item captured longer ago than the setting (7 days), or
before something already recorded on its operation, is turned away. What was sent is kept in `floor_submissions`.

### Scanning and labels (§58)

`GET shop-floor/scan?code=` says what a code is: a work order's number (which also names the operation to open: the one running for the person, else the first
given to them, else the first not done; the answer carries the route of its screen), a production order, a machine or tool number, an item's barcode or SKU, a
`BATCH:<number>` (finished goods or what was issued under it, with the work orders concerned) or `LOC:<id>` (a location), or the link on a label. Nothing outside the
person's plants is found. `GET shop-floor/labels/:type/:id` gives one label (code, link, QR as SVG, Code 128 bars); `GET shop-floor/labels/sheet?type&ids` a printable
page. Types: `work-order`, `machine`, `tool`, `location`, `product`, `finished-goods`. The QR carries a link to the app (`/manufacturing/scan/<code>`), so any phone's
camera opens the right screen.

### The dashboard (§29)

`GET shop-floor/dashboard[?locationId&hours]`: work orders in hand, waiting, completed in the window and late; machines running, stopped and otherwise, with what each
runs and why it is stopped; people clocked on; open stops; and for the window (24 hours by setting) **units produced** (good on last operations), target (the product
work orders in hand or finished), **production rate** (good per hour run), **scrap** and scrap rate, **downtime** (unplanned and planned, the top reasons),
**availability × performance × quality = OEE** and **labour efficiency** — all read off events, stops and time entries, none stored. Performance is the routing's run
minutes for the units reported against the minutes the operations ran, capped at 1. The web page is live: it reads again on `FloorReport`, `Downtime`, `Machine` and
`WorkOrder` events.

### Data

Migration `1780600900000-manufacturing-shop-floor`: `reason_codes`, `operation_events` (append only), `floor_submissions`, `time_entries`, `downtime_records`,
`work_order_moves`; columns on `work_order_operations` (`paused_at`, `segment_started_at`, `actual_minutes`, `scrap_quantity`, `started_by`, `completed_by`,
`short_reason`, `safety_notes`), `work_orders` (`received_quantity`, `completed_by`) and `routing_operations` (`safety_notes`).

### API (all under `/api/v1/manufacturing`)

| Route | |
|---|---|
| `shop-floor/dashboard`, `shop-floor/my-work`, `shop-floor/operations/:id` (GET) | read |
| `shop-floor/operations/:id/{start,pause,resume,report,complete,clock-on,clock-off}` (POST) | do the work |
| `shop-floor/work-orders/:id/comments` (POST), `…/complete` (POST, supervisors) | words; finish |
| `shop-floor/downtime` (GET, POST), `…/:id/end`, `…/end` (POST) | stops |
| `shop-floor/sync` (POST), `shop-floor/scan` (GET), `shop-floor/labels/:type/:id`, `shop-floor/labels/sheet` (GET) | offline, scans, labels |
| `work-orders/:id/materials/:materialId/{issue,return,scrap}` (POST), `work-orders/:id/moves` (GET) | stock |
| `reason-codes` (GET, POST), `reason-codes/:id` (PATCH), `…/retire`, `…/reinstate` | reasons |

### Permissions (seed v66)

`manufacturing.shop-floor.{read,operate,supervise}`, `manufacturing.materials.issue`, `manufacturing.reason-codes.manage`. Owners and admins hold all; managers read, operate,
supervise and issue; viewers read. `operate` acts on operations given to the person; `supervise` on any at the plants the role covers. Plant scope as before.

### Settings (Settings → Documents → Shop floor)

An operation starts when the one before is done (on); only when its materials are issued (off); materials are issued as units are reported (off); finished goods are
received as reported (on), under a batch named after the work order (on); percent over the quantity ordered that may be reported good (0) and over the bill's quantity
that may be issued (0); completing short needs a reason (on); the work order is completed with its last operation (on); a machine that is down is not started on (on); a
machine runs one operation at a time (on); days an offline report may be late (7); hours the dashboard looks back (24).

### Events, live updates

Aggregates `FloorReport` (each thing reported), `Downtime` and `ReasonCode`; `WorkOrder`, `ProductionOrder` and `Machine` are announced as their status and state change. Live
entities: `FloorReport`, `Downtime`, `ReasonCode` under `manufacturing.shop-floor.read`.

### Screens (web)

*Shop floor* (`/manufacturing/shop-floor`: dashboard, work, stops, reasons), *My work* and the operator's screen of an operation (`/manufacturing/shop-floor/work`,
`…/work/:operationId`, phone-first, with a scan field and an offline queue), *Scan* (`/manufacturing/scan/:code`, where a label's link lands); a work order's page gains
*Stock* (issue, give back, write off, what was made and the cost in progress) and *Floor events*.

### Tests

- Unit: `shopfloor.logic.spec.ts` (26: starting, quantities, completion, work order status, issue limits, backflush, what finished goods cost and leaving nothing behind,
  OEE, minutes run, scanning).
- Endpoint: `QUEUE_PREFIX=e2e-mfg npx jest --config ./test/jest-e2e.json --forceExit manufacturing-shopfloor` (31: reason codes; a day on the floor from issue to finished goods
  with the cost adding up; a sub-assembly; stops and the machine's state; the settings; a phone's batch applied once; scans and labels; the dashboard; who may do what; another
  organisation).
- Drill: `manufacturing:drill` (step 6 section: plates issued, an operation started, units reported and received, a breakdown reported and closed, completion short with its reason,
  stock's movements equal to the work order's notes, a phone's batch sent twice, a scan, the dashboard).
- Tenancy sweep: `TENANCY_ROUTES=/api/v1/manufacturing/` (fixture: a released order with material issued, an operation started and reported, a stop, a phone's item).
- Web: stubbed `cypress/e2e/manufacturing-shopfloor.cy.ts`; live `cypress/e2e/live/manufacturing-shopfloor.cy.ts` (written, not run).

### Known limits

- The cost of a work order in step 6 was its **materials**; step 8 adds labour, machine time, overhead and work sent out, puts work in progress in the books, and clears
  what a work order still carries when it is completed short (the material of the units not made) to the goods made and to variance.
- Material issued is taken as consumed unless given back: there is no separate count of what is on the floor unused. Damaged material is written off by drawing it from stock, so a
  replacement for material damaged after issue is a scrap draw.
- A person with no staff record cannot be given work; a supervisor without one can act but books no time.
- Inspection checkpoints, gates and non-conformances are step 7; the operator's screen shows the work order's quality requirements and the inspection time until then.
- A machine's state follows the floor only for operations that name a machine (or that the scheduler put on one); machines read from IoT are Phase 10 step 6's and not yet joined.
- Stock held for a work order is its own kind of inventory (see *Stock held for production*): what the shop floor issues leaves the held side, not what can be sold.
- The camera scanner in the web uses the browser's `BarcodeDetector` where it exists; a scanner that types (a keyboard wedge) or typing the code always works.

## Step 7: quality

Code: `src/modules/manufacturing/quality/` (`controllers/`, `use-cases/`, `services/`, `repositories/`, `dtos/`; the rules without a database in `quality.logic.ts`)
and the goods-receipt port `src/modules/adapters/manufacturing/receipts.adapter.ts`. One use case per operation; all SQL is in repositories and names
`organization_id`. Quality **reads** stock and procurement through ports and never writes a count of its own: scrapping goods is a stock movement, returning them is a
draft return to the supplier made through procurement.

### Plans (§30)

An **inspection plan** says what is checked, on what and how much of a lot: a `kind` (*incoming*, *in process*, *final*), the item, for an in-process plan the operation it
follows (`operationNo`), a **sampling rule** (*all* units, a *fixed* number, or a *percent* of the lot, at least one), an **accept number** (how many sampled units may be
defective), and whether it is a **gate**. Its **characteristics** are each a *measure* (nominal, lower and upper limit, a unit; a reading outside the limits fails) or a
*pass / fail* check, and may be **critical** (one failed critical check fails the lot whatever the accept number). One plan is in use for an item at a kind (and operation); a
plan is retired and reinstated, never deleted, and reinstating one while another is in use is refused. A plan made for an incoming kind is not a gate unless it says so (goods
are usually used while they wait to be looked at); the other kinds are gates unless it says not. **Defect types** (code, name, severity *minor / major / critical*) are the
organisation's own list; a usual one is made the first time anyone needs it.

### Inspections (§30–31)

- **In process** — completing an operation raises the inspection of its output under the item's plan for that operation (setting), for the quantity the operation passed on. While
  it is pending, or has failed and not been put right, the **next operation cannot start** (setting *a gate holds back what follows*). The operator's screen shows the plan's
  checkpoints and the inspections made.
- **Final** — the last operation's completion raises the final inspection. While it is waiting or failed, the **finished goods are not received into stock** and the **work
  order is not completed** (the supervisor's *complete* is refused); passing it receives what was held and completes the work order.
- **Incoming** — `GET quality/inspections/receipts` lists the lines of received goods whose item has an incoming plan and that have not been inspected; `POST
  inspections/from-receipt {grnItemId}` raises the inspection, for the lot's batch number and its supplier. If the plan is a gate the **lot cannot be issued** to a work order
  (naming its batch) until it passes (`Lot X is on hold: …`).
- **Recording** (`POST inspections/:id/record`): a reading for **every characteristic of every unit sampled** — the number of samples must equal the sample size the plan asks for,
  a measurement needs a number, a pass / fail needs a verdict; a plan with no characteristics takes the count of defective units. The inspection **passes** when the defective
  units (those with any failed check) are no more than the accept number and no critical check failed; otherwise it fails with the reasons in words. It is decided once. A person
  who may inspect records it; the inspector may be named (a member of staff).
- **Waive** (`quality.waive`, with a reason) lets a lot go on without passing; the reason is kept. **Cancel** calls one off.
- A **project gate** (§31) is a mandatory check on a task of a project: `POST quality/gates {projectId, name, taskId}`. The tasks that follow it through a dependency link made with
  `condition: 'quality'` are **held until the gate passes** (the link's `satisfied_at` is set when it passes and cleared if it later fails); a gate is decided by hand
  (`gates/:id/decide`, pass / fail / waive with a note) or by the inspection made for it (`POST inspections {planId, gateId, lotQuantity}`). A project is completed only when its
  gates have passed (setting).

### Non-conformance and action (§32)

A failed inspection opens a **non-conformance report** (NCR, setting; any person with `ncr.create` can also open one for anything — a work order, an operation, a lot received, an item)
with the item, the lot, the quantity affected, the severity, the supplier when the goods were bought, the source (*inspection, floor, incoming, manual*), a root cause and a
responsible person. A defect reported from the floor (`POST quality/operations/:id/defects`, also a `defect` item in the phone's offline batch) can raise one. Its life: **open →
dispositioned → closed** (or *cancelled*), through *in rework* and *reinspection* when it is put right.

**Dispositions** (`POST ncrs/:id/disposition`): *accept* (use as is, a concession); *rework* and *repair* (the work order or lot is held until the **reworked** step, which raises a new
inspection of the same lot under the same plan — a pass releases what the first held and the report is dispositioned; a fail reopens the report for a new decision, while the first
failure keeps holding the work); *scrap* (a quantity, written off: units made are taken off the operation and the work order; goods bought are a stock issue with source `QualityScrap`);
*return to supplier* (only for goods that came from a supplier: a **draft** return to supplier is made through procurement, whose number the report keeps, and the lot stays held).
Disposition is refused where it does not make sense, in words.

**Corrective and preventive actions**: added to a report with an owner and a due date (setting: 14 days), marked done, then **verified by someone other than whoever did the
action** (`ncr.close`, setting *actions verified before closing*). A report closes (`ncr.close`) when its actions are verified and (setting) a root cause is given; a closed report is
kept as it was.

### Traceability (§59–60)

`GET quality/trace/product?workOrderId=` (or `variantId` and `batch` of finished goods — a work order's number is its batch) answers **what went into this product**: the materials
by item and lot with quantities, the operations that drew them, where each lot came from (the goods receipt and supplier, or *unknown* when issued with no lot) and, for a
sub-assembly, the same for the work order that made it (to a fixed depth). `GET quality/trace/lot?variantId=&batch=` answers **where this lot went**: the work orders that drew it, what
they made under which batches, and what was dispatched under those batches, with the lot's inspections and reports. Both rest on the lot recorded on the stock movements and
the shop floor's notes of them (`work_order_moves`), so they are only as complete as the lots named when materials were issued. Nothing outside the person's plants is found.

### Data

Migration `1780601000000-manufacturing-quality`: `defect_types`, `inspection_plans` (one in use per kind, item and operation), `inspection_characteristics`, `inspections`,
`inspection_results` (a reading per characteristic per sample), `defects`, `quality_gates`, `ncrs`, `corrective_actions`. Documents are numbered `QIN-` (inspections) and `NCR-`.

### API (all under `/api/v1/manufacturing/quality`)

| Route | |
|---|---|
| `overview` (GET) | the figures: waiting, decided, first pass yield, open reports, gates, defects by type |
| `plans` (GET, POST), `plans/:id` (GET, PATCH), `…/retire`, `…/reinstate` | plans |
| `defect-types` (GET, POST), `defect-types/:id` (PATCH) | the organisation's defect types |
| `inspections` (GET, POST), `inspections/receipts` (GET), `inspections/from-receipt` (POST), `inspections/:id` (GET), `…/record`, `…/waive`, `…/cancel`, `work-orders/:id/inspections` (GET) | inspections |
| `ncrs` (GET, POST), `ncrs/:id` (GET, PATCH), `…/disposition`, `…/reworked`, `…/actions`, `…/close`, `…/cancel`; `ncr-actions/:id/{done,verify}` | reports and actions |
| `defects` (GET), `operations/:id/defects` (POST, the floor) | defects |
| `gates` (GET, POST), `gates/:id` (GET), `…/decide` | project gates |
| `trace/product`, `trace/lot` (GET) | traceability |

### Permissions (seed v67)

`manufacturing.quality.{read,inspect,plans,waive}`, `manufacturing.ncr.{read,create,update,close}`, `manufacturing.traceability.read`. Owners and admins hold all; managers read, inspect, manage plans and
update reports (and create reports); viewers read. Waiving and closing are the owner's (or a role given them). Reporting a defect from the floor needs only `shop-floor.operate`. Plant scope as before:
a record at a plant is seen and acted on only by those whose role covers it; a project's gate (no plant) needs a role that covers the whole organisation.

### Settings (Settings → Documents → Quality)

Completing an operation raises its inspection (on); a plan that is a gate holds back what follows (on); a failed inspection opens a report (on); a root cause is needed to close a report (off);
corrective actions are verified before it closes (on); days given to an action (14); a project is completed only when its gates have passed (on).

### Events, live updates, notifications

Aggregates `Inspection`, `InspectionPlan`, `Ncr`, `QualityGate`, `DefectType` (each carries the organisation). Live entities under `quality.read` / `ncr.read`. Notification subjects `Inspection` and `Ncr`
with the presets *inspection failed* and *report raised* (on creation).

### Screens (web, `/manufacturing/quality`)

*Quality* (the figures; the receipts waiting to be inspected), *Inspections* (list, detail, *Record* by sample with the plan's limits shown), *Plans*, *Reports* (list, detail with *Disposition*,
*Reworked*, actions and *Close*), *Gates* (by project), *Traceability* (*Into a product* and *From a lot*). A work order gains *Quality*; the operator's screen shows the checkpoints and *Report a defect*.

### Tests

- Unit: `quality.logic.spec.ts` (15: sample sizes, readings against limits, the lot's verdict, what is affected, what holds, dispositions that make sense, closing, first pass yield); web `quality.models.spec.ts`.
- Endpoint: `QUEUE_PREFIX=e2e-mfg npx jest --config ./test/jest-e2e.json --forceExit manufacturing-quality` (27: plans and defect types; an in-process gate raised, holding, passed, failed, put right by
  rework and a second inspection, scrapped; actions and the verifier; waiving and the settings; the final inspection holding finished goods; a real goods receipt inspected, a lot held, bad goods
  returned to the supplier; a project gate flipping the dependency; traceability both ways; the operator's screen and a defect; the figures; events; a reader; another organisation).
- Drill: `manufacturing:drill` (step 7 section: a plan, an inspection raised at completion, a failure opening a report, rework and a second inspection releasing, an action refusing its own verifier, a lot traced both ways).
- Tenancy sweep: `TENANCY_ROUTES=/api/v1/manufacturing/` (fixture: a plan, a failed inspection with its report and an action, a defect, a gate).
- Web: stubbed `cypress/e2e/manufacturing-quality.cy.ts`; live `cypress/e2e/live/manufacturing-quality.cy.ts` (written, not run).

### Known limits

- The in-process gate holds the **next** operation; an inspection that follows the last operation holds nothing unless a final plan exists, which is what holds finished goods. Finished goods already
  received into stock are not taken back if units are later written off a report, so a final gate is how they are kept out.
- Traceability is as complete as the lots named when materials were issued and goods received: material issued with no lot is traced to "unknown", and stock moved by other modules is followed only
  by the lot named on the movement.
- A return to the supplier is a **draft** made through procurement; sending it, and the supplier's credit, are procurement's. A lot rejected and returned stays on hold in manufacturing.
- Sampling is by the plan's own rule (all, fixed, percent); there are no statistical sampling tables (AQL) and no control charts. Gauges and measuring tools are not tied to readings.
- The `verification` status of a report is not used: verification is of its actions.
- Cost of poor quality (scrap, rework) is shown on a work order's cost sheet (step 8).

## Step 8: cost and the ledger

Code: `src/modules/manufacturing/costing/` (`controllers/`, `use-cases/`, `services/`, `repositories/`, `dtos/`; the rules without a database in `costing.logic.ts`) and the ports
`src/modules/adapters/manufacturing/cost-ledger.adapter.ts` (the ledger's one door, the posting backlog, the balance of work in progress) and `cost-facts.adapter.ts` (open purchase orders and the
budgets finance keeps for a project). Every operation is one use case; all SQL is in repositories and names `organization_id`. Stock stays the system of record for quantities and for the cost of
materials; manufacturing adds what stock cannot know — time, machine time, overhead, what people record — and the books side of all of it.

### What a work order costs (§34)

Cost is read from what happened, never from the estimate:

| Kind | From |
|---|---|
| **Materials** | `work_order_moves`: issued less given back, valued by stock. **Scrap** is material written off on the work order. |
| **Labour** | the minutes a person was clocked on (`time_entries`, closed) at their **hourly cost** (manufacturing profile, step 2) — else, by setting, the work centre's labour rate; time with no rate is counted and listed as *unrated*. |
| **Machine time** | the hours an operation ran (`actual_minutes`) at the machine's operating cost per hour, else the work centre's machine rate. |
| **Overhead** | the work centre's overhead rate on the machine hours (or, by setting, the labour hours). |
| **Subcontract** | the operation's charge per unit times the quantity that came back. |
| **Energy, maintenance, logistics, rework, scrap, overhead, other** | **costs people record** (`POST costing/entries`) against a work order, a production order, a project or a non-conformance report; voided with a reason, never deleted. One against a work order is applied to it like any other cost; one against a project is part of the project's cost only. |

**Applying cost** (`CostAccrualService`) writes **cost lines** — the difference between what each source should have cost by now and what has been applied for it, so applying twice writes nothing and a
correction (a time entry corrected, a cost voided) is a line of its own. It runs after the shop floor changes a work order, on a clock-off, before finished goods are received (so they come in at what the work has
cost) and at completion; `POST costing/work-orders/:id/apply` does it by hand. `work_orders.actual_cost` and `projects.production_cost` are kept from it.

**Standard and variance.** The first time a work order is costed its expected cost is **frozen by kind** (`work_order_standards`: materials at stock cost, labour, machine time and overhead at the work centre's
rates for the routing's minutes, work sent out at its charge). The cost sheet (`GET costing/work-orders/:id`) sets actual against standard for every kind — a finished work order against the standard of the units
it made — with direct and indirect cost, unit cost, **cost of poor quality** (scrap, rework, goods scrapped through non-conformance reports), unrated minutes and the runs. `GET costing/variances` does it across the
work orders finished in a window.

### Work in progress in the books

Three new posting roles, chosen by the organisation like every other (Finance › Posting accounts), with chart accounts in the standard chart:

| Role | Account (standard chart) |
|---|---|
| `wip` — work in progress | 1320 |
| `labour_absorbed`, `overhead_absorbed` — the credit for cost applied | 5400, 5410 (contra expense) |
| `material_variance`, `labour_variance`, `overhead_variance` | 5420, 5430, 5440 |
| `production_scrap` | 5450 |

Every posting goes through `LedgerPostingService`, balances, is posted once per source and event, and a posting that cannot be made (no account for a role, a closed period) waits in the **posting backlog** with the
reason — the work order stands — and is retried exactly as it was (`POST costing/runs/retry`, or Finance › Books › Backlog).

| Event | Entry |
|---|---|
| Material issued to a work order, written off | Dr work in progress · Cr stock *(stock's entry; the other side of `WorkOrderIssue` and `WorkOrderScrap` is no longer stock adjustments)* |
| Material given back, finished goods received | Dr stock · Cr work in progress *(stock's entry, `WorkOrderReturn`, `WorkOrderReceipt`)* |
| Labour applied | Dr work in progress · Cr labour absorbed |
| Machine time, overhead, work sent out, energy, maintenance, logistics, rework applied | Dr work in progress · Cr overhead absorbed |
| Cost added to the goods made at completion | Dr stock (or cost of sales for goods already gone) · Cr work in progress *(stock's entry, `ProductionCost`, by the landed-cost mechanism)* |
| Cost of units not made | Dr material / labour / overhead variance · Cr work in progress |
| A work order called off, or ended having made nothing | Dr production scrap · Cr work in progress |

Issues drawn from the held side post with the "Held for production" inventory type as context: an organisation that maps a stock account to that type sees value move into it at the hold and leave it at the
issue; one that does not sees the issue leave its stock account — both balance, and work in progress is the same.

**Settling a work order** (`CostSettlementService`; at completion by default, when called off, or by `POST costing/work-orders/:id/settle`): what it still carries is cleared — a work order that made all it was
ordered for adds the rest (conversion cost booked after the last receipt) to the cost of what it made; one that made fewer adds the share for the units made and charges the rest to the variance accounts by kind of
cost; one that made nothing, or was called off, writes it off to production scrap; a remainder below nothing (a cost voided after it was added) comes off the goods again. Run once more after a late cost, it clears
only that. Afterwards the work order carries nothing.

**The rule the tests prove**: the ledger's work in progress equals what the open work orders carry (`GET costing/wip` sets the two side by side, with the difference and any posting waiting); when every work order is done it is
nothing.

### Budgets, forecast and earned value (§35)

`GET costing/projects/:id` — per project: the **approved budget** (the project's), **planned** (its work orders' estimates plus its tasks' estimates), **committed** (what has been spent plus what is on order and not yet
received: purchase orders naming the project, work sent out included), **actual** (production + costs recorded against the project + what its tasks have booked), **forecast** (what has been spent plus what is left of the plan,
divided by the cost performance so far, or at the budget rate — setting) and the **variance**, with a state (ok / near its limit / over). By kind of cost against a budget set per kind (`PUT costing/projects/:id/budget-lines`).
**Earned value**: planned value (from the dates), earned value (from progress), cost and schedule variance, CPI and SPI, estimate at completion, to complete and variance at completion. The budgets finance keeps for the
project in Phase 5 are listed beside it. `GET costing/projects` is every project in a line.

### Profitability (§36)

`GET costing/profitability?by=project|product|customer|production-order|work-order|department|plant&from&to`: revenue, direct cost, indirect cost, gross profit and margin, profit and margin. Revenue is the sales order line a
production order was made for (its share) and, for a project, its contract value when it has one; a window dates a work order by the day it finished (else made). Direct cost is materials, labour, machine time, work sent
out, scrap and rework; indirect the rest. A department has labour only (the cost of its people's booked time).

### Data

Migration `1780601200000-manufacturing-costing`: `cost_lines`, `cost_runs`, `cost_entries`, `work_order_standards`, `project_budget_lines`; `projects.production_cost`, `work_orders.settled_at`. The chart's new accounts and posting
roles reach existing organisations with `npm run finance:open-books -- --all` (adds, never overwrites; an organisation that chose its own accounts keeps them and is told which roles are still unset).

### API (all under `/api/v1/manufacturing/costing`)

| Route | |
|---|---|
| `overview`, `wip`, `variances`, `runs`, `projects`, `entries` (GET) | read |
| `work-orders/:id`, `production-orders/:id`, `projects/:id` (GET) | cost sheets |
| `work-orders/:id/apply`, `work-orders/:id/settle`, `runs/retry` (POST) | apply, settle, post again |
| `entries` (POST), `entries/:id/void` (POST), `projects/:id/budget-lines` (PUT) | record, void, budget |
| `profitability?by=` (GET) | profit |

### Permissions (seed v68)

`manufacturing.costing.read`, `manufacturing.costing.entries`, `manufacturing.costing.post`, `manufacturing.profitability.read`. Owners and admins hold all; managers read, record costs and apply / settle; viewers read.
Plant scope as before (a reader at some plants sees their work orders and no comparison with the whole ledger).

### Settings (Settings → Documents → Cost and the ledger)

Labour applied (on); a person with no hourly cost is costed at the work centre's labour rate (on); machine time applied (on); overhead applied (on) per machine hours or labour hours (machine hours); what is left is
cleared when a work order is completed (on); labour, machine time and overhead become part of the cost of finished goods (on — off carries only materials into stock and charges conversion to variance); costs may be
recorded against a completed work order (off); the project forecast from performance or at the budget rate (performance); percent of the budget at which a project is near its limit (90).

### Events, live updates

Aggregates `CostRun` (a run of cost applied or settled) and `CostEntry` (recorded, voided). Live entities under `manufacturing.costing.read`.

### Tests

- Unit: `costing.logic.spec.ts` (26: rates and the order they are chosen in, what is still to be applied, the journal of an application, clearing what is left in every case, standard against actual, earned value and
  forecast, budget state, profit).
- Endpoint: `QUEUE_PREFIX=e2e-mfg npx jest --config ./test/jest-e2e.json --forceExit manufacturing-costing` (21: the accounts; material into work in progress in the books; labour, machine time and overhead applied once and read
  back from the journal; finished goods received at what the work cost; completion adding late cost to the goods; costs after completion taken and voided; a short work order cleared to goods and variance; one called off
  written off; recorded costs; settings; a project's budget, forecast and profit; stock held for production mapped and unmapped; a posting that cannot be made waiting in the backlog and retried; who may do what; another
  organisation). The step 6 endpoint test and drill now expect completion to clear what a short work order kept.
- Drill: `manufacturing:drill` (step 8 section: two hours at 1500, machine at 900, overhead at 300 applied once and read back from the journal; goods received at full cost; energy recorded and voided; a short work order cleared;
  one called off written off; the ledger's work in progress for all of them equal to what they carry).
- Tenancy sweep: `TENANCY_ROUTES=/api/v1/manufacturing/` (fixture: costs applied, one recorded against a work order and one against the project, a budget by kind).
- Web: stubbed `cypress/e2e/manufacturing-costing.cy.ts`; live `cypress/e2e/live/manufacturing-costing.cy.ts` (written, not run).

### Known limits

- Work orders completed before this step posted their stock movements against stock adjustments, not work in progress; they are not settled and `GET costing/wip` may differ from the ledger by what they carried until
  the books are adjusted by hand.
- Cost in the base currency only; a purchase order in another currency is committed at its face amount. Committed cost counts purchase orders that name the project (work sent out, shortages raised with a project line).
- Revenue for profitability is the sales order line and the project's contract value; invoiced and recognised revenue by period, and the cost of sales of finished goods sold from a project, are not separated.
- Reports are computed from the cost lines on read (a window of up to 20,000 work orders); the performance pass (projections) is the user's to schedule.
- Energy, maintenance and logistics are recorded by people; they are not read from IoT meters or maintenance work orders yet.

## Step 9: automation, alerts and analytics

Code: `src/modules/manufacturing/automation/` (the automations, their record, the scan and its job), `analytics/` (the KPIs' queries and the arithmetic, `analytics.logic.ts`), `audit/`, `search/`,
`common/mfg-origin.ts`; the definitions the analytics platform registers are in `analytics/definitions/` (KPIs, per module), `src/modules/analytics/reports/definitions/manufacturing.reports.ts`,
`analytics/dashboards/manufacturing.dashboards.ts` and `analytics/alerts/manufacturing.alert-conditions.ts`. Every operation is a use case; all SQL is in repositories (the KPI queries are
static methods of `MfgAnalyticsRepository`, because the analytics platform hands a KPI the tenant's transaction rather than an injected repository).

### Automation (§48)

What the system does by itself, once for each cause, and what it left to people. An event is begun when a cause is found (`manufacturing.automation_events`, one open per `dedup_key`), completed with
the **steps** it took — each `done`, `skipped` (a setting leaves it to people), `nothing` (nothing to do) or `failed` (with why) — and **resolved** when the cause goes. A step that fails does not undo
the others (each runs in a savepoint) and never breaks the request that triggered it. The event is announced as `MfgAutomation-created` with its kind as the status, which the notification rules,
the live screens and analytics hear.

| Cause | Found | Steps |
|---|---|---|
| **Material shortage** | when an order's materials are checked and fall short (`ProductionMaterials.refresh` and, once the order is planned or released, `tell`) and by the scan, for orders needed within *days ahead* | the shortage is recorded and announced (`MaterialShortage-created`); a **draft purchase requisition** is raised for what has not been asked for (`raiseRequisitions`, in the name of whoever made the order; `PurchaseRequirement-created` for each); a **risk** is raised on the order's project, scored by how near the date is, and closed when the cause goes; procurement is told by the event |
| **Production delay** | by the scan: an operation unfinished longer than the *grace* after its scheduled finish | the **schedule is run again** for the order (`SchedulingService.runForOrders`); the **project's tasks it touches** are listed (the deliverable's phase, tasks on the same machine or work centre, and everything that follows them through the dependencies); the **project's forecast completion** is worked out again (the latest of its open orders' forecast finish and its open tasks' planned finish, the touched ones pushed back by the days the order now finishes late) and kept in `projects.projected_completion`; past the target, a **risk** is raised (scored by days past) and closed when the forecast is back within it; the project manager and sponsor are told by the event |
| **Machine breakdown** | whenever a machine's state becomes `breakdown`, however reported (`MachinesService.moveState` announces to `AutomationHooks`) | operations **running on it are paused** with the breakdown as the reason (`OperatorService.pauseForBreakdown`, in the name of whoever reported it; their crew's clocks stop); the **alternative machines** of its work centre (in service, not down) are named; the **schedule is run again** for every order with work waiting for the machine; the plant's manager is told by the event. Back in service, the event is resolved |

*Why a hook object.* Stopping an operation and raising a requisition are done by services that depend on `MachinesService` and `ProductionMaterials`; those cannot depend on the automations. They announce to
`AutomationHooks` (nothing injected), and each automation registers when it starts.

*The scan.* `AutomationScan` visits an organisation (by hand: `POST automation/scan`, `manufacturing.automation.run`, whole organisation only) and every organisation with open production orders on a clock
(`AutomationProcessor`, BullMQ queue `manufacturing-jobs`, a repeatable job every ten minutes, a few organisations at a time, each in its own transaction): it refreshes the materials of the orders needed
soon (200 at most), records shortages the hooks did not see, resolves shortages that are covered or ended, finds delays and resolves those whose operations are placed again.

**Settings (Settings → Documents → Automation, organisation-wide):** a shortage sets things in motion (on); a shortage raises a requisition (on); a shortage adds a risk to the project (on); days ahead a shortage
is acted on (14); a delay sets things in motion (on); minutes late before an operation counts as delayed (60); a delay reschedules the order (on); a delay moves the project's forecast (on); a breakdown sets
things in motion (on); a breakdown stops the machine's operations (on); a breakdown reschedules the orders that used it (on). With a switch off the event is still recorded and announced, marked *noted*.

### Dashboards, KPIs, reports and alerts (§42–44, §47, §49)

On Phase 5.5's platform, five new analytics modules (each with `<module>.dashboard.view`, `report.view`, `report.export`, `report.schedule`, `analytics.view`, `alerts.manage`; seed v69):

| Module | The dashboard of §42 | KPIs |
|---|---|---|
| `manufacturing` | executive and production manager | `oee`, `availability`, `performance`, `quality_rate`, `scrap_rate`, `throughput`, `cycle_time`, `downtime`, `unplanned_downtime`, `machine_utilisation`, `labour_utilisation`, `schedule_adherence`, `on_time_delivery`, `production_value`, `production_cost`; now: `orders_open`, `orders_late`, `work_orders_running`, `work_orders_waiting`, `machines_stopped` |
| `project` | project manager | now: `active_count`, `progress`, `delayed_count`, `high_risk_count`, `over_budget_count`, `cost_to_date`, `budget`, `budget_used`, `contract_value`, `tasks_overdue`, `tasks_blocked`, `tasks_open`, `milestones_missed`, `risks_open`, `risks_serious`; flows: `completed`, `on_time_completion`, `schedule_variance`, `profit_margin` |
| `quality` | quality | `inspections`, `pass_rate`, `inspections_failed`, `first_pass_yield`, `defects`, `defect_rate`, `ncrs_opened`, `rework_units`, `rework_rate`, `scrap_units`; now: `ncrs_open`, `ncrs_overdue`, `actions_overdue`, `gates_failed` |
| `maintenance` | maintenance | `machine_availability`, `breakdowns`, `machine_downtime`, `mtbf`, `mttr`; now: `active_breakdowns`, `in_maintenance`, `preventive_due`, `preventive_overdue` |
| `materials` | procurement | now: `orders_short`, `work_orders_short`, `requisitions_pending`, `orders_inbound`, `orders_late`, `suppliers_late`; flows: `requisitions_raised`, `shortages_found` |

**The formulas** are in `analytics.logic.ts` and each KPI's `formula` field: OEE, availability, performance, quality and scrap rate are the shop-floor dashboard's own (`performanceOf` over the same reads
— the drill proves the KPI equals the dashboard); utilisation is (running + setup) ÷ (machine time − offline); machine availability leaves out breakdown and maintenance; MTBF is the time in service not broken down or in
maintenance ÷ breakdowns, MTTR the hours broken down ÷ breakdowns; first pass yield is units not found defective on first inspections (an inspection made again after rework is not counted); schedule adherence is the
operations finished at or before their scheduled finish; on-time delivery the production orders completed by their required date. Scoped by the plant of the record; a record with no plant is the organisation's.

**Dashboards** (`/reports/dashboards/<module>`): five, each with an executive, a management and an operational level, every card opening the report behind it. **Reports** (27; `/reports/<key>`):
`manufacturing.` `production_summary`, `production_orders`, `work_orders`, `production_variance`, `operation_efficiency`, `schedule_adherence`, `machine_time`, `automation_log`; `project.` `status`, `progress`, `cost`,
`profitability`, `resource_usage`, `risk`; `quality.` `inspections`, `defects`, `ncrs`, `scrap`, `rework`; `maintenance.` `downtime`, `breakdowns`, `preventive`, `history`; `materials.` `requirements`, `requisitions`,
`purchase_orders`, `late_deliveries`. Read fresh (manufacturing writes by statement, not through entities the report cache listens to), each within the reader's plant scope. **Alerts** (the 11 of §47, as conditions a rule
can watch): `project.task_overdue`, `project.milestone_missed`, `project.budget_overrun`, `project.risk_high`, `manufacturing.production_delay`, `manufacturing.capacity_overload`, `materials.shortage`,
`materials.supplier_delay`, `maintenance.machine_breakdown`, `maintenance.maintenance_due`, `quality.inspection_failed`. Reports and dashboards have web navigation under *Manufacturing insights*.

### Roles (§51)

`ROLE_TEMPLATES` (the roles an organisation starts from, Settings → Roles → New role from a template) gain the sixteen roles of the document besides the Organization Administrator (the built-in admin role): executive,
project manager, project planner, production manager, supervisor, operator, manufacturing engineer, procurement manager and officer, warehouse manager, quality manager and inspector, maintenance manager and technician, finance manager,
auditor (`MANUFACTURING_ROLE_TEMPLATES`). Permissions are granular (every manufacturing permission is a verb on a resource) and **resource-aware**: giving the role to a person at a plant (`user_location_roles`) scopes every read
and write to that plant. A spec holds every template to permissions that exist, and the auditor and executive to reads only.

### The audit trail (§50)

`manufacturing.audit` already held who, when, what, the entity and its previous and new values; this step adds **where from** — `ip_address` and `device` (the user agent, with the app's `X-Device-Id` when it sends one) —
set by a middleware on manufacturing's routes (`ManufacturingOrigin`, an `AsyncLocalStorage`, so no service passes it down; a change by the system has none). `GET manufacturing/audit` (`manufacturing.audit.view`, whole
organisation only: much of the trail has no plant) reads it by kind of record, record, person, action and time, newest first; `GET manufacturing/audit/entity-types` lists the kinds. A person limited to some plants reads each
record's own history on its page. Screen: Manufacturing → Audit trail.

### Events (§55)

Events are `<Aggregate>-<action>` with the status in the payload, so each name of the document is carried by an existing event (`EVENT_MAP`, held to the contracts by a spec): `ProjectCreated` = `Project-created`, `ProjectApproved` =
`Project-updated` (status approved), `TaskCreated`/`TaskCompleted` = `ProjectTask-created`/`-updated` (done), `ProductionOrderCreated`/`Released` = `ProductionOrder-created`/`-updated` (released), `WorkOrderCreated`/`Started`/`Completed`
= `WorkOrder-created`/`-updated` (in progress, completed), `MaterialReserved` = `ProductionOrder-updated`, `MachineStarted`/`Stopped`/`BreakdownDetected` = `Machine-updated` (running, idle, breakdown),
`QualityInspectionCompleted`/`Failed` = `Inspection-updated` (passed, failed), `SupplierDeliveryReceived` = `GoodsReceiptNote-updated`, `ProjectCompleted`/`Closed` = `Project-updated`. The four that no aggregate raised are new or
new in meaning: `MaterialShortage-created` (`MaterialShortageDetected`), `PurchaseRequirement-created` (`PurchaseRequirementCreated`, one for each requisition raised), `MfgAutomation-created` (what an automation did; status = kind;
`TaskDelayed` is its `production_delay` kind, with the tasks it touches) and `MfgAutomation-updated` (resolved). Every payload carries `organizationId`.

### Notifications (§63)

Subject **Manufacturing automation** (`MfgAutomation`; readers need `manufacturing.automation.read`; "named" recipients are the project's manager and sponsor and the plant's manager) with three presets, off by nobody and
changed by the organisation like any: *A material is short for production* (readers, whoever made the order, the project's people), *A production order is behind* (the project's people) and *A breakdown was dealt with* (the plant's
manager). The existing *A machine broke down*, *An inspection failed* and *A project is blocked* rules stay.

### Search (§64)

`GET manufacturing/search?q=&kinds=&locationId=&limit=` looks in projects, tasks, production orders, work orders, products (variants with a bill), materials (variants in a bill), machines, people, suppliers, customers, inspections,
non-conformance reports and documents linked to manufacturing records. Built in SQL, in a repository, **not in the global search index**, which has no plant to narrow by: a title put there would show to someone limited to another plant.
Every signed-in member may ask; each kind is searched only if the person holds its read permission (documents: the permission of the record they are linked to) and only at the plants their role covers there; a record with no plant is the
organisation's; `locationId` narrows to one plant (and leaves out kinds that have none); two letters at least; `%` and `_` mean themselves. Trigram indexes serve the text columns (migration `1780601310000`).

### Data

Migration `1780601300000-manufacturing-automation`: `automation_events`; `projects.projected_completion`, `projected_at`; `project_risks.auto_key` (a risk raised once for a cause); `audit.ip_address`, `device`. Migration `1780601310000-manufacturing-search-indexes`.
Seed v69: `manufacturing.automation.read`, `.run`, `manufacturing.audit.view` and the analytics permissions of the five modules.

### API (under `/api/v1/manufacturing`)

| Route | |
|---|---|
| `automation/overview`, `automation/events`, `automation/events/:id` (GET) | read (`manufacturing.automation.read`) |
| `automation/scan` (POST) | look now (`manufacturing.automation.run`, whole organisation) |
| `audit`, `audit/entity-types` (GET) | `manufacturing.audit.view` |
| `search` (GET) | any member; each kind by its permission |
| `GET projects/:id` | now carries `projectedCompletion` |

### Permissions

`manufacturing.automation.read` (managers and viewers read), `.run` (managers), `manufacturing.audit.view` (owners and admins; the auditor template), and `<module>.dashboard.view` / `report.view` / `report.export` /
`report.schedule` / `analytics.view` / `alerts.manage` for `manufacturing`, `project`, `quality`, `maintenance`, `materials` (owners and admins all; managers view and export; viewers view).

### Screens

Manufacturing → Automation (counts by kind, the events with their steps, *Look for shortages and delays now*), Audit trail, Search; Manufacturing insights (dashboards and reports) under Reports; a project's *Forecast
completion* beside its target.

### Tests

- Unit: `analytics.logic.spec.ts` (10: utilisation, availability, MTBF, MTTR, first pass yield), `automation.logic.spec.ts` (14: what steps add up to, delay, shortage window, affected tasks, forecast completion, risk),
  `event-map.spec.ts`, `role-templates.spec.ts`; the dashboards, KPI and report registries' specs (they hold every definition to what exists).
- Endpoint: `QUEUE_PREFIX=e2e-mfg npx jest --config ./test/jest-e2e.json --forceExit manufacturing-automation` (28: every dashboard at every level, every KPI and report and alert condition run against the tables; a breakdown
  stopping what ran on it, naming the alternatives, scheduling again, once, resolved; settings turning steps off; a shortage raising the requisition and the risk, once, resolved with its order, left for later when not needed soon;
  a delay scheduling again, finding tasks, moving the forecast, raising the risk; the audit trail with address and device; search by plant, by permission, by organisation).
- Drill: `manufacturing:drill` (step 9: the step-2 breakdown recorded and resolved, a shortage with its requisition, a delay rescheduled, the OEE KPI equal to the dashboard, the trail, search).
- Tenancy sweep: `TENANCY_ROUTES=/api/v1/manufacturing/` (fixture: a breakdown, so an automation event).
- Web: stubbed `cypress/e2e/manufacturing-automation.cy.ts`; live `cypress/e2e/live/manufacturing-automation.cy.ts` (written, not run).

### Known limits

- **Capacity overload** (the alert) compares the week's scheduled work minutes with the work centre's opening hours × units × efficiency; it does not subtract maintenance or leave.
- **Delay** is found by the scan every ten minutes (or *Look now*), not the second it happens; a **delay on a subcontracted operation** is not acted on (the supplier's date is procurement's: the *late deliveries* report and `materials.supplier_delay`).
- The **forecast completion** is a date arithmetic over orders and tasks, not the critical path of the project network (that is `GET scheduling/critical-path/projects/:id`); it is as good as the tasks' dates.
- **A shortage** is looked at for the orders needed within the window, 200 at a time, nearest first; stock moved elsewhere is seen at the next scan or the next time the order's materials are checked.
- **The audit trail** records what step 1–8 audited (the examples of §50 are all audited: a bill version, a production quantity, a task rescheduled, an inspection failed, a work order completed, a machine's state);
  a purchase order's approval is procurement's own audit. Reading it is for the whole organisation.
- Search does not look inside files' content (Drive's own search does), nor at records of other modules beyond suppliers and customers.
- Reports read fresh every time (no cache): the performance pass is the user's to schedule.

## Output follows the stock-flow settings (17 October 2026)

Part of "inventory into work and assets" ([STOCK_FLOW.md](STOCK_FLOW.md), [STOCK.md](STOCK.md#ledger-entries-by-purpose-17-october-2026)).

### Where output lands, and waiting for release

The shop floor's settings gain **Finished goods, co-products and by-products are received into** (`receiveIntoInventoryTypeId`: any visible type; empty: the item's own at the plant) and **Output waits for quality's release** (`holdOutputForRelease`, default off). With it on, every line a work order receives (product, co-products, by-products) goes into the organisation's *Awaiting release* type, which is not for sale, and a **hold** is kept for it (`manufacturing.output_holds`: the work order, item, place, role, quantity, batch, value, the receipt movement; `released_quantity` and `rejected_quantity`; status `held` until nothing waits, then `closed`).

People with `manufacturing.output.release` (owners, administrators, managers, the production and quality manager role templates) act on a hold, for some or all of it:

- **Release** (`POST /manufacturing/output-holds/:id/release`): stock moves the units from *Awaiting release* into the type the settings name (else the item's own), **at the cost they carry** (a pair of movements, `ProductionRelease`; nothing is posted when both types share a stock account).
- **Reject** (`POST …/reject`, with a reason): the units are scrapped from *Awaiting release* as a **quality scrap** (`QualityScrap`, source the hold) at what they cost: Dr production scrap, Cr stock, a cost of poor quality (the cost sheet's *scrapped by reports* reads it); the work order's good, received and spoilt counts follow (a co- or by-product has none of its own).

Both are audited (`output_hold` in the trail), announced (`OutputHold-created/updated`, on `/live` for `manufacturing.output.read`) and refused beyond what waits. `GET /manufacturing/output-holds` is a keyset page (`cursor`, `limit`; `status`, `workOrderId`, `variantId`); web: **Quality and cost → Output awaiting release** (`/manufacturing/output-holds`). Settings off, or on and later off: holds already made stay actionable.

### Scrapping goods already received

A quality report that scraps units reported good (`NcrsService.dispose`) used to take them off the work order's counts and leave them in stock. Now the units come off in the order that is true: units made and never received (held back for a final inspection, or received only at completion) first, then units in stock, which are **issued as a quality scrap against the report at what they cost there** (Dr production scrap, Cr stock), the work order's `received_quantity` falling with them (`writeOffSplit`, `WorkOrderStockService.scrapReceived`). Refused, with nothing recorded, when stock no longer holds them. Bought goods scrapped after a failed inspection post to the same account (`production_scrap`, falling back to stock adjustments until the role is set).

### Under a project

Every movement a work order makes carries its project (`item.stock_movements.project_id`), so stock's entry (Dr work in progress, Cr stock, and back) is **under the project's value in the ledger's Project dimension**; so is the conversion cost added to finished goods at completion. A task that waits for material now waits for what is **free** (stock less what is held for work orders and what waits out of sale), not for what is in the building.

### An asset made for own use

A production order may name an asset under construction (`capitaliseToAssetId`, [ASSETS.md](ASSETS.md#maintenance-accounting-and-assets-under-construction-17-october-2026)): the product is **not received into stock**; the cost the work in progress carried goes into the asset (Dr assets under construction, Cr work in progress, under the project) and the conversion cost applied at settlement follows. Co- and by-products are stocked as usual. The work order still counts what it made and clears its work in progress.

Tests: `shopfloor.logic.spec.ts` (`writeOffSplit`, `lastOperationOf`), `quality/output-release.logic.spec.ts` (12), `stock-ledger.logic.spec.ts`; the manufacturing drill (a received gizmo scrapped through a report and the books read back, the cost sheet's cost of poor quality, a held run released one by one and rejected, the status of the hold, the plates of a project's work order under the project in the journal, an asset made for own use and its cost collected). Deferred: e2e route specs, tenancy sweep for `/api/v1/manufacturing/output-holds`, Cypress.

## The screens rebuilt from the v3 boards (19 October 2026)

Production orders, the work order and the four manufacturing dashboards were rebuilt from `erp4c-mfg-production-orders`,
`-work-order`, `-production`, `-quality`, `-maintenance` and `-materials` (lane `feature/screens-operations-people`; inventory
`design-handoff/feature-inventory/manufacturing.md`). What the API gained, all additive (an old caller gets what it always
got):

- **`GET /manufacturing/production-orders`** answers, with the rows, **`counts {open, late, short, all}`** (the numbers on
  the pills, for the places the person may read and the plant chosen, whatever the other filters say), a **`locationId`**
  filter (one plant), a **`short=true`** filter (planned, released or under way with materials short or part held: the
  same conditions its pill counts), and on every row **`short[{item, qty, ...}]`** (what the order lacks, summed over its
  work orders and read against stock for the whole page in one batch) and **`stopped`** (the first operation that cannot
  go on: machine, since when, operation number). `projectedFinish` and `planProblems` were already there.
- **A stopped operation explains itself (rules 4 and 5).** The work order (`GET /work-orders/:id`) and the production order
  (`GET /production-orders/:id`) carry **`stoppages[]`**: an operation that is under way or has a stop reported on it
  (`kind: stopped`), or that is still to start with a machine that is broken down, in maintenance or offline
  (`machine_out`); its machine and state, since when (the open downtime record's start, else the machine's state
  since), the reason reported, **who is on it** (clocked on, else given it), the later operations that wait behind it,
  and **the open maintenance job** of the machine's asset (asset management stays the system of record: read through the
  `MaintenancePort`, never written). The work order also carries `orderProjectedFinish` and each operation `actualMinutes`.
- **`GET /manufacturing/machines/status`** (`manufacturing.machines.read`, optional `locationId`): every active machine at
  the places the person may see (at most 200) with `state` and `stateSince`, `outOfUse`, `nextServiceOn` (the earliest
  next-due day of its active dated schedules) and `overdueDays` (0 when not past it), `lastBreakdownAt`, `waitingWorkOrders`,
  what it is running and who is on it, and the open `job`. Machines out of use come first, then those whose service is the
  most overdue. This is what the maintenance dashboard's tiles draw.
- **Three registered breakdowns** (analyses, `manufacturing/analytics/definitions/manufacturing.analysis.ts`):
  `manufacturing.downtime_by_reason` (hours stopped by the reason reported, planned or not), `quality.defects_by_type`
  (units with a defect by kind of defect) and `materials.supplier_on_time` (the share of receipts of items production draws,
  in the last 90 days, that arrived by the day the order promised: the same test as the supplier scorecard). A measure may
  be a **rate** (`rate: true`): its share is its own value and it is never summed. They also appear in Analysis.
- **Dashboard widget types `equation`, `pareto` and `tiles`** (`analytics/dashboards`): the KPI registry stays the data. An
  equation names its KPIs (the parts, then the whole) and where each opens; a pareto names an analysis; tiles name either a
  strip of KPIs (with a word beside a figure above a line) or a collection (`machines`, `shortages`). A widget may ask to be
  told in words (`look: plain`, a `note`, `spark`, a `secondary` KPI). The registry refuses an equation without its whole,
  a pareto without an analysis, a tile naming no real KPI. **Every figure a manufacturing dashboard draws is a registered
  KPI key** (a spec checks every widget, part, tile and secondary figure). The four dashboards' standard levels are laid out
  as the boards draw them; every widget they had stays in the catalogue, so Arrange can still place it. Titles are
  "Production dashboard", "Quality dashboard", "Maintenance dashboard", "Materials dashboard" and "Manufacturing projects
  dashboard".
- **One number, two screens.** OEE, its three parts, scrap rate and throughput are worked out by `windowPerformance`
  (`shopfloor/floor-performance.ts`), which the shop-floor dashboard and the KPIs both call. The drill asserts that over the
  very window the shop-floor dashboard read, every KPI equals its figure (to the KPI's two decimals).
- Saved views: the list key `manufacturing.production-orders` is registered. No migration, no new permission, no seed.

Tests: `production/{stoppage,production-order-list}.logic.spec.ts`, `resources/machine-status.logic.spec.ts`,
`production/repositories/manufacturing-reads.spec.ts` (what each new query asks: the organisation in every one, every
parameter named, one query for a page however many rows, no OFFSET), `analytics/dashboards/dashboards.spec.ts` (real KPIs
only, the equation, the three breakdowns, what each new widget accepts). The drill (`manufacturing:drill`) gained the
stopped-operation reads and the one-number assertion: written, **not run** (CI runs it). Deferred: a tenancy sweep case
for `/manufacturing/machines/status`.

## History

- 11 October 2026: step 1.
- 11 October 2026: step 2.
- 11 October 2026: step 3.
- 11 October 2026: step 3 gaps (risk register, project changes list), step 4.
- 11 October 2026: step 5.
- 11 October 2026: step 6.
- 11 October 2026: step 7.
- 11 October 2026: stock held for production is its own kind of inventory, not for sale.
- 11 October 2026: step 8.
- 11 October 2026: step 9 (automation, alerts and analytics) — Phase 11 complete.
- 17 October 2026: output follows the stock-flow settings, waits for release, scrapped goods leave stock, stock under the project, an asset made for own use.
- 19 October 2026: screens rebuilt from the v3 boards: production orders with counts, what is short and the order held up; stoppages with the maintenance job; machine status; the equation, pareto and tile-grid dashboards; downtime by reason, defects by type and supplier delivery; OEE worked out once.
