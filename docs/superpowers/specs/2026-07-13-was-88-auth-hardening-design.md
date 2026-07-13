# WAS-88: Harden password reset and email verification for production

## Problem

WAS-32 shipped the password-reset and email-verification flow with several
production-readiness items deliberately deferred (flagged in its own design
doc, `docs/superpowers/specs/2026-07-11-was-32-password-reset-email-verification-design.md`,
and its whole-branch security review). This ticket closes the two real ones
before the flow is exposed to real users at scale, plus one small polish item
bundled in because it's cheap while reset-password code is already in flight.

Rate limiting on these routes was deferred too, but is tracked separately in
WAS-10 (done) rather than duplicated here.

## Current state (relevant facts)

- Auth is a stateless 7-day JWT in an httpOnly cookie (`lib/jwt.ts`), payload
  `{ userId }`. `signToken`/`verifyToken` have no DB dependency today -
  `getUserIdFromRequest` only decodes and validates the JWT signature/expiry.
- `AuthService.resetPassword` (`lib/auth.ts`) updates `passwordHash` and
  clears the reset-token fields, but never touches anything a live session
  could check against - an attacker holding a stolen-but-still-valid cookie
  stays logged in until natural 7-day expiry, even after the legitimate user
  resets their password specifically to lock them out.
- `reset-password` does not log the user back in (no new token issued) - the
  user must sign in again afterward with the new password. This matters for
  the invalidation design below: the reset itself is not expected to leave
  the resetting device with a valid session either.
- Every authenticated route funnels through `getUserIdFromRequest`: `/api/
  auth/profile`, `/api/auth/me`, `/api/quiz/submit`, `/api/quiz/results`,
  `/api/quiz/[id]/update`. A change there applies uniformly with no
  per-route code changes.
- `middleware.ts` (Sanity Studio Basic Auth gate) does not use `lib/jwt.ts`,
  so there's no edge-runtime constraint stopping `getUserIdFromRequest` from
  taking on a DB dependency - it already only ever runs in Node route
  handlers, which already talk to Mongoose elsewhere.
- `EMAIL_FROM`/`RESEND_API_KEY`/`NEXT_PUBLIC_APP_URL` are already env-driven
  (`lib/email.ts`, `lib/resend.ts`, documented in README). Dev currently
  points at Resend's `onboarding@resend.dev` sandbox address, which can only
  deliver to the Resend account owner's own inbox.
- `resetPasswordSchema.password` and `signUpSchema.password`
  (`lib/validation.ts`) both only enforce `min(1)` server-side. The real
  complexity rule (`min(8)` + letter-and-digit regex) exists only in
  `signUpFormSchema`, which is client-side validation in `SignUpModal.tsx`
  - a request that skips the UI (curl, a compromised client, a future API
    consumer) can set an arbitrarily weak password today.

## Decisions

- **Session invalidation store: `passwordChangedAt` on the Mongo `User`
  doc**, not a `tokenVersion` counter and not Redis.
  - `passwordChangedAt` vs `tokenVersion`: functionally equivalent for this
    single use case (invalidate everything issued before a reset). A
    timestamp needs no new JWT claim - it's checked against the JWT's
    standard `iat`, which `jsonwebtoken` already sets on every `sign()`
    call. A counter would need an explicit claim written and compared for
    no added benefit, since we don't need to distinguish *why* a session
    was invalidated.
  - Mongo vs Redis (the WAS-10 Upstash instance already exists and could
    hold a fast-lookup counter): rejected. It would add a new failure mode
    - Redis unavailable means either every authenticated request fails
      open (invalidation silently stops being enforced) or fails closed
      (a Redis outage becomes a site-wide auth outage) - to save one
      indexed Mongo lookup by `_id` on an app at this scale. The DB is
      already in the request path for other checks; reusing it keeps the
      failure modes the same as everything else.
  - Accepted trade-off: `getUserIdFromRequest` goes from a pure
    signature/expiry check to one that also does a DB read. This is
    inherent to any real revocation mechanism for a stateless JWT - there
    is no way to invalidate a self-contained token without checking
    *something* server-side on each use.
- **Domain verification (item 1) is ops work, not code work this session.**
  The code is already fully parameterized by env vars; there is nothing to
  change. This spec documents the manual steps; the human operator executes
  them outside this repo (DNS access, Resend dashboard).
- **Password strength (item 3) is in scope**, tightened on both
  `signUpSchema` and `resetPasswordSchema` together, reusing the exact rule
  `signUpFormSchema` already enforces client-side rather than inventing a
  new one.
