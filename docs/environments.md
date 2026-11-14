# Environments

How a change travels from a laptop to clafina.com.

| Environment | Address | Updated when | Search engines |
|---|---|---|---|
| Local | `npm run dev` (port 4310) | as you edit | n/a |
| Preview | `preview-<branch>.clafina-site.pages.dev` | every pull request whose CI passes | no (Cloudflare preview) |
| Staging | `staging.clafina-site.pages.dev`, later `staging.clafina.com` | every merge to `main` whose CI passes | no (`X-Robots-Tag: noindex`, robots.txt disallows all) |
| Production | `clafina-site.pages.dev`, later `clafina.com` | when you run a release and approve it | yes |

All builds come from `.github/workflows/deploy.yml`. Preview and staging build the exact commit CI checked; production builds main when you run a release.

## Preview and staging

Both use the preview build (`npm run build`): every page and switch is shown, sample figures included, so the team can see the whole site.

## Production

Production uses `npm run build:production`, which refuses to build while anything is not ready (`scripts/check-production.ts`):

- company facts in `src/config/site.ts` that are still placeholders (legal name, address, emails, app and sign-up links);
- legal pages still marked `"status": "draft"`;
- switched-on claims that use sample values or have no `confirmedBy` and `confirmedAt` (`src/config/switches.ts`).

Run `npm run check:production` to see the current list.

To switch production on, once the list is empty:

1. In GitHub, Settings → Environments → `production`: add yourself under required reviewers, so every release waits for approval.
2. In GitHub, Settings → Secrets and variables → Actions → Variables: add `CLAFINA_PRODUCTION_ENABLED` with the value `true`.
3. In Cloudflare, Pages → `clafina-site` → Custom domains: add `clafina.com` and `www.clafina.com` (production) and `staging.clafina.com` (pointing at the `staging` branch alias).

To release: GitHub → Actions → Deploy → Run workflow, on `main`. The job waits for your approval, runs the tests, builds in production mode (which refuses anything not ready) and publishes.

## Settings per environment

Sign-up and app links come from GitHub environment variables, so staging can point at a staging app and production at the real one:

- `CLAFINA_APP_URL`: the web app address, e.g. `https://app.clafina.com/`
- `CLAFINA_SIGNUP_URL`: the sign-up address, e.g. `https://app.clafina.com/signup`

Set them under Settings → Environments → `staging` and → `production`. Production refuses to build without them. The Cloudflare token and account ID are repository secrets used by every deploy.
