# Clafina website, phase 2b (the 21 product pages) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One deep page for each of the 21 products, each with its own screens ported from the owner's mockups, written only from `docs/product-facts.md`.

**Architecture:** Screens become data. A `ScreenSpec` content file describes a screen (frame, organisation, navigation, title, blocks); one renderer draws any spec with the phase 2a kit. A product page is one content file (hero, three jobs, screen tour, features, connections, surfaces, industries, pre-launch items, questions) rendered by one template at `app/[locale]/product/[slug]/page.tsx`.

**Tech Stack:** as phase 2a.

**Spec:** `docs/superpowers/specs/2026-11-05-clafina-website-design.md` (sections 5, 7, 8, 9, 10). Facts: `docs/product-facts.md`. Mockups: the four canvases in spec section 7.

## Global Constraints

- All phase 1 and 2a Global Constraints hold.
- Every claim comes from `docs/product-facts.md` for that page; its `sources` list names the docs. Items under "Not yet" in the facts are written as features with `prelaunch: "<route id>"`.
- Payment providers, tax authorities, compliance labels, uptime and figures appear only inside a `claim` object.
- Screens use fictional organisations and people, are marked illustrative, and keep the product's look.
- Each product route becomes `built: true` only when its page, content and screens are complete.

## Review Focus

- A screen spec that names an unknown block type, icon or tone must fail the content check, not render blank. Test in Task 1.
- A table row with more or fewer cells than its columns must fail the check. Test in Task 1.
- A product page whose `industries` names an industry page that is not built must show the name without a link. Test in Task 2.
- A pre-launch feature must disappear when its area's switch is off, and the page must still read well. Test in Task 2.
- The longest product page must stay within the Lighthouse budget on a phone. Test in Task 2.

---

### Task 1: Screens from data

**Files:**
- Create: `src/content/screen-spec.ts`, `src/screens/SpecScreen.tsx`, `test/content/screen-spec.test.ts`
- Modify: `scripts/check-content.ts` (screen files with `"spec": 1` are validated against `ScreenSpec`; row width checked), `app/[locale]/screens/page.tsx` (shows every spec file)

**Interfaces:**
- Produces:
  - `ScreenSpec` (zod): `spec: 1`, `illustrative: true`, `label` (starts "Illustrative example"), `currency`, `frame: 'app' | 'phone'`, `org`, `nav` (app) or `tabs` (phone), `goTo?`, `search?`, `title`, `subtitle?`, `actions?: { label; primary?; icon? }[]`, `blocks: Block[]`.
  - `Block` union by `type`: `stats { items: { icon, label, value: Cell, change?: { tone, text, dir? }, note? }[] }`, `attention { title, items: { tone, icon, title, body, action? }[] }`, `table { title?, columns: { label, numeric? }[], rows: Cell[][] }`, `steps { items: string[], current: number }`, `kv { title?, items: { label, value: Cell }[] }`, `cards { columns: 1-4, items: { title, body, pill?: { tone, text } }[] }`, `progress { label, value: 0-100, note? }`, `row { blocks: Block[]; widths?: string }`.
  - `Cell = string | { money: number } | { pill: Tone; text: string } | { strong: string } | { avatar: string; text: string }`.
  - `<SpecScreen locale id />` loads `content/<locale>/screens/<id>.json` and renders it.

- [ ] **Step 1: Write the failing tests**: a valid spec parses; an unknown block type, an unknown icon, a row with the wrong number of cells, and a label without "Illustrative example" each fail with the file and path in the message; `checkContent` reports them.
- [ ] **Step 2: Run** `npx vitest run test/content/screen-spec.test.ts test/scripts/check-content.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement**; port `ledger-entry` to a spec as the proof.
- [ ] **Step 4: Run** the tests, the build and the gallery e2e. Expected: PASS.
- [ ] **Step 5: Commit** `Draw screens from data`.

### Task 2: Product page template

**Files:**
- Create: `src/content/product.ts`, `app/[locale]/product/[slug]/page.tsx`, `src/components/product/*` (`ProductHero`, `JobList`, `ScreenTour`, `FeatureList`, `Connections`, `SurfaceChips`, `IndustryLinks`, `Faq`), `e2e/product.spec.ts`
- Modify: `src/config/routes.ts` (a helper `productSlug(id)`), `src/content/registry.ts`

**Interfaces:**
- Produces:
  - `ProductContent`: `kind: 'product'`, `sources: string[]`, `meta`, `hero { eyebrow, title, lede, screen }`, `jobs: { title, body }[3]`, `tour: { screen, title, body, callouts: string[] }[2..5]`, `features: { title, items: Claim[] }[]`, `connects: { route, text }[]`, `surfaces: ('web'|'till'|'phone'|'shop'|'assistant'|'meet')[]`, `industries: RouteId[]`, `faq: { q, a }[]`.
  - `generateStaticParams` over built product routes only; `dynamicParams = false`.
  - A `Claim` with `prelaunch` renders only while `prelaunch.features` and `prelaunch.<route id>` are on.

- [ ] **Step 1: Write the failing e2e tests** for `/en/product/sales/`: one `h1`; sections `jobs`, `tour`, `features`, `connects`, `surfaces`, `industries`, `faq` in order; every `[data-screen]` labelled illustrative; unbuilt industries are not links; `FAQPage` JSON-LD present; axe clean; no sideways scroll at 390 px.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement** the template and the Sales page (content and three screens from `erp4a-sales-home`, `erp4a-quotation-detail`, `erp4a-waybill-detail`, `erp4a-phone-waybill`), then mark `product-sales` built.
- [ ] **Step 4: Run** the e2e suite, link check and Lighthouse on `/en/product/sales/`. Expected: PASS.
- [ ] **Step 5: Commit** `Add the product page template and the Sales page`.

### Tasks 3–7: The other 20 product pages, in groups

Each task writes, for each page in its group: the content file from that page's section of `docs/product-facts.md`; two to four screen specs from the boards the facts list; marks the route built; adds the route to the e2e loop that runs the Task 2 checks on every built product page. One commit per page, named `Add the <name> page`.

| Task | Pages |
|---|---|
| 3 | Finance and accounting, Payments and wallets, Tax engine, Business health and reports |
| 4 | Customers and CRM, Point of sale, Online shop and Storefront Studio, Trading network |
| 5 | Stock and warehouses, Purchasing, Manufacturing, Bookings |
| 6 | Projects, Assets and maintenance, HR and payroll, Communication |
| 7 | Mobile app, AI assistant, Document capture, Integrations and API |

- [ ] **Per page: Write** the e2e entry (it fails while the route is unbuilt). **Run** it: FAIL. **Implement** the content and screens. **Run** the e2e suite, content and link checks: PASS. **Commit.**
