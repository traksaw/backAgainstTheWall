# WAS-108: Move index builds off connect-time autoIndex into a migration script

## Problem

`lib/mongoose.ts`'s `connectDB()` calls `mongoose.connect()` with no
`autoIndex` option, so it defaults to `true` - every cold start (prod
deploy, serverless cold start) re-runs Mongoose's index diffing/creation
as an unmanaged background operation. Harmless today (indexes already
exist), but any future index add would get built implicitly at
deploy/cold-start time instead of as a deliberate, observable step.

## Current state (relevant facts discovered during investigation)

- `models/` has two schemas today: `QuizResult` (`models/QuizResult.ts`)
  and `User` (`models/User.ts`). No barrel file - each is imported
  individually wherever needed, matching this repo's existing explicit-
  import style.
- The repo already has one precedent for a manual runbook script:
  `scripts/check-sanity.ts`, run via `pnpm check-sanity` (`tsx`-executed,
  wired up in `package.json`). It never opens a live DB connection though,
  so it has no analogous "hangs after done" problem.
- `scripts/**/*.ts` is already covered by `tsconfig.json`'s `**/*.ts`
  include and by `eslint.config.mjs` (no scripts exclusion) - typecheck
  and lint pick up the new script for free, no config changes needed.
- `.env.local` exists locally with a live `MONGODB_URI` - gives a real
  Mongo instance to verify `createIndexes()` against without new
  infrastructure.
- Deploys are via Vercel's git integration (no `vercel.json`, no deploy
  step in `.github/workflows/ci.yml` - CI only lints/typechecks/tests/
  builds). `NODE_ENV=production` is set by Next.js for **both** Vercel
  production and preview builds, not just production - `next build` sets
  it unconditionally.

## Decisions

- **Run convention: manual pre-deploy step**, not CI automation or a
  `postinstall` hook. Confirmed with the user directly (three options
  presented: manual / CI hook on push to main / `postinstall`).
  - **Rejected: CI hook.** Would need a production `MONGODB_URI` added as
    a GitHub Actions secret (new credential-exposure surface) and would
    run on every push to `main` regardless of whether an index actually
    changed.
  - **Rejected: `postinstall`.** Runs on every `pnpm install`, including
    Vercel's build step - this re-introduces almost exactly the problem
    the ticket exists to fix, just moved from connect-time to build-time
    instead of eliminated.
  - **Chosen: manual.** Zero new infrastructure, deliberate and
    observable (the ticket's actual goal), matches the existing
    `check-sanity` precedent for "run this by hand when relevant."
    Tradeoff accepted: relies on remembering to run it, but only matters
    on the rare PR that adds/changes an index - documented explicitly
    (see Design below) so it isn't forgotten silently.
- **`autoIndex: false` gated on `process.env.NODE_ENV === "production"`
  exactly as the ticket specifies**, not on a Vercel-specific env var.
  Consequence confirmed as intentional, not a gap: this also disables
  autoIndex on Vercel **preview** builds (Next.js sets `NODE_ENV=production`
  for any `next build`, preview or prod). Documented in Design below so a
  PR that adds an index knows to run `sync-indexes` before its preview
  deploy too, not just before merging.
- **`createIndexes()`, never `syncIndexes()`.** `syncIndexes()` drops any
  index present in MongoDB but absent from the current schema - on a
  shared database that's a live index removal by accident (e.g. an
  in-progress branch's schema temporarily missing an index another
  branch already deployed). `createIndexes()` only adds what's declared,
  never removes.
- **Explicit connection teardown, not left implicit.** `check-sanity.ts`
  has no analogous need since it never opens a Mongo connection. This
  script must call `mongoose.connection.close()` after `createIndexes()`
  resolves (success or failure) - without it, the open Mongo socket
  behind `connectDB()`'s cached connection keeps the Node process alive
  and `tsx scripts/sync-indexes.ts` hangs instead of exiting.
- **Model list is a hardcoded explicit import, not directory-scanned.**
  Matches the repo's existing style (no barrel file, no dynamic
  `require`/glob anywhere in `models/` or `scripts/`). New models get
  added to this script's import list by hand when they're created -
  acceptable at 2 models today, revisit only if the model count grows
  enough to make that error-prone.

## Design

### `lib/mongoose.ts`

`opts` passed to `mongoose.connect()` gains one field:

