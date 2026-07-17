# WAS-108: Move index builds off connect-time autoIndex into a migration script Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop production/preview cold starts from silently running Mongoose's implicit `autoIndex` background index build, and replace it with a deliberate, manually-run `pnpm sync-indexes` script.

**Architecture:** One-line gate in `lib/mongoose.ts`'s `connectDB()` opts (`autoIndex: process.env.NODE_ENV !== "production"`), plus a new standalone script (`scripts/sync-indexes.ts`) that connects via the same `connectDB()` and explicitly calls `Model.createIndexes()` (never `syncIndexes()`) for each registered model, then closes the connection so the process exits. A new `docs/migrations.md` documents when/how to run it.

**Tech Stack:** Next.js 16 / Mongoose / `tsx` (already a dependency, same runner as `scripts/check-sanity.ts`) / `dotenv` (already a dependency, not yet used anywhere in source).

## Global Constraints

- `autoIndex: false` only in production (and Vercel preview, since `NODE_ENV=production` is set for both) — dev/test keep the default (`true`).
- `createIndexes()` only, never `syncIndexes()` — `syncIndexes()` drops indexes not in the current schema, which is destructive on a shared database.
- Run convention is manual (`pnpm sync-indexes`), not CI or `postinstall` — documented in `docs/migrations.md`, not automated.
- No barrel file for models — new models get added to `scripts/sync-indexes.ts`'s import list by hand, matching existing repo style.
- Full spec: `docs/superpowers/specs/2026-07-16-was-108-index-migration-script-design.md`.

---

### Task 1: Gate `autoIndex` on `NODE_ENV` in `lib/mongoose.ts`

**Files:**
- Modify: `lib/mongoose.ts:36-38`

**Interfaces:**
- Consumes: nothing new — `process.env.NODE_ENV`, already implicitly available (Node/Next.js sets it).
- Produces: `connectDB()`'s behavior is unchanged in shape (same exported default function, same return type `Promise<typeof import('mongoose')>`) — only the `opts` object passed internally to `mongoose.connect()` gains one field. Later tasks don't call anything new here; `scripts/sync-indexes.ts` (Task 2) imports `connectDB` exactly as it's imported today elsewhere in the repo (`import connectDB from "../lib/mongoose"`).

No new automated test is added for this one-line change — every existing test that touches `lib/mongoose.ts` mocks it away entirely (see `app/api/quiz/results/route.integration.test.ts:20-22` for the pattern), so there's no existing harness that exercises `connectDB()`'s real `mongoose.connect()` call to extend. Verification is a direct read-through of the two branches (below) plus the live end-to-end run in Task 2, which proves the `autoIndex: false` branch doesn't break a real connection.

- [ ] **Step 1: Make the change**

In `lib/mongoose.ts`, the `opts` object currently reads:

```ts
    const opts = {
      bufferCommands: false,
    };
```

Change it to:

```ts
    const opts = {
      bufferCommands: false,
      autoIndex: process.env.NODE_ENV !== "production",
    };
```

- [ ] **Step 2: Read-through verification**

Confirm both branches by inspection (no test framework changes needed):
- `NODE_ENV === "production"` → `opts.autoIndex === false` (matches DoD: "confirmed applied only in production").
- `NODE_ENV` unset, `"development"`, or `"test"` → `opts.autoIndex === true` (matches DoD: "dev/test still auto-build").

- [ ] **Step 3: Typecheck**

Run: `pnpm type-check`
Expected: no errors (this is a plain object literal, `mongoose.ConnectOptions` already accepts `autoIndex?: boolean`).

- [ ] **Step 4: Commit**

```bash
git add lib/mongoose.ts
git commit -m "fix(infra): gate autoIndex off in production (WAS-108)"
```

---

### Task 2: Add `scripts/sync-indexes.ts` and wire up `pnpm sync-indexes`

**Files:**
- Create: `scripts/sync-indexes.ts`
- Modify: `package.json:5-14` (add one script entry)

**Interfaces:**
- Consumes: `connectDB` (default export, `() => Promise<typeof import('mongoose')>`) from `lib/mongoose.ts` (Task 1, unchanged shape); `QuizResultModel` default export from `models/QuizResult.ts` (a Mongoose `Model<IQuizResult>`, has `.createIndexes(): Promise<void>` and `.modelName: string` from the Mongoose `Model` type — no repo-specific typing needed); `UserModel` default export from `models/User.ts` (same shape, `Model<IUser>`).
- Produces: `pnpm sync-indexes` — a CLI entry point, nothing importable by other code. Task 3 (`docs/migrations.md`) references this command by name only.

