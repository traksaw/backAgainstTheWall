# WAS-33: Add baseline HTTP security headers

## Problem

The only header configured anywhere is `Cache-Control` on `/videos/:path*`
(`next.config.mjs`) — no CSP, `X-Frame-Options`, `X-Content-Type-Options`,
`Referrer-Policy`, HSTS, or `Permissions-Policy`. Baseline protection
against clickjacking, MIME-sniffing, and a compromised third-party script
is missing.

## Current state (relevant facts discovered during investigation)

A full third-party-domain inventory was run against the live codebase
before designing the CSP, since a missed domain means a broken feature in
production, not just a lint warning:

- **script-src:** no external `<script src>` tags, no inline scripts, no
  `eval` anywhere in the main app - `'self'` is sufficient. `/sanity-studio`
  (`app/sanity-studio/[[...tool]]/page.tsx`, `sanity.config.ts`) is the one
  exception: `next-sanity/studio`'s `NextStudio` is a webpack-bundled SPA
  that needs `'unsafe-inline'` and `'unsafe-eval'`. That route is already
  gated separately by `middleware.ts`'s Basic Auth (WAS-17).
- **style-src:** `'unsafe-inline'` is required app-wide, not just on
  Studio - `styled-jsx` (`<style jsx>`) in `components/CastCrewCarousel.tsx`
  and `components/CastCrewGrid.tsx`, plus a `dangerouslySetInnerHTML`
  dynamic `<style>` tag with runtime color values in `components/ui/chart.tsx`
  (content too dynamic to hash). Tailwind itself compiles to a static CSS
  file and needs no allowance.
- **img-src:** `cdn.sanity.io` and `*.public.blob.vercel-storage.com` are
  already in `next.config.mjs`'s `images.remotePatterns` - CSP `img-src`
  mirrors that list 1:1, plus `data:` for `next/image` blur placeholders.
- **media-src:** the homepage film is a direct `<video src>` pointing at a
  Vercel Blob URL (`components/home/HomeInteractiveShell.tsx`), bypassing
  `next/image` entirely (`VideoPlayer.tsx` just plays whatever `src` it's
  given). Needs the same Vercel Blob wildcard as `img-src`, not the one
  specific hostname found in dev - a different Blob store per environment
  would otherwise break silently in another environment.
- **connect-src:** `components/ContactForm.tsx` does a raw `fetch` to
  `https://formspree.io/f/mldllrrw` (not via the installed-but-unused
  `@formspree/react`). Sentry's client SDK (`instrumentation-client.ts`)
  sends beacons directly to `o4511723969904640.ingest.us.sentry.io` - no
  `tunnelRoute` is configured in `next.config.mjs`'s `withSentryConfig`
  call, so this is a real external origin, not a same-origin proxy.
- **font-src:** none needed - Inter is loaded via `next/font/google`
  (`app/layout.tsx`), self-hosted at build time. No Google Fonts link tag.
- **frame-src:** none needed - no `<iframe>` anywhere in the repo.
- All `/api/*` routes are same-origin (Mongoose via `lib/mongoose.ts`) -
  confirmed no browser code calls a MongoDB Atlas Data API or similar
  directly. `lib/supabase.ts` is fully commented-out dead code, irrelevant
  here.
- **Dormant risk, not this ticket's scope:** `lib/sanity.ts` builds a
  `@sanity/client` with `token: process.env.SANITY_API_TOKEN`, imported by
  the client component `app/test-sanity/page.tsx`. Currently harmless
  because the functions it powers (`getCastAndCrew`/`getSupporters`) return
  static fallback data - Sanity fetching from the main app is effectively
  disabled. If that's ever re-enabled, it would need `api.sanity.io` added
  to the *global* `connect-src`, not just Studio's, and separately raises a
  client-side-token-leak question outside this ticket's scope.

## Decisions

- **CSP is scoped per-route, not one global permissive policy.** A
  separate `headers()` entry matches `/sanity-studio/:path*` with its own
  full CSP string (Next.js applies the last-matching source's value for a
  given header key over the whole app, so this fully replaces the global
  CSP for Studio routes rather than diffing against it - the block must
  restate every directive, not just the ones that differ). Every other
  route gets the strict policy. Rejected alternative: one global policy
  loose enough for Studio - simpler, but every other route would inherit
  `script-src 'unsafe-eval'`/`'unsafe-inline'` it doesn't need, which is a
  meaningfully larger XSS blast radius for a real attack surface (Studio's
  own auth gate already scopes who reaches that route at all; a global
  loose policy would extend the same weakness to every unauthenticated
  public page).
- **HSTS without `preload`.** `max-age=63072000; includeSubDomains`, no
  `preload` directive. `preload` submits the domain to browsers'
  built-in preload lists - effectively a one-way door (removal requires a
  manual `hstspreload.org` request and can take months to fully roll back
  across shipped browsers). Still fully enforces HTTPS after a visitor's
  first request without that irreversible commitment.
