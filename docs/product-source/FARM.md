# Farm pack (`modules/farm`)

The Agriculture industry pack: fields on the map with their measured area, soil tests, crop plans that become a
season's budget, seasons with plan against actual, and (phases 2–7) tasks and piece work, inputs and withholding,
batches and animals, harvest, lots and traceability, costs and profit, and outgrowers. The package it is built to is
`design-handoff/feature-inventory/farm.md` (boards `erp4e-*`, RECOMMENDATIONS-E.md); the acceptance numbers below
(A1–A105) are that package's section 5.

## Shape

- Switched on per place by the industry packs (`packs/catalogue/farm.pack.ts`, key `farm`, kind `farm`). Every route
  needs the pack's feature on at the farm (`FeatureResolver`, 403 `PACK_NOT_ENABLED` otherwise) and its permission; a
  person attached to some farms sees only those (`PackLocationScope`: a record elsewhere is "not found", a write there
  403). `FarmAccess` holds the three checks.
- Controller → use case (one class per operation, `*/use-cases/`) → service → repository (all SQL). Schema `farm`,
  every table keyed `(organization_id, id)`, row-level security (`tenant_isolation`), granted to `commerce_app`. Links
  between tables are logical (no foreign keys), as in the other packs. Retired, never deleted.
- The ledger and stock are reached only through ports (`modules/adapters/farm`: `FARM_LEDGER_ADAPTER`,
  `FARM_STOCK_ADAPTER`); other modules take from the farm only what `public-api.ts` exports.
- Every change writes its outbox event in its own transaction (`FarmEvents.announce`, topic `commerce.farm.v1`,
  aggregates `Farm<Thing>` in `events/contracts.ts`); every payload carries `organizationId`.
- Lists are keyset pages (`limit` ≤ 100, `cursor`, `{ items, nextCursor, counts }`), each on an index led by
  `organization_id`. Money and hectares are exact decimals carried as text; areas are stored in hectares (shown in the
  unit the settings choose).

## Phase 1 — pack, set-up, fields, crop plans, seasons *(built 25 October 2026, `feature/farm-phase-1`)*

**Data** (migration `1789600000000-farm`): `farm.place_kinds`, `fields`, `soil_tests`, `crop_plans`,
`crop_plan_steps` (versioned with the plan), `seasons`, `season_budget_lines`, `season_cost_lines` (unique by source,
posting arrives in phase 6), `projection.farm_season_totals` (kept in the transaction of each change);
`finance.dimension_type_enum` + `FARM_SEASON`; season numbering rules (SEA-…) for existing organisations.
Permissions seed `1789600000001-sync-permission-catalog-farm`.

**API** (`/api/v1/farm/…`)

| Route | Permission | Does |
|---|---|---|
| `GET places` | `farm.home.read` | the farms carrying the pack (the picker; all farms by default, fixed when there is one) |
| `GET place-kinds`, `PUT place-kinds/:locationId` | `farm.settings.read/manage` | what each farm farms (crops, poultry, fish, livestock, outgrowers, any mix) and the pages that follow (A5, A98) |
| `GET settings`, `PUT settings/:group` | `farm.settings.read/manage` | every registered group with what is in force, the stored values and "Changed" against the pack standard; zod-checked, unknown keys refused (A97) |
| `GET providers`, `POST providers/:slot/test` | `farm.settings.read/manage` | the maps slot (OpenStreetMap, Google with a sealed key, Mapbox planned) and a typed, timed connection test (A100–A102) |
| `GET map-tiles/:z/:x/:y` | `farm.fields.read` | tiles through Commerce so a provider key never reaches the browser |
| `GET/POST fields`, `GET/PATCH fields/:id`, `POST fields/:id/retire` | `farm.fields.*` | fields; lease cost only on leased or rented land (A14); retiring keeps seasons (A15) |
| `POST fields/:id/boundary` | `farm.fields.manage` | draw, import or walked, stored as the same GeoJSON (A12); area on the ellipsoid (A9); self-crossing refused (A10); an overlap answers 409 with the overlap and is kept with a reason, or refused by the settings (A11) |
| `GET fields/map?colourBy=crop\|stage\|problem` | `farm.fields.read` | every field's colour with its text twin (A13; vigour with imagery, phase 7) |
| `GET fields/:id/seasons` | `farm.fields.read` | the field's seasons and rotation advice (warns, never blocks, A21) |
| `GET/POST fields/:id/soil-tests` | `farm.fields.*` | soil tests read against their aims and last year's (A20) |
| `GET/POST crop-plans`, `GET/PUT crop-plans/:id`, `POST crop-plans/:id/retire` | `farm.plans.*` | plans with cost a hectare on the seven lines (A22), margin at today's price and the farm's own 3-season yield (A35); an edit writes a new version |
| `POST seasons/preview` | `farm.seasons.manage` | the budget (cost a hectare × area, A24), inputs short against the store, the rules, what happens next; writes nothing |
| `POST seasons`, `GET seasons`, `GET/PATCH seasons/:id`, `POST seasons/:id/move-planting` | `farm.seasons.*` | start from a plan (snapshot, A25; budget lines; ledger dimension value; SEA number), seasons a year and intercropping (A27), stage from the crop's list (A28), forecast as a dated projection (A29) |
| `GET seasons/:id/plan-vs-actual` | `farm.seasons.read` | the seven lines with plan, actual and the source of every figure (A31) |

