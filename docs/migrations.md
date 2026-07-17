# Index migrations

`lib/mongoose.ts` sets `autoIndex: false` in production (and Vercel
preview builds, since `NODE_ENV=production` is set for both — Next.js
sets it for any `next build`, not just production deploys). Dev/test
keep Mongoose's default (`autoIndex: true`), so local index changes still
apply automatically when you run the app locally.

That means: **any PR that adds or changes a Mongoose schema index**
(`schema.index(...)`, or an inline `index: true` / `unique: true` field
option) needs a manual step, because neither the production deploy nor
that PR's own Vercel preview build will build the new index on their own.

## Running it

```bash
pnpm sync-indexes
```

This connects via the same `connectDB()` every API route uses, then
calls `Model.createIndexes()` (not `syncIndexes()` — see below) for
every model listed in `scripts/sync-indexes.ts`, and exits.

By default this uses whichever `MONGODB_URI` is currently loaded
(`.env.local` locally). **To run it against production**, supply the
production URI for that one invocation only — never paste a production
URI into `.env.local`:

```bash
MONGODB_URI=<prod-uri> pnpm sync-indexes
```

That inline form writes the full production connection string, credentials
included, into your shell history. Prefix the command with a space if your
shell is configured to skip history for space-prefixed commands
(`HISTCONTROL=ignorespace` in bash, `HIST_IGNORE_SPACE` in zsh), or clear
the relevant history entry afterward.

**Note:** The script requires `DOTENV_CONFIG_PATH=.env.local` to load your
environment variables, and the `pnpm sync-indexes` entry in `package.json` has
this already configured. Running `tsx scripts/sync-indexes.ts` directly will
fail with a missing `MONGODB_URI` error — always use `pnpm sync-indexes` (or
set `DOTENV_CONFIG_PATH=.env.local` yourself if running the script another way).

## When to run it

- Before (or immediately after) merging a PR that adds/changes an index.
- Before relying on that PR's own Vercel **preview** deploy to test the
  new index's behavior — preview builds also run with `autoIndex: false`.

## Why `createIndexes()`, not `syncIndexes()`

Mongoose's `syncIndexes()` drops any index that exists in MongoDB but
isn't in the *current* schema code — on a shared database, that's a live
index removal by accident (e.g. mid-deploy, or another branch's schema
temporarily missing an index a different branch already shipped).
`createIndexes()` only adds what's declared; it never removes anything.

## Why manual, not CI or `postinstall`

- **CI hook on push to `main`:** would need a production `MONGODB_URI`
  added as a GitHub Actions secret — new credential-exposure surface —
  and would run on every push regardless of whether an index changed.
- **`postinstall`:** runs on every `pnpm install`, including Vercel's
  build step — this re-creates almost exactly the problem this whole
  setup exists to avoid, just moved from connect-time to build-time.
- **Manual** costs nothing extra, stays deliberate and observable (the
  actual goal here), and matches this repo's existing precedent for
  by-hand scripts (`pnpm check-sanity`).

See `docs/superpowers/specs/2026-07-16-was-108-index-migration-script-design.md`
for the full design rationale (WAS-108).
