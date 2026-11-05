# Clafina public website: design

Status: approved in conversation, 5 November 2026. Written for review before the implementation plan.
Owner: Ebenezer Ugo. Internal document: `docs/` is never deployed.

## 1. Goal and success

Market Clafina to the businesses it serves, globally and in 20 languages, with a site that holds up next
to the category leaders (Stripe, Shopify, HubSpot, Xero, Zoho, Odoo, NetSuite). Each industry gets a
story told in its own trade's words: a day in the life, how Clafina handles each moment, and which
parts of Clafina are used.

Success means:

- About 85 pages, each in 20 languages (roughly 1,700 built pages), complete and consistent.
- Every claim traceable to a product doc, or behind a switch that is off in production until confirmed.
- Phone Lighthouse: performance ≥ 95, accessibility 100, SEO 100. WCAG 2.2 AA on every template.
- The brand (logo, colours, type) can be swapped in one place once the owner chooses it.
- A CMS can be added later without rewriting pages.

## 2. Decisions taken

| Topic | Decision |
|---|---|
| Name | Clafina = Clarity + Finance, carrying Rivora's "river of solutions with an aura". |
| Taglines | "Business Operating System" and "Clarity in Every Operation" are **not** used. |
| Brand | Undecided. The owner is choosing between the three directions in the Clafina Logo Directions artifact and other proposals. The site ships with a neutral placeholder theme; the chosen brand replaces `src/theme/tokens.css` and `src/brand/Logo.tsx` only. |
| Stack | Next.js (current stable, App Router), TypeScript, React, Tailwind v4, next-intl, MDX for long form. |
| Hosting | Static export (`next build` → `out/`) on Cloudflare Pages, plus Pages Functions for forms. |
| CMS | Later. Content is structured so a headless CMS can replace the content files and the switch file. |
| Languages | 20 at launch, all drafted; each stays a noindexed draft until a native speaker marks it reviewed. |
| Packs | Every pack and module has working screens and mobile apps (owner, 5 Nov). Every item the pack docs list as "Not yet" (Appendix A) will be built before the application goes live (owner, 5 Nov), so the site presents them as features. Each is tagged `prelaunch` and shown through the `prelaunchFeatures` switch (section 9). |
| Switches | One switch system for the whole site: claims, pages, sections, languages, countries, features. |
| Facts | Checkable facts (legal entity, address, emails, sign-in URL, store links, app IDs, socials, prices, partner terms, job openings) live in the settings file; everything else is written in full. |

## 3. Site map

**Core:** Home · Platform overview · Pricing · Compare plans · Book a demo · Contact sales · Start free
(hand-off to app sign-up) · Download the apps

**Product (21):**
- Money: Finance & accounting · Payments & wallets · Tax engine · Business health & reports
- Selling: Sales & invoicing · Customers & CRM · Point of sale (till) · Online shop & Storefront Studio · Trading network
- Operations: Stock & warehouses · Purchasing · Manufacturing · Bookings · Projects · Assets & maintenance
- People: HR & payroll · Communication (inbox, team chat, Meet)
- Everywhere: Mobile app · AI assistant · Document capture · Integrations & API

**Industries (18):** index, plus Retail · Restaurant · Accommodation · Events & ticketing · Memberships &
gyms · Classes & studios · Courses & training · Clinics & salons (client records) · Property ·
Construction · Field service · Rentals · Distribution · Farm · Manufacturing · Fundraising & charities ·
Product configurator

**Solutions by size:** Small business · Growing business · Enterprise · Multi-branch & franchise

**Solutions by role:** Owners · Finance teams & accountants · Operations & stock · Sales & customer teams · HR & people

**Why Clafina:** One record · Switching to Clafina · Works offline · 20 languages and many currencies

**Resources:** Guides · Free templates (invoice, quotation, receipt) · Glossary · Help centre entry ·
What's new

**Partners:** Accountants & bookkeepers · Implementation partners · Become a partner

**Developers:** API overview · Webhooks · Developer sign-up