```ts
const opts = {
  bufferCommands: false,
  autoIndex: process.env.NODE_ENV !== "production",
};
```

Dev/test (`NODE_ENV` unset or `"test"`) keep Mongoose's default
(`autoIndex: true` behavior, unchanged). Production and preview builds
get `autoIndex: false`.

### `scripts/sync-indexes.ts`

```ts
import mongoose from "mongoose";
import connectDB from "../lib/mongoose";
import QuizResultModel from "../models/QuizResult";
import UserModel from "../models/User";

async function main() {
  await connectDB();

  for (const model of [QuizResultModel, UserModel]) {
    await model.createIndexes();
    console.log(`Synced indexes for ${model.modelName}`);
  }
}

main()
  .catch((err) => {
    console.error("Failed to sync indexes:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
```

(Exact structure/imports to be finalized during implementation - shown
here to capture the connect → createIndexes-per-model → always-close
shape, matching `check-sanity.ts`'s top-level `main().catch(...)`
pattern.)

`package.json` gets one new script, next to `check-sanity`:

```json
"sync-indexes": "tsx scripts/sync-indexes.ts"
```

### `docs/migrations.md` (new file)

Short runbook, covering:

- **When to run it:** any PR that adds or changes a Mongoose schema
  index (`schema.index(...)` or an inline `index: true`/`unique: true`
  field option).
- **Before what:** before (or immediately after) that PR's merge to
  `main`, **and** before relying on its Vercel preview deploy for
  testing - preview builds also run with `autoIndex: false` (see
  Decisions above), so a preview won't build a newly-added index on its
  own either.
- **How to point it at the right database:** `pnpm sync-indexes` uses
  whichever `MONGODB_URI` is currently loaded (`.env.local` locally).
  Running against production requires temporarily supplying the
  production URI for that one invocation, e.g.
  `MONGODB_URI=<prod-uri> pnpm sync-indexes` - never paste a production
  URI into `.env.local`.
- **Why `createIndexes()`, not `syncIndexes()`:** the destructive-drop
  reasoning from Decisions above, restated here so it isn't relitigated
  on a future PR.
- **Why manual, not CI/postinstall:** the three-option tradeoff from
  Decisions above, restated briefly.

### Testing

No unit-testable application logic here (this is infra/config). DoD-level
verification:

1. Run `pnpm sync-indexes` locally against the `.env.local` MongoDB
   instance - confirm it logs success for both models, confirm the
   process exits on its own (no hang), and spot-check the indexes exist
   via `mongosh`/Atlas UI (`userId_1_createdAt_-1` and the `sessionId`
   sparse index on `QuizResult`, per `models/QuizResult.ts`).
2. `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build` all pass
   (`scripts/sync-indexes.ts` is picked up by lint/typecheck automatically,
   per Current State above; `pnpm build` already sets a dummy
   `MONGODB_URI` in CI per `ci.yml`'s existing comment, unaffected by this
   change since `autoIndex` only changes connect-time behavior, not the
   module-load-time env check `lib/mongoose.ts` already does).
3. Manually confirm the `autoIndex` gating: with `NODE_ENV=production`,
   `connectDB()`'s `opts.autoIndex` evaluates `false`; unset/`test`,
   evaluates `true`. (No automated test framework touches `lib/mongoose.ts`
   today - `lib/auth.test.ts` etc. mock it rather than exercising it
   directly - so this is a manual/read-through check, not a new unit
   test suite for a one-line config change.)

### Lesson to save (DoD item)

This design doc's Decisions section already records the run-convention
tradeoff and the `createIndexes`-vs-`syncIndexes` reasoning - satisfies
the DoD's "save the lesson" item once committed. Also worth a short
auto-memory entry (project-type) pointing here, since "which script verb
to use for Mongo index changes" is exactly the kind of thing to get re-
asked without a pointer.

## Definition of Done (from ticket)

- [ ] `autoIndex: false` confirmed applied only in production (and
      preview, per the NODE_ENV note above); dev/test still auto-build.
- [ ] `scripts/sync-indexes.ts` exists and successfully creates indexes
      for at least `QuizResult` against a real MongoDB instance.
- [ ] Chosen run-convention (manual) documented in `docs/migrations.md`.
- [ ] Tests / lint / typecheck pass.
- [ ] PR body says `Closes WAS-108`.
- [ ] Lesson saved (this doc's Decisions section, plus an auto-memory
      pointer).
