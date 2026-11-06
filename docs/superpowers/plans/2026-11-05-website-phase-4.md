# Clafina website, phase 4 (solutions, Why Clafina, resources, partners, developers, trust, company, legal)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the 38 remaining pages of the site map (spec section 3) on five templates. Each page's content comes from the product docs, the facts files or `src/config/site.ts`.

**Spec:** sections 3, 8, 9, 11 and 13 of `docs/superpowers/specs/2026-11-05-clafina-website-design.md`.

## Global Constraints

- All earlier Global Constraints hold. The ones that matter most here:
  - claims stay in `claim` objects;
  - no named providers or tax authorities;
  - illustrative businesses are labelled;
  - the word is Clafina, never Commerce.
- **Facts from `site.ts`:** company name, address and emails are read from `site.ts` and never typed into content. While a fact is a placeholder, the page shows a neutral line (for example "Write to us from the Contact page") instead of the missing value.
- **Legal pages** are drafts until a lawyer approves them:
  - each carries `status: "draft"` and shows a visible "Draft for legal review" notice;
  - a production build refuses a legal page still in draft.
- **Careers:** shows open roles only from `site.ts`. With none, it says so plainly.
- **Press:** shows brand assets only once the brand is final, behind the switch `sections.pressKit`.

## Templates

| Template | Route | Pages | Content |
|---|---|---|---|
| Solution | `app/[locale]/solutions/[slug]` | 9 | `content/<l>/solutions/<slug>.json`: pains, short labelled story, modules, recommended plan, FAQ |
| Explainer | `app/[locale]/why/[slug]` | 4 | `content/<l>/why/<slug>.json`: sections of prose, optional diagram, key points |
| Long form | `app/[locale]/[...doc]` (catch-all, only listed paths) | partners (2), developers (2), trust (4), company (4), legal (5) | `content/<l>/docs/<route-id>.json`: lede, updated date, status, sections with side table of contents, contact routes |
| Application form | the lead form with kinds `partner` and `developer` | partners-apply, developers-signup | `content/<l>/<route-id>.json` (LeadPageContent) |
| Resources | `resources/guides` (reading paths through the help centre), `resources/templates` (printable invoice, quotation and receipt), `resources/glossary` (A–Z from the help catalogue's words and the trade words), `whats-new` (dated entries) | 4 | own schemas |
| Core | `start` (hand-off to sign-up, keeping the campaign), `download` (store by device, QR code on desktop, till downloads) | 2 | own schemas |

## Tasks

1. Templates, schemas, content checks and e2e loops for all of the above, with one finished example of each (me).
2. Content agents in parallel, each writing only its own files:
   - solutions (9);
   - Why Clafina (4);
   - trust and developers (6);
   - company and partners (5);
   - legal (5);
   - what's new and guides.
3. Mark the routes built, run the full suite, open the PR.
