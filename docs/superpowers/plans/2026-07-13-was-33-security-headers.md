# WAS-33: Add baseline HTTP security headers — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add baseline HTTP security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, Permissions-Policy) and a domain-scoped Content-Security-Policy to every route, without breaking the contact form, video playback, Sanity-sourced images, or the Sanity Studio SPA.

**Architecture:** Two new entries in `next.config.mjs`'s existing `headers()` function — one strict policy matching every route, one permissive CSP override matching only `/sanity-studio/:path*` (Next.js applies the last-matching source's value for a shared header key, so the Studio entry fully replaces `Content-Security-Policy` for that route while the other four headers still apply from the global entry).

**Tech Stack:** Next.js 15.5 `next.config.mjs` `headers()` API. No application code changes — this is server-config only.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-13-was-33-security-headers-design.md` — read it before starting; it contains the full third-party-domain inventory this plan's exact CSP values are derived from.
- HSTS: `max-age=63072000; includeSubDomains` — no `preload` directive.
- CSP is scoped per-route: one strict global policy, one separate full-replacement policy for `/sanity-studio/:path*` only. Do not merge them into a single permissive global policy.
- Ship the CSP enforcing (`Content-Security-Policy` header) directly — no `Content-Security-Policy-Report-Only` rollout phase.
- Exact global CSP value as first implemented in Task 1 (single-line, `; `-separated) - **superseded by Task 3's nonce-based `script-src`, see below; Task 1's version is what actually shipped in that commit and is kept here for the historical record**:
  `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: cdn.sanity.io *.public.blob.vercel-storage.com; media-src 'self' *.public.blob.vercel-storage.com; font-src 'self'; connect-src 'self' https://formspree.io https://o4511723969904640.ingest.us.sentry.io; object-src 'none'; base-uri 'self'; frame-ancestors 'none';`
- Task 3 real (working) global CSP shape - `script-src` becomes `'self' 'nonce-<per-request-value>' 'strict-dynamic'`, generated in `middleware.ts`, not a static string in `next.config.mjs` - every other directive is unchanged from Task 1's value above.
- Exact `/sanity-studio/:path*` CSP value:
  `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: cdn.sanity.io *.public.blob.vercel-storage.com; font-src 'self' data:; connect-src 'self' https://*.api.sanity.io wss://*.api.sanity.io https://cdn.sanity.io https://apicdn.sanity.io; object-src 'none'; base-uri 'self'; frame-ancestors 'none';`
- Other exact header values for the global entry: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=63072000; includeSubDomains`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- Never push to GitHub without the user's explicit in-the-moment confirmation (standing CLAUDE.md rule) — Task 2 stops before pushing/opening a PR and asks.
- **Ordering note for whoever executes this plan:** unlike a typical subagent-driven-development flow (implement → final whole-branch review → then decide push/PR via finishing-a-development-branch), this ticket's DoD requires verification against a real deployed preview, so Task 2 pushes and opens the PR itself — the push happens before the final whole-branch review, not after. Once Task 2 completes, the final whole-branch review still runs (reviewing both commits together), but finishing-a-development-branch should skip its own "push and create PR" option (already done) and instead just confirm the existing PR is in good shape.
- Run `pnpm lint`, `pnpm type-check`, and `pnpm build` before considering Task 1 done (this repo's actual script names — not `lint:fix`/`typecheck`).

---

### Task 1: Add the headers to `next.config.mjs`

**Files:**
- Modify: `next.config.mjs`

**Interfaces:**
- Produces: two new entries returned from the existing `headers()` async function, alongside the untouched `/videos/:path*` entry. No exported/imported interface changes — this is a Next.js config file, not application code.

No test framework applies to a Next.js config function — verification is `pnpm build` (validates the config loads and is syntactically/semantically valid) plus a local `curl -I` check against a running server, in place of an automated test.

- [ ] **Step 1: Add the global headers entry**

In `next.config.mjs`, the current `headers()` function is:

```js
  async headers() {
    return [
      {
        source: '/videos/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
```

Change it to:

```js
  async headers() {
    return [
      {
        source: '/videos/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // WAS-33: baseline security headers for every route. CSP here is
        // the strict policy - /sanity-studio below fully overrides just
        // the Content-Security-Policy value for its own routes, since
        // Next.js applies the last-matching source's value per header key.
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: cdn.sanity.io *.public.blob.vercel-storage.com; media-src 'self' *.public.blob.vercel-storage.com; font-src 'self'; connect-src 'self' https://formspree.io https://o4511723969904640.ingest.us.sentry.io; object-src 'none'; base-uri 'self'; frame-ancestors 'none';",
          },
        ],
      },
      {
        // WAS-33: Sanity Studio is a bundled SPA that needs 'unsafe-inline'
        // and 'unsafe-eval' in script-src, plus its own API/realtime
        // domains in connect-src - scoped to this route only so the rest
        // of the app keeps the strict policy above. Already gated by
        // Basic Auth in middleware.ts (WAS-17).
        source: '/sanity-studio/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: cdn.sanity.io *.public.blob.vercel-storage.com; font-src 'self' data:; connect-src 'self' https://*.api.sanity.io wss://*.api.sanity.io https://cdn.sanity.io https://apicdn.sanity.io; object-src 'none'; base-uri 'self'; frame-ancestors 'none';",
          },
        ],
      },
    ]
  },
