# WAS-32: Password Reset and Email Verification Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a password-reset flow and an email-verification flow to the existing custom JWT/cookie auth system, backed by Resend for delivery and a hashed-random-token pattern for security.

**Architecture:** A new `lib/tokens.ts` utility generates a random token + its SHA-256 hash; only the hash is ever stored on the `User` document (with an expiry), and the raw token goes out in an email built by `lib/email.ts`/`lib/resend.ts`. Four new `AuthService` methods (`requestPasswordReset`, `resetPassword`, `verifyEmail`, `resendVerification`) back four new `/api/auth/*` routes, following the exact zod-validate → service-call → JSON shape of the existing `signin`/`signup` routes. Frontend: a new `ForgotPasswordModal` fits the existing `activeModal` reducer pattern; `/reset-password` and `/verify-email` are dedicated pages (email-link entry points, not reachable from in-app modal state).

**Tech Stack:** Next.js 15 App Router, Mongoose/MongoDB, bcryptjs, jsonwebtoken, zod, vitest, Resend (new dependency).

**Design doc:** `docs/superpowers/specs/2026-07-11-was-32-password-reset-email-verification-design.md`

---

## Task 1: Install Resend, add env vars, add the Resend client

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Create: `lib/resend.ts`

**Step 1: Install the dependency**

Run: `pnpm add resend`

**Step 2: Add env vars to your local `.env.local`**

Add these three lines (get a real API key from resend.com — the dev sandbox sender `onboarding@resend.dev` works without a verified domain):
```
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=onboarding@resend.dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 3: Document the new env vars in README.md**

In `README.md`, inside the `.env.local` code block (currently ends with the `BLOB_READ_WRITE_TOKEN` line around line ~99), add a new section after Authentication and before Vercel Blob:

```env
   # Authentication
   JWT_SECRET=your_jwt_secret

   # Email (Resend)
   RESEND_API_KEY=your_resend_api_key
   EMAIL_FROM=onboarding@resend.dev
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Vercel Blob (for video hosting)
   BLOB_READ_WRITE_TOKEN=your_blob_token
```

**Step 4: Create `lib/resend.ts`**

```ts
// lib/resend.ts

import { Resend } from "resend"

const getResendApiKey = (): string => {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    throw new Error(
      "RESEND_API_KEY environment variable is not defined. Please add it to your .env.local file."
    )
  }
  return key
}

let client: Resend | null = null

export function getResendClient(): Resend {
  if (!client) {
    client = new Resend(getResendApiKey())
  }
  return client
}
```

**Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml README.md lib/resend.ts
git commit -m "feat: add Resend client and email env vars for WAS-32"
```

---

## Task 2: Token utility (`lib/tokens.ts`)

This is the reusable pattern the ticket asks to document for future token-based flows (e.g. invite links): random bytes out to the user, only a SHA-256 hash stored server-side.

**Files:**
- Create: `lib/tokens.ts`
- Test: `lib/tokens.test.ts`

**Step 1: Write the failing test**

```ts
// lib/tokens.test.ts
import { describe, expect, it } from 'vitest'
import { generateToken, hashToken } from './tokens'

describe('generateToken', () => {
  it('returns a raw token and its sha256 hash', () => {
    const { token, tokenHash } = generateToken()

    expect(token).toBeTruthy()
    expect(tokenHash).toBeTruthy()
    expect(tokenHash).toBe(hashToken(token))
  })

  it('generates a different token on every call', () => {
    const a = generateToken()
    const b = generateToken()

    expect(a.token).not.toBe(b.token)
    expect(a.tokenHash).not.toBe(b.tokenHash)
  })

  it('hashToken is deterministic', () => {
    const { token } = generateToken()

    expect(hashToken(token)).toBe(hashToken(token))
  })

  it('the hash does not contain the raw token and is a sha256 hex digest', () => {
    const { token, tokenHash } = generateToken()

    expect(tokenHash).not.toContain(token)
    expect(tokenHash).toHaveLength(64)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test lib/tokens.test.ts`
Expected: FAIL with "Cannot find module './tokens'" or similar

**Step 3: Write minimal implementation**

```ts
// lib/tokens.ts
//
// WAS-32: shared pattern for any short-lived, single-use token flow
// (password reset, email verification, and future flows like invite
// links) - generate random bytes, send the raw token to the user (email
// link), store only a SHA-256 hash of it on the record being verified.
// Lookups happen by hash, so a leaked database read never exposes a token
// an attacker could replay.

import crypto from "crypto"

export function generateToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString("base64url")
  return { token, tokenHash: hashToken(token) }
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test lib/tokens.test.ts`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add lib/tokens.ts lib/tokens.test.ts
git commit -m "feat: add reusable token generation utility for WAS-32"
```

---

## Task 3: Email sending (`lib/email.ts`)

**Files:**
- Create: `lib/email.ts`
- Test: `lib/email.test.ts`

**Step 1: Write the failing test**

```ts
// lib/email.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendMock = vi.fn()

vi.mock('@/lib/resend', () => ({
  getResendClient: () => ({ emails: { send: sendMock } }),
}))

import { sendPasswordResetEmail, sendVerificationEmail } from './email'

describe('email', () => {
  beforeEach(() => {
    sendMock.mockReset()
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    process.env.EMAIL_FROM = 'test@example.com'
  })

  it('sendPasswordResetEmail includes the reset link with the raw token', async () => {
    await sendPasswordResetEmail('user@example.com', 'raw-token-abc')

    expect(sendMock).toHaveBeenCalledTimes(1)
    const [args] = sendMock.mock.calls[0]
    expect(args.to).toBe('user@example.com')
    expect(args.from).toBe('test@example.com')
    expect(args.html).toContain('http://localhost:3000/reset-password?token=raw-token-abc')
  })

  it('sendVerificationEmail includes the verify link with the raw token', async () => {
    await sendVerificationEmail('user@example.com', 'raw-token-xyz')

    expect(sendMock).toHaveBeenCalledTimes(1)
    const [args] = sendMock.mock.calls[0]
    expect(args.to).toBe('user@example.com')
    expect(args.html).toContain('http://localhost:3000/verify-email?token=raw-token-xyz')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test lib/email.test.ts`
Expected: FAIL with "Cannot find module './email'"

**Step 3: Write minimal implementation**

```ts
// lib/email.ts

import { getResendClient } from "@/lib/resend"

const getAppUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_APP_URL
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL environment variable is not defined. Please add it to your .env.local file."
    )
  }
  return url
}

const getFromAddress = (): string => {
  const from = process.env.EMAIL_FROM
  if (!from) {
    throw new Error(
      "EMAIL_FROM environment variable is not defined. Please add it to your .env.local file."
    )
  }
  return from
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${getAppUrl()}/reset-password?token=${token}`
  await getResendClient().emails.send({
    from: getFromAddress(),
    to,
    subject: "Reset your password",
    html: `<p>Click the link below to reset your password. This link expires in 1 hour and can only be used once.</p><p><a href="${link}">${link}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
  })
}

