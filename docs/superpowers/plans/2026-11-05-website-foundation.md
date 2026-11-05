# Clafina website, phase 1 (foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Next.js static site that builds every route in 20 languages with English content, a swappable placeholder theme, site-wide switches, the settings file, header with mega menus, the nine-column footer, deep-link plumbing, SEO basics, and CI and Cloudflare deploy, ready for phase 2 pages.

**Architecture:** Next.js App Router with `output: 'export'`; every page lives under `app/[locale]/`. Configuration is data in `src/config/*` (locales, routes, switches, settings, nav) read by pure functions that are unit-tested; components only render what those functions return. Build-time scripts check content, switches, settings and the output folder; CI runs them, then Playwright, axe and Lighthouse against the exported `out/`.

**Tech Stack:** Next.js 16.4.5, React 19, TypeScript (strict), Tailwind CSS 4.3.4 with `@tailwindcss/postcss`, next-intl 4.14.9, zod 4.6.7, Vitest 5.1.0, @playwright/test 1.63.0 (matches the preinstalled Chromium), @axe-core/playwright, @lhci/cli, wrangler 4.157.0. Pin every dependency to an exact version in `package.json`.

**Spec:** `docs/superpowers/specs/2026-11-05-clafina-website-design.md`

## Global Constraints

- Branch `feat/website-foundation` from `docs/website-spec`. Commits as `Ebenezer Ugo <ugo.ebenezer@gmail.com>`, each ending with the `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and `Claude-Session:` trailers. No "Generated with Claude Code" line in commits.
- Locale codes, exactly and in this order: `en es pt fr ha yo ig pcm sw ar zh hi de id tr ja ru am zu tw`. `en` is the default and the master. `ar` is the only right-to-left locale.
- Only `out/` and `functions/` are deployed. `docs/` and `brand/` must never appear in `out/`.
- Colours, fonts, radius, spacing, shadow and motion are defined only in `src/theme/tokens.css`. The logo is drawn only in `src/brand/Logo.tsx`.
- Spacing and alignment use logical properties only (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`). No `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`, `text-right` in `src/` or `app/`.
- Copy voice: plain, warm, sentence case, no exclamation marks. Banned words: leverage, seamless, world-class, revolutionary, synergy, cutting-edge, best-in-class. The taglines "Business Operating System" and "Clarity in Every Operation" are never used.
- Build mode comes from `CLAFINA_BUILD` = `preview` (default) or `production`.
- The current static HTML pages at the repo root stay untouched in phase 1. They are not part of `out/`.
- Accessibility: WCAG 2.2 AA; axe must report zero violations on every page built in this phase.
- Phone Lighthouse budgets: performance ≥ 0.95, accessibility = 1, SEO = 1 (draft locales are expected to lose SEO points for noindex and are not budgeted).

## Review Focus

- An unknown language path (`/xx/`, `/en/does-not-exist/`) must show the 404 page, not a blank page or a build error. Test in Task 12.
- `Accept-Language` with regions and weights (`yo-NG,yo;q=0.9,en;q=0.5`, `zh-CN`, `pt-BR`, an empty header, a disabled locale first) must pick the right enabled language. Test in Task 6.
- A misspelt switch key (`isOn('claims.uptme')`) must fail the build, never silently read as off. Test in Task 3.
- Campaign values with spaces, quotes or `&` must survive the trip into sign-up links encoded, never breaking the URL. Test in Task 9.
- In Arabic, the header, mega menus and mobile menu must open from the right side and read right to left. Test in Task 12.

---

### Task 1: Scaffold the Next.js app

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`, `app/globals.css`, `app/[locale]/layout.tsx` (temporary), `app/[locale]/page.tsx` (temporary), `scripts/check-output.ts`, `test/scripts/check-output.test.ts`
- Modify: `.gitignore` (add `node_modules/`, `.next/`, `out/`, `test-results/`, `playwright-report/`, `.lighthouseci/`)

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `build:production`, `typecheck`, `lint`, `test`, `test:e2e`, `check:content`, `check:output`, `serve:out`. `checkOutput(dir: string): string[]` returns problems (empty = good).

- [ ] **Step 1: Write the failing test** `test/scripts/check-output.test.ts`

```ts
it('flags docs and brand folders in the output', () => {
  const dir = makeTempDir({ 'index.html': '', 'docs/CONTEXT.md': '', 'brand/README.md': '' });
  expect(checkOutput(dir)).toEqual(['out/ must not contain docs/', 'out/ must not contain brand/']);
});
it('passes a clean output', () => {
  expect(checkOutput(makeTempDir({ 'en/index.html': '' }))).toEqual([]);
});
it('flags a missing output folder', () => {
  expect(checkOutput('/nonexistent')).toEqual(['out/ does not exist: run the build first']);
});
```

- [ ] **Step 2: Run** `npx vitest run test/scripts/check-output.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement** the scaffold: `next.config.ts` with `output: 'export'`, `trailingSlash: true`, `images: { unoptimized: true }`, the next-intl plugin added in Task 5. `checkOutput` in `scripts/check-output.ts` (also flags any `*.md` file). Script `check:output` runs it on `out/` and exits 1 on problems. `build:production` = `CLAFINA_BUILD=production next build && npm run check:output`.
- [ ] **Step 4: Run** `npx vitest run` and `npm run build && npm run check:output`. Expected: tests PASS; `out/` holds `en/index.html`; no problems printed.
- [ ] **Step 5: Commit** `Scaffold the Next.js site with static export`.