```

- [ ] **Step 2: Lint and typecheck**

Run: `pnpm lint && pnpm type-check`
Expected: both clean, zero errors (this is a plain JS object literal change, no TypeScript surface, but both scripts must still pass since they run over the whole repo).

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: build succeeds. This is the closest thing to a "does the config load correctly" test available - a malformed `headers()` return value fails the build, not just a runtime request.

- [ ] **Step 4: Local header verification**

Start the dev server: `pnpm dev &` (or run in the background per your tooling), wait for it to be ready, then:

```bash
curl -sI http://localhost:3000/ | grep -Ei 'x-frame-options|x-content-type-options|referrer-policy|strict-transport-security|permissions-policy|content-security-policy'
curl -sI http://localhost:3000/sanity-studio | grep -Ei 'content-security-policy'
```

Expected:
- The first command shows all six headers with the exact values from Global Constraints, and `content-security-policy` shows the strict (global) value.
- The second command's `content-security-policy` value is the Studio one instead (contains `'unsafe-eval'`), proving the per-route override works. (`/sanity-studio` will also return a `401`/Basic Auth challenge per `middleware.ts` - `curl -I` still shows response headers on a 401, so this doesn't block the check. If your `curl` doesn't show headers on a non-2xx response, add `-o /dev/null` is not needed; `-I` already sends a HEAD-equivalent regardless of status.)

Stop the dev server when done.

- [ ] **Step 5: Commit**

```bash
git add next.config.mjs
git commit -m "feat(infra): add baseline HTTP security headers and CSP"
```

---

### Task 2: Deploy and verify on a real preview (per ticket DoD)

No new files, no application code — this task pushes the branch (Vercel's GitHub integration auto-builds a preview deployment on push, per this repo's existing setup) and then exercises the DoD's manual verification against that real preview, since some of this (real HTTPS behavior, Studio's actual bundled-SPA network calls) can't be fully verified against `localhost`.

**This task requires the user's explicit, in-the-moment confirmation before pushing** — CLAUDE.md's "never push to GitHub" is a standing rule; per this repo's own established pattern (WAS-88), stop and ask before the push/PR step rather than treating a prior confirmation as blanket approval for future pushes.

- [ ] **Step 1: Stop and ask before pushing**

Present the push/PR step to the user explicitly and wait for confirmation, the same way it was handled for WAS-88 - do not push on Task 1's completion alone.

- [ ] **Step 2: Push and open the PR**

```bash
git push -u origin waskarpaulino/was-33-infra-add-baseline-http-security-headers
gh pr create --title "Add baseline HTTP security headers" --body "$(cat <<'EOF'
## Summary

