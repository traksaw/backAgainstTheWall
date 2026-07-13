# WAS-88: Harden password reset and email verification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a password reset invalidate any other active session for that user, and stop accepting weak passwords server-side on signup/reset — closing the two real production-readiness gaps deferred from WAS-32.

**Architecture:** Add a `passwordChangedAt` timestamp to the Mongo `User` doc, set it whenever `AuthService.resetPassword` succeeds, and check it against the JWT's standard `iat` claim inside `getUserIdFromRequest` (`lib/jwt.ts`) — the single chokepoint every authenticated route already calls. Separately, promote the existing client-side password complexity rule into `lib/validation.ts` so it's enforced server-side on both signup and reset.

**Tech Stack:** Next.js 15.5 App Router route handlers, Mongoose/MongoDB, `jsonwebtoken`, `zod`, `vitest`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-13-was-88-auth-hardening-design.md` — read it before starting; this plan implements it verbatim.
- Session invalidation store is `passwordChangedAt` on the Mongo `User` doc — not a `tokenVersion` counter, not Redis (see spec's "Decisions" for why).
- `passwordChangedAt` is a plain (not `select: false`) field on `models/User.ts`.
- Password complexity rule to reuse everywhere: `min(8)` + `/(?=.*[a-zA-Z])(?=.*\d)/` (already lives in `signUpFormSchema`, `lib/validation.ts`) — don't invent a new rule.
- Item 1 (verified sending domain) and item 4 (timing-oracle hardening) are out of scope for this plan — item 1 is an ops runbook (doc only, no code), item 4 is explicitly deferred by the ticket.
- Run `pnpm lint:fix && pnpm typecheck` before considering any task done; run the affected `pnpm vitest run <file>` for each task's tests.

---

### Task 1: `passwordChangedAt` set on password reset

**Files:**
- Modify: `models/User.ts`
- Modify: `lib/auth.ts` (`AuthService.resetPassword`, ~line 142-159)
- Test: `lib/auth.test.ts` (existing `describe('AuthService.resetPassword (WAS-32)', ...)` block, ~line 231-264)

**Interfaces:**
- Produces: `IUser.passwordChangedAt?: Date` — consumed by Task 2's `getUserIdFromRequest`.

- [ ] **Step 1: Extend the existing resetPassword test to assert `passwordChangedAt` is set**

In `lib/auth.test.ts`, replace the `'hashes the new password and clears the reset token fields on success'` test body with:

```ts
  it('hashes the new password, sets passwordChangedAt, and clears the reset token fields on success', async () => {
    findOneMock.mockResolvedValue({ _id: 'user-a' })
    findByIdAndUpdateMock.mockResolvedValue(undefined)

    await AuthService.resetPassword('good-token', 'newpassword123')

    expect(findOneMock).toHaveBeenCalledWith({
      resetPasswordTokenHash: 'hashed-good-token',
      resetPasswordExpires: { $gt: expect.any(Date) },
    })
    expect(findByIdAndUpdateMock).toHaveBeenCalledWith(
      'user-a',
      expect.objectContaining({
        passwordHash: 'hashed-password',
        passwordChangedAt: expect.any(Date),
        $unset: { resetPasswordTokenHash: 1, resetPasswordExpires: 1 },
      })
    )
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run lib/auth.test.ts -t "resetPassword"`
Expected: FAIL — `findByIdAndUpdateMock` was called without a `passwordChangedAt` property, so `objectContaining` doesn't match.

- [ ] **Step 3: Add the field to the User model**

In `models/User.ts`, add to the `IUser` interface (after `emailVerificationExpires?: Date`):

```ts
  emailVerificationExpires?: Date
  passwordChangedAt?: Date
```

Add to the schema definition (after the `emailVerificationExpires: Date,` line), with a comment explaining why it isn't `select: false` like the token-hash fields above it:

```ts
    emailVerificationExpires: Date,
    // WAS-88: unlike the token-hash fields above, this isn't a secret - it's
    // read on every authenticated request (lib/jwt.ts getUserIdFromRequest)
    // to invalidate JWTs issued before the last password reset, so it stays
    // selected by default rather than requiring every caller to opt back in.
    passwordChangedAt: Date,
```

- [ ] **Step 4: Set the field in `AuthService.resetPassword`**

In `lib/auth.ts`, change:

```ts
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await User.findByIdAndUpdate(user._id, {
      passwordHash,
      $unset: { resetPasswordTokenHash: 1, resetPasswordExpires: 1 },
    })
```

to:

```ts
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await User.findByIdAndUpdate(user._id, {
      passwordHash,
      // WAS-88: any JWT issued before this moment must stop being accepted -
      // see getUserIdFromRequest in lib/jwt.ts, which checks a token's iat
      // against this field.
      passwordChangedAt: new Date(),
      $unset: { resetPasswordTokenHash: 1, resetPasswordExpires: 1 },
    })
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm vitest run lib/auth.test.ts -t "resetPassword"`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add models/User.ts lib/auth.ts lib/auth.test.ts
git commit -m "feat(auth): set passwordChangedAt on password reset"
```

---

### Task 2: Session invalidation in `getUserIdFromRequest`

**Files:**
- Modify: `lib/jwt.ts`
- Test: `lib/jwt.test.ts`

**Interfaces:**
- Consumes: `IUser.passwordChangedAt?: Date` (Task 1).
- Produces: no interface change — `getUserIdFromRequest(req: NextRequest): Promise<string | null>` keeps its exact signature; every existing caller (`/api/auth/profile`, `/api/auth/me`, `/api/quiz/submit`, `/api/quiz/results`, `/api/quiz/[id]/update`) needs no changes.

- [ ] **Step 1: Write the failing tests**

Replace the full contents of `lib/jwt.test.ts` with:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

// Every IDOR test in this repo mocks getUserIdFromRequest to a canned userId -
// which proves routes trust the session correctly, but never proves the
// session mechanism itself is sound. These tests cover the real
// sign/verify/extract implementation those mocks stand in for.

const findByIdMock = vi.fn()
const selectMock = vi.fn()
const leanMock = vi.fn()

vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}))

