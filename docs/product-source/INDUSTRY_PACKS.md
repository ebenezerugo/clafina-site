# Industry packs

> Status: **kernel built (16 October 2026), versioning and upgrades built (18 October 2026)** on `feature/packs-versioning-memberships-events`. Code: `src/modules/packs`. The packs shipped: the [restaurant](RESTAURANT.md), [memberships](MEMBERSHIPS.md) and [events](EVENTS.md). Product: the *Industries — Product Document* and the *Industry Catalogue* (Claude Docs); boards `erp4f-settings-packs`, `-words` and `-upgrade` (`design-handoff/erp-mockups/v3/mockups/f`).

One core, packs on top. A pack gives an industry its workflow without a fork: which features are switched on, the words it uses, the defaults it installs. The pack itself is **data in code** (`catalogue/<pack>.pack.ts`, versioned); the database only says which organisation and which place carries which pack, at which version, and what the organisation changed.

## The model

| Table (`packs.`) | What it holds |
| --- | --- |
| `org_packs` | A pack the organisation has installed, the version it was installed at, and whether it is on. Off hides it and keeps every record. |
| `location_packs` | A pack said on (`true`), off over the organisation's word (`false`) or nothing (`null`: follow the organisation) for one place. **`installed_version` / `installed_at`**: the version this place's own installation is at. `NULL` means it follows the organisation's. |
| `location_profiles` | The kind of place a location is (`general`, `restaurant`, `gym`, `venue` …). The list of kinds is open: see below. |
| `setting_provenance` | **Who set a stored document setting**: `user` or `pack:<key>@<version>`. Keyed by organisation, document type, scope (the organisation's layer or a place's) and field. |
| `pack_words` | The organisation's (or a place's) own word for a pack's word. |
| `pack_upgrades` | Each upgrade: pack, scope, from and to versions, what it changed (with the values it replaced), who, when, and whether it was undone. |

Every key starts with `organization_id`; row-level security is on. Migrations `1782800000000-industry-packs` (the kernel) and `1788600000000-pack-versioning` (expand only). `scope_id` is the nil uuid for the organisation and the location's id for a place.

## What a pack declares (`PackDefinition`)

`key`, `label`, `version` (the latest), `summary`, `kind` (the kind a place becomes when it carries the pack and has none; `null` when the pack suits any), `kinds` (the kinds of place it brings), `requires`, `features`, `vocabulary`, `permissions`, and for the screens:

- `menu`: the module it adds, with groups of pages (the preview reads exactly this);
- `homeCards`: the Home cards for people at a place that carries it;
- `settings`: the settings it starts you with. Each is a **field of a document type's settings** (the one place the code that honours it reads it) with `history: [{ from, value }]`, the default in each version;
- `changes`: what each version after the first brought, in words, for the upgrade drawer.

`catalogue/catalogue.spec.ts` holds each pack to this: a setting is a field of a registered document type, its history is ordered, every version after the first lists what it brought.

## Open kinds of place

`LOCATION_KINDS` is no longer a closed list. `CORE_LOCATION_KINDS` are the kinds Commerce itself knows (general, hotel, guest house, warehouse, farm, shop, clinic, school, property, rental yard); a pack adds the kinds it declares (the restaurant pack: `restaurant`, `bar`, `quick_service`; memberships: `gym`, `club`, `coworking`; events: `venue`). `GET /packs/kinds` lists them; `PUT places/:id` accepts any key of the right shape (`^[a-z][a-z0-9_]{1,23}$`) that something declares. A new pack declares its kinds in its own file; nothing else changes.

## The feature resolver

`FeatureResolver.resolve(organizationId, locationId | null)` (pure logic in `packs.logic.ts`, specced) answers `{ kind, packs, features, vocabulary, wordClashes }`:

