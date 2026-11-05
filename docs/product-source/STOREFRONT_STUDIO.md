# Storefront Studio

The Studio's storefront half: how an online shop looks and is laid out, designed in the ERP, published to
the store service and drawn by the storefront. The product document is
`design-handoff/storefront-studio/PRD.txt`; the decisions it is built to are in `BUILD-PLAN.md` beside it.
This file is the built reference for **phase 1 (foundation)**: the model, the publish flow, the component
registry contract and the preview tokens. The visual designer (phase 2) is a client of exactly these APIs.

Code: `src/modules/studio/storefront/` (module `StorefrontStudioModule`), `src/modules/integrations/mcp/mcp-storefront-tools.ts`,
migration `1785000000000-studio-storefront`, seed `1785000000001-sync-permission-catalog-studio-storefront`.
The store service half is `commerce-store-service/docs/storefront-studio.md`; the renderer is
`commerce-storefront/docs/architecture.md` (Storefront Studio).

## 1. What a storefront is

A **storefront is an online shop** (`sales_channel.online_shops`, keyed by the channel id), renamed in the
Studio. Many per organisation. Its configuration is *presentation and references to business data*. The
catalogue, prices, stock, customer credit and orders stay in their own services (PRD 5.4, 15.4): a page can
bind a collection, never hold a product.

| Part | Table (`studio.`) | Version kind | Subject key | Edit permission |
|---|---|---|---|---|
| Theme: design tokens | `storefront_themes` | `storefront-theme` | `<storefront>` | `studio.storefront.design.update` |
| Header, footer, announcement bar (the *shell*) | `storefront_shell` | `storefront-shell` | `<storefront>` | `…design.update` |
| Page: route, type, SEO, sections of component instances | `storefront_pages` | `storefront-page` | `<storefront>:<page>` | `…content.update` |
| Navigation menu | `storefront_menus` | `storefront-menu` | `<storefront>:<menu>` | `…content.update` |
| Collection, by reference | `storefront_collections` | `storefront-collection` | `<storefront>:<collection>` | `…merchandise.update` |
| Publication: an immutable snapshot sent to the store | `storefront_publications` | | | `…publish` |

Every table leads with `organization_id`, has the `tenant_isolation` RLS policy and a grant to `commerce_app`.
Each of the first five holds **what is in use now**; its drafts, approvals and history are the Studio's existing
**versions** (`studio.versions`, widened to `varchar(40)` for the longer kind names; the module
registers five `VersionedKind`s). So a storefront part is drafted, previewed, sent for approval
(`studio-publication` policy), published and restored exactly as an email layout is. Drafts go through the
existing `/studio/versions` endpoints (`PUT drafts` with `kind`, `subjectKey`, `content`; a new item has no
subject key and `content.storefrontId` says which storefront). Content as a version holds it carries
`storefrontId`; the configuration does not repeat it.

### The configuration document (schema version 1)

```
{ schemaVersion: 1, storefrontId,
  theme:  { name, tokens: { color: { light, dark? }, type, spacing, radius }, source? },
  shell:  { top: [instance], bottom: [instance] },          // components around every page
  pages:  [ { id, route, type: home|content|landing, title, seo: {title, description, noindex},
              sections: [ { id, layout, audience, components: [ instance ] } ] } ],
  navigation:  [ { id, handle, label, items: [ { id, label, href, children } ] } ],
  collections: [ { id, handle, title, limit, source } ],
  assets: [ { referenceId, versionId, contentType } ] }     // derived: the pictures image components use
instance = { id, type, version?, settings, bindings?: { slot: binding }, audience?, i18n?, children?: [instance + slot] }
```

* **Bindings** are references: `{kind:'collection', handle}`, `{kind:'categories', mode:'top'|'selected', limit, ids}`,
  `{kind:'shop-banners'}`, `{kind:'shop-page', slug}`, `{kind:'menu', handle}`.
* **Collection sources**: `newest`, `all`, `category`, `saved-filter` (q, category, inStockOnly, sort) and `curated`
  (item ids) resolve today; `branch`, `promotion`, `customer-group` are accepted, validate with a warning and
  draw nothing until the pricing and assortment work of later phases.
* **Audience rule** (on a section or instance): `audiences` (`anonymous`, `signed-in`, `business-buyer`),
  `devices` (`mobile`, `tablet`, `desktop`: CSS classes, so pages stay cacheable), `from`/`until`. The public
  site draws one page for everybody (`anonymous`); a preview token can claim another audience. Personalised
  variants on the live site arrive with phase 4.
* **i18n**: per-language values for a component's translatable settings only.
* **Theme tokens** are the storefront's CSS variables, fully derived: background, foreground, muted,
  mutedForeground, border, primary, primaryForeground (on-primary), primaryHover, link, accent; type
  (family, base size 14–20, scale 1.1–1.5, heading weight 500–800); spacing density; corner radius. **Status colours
  (error, success, warning) are the platform's**: not tokens, derived by the storefront from the page background,
  and refused if sent.

## 2. The contrast guard and the brand kit