// WAS-88: getUserIdFromRequest now reads passwordChangedAt to reject tokens
// issued before the user's last password reset - this mock chain mirrors
// User.findById(id).select('passwordChangedAt').lean() from lib/jwt.ts.
vi.mock('@/models/User', () => ({
  default: {
    findById: (...args: unknown[]) => {
      findByIdMock(...args)
      return {
        select: (...selectArgs: unknown[]) => {
          selectMock(...selectArgs)
          return { lean: () => leanMock() }
        },
      }
    },
  },
}))

import { getUserIdFromRequest, signToken, verifyToken } from './jwt'

const ORIGINAL_JWT_SECRET = process.env.JWT_SECRET

beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret'
  findByIdMock.mockReset()
  selectMock.mockReset()
  leanMock.mockReset()
  // Default: a user who has never reset their password - every valid token
  // is accepted. Individual tests override this to exercise the stale-token
  // and deleted-user cases.
  leanMock.mockResolvedValue({ passwordChangedAt: undefined })
})

afterEach(() => {
  process.env.JWT_SECRET = ORIGINAL_JWT_SECRET
})

function requestWithCookie(token: string) {
  return new NextRequest('http://localhost/api/anything', {
    headers: { cookie: `token=${token}` },
  })
}

// signToken always lets jsonwebtoken stamp the current time as `iat`, so
// tests that need to control iat relative to a fixed passwordChangedAt sign
// the token directly with noTimestamp - the same escape hatch the existing
// "different secret" test above uses via a bare jwt.sign() call.
function tokenWithIat(userId: string, iat: number) {
  return jwt.sign({ userId, iat }, 'test-secret', { noTimestamp: true })
}

describe('signToken / verifyToken', () => {
  it('round-trips a userId through sign and verify', () => {
    const token = signToken({ userId: 'user-a' })
    expect(verifyToken(token).userId).toBe('user-a')
  })

  it('throws on a token signed with a different secret', () => {
    const foreignToken = jwt.sign({ userId: 'user-a' }, 'a-different-secret')
    expect(() => verifyToken(foreignToken)).toThrow()
  })

  it('throws on an expired token', () => {
    const expiredToken = signToken({ userId: 'user-a' }, { expiresIn: -1 })
    expect(() => verifyToken(expiredToken)).toThrow()
  })

  it('throws on a tampered token', () => {
    const token = signToken({ userId: 'user-a' })
    const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a')
    expect(() => verifyToken(tampered)).toThrow()
  })
})

