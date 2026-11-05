# Clafina brand kit

**Version 1.0 · 2026**
The brand in one line: **One clear view. One record.**

This folder is the complete identity: the mark, the wordmark, the palette, the
type, the rules, and the artwork needed to apply them. Nothing here depends on a
build step.

---

## The idea

Clafina is the first letter of the name and the shape of the promise: an **open
system** that holds the whole business in one continuous line.

- **The C never closes.** There is always another sale, another hire, another
  channel or another idea to take in. The 70° opening faces forward.
- **The opening is also an eye.** One clear view of the business, not nine
  dashboards.
- **The citron diamond is the one record.** It sits at the centre of the mark and
  repeats as the tittle of the `i` in the wordmark. Every surface reads and writes
  the same numbers.

The brand should feel **clear, warm and in control**. It is a business tool for
people who are busy — so it speaks plainly and shows the numbers.

---

## The logo

The mark is a **C** with a 70° opening, a **citron diamond** at its centre, set in
an Evergreen tile with a 24% corner radius. The wordmark is a customised
**Manrope ExtraBold** lowercase, with the i's dot replaced by the same diamond.
All letterforms are outlined, so the files render identically everywhere.

### Files

| File | Use |
|---|---|
| `logo/clafina-logo-horizontal.svg` | **Primary lockup.** Light backgrounds. |
| `logo/clafina-logo-horizontal-reverse.svg` | Dark backgrounds (Evergreen or Ink). |
| `logo/clafina-logo-horizontal-mono.svg` | One-colour print, embossing, stamps. |
| `logo/clafina-logo-stacked.svg` | Narrow spaces, square crops, merchandise. |
| `logo/clafina-mark.svg` | Tile + C + diamond. App icon, avatar, favicon source. |
| `logo/clafina-mark-reverse.svg` | Mark on dark. |
| `logo/clafina-symbol.svg` | C + diamond without the tile. |
| `logo/clafina-symbol-reverse.svg` | C + diamond, Bone + Citron. |
| `logo/clafina-symbol-mono.svg` | C + diamond in `currentColor`. |
| `logo/clafina-wordmark.svg` | Wordmark on light. |
| `logo/clafina-wordmark-reverse.svg` | Wordmark on dark. |
| `logo/clafina-wordmark-mono.svg` | Wordmark in `currentColor`. |
| `logo/clafina-app-icon.svg` | 512 px app icon master. |
| `logo/clafina-favicon.svg` | 32 px favicon master. |
| `logo/png/` | Transparent PNG exports at 2048, 1024, 512, 180, 48, 32 and 16 px. |

### Rules

- **Clearspace:** one C-stroke — `14.8 / 128` of the tile — on every side.
  Nothing enters it: not type, not a rule, not the edge of a card.
- **Minimum sizes:** 120 px wide for the horizontal lockup, 24 px for the mark,
  16 px for the favicon.
- **Primary on light:** Evergreen tile, Bone C, Citron diamond, Ink wordmark.
- **Reverse:** Bone C, Citron diamond, Bone wordmark. Use on Evergreen or Ink.
- **Never** stretch, outline, rotate, recolour, add a shadow, or re-space the
  wordmark. The tile is part of the primary lockup. Do not put the mark on a busy
  photograph without a solid Bone or Evergreen field behind it.
- The Citron diamond is the only decorative element inside the mark. It is never
  a second logo.

---

## Colour

Four colours do the work. The rest support them.

| Colour | Hex | RGB | Role |
|---|---|---|---|
| **Evergreen** | `#0B5C46` | 11 · 92 · 70 | Primary. Actions, links, identity, the tile. |
| **Citron** | `#DDF36B` | 221 · 243 · 107 | Accent. The one record, AI moments, one highlight per view. |
| **Bone** | `#F7F3EA` | 247 · 243 · 234 | The page ground. Warm, not grey. |
| **Ink** | `#0D1B16` | 13 · 27 · 22 | Text and dark surfaces. |
| **Paper** | `#FFFDF8` | 255 · 253 · 248 | Cards, sheets, raised surfaces. |
| **Stone** | `#5B6B62` | 91 · 107 · 98 | Secondary text. 5.1:1 on Bone. |
| **Sage** | `#DCE7DF` | 220 · 231 · 223 | Quiet fills, table rows, tints. |
| **Clay** | `#C96A4A` | 201 · 106 · 74 | Illustration and charts. Not small text. |

