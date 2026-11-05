# Clafina website, phase 2a (screen kit, Home, Platform, Pricing, demo) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Product screens drawn in code in the product's own look, and the first marketing pages built on them: Home, Platform, Pricing, Compare plans, Book a demo and Contact sales, with the lead form and its Cloudflare function.

**Architecture:** A screen kit (`src/screens/kit/`) reproduces the ERP's "Commerce Black" look from the owner's mockup canvases at a fixed design width, scaled to fit its container. Screens are compositions of kit parts whose words and numbers come from content files, so they translate with the page. Plans and prices live in a config file behind a confirmation switch. The lead form validates with one shared zod schema, in the browser and in `functions/api/lead.ts`.

**Tech Stack:** as phase 1 (Next.js 16.4.5 static export, React 19, Tailwind 4.3.4, next-intl 4.14.9, zod 4.6.7, Vitest 5.1.0, Playwright 1.63.0, axe, Lighthouse CI).

**Spec:** `docs/superpowers/specs/2026-11-05-clafina-website-design.md` (sections 6, 7, 8, 9, 10, 11). Facts: `docs/product-facts.md` and `docs/product-source/`.

## Global Constraints

- All phase 1 Global Constraints hold (locales, logical CSS only, banned words, no exclamation marks, the dropped taglines, `docs/` and `brand/` never deployed, WCAG 2.2 AA, Lighthouse budgets).
- Work on a branch per task group, open a PR, wait for CI, rebase-merge it with `gh api repos/ebenezerugo/clafina-site/pulls/<n>/merge -X PUT -f merge_method=rebase`.
- Product screens keep the product's neutral look; they never use the site's brand tokens except `--s-brand`, which defaults to `#18181b`.
- Every screen is labelled "Illustrative example", uses fictional business and person names, no real brands, and is hidden from assistive technology behind one text description (`role="img"` + `aria-label`).
- Claims, prices and plan limits not confirmed by the owner are sample values behind switches; production refuses them.
- A page link appears only when that page is available (`pageAvailable`); otherwise the item renders without a link.

## Review Focus

- A screen rendered in a narrow column (phone width, 390 px) must scale down without horizontal page scroll or clipped text. Test in Task 1.
- Money on screens must format for the page's language (`₦2,486,500` in English, `2.486.500 ₦` style in German) and never show `NaN`. Test in Task 1.
- The lead function must refuse a missing or failed Turnstile token, oversized bodies, unknown fields and non-POST methods, and must never claim success when no CRM endpoint is set. Test in Task 7.
- The country switcher must change the currency on Pricing without a reload, and survive a blocked `localStorage`. Test in Task 5.
- The "one record" animation must show its final state at rest with `prefers-reduced-motion: reduce`. Test in Task 3.

---

### Task 1: Screen kit

**Files:**
- Create: `src/screens/kit/screen.css`, `src/screens/kit/money.ts`, `src/screens/kit/ScaledScreen.tsx`, `src/screens/kit/frames.tsx` (`AppFrame`, `PhoneFrame`, `TillFrame`), `src/screens/kit/parts.tsx` (`StatCard`, `Pill`, `KitButton`, `Card`, `AttentionRow`, `DataTable`, `Progress`, `Avatar`, `Icon`), `src/screens/kit/types.ts`, `test/screens/money.test.ts`, `test/screens/scale.test.ts`
- Modify: `src/config/routes.ts` (a `previewOnly` flag), `src/config/switches.ts` (`pageAvailable` false for `previewOnly` routes in production), `app/[locale]/screens/page.tsx` (preview-only gallery of every kit part and frame, noindex, out of nav, footer and sitemaps)