### Task 2: Locales

**Files:**
- Create: `src/config/locales.ts`, `test/config/locales.test.ts`

**Interfaces:**
- Produces:
  - `type Locale = 'en'|'es'|'pt'|'fr'|'ha'|'yo'|'ig'|'pcm'|'sw'|'ar'|'zh'|'hi'|'de'|'id'|'tr'|'ja'|'ru'|'am'|'zu'|'tw'`
  - `interface LocaleInfo { code: Locale; endonym: string; englishName: string; hreflang: string; dir: 'ltr'|'rtl'; script: 'latin'|'cyrillic'|'arabic'|'han'|'japanese'|'devanagari'|'ethiopic'; status: 'draft'|'reviewed'; reviewer?: string; reviewedAt?: string }`
  - `LOCALES: readonly LocaleInfo[]`, `DEFAULT_LOCALE: 'en'`, `isLocale(x: string): x is Locale`, `localeInfo(code: Locale): LocaleInfo`

- [ ] **Step 1: Write the failing tests**

```ts
expect(LOCALES.map(l => l.code)).toEqual(['en','es','pt','fr','ha','yo','ig','pcm','sw','ar','zh','hi','de','id','tr','ja','ru','am','zu','tw']);
expect(LOCALES.filter(l => l.dir === 'rtl').map(l => l.code)).toEqual(['ar']);
expect(localeInfo('zh').hreflang).toBe('zh-Hans');
expect(localeInfo('en').status).toBe('reviewed');
expect(LOCALES.filter(l => l.code !== 'en').every(l => l.status === 'draft')).toBe(true);
expect(isLocale('yo')).toBe(true); expect(isLocale('xx')).toBe(false);
expect(localeInfo('am').script).toBe('ethiopic'); expect(localeInfo('ru').script).toBe('cyrillic');
```