**Settings**: `FARM_FIELDS` (area unit, seasons a field a year, intercropping, overlapping fields), registered with
the code that enforces each (`document-settings/definitions/farm-fields.settings.ts`).

**Events**: `FarmPlaceKind-updated`, `FarmField-created|updated`, `FarmSoilTest-created`, `FarmCropPlan-created|updated`,
`FarmSeason-created|updated`.

**Tests**: unit specs for `logic/*.logic.ts` and the permissions (`farm-permissions.spec.ts`), run; the endpoint spec
`test/farm.e2e-spec.ts` and the drill `npm run farm:drill` (`drills/farm-drill.ts`: pack on, Dam Field 18.4 ha, maize
905,000 a hectare, a season budgeting cost a hectare × area, the plan's later edit leaving it alone) are written and
run once with the other lanes.

## Phase 2 — tasks, calendar, work and piece rate *(built 25 October 2026, `feature/farm-phases-2-7`)*

**Data** (migration `1789620000000-farm-work`): `farm.task_types` (pay mode day/hour/piece, unit, rate, sign-off,
weather-sensitive; the pack installs nine defaults once), `tasks` (from a season's plan, by hand, or from a scouting
treatment; `UQ_farm_tasks_plan_step` makes a step a task once), `work_records` (priced at the task's rate when recorded;
`client_id` unique per organisation; `recorded_at`, `device_id` kept for offline rows), `payroll_inputs` (one line per
signed record, unique), `weather_readings` (daily and hourly, written by the weather job). `ComponentType` and both HR
enums gain `piece`. Permissions seed `1789620000001` (`farm.work.read|manage|signoff`).

**API**

| Route | Permission | Does |
|---|---|---|
| `GET/POST tasks`, `GET/PATCH tasks/:id` | `farm.work.read/manage` | tasks with counts by status and pay mode; pay mode, rate and unit override the type's (A36); finish-to-start dependencies kept; a task with work is finished, not cancelled |
| `PATCH tasks/:id/move` | `farm.work.manage` | another first day; the answer says the rain before and after (A34) |
| `GET/POST tasks/:id/work` | `farm.work.read/manage` | a batch of records, once per `clientId` (A39); piece work needs a unit, a rate and units (A37, 422 otherwise); the rate is kept on the record, so a later change moves nothing (A37); casual workers are staff without a sign-in (A42) |
| `POST tasks/:id/sign-off` | `farm.work.signoff` | with sign-off on (A40) work waits unconfirmed; sign-off posts labour to the season once per record (`season_cost_lines` source `farm.work_record`) and makes the payroll lines once (A41) |
| `GET task-types`, `PUT task-types/:id` | `farm.work.read/manage` | defaults per kind of work; `readyForPiece` |
| `GET payroll-inputs?period=` | `farm.work.read` | the month's signed lines (keyset) and each person's totals; a payroll run adds the unpaid ones (`FarmPayrollProvider`, components `FARM_PIECE` type piece and `FARM_DAY`) and marks them paid when the run is paid |
| `GET calendar?from&to&groupBy=field\|team` | `farm.work.read` | tasks by field or team, the weather of each day with whether a spray is fine, held bars (harvest withholding, held tasks), every spray meeting rain with the rule, the provider and the nearest dry day (A33) |
| `GET home`, `GET attention` | `farm.home.read` | the four figures (land in season; cost a hectare as spend over hectares against budget over the same hectares, A2; the expected harvest as a dated projection; eggs today from phase 4), typed attention (A3), the weather card naming its provider and the rule that warned (A7), seasons growing |

Starting a season materialises its plan's steps of work as tasks from the planting day; moving the planting day moves
them (`all`: every task not done or cancelled; `open`: only those not started) (A26).

**Weather**: slot `weather` in the integrations catalogue — Open-Meteo (free, no key) available; OpenWeather, Tomorrow.io
and the national agency planned (key-based ones in phase 7). `FarmWeatherProcessor` (queue `farm-weather`, every three
hours, skipped under `NODE_ENV=test`) refreshes each farm at the middle of its drawn fields. `POST providers/weather/test`
answers a typed, timed result and keeps it with the slot.

**Settings**: `FARM_WORK` — default pay mode, sign-off required (on), no spraying within 12 hours before rain (decision
13), what counts as rain (0.5 mm an hour or a 60% chance). The spray-before-rain hours live here rather than in
`FARM_INPUTS` because the calendar (phase 2) is what enforces them first; applications (phase 3) read the same value.

**Live**: `farm.summary` (live registry) pushes the home figures on `/live`; Farm aggregates are in `live.constants.ts`.

**Events**: `FarmTaskType-created|updated`, `FarmTask-created|updated`, `FarmWork-created|updated` (entity: the task
whose work changed), `FarmWeather-updated`.

**Tests**: `logic/work.logic.spec.ts`, `weather.logic.spec.ts`, `attention.logic.spec.ts` (run). Written, not run:
`test/farm-work.e2e-spec.ts`, `npm run farm:work-drill`, the farm block of `test/tenancy.sweep-spec.ts`.

## Phase 3 — inputs, withholding, scouting *(built 25 October 2026)*

**Data** (migration `1789630000000-farm-inputs`): `farm.product_profiles` (one a variant: kind, withholding and
withdrawal days, label rates, approved crops — item tables untouched, decision 3), `applications` (the stock movement,
quantity, area, rate, value at stock cost, method, applicator, protective equipment, a weather copy, `withholding_until`,
`needs_look` with its reasons; `client_id` unique), `scouting_reports` (place, kind, severity, photos, source field app or
satellite, status draft/new/assigned/treated/closed, the treatment task and its expected wait). Seed `1789630000001`
(`farm.inputs.read|manage`, `farm.scouting.read|manage`).

**API**

| Route | Permission | Does |
|---|---|---|
| `GET/PUT product-profiles[/:variantId]` | `farm.inputs.read/manage` | products' farm profiles |
| `POST applications` | `farm.inputs.manage` | issued from the farm's store at stock cost through `FARM_STOCK_ADAPTER` (A45) and posted to the season's line for the kind (seed, fertiliser, chemicals; source `farm.application`, once); a crop-protection product without a profile is 422 `needs_profile` (A44); `withholding_until` = applied + days (A46) holds the season's harvest and its harvest tasks; the weather nearest the time is copied and never re-read (A47); missing equipment, an untrained applicator, a rate off the label or a crop it is not approved for mark it "Needs a look" and it stays in the register (A48); a scouting treatment task recorded marks its report treated |
| `GET applications` | `farm.inputs.read` | the register (field, season, kind, waiting, missing equipment) with its four counts: applications, fields waiting, without equipment, value from the store (A49) |
| `GET applications/export` | `farm.inputs.read` | the auditor's CSV of every application of the filter (A53; bounded at 20,000 rows, a period otherwise) |
| `GET/POST scouting`, `GET scouting/:id`, `POST scouting/:id/photos` | `farm.scouting.*` | reports (a draft without photos while the settings ask for them, A52), with suggested treatments and their waits against the planned harvest |
| `GET scouting/map` | `farm.scouting.read` | open reports with a place, colour by what was found and the words beside it; drafts are not on it |
| `POST scouting/:id/assign-treatment/check` | `farm.scouting.manage` | weather on the day, withholding against the planned harvest, store stock and cost; writes nothing (A50) |
| `POST scouting/:id/assign-treatment`, `POST scouting/:id/close` | `farm.scouting.manage` | a calendar task (source scouting), the wait noted, no stock reserved (A51); closed with a note |
| `POST scouting/from-satellite` | `farm.scouting.manage` | a weak patch as a suggestion for a scout (one open a field), never a task (A18; the imagery job of phase 7 calls the same service) |

**Settings**: `FARM_INPUTS` — a harvest within a waiting period (warn; block is added with harvest recording in phase 5,
A99), protective equipment required and which items, trained applicators, rates held to the label. `FARM_WORK` gains
`scoutingPhotosRequired`.

**Attention** gains `scouting_found` / `satellite_flag` (high or watch, open) and `application_needs_look` (last 14 days).

**Events**: `FarmProductProfile-created|updated`, `FarmApplication-created` (`status` waiting or clear), `FarmScouting-created|updated`.

**Tests**: `logic/inputs.logic.spec.ts` (inputs and scouting logic, run). Written, not run: `test/farm-inputs.e2e-spec.ts`,
`npm run farm:inputs-drill`, tenancy fixtures for the three tables.

## Phase 4 — batches, animals, vaccinations *(built 25 October 2026)*

**Data** (migration `1789640000000-farm-batches`): `farm.batches` (numbered by kind — BRL, LAY, FSH, LIV — through four
numbering types held to the batches settings), `batch_daily_records` (one a day, unique), `batch_egg_records` (a grade a
day, crates of thirty), `vaccination_schedules` and `_steps`, `batch_health_events` (one due row a step a batch),
`herds`, `animals` (tag unique), `animal_weights`, `breeding_events`; `season_cost_lines` gains `batch_id` (one of
season or batch always) and the batch lines (stock, feed, medicine, house); `projection.farm_batch_totals`. Seed
`1789640000001` (`farm.batches.read|manage`, `farm.animals.read|manage`).

**API**

| Route | Permission | Does |
|---|---|---|
| `POST batches/preview` | `farm.batches.manage` | number, start cost, feed to finish (a projection), the schedule's shots, the rules; writes nothing (A67) |
| `POST batches` | `farm.batches.manage` | placed against a posted goods receipt at the farm (A54): the line's birds issued from the store, their cost the start cost (`stock` line); a ledger dimension value; the schedule's shots due; a receipt line starts one batch |
| `GET batches`, `GET batches/:id`, `GET batches/:id/measures` | `farm.batches.read` | one list for every kind with the measure that fits it (cost a kilo or a head), the mortality chip, the next event, counts (open, over mortality, laying, low feed); the page; FCR, mortality, ADG, laying rate, cost a kilo and an egg by line, weight band, days of feed, the day-42 projection (A55–A57, A62, A65) |
| `POST/GET batches/:id/daily` | `farm.batches.*` | one record a day (a second answers the first); deaths need a cause from the list (A58); feed issued from the store at that day's cost, posted to `feed` once (A66) |
| `POST batches/:id/eggs` | `farm.batches.manage` | graded and crated in thirties; sellable grades into the settings' selling type, cracked eggs and every egg laid in a withdrawal period into one not sold (A60) |
| `POST batches/:id/health` | `farm.batches.manage` | a shot or medicine settling its due row or alone; issued and costed to `medicine`; its withdrawal (the item's profile, else the step's, else the days given) blocks sale (A61) |
| `POST batches/:id/close` | `farm.batches.manage` | closed or sold (sold: into stock as the sale item with the batch number as lot, at cost to date); refused with `FARM_WITHDRAWAL` while a withdrawal runs |
| `GET vaccinations`, `GET/PUT vaccination-schedules[/:id]` | `farm.batches.*` | due first across batches with withdrawal (A64); schedules by breed (Ross 308 broilers, layers installed), steps replaced, shots already due keep theirs |
| `GET/POST animals`, `GET animals/:id`, `POST animals/:id/weights|health|breeding` | `farm.animals.*` | a unique tag (A63); parents, offspring, calvings, weights, health; a withdrawal blocks its sale. `breeding` is an endpoint the package did not list; the page needs calvings recorded |

**Sales are refused in withdrawal**: `FarmSaleGuard` registers a `StockIssueHooks` hook — a sales document taking out
the item a batch is sold as while the batch is within a withdrawal period is refused (409 `FARM_WITHDRAWAL`, decision 15).

**Settings**: `FARM_BATCHES` — daily record required and its cut-off hour, causes of death, mortality limit by kind
(broilers 3%, layers 5%, fish 10%, livestock 2%), schedules applied at placing, the item each egg grade is and the
inventory types (by code) sellable and cracked eggs go to. No pack-owned inventory types: the settings name existing ones.

**Attention** gains `mortality_over_limit`, `vaccination_due`, `feed_days_left`, `missed_daily_record`. Home's eggs
today and laying rate are live (`farm.summary`). Tasks may be for a batch: their signed labour costs the batch.

**Events**: `FarmBatch-created|updated`, `FarmEggs-created`, `FarmHealth-created|updated`, `FarmAnimal-created|updated`,
`FarmSchedule-updated`.

**Tests**: `logic/batch.logic.spec.ts` (measures, daily checks, crates, schedules; run). Written, not run:
`test/farm-batches.e2e-spec.ts`, `npm run farm:batches-drill`, tenancy fixtures.

## Phase 5 — harvest, lots, traceability *(built 25 October 2026)*

**Data** (migration `1789650000000-farm-harvest`): `farm.lots` (one a season, day and grade, unique; weighed, lost to
drying, released; drying / stored / released / recalled), `harvests` (a weighed load, its slip HS-…, its stock receipt,
any waiting-period warning; `client_id` unique), `lot_allocations`, `storage_checks`, `lot_recalls` (previewed /
issued, RCL-…), `trace_pages` (the last published snapshot, revoked lots), `grade_prices`. Lots are numbered LOT-…. Seed
`1789650000001` (`farm.harvest.*`, `farm.lots.*` with `farm.lots.recall`, `farm.traceability.*`).

**API**

| Route | Permission | Does |
|---|---|---|
| `GET harvest/overview` | `farm.harvest.read` | blocked fields, weighed / stored / waiting release / lots, the planned harvest (a projection) |
| `POST/GET harvests` | `farm.harvest.*` | a load into the lot of its day and grade (A69), received into stock — into the type produce waits in while the settings say so (A70) — carrying the lot number; within a waiting period it warns, or is 422 `FARM_WITHHOLDING` when the inputs setting is block (A72, block now offered, A99); the season's tonnes move |
| `GET lots`, `GET lots/:id` | `farm.lots.read` | weighed, drying loss, stored, released, sold, left; counts |
| `POST lots/:id/dry` | `farm.lots.manage` | the loss written off the stock and against the lot; the weighed weight stays (A68: 41.0 t weighed, 39.0 t stored) |
| `POST lots/:id/release` | `farm.lots.manage` | a type transfer (stock-release module, its numbering, reasons and approvals; needs `inventory.releases.*` too), refused above the release moisture (A70) |
| `POST lots/:id/sales` | `farm.lots.manage` | records a sale of the lot (document, line, buyer, kilos) for trace and recall |
| `GET lots/:id/trace` | `farm.lots.read` | back (field, season, inputs, slips, storage) and forward (sales, buyers, stock left) (A74) |
| `POST lots/:id/recall/preview`, `POST lots/:id/recall` | `farm.lots.recall` | who it reaches; the stock left for sale held (moved back to the waiting type); nothing sent; issuing needs a reason, recalls the lot and emails each buyer through the organisation's sending, so send limits apply (A75) |
| `GET/POST storage-checks` | `farm.lots.*` | against the store limits; over a limit raises `farm.storage.limit_exceeded` and attention `storage_over_limit` (A71) |
| `GET/PUT grade-prices` | `farm.harvest.*` | prices a kilo by crop and grade from a day |
| `GET/PUT trace/settings`, `POST trace/publish`, `POST trace/revoke/:lotId` | `farm.traceability.*` | what the page shows; the snapshot published as `farm.trace.published` for the store service (only the parts switched on, never a boundary); a revoked lot drops off and its page says "no longer valid" (A76, decision 7) |

**Settings**: `FARM_HARVEST` (lots on the stock, grades, produce waits, the types produce waits in and is released to,
the release reason, release moisture 14%, store limits 14% / 30 °C, the item each crop is received as) and `FARM_TRACE`
(what the page shows, certifications). `FARM_INPUTS.withholdingOnHarvest` now offers block.

**Not here**: a sales line naming a lot and the lot printed on the invoice and waybill (A73) need the sales documents to
carry a lot; the farm records lot sales through `POST lots/:id/sales` until then (open). A release waiting for approval
counts as released only when approved: the lot is not told yet (open).

**Events**: `FarmHarvest-created`, `FarmLot-created|updated`, `FarmStorageCheck-created`, `FarmRecall-created|updated`,
`FarmGradePrice-updated`, and the bespoke `farm.storage.limit_exceeded`, `farm.trace.published`.

**Tests**: `logic/harvest.logic.spec.ts` (run). Written, not run: `test/farm-harvest.e2e-spec.ts`,
`npm run farm:harvest-drill`, tenancy fixtures.

## Phase 6 — costs and profit *(built 25 October 2026)*

**Data** (migration `1789660000000-farm-costs`): `farm.machine_uses` (hours or hectares × rate on a season or batch,
`client_id` unique), `farm.accrual_days` (one a day an organisation), `farm.seasons.valuation` (frozen at close),
`projection.farm_season_totals` gains `revenue_total`, `stored_kg`, `revenue_basis`; indexes for cost lines by line and
seasons by harvest. Seed `1789660000001` (`farm.reports.read|manage` and the farm's analytics permissions).

Costs reach a season or batch where they happen, each once by its source (A82): labour at sign-off (phase 2), inputs at
stock cost (phase 3), chicks, feed and medicine (phase 4), machinery and the daily accrual (here).

**API**

| Route | Permission | Does |
|---|---|---|
| `POST/GET machine-uses` | `farm.reports.manage/read` | hours × the asset's rate (the settings' rate by asset, else the default), or hectares × a rate by the hectare (A80); `machinery` on a season, `overheads` on a batch |
| `POST reports/accrue` | `farm.reports.manage` | a day of land (the season's share of its field's lease, or the owned-land rent a hectare a year), overheads a hectare a year, and house a head a day for batches (A80); each line keyed by its day so a replay posts nothing (A82). `FarmCostsProcessor` (queue `farm-costs`, 01:35 nightly) runs yesterday and any missed day of the week before |
| `GET reports/profit?groupBy=field\|crop\|season\|hectare\|farm&from&to&compareFrom&compareTo` | `farm.reports.read` | seasons whose harvest falls in the period, harvested rows at what the harvest is worth and forecast rows (plan yield × price) marked as projections (A77, A78); cost and profit a hectare and a tonne over tonnes harvested or forecast (A79); a second period with the change; totals from the projection (A83) |
| `GET reports/profit/export` | `farm.reports.read` | the same as CSV |
| `GET reports/cost-lines` | `farm.reports.read` | cost lines with their source (keyset) |
| `POST seasons/:id/close` | `farm.seasons.manage` | closes a season with its valuation frozen |

**Valuation** (`SeasonValuation`): a season's lots' stored kilos at the grade price of the day each was harvested (else
the plan's price), or its cost when `FARM_COSTS.harvestValueBasis` is cost; kept on the projection with each harvest
and drying; saving the costs settings with a new basis re-values only open seasons (A81).

**BI**: `analytics` gains the `farm` module; reports `farm.season_profit` (area, tonnes, cost, worth, profit, budget by
season, field, crop, variety, year) and `farm.cost_lines` in `analytics/reports/registry.ts`.

**Settings**: `FARM_COSTS` — machinery basis and rates, daily accrual on, owned-land rent and overheads a hectare a year,
house a head a day, how a harvest is valued.

**Not here**: tagging the ledger's journal lines with the `farm_season` dimension needs the ledger to carry a dimension
on stock and payroll postings (decision 4 asks Finance to confirm before this phase); the farm keeps every cost by
season and batch and each season is a dimension value, but the journal tagging is open.

**Events**: `FarmMachineUse-created`, `FarmCostLine-created` (the day's accrual); seasons and batches announce their
change.

**Tests**: `logic/profit.logic.spec.ts` (run). Written, not run: `test/farm-costs.e2e-spec.ts`, `npm run farm:costs-drill`
(Dam Field 15.49m of 16.65m, 93%; no double posting), tenancy fixtures.

## Phase 7 — outgrowers, collection, payment runs, cooperatives, satellite *(built 25 October 2026)*

**Data** (migration `1789670000000-farm-growers`): `farm.schemes`, `farm.growers` (a party with no sign-in, its
supplier record, payout details), `farm.grower_contracts` (one active a scheme; price formula a kilo with grade
adjustments, window, advance limit), `farm.grower_fields`, `farm.input_advances` and `input_advance_lines` (inputs from
the store at cost, a receivable farm-side), `farm.advance_settlements` (one an advance a run), `farm.collection_points`,
`farm.produce_receipts` (`client_id` unique), `farm.payment_runs` (one a scheme a period) and `payment_run_lines` (one a
grower a run), `farm.coops`, `coop_members`, `pooled_sales`, `pooled_sale_shares`, `farm.field_imagery` (one a field a
source a day). Numbering `PR`, `FPR`, `ADV`. Seed `1789670000001` (`farm.growers`, `farm.collection`,
`farm.payments` with `approve`, `farm.coops`).

**API** (all under `/farm`)

| Route | Permission | Does |
|---|---|---|
| `GET/POST growers`, `GET/PATCH growers/:id` | `farm.growers.read/manage` | register a grower (a party with no sign-in, a supplier record, the contract); the list with delivered against expected, behind, no payout details, delivered in full (A84, A90); a grower's contract, fields with vigour, deliveries, advances and what is owed |
| `POST growers/:id/fields` | `farm.growers.manage` | a field of the grower's, one of the farm's or drawn |
| `GET growers/:id/statement?from&to` | `farm.growers.read` | deliveries, advances, settlements and the balance (what a private link will show) |
| `POST/GET growers/:id/advances`, `POST growers/:id/advances/:advanceId/approve` | `farm.growers.manage/read`, `farm.payments.approve` | inputs on advance at the store's cost; with what is open, over the contract's limit (else the settings') it waits and nothing leaves the store until approved (A86); no interest |
| `GET/POST schemes`, `POST contracts` | `farm.growers.read/manage` | schemes; a contract replacing the grower's active one in the scheme |
| `GET/POST collection-points` | `farm.collection.read/manage` | points with what they hold against capacity |
| `GET/POST receipts` | `farm.collection.read/manage` | the scale's reading valued under the contract (base + grade), rejected above `rejectAboveMoisturePct` and worth nothing, once by `clientId` (A87, A88); received into stock as the crop's item when the settings name one; a receipt to the grower at once |
| `GET/POST payment-runs`, `GET payment-runs/:id` | `farm.payments.read/manage` | a scheme's run since the last one: produce less open advances oldest first (A85); `ready`, `owes` with the rest carried (A92), `held_missing_payout` (A91); a period drafted again makes nothing twice; inline up to 500 growers, else chunks of 500 on queue `farm-payment-runs` (A89) |
| `POST payment-runs/:id/approve` | `farm.payments.approve` | one draft AP bill a ready grower for the net (through `FARM_PAYABLES_ADAPTER`), the advances netted settled, statements sent |
| `GET/POST coops`, `GET coops/:id`, `POST coops/:id/members` | `farm.coops.read/manage` | cooperatives and members with what they delivered |
| `POST coops/:id/pooled-sales`, `GET coops/:id/pooled-sales/:sid` | `farm.coops.manage/read` | gross, levy, transport, net a kilo and each member's share by delivered kilos less inputs owed, with the arithmetic (A96) |
| `GET fields/:id/imagery` | `farm.fields.read` | a field's pictures: date, cloud, usable, vigour, flagged patches |

**Providers**: weather gains OpenWeather and Tomorrow.io with sealed keys (the national agency still planned); the
**satellite** slot (none, Sentinel-2 through Sentinel Hub, Planet; Earth Engine and Maxar planned) with a timed
connection test. `FarmImageryProcessor` (queue `farm-imagery`, 04:20 Monday and Thursday) reads each field's vigour on
a 4 × 4 grid, ignores pictures above `FARM_FIELDS.imageryCloudLimitPct`, flags a patch `patchBelowMean` below the
field's mean and larger than `patchMinHa` (decision 14), and makes it one open scouting suggestion (A18, never a task).
The fields map gains `colourBy=vigour`.

**Settings**: `FARM_OUTGROWERS` — the advance limit, netting order (oldest first), how a receipt reaches the grower
(email or not sent; WhatsApp is not offered until a sender enforces it), the moisture above which a delivery is
rejected, the item each crop is received as, statements on approval. `FARM_FIELDS` gains the three imagery thresholds.

**Deviations and open items**: a produce receipt receives stock directly rather than through a procurement goods
receipt, so the produce is not received twice (A88 asks for a GRN; reported); the grower ledger is farm-side and the
receivable in the books is left to Finance (Finance decision 5); the private statement link is not issued yet (the
statement is served to signed-in staff).

**Events**: `FarmScheme`, `FarmGrower`, `FarmContract`, `FarmAdvance`, `FarmCollectionPoint`, `FarmReceipt`,
`FarmPaymentRun`, `FarmCoop`, `FarmPooledSale`, `FarmImagery` (each with the organisation in the payload).

**Tests**: `logic/growers.logic.spec.ts`, `weather.logic.spec.ts` additions, integrations spec (run). Written, not run:
`test/farm-growers.e2e-spec.ts`, `npm run farm:growers-drill` (Musa Danladi net 1,108,800; Danjuma Auta 26,000 carried;
pooled sale 520.99 a kilo), tenancy fixtures for the sixteen tables.

## Gaps closed 25 October 2026 *(`fix/farm-api-gaps`, found by the web lane)*

**Request the inputs a season is short of (A30).** `GET seasons/:id/shortfall` (`farm.seasons.read`, writes
nothing) answers item by item: `needed` (the plan snapshot's quantity a hectare × the season's area), `applied` (the net
base quantity the season's applications took from stock, found by their movements' source, so the unit an application
was entered in never matters), `inStore` (what the farm's store holds that can be used, from the stock projection),
`short` = max(0, needed − applied − inStore), with `item`, `sku`, `unit` and `plannedUnitCost`; and `shortCount`.
`POST seasons/:id/request-inputs` (`farm.seasons.manage`, the farm within reach, the season open) makes **one draft
purchase request** at the farm with a line for each short item (or only `variantIds`, each of which must be short:
409 `NOT_SHORT` names the others; 409 `NOTHING_SHORT` when the store covers what is left): quantity the shortfall, unit
the item's base unit, price the plan's unit cost (or 0 with `preferredSupplierId`, so the supplier's list price is
taken), `extras_json.source = 'farm.season'` with `farmSeasonId` and `farmSeasonNumber`. It goes through the
purchase-requisition module's own edge (`trade/procurement/purchase-requisition/public-api.ts`; procurement's
`public-api.ts` stays service-free because the live metric registry loads it) and the farm purchasing port
(`FARM_PURCHASING_ADAPTER.requestPurchase`). It **reserves nothing** (`reserved: false`) and is purchasing's ordinary
draft: changed, submitted and approved there (conversion only pre-fills). Each call makes a new draft (no client id;
the screen's button is the guard).

**Lookups under farm permissions** (`lookups/`). Every one is a keyset page `{ items, nextCursor }` (`limit` ≤ 100,
`cursor`), organisation-first, on an index led by the organisation, so a farm worker needs no inventory, asset or sales
rights:

| Route | Permission (any of) | Answers |
|---|---|---|
| `GET lookups/items?q&farmId&profileKind` | `farm.{plans,seasons,work,inputs,scouting,batches,animals,harvest,lots,growers,collection,settings}.read` | live, active items by name or SKU start: `id`, `name`, `sku`, `productId`, `uomId`, `unit`, `profileKind`, `withholdingDays`, `withdrawalDays`, and with `farmId` `inStore` (base units, else null) |
| `GET lookups/machines?q&farmId` | `farm.reports.read/manage`, `farm.{work,seasons,batches,settings}.read` | assets not retired or disposed, by name or asset number: `id`, `assetNumber`, `name`, `status`, `locationId`, `locationName`, `rate` (the farm costs settings' own rate, else the default), `rateIsDefault`, `basis` (hour or hectare); `farmId` keeps to machines kept there |
| `GET lookups/places?q&farmId&for=batch\|lot&kind` | `farm.{batches,animals,harvest,lots,settings}.read` | active places of the asset register under the farms within reach: `id`, `farmId`, `farmName`, `parentId`, `kind`, `code`, `name`, `depth` (`for` picks the feature checked: batches or harvest) |
| `GET lookups/sales-documents?q&farmId&type=sales-invoice\|sales-order` | `farm.lots.read/manage`, `farm.traceability.read` | the places within reach (all for someone not tied to places), newest first, by number start or customer name: `id`, `type`, `number`, `status`, `on`, `customerId`, `partyId`, `customerName`, `locationId`, `currency`, `grandTotal`; `type` is what `POST lots/:id/sales` takes as `salesDocumentType` |

Search text is lower-cased with LIKE's wildcards taken literally. Migration `1789680000000-farm-lookup-indexes`:
`item.variant (organization_id, lower(name), id)` and `asset.assets (organization_id, lower(name), id)`, live rows
(built without CONCURRENTLY like the other index migrations; FOLLOW-UP for production volume as `1791000000100`).

**Scouting photos through Drive.** Scouting reports are a Drive reference kind, `farm_scouting_report` (read
`farm.scouting.read`, change `farm.scouting.manage`, relationships `photo`, `other`; reports keep their rows). Through
the farm files port (`FARM_FILES_ADAPTER`, over `DriveReferences`):

| Route | Permission | Does |
|---|---|---|
| `POST scouting/:id/photos/upload` `{ name, size ≤ 25 MB, mimeType }` | `farm.scouting.manage` | starts a photo (JPEG, PNG, WebP, HEIC; ten a report) into the report's folder of the Records drive; answers Drive's upload start with `referenceId`; the bytes go through Drive's `upload-sessions/:id/parts` and `complete` (which ask `drive.files.create`) |
| `POST scouting/:id/photos` `{ referenceIds?, documentIds?, photoKeys? }` | `farm.scouting.manage` | counts finished uploads (409 `PHOTO_NOT_ARRIVED` names one still on its way), attaches Drive files, or keeps older storage keys; a draft with a photo becomes new (and goes on the map) |
| `POST scouting/:id/photos/:referenceId/url` | `farm.scouting.read` | Drive's signed, short-lived link `{ url, name, mimeType, size, expiresAt }`, audited as viewed (a POST for that reason; listed in `farm-permissions.spec.ts`) |

`GET scouting/:id` adds `photos` (`referenceId`, `name`, `mimeType`, `size`, `checks`, `canOpen`, `createdByName`,
`createdAt`), `legacyPhotos` (`{ key, url }`: the key as it is when it is an address, the files route for a bare stored
name, else `url: null`) and `photoCount`; `photoKeys` stays as it was. `GET scouting` rows carry `photoCount` (keys
plus Drive photos, one grouped query a page). Nothing was migrated: old keys stay readable where they were.

**The grower's statement on a private link** (trading-network decision: growers have no login; links are
passwordless). A shared-links kind, `grower-statement`, kept by the farm (`growers/links/grower-statement.link-kind.ts`)
and added to sharing's `LinkKinds` when the module starts (`LinkKinds.register`, so sharing never imports the farm;
exported with `NetworkShares` from `sharing/public-api.ts`). The link shows the statement for its period (live to the
day it is opened when it has no end): what was delivered and its value, inputs advanced, settled from produce, the
advances still open (no interest); the grower may write about it, which needs the one-time code mailed to the address
it went to. Access, expiry (the period's end plus the organisation's days, at least a week, never past the longest it
allows), codes, revoking and the staff inbox are the shared-links rules.

| Route | Permission | Does |
|---|---|---|
| `POST growers/:id/statement-links` `{ from?, to?, recipients?, access?, email?, message? }` | `farm.growers.manage` (reach checked) | makes the link (to the grower's own address when no recipient), sends it with `email: true`; answers `{ share, url, passcode }` |
| `GET growers/:id/statement-links` | `farm.growers.read` | the links (`shares`: `id`, `state`, `access`, `recipients`, `expiresAt`, `viewCount`, `lastViewedAt`, `createdAt`, `label`, `partyId`), what happened to them (`events`) and the rules (`kind`, `rules`) |
| `GET growers/:id/statement-links/:shareId/url` | `farm.growers.manage` | the link again for copying while it works |
| `POST growers/:id/statement-links/:shareId/revoke` | `farm.growers.manage` | stops it; anyone on it is out at once |

The generic `/shared-links` routes take `grower-statement` for `farm.settings.manage` only (they cannot check a
farm's reach). `KIND_TITLES` names it *Grower statement*.

**Shared files edited**: `drive-references.registry.ts`, `sharing/link-core/kinds/{link-kinds.registry,kind-titles}.ts`,
`sharing/link-core/link-permissions.ts`, `sharing/public-api.ts` (one appended block each), `test/tenancy.sweep-spec.ts`
(a statement link in the farm block).

**Tests**: `plan.logic.spec.ts` (still to buy, planned prices), `scouting.logic.spec.ts` (old keys' addresses),
`farm-lookups.service.spec.ts` (search text), `grower-statement.link-kind.spec.ts`, `link-kinds.registry.spec.ts`,
`farm-permissions.spec.ts` (run). Written, not run: `test/farm-gaps.e2e-spec.ts` (A30 and reserving nothing, the four
lookups for a farm-only reader, photos through Drive and old keys, the statement link opened, copied and revoked) and
the sweep's statement link.

## Decisions (package section 6, taken by recommendation)

1. The pack lives in `catalogue/farm.pack.ts`; `farm` left `CORE_LOCATION_KINDS` and is the pack's own kind.
4. Season and batch are values of one `farm_season` ledger dimension (not cost centres).
9. Farm tasks are the farm's own table following the project engine's dependency rules (phase 2).
10. Read side: Postgres projections through phase 7; the Mongo read models for the map and home wait for the ERP
    Mongo lane (not landed when phase 7 was built).
11. The farm ships `public-api.ts` from phase 1; the restaurant module is not changed.
13. No spraying within 12 hours before rain, a setting (`FARM_WORK.sprayBeforeRainHours`).
14. Satellite thresholds 0.15 below the mean, 0.5 ha, 30% cloud, settings (phase 7).
15. Withholding on harvest warns by default; animal withdrawal always blocks a sale.
2. Piece rate: signed work feeds `farm.payroll_inputs`, pulled by payroll through its extra-earnings registry under a
   new `piece` component type; existing components are unchanged.
16. (25 Oct, gaps) A season's request for inputs counts what its applications already took from stock (their
    movements' net base quantity), not only plan against store, and makes a new draft each time it is asked.
17. (25 Oct, gaps) The farm's pickers read other modules' tables in a farm repository under farm permissions (as the
    asset module's picker does) rather than open those modules' routes to farm roles.
18. (25 Oct, gaps) Scouting photos stay where they were when stored by key; new ones are Drive references. Uploading
    the bytes uses Drive's upload sessions (`drive.files.create`).
19. (25 Oct, gaps) The grower statement link kind lives in the farm and registers itself with sharing, so sharing has
    no import of the farm; its party is the grower's supplier record.