**Trust centre:** Security · Privacy & data protection · Reliability · Accessibility statement

**Company:** About · Careers · Press & brand assets · Contact

**Legal:** Privacy · Terms · Cookies · Acceptable use · Data processing terms

**System:** 404, root language picker, sitemaps, robots.txt, `.well-known` files.

## 4. Architecture

```
clafina-site/
├── app/[locale]/…          every page, under its language (/en/pricing, /yo/pricing)
├── content/en/…            page copy in English, the master
├── content/<locale>/…      the same files per language
├── messages/<locale>.json  interface strings (menus, buttons, footer labels)
├── src/components/         header, mega menus, footer, sections, story timeline, screen frame
├── src/screens/            product screens ported from the mockup canvases (section 7)
├── src/theme/tokens.css    the only colour, type, spacing, radius, shadow and motion definitions
├── src/brand/Logo.tsx      the only place the logo is drawn
├── src/config/site.ts      settings: company, links, emails, stores, app IDs, socials, prices
├── src/config/switches.ts  every switch (section 9)
├── src/config/locales.ts   the 20 languages: name, script, direction, fonts, status
├── src/lib/links.ts        the one builder for app, sign-up and deep links
├── functions/api/lead.ts   Cloudflare Pages Function for forms
├── public/                 images, icons, social images
├── brand/                  brand source files (never deployed)
└── docs/                   internal docs (never deployed)
```

- Only `out/` and `functions/` are uploaded. `docs/` and `brand/` cannot reach production.
- The current static HTML pages stay live until phase 2 replaces them; `_redirects` maps the old
  `.html` addresses to the new routes.
- `clafina.com/` routes to the visitor's best language through Cloudflare rules; without JavaScript
  it shows a plain language picker.
- Arabic is right to left. All spacing uses logical properties (`ms-`, `me-`, `ps-`, `pe-`), so the
  layout mirrors without separate styles.
- Fonts are self-hosted; each language loads only its own scripts.
- Country (Global, Nigeria, Latin America) is chosen separately from language and changes currency
  and prices only; a country segment can be added to URLs later if editions need their own pages.

## 5. Content and languages

- Every page type has a typed schema (zod). Missing fields, or a translation missing a key the
  English file has, fail the build.
- Industry story schema: `slug`, `tradeWords[]`, `hero`, `illustrativeBusiness` (fictional name,
  place fitting the locale), `moments[]` (6–8: `time`, `problem`, `howClafinaHandles`, `surface`,
  `screen`), `packSwitchesOn[]`, `sharedCore[]`, `comingNext[]`, `faq[]`, `related[]`, `sources[]`.
- Product page schema: `hero`, `jobs[3]`, `screenTour[]`, `features[]`, `connectsTo[]`, `surfaces[]`,
  `industries[]`, `comingNext[]`, `faq[]`, `sources[]`.
- Any feature, moment or FAQ answer that depends on an Appendix A item carries `prelaunch: true`.
  It reads as a normal feature; the tag only ties it to the `prelaunchFeatures` switch.
  `comingNext[]` is kept for anything announced after launch and is empty at launch.
- `sources[]` lists the product docs a page was written from; it is never rendered.
- English is the master. A build report lists keys missing or stale in each language.
- Each language has `status: draft | reviewed`, a reviewer and a date. Drafts are published, noindexed
  and absent from sitemaps; no visible banner.
- Locale codes: `en es pt fr ha yo ig pcm sw ar zh hi de id tr ja ru am zu tw` (`zh` = Simplified).
- URL slugs stay English in every language. The language switcher keeps the current page.
- Numbers, dates, currencies and plurals use `Intl` and ICU rules per locale.
- A protected-terms file lists names never translated (Clafina, Storefront Studio, Meet …) and the
  approved translation of key business terms per language.

## 6. Design system

- **Tokens:** colour roles (page, surface, ink, muted, line, primary, on-primary, accent, good, warn,
  bad, info), type scale, spacing, radius, shadow, motion; light and dark themes. Tailwind reads
  every value from `tokens.css`.