- [ ] **Step 2: Run** `npx vitest run test/config/locales.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Endonyms: English, Español, Português, Français, Hausa, Yorùbá, Igbo, Naijá, Kiswahili, العربية, 中文（简体）, हिन्दी, Deutsch, Bahasa Indonesia, Türkçe, 日本語, Русский, አማርኛ, isiZulu, Twi. `hreflang` equals the code except `zh` → `zh-Hans`.
- [ ] **Step 4: Run** the tests. Expected: PASS.
- [ ] **Step 5: Commit** `Add the 20 locales`.

### Task 3: Routes registry and switches

**Files:**
- Create: `src/config/routes.ts`, `src/config/switches.ts`, `src/lib/build-mode.ts`, `test/config/routes.test.ts`, `test/config/switches.test.ts`

**Interfaces:**
- Consumes: `Locale`, `LOCALES` (Task 2).
- Produces:
  - `type BuildMode = 'preview'|'production'`; `buildMode(): BuildMode` reads `process.env.CLAFINA_BUILD`, default `preview`, throws on any other value.
  - `interface RouteDef { id: string; path: string; group: 'core'|'product'|'industry'|'solution'|'why'|'resource'|'partner'|'developer'|'trust'|'company'|'legal'; built: boolean }`; `ROUTES: readonly RouteDef[]` with every page in spec section 3 (ids in kebab case, e.g. `product-finance`, `industry-restaurant`; paths like `/product/finance/`, `/industries/restaurant/`, `/` for home). Only `home` has `built: true` in phase 1.
  - `interface Switch { on: boolean; note: string; sample?: boolean; value?: unknown; confirmedBy?: string; confirmedAt?: string }`
  - `SWITCHES` with groups `claims` (`livePayments`, `fiscalCertified`, `complianceLabels`, `uptime`, `metrics`), `prelaunch` (`features` plus one key per industry and product route id), `pages` (one key per route id), `sections` (empty object in phase 1, typed `Record<string, Switch>`), `languages` (one key per locale: `{ on, indexed }`), `countries` (`global`, `ng`, `latam`), `features` (`newsletter`, `demoBooking`, `chatWidget`, `countrySwitcher`, `smartAppBanner`, `deepLinks`).
  - `type SwitchKey` = the union of every `group.key` string; `isOn(key: SwitchKey, mode?: BuildMode): boolean`; `pageAvailable(id: string, mode?: BuildMode): boolean` = route `built` and `pages.<id>` on; `localeEnabled(code: Locale)`, `localeIndexed(code: Locale)` (indexed only if on, `indexed` true and status `reviewed`); `productionProblems(): string[]`.
- Claim values: `uptime.value = '99.9%'`, `metrics.value = { businesses: '1,000+', languages: 20 }`, `livePayments.value = ['Paystack', 'Flutterwave']`, all with `sample: true`.

- [ ] **Step 1: Write the failing tests**

```ts
// routes.test.ts
expect(ROUTES.filter(r => r.group === 'product')).toHaveLength(21);
expect(ROUTES.filter(r => r.group === 'industry')).toHaveLength(18); // index + 17
expect(new Set(ROUTES.map(r => r.path)).size).toBe(ROUTES.length);
expect(ROUTES.filter(r => r.built).map(r => r.id)).toEqual(['home']);
// switches.test.ts
expect(isOn('claims.uptime', 'preview')).toBe(true);
expect(() => isOn('claims.uptme' as SwitchKey)).toThrow('Unknown switch: claims.uptme');
expect(pageAvailable('product-finance', 'preview')).toBe(false); // not built yet
expect(pageAvailable('home', 'production')).toBe(true);
expect(localeIndexed('yo')).toBe(false); expect(localeIndexed('en')).toBe(true);
expect(productionProblems()).toContain('claims.uptime is on with a sample value');
expect(productionProblems()).toContain('claims.uptime is on without confirmedBy and confirmedAt');
// buildMode
process.env.CLAFINA_BUILD = 'staging'; expect(() => buildMode()).toThrow();
```

- [ ] **Step 2: Run** `npx vitest run test/config`. Expected: FAIL.
- [ ] **Step 3: Implement.** In `preview` every switch reads on, except that `pageAvailable` still requires `built`. In `production`, a switch reads its stored `on`. `productionProblems` lists, for each switch stored on: sample values, and missing `confirmedBy`/`confirmedAt` for the `claims` and `prelaunch` groups.
- [ ] **Step 4: Run** the tests. Expected: PASS.
- [ ] **Step 5: Commit** `Add the routes registry and site-wide switches`.

### Task 4: Settings file and the production guard

**Files:**
- Create: `src/config/site.ts`, `scripts/check-production.ts`, `test/config/site.test.ts`
- Modify: `package.json` (`build:production` runs `tsx scripts/check-production.ts` before `next build`)

**Interfaces:**
- Consumes: `SWITCHES`, `productionProblems` (Task 3).
- Produces:
  - `type Fact<T> = { value: T } | { placeholder: string }`; `fact<T>(f: Fact<T>): T | undefined`.
  - `SITE` with: `legalName`, `address`, `emails` (`hello`, `sales`, `support`, `privacy`, `security`, `press`), `appUrl`, `signupUrl`, `stores` (`appStore`, `googlePlay`, `tillDesktop`, `tillAndroid`), `ios` (`teamId`, `bundleId`), `android` (`packageName`, `sha256Fingerprints: string[]`), `socials` (`x`, `linkedin`, `instagram`, `facebook`, `youtube`, `tiktok`), `crmEndpoint`, `turnstileSiteKey`. Every value starts as `{ placeholder: '…what to put here…' }` except `appUrl` and `signupUrl`, which are `{ placeholder }` too, with `https://app.clafina.com/` used as the preview fallback by `fact` callers.
  - `settingsProblems(): string[]` lists every placeholder that production needs: always `legalName`, `address`, `emails.*`, `appUrl`, `signupUrl`; plus `stores`, `ios`, `android` when `features.deepLinks` is on; plus `crmEndpoint` and `turnstileSiteKey` when `features.demoBooking` or `features.newsletter` is on.
  - `scripts/check-production.ts` prints `productionProblems()` and `settingsProblems()` and exits 1 if either is non-empty.

- [ ] **Step 1: Write the failing tests**

```ts
expect(settingsProblems()).toContain('SITE.legalName is a placeholder');
expect(fact({ value: 'x' })).toBe('x'); expect(fact({ placeholder: 'y' })).toBeUndefined();
// with deepLinks stored off, store links are not required
expect(settingsProblems().some(p => p.startsWith('SITE.stores'))).toBe(false);
```