**Interfaces:**
- Produces:
  - `formatMoney(amount: number, currency: 'NGN'|'USD'|'GHS'|'KES'|'EUR', locale: Locale): string` using `Intl.NumberFormat` with `localeInfo(locale).hreflang`, no decimals for NGN, two otherwise; throws on a non-finite amount.
  - `fitScale(containerWidth: number, designWidth: number): number` = `min(1, containerWidth / designWidth)`, `0` for a non-positive container.
  - `<ScaledScreen width={1280|390|1180} height label>`: client component; ResizeObserver sets `transform: scale(fitScale(...))` on an inner box of the design size and the outer box height to `height * scale`; outer has `role="img" aria-label={label}`, inner `aria-hidden="true"` and `inert`.
  - Frames: `AppFrame { org: { initials, name, place }, nav: { label, badge?, active? }[][], title, subtitle, children }` (256 px sidebar, 52 px org block, "Go to page…" box, grouped items); `PhoneFrame { org, tabs, children }` (390×844, header 56 px, bottom tabs 64 px); `TillFrame { children }` (1280×800).
  - Parts follow the mockups: page `#fafafa`, ink `#09090b`, line `#e4e4e7`, muted `#52525b`, subtle `#71717a`, card radius 12 px, 13 px/20 px text, tabular numbers; `Pill tone: 'good'|'warn'|'bad'|'info'|'neutral'` with pairs good `#e7f6ee/#145c2f`, warn `#fff3dc/#833d07`, bad `#fdecea/#a81919`, info `#e8eefd/#1d4ed8`, neutral `#f4f4f5/#52525b`.
  - `RouteDef.previewOnly?: true`; route `screens` (`/screens/`, group `core`, built, previewOnly).

- [ ] **Step 1: Write the failing tests**

```ts
expect(formatMoney(2486500, 'NGN', 'en')).toBe('₦2,486,500');
expect(formatMoney(18240, 'USD', 'en')).toBe('$18,240.00');
expect(formatMoney(2486500, 'NGN', 'de')).toMatch(/^2\.486\.500\s?₦$/);
expect(() => formatMoney(NaN, 'NGN', 'en')).toThrow();
expect(fitScale(390, 1280)).toBeCloseTo(0.3047, 3);
expect(fitScale(1600, 1280)).toBe(1);
expect(fitScale(0, 1280)).toBe(0);
expect(pageAvailable('screens', 'production')).toBe(false);
expect(pageAvailable('screens', 'preview')).toBe(true);
```

- [ ] **Step 2: Run** `npx vitest run test/screens test/config`. Expected: FAIL.
- [ ] **Step 3: Implement**; the gallery page shows every part and frame with sample data from `content/en/screens/gallery.json`.
- [ ] **Step 4: Run** the tests, `npm run build`, and an e2e check: `/en/screens/` at 390 px has no horizontal scroll (`document.documentElement.scrollWidth <= 390`) and axe reports no violations. Expected: PASS.
- [ ] **Step 5: Commit** `Add the product screen kit`.

### Task 2: Screens content and checks

**Files:**
- Create: `src/content/screens.ts` (zod schemas per screen), `content/en/screens/sales-home.json`, `phone-home.json`, `till-sell.json`, `shop-phone.json`, `ledger-entry.json`, `src/screens/SalesHome.tsx`, `PhoneHome.tsx`, `TillSell.tsx`, `ShopPhone.tsx`, `LedgerEntry.tsx`
- Modify: `scripts/check-content.ts` (walk `content/<locale>/screens/`; screen files skip the claim rule for `%` but keep banned words and exclamation marks; every screen file needs `"illustrative": true` and an `org.name`), `test/scripts/check-content.test.ts`

**Interfaces:**
- Consumes: kit (Task 1), `loadContent`.
- Produces: one component per screen taking `{ locale: Locale }`, loading its content file and formatting money with `formatMoney`. Content mirrors the mockup boards: sales home `project/erp4a/erp4a-sales-home.dc.html`, phone home `project/erp/erp-phone-home.dc.html`, till sell (Till canvas `Main.dc.html`), shop phone (Storefront Studio canvas `shops/restaurant-phone.dc.html`), ledger entry (`project/erp4d/erp4d-finance-journal-detail.dc.html`). Fictional organisation names, e.g. "Bright Harbour Traders (example)".

- [ ] **Step 1: Write the failing tests**

```ts
expect(checkContent('test/fixtures/content-screens', 'preview')).toEqual([
  'en/screens/no-label.json is not marked illustrative',
  'en/screens/bang.json title has an exclamation mark',
]);
expect(checkContent('content', 'preview')).toEqual([]);
```

