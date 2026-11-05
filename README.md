# clafina-site

The public website for **Clafina**: one business platform for books, stock, sales, people, projects
and an online shop, with a till, a phone app and an AI assistant reading the same records.

Next.js (App Router, static export) with Tailwind, in 20 languages, deployed to Cloudflare Pages.
The design is in `docs/superpowers/specs/2026-11-05-clafina-website-design.md`; the build plans are
in `docs/superpowers/plans/`.

## Run it

```bash
npm ci
npm run dev            # http://localhost:4310
npm run build          # static site in out/ (preview mode: every switch on)
npm run serve:out      # serve out/ like Cloudflare does, on http://127.0.0.1:4311
```

Do not use ports 3000, 4200 or 8088 on the development machine: those belong to the ERP's dev servers.

## Checks

| Command | What it checks |
|---|---|
| `npm run typecheck` | TypeScript, strict |
| `npm run lint` | ESLint with the Next.js rules |
| `npm test` | Unit tests (Vitest) |
| `npm run check:css` | No left/right classes (`ml-`, `pr-`, `text-left` …), so Arabic mirrors |
| `npm run check:content` | Content shape, banned words, exclamation marks, the dropped taglines, claims outside their switches, labelled story businesses |
| `npm run check:output` | `docs/`, `brand/` and Markdown never reach `out/` |
| `npm run check:links` | Every internal link in `out/` resolves |
| `npx playwright test` | Languages, right-to-left, menus, 404s, fonts, accessibility (axe) and screenshots |
| `npx lhci autorun` | Phone Lighthouse: performance ≥ 95, accessibility 100, SEO 100 |

CI runs all of them on every pull request (`.github/workflows/ci.yml`).

## Where things live

| Path | What it holds |
|---|---|
| `app/[locale]/` | Every page, under its language: `/en/`, `/fr/pricing/` … |
| `app/(root)/` | The plain language picker at `/` (the Pages Function redirects before it shows) |
| `functions/index.ts` | Cloudflare Pages Function: sends `/` to the visitor's language |
| `content/<locale>/` | Page copy. English is the master; other languages fall back to it key by key |
| `messages/<locale>.json` | Interface strings: menus, footer, switchers, 404 |
| `src/config/locales.ts` | The 20 languages: script, direction, review status |
| `src/config/routes.ts` | Every page in the site map; a page shows only when `built` and switched on |
| `src/config/switches.ts` | **Every switch** (claims, pre-launch features, pages, sections, languages, countries, features) |
| `src/config/site.ts` | **Checkable facts** (company, emails, app and store links, app IDs, socials, CRM, Turnstile) |
| `src/config/nav.ts` | The header menus |
| `src/theme/tokens.css` | The only place colours, type, radius, shadow and motion are defined |
| `src/brand/Logo.tsx` | The only place the logo is drawn |
| `src/lib/links.ts` | The one builder for sign-up, app and open-in-app links |

## Switches and settings

Preview builds turn every switch on so the whole design can be reviewed. A production build
(`npm run build:production`) refuses to run while:

- a claim or pre-launch switch is on without `confirmedBy` and `confirmedAt`, or still holds a sample value;
- a required fact in `src/config/site.ts` is still a placeholder.

The CMS will take over both files later.

## Help centre

`/help/` follows the app's own menu. `content/en/help/catalogue.json` (every module and page, with the app's page
help and the guide's questions) is **generated**: refresh it when the app's menu changes, from local clones of the
app repositories:

```bash
COMMERCE_WEB=../commerce-web COMMERCE_API=../commerce-api npm run sync:help
```

The how-tos are written by hand, one file per module in `content/en/help/guides/<module>.json`, from the module's
doc and the app's screens. The content check makes sure each how-to points at a page of its own module.

## Pre-launch pages

A route made with `pre(...)` in `src/config/routes.ts` (Business email today) is a whole page built before go-live.
It shows, with its menu and footer entries and every mention of it, only while `prelaunch.features` and its own
`prelaunch.<route id>` switch are on.

## Languages

Each language has a status in `src/config/locales.ts`. Drafts are published but marked `noindex` and
left out of the sitemaps. When a native speaker has reviewed one, set `status: 'reviewed'` with
the reviewer and date.

## Brand

The site ships with a neutral placeholder theme. The chosen brand replaces `src/theme/tokens.css`
and `src/brand/Logo.tsx`; nothing else changes. Brand source files live in `brand/` and are never deployed.

## Deploy

- Pull requests that pass CI deploy a preview to Cloudflare Pages (`.github/workflows/deploy.yml`).
- Production deploys from `main` only when the repository variable `CLAFINA_PRODUCTION_ENABLED` is `true`,
  and only through `npm run build:production`.
- Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. Project: `clafina-site`.
- Only `out/` and `functions/` are uploaded. `public/_headers` sets the security headers;
  `public/_redirects` moves the old `.html` pages to their new addresses.

The old static pages (`index.html`, `features.html` … and `assets/`) stay in the repository until
phase 2 replaces them. They are not part of the build.