- [ ] **Step 2: Run** `npx vitest run test/config/site.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** as specified.
- [ ] **Step 4: Run** the tests, then `npm run build:production`. Expected: tests PASS; the production build stops with the list of placeholders and sample claims (this is correct until go-live).
- [ ] **Step 5: Commit** `Add the settings file and the production guard`.

### Task 5: Languages in the app (next-intl)

**Files:**
- Create: `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/i18n/messages.ts`, `messages/en.json`, `messages/<each other locale>.json` (each `{}`), `test/i18n/messages.test.ts`
- Modify: `next.config.ts` (next-intl plugin), `app/[locale]/layout.tsx`

**Interfaces:**
- Consumes: `LOCALES`, `localeEnabled` (Tasks 2–3).
- Produces: `loadMessages(locale: Locale): Promise<Messages>` deep-merges the locale file over `en.json`; `missingKeys(locale: Locale): string[]` lists dotted keys present in `en.json` and absent in the locale file. `generateStaticParams` in the layout returns every enabled locale. `messages/en.json` holds the interface strings for header, menus, footer, switchers, 404 and the language picker (keys `nav.*`, `footer.*`, `switcher.*`, `notFound.*`, `picker.*`).

- [ ] **Step 1: Write the failing tests**

```ts
const yo = await loadMessages('yo');
expect(yo.nav.product).toBe((await loadMessages('en')).nav.product); // falls back to English
expect(missingKeys('yo')).toContain('nav.product');
expect(missingKeys('en')).toEqual([]);
```

- [ ] **Step 2: Run** `npx vitest run test/i18n`. Expected: FAIL.
- [ ] **Step 3: Implement.** `app/[locale]/layout.tsx` calls `setRequestLocale`, sets `<html lang={locale} dir={localeInfo(locale).dir}>`, and calls `notFound()` for a locale that is not enabled.
- [ ] **Step 4: Run** the tests and `npm run build`. Expected: PASS; `out/` holds 20 language folders.
- [ ] **Step 5: Commit** `Route every page through 20 languages`.

### Task 6: The root address picks a language

**Files:**
- Create: `src/lib/negotiate.ts`, `functions/index.ts`, `app/page.tsx` (language picker), `test/lib/negotiate.test.ts`

**Interfaces:**
- Consumes: `LOCALES`, `localeEnabled`.
- Produces: `pickLocale(acceptLanguage: string | null, enabled: readonly Locale[]): Locale`. `functions/index.ts` (Cloudflare Pages Function on `/` only) answers `302` to `/<locale>/` and passes `?query` through. `app/page.tsx` renders a plain list of the enabled languages by endonym, each linking to `/<code>/`, with no JavaScript needed.

- [ ] **Step 1: Write the failing tests**

```ts
const all = LOCALES.map(l => l.code);
expect(pickLocale('yo-NG,yo;q=0.9,en;q=0.5', all)).toBe('yo');
expect(pickLocale('zh-CN,zh;q=0.9', all)).toBe('zh');
expect(pickLocale('pt-BR', all)).toBe('pt');
expect(pickLocale('fr;q=0.2,de;q=0.8', all)).toBe('de');
expect(pickLocale('', all)).toBe('en'); expect(pickLocale(null, all)).toBe('en');
expect(pickLocale('yo,fr', all.filter(c => c !== 'yo'))).toBe('fr');
expect(pickLocale('ak', all)).toBe('tw'); // Akan speakers get Twi
expect(pickLocale('*', all)).toBe('en');
```

- [ ] **Step 2: Run** `npx vitest run test/lib/negotiate.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `pickLocale`: parse tags and weights, sort by weight (stable), match the full tag, then the primary subtag; `zh-*` → `zh`; `ak`/`tw` → `tw`; first enabled match wins; else `en`.
- [ ] **Step 4: Run** the tests. Expected: PASS.
- [ ] **Step 5: Commit** `Send the root address to the visitor's language`.

### Task 7: Theme tokens, fonts and the logo slot

**Files:**
- Create: `src/theme/tokens.css`, `src/theme/fonts.ts`, `src/brand/Logo.tsx`, `test/theme/tokens.test.ts`, `scripts/check-logical-css.ts`, `test/scripts/check-logical-css.test.ts`
- Modify: `app/globals.css` (imports Tailwind and `tokens.css`; `@theme inline` maps tokens to Tailwind names), `app/[locale]/layout.tsx` (font classes)