- **Type:** one brand face for Latin and Cyrillic, chosen from the faces verified to cover every
  letter needed (Yoruba and Igbo ẹ ọ ṣ ị ụ ṅ, Hausa ɓ ɗ ƙ ƴ, Turkish, Cyrillic, ₦ ₵): Inter, Inter
  Tight, Unbounded, Montserrat, Merriweather, Noto Serif Display, EB Garamond. Noto Sans Arabic,
  Devanagari, Ethiopic, SC and JP for the other scripts. Tabular figures for all money.
- **Components:** header with mega menus (Product, Industries, Solutions, Resources), nine-column
  footer, breadcrumbs, language and country switcher, hero variants, feature grids, story timeline,
  surface chips, screen frame, "Coming next" list, FAQ accordion, CTA band, comparison table, pricing
  cards with currency, the "Illustrative example" label.
- **Footer:** a top band (newsletter, app download badges, language and country switcher); columns
  Product, Industries, Solutions, Resources, Partners, Developers, Company, Trust, Legal; a bottom
  band (socials, company and address lines, currency note, copyright).
- **Motion:** sections settle in; screens animate numbers and rows; menus open smoothly; all off
  under `prefers-reduced-motion`. Content is visible at rest.
- **Imagery:** product screens and abstract illustration only. No people presented as customers, no
  invented logos, no testimonials.

## 7. Product screens

Product screens are ported from the owner's mockup canvases into `src/screens/` as React components,
keeping their layouts, fields and wording, with illustrative data, translated with the page and
animated where useful. They keep the product's neutral look; the site's brand frames them.

