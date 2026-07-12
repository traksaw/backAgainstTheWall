# Error tracking (Sentry)

WAS-16: this app has no error tracking by default — a production bug is only
found when a user reports it. Sentry (`@sentry/nextjs`) closes that gap for
both client-side (React) and server-side (API routes, middleware, Server
Components) errors.

## Scope

Errors only, but with readable stack traces. No performance tracing or
session replay — those add cost/complexity this app doesn't need yet. If
that changes later, see
[Sentry's Next.js docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
for `tracesSampleRate`.

**Source maps are enabled.** `next.config.mjs` sets `org: 'philacon-valley'`,
`project: 'back-against-the-wall'`, and `authToken: process.env.SENTRY_AUTH_TOKEN`.
Without `SENTRY_AUTH_TOKEN` set, `next build` still succeeds — the upload
step just silently skips — so this only actually uploads when the token is
present (local `.env.local`, or a Vercel project env var for prod builds).
Without it, captured errors show minified bundle code instead of your
TypeScript source/line numbers.

The auth token is an **organization token**, scope `org:ci` (Source Map
Upload, Release Creation, Code Mappings only) — created under
Settings → Auth Tokens in the Sentry dashboard. It's a secret: only ever put
it in `.env.local` (gitignored) or your host's env var store, never commit
it.

## How it's wired

| File | Purpose |
|---|---|
| `instrumentation-client.ts` | Client-side `Sentry.init()` — catches browser/React errors |
| `sentry.server.config.ts` | Server-side `Sentry.init()` (Node runtime) |
| `sentry.edge.config.ts` | Edge runtime `Sentry.init()` (middleware) |
| `instrumentation.ts` | Next.js 15 registration hook — loads the right config per runtime, exports `onRequestError` so route handler / middleware / Server Component errors are captured |
| `app/global-error.tsx` | Catches React render errors app-wide |
| `next.config.mjs` | Wrapped in `withSentryConfig(...)`, which auto-instruments API routes and middleware so an unhandled `throw` reaches Sentry without touching every route file, and uploads source maps at build time when `SENTRY_AUTH_TOKEN` is set |

All three `Sentry.init()` calls read a single `NEXT_PUBLIC_SENTRY_DSN` env var
and no-op (`enabled: false`) if it's unset — so the app runs fine locally
without a DSN configured.

**Existing routes that `catch` and `console.error` their own errors are now
also reported to Sentry** via an explicit `Sentry.captureException(err)` call
in each catch block — Sentry's auto-instrumentation only sees *unhandled*
throws, so this is a deliberate interim step (not automatic) until WAS-45
(replacing ad-hoc console logging with a gated logger) replaces these calls
with a single logger abstraction.

## Environments (dev vs. preview vs. production)

All three `Sentry.init()` calls tag events with `environment`, sourced from
Vercel's system env vars (`VERCEL_ENV` server-side, `NEXT_PUBLIC_VERCEL_ENV`
client-side, both auto-populated by Vercel — falls back to `NODE_ENV`
locally). This means dev/preview/production all report to the **same**
Sentry project but stay filterable and separately alertable — e.g. an alert
rule scoped to `environment:production` won't fire on local dev noise.

This is deliberately one project with an environment tag, not one Sentry
project per environment — simpler to maintain for an app this size. If you
later want a hard quota/access boundary between environments (e.g. staging
traffic shouldn't be able to affect production's event quota), create a
second Sentry project and point that environment's `NEXT_PUBLIC_SENTRY_DSN`
at it instead — no code changes needed either way, since every
`Sentry.init()` just reads the env var.

**Local dev**: `.env.local` currently has a real DSN (left over from initial
verification) — local errors will show up in the dashboard tagged
`environment:development`. Blank out `NEXT_PUBLIC_SENTRY_DSN` locally if you
don't want that.

## Billing / trial

The `philacon-valley` Sentry org was on a 14-day trial as of 2026-07-12.
Check **Settings → Subscription** before that expires to confirm what plan
it drops to — don't assume error tracking silently keeps working at full
capacity without checking.

## Verifying it works

1. Start the app with `NEXT_PUBLIC_SENTRY_DSN` set.
2. Visit `/sentry-example-page` and click the button — confirms client-side
   error capture.
3. Request `/api/sentry-example-api` — confirms API route error capture.
4. Both should appear in the Sentry project's **Issues** tab within a few
   seconds.

The two routes above are temporary verification-only surfaces from WAS-16,
removed from the codebase after each new environment's setup is confirmed.
Recreate them if you need to re-verify a new environment, then delete again:

```ts
// app/api/sentry-example-api/route.ts
export async function GET() {
  throw new Error("Sentry test error: API route")
}
```

```tsx
// app/sentry-example-page/page.tsx
"use client"

export default function SentryExamplePage() {
  return (
    <button type="button" onClick={() => { throw new Error("Sentry test error: client component") }}>
      Throw test error
    </button>
  )
}
```