**Interfaces:**
- Produces:
  - CSS custom properties on `:root`, redefined under `@media (prefers-color-scheme: dark)` and `[data-theme="dark"]`: `--color-page`, `--color-surface`, `--color-raised`, `--color-ink`, `--color-muted`, `--color-line`, `--color-primary`, `--color-on-primary`, `--color-accent`, `--color-good`, `--color-warn`, `--color-bad`, `--color-info` (each status with a `-fill` pair), `--font-display`, `--font-body`, `--font-script`, `--radius-sm|md|lg|xl`, `--shadow-sm|md|lg`, `--ease-out`, `--duration-fast|base|slow`.
  - Placeholder theme values: neutral ink-on-white with a slate-blue primary; contrast ≥ 4.5:1 for ink, muted and on-primary text in both themes.
  - `fontClassFor(locale: Locale): string` in `fonts.ts`: Inter (display and body, via `next/font/google`, subsets latin, latin-ext, cyrillic) for every locale, plus Noto Sans Arabic (`ar`), Noto Sans Devanagari (`hi`), Noto Sans Ethiopic (`am`), Noto Sans SC (`zh`), Noto Sans JP (`ja`), each `preload: false`, set as `--font-script`.
  - `<Logo variant="full"|"mark" />` renders the placeholder: the word "clafina" in the display font with `aria-label="Clafina"`. It is the only logo drawing in the code.
  - `checkLogicalCss(files: string[]): string[]` reports any physical-direction utility (`ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`, `text-right`, `rounded-l-`, `rounded-r-`, `border-l-`, `border-r-`) with file and line.

- [ ] **Step 1: Write the failing tests**

```ts
// tokens.test.ts: contrast of the placeholder palette, both themes
expect(contrast(tokens.light.ink, tokens.light.page)).toBeGreaterThanOrEqual(4.5);
expect(contrast(tokens.light.muted, tokens.light.page)).toBeGreaterThanOrEqual(4.5);
expect(contrast(tokens.light.onPrimary, tokens.light.primary)).toBeGreaterThanOrEqual(4.5);
expect(contrast(tokens.dark.ink, tokens.dark.page)).toBeGreaterThanOrEqual(4.5);
// check-logical-css.test.ts
expect(checkLogicalCss([fixture('<div class="ml-4 ps-2">')])).toEqual(['fixture.tsx:1 uses ml-4; use ms-4']);
```

(`tokens.test.ts` parses `tokens.css`; `contrast` is the WCAG relative-luminance ratio, written in the test helper.)

- [ ] **Step 2: Run** `npx vitest run test/theme test/scripts/check-logical-css.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** as specified; add `check:css` to `package.json` running `checkLogicalCss` over `app/` and `src/`.
- [ ] **Step 4: Run** the tests and `npm run check:css`. Expected: PASS, no findings.
- [ ] **Step 5: Commit** `Add the theme tokens, fonts per script and the logo slot`.

### Task 8: Content loading and the content checks

**Files:**
- Create: `src/content/schema.ts`, `src/content/load.ts`, `content/en/home.json`, `content/<each other locale>/` (empty folders kept with `.gitkeep`), `content/protected-terms.json`, `scripts/check-content.ts`, `test/content/load.test.ts`, `test/scripts/check-content.test.ts`, `test/fixtures/content/…`

**Interfaces:**
- Consumes: `Locale`, `LOCALES`, `SwitchKey`.
- Produces:
  - zod schemas: `HomeContent` (phase 1: `meta { title, description }`, `hero { eyebrow, title, lede, primaryCta, secondaryCta }`), plus the shared shapes later phases extend: `Claim = { text: string; claim?: SwitchKey; prelaunch?: string }`, `IllustrativeBusiness = { name: string; place: string; label: true }`.
  - `loadContent<T>(locale: Locale, id: string, schema: ZodType<T>): T` reads `content/<locale>/<id>.json`, falls back to English, validates, and throws with the file path on failure.
  - `checkContent(root: string): string[]` reports: schema failures; keys missing per locale; banned words (Global Constraints list, case-insensitive, whole words); any `!` in copy; the two dropped taglines; `%`, "certified" or "compliant" in any string not inside an object with a `claim` field; a story file (`kind: "industry-story"`) without an `illustrativeBusiness` with `label: true`.
  - `content/en/home.json` hero: eyebrow "One business platform", title "Run the whole business from one place.", lede "Books, stock, sales, people and your online shop on one record, with a till, a phone app and an assistant reading the same numbers.", primaryCta "Start free", secondaryCta "Book a demo".

- [ ] **Step 1: Write the failing tests**

```ts
expect(loadContent('yo', 'home', HomeContent).hero.title).toBe('Run the whole business from one place.');
expect(() => loadContent('en', 'broken', HomeContent)).toThrow('content/en/broken.json');
const problems = checkContent('test/fixtures/content');
expect(problems).toContain('en/bad.json hero.title uses banned word "seamless"');
expect(problems).toContain('en/bad.json hero.lede has an exclamation mark');
expect(problems).toContain('en/bad.json features[0].text says "99.9%" outside a claim');
expect(problems).toContain('en/story.json has no labelled illustrative business');
expect(checkContent('content')).toEqual([]);
```

- [ ] **Step 2: Run** `npx vitest run test/content test/scripts/check-content.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement**; `check:content` runs `checkContent('content')` and exits 1 on problems. Missing translations are reported as warnings in preview and errors in production only for locales that `localeIndexed` returns true for.
- [ ] **Step 4: Run** the tests and `npm run check:content`. Expected: PASS, no problems.
- [ ] **Step 5: Commit** `Add content loading and the content checks`.