- [ ] **Step 2: Run** `npx vitest run test/scripts/check-content.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the checks, schemas, content and the five screens; add them to the gallery.
- [ ] **Step 4: Run** the tests, `npm run check:content`, `npm run build`, the gallery e2e. Expected: PASS.
- [ ] **Step 5: Commit** `Add the first product screens`.

### Task 3: Home page

**Files:**
- Create: `src/components/sections/` (`Hero.tsx`, `OneRecord.tsx`, `Surfaces.tsx`, `ModuleGrid.tsx`, `IndustryStrip.tsx`, `WorksWhereYouWork.tsx`, `TrustBand.tsx`, `PricingTeaser.tsx`, `CtaBand.tsx`, `IllustrativeLabel.tsx`), `src/content/home.ts`
- Modify: `src/content/schema.ts` (`HomeContent` grows the sections), `content/en/home.json`, `app/[locale]/page.tsx`, `e2e/home.spec.ts` (screenshots updated)

**Interfaces:**
- Consumes: screens (Task 2), `NAV`, `ROUTES`, `pageAvailable`, `LOCALES`, `isOn`, plans (Task 4 provides `PLANS`; until then `PricingTeaser` renders only when `PLANS` exists, so Task 3 ships it hidden by `sections.homePricingTeaser`).
- Produces: the home page in the template order of spec section 8. Copy from `docs/product-facts.md` "Platform-wide facts"; trust lines that name certifications, uptime or customer counts carry their `claim`. `OneRecord`: four steps (till sale → stock moves → the books → the owner's phone), each a small screen; CSS-only stepping animation, final state shown at rest and under reduced motion. Module grid groups and industry list come from `NAV`; items link only when available.

- [ ] **Step 1: Write the failing e2e tests**

```ts
test('home shows the sections in order', async ({ page }) => {
  await page.goto('/en/');
  const ids = await page.locator('main > section').evaluateAll((s) => s.map((x) => x.id));
  expect(ids).toEqual(['hero', 'one-record', 'surfaces', 'modules', 'industries', 'works-where-you-work', 'trust', 'cta']);
});
test('every screen is labelled illustrative', async ({ page }) => {
  await page.goto('/en/');
  const screens = page.locator('[data-screen]');
  expect(await screens.count()).toBeGreaterThan(3);
  for (const s of await screens.all()) await expect(s.locator('xpath=ancestor-or-self::*[@data-illustrative]').first()).toBeAttached();
});
test('the one-record steps are all visible with reduced motion', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/en/');
  for (const s of await page.locator('#one-record [data-step]').all()) await expect(s).toHaveCSS('opacity', '1');
  await ctx.close();
});
test('module items without a page are not links', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('#modules a[href*="/product/"]')).toHaveCount(0);
});
```

- [ ] **Step 2: Run** `npm run build && npx playwright test e2e/home.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the sections and content.
- [ ] **Step 4: Run** the e2e suite (update snapshots once, then re-run without updating), axe, `npx lhci autorun`. Expected: PASS within budgets.
- [ ] **Step 5: Commit** `Build the home page`.

### Task 4: Plans and prices

**Files:**
- Create: `src/config/plans.ts`, `test/config/plans.test.ts`
- Modify: `src/config/switches.ts` (group `pricing` with `plans`; `pricing` joins the groups that need `confirmedBy`), `test/config/switches.test.ts`

**Interfaces:**
- Produces:
  - `type PlanId = 'free'|'growth'|'business'|'enterprise'`; `type Edition = 'global'|'ng'|'latam'`.
  - `PLANS: { id: PlanId; price: Record<Edition, { amount: number | null; currency: 'USD'|'NGN' }>; limits: { users: number|null; locations: number|null; tills: number|null }; features: string[] /* message keys */ }[]` with the PRD's proposed prices: Free 0, Growth 29, Business 99 USD for global and latam; Enterprise `null` (contact sales); Nigeria amounts and every limit are samples.
  - `SWITCHES.pricing.plans`: on, `sample: true`, note "Proposed tiers from the PRD (13 Oct), not final".
  - `planPrice(id: PlanId, edition: Edition): { amount: number|null; currency }`.

- [ ] **Step 1: Write the failing tests**

