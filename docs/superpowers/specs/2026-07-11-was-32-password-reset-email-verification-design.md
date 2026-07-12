# WAS-32: Password reset and email verification flow

## Problem

`app/api/auth/*` only has signin, signup, signout, me, and profile. There's
no way for a user who forgets their password to recover their account, and
no email-verification step at signup. Sequenced after WAS-19 (email
normalization) since a reset flow keyed by email should operate on
normalized emails to avoid the same case-sensitivity bug resurfacing.

## Current state (relevant facts discovered during investigation)

- Stack: Next.js 15.5 App Router, Mongoose/MongoDB, `bcryptjs` +
  `jsonwebtoken` + httpOnly cookie sessions (cookie name `token`, payload
  `{ userId }`, 7-day expiry). No NextAuth despite `NEXTAUTH_URL`/
  `NEXTAUTH_SECRET` existing in `.env.local` (vestigial, unused).
- `models/User.ts` has no `emailVerified` field and no token fields —
  greenfield.
- WAS-19's `normalizeEmail()` (lowercase + trim) lives in `lib/auth.ts` and
  runs before every `findOne` in `AuthService.signUp`/`signIn`. New
  email-keyed lookups (reset, resend-verification) must normalize the same
  way.
- **No transactional email capability exists today.** The ticket suggested
  reusing Formspree from the contact form, but `components/ContactForm.tsx`
  does a client-side `fetch` directly to a public Formspree form endpoint
  (no API key, forwards to the site owner's inbox) — it cannot send a
  dynamic-token link to an arbitrary user's own address. `@formspree/react`
  is installed but unused. A real provider is required.
- No token-generation utility exists (`lib/jwt.ts` is JWT-only, no
  `lib/tokens.ts`, no `crypto` usage anywhere in `lib/`/`app/`).
- Modal system: `components/home/useHomeController.ts` manages a single
  `activeModal: ModalKey` via `useReducer` (post-WAS-47 refactor from six
  booleans). `SignInModal`/`SignUpModal` are Radix Dialog components with
  plain controlled inputs (no react-hook-form despite it being installed),
  `#B95D38` brand styling.
- `hooks/useAuth.tsx` is a Context provider wrapping `fetch` calls to the
  existing auth routes; new methods should follow its
  `setLoading` → `fetch` → throw-on-`!res.ok` → `finally setLoading(false)`
  shape.
- Tests: `vitest`, colocated `*.test.ts`. Route tests mock the service layer
  and construct plain `Request` objects; service tests
  (`lib/auth.test.ts`) mock `@/mongoose`, `bcryptjs`, `@/models/User` and
  exercise `AuthService` directly. New zod schemas belong in
  `lib/validation.ts` (WAS-8 convention: validate before touching Mongoose,
  to block NoSQL-operator-injection via non-string fields).

## Decisions

- **Email provider: Resend.** Free tier is generous, SDK is simple, good
  Next.js fit. Requires a verified sending domain for prod (dev can use
  Resend's `onboarding@resend.dev` sandbox address).
- **Token design: random bytes, hashed in DB.** `crypto.randomBytes(32)` →
  raw token goes in the email link; SHA-256 hash of it is stored on the User
  doc with an expiry. Lookup is by hash, so a DB read/leak never exposes a
  usable token. This is the pattern future token-based flows (e.g. invite
  links) should reuse — see `lib/tokens.ts`.
  - Rejected alternative: signed JWTs (`{ userId, purpose }`). No new DB
    fields needed, but true single-use requires extra bookkeeping (a
    used-tokens set, or similar) since a valid JWT stays valid until
    expiry regardless of DB state.
- **Scope: both flows in one PR.** They share the same email infra and
  token pattern; splitting would mean standing up Resend twice or stacking
  PRs for no real isolation benefit.
- **`emailVerified` is display-only in this ticket** — no existing action
  gets blocked. Add the field, show status, no enforcement. Gating specific
  actions is a deliberate fast-follow, not built here.
- **UI: modal for the request step, dedicated pages for the confirm step.**
  "Forgot your password?" in `SignInModal` opens a new `ForgotPasswordModal`
  (fits the existing `activeModal` pattern). But `/reset-password` and
  `/verify-email` are dedicated pages, since both are entry points from an
  email link — the user lands cold on a URL, not from in-app modal state.

## Design

### Infrastructure & data model

- Env vars (documented in README under a new `# Email` heading; no
  `.env.example` exists in this repo, none added): `RESEND_API_KEY`,
  `EMAIL_FROM`, `NEXT_PUBLIC_APP_URL` (base URL for building reset/verify
  links — also new).
- `lib/resend.ts` — thin Resend client singleton.
- `lib/tokens.ts`:
  ```ts
  generateToken(): { token: string; tokenHash: string }
  hashToken(token: string): string
  ```
- `lib/email.ts` — `sendPasswordResetEmail(to, token)`,
  `sendVerificationEmail(to, token)`. Inline HTML templates (no
  react-email/MJML — not worth the dependency for two emails).
- `models/User.ts` additions, all `select: false`:
  ```ts
  emailVerified: { type: Boolean, default: false }
  resetPasswordTokenHash?: string
  resetPasswordExpires?: Date
  emailVerificationTokenHash?: string
  emailVerificationExpires?: Date
  ```
  Reset token expiry: 1 hour. Verification token expiry: 24 hours.

### Backend

New `AuthService` methods in `lib/auth.ts`:

- `requestPasswordReset(email)` — normalizes email, looks up user. If
  found: generates token, stores hash + expiry, sends email. If not found:
  no-op. Caller (route) always returns the same generic success message
  either way — prevents email enumeration.
- `resetPassword(token, newPassword)` — hashes incoming token, looks up by
  `resetPasswordTokenHash`, checks expiry. Valid: bcrypt-hashes new
  password, clears both reset fields (single-use). Invalid/expired: throws
  one generic "invalid or expired token" error — doesn't distinguish which,
  same anti-enumeration reasoning.
- `verifyEmail(token)` — same shape against the verification fields, sets
  `emailVerified = true` on success.
- `signUp` addition: after creating the user, generate + store a
  verification token and send the verification email, wrapped in
  try/catch — an email-provider outage logs a warning but doesn't block
  account creation.

New routes (zod-validate → service-call → JSON, matching existing
signin/signup shape):

| Route | Body | Behavior |
|---|---|---|
| `POST /api/auth/request-reset` | `{ email }` | Always 200, generic message |
| `POST /api/auth/reset-password` | `{ token, password }` | 200 success; 400 invalid/expired token or weak password (reuses `signUpSchema` password rules) |
| `POST /api/auth/verify-email` | `{ token }` | 200 success; 400 invalid/expired token |
| `POST /api/auth/resend-verification` | `{ email }` | Same generic-response pattern as request-reset |

`resend-verification` isn't explicitly listed in the ticket but is included
because without it, a user whose 24h verification window lapses has no way
to ever verify — it reuses the exact signup token-gen + email-send path.

New zod schemas in `lib/validation.ts`: `requestResetSchema`,
`resetPasswordSchema`, `verifyEmailSchema`, `resendVerificationSchema`.

`AuthService.getUserProfile`'s existing `.select('-passwordHash')` (WAS-7
chokepoint) extends to also exclude the four new token-hash fields.

### Frontend

- `ModalKey` gains `'forgotPassword'`. New `ForgotPasswordModal.tsx`
  (mirrors `SignInModal`/`SignUpModal` styling): single email field, calls
  `useAuth().requestPasswordReset(email)`, always shows the same generic
  success message (client-side reinforcement of anti-enumeration).
- `SignInModal` gets a "Forgot your password?" button under the password
  field, wired through a new `onSwitchToForgotPassword` prop /
  `controller.switchToForgotPassword()` action.
- `app/reset-password/page.tsx` — reads `?token=`. Form: new password +
  confirm. States: no token → error + link home; success → confirmation +
  link to sign in; invalid/expired → error surfaced from the API.
- `app/verify-email/page.tsx` — reads `?token=`, calls
  `useAuth().verifyEmail(token)` on mount. States: verifying → success
  (link into the app) → invalid/expired (message + an email input to
  trigger resend-verification).
- `hooks/useAuth.tsx` gains `requestPasswordReset`, `resetPassword`,
  `verifyEmail`, `resendVerification`, following the existing method shape.
- `/api/auth/me` response includes `emailVerified`. A dismissible banner
  shows when `user.emailVerified === false` with a resend-verification
  link, placed in the authenticated home shell — display only, no gating.

### Error handling & security

- Anti-enumeration: `request-reset`/`resend-verification` always 200 with a
  generic message; `reset-password`/`verify-email` always the same generic
  "invalid or expired token" error, regardless of which case actually
  failed.
- Single-use: both token flows clear their hash + expiry fields on
  successful consumption — a replayed link fails the lookup.
- No constant-time-compare concern: lookup is by indexed hash field via a
  Mongo query, not an application-level string comparison, so there's no
  meaningful timing side-channel.
- `reset-password` reuses `signUpSchema`'s existing password strength
  rules rather than inventing new ones.
- **Explicitly out of scope**: rate-limiting on `request-reset`/
  `resend-verification` (no existing rate-limit infra to extend, not
  required by the ticket's DoD). Flagged as a deliberate omission — worth a
  fast-follow before this is exposed to real users at scale, since an
  unauthenticated endpoint that sends email on demand is an email-bombing
  vector against a victim's inbox.

### Testing

- `lib/tokens.test.ts` (new): generate/hash round-trip, hash determinism,
  raw token not recoverable from hash.
- `lib/auth.test.ts`: new `describe` blocks for `requestPasswordReset`,
  `resetPassword`, `verifyEmail` (found/not-found, valid/expired/wrong
  token, single-use field-clearing verified), plus an assertion that
  `signUp` now also triggers a verification email.
- Route tests mirroring `signin/route.test.ts`: one file each for
  `request-reset`, `reset-password`, `verify-email`,
  `resend-verification` — NoSQL-injection-shaped payload → 400,
  missing/invalid fields → 400, non-JSON body → 400, happy path → 200 with
  the service mocked.
- No new component tests unless `SignInModal`/`SignUpModal` already have
  precedent for them (coverage level to be matched, not raised, once the
  frontend files are in hand).

## Definition of Done (from ticket)

- [ ] User can request a reset email and successfully set a new password
      via the link.
- [ ] User can verify their email via a sent link.
- [ ] Tokens expire and are single-use.
- [ ] Tests / lint / typecheck pass.
- [ ] PR body says `Closes WAS-32`.
- [ ] Token-signing pattern documented (`lib/tokens.ts`, this spec) for
      reuse by future token-based flows (e.g. invite links).