### Task 9: Links builder and app deep-link files

**Files:**
- Create: `src/lib/links.ts`, `src/lib/campaign.ts`, `scripts/generate-well-known.ts`, `test/lib/links.test.ts`, `test/scripts/generate-well-known.test.ts`
- Modify: `package.json` (`prebuild` runs the generator)

**Interfaces:**
- Consumes: `SITE`, `fact`, `isOn`, `Locale`.
- Produces:
  - `type Campaign = Partial<Record<'utm_source'|'utm_medium'|'utm_campaign'|'utm_term'|'utm_content'|'ref', string>>`
  - `campaignFrom(search: string): Campaign` keeps only those keys, trims, caps each value at 100 characters.
  - `signupUrl(o: { locale: Locale; pack?: string; plan?: string; country?: 'global'|'ng'|'latam'; campaign?: Campaign }): string` uses `SITE.signupUrl` (preview fallback `https://app.clafina.com/signup`), parameters in the order `pack, plan, lang, country, ...campaign`, built with `URLSearchParams`.
  - `appUrl(path: string): string`; `openInAppUrl(path: string): string` returns `https://clafina.com/open<path>`.
  - `wellKnownFiles(): Record<string, string> | null` returns `apple-app-site-association` and `assetlinks.json` JSON from `SITE.ios` and `SITE.android` when `features.deepLinks` is on and the values are set, else `null`. The generator writes them to `public/.well-known/` or removes them.

- [ ] **Step 1: Write the failing tests**

```ts
expect(signupUrl({ locale: 'yo', pack: 'restaurant', plan: 'growth', country: 'ng', campaign: { utm_source: 'x y', utm_campaign: 'a&b"c' } }))
  .toBe('https://app.clafina.com/signup?pack=restaurant&plan=growth&lang=yo&country=ng&utm_source=x+y&utm_campaign=a%26b%22c');
expect(campaignFrom('?utm_source=g&foo=bar&ref=abc')).toEqual({ utm_source: 'g', ref: 'abc' });
expect(campaignFrom('?utm_source=' + 'a'.repeat(300)).utm_source).toHaveLength(100);
expect(openInAppUrl('/restaurant/floor')).toBe('https://clafina.com/open/restaurant/floor');
expect(wellKnownFiles()).toBeNull(); // values are placeholders
expect(JSON.parse(wellKnownFilesWith(sampleIds)['apple-app-site-association']).applinks.details[0].appIDs).toEqual(['TEAM.com.clafina.app']);
```

(`wellKnownFilesWith(ids)` is the pure function `wellKnownFiles` calls with the values from `SITE`.)