| Source canvas | Boards | Coverage |
|---|---|---|
| ERP mockups (https://claude.ai/artifact/TmcWJPQNomJrie41yzyCn3) | 321 | Every module and every industry pack |
| Mobile app mockups (https://claude.ai/artifact/HvT8EZGgCsYcurmv5ruSCr) | 180 | Phone shell, records offline, modules, packs, Meet, tablet |
| Till redesign mockups (https://claude.ai/artifact/YTGpjdxMxCxy21V9iR6q8h) | 34 | Food and retail selling, payment, floor, kitchen, trade counter, phone and tablet |
| Storefront Studio mockups (https://claude.ai/artifact/7c8esRrzbaRMJK2W6BHhet) | 16 | Studio workspace; restaurant, wholesale, electronics and hotel shops |

The web app (`ebenezerugo/commerce-web`, Angular) and its `docs/screen-kit.md` are the reference for
exact behaviour where a mockup is ambiguous.

## 8. Page templates

- **Home:** hero with a montage of real screens; "one record" in motion (a till sale moves stock,
  posts to the books, appears on the owner's phone); surfaces; modules by group; industries
  carousel; works where you work (languages, currencies, offline); trust; pricing teaser; CTA.
- **Product (×21):** hero; three jobs; screen tour with callouts; features; connections to other
  modules; surfaces; industries; coming next; FAQ; CTA.
- **Industry story (×17):** hero in the trade's words; "A day at …" with an illustrative business,
  labelled, 6–8 timed moments (problem, how Clafina handles it, surface, small screen); the pack's
  words; what the pack switches on; what it shares with the core; coming next; FAQ; related; CTA.
- **Solutions (×9):** pains; short illustrative story; modules; recommended plan; CTA.
- **Why Clafina (×4):** long-form explainers with diagrams.
- **Resources:** guides (table of contents), templates (preview, how to use, download), glossary
  terms, help centre entry, what's new.
- **Pricing:** plans from `site.ts` in the visitor's currency; comparison table; add-ons; FAQ.
- **Long form** (Partners, Developers, Trust, Company, Legal): side table of contents, last updated,
  contact routes.

## 9. Switches

`src/config/switches.ts` (moving into the CMS later) holds every switch with a default, a note on what
it controls and a production rule where one applies.

- **Pre-launch features:** `prelaunchFeatures` (on), with one sub-switch per industry and product
  area, so any item not ready at go-live can be hidden on its own. Production needs `confirmedBy`
  and a date, the same as the claim switches.
- **Claims:** `livePayments`, `fiscalCertified`, `complianceLabels`, `uptime`, `metrics`. Content that
  makes one of these claims is tagged with its switch and disappears cleanly when it is off. Each
  claim's value lives beside its switch; until supplied it is a sample marked `sample: true`.
- **Pages:** any page. Off removes it from menus, footer, sitemaps and internal links.
- **Sections:** any block on any page.
- **Languages:** on/off and indexed/not, per language.
- **Countries:** Global, Nigeria, Latin America.
- **Features:** newsletter, demo booking, chat widget, country switcher, smart app banner, deep links.

Preview builds turn everything on. A production build fails when a switch is on while its value is a
sample, or without a `confirmedBy` name and date.

## 10. Writing and claims rules

- Voice: plain, warm, short sentences, sentence case, no exclamation marks, no jargon. One claim, then
  proof (a screen, a fact, a named feature).
- Built features may be claimed. Appendix A items are claimed as features, tagged `prelaunch`.
  Anything else not yet built appears only under "Coming next", without dates.
- Claims in section 9 appear only through their switches.
- Every invented business carries the "Illustrative example" label and a clearly fictional name; no
  real brands; screen numbers are illustrative.
- Build checks: banned words, the label on every story page, no percentages or
  "certified/compliant" wording outside switched content, every required `site.ts` value set for
  production.
- Translations carry regional detail (currency, places, names) without stereotypes.

## 11. Forms, search, analytics, deep links, deploy

- **Forms:** Book a demo (multi-step: business, industry preselecting the pack, team size, slot
  request), Contact sales, Newsletter, Become a partner. They post to `functions/api/lead.ts`:
  Turnstile, server validation, forwarding to one configurable target (Clafina's CRM endpoint, a
  webhook meanwhile). With no target set, nothing is stored and the form says it is not connected.
- **Search:** per-language titles and descriptions, `hreflang` with `x-default`, canonical URLs, Open
  Graph and Twitter cards; JSON-LD `Organization`, `SoftwareApplication` with offers, `FAQPage`,
  `BreadcrumbList`, `HowTo`, `DefinedTerm`; one sitemap per language; `robots.txt`.
- **Analytics:** Cloudflare Web Analytics (no cookies) and named events. Any marketing pixel sits
  behind a switch and a consent banner.
- **Deep links:**
  - Every Start free and Book a demo link is built by `src/lib/links.ts` and carries pack, plan,
    language, country and UTM/referral parameters into app sign-up.
  - `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json`, generated from
    `site.ts` (app IDs, team ID, signing fingerprints), so `clafina.com/open/…` links open the phone
    app when installed, else the web app.
  - Download page: device detection to the right store; QR code on desktop; till downloads.
  - "Open in Clafina" links from product and industry pages to the matching app screen; signed-out
    visitors go through sign-up first.
  - Deep-link switches stay off in production until their values are set.
- **Deploy:** branch, push, PR, rebase merge. CI runs the checks in section 12, then a Cloudflare
  Pages preview with all switches on. `main` deploys production with the production rules. Security
  headers via `_headers` (CSP, HSTS, frame-ancestors, referrer policy); redirects via `_redirects`.

## 12. Testing

On every PR, all must pass:

- Type check, lint, full static build of every language.
- Content checks: completeness per language, schemas, banned words, labels, switch rules.
- Link checker across all languages, including links to switched-off pages.
- Playwright: navigation, mega menus, language and country switchers, forms with a stubbed function,
  deep-link parameters, Arabic layout, phone widths.
- axe on every template in English, Arabic and Japanese (WCAG 2.2 AA).
- Lighthouse budgets on phone (performance ≥ 95, accessibility 100, SEO 100).
- Visual snapshots of each template.

## 13. Delivery phases

1. Foundation: Next.js app, tokens and placeholder theme, switches, settings, routing for all 20
   languages with English content, header, footer, deploy, CI.
2. Core and product: Home, Platform, Pricing, demo flow, 21 product pages with ported screens.
3. Industries: index and 17 stories.
4. Solutions, Why Clafina, Resources, Partners, Developers, Trust centre, Company, Legal.
5. Translations in batches (French, Spanish, Portuguese; then Hausa, Yoruba, Igbo, Pidgin; then the
   rest), each shipped as a draft.
6. Go-live hardening: real settings, switch decisions, brand swap, final Lighthouse and accessibility
   pass.

## 14. Facts needed before production (settings file)

Legal entity and registered address · contact, support, privacy, security and press emails ·
sign-in and sign-up URLs · App Store and Google Play links · iOS team and bundle IDs · Android
package and signing fingerprints · till download links · social profiles · plan prices per currency ·
partner programme terms · open roles · CRM endpoint · Turnstile keys · claim values for any switch
left on.

## Appendix A. Industry facts (from `docs/product-source/`, 5 Nov 2026)

The right-hand column lists what the docs marked "Not yet" on 5 November. The owner confirmed all of
it will be built before the application goes live, so the pages present it as features, tagged
`prelaunch` (section 9).

| Industry | Kind | Trade words | Built before go-live (`prelaunch`) |
|---|---|---|---|
| Retail | Core: till and online shop | till, shift, float, X/Z report, walk-in customer | iOS till; till units other than one; serial and batch at the till |
| Restaurant | Pack | floor, covers, tabs, courses, stations, 86 | menu photos and languages |
| Accommodation | Pack on Bookings | Guest, Stay, front desk, room rack, folio, night audit | live channel connections; key cards; group bookings; occupancy dashboard; public room booking page |
| Events & ticketing | Pack | tickets, sessions, seating plan, gate | offline scanning; storefront ticket page; waitlists, resale, transfer |
| Memberships | Pack | members, plans, freezes, billing runs | card on file; member app and join page; wallet passes; offline door scanning |
| Classes | Pack on Bookings + Memberships | class schedule, check-in, class packs, credits, drop-in | member's own booking screen; WhatsApp/SMS offers; pay into payroll |
| Courses | Pack | learners, lessons, quizzes, certificates | public certificate verification; reminders; cohorts and scheduled classes; selling on the shop |
| Client records | Pack | client, consent, signed notes, break-glass | per-profession templates; client consent page; insurer claims. Never "compliant" |
| Property | Pack | Tenant, lease, rent roll, caution deposit, owners' levies | meter readings and service charges; tenant and landlord portals; listings |
| Construction | Pack on Projects | contract, stages, variations, valuation, retention, site diary, snags | Gantt; subcontractor portal; drawings and RFIs; final account |
| Field service | Pack on Projects | Job, dispatch, technician, van, checklist | route optimisation; skills; arrival window to customer; offline phone store |
| Rentals | Pack | Item, agreement, returns due, tags | week and month discounts; insurance; customer booking page |
| Distribution | Pack | routes, van loads, settle a van, empties | map route planning; proof of delivery; 3PL client view; excise |
| Farm | Pack (agriculture) | fields, seasons, scouting, applications, batches, lots, outgrowers | lot on invoices and waybills; season tagging in the journal; some map and weather providers |
| Manufacturing | Core module | bill of materials, routing, work centre, work order, OEE, NCR | AQL sampling and control charts; multi-currency costing; IoT |
| Fundraising | Pack | Donor, gifts, campaigns, grants, tax receipts, pledges | gifts in the ledger; emailing receipts; giving page; soft credits, volunteers |
| Product configurator | Pack | (doc not in this repo: read CONFIGURATOR.md before writing) | |

Corrections the new pages must make against today's `industries.html`:

- Retail and manufacturing are core modules, not packs.
- Property service charges, field service route planning and the other Appendix A items become
  `prelaunch` features, not plain claims.
- Claims that are neither built nor in Appendix A are dropped:
  - course terms, fee statements and parent records;
  - fundraising receipts issued the moment money arrives (they are issued by action or in a yearly
    batch; emailing them is in Appendix A);
  - a till that sells in several units.