export async function sendVerificationEmail(to: string, token: string) {
  const link = `${getAppUrl()}/verify-email?token=${token}`
  await getResendClient().emails.send({
    from: getFromAddress(),
    to,
    subject: "Verify your email",
    html: `<p>Click the link below to verify your email address. This link expires in 24 hours and can only be used once.</p><p><a href="${link}">${link}</a></p>`,
  })
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test lib/email.test.ts`
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add lib/email.ts lib/email.test.ts
git commit -m "feat: add password-reset and verification email senders for WAS-32"
```

---

## Task 4: User schema additions

**Files:**
- Modify: `models/User.ts`

**Step 1: Update the `IUser` interface and schema**

Replace the full contents of `models/User.ts` with:

```ts
import { Schema, Document, Model } from "mongoose"
import mongoose from "mongoose"

export interface IUser extends Document {
  _id: string // ✅ This is what Mongoose actually provides
  email: string
  passwordHash: string
  first_name?: string
  last_name?: string
  zip_code?: string
  occupation_status?: string
  emailVerified: boolean
  resetPasswordTokenHash?: string
  resetPasswordExpires?: Date
  emailVerificationTokenHash?: string
  emailVerificationExpires?: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    // WAS-19: schema-level backstop for AuthService's normalizeEmail() - keeps
    // the unique index case/whitespace-insensitive even if some other write
    // path ever bypasses lib/auth.ts.
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    first_name: String,
    last_name: String,
    zip_code: String,
    occupation_status: String,
    // WAS-32: emailVerified is display-only for now - no route currently
    // gates on it. The four token fields below store only a SHA-256 hash
    // of the token that was emailed (see lib/tokens.ts), never the raw
    // token, plus an expiry. Both pairs are cleared on successful use,
    // which is what makes the token single-use.
    emailVerified: { type: Boolean, default: false },
    resetPasswordTokenHash: String,
    resetPasswordExpires: Date,
    emailVerificationTokenHash: String,
    emailVerificationExpires: Date,
  },
  { timestamps: true }
)

const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema)

export default UserModel
```

**Step 2: Commit**

```bash
git add models/User.ts
git commit -m "feat: add emailVerified and reset/verification token fields to User"
```

No dedicated test here — this file has no existing test and is exercised indirectly by `lib/auth.test.ts` in later tasks.

---

## Task 5: New zod validation schemas

**Files:**
- Modify: `lib/validation.ts`

**Step 1: Add the four new schemas**

In `lib/validation.ts`, after the existing `signUpSchema` (line 25) and before the `archetypeSchema` block, add:

```ts
export const requestResetSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(1),
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
})

export const resendVerificationSchema = z.object({
  email: z.string().email(),
})
```

**Step 2: Commit**

```bash
git add lib/validation.ts
git commit -m "feat: add zod schemas for reset/verification routes"
```

No dedicated test — these are exercised by the route tests in Tasks 12-15.

---

## Task 6: `AuthService.requestPasswordReset`

**Files:**
- Modify: `lib/auth.ts`
- Modify: `lib/auth.test.ts`

**Step 1: Add new mocks to the top of `lib/auth.test.ts`**

Add these alongside the existing `vi.mock` calls, before the `import { AuthService } from './auth'` line (after the existing `bcryptjs` mock, before the `@/models/User` mock is fine):

```ts
const generateTokenMock = vi.fn()
vi.mock('@/lib/tokens', () => ({
  generateToken: () => generateTokenMock(),
  hashToken: (token: string) => `hashed-${token}`,
}))

const sendPasswordResetEmailMock = vi.fn()
const sendVerificationEmailMock = vi.fn()
vi.mock('@/lib/email', () => ({
  sendPasswordResetEmail: (...args: unknown[]) => sendPasswordResetEmailMock(...args),
  sendVerificationEmail: (...args: unknown[]) => sendVerificationEmailMock(...args),
}))
```

**Step 2: Write the failing test**

Add to the end of `lib/auth.test.ts`:

```ts
describe('AuthService.requestPasswordReset (WAS-32)', () => {
  beforeEach(() => {
    findOneMock.mockReset()
    findByIdAndUpdateMock.mockReset()
    generateTokenMock.mockReset()
    sendPasswordResetEmailMock.mockReset()
    generateTokenMock.mockReturnValue({ token: 'raw-token', tokenHash: 'hashed-raw-token' })
  })

  it('does nothing when no user matches the normalized email (anti-enumeration)', async () => {
    findOneMock.mockResolvedValue(null)

    await AuthService.requestPasswordReset('nobody@example.com')

    expect(findOneMock).toHaveBeenCalledWith({ email: 'nobody@example.com' })
    expect(findByIdAndUpdateMock).not.toHaveBeenCalled()
    expect(sendPasswordResetEmailMock).not.toHaveBeenCalled()
  })

  it('stores a hashed token with an expiry and emails the raw token', async () => {
    findOneMock.mockResolvedValue({ _id: 'user-a', email: 'me@example.com' })
    findByIdAndUpdateMock.mockResolvedValue(undefined)

    await AuthService.requestPasswordReset('  Me@Example.com  ')

    expect(findOneMock).toHaveBeenCalledWith({ email: 'me@example.com' })
    expect(findByIdAndUpdateMock).toHaveBeenCalledWith(
      'user-a',
      expect.objectContaining({
        resetPasswordTokenHash: 'hashed-raw-token',
        resetPasswordExpires: expect.any(Date),
      })
    )
    expect(sendPasswordResetEmailMock).toHaveBeenCalledWith('me@example.com', 'raw-token')
  })
})
```

**Step 3: Run test to verify it fails**

Run: `pnpm test lib/auth.test.ts`
Expected: FAIL with "AuthService.requestPasswordReset is not a function"

**Step 4: Implement**

In `lib/auth.ts`, add imports at the top:

```ts
import { generateToken, hashToken } from "@/lib/tokens"
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email"
```

Add a constant near the top (after the `normalizeEmail` function):

```ts
const ONE_HOUR_MS = 60 * 60 * 1000
const ONE_DAY_MS = 24 * ONE_HOUR_MS
```

Add the method inside the `AuthService` class, after `signIn`:

```ts
  static async requestPasswordReset(email: string) {
    await connectDB()

    const user = await User.findOne({ email: normalizeEmail(email) })
    // WAS-32: anti-enumeration - the caller (route) always reports success
    // either way, so a missing user is a silent no-op, not an error.
    if (!user) return

    const { token, tokenHash } = generateToken()
    await User.findByIdAndUpdate(user._id, {
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: new Date(Date.now() + ONE_HOUR_MS),
    })

    try {
      await sendPasswordResetEmail(user.email, token)
    } catch (err) {
      console.error("Failed to send password reset email:", err)
    }
  }
```

**Step 5: Run test to verify it passes**

Run: `pnpm test lib/auth.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add lib/auth.ts lib/auth.test.ts
git commit -m "feat: add AuthService.requestPasswordReset for WAS-32"
```

---

## Task 7: `AuthService.resetPassword`

**Files:**
- Modify: `lib/auth.ts`
- Modify: `lib/auth.test.ts`

**Step 1: Write the failing test**

Add to `lib/auth.test.ts`:

```ts
describe('AuthService.resetPassword (WAS-32)', () => {
  beforeEach(() => {
    findOneMock.mockReset()
    findByIdAndUpdateMock.mockReset()
  })

  it('rejects an unknown or expired token', async () => {
    findOneMock.mockResolvedValue(null)

    await expect(AuthService.resetPassword('bad-token', 'newpassword123')).rejects.toThrow(
      'Invalid or expired token'
    )
    expect(findByIdAndUpdateMock).not.toHaveBeenCalled()
  })

  it('hashes the new password and clears the reset token fields on success', async () => {
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
        $unset: { resetPasswordTokenHash: 1, resetPasswordExpires: 1 },
      })
    )
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test lib/auth.test.ts`
Expected: FAIL with "AuthService.resetPassword is not a function"

**Step 3: Implement**

Add to `AuthService`, after `requestPasswordReset`:

```ts
  static async resetPassword(token: string, newPassword: string) {
    await connectDB()

    const tokenHash = hashToken(token)
    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    })
    // Same generic error whether the token doesn't exist or has expired -
    // distinguishing the two only helps an attacker probing token validity.
    if (!user) throw new Error("Invalid or expired token")

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await User.findByIdAndUpdate(user._id, {
      passwordHash,
      $unset: { resetPasswordTokenHash: 1, resetPasswordExpires: 1 },
    })
  }
```

**Step 4: Run test to verify it passes**

Run: `pnpm test lib/auth.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/auth.ts lib/auth.test.ts
git commit -m "feat: add AuthService.resetPassword for WAS-32"
```

---

## Task 8: `AuthService.verifyEmail`

**Files:**
- Modify: `lib/auth.ts`
- Modify: `lib/auth.test.ts`

**Step 1: Write the failing test**

Add to `lib/auth.test.ts`:

```ts
describe('AuthService.verifyEmail (WAS-32)', () => {
  beforeEach(() => {
    findOneMock.mockReset()
    findByIdAndUpdateMock.mockReset()
  })

  it('rejects an unknown or expired token', async () => {
    findOneMock.mockResolvedValue(null)

    await expect(AuthService.verifyEmail('bad-token')).rejects.toThrow('Invalid or expired token')
    expect(findByIdAndUpdateMock).not.toHaveBeenCalled()
  })

  it('marks the user verified and clears the verification token fields on success', async () => {
    findOneMock.mockResolvedValue({ _id: 'user-a' })
    findByIdAndUpdateMock.mockResolvedValue(undefined)

    await AuthService.verifyEmail('good-token')

    expect(findOneMock).toHaveBeenCalledWith({
      emailVerificationTokenHash: 'hashed-good-token',
      emailVerificationExpires: { $gt: expect.any(Date) },
    })
    expect(findByIdAndUpdateMock).toHaveBeenCalledWith(
      'user-a',
      expect.objectContaining({
        emailVerified: true,
        $unset: { emailVerificationTokenHash: 1, emailVerificationExpires: 1 },
      })
    )
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test lib/auth.test.ts`
Expected: FAIL with "AuthService.verifyEmail is not a function"

**Step 3: Implement**

Add to `AuthService`, after `resetPassword`:

```ts
  static async verifyEmail(token: string) {
    await connectDB()

    const tokenHash = hashToken(token)
    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpires: { $gt: new Date() },
    })
    if (!user) throw new Error("Invalid or expired token")

    await User.findByIdAndUpdate(user._id, {
      emailVerified: true,
      $unset: { emailVerificationTokenHash: 1, emailVerificationExpires: 1 },
    })
  }
```

**Step 4: Run test to verify it passes**

Run: `pnpm test lib/auth.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/auth.ts lib/auth.test.ts
git commit -m "feat: add AuthService.verifyEmail for WAS-32"
```

---

## Task 9: `signUp` issues a verification token; extract `issueVerificationToken`

**Files:**
- Modify: `lib/auth.ts`
- Modify: `lib/auth.test.ts`

**Step 1: Write the failing test**

Add to `lib/auth.test.ts`:

```ts
describe('AuthService.signUp also issues a verification token (WAS-32)', () => {
  beforeEach(() => {
    findOneMock.mockReset()
    createMock.mockReset()
    findByIdAndUpdateMock.mockReset()
    generateTokenMock.mockReset()
    sendVerificationEmailMock.mockReset()
    generateTokenMock.mockReturnValue({ token: 'raw-token', tokenHash: 'hashed-raw-token' })
  })

  it('stores a verification token and sends the verification email after creating the user', async () => {
    findOneMock.mockResolvedValue(null)
    createMock.mockResolvedValue({ _id: 'user-a', email: 'foo@x.com' })
    findByIdAndUpdateMock.mockResolvedValue(undefined)

    await AuthService.signUp({
      email: 'foo@x.com',
      password: 'password123',
      firstName: 'Foo',
      lastName: 'Bar',
      zip_code: '90210',
      occupationStatus: 'Working Professional',
    })

    expect(findByIdAndUpdateMock).toHaveBeenCalledWith(
      'user-a',
      expect.objectContaining({
        emailVerificationTokenHash: 'hashed-raw-token',
        emailVerificationExpires: expect.any(Date),
      })
    )
    expect(sendVerificationEmailMock).toHaveBeenCalledWith('foo@x.com', 'raw-token')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test lib/auth.test.ts`
Expected: FAIL — `findByIdAndUpdateMock`/`sendVerificationEmailMock` not called

**Step 3: Implement**

In `lib/auth.ts`, add a private helper to `AuthService` (place it after `signIn`, before `signOut`):

```ts
  private static async issueVerificationToken(user: Pick<IUser, "_id" | "email">) {
    const { token, tokenHash } = generateToken()
    await User.findByIdAndUpdate(user._id, {
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpires: new Date(Date.now() + ONE_DAY_MS),
    })

    try {
      await sendVerificationEmail(user.email, token)
    } catch (err) {
      console.error("Failed to send verification email:", err)
    }
  }
```

Then modify `signUp` to call it — change:

```ts
    const user = await User.create({
      email,
      passwordHash,
      first_name: userData.firstName,
      last_name: userData.lastName,
      zip_code: userData.zip_code,
      occupation_status: userData.occupationStatus,
    })

    return user
```

to:

```ts
    const user = await User.create({
      email,
      passwordHash,
      first_name: userData.firstName,
      last_name: userData.lastName,
      zip_code: userData.zip_code,
      occupation_status: userData.occupationStatus,
    })

    await AuthService.issueVerificationToken(user)

    return user
```

**Step 4: Run test to verify it passes**

Run: `pnpm test lib/auth.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/auth.ts lib/auth.test.ts
git commit -m "feat: send email verification link on signup for WAS-32"
```

---

## Task 10: `AuthService.resendVerification`

**Files:**
- Modify: `lib/auth.ts`
- Modify: `lib/auth.test.ts`

**Step 1: Write the failing test**

Add to `lib/auth.test.ts`:

```ts
describe('AuthService.resendVerification (WAS-32)', () => {
  beforeEach(() => {
    findOneMock.mockReset()
    findByIdAndUpdateMock.mockReset()
    generateTokenMock.mockReset()
    sendVerificationEmailMock.mockReset()
    generateTokenMock.mockReturnValue({ token: 'raw-token', tokenHash: 'hashed-raw-token' })
  })

  it('does nothing when no user matches the normalized email (anti-enumeration)', async () => {
    findOneMock.mockResolvedValue(null)

    await AuthService.resendVerification('nobody@example.com')

    expect(findByIdAndUpdateMock).not.toHaveBeenCalled()
    expect(sendVerificationEmailMock).not.toHaveBeenCalled()
  })

  it('issues a fresh verification token for an existing user', async () => {
    findOneMock.mockResolvedValue({ _id: 'user-a', email: 'me@example.com' })
    findByIdAndUpdateMock.mockResolvedValue(undefined)

    await AuthService.resendVerification('me@example.com')

    expect(findByIdAndUpdateMock).toHaveBeenCalledWith(
      'user-a',
      expect.objectContaining({ emailVerificationTokenHash: 'hashed-raw-token' })
    )
    expect(sendVerificationEmailMock).toHaveBeenCalledWith('me@example.com', 'raw-token')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test lib/auth.test.ts`
Expected: FAIL with "AuthService.resendVerification is not a function"

**Step 3: Implement**

Add to `AuthService`, after `verifyEmail`:

```ts
  static async resendVerification(email: string) {
    await connectDB()

    const user = await User.findOne({ email: normalizeEmail(email) })
    // Same anti-enumeration reasoning as requestPasswordReset.
    if (!user) return

    await AuthService.issueVerificationToken(user)
  }
```

**Step 4: Run test to verify it passes**

Run: `pnpm test lib/auth.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/auth.ts lib/auth.test.ts
git commit -m "feat: add AuthService.resendVerification for WAS-32"
```

---

## Task 11: Exclude token-hash fields from `getUserProfile`

**Files:**
- Modify: `lib/auth.ts`
- Modify: `lib/auth.test.ts`

**Step 1: Update the existing test**

In `lib/auth.test.ts`, find the `describe('AuthService.getUserProfile ...)` block's test `'excludes passwordHash from the query projection'` and replace it with:

```ts
  it('excludes passwordHash and token-hash fields from the query projection', async () => {
    selectMock.mockResolvedValue({ _id: 'user-a', email: 'me@example.com' })

    await AuthService.getUserProfile('user-a')

    expect(findByIdMock).toHaveBeenCalledWith('user-a')
    expect(selectMock).toHaveBeenCalledWith(
      '-passwordHash -resetPasswordTokenHash -resetPasswordExpires -emailVerificationTokenHash -emailVerificationExpires'
    )
  })
```

**Step 2: Run test to verify it fails**

Run: `pnpm test lib/auth.test.ts`
Expected: FAIL — `selectMock` was called with `'-passwordHash'` only

**Step 3: Implement**

In `lib/auth.ts`, change `getUserProfile`:

```ts
  static async getUserProfile(userId: string): Promise<IUser | null> {
    await connectDB()
    // WAS-7/WAS-32: passwordHash and the token-hash/expiry fields must
    // never leave the server. Shared by both /api/auth/profile and
    // /api/auth/me.
    return await User.findById(userId).select(
      "-passwordHash -resetPasswordTokenHash -resetPasswordExpires -emailVerificationTokenHash -emailVerificationExpires"
    )
  }
```

**Step 4: Run test to verify it passes**

Run: `pnpm test lib/auth.test.ts`
Expected: PASS (full file — run without a path filter once to confirm nothing else broke: `pnpm test lib/auth.test.ts`)

**Step 5: Commit**

```bash
git add lib/auth.ts lib/auth.test.ts
git commit -m "fix: exclude reset/verification token hashes from getUserProfile"
```

---

## Task 12: Route `POST /api/auth/request-reset`

**Files:**
- Create: `app/api/auth/request-reset/route.ts`
- Test: `app/api/auth/request-reset/route.test.ts`

**Step 1: Write the failing test**

```ts
// app/api/auth/request-reset/route.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

const requestPasswordResetMock = vi.fn()
vi.mock('@/lib/auth', () => ({
  AuthService: {
    requestPasswordReset: (...args: unknown[]) => requestPasswordResetMock(...args),
  },
}))

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/auth/request-reset', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeRawRequest(rawBody: string) {
  return new Request('http://localhost/api/auth/request-reset', {
    method: 'POST',
    body: rawBody,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/request-reset (WAS-32)', () => {
  beforeEach(() => {
    requestPasswordResetMock.mockReset()
  })

  it('rejects a NoSQL-operator email payload with 400 instead of querying the database', async () => {
    const res = await POST(makeRequest({ email: { $ne: null } }))

    expect(res.status).toBe(400)
    expect(requestPasswordResetMock).not.toHaveBeenCalled()
  })

  it('rejects a non-email string', async () => {
    const res = await POST(makeRequest({ email: 'not-an-email' }))

    expect(res.status).toBe(400)
    expect(requestPasswordResetMock).not.toHaveBeenCalled()
  })

  it('rejects a non-JSON body with 400 instead of crashing', async () => {
    const res = await POST(makeRawRequest('not-json'))

    expect(res.status).toBe(400)
    expect(requestPasswordResetMock).not.toHaveBeenCalled()
  })

  it('returns the same generic success message whether or not the email exists', async () => {
    requestPasswordResetMock.mockResolvedValue(undefined)

    const res = await POST(makeRequest({ email: 'me@example.com' }))
    const body = await res.json()

    expect(requestPasswordResetMock).toHaveBeenCalledWith('me@example.com')
    expect(res.status).toBe(200)
    expect(body.message).toMatch(/if an account exists/i)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test app/api/auth/request-reset/route.test.ts`
Expected: FAIL — module `./route` not found

**Step 3: Implement**

```ts
// app/api/auth/request-reset/route.ts

import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { requestResetSchema } from "@/lib/validation"

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = requestResetSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  // WAS-32: always return the same generic response whether or not the
  // email is registered - prevents this endpoint from being used to
  // enumerate accounts.
  await AuthService.requestPasswordReset(parsed.data.email)

  return NextResponse.json({
    message: "If an account exists for that email, a reset link has been sent.",
  })
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test app/api/auth/request-reset/route.test.ts`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add app/api/auth/request-reset
git commit -m "feat: add POST /api/auth/request-reset route"
```

---

## Task 13: Route `POST /api/auth/reset-password`

**Files:**
- Create: `app/api/auth/reset-password/route.ts`
- Test: `app/api/auth/reset-password/route.test.ts`

**Step 1: Write the failing test**

```ts
// app/api/auth/reset-password/route.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

const resetPasswordMock = vi.fn()
vi.mock('@/lib/auth', () => ({
  AuthService: {
    resetPassword: (...args: unknown[]) => resetPasswordMock(...args),
  },
}))

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeRawRequest(rawBody: string) {
  return new Request('http://localhost/api/auth/reset-password', {
    method: 'POST',
    body: rawBody,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/reset-password (WAS-32)', () => {
  beforeEach(() => {
    resetPasswordMock.mockReset()
  })

  it('rejects a NoSQL-operator token payload with 400', async () => {
    const res = await POST(makeRequest({ token: { $ne: null }, password: 'x' }))

    expect(res.status).toBe(400)
    expect(resetPasswordMock).not.toHaveBeenCalled()
  })

  it('rejects a missing password', async () => {
    const res = await POST(makeRequest({ token: 'abc' }))

    expect(res.status).toBe(400)
    expect(resetPasswordMock).not.toHaveBeenCalled()
  })

  it('rejects a non-JSON body with 400', async () => {
    const res = await POST(makeRawRequest('not-json'))

    expect(res.status).toBe(400)
    expect(resetPasswordMock).not.toHaveBeenCalled()
  })

  it('returns 400 when the service rejects an invalid or expired token', async () => {
    resetPasswordMock.mockRejectedValue(new Error('Invalid or expired token'))

    const res = await POST(makeRequest({ token: 'bad-token', password: 'newpassword123' }))

    expect(res.status).toBe(400)
  })

  it('resets the password with a valid token', async () => {
    resetPasswordMock.mockResolvedValue(undefined)

    const res = await POST(makeRequest({ token: 'good-token', password: 'newpassword123' }))

    expect(resetPasswordMock).toHaveBeenCalledWith('good-token', 'newpassword123')
    expect(res.status).toBe(200)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test app/api/auth/reset-password/route.test.ts`
Expected: FAIL — module `./route` not found

**Step 3: Implement**

```ts
// app/api/auth/reset-password/route.ts

import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { resetPasswordSchema } from "@/lib/validation"

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = resetPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    await AuthService.resetPassword(parsed.data.token, parsed.data.password)
    return NextResponse.json({ message: "Password updated successfully." })
  } catch (err) {
    const error = err instanceof Error ? err.message : "Invalid or expired token"
    return NextResponse.json({ error }, { status: 400 })
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test app/api/auth/reset-password/route.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add app/api/auth/reset-password
git commit -m "feat: add POST /api/auth/reset-password route"
```

---

## Task 14: Route `POST /api/auth/verify-email`

**Files:**
- Create: `app/api/auth/verify-email/route.ts`
- Test: `app/api/auth/verify-email/route.test.ts`

**Step 1: Write the failing test**

```ts
// app/api/auth/verify-email/route.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

const verifyEmailMock = vi.fn()
vi.mock('@/lib/auth', () => ({
  AuthService: {
    verifyEmail: (...args: unknown[]) => verifyEmailMock(...args),
  },
}))

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeRawRequest(rawBody: string) {
  return new Request('http://localhost/api/auth/verify-email', {
    method: 'POST',
    body: rawBody,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/verify-email (WAS-32)', () => {
  beforeEach(() => {
    verifyEmailMock.mockReset()
  })

  it('rejects a NoSQL-operator token payload with 400', async () => {
    const res = await POST(makeRequest({ token: { $ne: null } }))

    expect(res.status).toBe(400)
    expect(verifyEmailMock).not.toHaveBeenCalled()
  })

  it('rejects a missing token', async () => {
    const res = await POST(makeRequest({}))

    expect(res.status).toBe(400)
    expect(verifyEmailMock).not.toHaveBeenCalled()
  })

  it('rejects a non-JSON body with 400', async () => {
    const res = await POST(makeRawRequest('not-json'))

    expect(res.status).toBe(400)
    expect(verifyEmailMock).not.toHaveBeenCalled()
  })

  it('returns 400 when the service rejects an invalid or expired token', async () => {
    verifyEmailMock.mockRejectedValue(new Error('Invalid or expired token'))

    const res = await POST(makeRequest({ token: 'bad-token' }))

    expect(res.status).toBe(400)
  })

  it('verifies with a valid token', async () => {
    verifyEmailMock.mockResolvedValue(undefined)

    const res = await POST(makeRequest({ token: 'good-token' }))

    expect(verifyEmailMock).toHaveBeenCalledWith('good-token')
    expect(res.status).toBe(200)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test app/api/auth/verify-email/route.test.ts`
Expected: FAIL — module `./route` not found

**Step 3: Implement**

```ts
// app/api/auth/verify-email/route.ts

import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { verifyEmailSchema } from "@/lib/validation"

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = verifyEmailSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    await AuthService.verifyEmail(parsed.data.token)
    return NextResponse.json({ message: "Email verified successfully." })
  } catch (err) {
    const error = err instanceof Error ? err.message : "Invalid or expired token"
    return NextResponse.json({ error }, { status: 400 })
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test app/api/auth/verify-email/route.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add app/api/auth/verify-email
git commit -m "feat: add POST /api/auth/verify-email route"
```

---

## Task 15: Route `POST /api/auth/resend-verification`

**Files:**
- Create: `app/api/auth/resend-verification/route.ts`
- Test: `app/api/auth/resend-verification/route.test.ts`

**Step 1: Write the failing test**

```ts
// app/api/auth/resend-verification/route.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

const resendVerificationMock = vi.fn()
vi.mock('@/lib/auth', () => ({
  AuthService: {
    resendVerification: (...args: unknown[]) => resendVerificationMock(...args),
  },
}))

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeRawRequest(rawBody: string) {
  return new Request('http://localhost/api/auth/resend-verification', {
    method: 'POST',
    body: rawBody,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/resend-verification (WAS-32)', () => {
  beforeEach(() => {
    resendVerificationMock.mockReset()
  })

  it('rejects a NoSQL-operator email payload with 400', async () => {
    const res = await POST(makeRequest({ email: { $ne: null } }))

    expect(res.status).toBe(400)
    expect(resendVerificationMock).not.toHaveBeenCalled()
  })

  it('rejects a non-email string', async () => {
    const res = await POST(makeRequest({ email: 'not-an-email' }))

    expect(res.status).toBe(400)
    expect(resendVerificationMock).not.toHaveBeenCalled()
  })

  it('rejects a non-JSON body with 400', async () => {
    const res = await POST(makeRawRequest('not-json'))

    expect(res.status).toBe(400)
    expect(resendVerificationMock).not.toHaveBeenCalled()
  })

  it('returns the same generic success message whether or not the email exists', async () => {
    resendVerificationMock.mockResolvedValue(undefined)

    const res = await POST(makeRequest({ email: 'me@example.com' }))
    const body = await res.json()

    expect(resendVerificationMock).toHaveBeenCalledWith('me@example.com')
    expect(res.status).toBe(200)
    expect(body.message).toMatch(/if an account exists/i)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test app/api/auth/resend-verification/route.test.ts`
Expected: FAIL — module `./route` not found

**Step 3: Implement**

```ts
// app/api/auth/resend-verification/route.ts

import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { resendVerificationSchema } from "@/lib/validation"

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = resendVerificationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  // WAS-32: same anti-enumeration behavior as request-reset.
  await AuthService.resendVerification(parsed.data.email)

  return NextResponse.json({
    message: "If an account exists for that email, a verification link has been sent.",
  })
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test app/api/auth/resend-verification/route.test.ts`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add app/api/auth/resend-verification
git commit -m "feat: add POST /api/auth/resend-verification route"
```

---

## Task 16: `useAuth` client methods

**Files:**
- Modify: `hooks/useAuth.tsx`

**Step 1: Extend the context type**

In `hooks/useAuth.tsx`, update `AuthContextType`:

```ts
interface AuthContextType {
  user: IUser | null
  profile: IUser | null
  session: null
  loading: boolean
  signUp: (data: any) => Promise<void>
  signIn: (data: any) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<IUser>) => Promise<void>
  refreshProfile: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  verifyEmail: (token: string) => Promise<void>
  resendVerification: (email: string) => Promise<void>
}
```

**Step 2: Add the four methods**

Inside `AuthProvider`, after `updateProfile` and before the `value` object, add:

```ts
  const requestPasswordReset = async (email: string) => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to request password reset")
      }
    } catch (err) {
      console.error("Request password reset error:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (token: string, password: string) => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to reset password")
      }
    } catch (err) {
      console.error("Reset password error:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const verifyEmail = async (token: string) => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to verify email")
      }

      // Refresh so the rest of the app sees the updated emailVerified status
      await fetchCurrentUser()
    } catch (err) {
      console.error("Verify email error:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const resendVerification = async (email: string) => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to resend verification email")
      }
    } catch (err) {
      console.error("Resend verification error:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }
```

**Step 3: Add them to the returned `value`**

```ts
  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    resendVerification,
  }
```

**Step 4: Typecheck**

Run: `pnpm type-check`
Expected: no new errors

**Step 5: Commit**

```bash
git add hooks/useAuth.tsx
git commit -m "feat: add requestPasswordReset/resetPassword/verifyEmail/resendVerification to useAuth"
```

No dedicated test file exists for `useAuth.tsx` today — not adding one here, matching existing coverage.

---

## Task 17: `emailVerified` on the frontend `User` type

**Files:**
- Modify: `types/auth.ts`

**Step 1: Add the field**

```ts
export interface User {
  _id: string;
  email: string;
  first_name: string;
  last_name: string;
  emailVerified: boolean;
}
```

**Step 2: Commit**

```bash
git add types/auth.ts
git commit -m "feat: add emailVerified to frontend User type"
```

---

## Task 18: `forgotPassword` modal key

**Files:**
- Modify: `components/home/useHomeController.ts`

**Step 1: Add the modal key**

Change:
```ts
export type ModalKey = 'signup' | 'signin' | 'quiz' | 'results' | 'film' | 'quizHistory'
```
to:
```ts
export type ModalKey = 'signup' | 'signin' | 'forgotPassword' | 'quiz' | 'results' | 'film' | 'quizHistory'
```

**Step 2: Add the action**

Next to `switchToSignUp`, add:
```ts
  const switchToForgotPassword = () => dispatch({ type: 'OPEN', modal: 'forgotPassword' })
```

**Step 3: Return it from the hook**

In the returned object, next to `switchToSignIn, switchToSignUp, signupSucceeded,`, add `switchToForgotPassword,`:
```ts
    switchToSignIn, switchToSignUp, switchToForgotPassword, signupSucceeded,
```

**Step 4: Typecheck**

Run: `pnpm type-check`
Expected: no new errors

**Step 5: Commit**

```bash
git add components/home/useHomeController.ts
git commit -m "feat: add forgotPassword modal key and switch action"
```

---

## Task 19: `ForgotPasswordModal` component

**Files:**
- Create: `components/auth/ForgotPasswordModal.tsx`

**Step 1: Implement**

```tsx
"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ForgotPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToSignIn: () => void
}

export function ForgotPasswordModal({ open, onOpenChange, onSwitchToSignIn }: ForgotPasswordModalProps) {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!email) {
        throw new Error("Email is required")
      }

      await requestPasswordReset(email)
      // WAS-32: always show the same success state regardless of whether
      // the email is registered - the server already returns a generic
      // response, this just reinforces it on the client.
      setSubmitted(true)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setEmail("")
      setError("")
      setSubmitted(false)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-w-md bg-white text-gray-900 border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-gray-900">Reset Password</DialogTitle>
          <DialogDescription className="text-center text-gray-600 mt-2">
            Enter your email and we'll send you a reset link
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="mt-6 space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              If an account exists for that email, a reset link has been sent.
            </div>
            <Button
              type="button"
              onClick={onSwitchToSignIn}
              className="w-full bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold py-3 rounded-lg transition-all duration-300"
            >
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38]"
            />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold py-3 rounded-lg transition-all duration-300"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Remembered your password?{" "}
              <button
                type="button"
                onClick={onSwitchToSignIn}
                className="text-[#B95D38] hover:text-[#B95D38]/90 font-medium"
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

**Step 2: Commit**

```bash
git add components/auth/ForgotPasswordModal.tsx
git commit -m "feat: add ForgotPasswordModal component"
```

---

## Task 20: Wire "Forgot your password?" into `SignInModal`

**Files:**
- Modify: `components/auth/SignInModal.tsx`

**Step 1: Add the prop**

Change:
```ts
interface SignInModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToSignUp: () => void
}

export function SignInModal({ open, onOpenChange, onSwitchToSignUp }: SignInModalProps) {
```
to:
```ts
interface SignInModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToSignUp: () => void
  onSwitchToForgotPassword: () => void
}

export function SignInModal({ open, onOpenChange, onSwitchToSignUp, onSwitchToForgotPassword }: SignInModalProps) {
```

**Step 2: Add the link under the password field**

Immediately after the password `<Input>` block and before the `{error && (...)}` block, add:

```tsx
          <div className="text-right">
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-sm text-[#B95D38] hover:text-[#B95D38]/90 font-medium"
            >
              Forgot your password?
            </button>
          </div>
```

**Step 3: Typecheck**

Run: `pnpm type-check`
Expected: error at the `<SignInModal>` call site in `HomeInteractiveShell.tsx` (missing required prop) — expected, fixed in Task 22

**Step 4: Commit**

```bash
git add components/auth/SignInModal.tsx
git commit -m "feat: add forgot-password link to SignInModal"
```

---

## Task 21: `VerificationBanner` component

**Files:**
- Create: `components/auth/VerificationBanner.tsx`

**Step 1: Implement**

```tsx
"use client"

import { useState } from "react"

interface VerificationBannerProps {
  email: string
  onResend: (email: string) => Promise<void>
}

export function VerificationBanner({ email, onResend }: VerificationBannerProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle")

  const handleResend = async () => {
    setStatus("sending")
    try {
      await onResend(email)
      setStatus("sent")
    } catch {
      setStatus("idle")
    }
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm px-4 py-2 text-center">
      {status === "sent" ? (
        "Verification email sent - check your inbox."
      ) : (
        <>
          Please verify your email address.{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={status === "sending"}
            className="underline font-medium hover:text-amber-900"
          >
            {status === "sending" ? "Sending..." : "Resend verification email"}
          </button>
        </>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/auth/VerificationBanner.tsx
git commit -m "feat: add VerificationBanner component"
```

---

## Task 22: Wire everything into `HomeInteractiveShell`

**Files:**
- Modify: `components/home/HomeInteractiveShell.tsx`

**Step 1: Add imports**

After the existing `SignUpModal` import, add:
```ts
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal"
import { VerificationBanner } from "@/components/auth/VerificationBanner"
```

**Step 2: Destructure `resendVerification` from `useAuth`**

Change:
```ts
  const { user: rawUser, profile: rawProfile, signOut } = useAuth()
```
to:
```ts
  const { user: rawUser, profile: rawProfile, signOut, resendVerification } = useAuth()
```

**Step 3: Include `emailVerified` in the mapped `user`**

Change:
```ts
  const user: User | null = rawUser ? {
    _id: rawUser._id,
    email: rawUser.email,
    first_name: rawUser.first_name || '',
    last_name: rawUser.last_name || ''
  } : null
```
to:
```ts
  const user: User | null = rawUser ? {
    _id: rawUser._id,
    email: rawUser.email,
    first_name: rawUser.first_name || '',
    last_name: rawUser.last_name || '',
    emailVerified: rawUser.emailVerified ?? false
  } : null
```

**Step 4: Render the banner and the modal**

Add the banner right before `<UserMenu`:
```tsx
      {user && !user.emailVerified && (
        <VerificationBanner email={user.email} onResend={resendVerification} />
      )}

      <UserMenu
```

Update the `SignInModal` call to pass the new prop, and add `ForgotPasswordModal` right after it:
```tsx
      <SignInModal
        open={controller.activeModal === 'signin'}
        onOpenChange={(open) => !open && controller.closeActiveModal()}
        onSwitchToSignUp={controller.switchToSignUp}
        onSwitchToForgotPassword={controller.switchToForgotPassword}
      />

      <ForgotPasswordModal
        open={controller.activeModal === 'forgotPassword'}
        onOpenChange={(open) => !open && controller.closeActiveModal()}
        onSwitchToSignIn={controller.switchToSignIn}
      />
```

**Step 5: Typecheck**

Run: `pnpm type-check`
Expected: PASS, no errors

**Step 6: Commit**

```bash
git add components/home/HomeInteractiveShell.tsx
git commit -m "feat: wire ForgotPasswordModal and VerificationBanner into home shell"
```

---

## Task 23: `/reset-password` page

**Files:**
- Create: `app/reset-password/page.tsx`
- Create: `app/reset-password/ResetPasswordForm.tsx`

Split into a server page + client form so `useSearchParams()` gets the required Suspense boundary (Next.js App Router requirement — without it, the build emits a "should be wrapped in a suspense boundary" error).

**Step 1: Create the client form**

```tsx
// app/reset-password/ResetPasswordForm.tsx
"use client"

import type React from "react"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const { resetPassword } = useAuth()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      await resetPassword(token as string, password)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Invalid reset link</h1>
          <p className="text-gray-600">This password reset link is missing a token.</p>
          <Link href="/" className="text-[#B95D38] hover:text-[#B95D38]/90 font-medium">
            Return home
          </Link>
        </div>
      </main>
    )
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Password updated</h1>
          <p className="text-gray-600">You can now sign in with your new password.</p>
          <Link href="/" className="text-[#B95D38] hover:text-[#B95D38]/90 font-medium">
            Return home to sign in
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">Set a new password</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38]"
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38]"
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold py-3 rounded-lg transition-all duration-300"
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </main>
  )
}
```

**Step 2: Create the server page wrapping it in Suspense**

```tsx
// app/reset-password/page.tsx
import { Suspense } from "react"
import { ResetPasswordForm } from "./ResetPasswordForm"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}
```

**Step 3: Typecheck**

Run: `pnpm type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add app/reset-password
git commit -m "feat: add /reset-password page"
```

---

## Task 24: `/verify-email` page

**Files:**
- Create: `app/verify-email/page.tsx`
- Create: `app/verify-email/VerifyEmailStatus.tsx`

**Step 1: Create the client status component**

```tsx
// app/verify-email/VerifyEmailStatus.tsx
"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Status = "verifying" | "success" | "error"

export function VerifyEmailStatus() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const { verifyEmail, resendVerification } = useAuth()

  const [status, setStatus] = useState<Status>("verifying")
  const [errorMessage, setErrorMessage] = useState("")
  const [resendEmail, setResendEmail] = useState("")
  const [resendSent, setResendSent] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setErrorMessage("This verification link is missing a token.")
      return
    }

    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error")
        setErrorMessage(err instanceof Error ? err.message : "Failed to verify email")
      })
    // Only run once on mount - re-running on every `verifyEmail` identity
    // change would re-submit the (now consumed) token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await resendVerification(resendEmail)
    } finally {
      // WAS-32: same generic response regardless of outcome (anti-enumeration)
      setResendSent(true)
    }
  }

  if (status === "verifying") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white px-4">
        <p className="text-gray-600">Verifying your email...</p>
      </main>
    )
  }

  if (status === "success") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Email verified</h1>
          <p className="text-gray-600">Your email address has been verified.</p>
          <Link href="/" className="text-[#B95D38] hover:text-[#B95D38]/90 font-medium">
            Return home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Verification failed</h1>
        <p className="text-gray-600">{errorMessage}</p>

        {resendSent ? (
          <p className="text-sm text-gray-600">
            If an account exists for that email, a new verification link has been sent.
          </p>
        ) : (
          <form onSubmit={handleResend} className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              required
              className="border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38]"
            />
            <Button
              type="submit"
              className="w-full bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold py-3 rounded-lg transition-all duration-300"
            >
              Resend verification email
            </Button>
          </form>
        )}
      </div>
    </main>
  )
}
```

**Step 2: Create the server page wrapping it in Suspense**

```tsx
// app/verify-email/page.tsx
import { Suspense } from "react"
import { VerifyEmailStatus } from "./VerifyEmailStatus"

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailStatus />
    </Suspense>
  )
}
```

**Step 3: Typecheck**

Run: `pnpm type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add app/verify-email
git commit -m "feat: add /verify-email page"
```

---

## Task 25: Full validation pass

**Files:** none (verification only)

**Step 1: Lint**

Run: `pnpm lint`
Expected: no errors (fix any that surface before continuing)

**Step 2: Typecheck**

Run: `pnpm type-check`
Expected: no errors

**Step 3: Full test suite**

Run: `pnpm test`
Expected: all tests pass, including every new file from Tasks 2-15

**Step 4: Manual smoke test**

Run: `pnpm dev`, then in a browser:
1. Sign up a new test account → confirm a verification email arrives (check the Resend dashboard's log if using the sandbox sender) and the amber "verify your email" banner shows on the home page.
2. Click the verification link → confirm `/verify-email` shows success and the banner disappears after a refresh.
3. Sign out, open the sign-in modal, click "Forgot your password?" → submit the test account's email → confirm the reset email arrives.
4. Click the reset link → set a new password → confirm you can sign in with the new password and the old one no longer works.
5. Reuse the same reset link a second time → confirm it's rejected as invalid/expired (single-use check).

**Step 5: Commit any fixes discovered during the smoke test**

If the manual pass surfaces a bug, fix it, add/adjust a test that would have caught it, and commit that fix on its own.

---

## Task 26: Open the PR

**Step 1: Push and open a PR**

The PR body must include `Closes WAS-32` per the ticket's Definition of Done. Reference the design doc and mention the token-signing pattern in `lib/tokens.ts` explicitly, since the DoD calls out documenting it for reuse by future token flows (e.g. invite links).

**Step 2: Confirm the Definition of Done**

- [ ] User can request a reset email and successfully set a new password via the link (verified in Task 25 manual smoke test)
- [ ] User can verify their email via a sent link (verified in Task 25)
- [ ] Tokens expire and are single-use (covered by `lib/auth.test.ts` in Tasks 6-10, and the reuse check in Task 25 step 4.5)
- [ ] Tests / lint / typecheck pass (Task 25)
- [ ] PR body says `Closes WAS-32`
- [ ] Token-signing pattern documented — `lib/tokens.ts`'s header comment plus the design doc's "Decisions" section