- [ ] **Step 2: Run** `npx vitest run test/lib/links.test.ts test/scripts/generate-well-known.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** as specified. Universal Links paths: `/open/*`.
- [ ] **Step 4: Run** the tests. Expected: PASS.
- [ ] **Step 5: Commit** `Add the links builder and app deep-link files`.

### Task 10: Header, mega menus and switchers

**Files:**
- Create: `src/config/nav.ts`, `src/components/header/Header.tsx`, `src/components/header/MegaMenu.tsx`, `src/components/header/MobileMenu.tsx`, `src/components/switchers/LanguageSwitcher.tsx`, `src/components/switchers/CountrySwitcher.tsx`, `src/components/SkipLink.tsx`, `test/config/nav.test.ts`
- Modify: `app/[locale]/layout.tsx`, `messages/en.json`

**Interfaces:**
- Consumes: `ROUTES`, `pageAvailable`, `isOn`, `LOCALES`, `localeEnabled`, `signupUrl`, `Logo`.
- Produces:
  - `NAV`: menus `product` (groups Money, Selling, Operations, People, Everywhere, as in spec section 3), `industries`, `solutions` (By size, By role), `resources`; direct links `pricing`. Each item is a route id.
  - `visibleNav(mode?: BuildMode)` returns `NAV` with unavailable items removed and empty groups and menus dropped.
  - Header: logo, menus, Pricing, Sign in (`appUrl('/')`), Start free (`signupUrl`). Menus open on click and on keyboard (Enter/Space), close on Escape and outside click, and return focus to their button. Mobile menu below 1024 px: one `aria-expanded` toggle, focus trapped while open.
  - `LanguageSwitcher` lists enabled locales by endonym and links to the same path in the other locale. `CountrySwitcher` (behind `features.countrySwitcher`) stores `global|ng|latam` in `localStorage` key `clafina.country` and dispatches a `clafina:country` event.

- [ ] **Step 1: Write the failing test**

```ts
const nav = visibleNav('preview');
expect(nav.menus.map(m => m.id)).toEqual([]); // phase 1: only home is built
expect(navItemIds(NAV.menus.find(m => m.id === 'product')!)).toHaveLength(21);
```

- [ ] **Step 2: Run** `npx vitest run test/config/nav.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the config and components. Use logical properties only.
- [ ] **Step 4: Run** the test, `npm run check:css`, `npm run build`. Expected: PASS; build succeeds.
- [ ] **Step 5: Commit** `Add the header, mega menus and switchers`.

### Task 11: Footer

**Files:**
- Create: `src/components/footer/Footer.tsx`, `src/components/footer/footer-model.ts`, `test/components/footer-model.test.ts`
- Modify: `app/[locale]/layout.tsx`, `messages/en.json`

**Interfaces:**
- Consumes: `ROUTES`, `pageAvailable`, `isOn`, `SITE`, `fact`, `LanguageSwitcher`, `CountrySwitcher`.
- Produces: `footerModel(mode?: BuildMode)` returning `{ top: { newsletter: boolean; appBadges: { appStore?: string; googlePlay?: string } }, columns: { id: 'product'|'industries'|'solutions'|'resources'|'partners'|'developers'|'company'|'trust'|'legal'; items: string[] }[], bottom: { socials: { name: string; url: string }[]; legalName?: string; address?: string; year: number } }`. Unavailable pages are removed; empty columns are dropped; socials and badges appear only when their `SITE` values are set; the newsletter slot only when `features.newsletter` is on and phase 2's form exists (`false` in phase 1). The column order is the nine above.

- [ ] **Step 1: Write the failing test**

```ts
const all = footerModelFor(allBuiltRoutes, 'preview'); // helper marks every route built
expect(all.columns.map(c => c.id)).toEqual(['product','industries','solutions','resources','partners','developers','company','trust','legal']);
expect(footerModel('preview').columns).toEqual([]); // phase 1
expect(footerModel('preview').bottom.socials).toEqual([]); // placeholders
```

- [ ] **Step 2: Run** `npx vitest run test/components/footer-model.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `footerModel` (with `footerModelFor(routes, mode)` as its pure core) and the component: top band (switchers, badges), columns, bottom band (socials, company lines, "© {year} Clafina").
- [ ] **Step 4: Run** the test and `npm run build`. Expected: PASS.
- [ ] **Step 5: Commit** `Add the nine-column footer`.

### Task 12: Home page, 404, SEO basics and the end-to-end suite

**Files:**
- Create: `app/[locale]/page.tsx` (replace the temporary one), `app/[locale]/not-found.tsx`, `app/not-found.tsx`, `src/lib/seo.ts`, `scripts/generate-sitemaps.ts`, `scripts/serve-out.mjs`, `playwright.config.ts`, `e2e/home.spec.ts`, `e2e/rtl.spec.ts`, `e2e/a11y.spec.ts`, `e2e/not-found.spec.ts`, `test/lib/seo.test.ts`
- Modify: `package.json` (`postbuild` runs the sitemap generator)

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `alternates(path: string): { canonical: string; languages: Record<string, string> }` with every enabled locale by `hreflang` plus `x-default` → the `en` URL; base `https://clafina.com`.
  - `robotsFor(locale: Locale): { index: boolean; follow: true }` from `localeIndexed`.
  - The sitemap generator writes `out/sitemap-<locale>.xml` for each indexed locale (available pages only), `out/sitemap.xml` (index) and `out/robots.txt` pointing at it.
  - Home renders the hero from `content/<locale>/home.json`. JSON-LD `Organization` uses `SITE` values only when set.

- [ ] **Step 1: Write the failing tests**

```ts
// seo.test.ts
expect(alternates('/').languages['x-default']).toBe('https://clafina.com/en/');
expect(alternates('/').languages['zh-Hans']).toBe('https://clafina.com/zh/');
expect(robotsFor('yo').index).toBe(false); expect(robotsFor('en').index).toBe(true);
```

```ts
// e2e (Playwright, against scripts/serve-out.mjs on port 4311)
test('home renders in English', async ({ page }) => { await page.goto('/en/'); await expect(page.getByRole('heading', { level: 1 })).toHaveText('Run the whole business from one place.'); });
test('Arabic is right to left', async ({ page }) => { await page.goto('/ar/'); await expect(page.locator('html')).toHaveAttribute('dir', 'rtl'); });
test('mobile menu opens from the start side in Arabic', async ({ page }) => { /* 390px viewport, open toggle, panel's right edge = viewport right edge */ });
test('language switcher keeps the page', async ({ page }) => { await page.goto('/en/'); /* choose Français */ await expect(page).toHaveURL(/\/fr\/$/); });
test('draft languages are noindex', async ({ page }) => { await page.goto('/yo/'); await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/); });
test('unknown paths show the 404 page', async ({ page }) => { const r = await page.goto('/xx/'); expect(r?.status()).toBe(404); await expect(page.getByRole('heading', { level: 1 })).toBeVisible(); });
test('no axe violations', async ({ page }) => { for (const l of ['en','ar','ja']) { await page.goto(`/${l}/`); expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]); } });
test('Escape closes the mobile menu and returns focus', async ({ page }) => { /* open, press Escape, menu hidden, toggle focused */ });
test('home looks the same', async ({ page }) => { for (const l of ['en','ar']) { await page.goto(`/${l}/`); await expect(page).toHaveScreenshot(`home-${l}.png`, { fullPage: true }); } });
```

- [ ] **Step 2: Run** `npx vitest run test/lib/seo.test.ts` and `npm run build && npx playwright test`. Expected: FAIL.
- [ ] **Step 3: Implement.** `serve-out.mjs` serves `out/` with `404.html` for misses and a 404 status. Playwright `webServer` starts it; `launchOptions.executablePath` is unset (the pinned version uses the preinstalled browser).
- [ ] **Step 4: Run** the same commands. Expected: all PASS.
- [ ] **Step 5: Commit** `Add the home page, 404, SEO basics and the end-to-end suite`.

### Task 13: Deploy config, CI and Lighthouse budgets

**Files:**
- Create: `public/_headers`, `public/_redirects`, `wrangler.toml`, `lighthouserc.json`, `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `scripts/check-links.ts`, `test/scripts/check-links.test.ts`
- Modify: `README.md` (new stack, scripts, switches, settings, deploy, and the rule that `docs/` and `brand/` never deploy)

