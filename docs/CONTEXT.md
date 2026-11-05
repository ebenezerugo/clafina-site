# Clafina: what it is and how to market it

Written 5 Nov 2026 as the handoff from the local build to the cloud session.
"Commerce" was the working name, and the code and the docs in `product-source/`
still use it. Publicly the product is **Clafina**.

## What Clafina is

One business platform on one set of records: books, stock, sales, people, projects
and an online shop, with a till, a phone app and an AI assistant reading the same
numbers. Brand line: **One clear view. One record.**
Chosen headline in the PRD (13 Oct): "Run your whole business on Commerce"; the site
now says "Run the whole business from one place."

What users should end up saying (the owner's North Star, 18 Oct): they love the
clean, intuitive interface and easy customisation; quotes and automated reminders;
swift online payments and tracking; quick invoice cloning, payroll, POS, storefront,
maintenance and assets; "the app has everything I need to run my business operations
with my staff."

## Surfaces

ERP web app, offline till (POS), storefronts with Storefront Studio, one phone app
for owners and staff, the AI assistant, clock-in kiosk and self-service, Meet (own
video), wallet and payments, the trading network between businesses.

## How industries work

One core, **industry packs** on top: a pack switches on features, uses the trade's
words (a hotel's Guest, a charity's Donor) and installs defaults, without a fork.
See `product-source/INDUSTRY_PACKS.md` and the pack docs beside it: accommodation,
bookings, classes, construction, courses, distribution, events, farm, field service,
fundraising, manufacturing, memberships, property, rentals, restaurant, client records.
`industries.html` shows ten packs today; check it against the real list.

## Decisions already made for the public site (PRD Draft 3, 13 Oct)

PRD: https://claude.ai/artifact/YKtFQWjEhwx1NQ6AKR38VK (full text may not be reachable
from every session; these are the main points).

- Global production site. No beta wall: everyone can sign up, monitored from Console.
- Two actions: Start free (creates the organisation) and Book a demo.
- Leads and demos land in Clafina's own CRM and calendar.
- Country editions by location: global, Nigeria, LatAm.
- Languages: EN, ES, PT, FR, then Hausa, Yoruba, Igbo, Pidgin.
- 24/7 global support. Company entities are a Console-managed list.
- Free plan with limits. Proposed tiers, not final: Free, $29 Growth, $99 Business,
  Enterprise, plus à la carte and usage metrics and country prices.
- Proposed hosting: static on Cloudflare Pages, with Turnstile and Cloudflare Web
  Analytics. The PRD says Next.js; the site is plain HTML. This is still open.

## Standing product and brand rules

- Voice: plain, warm, no exclamation marks, no jargon. One claim, then proof.
- Follow `brand/README.md` for logo, colour, type and voice.
- Never invent customers, testimonials, logos or metrics. Clafina has no public
  customers yet, so stories use clearly illustrative scenarios.
- Claim only what is built. `product-source/STATUS.md` and `ROADMAP.md` are snapshots;
  confirm with the owner before promising anything marked planned.
- Live payment rails were still being connected on 1 Nov. Do not claim specific
  payment providers or countries without checking.
- Security claims must be true and specific. Do not publish findings or internals.

## Safety

- `docs/` is internal and must never be deployed. The site is served from the repo
  root today, so exclude `docs/` in any deploy configuration before going live.
- The repo is private.