- **For a place**: the organisation's packs, then the place's own word on each (on adds, off removes). A pack whose `requires` are not carried at that place is not carried.
- **For the organisation**: every pack carried anywhere, so a menu that must show for one restaurant of five shows. The words are the **organisation-wide** packs' only.
- **The organisation's own words** (`pack_words`) replace a pack's word while the pack is carried; a place's own word wins at that place. Hiding a pack gives the standard word back and keeps the organisation's word stored. Words change what people read, never what is stored, exported or named in the API.
- **Two packs, two words** (30 October 2026). Where packs on together name a standard word differently (a hotel's Guest, a charity's Donor), nobody's word quietly wins: the standard word (Customer) stays and `wordClashes` lists the term with each pack and what it says. A word chosen on the Words page settles it, the place's choice before the organisation's. Packs that agree keep their word.
- `FeatureResolver.require(org, location, 'restaurant.floor')` throws `403 PACK_NOT_ENABLED`. A pack gates access, never data.

Three readers use the same answer: the API (pack modules call `require`), the web menu (`GET /api/v1/packs/features` → `PacksService`; nav items carry `pack: '…'`), and the tills (the channel API's till configuration).

## Upgrading without overwriting what the organisation changed

The rule (Industries document §3.4): **a default is replaced only if nobody changed it.** "Nobody changed it" is known from provenance, never guessed from the value (a value set by hand to the pack's default is still the organisation's):

- A stored setting is the **organisation's** when its provenance is `user`, or when it has no provenance row (it was saved before provenance existed).
- It is **untouched** when nothing is stored, or when a pack wrote it (`pack:<key>@<version>`).

The document settings service reports every save to a provenance port (`SETTINGS_PROVENANCE`, provided by `PacksModule`): `save(…, source = 'user')`. A pack writes its own value with `source = 'pack:<key>@<version>'`.

**Plan** (`GET :pack/upgrade-plan?locationId=`, writes nothing): `newThings` (what each version brought), `willChange` (the untouched defaults, old to new; a setting the older version did not have is `added`), `kept` (the organisation's own settings and words, with who changed them and when), `places` (those carrying an older version), `organizationOnly` (settings a place cannot hold its own).

**Apply** (`POST :pack/upgrade { all?, locationIds? }`): `all` upgrades the organisation's installation and every place that moved ahead of it; `locationIds` upgrades those places one by one (a place that follows the organisation gets its own version and moves ahead; its settings are written to its own layer where the document type allows a place to set its own, otherwise they wait for the organisation's upgrade). Writes only the untouched defaults (and only where the new default differs from what the schema already gives), as the pack's own; runs the installer's optional `upgrade(input, from, to)` hook; moves the version; records the upgrade with the values it replaced; announces `LocationPacks-updated`.

**Undo** (`POST upgrades/:id/revert`, for 30 days, newest first per scope): puts back what the pack wrote **if nobody changed it since**, and leaves what the organisation changed. The version goes back. An upgrade is undone once.

Versions: the organisation's is `org_packs.installed_version`; a place's is its own `location_packs.installed_version`, else the organisation's. A place that carries a pack on its own word (the organisation has not installed it) is installed at the version in force when it first did.

## API (`/api/v1/packs`)

| Method, path | Permission | What |
| --- | --- | --- |
| `GET features?locationId` | none (any signed-in person) | What applies here. |
| `GET catalogue` | `packs.read` | The packs Commerce ships, with `menu`, `homeCards`, `settings`, `kinds`, `changes`, `latestVersion`. |
| `GET kinds` | `packs.read` | The kinds of place: Commerce's own and the packs'. |
| `GET places` | `packs.read` | Places with their kind, the packs each names itself, what each carries, `installedVersion` and `updateAvailable` per place and per organisation pack. |
| `GET :packKey/preview?locationId` | `packs.read` | What the pack would add: menu, words, Home cards, starting settings, what it needs. Writes nothing. |
| `GET :packKey/upgrade-plan?locationId` | `packs.read` | See above. |
| `GET :packKey/upgrades` | `packs.read` | The upgrades made, newest first, with `canUndo`. |
| `POST :packKey/upgrade` `{ all?, locationIds? }` | `packs.manage` | Upgrade. Answers `{ upgraded[], …places }`. |
| `POST upgrades/:id/revert` | `packs.manage` | Undo an upgrade within 30 days. |
| `GET words?locationId` | `packs.read` | Every pack's words and the organisation's own word for each, with where it applies. |
| `PUT words` `{ locationId?, words: [{ packKey, term, value \| null }] }` | `packs.manage` | Say your own word, or `null` to give the pack's back. A word the pack does not have, or with markup, is refused. |
| `PUT organization/:packKey` `{ enabled }` | `packs.manage` | Install (or bring back) a pack for the organisation, or hide it. Installing runs the pack's installer. |
| `PUT places/:locationId` `{ kind?, packs?: [{ packKey, enabled: true\|false\|null }] }` | `packs.manage` | A place's kind and its own word on packs. |

A pack's module registers an installer with `PackInstallers.register(...)`: the defaults it installs (stations, reason codes), idempotent and never overwriting what the organisation changed. Settings held as document settings are the kernel's to upgrade (with provenance), not the installer's; the installer's `upgrade` hook is for what is not a setting (a new station, a new reason code).

## Permissions, events, screens

`packs.read`, `packs.manage` (owners and administrators; managers read). Event `LocationPacks-updated` (`commerce.packs.v1`; `/live` entity `LocationPacks`, `packs.read`) for installs, a place's word, an upgrade (`<pack>-upgrade`), an undo (`<pack>-undo`) and a change of words (`words`). Web (`/packs`, `/packs/words`):

- **Settings → Organisation → Industry packs** (redesigned 30 October 2026 after a usability pass): "How packs work" in three steps (each place runs its own business: a farm, a restaurant and a hotel side by side); **On in your business** (each pack with where it is on and Update ready); **Add a pack**, searchable and grouped by industry; **Your places** (kind, packs on, the pack its kind suggests). A pack opens a drawer that asks one question, "Where should it be on?" (every place, only some places with a checklist that marks the places that suit it, or off), previews what it adds, says what else it turns on and warns about any word it would clash on before saving. A place opens a drawer with its kind and, per pack, "As the organisation", "On here" or "Off here". A clash banner lists the words two packs disagree on. Everything the previous screen did (install or hide for all, a place's kind, a place's own On/Off/Follow, upgrades, Words) is still there.
- **New location** (`/admin/locations/new` and a location's page): "What this place does" asks the kind of place (grouped, from the packs' own kinds) and suggests the pack made for it with what it runs (its pages and words), ticked; saving the place saves its kind and turns that pack on there only. A pack already on everywhere is said, not offered; someone without `packs.manage` is told who can turn it on.
- **The upgrade drawer**: what is new, the defaults that would change (old to new), "your changes, kept as they are" with who and when, a summary, "what happens next", Not now, Upgrade this place, Upgrade all places that use it, and earlier upgrades with "Go back to version N" for 30 days.
- **Words**: a banner and a row tag where two packs name a word differently (the standard word is used until you choose); standard word, what a pack says, your own word (the plural is guessed and can be corrected), where it applies, "use the pack's", a live "How it reads", and a footer that says how many are unsaved.

## Tests

- Unit: `packs.logic.spec.ts` (resolver, the organisation's words, two packs naming a word differently), `pack-upgrade.logic.spec.ts` (the untouched/yours rule, old to new, kept, undo window, open kinds), `catalogue/catalogue.spec.ts`. Web: `packs.model.spec.ts`.
- Drill: `npm run packs:drill` (write paths and their events; a throwaway pack moves from version 1 to 2 on the restaurant service settings: the preview lists the untouched default and the kept change, applying writes the pack's own value with provenance, undo puts it back, a place moves ahead of the organisation, words show while the pack is carried and stay when it is hidden; it puts the organisation back as it found it).
- E2E: `test/packs.e2e-spec.ts` (catalogue, kinds, preview, installing, words, permissions, the event against its contract).
- Stubbed Cypress: `cypress/e2e/packs.cy.ts` (cards, preview, three-way menu, kinds, upgrade drawer, undo, words).

## Deferred tests (test lane)

The tenancy-sweep fixture for `/api/v1/packs/`; a live Cypress spec for installing and upgrading as the owner.

## The packs

| Pack | Module | Document |
|---|---|---|
| Restaurant | `restaurant` | [RESTAURANT.md](RESTAURANT.md) |
| Memberships and subscriptions | `memberships` | [MEMBERSHIPS.md](MEMBERSHIPS.md) |
| Events and ticketing | `events` | [EVENTS.md](EVENTS.md) |
| Accommodation | `accommodation` | [ACCOMMODATION.md](ACCOMMODATION.md) |
| Field service | `field-service` | [FIELD_SERVICE.md](FIELD_SERVICE.md) |
| Client records | `client-records` | [CLIENT_RECORDS.md](CLIENT_RECORDS.md) |
| Rentals | `rentals` | [RENTALS.md](RENTALS.md) |
| Product configurator | `configurator` | [CONFIGURATOR.md](CONFIGURATOR.md) |
| Courses | `courses` | [COURSES.md](COURSES.md) |
| Fundraising | `fundraising` | [FUNDRAISING.md](FUNDRAISING.md) |
| Distribution | `distribution` | [DISTRIBUTION.md](DISTRIBUTION.md) |
| Construction | `construction` | [CONSTRUCTION.md](CONSTRUCTION.md) |
| Property | `property` | [PROPERTY.md](PROPERTY.md) |
| Classes and check-in | `classes` | [CLASSES.md](CLASSES.md) |

What the packs of 25 October share: `PackModuleEvents` (an outbox announcer whose payloads carry ids and states only),
`PackInvoicer` in `pack-billing` (every pack invoices on the ERP's own customer invoice), the migration helpers in
`database/helpers/pack-tables.ts` (schema, row-level security, the tenant policy, grants; an append-only table is granted
SELECT and INSERT only) and `packRouteProblems` for each pack's permission spec.

## Not yet

- **Console**: the pack catalogue and editions per pack (Industries document §5) and the signed ruleset delivering packs; "Ask your plan" on a locked pack. The catalogue is ready to be listed there.
- **Words by version**: a pack's words are those of its latest version; only settings have a default per version.
- **Home cards** are declared (keys, labels) and shown in the preview; the cards themselves are drawn by each pack's module when its measures exist.
- **Custom fields, workflows, sample data** (pack contents §2 of the document) arrive with the packs that need them. The sign-up "choose your industry" step and a pack removal confirmation are not built.

## History

- 16 October 2026: the kernel — location kind, org and place packs, the feature resolver, the words, the installer hook, the settings screen.
- 18 October 2026: versions per place, provenance of settings, the upgrade preview, apply and undo, the organisation's own words, an open list of kinds, the preview, and the three screens of the board.
- 25 October 2026: the accommodation pack, and what the packs after it share.
- 25 October 2026: the field service pack.
- 25 October 2026: the client records pack.
- 25 October 2026: the rentals pack.
- 25 October 2026: the product configurator pack (`feature/industry-packs-rest-api-2`).
- 25 October 2026: the courses pack (`feature/industry-packs-rest-api-2`).
- 25 October 2026: the fundraising pack (`feature/industry-packs-rest-api-2`).
- 25 October 2026: the distribution pack (`feature/industry-packs-rest-api-2`).
- 25 October 2026: the construction pack (`feature/industry-packs-final-3`).
- 25 October 2026: the property pack (`feature/industry-packs-final-3`).
- 25 October 2026: the classes and check-in pack (`feature/industry-packs-final-3`).
- 30 October 2026: the screens redesigned around where a pack is on; word clashes keep the standard word and are reported; the new-location form suggests the pack for its kind.
