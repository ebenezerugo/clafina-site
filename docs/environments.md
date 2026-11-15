# Environments

How a change travels from a laptop to clafina.com.

| Environment | Address | Updated when | Search engines |
|---|---|---|---|
| Local | `npm run dev` (port 4310) | as you edit | n/a |
| Preview | `preview-<branch>.clafina-site.pages.dev` | every pull request whose CI passes | no (Cloudflare preview) |
| Staging | `staging.clafina.com`, also `clafina-site.pages.dev` and `staging.clafina-site.pages.dev` | every merge to `main` whose CI passes | no (`X-Robots-Tag: noindex`, robots.txt disallows all) |
| Production | `clafina.pages.dev`, later `clafina.com` | when you run a release and approve it | yes |

Two Cloudflare Pages projects keep them apart:

- `clafina-site` is staging (and holds the previews). Every merge to `main` goes to its main address, so a custom domain bound to it, `staging.clafina.com`, always shows the latest site.
- `clafina` is production. The first release creates it. The release job refuses to publish to `clafina-site`, so a release can never land on staging or the other way round. To use another name, set the `CLAFINA_PRODUCTION_PROJECT` variable.

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
3. Run the first release (below). It creates the `clafina` project in Cloudflare.
4. In Cloudflare, Pages → `clafina` → Custom domains: add `clafina.com` and `www.clafina.com`. Leave `staging.clafina.com` on `clafina-site`.

To release: GitHub → Actions → Deploy → Run workflow, on `main`. The job waits for your approval, runs the tests, builds in production mode (which refuses anything not ready) and publishes.

## Settings per environment

Sign-up and app links come from GitHub environment variables, so staging can point at a staging app and production at the real one:

- `CLAFINA_APP_URL`: the web app address, e.g. `https://app.clafina.com/`
- `CLAFINA_SIGNUP_URL`: the sign-up address, e.g. `https://app.clafina.com/signup`

Set them under Settings → Environments → `staging` and → `production`. Production refuses to build without them. The Cloudflare token and account ID are repository secrets used by every deploy.