Closes WAS-33

Adds baseline HTTP security headers and a domain-scoped Content-Security-Policy to every route:

- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security` (no `preload`), `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- A strict global CSP derived from a full third-party-domain inventory (Sanity CDN images, Vercel Blob video, the Formspree contact form, Sentry error reporting).
- `/sanity-studio` gets its own separate, more permissive CSP (needs `'unsafe-inline'`/`'unsafe-eval'` since Studio is a bundled SPA) rather than loosening the policy for the rest of the app.

Design spec: `docs/superpowers/specs/2026-07-13-was-33-security-headers-design.md`
Implementation plan: `docs/superpowers/plans/2026-07-13-was-33-security-headers.md`

## Test plan

- [ ] `pnpm lint` / `pnpm type-check` / `pnpm build` pass
- [ ] Headers verified via curl on this PR's Vercel preview, both the root path and `/sanity-studio`
- [ ] Contact form, video playback, Sanity-sourced images, and the Sanity Studio SPA all still work on the preview with devtools console open (no CSP violations)
- [ ] Sentry error reporting still reaches the dashboard

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Wait for the Vercel preview and verify headers via curl**

Get the preview URL (from the PR's Vercel bot comment, or `vercel ls` if the CLI is available), then run the same `curl -sI <preview-url>/` and `curl -sI <preview-url>/sanity-studio` checks as Task 1 Step 4, against the real deployed preview instead of localhost. Confirm the same six headers and the per-route CSP split.

- [ ] **Step 4: Browser verification against the preview**

With browser devtools console open, against the preview URL:
1. Load the homepage - confirm the video plays.
2. Submit the contact form - confirm it still reaches Formspree (check the Network tab for a successful request to `formspree.io`, and/or the form's own success state).
3. Confirm Sanity-sourced images (cast/crew section) still render.
4. Load `/sanity-studio` (Basic Auth prompt first, per WAS-17) - confirm the Studio UI loads and is interactive. Watch the console specifically for any blocked `connect-src`/`script-src` CSP violation.
5. Trigger a harmless client-side error (e.g. via a throwaway `throw new Error(...)` in the browser console) and confirm it reaches the Sentry dashboard - proves `connect-src`'s Sentry ingest domain is correct.

If any of these fail with a CSP violation in the console, note the exact blocked domain/directive from the violation report, update the relevant `next.config.mjs` CSP value (global or Studio-specific, whichever route failed), commit the fix, and re-verify from Step 3.

**Real outcome:** this step found the app renders completely blank on every non-Studio route - `script-src 'self'` blocks Next.js App Router's own inline hydration `<script>` tags. This isn't a missing-domain tweak; it needed Task 3 below (a nonce-based CSP, decided with the user rather than silently patched). After Task 3 lands, re-run this Step 3 and Step 4 in full against the new preview build before continuing to Step 5.

- [ ] **Step 5: Confirm the DoD's "lesson saved" item**

Confirm `docs/superpowers/specs/2026-07-13-was-33-security-headers-design.md`'s "Current state", "Post-deploy finding", and "Decisions" sections already document which domains were allowlisted and why, and the nonce-based `script-src` fix and its cause (they do, from the brainstorming phase and the Task 2/3 finding) - no further action needed.

---

### Task 3: Fix `script-src` to a nonce-based CSP via `middleware.ts`

**Files:**
- Modify: `middleware.ts`
- Modify: `next.config.mjs`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks beyond the CSP shape from Task 1.
- Produces: no exported interface changes. `middleware.ts`'s `matcher` broadens from Studio-only to all routes; its existing Basic Auth behavior for `/sanity-studio` must be provably unchanged (same 401/500 responses in the same cases).

Read the spec's new "Post-deploy finding" section first - it has the full root-cause explanation and the exact reasoning for choosing nonce+`strict-dynamic` over `'unsafe-inline'`.

- [ ] **Step 1: Remove the global CSP entry from `next.config.mjs`**

In `next.config.mjs`, remove just the `Content-Security-Policy` header object from the `/:path*` entry added in Task 1 (keep the other five headers there - `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy` - untouched). The `/sanity-studio/:path*` entry (its own separate `Content-Security-Policy`) is untouched - Studio's existing `'unsafe-inline'`/`'unsafe-eval'` already tolerates Next's inline bootstrap scripts, so it doesn't need a nonce.

The `/:path*` entry's `headers` array should end up as:

```js
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
```

- [ ] **Step 2: Rewrite `middleware.ts` to generate a per-request nonce and set the CSP for non-Studio routes**

Replace the full contents of `middleware.ts` with:

```ts
import { createHash, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

// WAS-17: /sanity-studio was reachable by anyone who found the URL, protected
// only by Sanity's own login on a route with no app-level gate. This app has
// no admin/role concept of its own (single-operator content editor), so a
// full session-auth integration would be overkill for what's really needed
// here - a basic access gate before the route is even served.
function unauthorized() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Sanity Studio"' },
  })
}

// Hashing to a fixed length before comparing means timingSafeEqual never sees
// mismatched buffer lengths, so a plain !== check on user-supplied credentials
// can't leak how much of the secret was guessed correctly via response timing.
function safeEqual(a: string, b: string) {
  const aHash = createHash('sha256').update(a).digest()
  const bHash = createHash('sha256').update(b).digest()
  return timingSafeEqual(aHash, bHash)
}

function studioAuthCheck(req: NextRequest): NextResponse | null {
  const username = process.env.SANITY_STUDIO_USERNAME
  const password = process.env.SANITY_STUDIO_PASSWORD

  if (!username || !password) {
    // Fail closed: an unconfigured gate must not mean "no gate."
    return new NextResponse('Sanity Studio access is not configured', { status: 500 })
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Basic ')) {
    return unauthorized()
  }

  const decoded = Buffer.from(authHeader.slice('Basic '.length), 'base64').toString('utf-8')
  const separatorIndex = decoded.indexOf(':')
  const user = separatorIndex === -1 ? decoded : decoded.slice(0, separatorIndex)
  const pass = separatorIndex === -1 ? '' : decoded.slice(separatorIndex + 1)

  if (!safeEqual(user, username) || !safeEqual(pass, password)) {
    return unauthorized()
  }

  return null
}

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/sanity-studio')) {
    const denied = studioAuthCheck(req)
    if (denied) return denied
    // Studio's own CSP (next.config.mjs, already 'unsafe-inline'/'unsafe-eval')
    // already tolerates Next's inline bootstrap scripts - no nonce needed here.
    return NextResponse.next()
  }

  // WAS-33: script-src 'self' alone blocks Next.js App Router's own inline
  // hydration <script> tags (confirmed live: blank page on every route,
  // self.__next_f never populated). A per-request nonce plus 'strict-dynamic'
  // (Next's own documented CSP pattern) keeps script-src genuinely strict -
  // an attacker's injected inline script still lacks the correct nonce and
  // is blocked - while letting Next's own scripts (and the chunks they
  // dynamically load) run. app/layout.tsx reads this same nonce via
  // headers() to opt the render into using it for Next's own inline scripts.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' data: cdn.sanity.io *.public.blob.vercel-storage.com; media-src 'self' *.public.blob.vercel-storage.com; font-src 'self'; connect-src 'self' https://formspree.io https://o4511723969904640.ingest.us.sentry.io; object-src 'none'; base-uri 'self'; frame-ancestors 'none';`

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 3: Read the nonce in the root layout**

In `app/layout.tsx`, change:

```tsx
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClientProviders } from "@/components/providers/ClientProviders"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Back Against the Wall",
  description:
    "When financial pressure mounts, who do you become? Discover your financial archetype and watch this powerful short film.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
```

to:

```tsx
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { headers } from "next/headers"
import "./globals.css"
import { ClientProviders } from "@/components/providers/ClientProviders"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Back Against the Wall",
  description:
    "When financial pressure mounts, who do you become? Discover your financial archetype and watch this powerful short film.",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // WAS-33: reading the nonce here (set by middleware.ts) is what actually
  // opts this render into using it for Next's own inline bootstrap scripts -
  // per Next's documented CSP pattern, this isn't just an example of how app
  // code could use the nonce, it's required for the framework's own scripts
  // to get nonced. Skipping this reproduces the pre-fix blank-page bug even
  // with the middleware changes in place.
  const nonce = (await headers()).get("x-nonce")

  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true} data-csp-nonce={nonce ?? undefined}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
```

(The `data-csp-nonce` attribute is a debugging aid only, harmless in prod - it lets you visually confirm in devtools that a nonce actually reached the render, without changing behavior.)

- [ ] **Step 4: Lint, typecheck, build**

Run: `pnpm lint && pnpm type-check && pnpm build`
Expected: all clean. Note the pre-existing `middleware.ts` build warning about the Node `crypto` module not being supported in the Edge Runtime is unrelated to this change (it predates WAS-33, from WAS-17) - don't try to fix it as part of this task.

- [ ] **Step 5: Real browser verification locally - not just curl**

This is the step that catches what Task 1's curl-only check missed. Start the dev server (`pnpm dev`), then in an actual browser (not curl):

1. Load `http://localhost:PORT/` (whatever port `pnpm dev` binds - it may not be 3000 if something else is already listening).
2. Confirm the page actually renders visible content (not a blank white page).
3. Open devtools console - confirm no CSP violation errors ("Refused to execute inline script...", "Refused to load the script...", etc.).
4. As an extra concrete check (open devtools console and run): `document.body.innerText.length > 0` should be `true`, and if you want to directly confirm hydration ran: `window.__NEXT_DATA__ !== undefined` or checking that interactive elements (buttons, the sign-in modal trigger, etc.) actually respond to clicks.

If the page is still blank: re-check that `middleware.ts`'s matcher actually covers the route you're testing, that `app/layout.tsx`'s `headers()` read is in the actual render path (not skipped by some caching/static-generation behavior - note this route may now be forced dynamic, which is expected and fine), and that the nonce value in the CSP response header (check via Network tab) matches what's rendered into the page's script tags (each Next-emitted inline `<script nonce="...">` should carry the exact nonce value from this request's CSP header, not a stale/different one). Iterate rather than reporting success on a hunch - this exact "looks right but isn't" failure mode is what caused the original bug to ship past Task 1.

- [ ] **Step 6: Confirm `/sanity-studio`'s Basic Auth behavior is unchanged**

```bash
curl -sI http://localhost:PORT/sanity-studio
```

Expected: same `401` (or `500` if `SANITY_STUDIO_USERNAME`/`PASSWORD` aren't set locally, per the pre-existing fail-closed design) as before this task - the matcher broadening must not have altered Studio's own gating logic. Also confirm via curl that Studio's `Content-Security-Policy` header is unchanged from Task 1 (still the static `'unsafe-inline' 'unsafe-eval'` policy, no nonce).

- [ ] **Step 7: Commit**

```bash
git add middleware.ts next.config.mjs app/layout.tsx
git commit -m "fix(infra): use nonce-based CSP for script-src to fix broken hydration"
```

---

## Definition of Done mapping

- Headers verified present via browser devtools/curl on a deployed preview → Task 2 Steps 3-4 (re-run after Task 3).
- No functionality broken by the new CSP → Task 2 Step 4 (re-run after Task 3); Task 3 Step 5 catches the hydration-breaking regression Task 2 first surfaced.
- Tests/lint/typecheck pass → Task 1 Steps 2-3, Task 3 Step 4 (no unit tests exist for config files; `pnpm build` is the closest equivalent).
- PR body says `Closes WAS-33` → Task 2 Step 2.
- Lesson saved → satisfied by the committed design spec's "Post-deploy finding" section (Task 2 Step 5 / Task 3 confirm it).