`definitions/theme-tokens.ts`. `deriveColourTokens` is a port of the storefront's `deriveTheme`: from the few
colours an organisation chooses it moves text colours until they pass AA (7:1 for body text, 4.5:1 for the
rest), picks black or white for **on-primary**, and moves the primary *away from* the text on it for **hover**,
so the pair never loses contrast. Golden values are pinned in both repositories' tests, which is what lets an
existing shop move to tokens with no visible change.

`checkThemeContrast` refuses (per mode, light and dark): text pairs under **4.5:1** (text on background, secondary
text on background and on cards, on-primary on primary and on hover, links, accent as text) and the **edges of
controls under 3:1** (the primary colour as a button fill and focus ring on the page and card backgrounds), with
the colours and the ratio in the message: "In light mode the primary colour is too close to the page background
for a button or focus ring to be seen (#ffee00 on #ffffff is 1.07:1; it needs 3:1)." A theme migrated from a
shop made before the guard (`source.legacy`) reports edge failures as advice, never as a refusal: that shop has
always looked this way and migration must not break it.

`POST /studio/storefronts/:id/theme/seed` builds a theme from `studio.brand_kits` (the organisation's own
colours; the storefront's defaults for any it left out; a serif heading font gives the serif typeface) through the
guard, as a proposal or, with `saveDraft`, as the theme's draft. A kit whose colours cannot make a readable theme
is refused with what to change.

## 3. Validation (server side, against the registry)

`definitions/config-validator.ts`, run on every draft save (the draft laid over everything else in flight, keeping
the issues that concern the subject), by `GET …/validation?of=published|draft`, by MCP `storefront_validate` and
before every publication. Issues are `{severity, code, path, message}`. It checks:

* the schema and settings of every component instance against `registry.json` (unknown setting, wrong type, out of
  range, a link that is not a path on the shop or an `http(s)` address), placement (shell or page), children and
  their slots, the data slots a component declares and requires and the kinds each accepts, per-language wording;
* **references that must resolve**: a collection or menu handle in this storefront, a `shop-page` slug the shop has
  published, an image attached to the shop (and described, or marked decorative);
* **no business data** (`forbidden-data.ts`): any key naming a price, cost, SKU, barcode, stock, credit limit or
  balance, product, variant, order or customer is an error wherever it hides, with the instruction to bind a
  collection instead. A curated collection holds item *ids* (`refs`) only;
* routes: lower-case words joined by dashes (no capitals, dots or underscores, `//`), unique, a home page at `/`, none
  of the addresses the shop owns (`/search`, `/cart`, `/checkout`, `/account`, `/products`, `/api` …);
* theme (tokens, contrast, no status colours), menus (depth 3, 100 links), collections, ids unique across the whole
  document, and bounds: 512 KB, 200 pages, 40 sections a page, 40 components a section, nesting 3 deep.

Warnings (do not stop a publication): more than one level-1 heading on a page, a collection the shop cannot resolve
yet, a binding with nothing to show, an empty page, a missing SEO description, a legacy theme's weak button edge.

## 4. The component registry contract

The storefront owns the components it can draw. Each has a **definition** in
`commerce-storefront/src/studio/registry/definitions/`: `type`, `title`, `category`, `version`, a JSON Schema for
`settings` (`additionalProperties: false`), `defaults`, **`bindings`** (the data-source contract: named slots, the
kinds each accepts, whether required), `children` (allowed types and a maximum), `translatable`, `placement`,
`responsive` (mobile, tablet, desktop) and `a11y` (landmark and rules). Registry v1: header, navigation, footer,
announcement bar, hero, banner carousel, category links, product collection (bound to a collection), rich text,
image, container, columns.

`npm run registry:build` (storefront) emits `registry/registry.json`: `{schemaVersion, checksum, bindingKinds,
components}`, the checksum a sha256 over the content. It is **vendored byte for byte** into
`src/modules/studio/storefront/definitions/registry/registry.json` together with `schema-validate.ts` (a
dependency-free validator for the JSON Schema subset the registry uses, which both sides run), by
`npm run registry:build -- --sync <that directory>`. The **sync check** (`registry.spec.ts`): the file's checksum
matches its content (not edited by hand) and, when the storefront repository sits beside this one (or
`STOREFRONT_REPO` names it), the file is identical to what the storefront builds today. The designer reads the
same file for property panels, and MCP `component_catalog` publishes it to agents.

## 5. Publish, activate, roll back

```
draft versions ── approve ──▶ in use (the five tables)
                                 │  validate ▸ ok?                                  (no: 422, nothing recorded or sent)
                                 ▼
          1. record the attempt (own short transaction): publication N, status sending
          2. PUT /admin/v1/shops/:id/storefront/publications/:uuid  { number, checksum, snapshot, activate: true }
             └ the store service, in one transaction: store it, supersede the live one, activate, move the pointer,
               outbox "store.storefront.published"; then the worker tells the storefront's /api/revalidate
          3. record the outcome (own short transaction) + outbox "storefront.published"   → active
          failure at 2: attempt marked failed with why; the live publication is exactly as it was (409 in words)
```

* **Publishing a version is not releasing it.** A version approved and published in the Studio is *in use* (it is in
  the storefront's next release, shown by `GET …/diff` as `readyToPublish`); the live shop changes only on a
  **publication**, by someone holding `studio.storefront.publish`. A page edit goes live in the time of two calls
  (well inside the 60 s target).
* A publication is **immutable** (the ERP also keeps the snapshot, `storefront_publications.snapshot`), numbered per
  storefront, with a checksum over the canonical JSON. Publishing what is already live sends nothing
  (`published: false`). One live at a time (a partial unique index).
* **No database transaction is held across the call to the store service.** If the ERP dies between the store's
  answer and its own record, repeating the publish repairs it: the store answers an id it already holds with the same
  result.
* **Rollback** (`POST …/rollbacks {publicationId, reason}`): the store service points at the earlier publication
  (`POST …/activate`); if it no longer holds it (retention) the ERP gives it the stored snapshot again. The
  publication that was replaced remembers where it went back to and why. A rollback that fails leaves the live shop
  unchanged.
* **Audit** (PRD 16.3): who published (`created_by`), when it became active, the note, what changed (`changes`
  computed against the previous live snapshot), which was rolled back and why, the failures; the versions' own history
  and decisions for who approved. Events `storefront.published` / `storefront.rolled-back` (contracts in
  `events/contracts.ts`, topic `commerce.channel.v1`, payload carries `organizationId`).

## 6. Preview tokens

`POST /studio/storefronts/:id/preview-tokens {audience, of: draft|published, seconds, path}` assembles the draft
(every open version over what is in use), stages the snapshot at the store service
(`PUT …/storefront/previews/:id`) and returns `{token, url, previewId, audience, expiresAt, errors, warnings}`.

The token is a compact HS256 JWT: `iss` `commerce-erp`, `pv` the staged draft, `shop`, `org`, `aud` (the audience the
page is drawn for: the audience context is a claim, not a visitor's choice), `iat`, `exp` (5 to 30 minutes, 10 by
default). The key is `HMAC-SHA256(secret, "commerce-storefront-preview/v1")` with the secret `STOREFRONT_PREVIEW_SECRET`
(else `STORE_SERVICE_SECRET`; the store service holds the same): the admin bearer is never the signing key. The
storefront never verifies a token; it hands it to the store service, which verifies it and serves only the draft
it names, only for the shop it names. **Device size is the caller's**: the width of the frame it opens the address in.

The storefront renders it as its own page (the token rides in an HttpOnly cookie and in the internal path, never in
a cache entry of the public page), `Cache-Control: private, no-store`, `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy:
no-referrer`, a visible ribbon naming the audience, and falls back to the live shop (no ribbon) for a token that is
refused or has expired.

## 7. Adopting an existing shop (no visible change)

`POST /studio/storefronts/:id/adopt` (`studio.storefront.manage`; idempotent; also the first thing the designer
does) writes the storefront's first configuration from the shop's look and content and records each part's first
published version ("Brought into Storefront Studio from the online shop"):

* the **theme** from `content.theme` (colours, corners, typeface) as tokens, marked legacy;
* the **default template**: header and footer as the shell, and the home page of banners, welcome panel,
  category tiles and new arrivals (the page the storefront has always drawn, written as configuration, with the
  `new-arrivals` collection);
* each **published page** of the shop as a configured page at `/pages/<slug>` holding one rich-text component
  *bound to the shop's page* (the words stay where the organisation edits them, in every language; the storefront
  draws such a page as it always did). Banners are bound by reference (`shop-banners`).

Nothing is published: the live shop is exactly as before until the organisation publishes, and the first
publication draws the same page: the storefront's Playwright spec publishes `golden-migration.json` (this module's
output for a shop like its demo shop, pinned in both repositories) and compares the home page before and after,
word for word and pixel for pixel. A shop with no publication is drawn from the storefront's built-in copy of the
default template. `golden-migration.json` is regenerated with `UPDATE_GOLDEN=1` in `default-template.spec.ts`.

## 8. API

All under `/api/v1/studio/storefronts` (permissions are the `studio.storefront.*` set, below).

| Call | Permission | What |
|---|---|---|
| `GET /` | read | the storefronts, adopted or not, live publication, drafts open |
| `GET /components` | read | the registry: schemas, data sources, responsive and accessibility rules |
| `GET /:id` | read | one storefront with what its configuration in use holds |
| `POST /:id/adopt` | manage | bring an existing shop in, no visible change |
| `GET /:id/theme`, `POST /:id/theme/seed` | read, design.update | the theme and its draft; a theme from the brand kit |
| `GET /:id/pages`, `GET /:id/pages/:pageId` | read | pages with their state (in use, changed in draft, new, waiting for approval, being retired); one page as JSON |
| `GET /:id/validation?of=` | read | the pre-publish suite |
| `GET /:id/diff` | read | what publishing would change; what is only in drafts |
| `POST /:id/publications`, `GET /:id/publications` | publish, read | publish; history |
| `POST /:id/rollbacks` | publish | go back |
| `POST /:id/preview-tokens` | read | a preview token and its address |
| `/studio/versions/*` | per kind | drafts, approval, history, restore of every part |

### Permissions

`studio.storefront.read` (viewer) · `.content.update` (content editor) · `.design.update` (visual designer) ·
`.catalogue.update` (catalogue presentation manager; used from phase 3) · `.merchandise.update` (merchandiser) ·
`.settings.update` (commerce settings administrator; checkout and policy settings, phase 4) · `.publish` (publisher) ·
`.approve` (approver) · `.manage` (storefront administrator). The **organisation administrator** is the owner and
admin roles, which hold all of them. Defaults: managers read, edit content and merchandise; viewers read; any
role (custom ones too) that held `trade.channels.content.update` (still working, unchanged) also gets read, content
and design. Per-storefront scoping arrives with multi-storefront management. *Approver* names who a publication
policy may ask: the decision itself is the approval engine's, as for every Studio kind.

### MCP (PRD 15.6, phase 1: read only)

`storefront_list`, `storefront_get`, `page_list`, `page_get`, `theme_get`, `component_catalog`, `storefront_diff`,
`storefront_validate` (underscores for model APIs: the PRD's `storefront.list`). Each calls the same use case as
the API above, as the key's maker, in its organisation, listed only to a key holding `studio.storefront.read`
organisation-wide. Writing tools come with the designer, behind the same approval gates.

## 9. Tests, and how to run them

* Unit: `definitions/*.spec.ts` (registry sync, validator incl. business data, theme tokens and guard, preview token,
  default template and diff), `services/storefront-publish.service.spec.ts` (a failed publish and a failed rollback
  leave the live publication untouched; replay; supersede), `mcp-storefront-tools.spec.ts`.
  `env -i PATH="$PATH" HOME="$HOME" npx jest --maxWorkers=2 src/modules/studio src/modules/integrations/mcp`.
* **Drill** `storefront-studio:drill`: `QUEUE_PREFIX=drill-storefront TS_NODE_PROJECT=$PWD/tsconfig.json npm run
  storefront-studio:drill`. As `commerce_app` under RLS, in the test organisation, with a store service stand-in:
  adopt, theme, refused and accepted drafts, validate, diff, publish, a failing store service, rollback, preview
  token, MCP tools, another organisation sees nothing. Removes only the rows it made.
* Store service: `go test ./...`; `make test-integration` (the half-way failure against Postgres).
  Storefront: `npx vitest run`; `REVALIDATE_SECRET=… STOREFRONT_PORT=… npx playwright test` (specs `studio`,
  `studio-preview`, and the existing home, content, SEO).

## 10. Limits, decisions and what is next

* Phase 1 has no designer UI (phase 2, commerce-web), no catalogue view profiles (phase 3), no customer-specific
  prices or B2B (phase 4), no specialised journeys (phase 5), no domain management or scheduled publication
  (phase 6), no analytics (phase 7). Asset *upload* is Drive's: image components reference files attached to the
  shop (relationships `banner` and `logo`).
* **Decision:** two levels of publishing. An item's version is approved/published in the Studio's versions; a
  *publication* releases everything in use to the shop. This keeps approval per part and releases atomic.
* **Decision:** adoption is explicit and idempotent (`adopt`), not a backfill migration: no data migration touches
  existing shops, and nothing visible changes until a publication exists.
* **Decision:** MCP tool names use underscores.
* The configuration read side in the store service is Postgres behind the storefront's cache; it follows the
  platform standard's Mongo move with the other read models.
* Publication retention: the ERP keeps every snapshot; the store service keeps what it is sent.
* A draft preview serves the shop's own pictures a draft lists to anyone holding both of the picture's ids while the
  preview lives.

## 11. Phase 3: catalogue presentation and enterprise-scale discovery

How a catalogue of tens of thousands of items is shown and found. The store service half (search, facets, cursor paging,
units, quick order, the 50,000-variant drill) is `commerce-store-service/docs/catalogue-discovery.md`; the views are
components of the storefront's registry (`catalogue-view-*`, `commerce-storefront/docs/architecture.md`).

**Two new kinds of version** (drafted, approved and published like every other part; released with the storefront's
publication), a new field on collections, and no new publication path:

| Part | Table (`studio.`) | Version kind | Subject key | Edit permission |
|---|---|---|---|---|
| Catalogue view profile: how a category (or, with no category, the whole storefront) shows its products | `storefront_view_profiles` | `storefront-catalogue-profile` | `<storefront>:<profile>` | `…catalogue.update` |
| Search settings: synonyms, typo tolerance | `storefront_search` | `storefront-search` | `<storefront>` | `…merchandise.update` |
| Merchandising of a collection: pins, boosts, exclusions (item ids only) | `storefront_collections.merchandising` | `storefront-collection` (the existing kind) | `<storefront>:<collection>` | `…merchandise.update` |

```
config.catalogue = { profiles: [ { id, categoryId?, defaultView, allowedViews[], allowSwitch,
                                    columns?[], density?, pageSize? } ],
                     search:   { synonyms: [ { id, terms[] } ], typoTolerance } }
collection.merchandising = { pins: [itemId], boosts: [ { ref: itemId, weight 1..10 } ], excludes: [itemId] }
```

* **Views are registry components.** Eight (`catalogue-view-cards`, `-compact-list`, `-data-table`, `-specification`,
  `-comparison`, `-quick-order`, `-category-tree`, `-brand-directory`), each with a schema, a data-source contract
  (`collection` for the lists, `categories` for the tree), responsive and accessibility rules, and a `view` block (id,
  `canBeDefault`, what it is for, whether it is picture- or attribute-driven, the SKU count above which it is held back and
  why). A profile names views by id, and validation refuses one the registry does not have. The comparison, quick-order,
  category-tree and brand-directory views cannot be a category's default (a shopper switches to them or a page adds them).
* **A category with no profile of its own takes its nearest ancestor's, then the storefront's, then the built-in default**
  (visual cards, the grid the shop has always had: nothing changes for a shop that sets nothing). Categories now have a
  `parent_id` (a tree at most six deep, never a cycle; `PATCH /categories`, `parentId`).
* **Suggested, never forced.** `GET …/:id/catalogue/suggestions` reads the catalogue's figures from the store service (SKU
  count, the share of items with a picture, attributes per item, brands, per category and rolled up to parents) and gives
  each category a suggested view with a reason, and each view a status: `suggested`, `available` or `held-back` (with why:
  cards held back above 500 SKUs or where under 30% of items have a picture). It also says what the category is drawn with
  now and from where, and whether the suggestion differs. Nothing is changed by it, and a held-back view can still be chosen
  (the rules are in `definitions/catalogue-suggest.ts`, plain on purpose). The mockup's row "Spare parts: 5,200 SKUs, 14% have
  photos: suggest a data table, hold the gallery back" is a test.
* **Validation** (`definitions/catalogue-config.ts`): view ids, a default among the allowed views, one profile per category,
  the category exists, 2 to 10 distinct columns from the table's list, density, 12 to 100 per page; synonym groups of 2 to
  10 words (a word in two groups warns); merchandising is item ids only within 50 pins, 100 boosts and 500 exclusions, and an
  item is never both promoted and excluded. The reserved routes now include `/brands`, `/quick-order` and `/compare`.
* **Reads:** `GET …/:id/catalogue/profiles` (what is in use, drafts, the views a profile may name with their settings schema),
  `GET …/:id/catalogue/suggestions`, `GET …/:id/catalogue/search-misses` (what shoppers searched for and found nothing).
  Changes are versions, through `/studio/versions` (the designer's screens, phase 2, call these).

### What the feed now carries

`categoryPath` (the tree above the item's category), `specs` (the item's scalar custom attributes), `units` (the ERP's unit
model: the units of the base unit's category at least as big, each with its `factor`) and `quantityRules`
(`item.variant.min_order_quantity` and `order_multiple`, in the base unit; set through the variant's API as
`minOrderQuantity` and `orderMultiple`). A changed unit, category or rule moves the affected items' feed rows. **After this
ships run a full sync of each shop** (`POST /api/v1/…/sync?full=true`) so existing items carry the new fields.

The ERP's channel order refuses a line that breaks an item's minimum or multiple (`422 quantity_rules`, with the lines),
whichever unit it was written in: the store's cart holds them too, but the ERP is the one that decides.

### Tests and migration

Unit: `definitions/catalogue-config.spec.ts`, `catalogue-suggest.spec.ts`, `registry.spec.ts`, the feed's unit and rule
logic in `sales-channel.logic.spec.ts`. `npm run storefront-studio:drill` now also proves, as `commerce_app` under row-level
security: refused and accepted profiles, search settings, merchandising, a release that carries them, the suggestion for a
category, the zero-result report, and another organisation seeing nothing. Migration `1785300000000-studio-storefront-catalogue`
(two tables, `merchandising`, `item.categories.parent_id`, `item.variant.min_order_quantity` and `order_multiple`; expand only).

## 12. Phase 2: the visual designer

The designer is Studio → Storefronts in commerce-web (`src/app/features/storefronts`); the editor overlay is in
commerce-storefront (`src/studio/bridge`). This section is the API's half.

**Editing** (`controllers/storefront-editing.controller.ts`, `services/storefront-editing.service.ts`; `definitions/page-ops.ts` are
the pure operations). Every call writes a part's **draft** through the Studio's versions and never reaches the live shop;
each takes `dryRun` (checks and answers with `changes` and `issues`, writes nothing), an optional `idempotencyKey` (the same
key makes the same page, component or menu once: ids come from the key) and a `note`. Routes under
`/studio/storefronts`: `POST /` and `POST /:id/clone` (`manage`), `POST|PUT|DELETE /:id/pages…`, `POST /:id/pages/:pageId/components`,
`PATCH …/components/:componentId`, `PUT …/audience` (`content.update`), `PUT /:id/theme`, `POST …/theme/contrast`
(the guard's verdict for every pair, light and dark, nothing saved), `PUT /:id/shell` (`design.update`), `GET|PUT|DELETE …/menus`,
`GET …/collections`, `GET …/images` (the shop's usable pictures), `GET …/drafts`, `POST …/drafts/submit` (put every open draft
forward: in use, or waiting for approval where the organisation's `studio-publication` policy asks), reusable sections
(`GET|POST /reusable/sections`, `POST …/:id/copy`, `DELETE`). A save the server refuses is a 422 with the findings; the
designer keeps the person's work and shows them. `GET …/validation` findings carry a `location` (page, section,
component) so the designer can select what they are about (`definitions/issue-location.ts`).
A theme may choose its own **dark-mode colours** (`input.dark`), derived and guarded like the light set.

**Who wrote it.** `studio.versions.origin` / `origin_detail` (migration `1785200000000-studio-storefront-designer`) record
a person or an agent (client, model, brief, calls). The drafts listing, the Publishing queue and the history label agent work.

**The release is an approvable document** (`services/storefront-release.service.ts`, `@Approvable('storefront-release')`,
table `studio.storefront_releases`). `POST …/releases` validates, records the release with its diff and findings, and asks the
approval engine: with **no policy (the default) it is approved as it is made and goes live in the same call**; with one it
waits (`pending`) and the live shop is unchanged. The decision is made in the approval system's own screens (inbox, `/approvals/decide`);
the engine calls `approve`/`reject`/`withdraw`, and an approval **sends the release once the decision has committed, in a
tenant scope of its own** (a commit hook runs outside the decision's transaction). A failed send leaves the release `failed`
with why, the live shop untouched, and `POST …/releases/:id/retry` sends it again. One release is open per storefront
(unique index). Facts a policy may use (`touches` contains `legal`/`checkout`, `agentAuthored`, `first`, `changes`) are
in `policy-preview.service.ts`; `GET /releases/:releaseId` finds a release by id alone (the inbox's link).
`POST …/publications` still works and answers as before (it is a release now).

**MCP drafting tools** (`mcp-storefront-write-tools.ts`): `page_create|update|delete`, `component_place|configure`,
`theme_set_tokens`, `navigation_set`, `audience_rule_set`, `storefront_create|clone`. Each takes `dry_run`,
`idempotency_key`, `note` and `brief`, calls the same use case as the designer **as the key's maker** (their permissions are
asked, per kind), and labels what it writes as an agent's. They write drafts only; releasing is the approval system's.

**Architecture edges.** Other modules reach Storefront Studio through `studio/storefront/public-api.ts` and the online
shop through `sales-channel/online-shop/public-api.ts`; controllers reach versions only through use cases
(`VersionActor` lives in `versions/definitions/version-actor.ts`).

**Tests.** Unit: `page-ops`, `release`, `issue-location`, `theme-tokens` (contrast report, dark mode),
`storefront-editing.service.spec`, `storefront-release.service.spec`. Drill: `storefront-studio:drill` now also proves a dry run
writing nothing, idempotent create, schema/price refusals, read-only refusal, a faint theme refused with its ratio, drafts
submitted and a release live at once (no policy), a policy making the release wait, the requester unable to approve their own,
the approver's decision releasing it, a rejection leaving the shop unchanged, and the ten agent tools (dry run, idempotency,
labels, the person's permissions). It was run as `commerce_app` on `commerce_dev` and removes only what it made.

## 13. Phase 4: commerce, customer accounts and B2B

What a business buyer meets in the shop: the company's own prices, a catalogue limited to the contract, credit and
payment terms at checkout, purchase orders, quotes, returns, promotion codes and add-on services. The store service half
is `commerce-store-service/docs/b2b.md`; the storefront half is `commerce-storefront/docs/architecture.md` (B2B). **The ERP
decides every one of them**: the shop asks, shows and passes on; it never prices, judges credit or decides a return.

| Part | Where it lives | How the shop uses it |
|---|---|---|
| Account prices | `pricing.price_books` / `agreements` through the pricing engine (`reaching()`), `POST /prices` | A company's contract, customer group, tier and quantity prices, the list price they replace, the tax treatment, the quantity from which a unit costs less, and whether the item is on the contract. Cached per account only (`acct:` keys), answered `private, no-store` |
| Contract catalogues | `pricing.agreements.restricts_catalogue` | A contract may limit what the company can buy; an item outside it is `allowed: false` in the price answer and refused at the order (`not_in_catalogue`) |
| Credit and payment terms | `judgeCheckoutCredit` (pure), `POST /credit/check`, repeated at the order | Four outcomes: approved, needs a deposit, needs approval, refused with a reason; the credit bar's figures (limit, used, this order, left, overdue). The way of paying is never changed for the buyer |
| Purchase orders and approvals | payments `purchase_order` / `deposit`, `commerce.purchaseOrders`, the company's roles and limits | A PO number on the order and invoice (required by setting); the order waits for the company's own approver where the buyer's limit or the shop's rule says so |
| Quotes | `sales.quotations` + `sales_channel.channel_quotes` | `POST /quotes` makes a quotation for the buyer; its status in the buyer's words (requested, quoted, accepted, declined, expired); accepting is `POST /orders` with `quoteId` (lines and prices are the quotation's) |
| Returns | `commerce.returns`, the ERP's sales-return use case | `GET /orders/:id/return-eligibility` (window, days left, what is still returnable) and `POST /returns`, held to the same rules |
| Coupons and promotions | `price_books.coupon_code` (kind `promotion`) | A code is a promotion book that only prices when its code is sent; the verdict says whether it applied, by how much, and why not |
| Add-on services | `item.add_on_offers`, `sales_channel.channel_order_add_ons`, `ADD_ON_QUOTE_PROVIDERS` | A service offered with an item, priced fixed, as a percent of the item or quoted by a provider. A one-off becomes a service line on the order; a monthly one becomes a recurring sales invoice (`AddOnBillingPort`) |

**Settings** (Studio, per storefront: `GET|PUT /studio/storefronts/:id/commerce-settings`, `studio.storefront.settings.update`;
the same object is `OnlineShopSettings.commerce`): `deposit` (smallest percent; offered when over the limit),
`purchaseOrders` (number required, document required, approval by limits or always), `overdue` (hold credit back, grace
days), `quotes` (on, validity days), `coupons` (on), `returns` (on, window days), `addOns` (on). The payments gain two
ways of paying, `purchase_order` and `deposit`. Nothing is on by default that would change a shop that sets nothing.

**Routes added to the channel API** (`/api/channel/v1`, the channel key): `POST /prices` (extended), `POST /credit/check`,
`POST|GET /quotes`, `GET /quotes/:id`, `POST /quotes/:id/decline`, `GET /orders/:id/return-eligibility`,
`POST /add-ons/offers`; `POST /orders` takes `couponCode`, `quoteId`, `addOns`, and the company object takes `deposit` and
`purchaseOrder`. Back office: `/add-on-offers` (`trade.channels.read|update`).

**Registry components** (five, the storefront's registry v1 gains them; vendored byte for byte): `company-switcher`,
`credit-bar`, `quote-request`, `reorder-list`, `promotion-code`. Each draws only for the shopper it is for.

**Migrations (expand only):** `1785400000000` (`price_books.coupon_code`, `agreements.restricts_catalogue`),
`1785400000100` (`sales_channel.channel_quotes`, RLS), `1785400000200` (`item.add_on_offers`,
`sales_channel.channel_order_add_ons`). Proven on a scratch database, then applied to `commerce_dev`.

**Tests:** unit (the credit verdict, the quote status logic, the add-on pricing logic, the registry) and
`storefront-studio:drill` extended (`storefront-commerce-drill.ts`: 57 more checks as `commerce_app` under RLS: account
and contract prices, the catalogue limit, every credit outcome, coupons, quotes end to end, returns, add-ons, the
settings and their permission). Not drilled: the overdue rule against real invoices (unit-tested), the live quote provider
(only the sandbox adapter exists).

**What was left, and is now built (phase 4, rest):** the web screens for the commerce settings (commerce-web
`Studio → Storefronts → Commerce settings`), MCP tools for them (`commerce_settings_get`, `commerce_settings_set`: draft only,
the change waits as a version of kind `storefront-commerce-settings` until a person puts it in force), cancelling a monthly
add-on from the shop (§14), and the `?quote=` accept link in the storefront. Still open: per-product tier prices in the public
cache.

## 14. Phase 5: specialised journeys

What a shopper does in a shop that is not "put things in a basket and pay": subscribing to a plan, booking a room, a table
or an appointment, ordering for a time, seeing the things they bought with their serial numbers and warranties. **The ERP is
the only source of truth** for each: it bills, holds, allocates, decides every state and refuses in words; the store service
(`commerce-store-service/docs/journeys.md`) asks as the shopper's own ERP customer, and the storefront shows the answer. Code:
`src/modules/sales-channel/{subscriptions,bookings,warranty,ordering}/`, the booking engine's facade
`src/modules/booking/public/services/shop-booking.service.ts`, and the channel routes in
`channel-api/channel-journeys.controller.ts`. Every journey is a setting of the storefront's commerce settings, off until the
organisation switches it on, and enforced here when the order or request is taken.

| Journey | Settings (`commerce.*`) | What the ERP holds | Channel routes (`/api/channel/v1`, the channel key) |
|---|---|---|---|
| Subscriptions | `subscriptions {enabled, shopperCancels}` | `item.subscription_plans` (the item sold as a plan, its renewal service item, period, shortest commitment), `sales_channel.channel_order_subscriptions`; the first period is the order's line, the periods after are a recurring sales invoice (`AddOnBillingPort.startRecurring`), cancelling stops the schedule | `GET /subscriptions[/:id]`, `POST /subscriptions/:id/cancel` (monthly add-ons are listed and cancelled the same way); back office `/subscription-plans` |
| Bookings | `bookings {enabled}` | The booking engine's public offers at the channel's places (rooms by the night, tables, appointments, hire); `sales_channel.channel_bookings` links a booking to the channel and the `Idempotency-Key` it was made with, so a double tap is one booking | `GET /bookings/offers[/:id]`, `/bookings/{slots,stays,nights}`, `POST /bookings`, `POST /bookings/waitlist`, `GET /bookings[/:number[/options]]`, `POST /bookings/:number/{move,cancel,accept}` |
| Products and warranties | `warranty {enabled}` | `item.warranty_policies` (what an item is sold with), `item.serial_units` (received serial numbers, oldest in stock allocated when the goods leave, `FOR UPDATE SKIP LOCKED`), `sales_channel.channel_order_coverages` (one record per unit sold, **with the policy as it was that day**: eligibility is read from this record, never from words on a product page) | `GET /owned[/:id]`, `POST /owned/:id/register`; back office `/warranty-policies`, `/serial-units` (`receive`, `counts/:variantId`) |
| Ordering for a time | `schedule {enabled, required, timezone, opensAt, closesAt, daysOpen, windowMinutes, leadMinutes, horizonDays, capacity}` | `sales_channel.channel_order_schedules` (the window an order asked for, counted against `capacity`); the window is checked again when the order is taken and the last place is held for one order only (an advisory lock on the window to the commit) | `GET /schedule/windows?date=|at=`; `POST /orders` takes `schedule {start}` |
| What to do when an item runs out | `substitution {enabled, default}` | The preference travels with the order (`contact`, `substitute`, `refund`) and is on the sales order's context for whoever picks it | `POST /orders` takes `substitution` |

**Decisions.** A subscription plan is a catalogue item plus recurring terms: no second billing engine. A warranty record is made
when the order is placed, not looked up later. Serial allocation can never block a delivery: it runs under a savepoint inside the
issue and logs on failure. A booking is always for the shopper's ERP customer (found or made by email, then phone, as for an
order). Restaurant toppings and extras are the phase 4 add-on offers (one-off service items priced by the ERP), sizes are
variants; grocery and wholesale quantities are the item's units and quantity rules, the quick order, saved lists and reorder:
none of them gets a mechanism of its own. Insurance is **out of scope**: the generic seam (an add-on or plan priced by a
provider, `ADD_ON_QUOTE_PROVIDERS`) exists, nothing insurance-specific does.

**MCP and the Studio.** All five sets of settings are in the commerce settings schema, so the Studio form (drawn from the JSON
schema) and the MCP drafting tools reach them with no extra code. Registry: `booking-offers` (registry v1; a hotel's or salon's
home page lists what can be booked, each with a button into the booking journey). `/book` is the shop's own address
(`RESERVED_ROUTES`).

**Migrations (expand only, RLS on):** `1788500000000-studio-subscriptions` (`item.subscription_plans`,
`sales_channel.channel_order_subscriptions`, and `cancelled_at`/`cancel_reason`/`paid_through` on
`channel_order_add_ons`), `1788500000100-studio-bookings` (`sales_channel.channel_bookings`),
`1788500000200-studio-warranty` (`item.warranty_policies`, `item.serial_units`, `sales_channel.channel_order_coverages`),
`1788500000300-studio-order-schedule` (`sales_channel.channel_order_schedules`).

**Tests:** unit specs for every pure rule (`subscription.logic`, `warranty.logic`, `ordering.logic`) and service
(`channel-subscriptions`, `channel-bookings`, `shop-booking`, `channel-warranty`, `channel-ordering`), the settings diff, the MCP
tools, the registry and the reserved routes; `test/shop-journeys.e2e-spec.ts` (ordering, substitution, warranties, subscriptions
through the whole application). **Written, not run in the lane that wrote them** (the weekend freeze runs the full suite): that
e2e spec, and the drills for the four journeys under `commerce_app` (RLS) on `commerce_dev`.

**What is left:** no booking images; guests who are not signed in cannot book or manage a booking, and the manage and notice
emails link to the ERP-hosted pages; no trial, upgrade or downgrade of a subscription; no back-office web screens yet for plans,
warranty policies or serial units (API only); serial numbers are received in bulk through the API, not yet automatically from a
goods receipt; no restaurant kitchen-ticket integration (a web order is a sales order, not a kitchen ticket); no intake form or
documents for a quotation-based service request (the quote request takes a note); the platform OpenAPI is not regenerated for the
new routes.

## History

* 17 October 2026 — phase 1 (foundation): this document's model, publish flow, registry contract, preview tokens,
  adoption, MCP read tools and permissions.
* 18 October 2026 — phase 3 (catalogue): view profiles, search settings and merchandising as versions; the eight catalogue
  views as registry components; suggestions from the catalogue's figures; the feed's categories, specifications, units and order
  rules; category hierarchy; order rules held by the channel order.
* 18 October 2026: phase 2 (the visual designer): editing endpoints, the release as an approvable document, MCP drafting tools, who-wrote-it labels, dark-mode theme colours.
* 18 October 2026: phase 4 (commerce, accounts and B2B): account prices, contract catalogues, credit and payment terms, purchase orders, quotes, returns, coupons, add-on services; commerce settings in the Studio; five registry components.
* 18 October 2026: phase 4 rest and phase 5 (specialised journeys): commerce settings as a draft version with MCP tools, the `?quote=` link, subscriptions, bookings, serial units and warranties, ordering for a time and substitution; the `booking-offers` registry component.


## Archive and restore; the card's picture (24 October 2026)

- A storefront's status is its channel's (`draft`, `active`, `paused`, `retired`). Archived is `retired`: it stops
  selling and keeps everything. `POST /studio/storefronts/:id/archive` and `/restore` (`studio.storefront.manage`,
  `ArchiveStorefrontUseCase`) go through `ChannelsService.changeStatus`; restored comes back `paused`. Nothing is
  deleted; no migration (the status already had `retired`).
- The list and the detail carry `archived` and `theme` (the theme in use's light colours, radius and name) for the
  card's picture; there is no rendered preview image.
- Conversion and page speed: the store service and analytics record no sessions, visits or page timings, so the
  tiles are not served.
