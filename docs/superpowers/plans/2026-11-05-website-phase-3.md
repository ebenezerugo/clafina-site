# Clafina website, phase 3 (industries: index and 17 stories) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One story page per industry, told in the trade's own words through a day at an illustrative business, plus an industries index. Every page is written only from `docs/industry-facts.md`.

**Architecture:** Same pattern as the product pages.
- A story is one content file, `content/<locale>/industries/<slug>.json`, of `kind: "industry-story"`.
- One template at `app/[locale]/industries/[slug]/page.tsx` renders it.
- Each moment carries a screen spec (phase 2b `ScreenSpec`), drawn small beside the moment.
- The index at `app/[locale]/industries/page.tsx` lists the built stories, grouped.

**Tech Stack:** as phase 2a.

**Spec:** `docs/superpowers/specs/2026-11-05-clafina-website-design.md`, sections 5 and 8, and Appendix A. Facts: `docs/industry-facts.md`. Boards: the ERP mockup canvas (erp4c-rest-*, erp4e-*, erp4f-*, till-*, studio-*).

## Global Constraints

- All phase 1, 2a and 2b Global Constraints hold.
- **The illustrative business:**
  - It has a fictional name and a place, and `label: true`.
  - The page shows "Illustrative example" next to the day and on every screen.
  - No real brands or people.
- **Pre-launch items:** every Appendix A item is a moment, feature or answer with `prelaunch: "<route id>"`. When it is switched off, it disappears and the day still reads in order.
- **Pack status:** retail and manufacturing are core, not packs. Their page says "built in" rather than "switch on the pack".
- **Never name:**
  - payment providers, tax authorities, OTA channels, insurers, or SMS, WhatsApp and email vendors, unless inside a `claim`;
  - "compliant" or "certified";
  - a kiosk.

## Review Focus

- A story without a labelled business, or with fewer than 6 or more than 8 moments, fails the content check (Task 1).
- A moment whose `prelaunch` area is off disappears, and the times stay in order (Task 1).
- `related` and `modules` naming an unbuilt route render as plain text, not links (Task 1).
- The index shows only built stories and puts Retail and Manufacturing under "Built in" (Task 1).
- The longest story stays within the phone Lighthouse budget (Task 1).

---

### Task 0: Industry facts

**Files:** Create `docs/industry-facts.md` (17 briefs, the product-facts format, every line sourced).

- [ ] Write a brief for each industry: trade words, a day of 6–8 moments, built, pre-launch, pack switches on, shares with the core, avoid, boards.
- [ ] **Commit** `Add the industry facts`.

### Task 1: Story template, the index and Retail

**Files:**
- Create:
  - `src/content/industry.ts`
  - `app/[locale]/industries/[slug]/page.tsx`
  - `app/[locale]/industries/page.tsx`
  - `content/en/industries.json` (index copy)
  - `content/en/industries/retail.json` and its screens
  - `e2e/industry.spec.ts`
  - `test/content/industry.test.ts`
- Modify:
  - `scripts/check-content.ts`: validate `kind: "industry-story"` with `IndustryStory`
  - `src/config/routes.ts`: mark `industries` and `industry-retail` built

**Interfaces:**
- `IndustryStory` (zod, strict):
  - `kind: 'industry-story'`, `sources`, `meta`, `illustrative: 'Illustrative example'`.
  - `core: boolean`, which is true for retail and manufacturing.
  - `hero { eyebrow, title, lede, screen }`.
  - `business { name, place, label: true, about }`.
  - `dayTitle`.
  - `moments` (6–8): each is `{ time: 'HH:MM', title, problem, handles, surface, screen?, prelaunch? }`.
  - `wordsTitle`, `words: { word, meaning }[]`.
  - `switchesTitle`, `switchesOn: Claim[]`.
  - `sharesTitle`, `shares: { route, text }[]`.
  - `modulesTitle`, `modules: RouteId[]`.
  - `faqTitle`, `faq: { q, a, prelaunch? }[]`.
  - `relatedTitle`, `related: RouteId[]`.
  - `cta { title, body }`.
- `IndustriesIndex`:
  - `meta`, `hero`;
  - `groups: { title, body, items: RouteId[] }[]`, with "Built in", "Hospitality and bookings", "Members and learning", "Property and projects", "Goods on the move" and "Making and growing";
  - `cta`.
- Each index card shows the story's own `hero.eyebrow` and `meta.description`.

- [ ] **Step 1: Write the failing tests.**
  - Unit tests: a valid story parses; a story with an unlabelled business, 5 moments, an unsorted time, or an unknown surface each fail, with the path in the message.
  - e2e tests for `/en/industries/retail/`:
    - one `h1`;
    - sections `day`, `words`, `switches`, `shares`, `modules`, `faq`, `related`, in order;
    - the day shows "Illustrative example" and the business name;
    - every `[data-screen]` is labelled;
    - unbuilt routes are not links;
    - FAQ JSON-LD is present;
    - axe is clean;
    - no sideways scroll at 390 px.
  - e2e tests for the index: it lists every built story and nothing unbuilt.
- [ ] **Step 2: Run** the tests. Expected: FAIL.
- [ ] **Step 3: Implement** the schema, the check, the template, the index and the Retail content and screens.
- [ ] **Step 4: Run** unit, build, e2e, link check and Lighthouse on `/en/industries/retail/`. Expected: PASS.
- [ ] **Step 5: Commit** `Add the industry story template, the index and Retail`.

### Tasks 2–5: The other 16 stories, in groups (parallel, one agent per group)

Each agent writes only its own content and screen files, and adds its routes to the e2e loop list.

| Task | Stories |
|---|---|
| 2 | Restaurant, Accommodation, Events and ticketing, Rentals |
| 3 | Memberships, Classes, Courses, Clinics and salons (client records) |
| 4 | Property, Construction, Field service, Fundraising |
| 5 | Distribution, Farm, Manufacturing, Product configurator |

- [ ] **Per story:**
  - **Write** the content from its brief.
  - **Port** 3–5 screens from the boards the brief lists.
  - **Mark** the route built.
  - **Run** the content check, build, e2e loop and link check. Expected: PASS.
  - **Commit** `Add the <name> story`.

### Task 6: Join up

- [ ] Product pages' `industries` chips and the home industries carousel now link to the built stories. This needs no code change: the links appear once the routes are built. Confirm it with the link check.
- [ ] Add the Industries mega menu entries if any are missing (`src/config/nav.ts`).
- [ ] Run the full suite, then open the PR.
