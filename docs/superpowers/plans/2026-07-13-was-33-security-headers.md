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
- Exact global CSP value (single-line, `; `-separated):
  `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: cdn.sanity.io *.public.blob.vercel-storage.com; media-src 'self' *.public.blob.vercel-storage.com; font-src 'self'; connect-src 'self' https://formspree.io https://o4511723969904640.ingest.us.sentry.io; object-src 'none'; base-uri 'self'; frame-ancestors 'none';`
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

- [ ] **Step 5: Confirm the DoD's "lesson saved" item**

Confirm `docs/superpowers/specs/2026-07-13-was-33-security-headers-design.md`'s "Current state" and "Decisions" sections already document which domains were allowlisted and why (they do, from the brainstorming phase) - no further action needed. If Step 4 required a CSP fix, add a short note to the spec's "Decisions" section recording what was actually missing and why, so the lesson reflects reality rather than just the pre-deploy guess.

---

## Definition of Done mapping

- Headers verified present via browser devtools/curl on a deployed preview → Task 2 Steps 3-4.
- No functionality broken by the new CSP → Task 2 Step 4.
- Tests/lint/typecheck pass → Task 1 Steps 2-3 (no unit tests exist for a config file; `pnpm build` is the closest equivalent).
- PR body says `Closes WAS-33` → Task 2 Step 2.
- Lesson saved → already satisfied by the committed design spec (Task 2 Step 5 confirms it, updates it if reality diverged from the pre-deploy guess).