No unit test is added here either (per the approved spec's Testing section — this is infra/CLI, not application logic with an existing mocking harness to extend). Verification is a real run against the local `.env.local` MongoDB instance, run twice (once as `NODE_ENV` unset/dev-like, once as `NODE_ENV=production`) to prove Task 1's two branches both still let indexes get created — since `createIndexes()` is independent of the connect-time `autoIndex` setting by design.

- [ ] **Step 1: Write `scripts/sync-indexes.ts`**

```ts
// Manual runbook script, run by hand (never in CI/postinstall) — see
// docs/migrations.md for when to run it and why not syncIndexes().
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../lib/mongoose";
import QuizResultModel from "../models/QuizResult";
import UserModel from "../models/User";

const models = [QuizResultModel, UserModel];

async function main() {
  await connectDB();

  for (const model of models) {
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

`import "dotenv/config"` loads `.env.local`-style vars the same way `next dev`/`next build` do (`dotenv` is already a `package.json` dependency but unused anywhere in source today — this is its first real use). `dotenv` never overwrites an already-set `process.env` value, so `MONGODB_URI=<prod-uri> pnpm sync-indexes` (an inline env var, set before Node starts) still takes precedence over whatever `.env.local` has — required for the "point it at prod" runbook step in Task 3.

- [ ] **Step 2: Wire up the `package.json` script**

In `package.json`, the `"scripts"` block currently ends with:

```json
    "check-sanity": "tsx scripts/check-sanity.ts"
```

Change it to:

```json
    "check-sanity": "tsx scripts/check-sanity.ts",
    "sync-indexes": "tsx scripts/sync-indexes.ts"
```

- [ ] **Step 3: Lint and typecheck**

Run: `pnpm lint && pnpm type-check`
Expected: no errors (`scripts/**/*.ts` is already covered by both — no config changes needed, confirmed during design investigation).

- [ ] **Step 4: Run it for real against the dev database (dev-like `NODE_ENV`)**

Run: `pnpm sync-indexes`
Expected: prints `Synced indexes for QuizResult` then `Synced indexes for User`, then the process exits on its own (returns to the shell prompt — no hang). If it hangs, `mongoose.connection.close()` isn't being reached; check the `.finally()` wiring.

- [ ] **Step 5: Run it again with `NODE_ENV=production`**

Run: `NODE_ENV=production pnpm sync-indexes`
Expected: same two log lines, same clean exit. This proves `createIndexes()` still works when `connectDB()`'s `opts.autoIndex` is `false` — confirming the two mechanisms (connect-time autoIndex vs. this script's explicit call) are independent, which is the whole point of the ticket.

- [ ] **Step 6: Spot-check the indexes exist**

Using `mongosh <MONGODB_URI>` (or the Atlas UI's Indexes tab for the `quizresults` collection), confirm both indexes from `models/QuizResult.ts:38,45` are present: the compound `{ userId: 1, createdAt: -1 }` index and the sparse `sessionId` index. This satisfies the DoD line "successfully creates indexes for at least QuizResult against a real MongoDB instance."

- [ ] **Step 7: Commit**

```bash
git add scripts/sync-indexes.ts package.json
git commit -m "feat(infra): add sync-indexes migration script (WAS-108)"
```

---

### Task 3: Document the run convention in `docs/migrations.md`

**Files:**
- Create: `docs/migrations.md`

**Interfaces:**
- Consumes: nothing code-level — references `pnpm sync-indexes` (Task 2) and `lib/mongoose.ts`'s `autoIndex` gate (Task 1) by name/behavior only.
- Produces: nothing consumed by other tasks — this is the DoD's "run-convention documented" checkbox.

- [ ] **Step 1: Write `docs/migrations.md`**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add docs/migrations.md
git commit -m "docs(infra): document sync-indexes run convention (WAS-108)"
```

---

### Task 4: Full verification pass

**Files:** none (verification only).

**Interfaces:** none — this task only runs commands already wired up by Tasks 1–3.

- [ ] **Step 1: Run the full local verification suite**

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

Expected: all four pass. `pnpm build` already sets a dummy `MONGODB_URI` when run in CI (`.github/workflows/ci.yml:40-45`); locally it picks up `.env.local`'s real one via Next's own env loading — either way, `autoIndex`'s value doesn't affect whether the module import throws (that check in `lib/mongoose.ts:5-9` is unchanged by this ticket).

- [ ] **Step 2: Confirm nothing was missed against the DoD**

Read `docs/superpowers/specs/2026-07-16-was-108-index-migration-script-design.md`'s "Definition of Done" section top to bottom; every line should already be checked off by Tasks 1–3's commits plus this task's green run. No code changes expected in this step — it's a checklist read, not new work.

- [ ] **Step 3: Final commit if anything is outstanding**

Only needed if Step 2 surfaces something uncommitted. Otherwise, this task ends with nothing new to commit — Tasks 1–3 already committed everything.
