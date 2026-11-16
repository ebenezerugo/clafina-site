# Security rules and the gate

The rules every change must meet are in **commerce-api's `documentation/SECURITY_RULES.md`** (the master copy;
the same text is `SECURITY-RULES.md` in the folder that holds every repository). This page only says how they are
checked here.

- `scripts/check-security.sh` checks the rules marked **gate**. It is the same file in every repository. It runs
  from `.githooks/pre-push` (install once with `npm run hooks`), from `npm run lint:security` and in CI (the
  `Security gate` step of `.github/workflows/ci.yml`, with `--full`, which adds `npm audit --audit-level=high --omit=dev`).
- `.security-rules.json` holds this app's patterns (from the `next-web` template).
- `.security-baseline.json` lists the violations that existed when the gate arrived. It may only shrink: after
  fixing some, run `scripts/check-security.sh --shrink` and commit the result. A new violation fails the push.
- `.security-exceptions.json` (optional) excuses one rule in one file, with a reason, an owner and an expiry no
  more than 30 days away.
- `.npmrc` turns install scripts off, makes a version wait 7 days and refuses git dependencies. After `npm ci`, run
  `npm run rebuild:native` once (it builds esbuild and the other native packages) and `npm run hooks`.

Never push with `--no-verify`. A gate that is wrong is fixed in the gate.