- **Timing-oracle hardening (item 4) stays out of scope.** The ticket
  itself frames it as a future revisit ("if this becomes a real threat
  vector"), not a DoD item.

## Design

### Data model

`models/User.ts` gains one field:

```ts
passwordChangedAt?: Date
```

Not `select: false` - unlike the token-hash fields, this isn't a secret, and
`getUserIdFromRequest` needs to read it on every authenticated request
without every caller needing to opt back in with `.select('+...')`.

### Backend: session invalidation

- `AuthService.resetPassword` (`lib/auth.ts`): the existing
  `findByIdAndUpdate` that sets `passwordHash` also sets
  `passwordChangedAt: new Date()`.
- `lib/jwt.ts`:
  - `getUserIdFromRequest` gains a DB step after `verifyToken` succeeds:
    fetch `User.findById(decoded.userId).select('passwordChangedAt').lean()`.
    - No user found (deleted account) -> return `null`.
    - `user.passwordChangedAt` set AND the JWT's `iat` (seconds) predates
      it -> return `null`. Comparison: `decoded.iat * 1000 <
      passwordChangedAt.getTime()`.
    - Otherwise (no `passwordChangedAt` yet, or `iat` is at/after it) ->
      return `decoded.userId` as today.
  - `JwtPayload`'s decoded shape now also carries `iat` (added by
    `jsonwebtoken` automatically on every `sign()`; no change to
    `signToken`'s call site or the `{ userId }` payload it's given).
  - This is the only file that changes for every downstream route - no
    route-level code touches this.

### Backend: password strength

`lib/validation.ts`:

```ts
export const signUpSchema = z.object({
  // ...
  password: z
    .string()
    .min(8)
    .regex(/(?=.*[a-zA-Z])(?=.*\d)/),
  // ...
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .regex(/(?=.*[a-zA-Z])(?=.*\d)/),
})
```

Same rule, no new messages needed server-side (the route already returns
`parsed.error.flatten()` on a 400; the UI-facing messages stay in
`signUpFormSchema`, which is unaffected since it already enforces the
stricter rule and just gains a redundant-but-harmless server-side match).

### Email domain (ops runbook, not code)

Documented here for the operator to execute outside this session:

1. In the Resend dashboard, add the production sending domain.
2. Add the SPF and DKIM DNS records Resend provides at the domain's DNS
   provider.
3. Wait for DNS propagation, click verify in Resend.
4. Update `EMAIL_FROM` in the production environment (e.g.
   `noreply@<domain>`) - no code change, this is an env var flip.
5. Send a real test reset/verification email to a non-Resend-owner address
   to confirm delivery.

### Testing

- `lib/jwt.test.ts`: currently has zero DB dependency (real `signToken`/
  `verifyToken`/`getUserIdFromRequest` against a test JWT secret only). Add
  mocks for `@/lib/mongoose` (`connectDB` as a no-op) and `@/models/User`
  (`findById` chain returning a stub), matching `lib/auth.test.ts`'s
  existing mocking pattern. New cases:
  - No `passwordChangedAt` on the user doc -> token accepted (covers every
    user who has never reset their password).
  - `iat` at/after `passwordChangedAt` -> accepted (a token issued by
    signing in *after* the reset).
  - `iat` before `passwordChangedAt` -> rejected (`null`), covering the
    ticket's actual scenario: device A's still-valid cookie after device B
    resets the password.
  - User not found -> rejected (`null`).
- `lib/auth.test.ts`: extend the existing `resetPassword` `describe` block
  to assert the `findByIdAndUpdate` call now includes `passwordChangedAt`.
- `lib/validation.ts` / route tests: weak-password (`min(1)`-passing but
  `min(8)`-or-complexity-failing) payloads now 400 on both
  `/api/auth/signup` and `/api/auth/reset-password`, mirroring the existing
  NoSQL-injection-shaped-payload test style in those route test files.

## Definition of Done (from ticket)

- [ ] Password-reset and verification emails deliver to arbitrary real user
      addresses, not just the Resend account owner. *(Ops runbook above;
      verified by the operator outside this session, not by code changes.)*
- [ ] Resetting a password invalidates other active sessions for that user
      (sign in on device A, reset on device B, confirm device A is
      rejected on its next request).
- [ ] Tests / lint / typecheck pass.
- [ ] PR body says `Closes WAS-88`.
- [ ] Document the `passwordChangedAt` session-invalidation pattern (this
      spec) for reuse by future flows that need to invalidate sessions
      (email change, account deletion).
