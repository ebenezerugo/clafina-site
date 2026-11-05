# Field service (the field service pack)

Installers, repairers, cleaners, pest control: dispatch, jobs and checklists on site (boards `erp4f-fs-*`,
RECOMMENDATIONS-F §5; package `design-handoff/feature-inventory/field-service.md`). Built 25 October 2026 on
`feature/industry-packs-rest-api`.

**A job is a project task** ([PROJECTS.md](PROJECTS.md)): there is no parallel job table. `field_service.jobs` is the
task's service side, keyed by the task's id. Making a job makes the task through `TasksService` (its rules and the
`projects.tasks.create` permission apply too); on site starts it, finishing completes it, cancelling cancels it. Time on
site is a timesheet entry (`TimeEntriesService.log`), a part used is project stock issued from the van
(`ProjectStockService.issue`, the van is a stock location), the invoice on site is the ERP's customer invoice
(`PackInvoicer`).

## The pack

`field_service`, version 1 (`packs/catalogue/field-service.pack.ts`), kind `service_depot`. Features
`field_service.dispatch`, `.jobs`, `.checklists`, `.technicians`. Words: Task → Job. Menu "Field service": Dispatch,
Jobs (every day); Checklists, Service areas (set up). Six Home cards (declared). The installer writes nothing.

## Data (schema `field_service`, migration `1790450000000`)

| Table | What it holds |
|---|---|
| `checklist_templates` | Name, job type, current version, active. |
| `checklist_template_versions` | Append-only (SELECT, INSERT): the steps (`id`, `label`, `answer` tick/number/photo/text/part, `required`, `min`/`max` and a `followUp` title for a number, `variantId`/`quantity` for a part), whether the customer signs, a note. A job keeps the version it started with. |
| `jobs` | Keyed by task id: project, place, customer, site and its position, the window, technician and van, checklist version, status (waiting, assigned, en route, on site, done, cancelled), priority, start and finish, signature (a Drive file, who signed, when), payment reference or invoice, the job and step it follows up (unique: a follow-up is raised once). |
| `job_answers` | One per step (changeable until the job is done). |
| `job_photos`, `job_parts` | Drive files per step; parts used (once per step) with whether the van's stock issue went through and, if not, why. |
| `technician_locations` | Each technician's last position; an older report (an offline sync) never moves the pin back. |
| `service_areas` | Where a place's technicians go (places, technicians). |

## Rules

- `logic/checklist.logic.ts`: a template's steps are checked (ids unique, limits only on numbers, a part names its
  item, a follow-up only on a number); an answer must be of its step's type; a number outside its limits raises the
  step's follow-up job when the job is finished; finishing needs every required step, the signature when the version
  asks, and a payment reference or invoice lines; the phone's next step is the first required one not done.
- `logic/dispatch.logic.ts`: a technician's live jobs may not overlap (refused in words, naming the other job); a job is
  late `lateAfterMinutes` after its window opens with nobody on site (worked out, never stored); moves allowed only
  from where a job stands; minutes on site from arriving to finishing.
- A part that cannot be issued from the van (no stock there) is still recorded as used, with the reason; the van is
  reconciled at the end of the day. Time that cannot be logged (a week already submitted) is a note on the result.
- Moves are announced (`FieldServiceJob-updated`) so the technician's app and the board hear them on `/live`.

## Settings (`DocumentType.FIELD_SERVICE`)

`lateAfterMinutes` (30), `signatureByDefault` (true), `logTimeOnFinish` (true), `postInvoices` (submit), `dueInDays`
(7), `serviceItemId` (required to invoice on site).

## API (`/api/v1/field-service`)

| Route | Permission |
|---|---|
| `GET dispatch?date&locationId` · `GET jobs` · `GET jobs/:taskId` · `GET vans` · `GET service-areas` | `field_service.jobs.read` |
| `POST jobs` | `field_service.jobs.create` |
| `POST jobs/:taskId/assign` · `POST service-areas` · `PUT service-areas/:id` | `field_service.jobs.dispatch` |
| `POST jobs/:taskId/status` · `…/steps/:stepId/answer` · `…/photos` · `…/signature` · `…/finish` | `field_service.jobs.work` |
| `GET checklists` · `GET checklists/:id` | `field_service.checklists.read` |
| `POST checklists` · `POST checklists/:id/versions` · `POST checklists/:id/active` | `field_service.checklists.manage` |
| `GET technicians/live` / `POST technicians/location` | `field_service.technicians.read` / `.report` |

`GET jobs?locationId&status&technicianStaffId&from&to&cursor&limit`: newest window first, keyset on `(window_start,
task_id)` (`next` is the cursor); `status` takes one or several, comma separated; `from`/`to` are inclusive UTC days
the window opens on, as on the board; `late` worked out per row. The first page (no `cursor`) carries `counts`: every
status (`waiting`, `assigned`, `en_route`, `on_site`, `done`, `cancelled`) with its number under the page's filters but
the status (places, technician, days), one grouped count, for the tabs; later pages omit it. Indexes
`IDX_field_service_jobs_list` and `_status` (migration `1791100000000`) beside the day and technician ones.

`GET vans?search&cursor&limit`: **a van is a stock location of kind `van`** (`packs.location_profiles.kind`, set by
`PUT packs/places/:locationId { kind: 'van' }`; the pack declares the kind), within the places the reader may see, by
name with a keyset cursor. A job's `vanLocationId` (on `POST jobs` and `…/assign`) must be one of them: another
place is refused (422, "That place is not a van"), so a part used on site is issued from a van's stock.

`field_service.setup.manage` reaches every location and may report another technician's position. Seed
`1790450000101`: owners and administrators all; managers dispatch, work jobs, keep checklists; viewers read.

## Events

`FieldServiceJob`, `FieldServiceChecklist` (created, updated), `FieldServiceTechnician` (updated). Topic
`commerce.field-service.v1`; ids and states only; live aggregates held to the read permissions.

## Tests

Unit (run): `logic/checklist.logic.spec.ts` (checklists and dispatch), `services/van.service.spec.ts` (vans, the jobs
list's paging and its counts), `logic/job-counts.logic.spec.ts`, `field-service-permissions.spec.ts`,
`field-service.settings.spec.ts`. Written, not run: `test/field-service.e2e-spec.ts`, tenancy-sweep fixtures.

## Not yet

Route optimisation and the map's routes (positions are kept; the route is drawn by the screen); the technicians list
and skills (HR's); job templates by job type beyond a checklist's `jobType`; telling the customer the arrival window
(the notification centre's subject); the offline store on the phone (mobile phase: the API takes `takenAt`,
`signedAt`, `finishedAt` and a position's `at` so a later sync keeps the true times); support tickets raising jobs.

## History

- 25 October 2026: built.
- 25 October 2026 (`fix/followups-1025`): `GET jobs` (keyset, filters by status, technician, day), `GET vans` (the
  `van` kind), the van check on create and assign; migration `1791100000000`.
- 25 October 2026 (`fix/api-gaps-1025b`): `counts` by status on the first page of `GET jobs`. No migration.