Use roughly **60% Bone/Paper, 30% Evergreen/Ink, 10% Citron/Clay**. Citron is a
highlighter, not a background for text. Clay is for illustration, charts and large
display type only.

### Contrast

| Pair | Ratio |
|---|---|
| Ink on Bone | 17.4:1 |
| Evergreen on Bone | 7.2:1 |
| Bone on Evergreen | 7.2:1 |
| Citron on Evergreen | 6.5:1 |
| Ink on Citron | 14.4:1 |
| Stone on Bone | 5.1:1 |

Status colours are `good #146C43 / #E3F2E8`, `warn #9A3412 / #FDF0E6`,
`bad #B42318 / #FDECEA` and `info #1D4ED8 / #E8EEFD`. Status colour always
travels with a word or an icon.

---

## Typography

**Manrope** — variable 200–800, SIL Open Font License. The Latin subset is in
`fonts/Manrope-latin.woff2` (24 KB).

| Role | Weight | Size / line / tracking |
|---|---|---|
| Display | 800 | 96 / 0.94 / −5% |
| Heading | 750 | 48 / 1.05 / −3% |
| Subhead | 600 | 24 / 1.3 / −2% |
| Body | 450 | 17 / 1.6 / −0.5% |
| Label | 700 | 12 / +12% / uppercase |

Sentence case for headlines. Labels are the only uppercase type. Money and
quantities always use `font-variant-numeric: tabular-nums`. Do not introduce a
second typeface for emphasis.

Use the font as a webfont on the site with `font-display: swap`, falling back to
the system sans. The logo itself is outlined and needs no font.

One practical note: Manrope’s Google Fonts Latin subset covers the site’s text but
does not include `₦` (U+20A6), so the naira sign falls back to the platform sans.
If you need one font for every currency, build a subset that includes U+20A6 or
pair Manrope with Inter for figures.

---

## Voice

**Clear.** Short sentences. Concrete nouns. Numbers where they help.
**Warm, not cute.** Talk to a person who is busy. No exclamation marks, no jargon.
**One claim, then proof.** Every promise gets a number, a screenshot or a customer.

| Do | Don't |
|---|---|
| “Know what is owed.” | “Leverage actionable insights.” |
| “This is yours to export.” | “Revolutionary synergy.” |
| “Close the books in a day.” | “World-class.” |

---

## Applications

Open `clafina-brand-guidelines.pdf` for the full 6-page identity: the idea,
logo system, colour, typography, applications and voice. `clafina-brand-board.png`
is the one-page overview.

`clafina-social-preview.png` (1200×630) is ready for Open Graph and Twitter.
`logo/png/clafina-app-icon-1024.png` is the app store / home screen icon.

---

## Applying it to the live site

The live marketing site still uses the previous near-black favicon and the
“Commerce Black” tokens. To roll the identity out:

1. Replace `assets/img/favicon.svg` with `brand/logo/clafina-favicon.svg`.
2. Swap the header/footer mark for `brand/logo/clafina-logo-horizontal.svg` (or
   keep the responsive text lockup and use `brand/logo/clafina-mark.svg`).
3. Import `brand/tokens/clafina-tokens.css` or copy the four core colours into
   `assets/css/site.css`:
   `--page: #f7f3ea`, `--card: #fffdf8`, `--ink: #0d1b16`,
   `--primary: #0b5c46`, `--primary-hover: #074434`, `--on-primary: #f7f3ea`.
4. Add the Manrope `@font-face` from `brand/fonts/` and point `--font` at it.
5. Add the social preview to the Open Graph tags.

The brand is deliberately warmer than the ERP chrome. The product can keep its
neutral surfaces; use Evergreen for the primary action and Citron for the one
thing that needs attention.

---

## Licence

Manrope is licensed under the SIL Open Font License 1.1; the licence is in
`fonts/OFL.txt`. The Clafina name, mark and artwork are the property of Clafina.