**Interfaces:**
- Consumes: `checkOutput`, `checkContent`, `checkLogicalCss`, the production guard.
- Produces:
  - `checkLinks(outDir: string): string[]` reports every internal `href` in `out/**/*.html` that does not resolve to a file in `out/`.
  - `_headers`: `Content-Security-Policy` (`default-src 'self'`; `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com`; `frame-src https://challenges.cloudflare.com`; `connect-src 'self' https://cloudflareinsights.com`; `img-src 'self' data:`; `style-src 'self' 'unsafe-inline'`; `font-src 'self'`), `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `frame-ancestors 'none'` in the CSP.
  - `_redirects`: `/index.html /en/ 301`, `/features.html /en/platform/ 301`, `/industries.html /en/industries/ 301`, `/pricing.html /en/pricing/ 301`, `/contact.html /en/contact/ 301`, `/legal.html /en/legal/privacy/ 301`.
  - `ci.yml` on every PR: `npm ci`, `typecheck`, `lint`, `test`, `check:css`, `check:content`, `build`, `check:output`, `check:links`, Playwright (with axe), Lighthouse CI on `/en/` and `/ar/` at phone settings with the budgets in Global Constraints.
  - `deploy.yml`: on PR, after CI, `wrangler pages deploy out --branch <branch>` (preview, `CLAFINA_BUILD=preview`); on push to `main`, a production build and deploy that runs only when the repository variable `CLAFINA_PRODUCTION_ENABLED` is `true`. Secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; project name `clafina-site`.

- [ ] **Step 1: Write the failing test**

```ts
expect(checkLinks(makeTempDir({ 'en/index.html': '<a href="/en/pricing/">x</a><a href="/en/">y</a>' })))
  .toEqual(['en/index.html links to /en/pricing/, which does not exist']);
```

- [ ] **Step 2: Run** `npx vitest run test/scripts/check-links.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `checkLinks` and the config files above.
- [ ] **Step 4: Run** the full local CI sequence: `npm run typecheck && npm run lint && npm test && npm run check:css && npm run check:content && npm run build && npm run check:output && npm run check:links && npx playwright test && npx lhci autorun`. Expected: every step passes; Lighthouse meets the budgets.
- [ ] **Step 5: Commit** `Add deploy config, CI and Lighthouse budgets`, push the branch, and open the PR (title "Website foundation: Next.js, 20 languages, switches"; body summarises the phase and links the spec and this plan; ends with the PR attribution lines).