```ts
expect(PLANS.map((p) => p.id)).toEqual(['free', 'growth', 'business', 'enterprise']);
expect(planPrice('growth', 'global')).toEqual({ amount: 29, currency: 'USD' });
expect(planPrice('enterprise', 'ng').amount).toBeNull();
expect(productionProblems()).toContain('pricing.plans is on with a sample value');
```

- [ ] **Step 2: Run** `npx vitest run test/config`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the tests. Expected: PASS.
- [ ] **Step 5: Commit** `Add plans and prices behind a confirmation switch`.

### Task 5: Pricing and Compare plans

**Files:**
- Create: `app/[locale]/pricing/page.tsx`, `app/[locale]/pricing/compare/page.tsx`, `src/components/pricing/PlanCards.tsx` (client: listens to `clafina:country` and reads `clafina.country`), `src/components/pricing/CompareTable.tsx`, `src/content/pricing.ts`, `content/en/pricing.json`, `content/en/pricing-compare.json`, `e2e/pricing.spec.ts`
- Modify: `src/config/routes.ts` (`pricing`, `pricing-compare` built), `src/lib/seo.ts` (`SoftwareApplication` with `offers` only when `pricing.plans` is confirmed), `messages/en.json`

**Interfaces:**
- Consumes: `PLANS`, `planPrice`, `formatMoney`, `CountrySwitcher` event, `signupUrl` (with `plan`), `pageAvailable('contact-sales')`.
- Produces: Pricing (plan cards, what every plan includes, add-ons, FAQ with `FAQPage` JSON-LD) and Compare (one table, rows grouped by area, sticky plan header, scrolls inside its own box on phones).

- [ ] **Step 1: Write the failing e2e tests**

```ts
test('prices follow the country', async ({ page }) => {
  await page.goto('/en/pricing/');
  await expect(page.getByTestId('price-growth')).toHaveText(/\$29/);
  await page.getByLabel('Country').selectOption('ng');
  await expect(page.getByTestId('price-growth')).toContainText('₦');
});
test('pricing works with storage blocked', async ({ browser }) => {
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
  const page = await ctx.newPage();
  await page.goto('/en/pricing/');
  await expect(page.getByTestId('price-growth')).toHaveText(/\$29/);
  await ctx.close();
});
test('Start on Growth carries the plan', async ({ page }) => {
  await page.goto('/en/pricing/');
  await expect(page.getByTestId('cta-growth')).toHaveAttribute('href', /plan=growth/);
});
test('compare table scrolls inside its box on phones', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/pricing/compare/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
```