describe('getUserIdFromRequest (the session boundary every route/IDOR check relies on)', () => {
  it('returns null when there is no token cookie', async () => {
    const req = new NextRequest('http://localhost/api/anything')
    expect(await getUserIdFromRequest(req)).toBeNull()
  })

  it('returns the userId for a valid token cookie', async () => {
    const token = signToken({ userId: 'user-a' })
    expect(await getUserIdFromRequest(requestWithCookie(token))).toBe('user-a')
  })

  it('returns null, not a thrown error, for an expired token cookie', async () => {
    const token = signToken({ userId: 'user-a' }, { expiresIn: -1 })
    expect(await getUserIdFromRequest(requestWithCookie(token))).toBeNull()
  })

  it('returns null, not a thrown error, for a tampered token cookie', async () => {
    const token = signToken({ userId: 'user-a' })
    const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a')
    expect(await getUserIdFromRequest(requestWithCookie(tampered))).toBeNull()
  })

  it("never resolves one user's token to a different user's id", async () => {
    const tokenA = signToken({ userId: 'user-a' })
    const tokenB = signToken({ userId: 'user-b' })

    expect(await getUserIdFromRequest(requestWithCookie(tokenA))).toBe('user-a')
    expect(await getUserIdFromRequest(requestWithCookie(tokenB))).toBe('user-b')
  })

  it('queries only the passwordChangedAt field, by the token\'s userId', async () => {
    const token = signToken({ userId: 'user-a' })

    await getUserIdFromRequest(requestWithCookie(token))

    expect(findByIdMock).toHaveBeenCalledWith('user-a')
    expect(selectMock).toHaveBeenCalledWith('passwordChangedAt')
  })
})

describe('getUserIdFromRequest session invalidation on password reset (WAS-88)', () => {
  it('rejects a token whose iat predates the user\'s passwordChangedAt', async () => {
    leanMock.mockResolvedValue({ passwordChangedAt: new Date('2026-01-02T00:00:00Z') })
    const staleIat = Math.floor(new Date('2026-01-01T00:00:00Z').getTime() / 1000)
    const token = tokenWithIat('user-a', staleIat)

    expect(await getUserIdFromRequest(requestWithCookie(token))).toBeNull()
  })

  it('accepts a token whose iat is at or after the user\'s passwordChangedAt', async () => {
    leanMock.mockResolvedValue({ passwordChangedAt: new Date('2026-01-01T00:00:00Z') })
    const freshIat = Math.floor(new Date('2026-01-02T00:00:00Z').getTime() / 1000)
    const token = tokenWithIat('user-a', freshIat)

    expect(await getUserIdFromRequest(requestWithCookie(token))).toBe('user-a')
  })

  it('accepts any valid token when the user has never reset their password', async () => {
    leanMock.mockResolvedValue({ passwordChangedAt: undefined })
    const token = signToken({ userId: 'user-a' })

    expect(await getUserIdFromRequest(requestWithCookie(token))).toBe('user-a')
  })

  it('returns null when the token\'s user no longer exists', async () => {
    leanMock.mockResolvedValue(null)
    const token = signToken({ userId: 'user-a' })

    expect(await getUserIdFromRequest(requestWithCookie(token))).toBeNull()
  })
})
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run: `pnpm vitest run lib/jwt.test.ts`
Expected: FAIL on the new `getUserIdFromRequest session invalidation on password reset (WAS-88)` block and the `queries only the passwordChangedAt field` test — `getUserIdFromRequest` doesn't call `User.findById` yet, so `findByIdMock`/`selectMock` are never invoked and every token is still accepted regardless of `iat`.

- [ ] **Step 3: Implement the session invalidation check**

Replace the full contents of `lib/jwt.ts` with:

```ts
import jwt, { SignOptions } from "jsonwebtoken";
import type { NextRequest } from "next/server";
import connectDB from "@/lib/mongoose";
import User from "@/models/User";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable is not defined. Please add it to your .env.local file."
    );
  }
  return secret;
};

interface JwtPayload {
  userId: string;
  // Set automatically by jsonwebtoken on every sign() call (seconds since
  // epoch) unless signToken is called with `noTimestamp: true` - used by
  // getUserIdFromRequest to detect tokens issued before a password reset.
  iat?: number;
}

export function signToken(payload: JwtPayload, options?: SignOptions): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "7d",
    ...options,
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}

export async function getUserIdFromRequest(
  req: NextRequest
): Promise<string | null> {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  let decoded: JwtPayload;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }

  // WAS-88: a JWT is otherwise valid until its 7-day expiry regardless of
  // what happens to the account in the meantime. Reject it if the account's
  // password was changed after this token was issued - the reset is what
  // actually invalidates any other still-live session.
  await connectDB();
  const user = await User.findById(decoded.userId).select("passwordChangedAt").lean();
  if (!user) return null;

  if (
    user.passwordChangedAt &&
    decoded.iat !== undefined &&
    decoded.iat * 1000 < user.passwordChangedAt.getTime()
  ) {
    return null;
  }

  return decoded.userId;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run lib/jwt.test.ts`
Expected: PASS (all cases, including the pre-existing ones)

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: no new errors. (`User.findById(...).lean()` resolves to `IUser | null` with `passwordChangedAt?: Date` from Task 1 — no `as` casts needed.)

- [ ] **Step 6: Commit**

```bash
git add lib/jwt.ts lib/jwt.test.ts
git commit -m "feat(auth): invalidate JWTs issued before a password reset"
```

---

### Task 3: Server-side password complexity on signup and reset

**Files:**
- Modify: `lib/validation.ts`
- Modify: `app/api/auth/signup/route.test.ts`
- Modify: `app/api/auth/reset-password/route.test.ts`

**Interfaces:**
- Consumes: none new.
- Produces: `signUpSchema.password` and `resetPasswordSchema.password` both now `z.string().min(8).regex(/(?=.*[a-zA-Z])(?=.*\d)/)` — no other schema in `lib/validation.ts` changes.

- [ ] **Step 1: Add failing weak-password tests**

In `app/api/auth/signup/route.test.ts`, change the module-level `validPayload`'s password (currently 7 characters, no longer valid once the schema requires 8):

```ts
const validPayload = {
  email: 'me@example.com',
  password: 'hunter22',
  firstName: 'A',
  lastName: 'B',
  zip_code: '90210',
  occupationStatus: 'employed',
}
```

Then add a new test inside the existing `describe` block, after the `'rejects a payload missing required fields'` test:

```ts
  it('rejects a password that is too short or missing a digit', async () => {
    const res = await POST(makeRequest({ ...validPayload, password: 'nodigits' }))

    expect(res.status).toBe(400)
    expect(signUpMock).not.toHaveBeenCalled()
  })
```

In `app/api/auth/reset-password/route.test.ts`, add a new test inside the existing `describe` block, after the `'rejects a missing password'` test:

```ts
  it('rejects a password that is too short or missing a digit', async () => {
    const res = await POST(makeRequest({ token: 'good-token', password: 'nodigits' }))

    expect(res.status).toBe(400)
    expect(resetPasswordMock).not.toHaveBeenCalled()
  })
```

- [ ] **Step 2: Run the tests to verify the new ones fail, and the old ones still pass on their own terms**

Run: `pnpm vitest run app/api/auth/signup/route.test.ts app/api/auth/reset-password/route.test.ts`
Expected: the two new `'rejects a password that is too short or missing a digit'` tests FAIL (current schemas accept any non-empty string, so both routes currently call through to the mocked service and return 200, not 400).

- [ ] **Step 3: Tighten the schemas**

In `lib/validation.ts`, change:

```ts
export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  zip_code: z.string().min(1),
  occupationStatus: z.string().min(1),
})
```

to:

```ts
export const signUpSchema = z.object({
  email: z.string().email(),
  // WAS-88: this used to only be enforced client-side (signUpFormSchema
  // below) - a request that skips the UI could set an arbitrarily weak
  // password. Same rule, now also enforced at the API boundary.
  password: z.string().min(8).regex(/(?=.*[a-zA-Z])(?=.*\d)/),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  zip_code: z.string().min(1),
  occupationStatus: z.string().min(1),
})
```

And change:

```ts
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(1),
})
```

to:

```ts
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  // WAS-88: matches signUpSchema's password rule - a reset shouldn't be able
  // to set a weaker password than signup would have allowed.
  password: z.string().min(8).regex(/(?=.*[a-zA-Z])(?=.*\d)/),
})
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run app/api/auth/signup/route.test.ts app/api/auth/reset-password/route.test.ts lib/auth.test.ts`
Expected: PASS. (`lib/auth.test.ts` is included because it calls `AuthService.resetPassword`/`signUp` directly with hardcoded passwords like `'password123'`/`'newpassword123'` — confirm those already satisfy the new rule so that suite doesn't regress.)

- [ ] **Step 5: Full test run and typecheck**

Run: `pnpm lint:fix && pnpm typecheck && pnpm test:unit`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add lib/validation.ts app/api/auth/signup/route.test.ts app/api/auth/reset-password/route.test.ts
git commit -m "fix(auth): enforce password complexity server-side on signup and reset"
```

---

### Task 4: Document the domain-verification ops runbook

**Files:**
- Modify: `README.md` (the `# Email` env section, ~line 97-100)

No test — this is a documentation-only change; the runbook is executed by a human outside this repo.

- [ ] **Step 1: Add the runbook**

The env vars in `README.md` all sit inside one shared ```env code fence
(`# Database` through `# Vercel Blob`), closed just before the "Never
commit `.env.local`" warning paragraph. Insert the runbook as its own
paragraph *after* that closing fence, so it renders as prose, not as part
of the env block. Find this text (~line 104-107):

```markdown
   BLOB_READ_WRITE_TOKEN=your_blob_token
   ```

   **Never commit `.env.local` (or any `.env*` file).** It holds live
```

and change it to:

```markdown
   BLOB_READ_WRITE_TOKEN=your_blob_token
   ```

   **Going to production (email):** the `EMAIL_FROM`/`RESEND_API_KEY`
   values above work as-is in dev against Resend's `onboarding@resend.dev`
   sandbox address, which only delivers to the Resend account owner's own
   inbox. Before real users hit the password-reset/email-verification
   flows:
   1. In the Resend dashboard, add your production sending domain.
   2. Add the SPF and DKIM DNS records Resend provides, at your domain's
      DNS provider.
   3. Wait for DNS propagation, then click verify in Resend.
   4. Update `EMAIL_FROM` in the production environment (e.g.
      `noreply@yourdomain.com`) - no code change, this is an env var flip.
   5. Send a real test reset/verification email to a non-Resend-owner
      address to confirm delivery.

   **Never commit `.env.local` (or any `.env*` file).** It holds live
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs(auth): add production email-domain verification runbook"
```

---

### Task 5: End-to-end verification against the ticket's DoD

No new files — this task exercises the running app to confirm the DoD's manual scenario, per this repo's CLAUDE.md UI-testing rule.

- [ ] **Step 1: Run the full validation suite**

Run: `pnpm lint:fix && pnpm typecheck && pnpm test:unit`
Expected: all pass, zero new lint/type errors.

- [ ] **Step 2: Manually verify the session-invalidation scenario**

Start the dev server (`pnpm dev`). Using two different browser sessions (e.g. a normal window and an incognito window) as "device A" and "device B":
1. Sign in as the same test user on device A and device B.
2. On device A, confirm `/api/auth/me` returns the user (still logged in).
3. On device B, use the reset-password flow to reset that user's password (request a reset token via `/api/auth/request-reset`, apply it via `/reset-password?token=...`).
4. On device A, hit `/api/auth/me` again without signing in again.
5. Expected: device A now gets an unauthenticated response (401/null), confirming the stale session was rejected — this is the exact scenario in the ticket's Definition of Done.
6. Sign in again on device A with the new password to confirm the account itself still works normally.

- [ ] **Step 3: Confirm the DoD's "lesson saved" item**

Confirm `docs/superpowers/specs/2026-07-13-was-88-auth-hardening-design.md`'s "Decisions" section documents the `passwordChangedAt` choice and the rejected `tokenVersion`/Redis alternatives (it does, from the brainstorming phase) — no further action needed, this satisfies that DoD checkbox.

---

## Definition of Done mapping

- Email delivery to arbitrary addresses → Task 4 (ops runbook; execution is manual, outside this plan).
- Password reset invalidates other sessions → Tasks 1-2, verified manually in Task 5.
- Tests/lint/typecheck pass → every task's steps + Task 5 Step 1.
- PR body says `Closes WAS-88` → handled at PR-creation time, not a plan task.
- Lesson documented → already satisfied by the committed design spec (Task 5 Step 3 confirms it).