- **Enforce the CSP directly, no report-only rollout phase.** Given the
  domain inventory above is already thorough and the ticket's own DoD is
  manual verification on a deployed preview, ship
  `Content-Security-Policy` (enforcing) directly rather than
  `Content-Security-Policy-Report-Only` first. Matches the ticket's 2-point
  scope - a report-only phase would add a second PR round-trip the ticket
  doesn't call for.
- **Baseline hardening directives beyond the ticket's literal list:**
  `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`,
  `frame-ancestors 'none'`. Standard, zero-risk additions - nothing in this
  app uses plugins/objects, base-tag tricks, or expects to be embedded via
  iframe by another site. Included because the ticket is explicitly titled
  "baseline HTTP security headers," and these are the conventional
  baseline beyond the four named header types.
- **`frame-ancestors 'none'` (CSP) is included alongside `X-Frame-Options:
  DENY`**, not instead of it. `frame-ancestors` supersedes
  `X-Frame-Options` in modern browsers, but the ticket explicitly asks for
  `X-Frame-Options: DENY` as its own header, and keeping both costs
  nothing (older-browser defense in depth).
- **Sanity Studio's exact `connect-src` additions
  (`https://*.api.sanity.io`, `wss://*.api.sanity.io`,
  `https://apicdn.sanity.io`) are a best-guess from Sanity's own hosting
  docs, not confirmed against this specific codebase** (Studio's realtime/
  editing API calls happen inside the bundled Studio SPA, not in this
  repo's own source). The plan's verification step explicitly watches
  devtools console on `/sanity-studio` during preview testing and iterates
  if a real request is blocked - this is exactly what the DoD's manual
  verification step exists to catch.

## Design

### `next.config.mjs` changes

The existing `headers()` function gains two more entries (after the
existing `/videos/:path*` one, which is untouched):

1. `source: '/:path*'` (every route) - the baseline headers plus the
   strict CSP:
   ```
   X-Frame-Options: DENY
   X-Content-Type-Options: nosniff
   Referrer-Policy: strict-origin-when-cross-origin
   Strict-Transport-Security: max-age=63072000; includeSubDomains
   Content-Security-Policy:
     default-src 'self';
     script-src 'self';
     style-src 'self' 'unsafe-inline';
     img-src 'self' data: cdn.sanity.io *.public.blob.vercel-storage.com;
     media-src 'self' *.public.blob.vercel-storage.com;
     font-src 'self';
     connect-src 'self' https://formspree.io https://o4511723969904640.ingest.us.sentry.io;
     object-src 'none';
     base-uri 'self';
     frame-ancestors 'none';
   ```
2. `source: '/sanity-studio/:path*'` - only `Content-Security-Policy`,
   which fully overrides the entry above for this route:
   ```
   Content-Security-Policy:
     default-src 'self';
     script-src 'self' 'unsafe-inline' 'unsafe-eval';
     style-src 'self' 'unsafe-inline';
     img-src 'self' data: cdn.sanity.io *.public.blob.vercel-storage.com;
     font-src 'self' data:;
     connect-src 'self' https://*.api.sanity.io wss://*.api.sanity.io https://cdn.sanity.io https://apicdn.sanity.io;
     object-src 'none';
     base-uri 'self';
     frame-ancestors 'none';
   ```
   (`X-Frame-Options`/`X-Content-Type-Options`/`Referrer-Policy`/HSTS from
   the `/:path*` entry above still apply to this route too, since those
   header keys aren't redefined here - only `Content-Security-Policy` is
   route-specific.)

The actual header value in code is a single-line string (CSP directives
separated by `; `) - the multi-line form above is for readability in this
document only.

### Testing

No unit-testable surface here (this is server-config, not application
code) - verification is manual, per the ticket's own DoD:

1. Deploy to a Vercel preview.
2. `curl -I` the preview URL and confirm all five headers
   (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
   `Strict-Transport-Security`, `Content-Security-Policy`) are present with
   the exact values above.
3. `curl -I` `/sanity-studio` on the same preview and confirm its
   `Content-Security-Policy` differs from the root path's (Studio's
   permissive one), while the other four headers are unchanged.
4. In a real browser against the preview, with devtools console open:
   - Load the homepage, confirm the video plays.
   - Submit the contact form, confirm it still reaches Formspree.
   - Confirm Sanity-sourced images (cast/crew) still render.
   - Load `/sanity-studio` (Basic Auth prompt first, per WAS-17), confirm
     the Studio UI loads and is interactive - watch the console for any
     blocked `connect-src`/`script-src` violation and adjust the Studio CSP
     block if one appears.
5. Confirm Sentry error reporting still works (trigger a harmless client
   error, confirm it appears in the Sentry dashboard) - proves
   `connect-src`'s Sentry ingest domain is correct.

### Lesson to save (DoD item)

This design doc's "Current state" and "Decisions" sections above already
record which domains were allowlisted and why - satisfies the DoD's
"save the lesson" item once committed, no separate file needed.

## Definition of Done (from ticket)

- [ ] Headers verified present via browser devtools/curl on a deployed
      preview.
- [ ] No functionality broken by the new CSP.
- [ ] Tests / lint / typecheck pass.
- [ ] PR body says `Closes WAS-33`.
- [ ] Lesson saved (this doc's "Current state"/"Decisions" sections).