- [ ] **Step 2: Run** `npm run build && npx playwright test e2e/pricing.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the full e2e suite, axe, link check. Expected: PASS.
- [ ] **Step 5: Commit** `Build Pricing and Compare plans`.

### Task 6: Platform overview

**Files:**
- Create: `app/[locale]/platform/page.tsx`, `content/en/platform.json`, `src/content/platform.ts`, `e2e/platform.spec.ts`
- Modify: `src/config/routes.ts` (`platform` built)

**Interfaces:**
- Consumes: sections (Task 3), screens (Task 2), facts file.
- Produces: the platform page: one record explained with a diagram (inline SVG, theme tokens), the surfaces with a screen each, how packs work (one core, the trade's words, defaults), languages and currencies, offline, security facts (true and specific; anything naming certifications is a `claim`), integrations, CTA.

- [ ] **Step 1: Write the failing e2e test**: `/en/platform/` has one `h1`, at least four `[data-screen]`, no axe violations, and the header shows a Pricing link.
- [ ] **Step 2: Run** it. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the e2e suite and link check. Expected: PASS.
- [ ] **Step 5: Commit** `Build the platform overview`.

### Task 7: Lead form and its function

**Files:**
- Create: `src/lib/lead.ts`, `functions/api/lead.ts`, `src/components/forms/LeadForm.tsx` (client, multi-step), `app/[locale]/demo/page.tsx`, `app/[locale]/contact-sales/page.tsx`, `content/en/demo.json`, `content/en/contact-sales.json`, `test/lib/lead.test.ts`, `test/functions/lead.test.ts`, `e2e/demo.spec.ts`
- Modify: `src/config/routes.ts` (`demo`, `contact-sales` built), `scripts/serve-out.mjs` (answers `POST /api/lead` with `503 {"error":"not_connected"}` like the function without configuration), `public/_headers` (nothing new: Turnstile is already allowed)

**Interfaces:**
- Produces:
  - `LeadSchema` (zod, `.strict()`): `kind: 'demo'|'sales'`, `name` (1–120), `email` (email, ≤ 200), `company` (1–160), `country` (2-letter), `industry` (an industry route id or `other`), `teamSize: '1-5'|'6-20'|'21-100'|'101-500'|'500+'`, `message?` (≤ 2000), `slot?` (≤ 120), `locale` (a `Locale`), `campaign?` (`Campaign`), `turnstileToken` (1–2048).
  - `parseLead(body: unknown): { ok: true; lead } | { ok: false; errors: Record<string, string> }`.
  - `functions/api/lead.ts`: `onRequestPost({ request, env })` with `env: { TURNSTILE_SECRET?: string; CRM_ENDPOINT?: string; CRM_TOKEN?: string }`. Order: body over 16 KB → 413; not JSON or schema fails → 400 with field errors; no `CRM_ENDPOINT` or no `TURNSTILE_SECRET` → 503 `not_connected`; Turnstile siteverify fails → 403; forward JSON (without the token) to `CRM_ENDPOINT` with `Authorization: Bearer CRM_TOKEN` when set; CRM non-2xx → 502; else 202. `onRequest` for other methods → 405 with `Allow: POST`. `fetch` is injectable for tests (`env.fetch ?? fetch`).
  - `LeadForm`: steps business → industry (preselected from `?industry=`) → team size → time and message → send; shows field errors in place; on 503 says "The form is not connected yet. Please email us instead." with `SITE.emails.sales` when set; on 202 "Thanks. We will reply within one working day." only after a 202. Turnstile widget renders only when `SITE.turnstileSiteKey` is set.

- [ ] **Step 1: Write the failing tests**

```ts
// lead.test.ts
expect(parseLead({ ...valid, extra: 1 }).ok).toBe(false);
expect(parseLead({ ...valid, email: 'nope' })).toMatchObject({ ok: false, errors: { email: expect.any(String) } });
// functions/lead.test.ts
const req = (body: unknown, init: RequestInit = {}) => new Request('https://x/api/lead', { method: 'POST', body: JSON.stringify(body), ...init });
expect((await onRequestPost({ request: req(valid), env: {} })).status).toBe(503);
expect((await onRequestPost({ request: req({}), env: full })).status).toBe(400);
expect((await onRequestPost({ request: req('x'.repeat(20000)), env: full })).status).toBe(413);
expect((await onRequestPost({ request: req(valid), env: { ...full, fetch: turnstile(false) } })).status).toBe(403);
expect((await onRequestPost({ request: req(valid), env: { ...full, fetch: turnstileThenCrm(true, 500) } })).status).toBe(502);
const sent = capture(); expect((await onRequestPost({ request: req(valid), env: { ...full, fetch: sent.fetch } })).status).toBe(202);
expect(sent.crmBody).not.toHaveProperty('turnstileToken');
expect((await onRequest({ request: new Request('https://x/api/lead'), env: full })).status).toBe(405);
```

```ts
// e2e/demo.spec.ts
test('the demo form never claims success when not connected', async ({ page }) => { /* fill every step, send, expect "not connected yet", expect no "Thanks" */ });
test('field errors show in place', async ({ page }) => { /* send step 1 empty, expect error text tied by aria-describedby */ });
test('the industry comes from the link', async ({ page }) => { await page.goto('/en/demo/?industry=industry-farm'); /* expect Farms selected on step 2 */ });
```

- [ ] **Step 2: Run** `npx vitest run test/lib/lead.test.ts test/functions` and `npm run build && npx playwright test e2e/demo.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement**; the Vitest config includes `test/functions/**`.
- [ ] **Step 4: Run** everything (`npm test`, build, full e2e, link check, `npx wrangler pages functions build --outdir /tmp/fn functions`). Expected: PASS.
- [ ] **Step 5: Commit** `Add the demo and sales forms with the lead function`.
