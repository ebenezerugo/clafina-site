# clafina-site

The public marketing site for **Clafina** — the business platform that unites books,
stock, people, projects and an online shop, with a till, a phone app and an AI
assistant reading the same records.

Static HTML, CSS and JavaScript. **No build step, no dependencies, no framework.** Open
`index.html` in a browser, or serve the folder.

## Run it

```bash
# any static server works; python is the one that is always there
python3 -m http.server 4310
# then open http://127.0.0.1:4310
```

Do not use ports 3000, 4200 or 8088 — on this machine those belong to the ERP's dev
servers.

## Pages

| File | What it is |
|---|---|
| `index.html` | Home: hero, the dashboard illustration, six surfaces, four feature pillars, industries, the counter and one-record stories, trust, call to action |
| `features.html` | Everything the product does, in six sections with an in-page jump nav |
| `industries.html` | The ten industry packs, plus the "not on the list" case for the core |
| `pricing.html` | Plans, enterprise, what is always included, FAQ |
| `contact.html` | Demo request form (client-side validation and a confirmation state) |
| `legal.html` | Draft privacy notice and terms — `noindex`, and marked as a draft on the page |

Shared assets:

```
assets/
├── css/site.css      one stylesheet: tokens, layout, components, responsive
├── js/site.js        header state, mobile nav, scroll reveals, form validation
└── img/favicon.svg   the mark
```

## Design

The colours are the **ERP's own** design tokens, taken from
`commerce-web/src/theme/01-base/variables.css` and the "Commerce Black" system in
`design-handoff/design-system-v2`:

| Token | Value | Used for |
|---|---|---|
| `--page` | `#fafafa` | the page ground |
| `--card` | `#ffffff` | cards, panels, the product frame |
| `--ink` | `#09090b` | text and the one black action in an area |
| `--ink-soft` / `--ink-muted` | `#52525b` / `#71717a` | second lines, labels |
| `--border` | `#e4e4e7` | every hairline — the site uses borders, not shadows |
| `--primary` | `#18181b` | buttons, the CTA band, the chosen state |
| `--good` / `--warn` / `--bad` | pairs | status only, never decoration |

Rules worth keeping when you edit it:

- **One black thing per area.** Each section has at most one filled primary action.
- **Colour means state.** Green, amber and red carry meaning; they are not accents.
- **Borders, not shadows.** Panels are separated by a hairline.
- **Numbers line up.** Money and quantities use `font-variant-numeric: tabular-nums`.
- **System sans only**, so the site loads with no webfont and matches the product.

Change a token in `:root` and the whole site follows.

## Accessibility

- Skip link, landmarks, one `h1` per page, logical heading order.
- Visible focus rings on everything interactive (`:focus-visible`, 2px, 3px offset).
- The dashboard illustration is `role="img"` with a text alternative and marked
  `aria-hidden` where it is decorative.
- Contrast checked against WCAG AA: `--ink-soft` is 7.5:1 and `--ink-muted` 4.8:1 on
  the page ground. Badge and pill pairs use `-ink` on `-fill`, never colour alone.
- `prefers-reduced-motion` disables the reveals and smooth scrolling.
- The mobile menu is a real `aria-expanded` toggle, closes on Escape, and returns focus.

## Placeholders to replace before launch

1. **Sign-in URL** — every `https://app.clafina.com/` link should point at the real
   application host.
2. **Pricing** — the amounts in `pricing.html` (₦0 / ₦25,000 / ₦75,000) are placeholders
   for layout. The real price card is data in the billing catalogue
   (`commerce-console`, per plan and currency); align the page with it.
3. **Demo form** — `#demoForm` validates and shows a confirmation, then resets. It
   **does not post anywhere yet**. Point it at a CRM or form endpoint and remove the
   comment in `assets/js/site.js`.
4. **Email addresses** — `hello@`, `support@`, `privacy@` and `security@clafina.com` are
   assumed; confirm the real mailboxes.
5. **Legal** — `legal.html` is a draft for a lawyer to review. It is `noindex` and says
   so on the page.
6. **Social preview image** — the Open Graph tags name a title and description but no
   image; add one (1200×630) when the brand has artwork.

## Adding a page

Copy the header and footer block from any page (they are identical apart from the
`aria-current="page"` attribute), add the `<link>` to `assets/css/site.css`, and the
`<script src="assets/js/site.js" defer>` before `</body>`. Add the icon `<symbol>`s the
page uses to its sprite.

## Deploying

The folder is the artefact. Serve it from any static host — put `index.html` at the
root, send `404` back to `index.html` only if you add client-side routing (there is
none here). `legal.html` is intentionally `noindex` until it is signed off.
