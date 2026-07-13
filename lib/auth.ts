// lib/auth.ts (updated for Mongoose)

import bcrypt from "bcryptjs"
import User, { IUser } from "@/models/User"
import connectDB from "@/lib/mongoose"
import { generateToken, hashToken } from "@/lib/tokens"
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email"

export interface SignUpData {
  email: string
  password: string
  firstName: string
  lastName: string
  zip_code: string
  occupationStatus: string
}

// WAS-6: never spread caller-supplied updates directly into a Mongo update -
// same mass-assignment bug as the quiz-result endpoint
// (app/api/quiz/[id]/update). A generic profile update must never be able to
// touch passwordHash or email: password changes need their own
// current-password-verified flow, and email changes need their own
// verification flow. Neither exists yet, so neither belongs here.
const ALLOWED_PROFILE_UPDATE_FIELDS = [
  "first_name",
  "last_name",
  "zip_code",
  "occupation_status",
] as const

// WAS-19: email is our uniqueness key for sign-in, so it must be normalized
// the same way on every read and write - otherwise "Foo@x.com" and
// "foo@x.com" register as separate accounts and the "already exists" check
// can be bypassed by changing case. Any other field used as a user
// identifier in the future (e.g. a username) needs this same treatment.
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

const ONE_HOUR_MS = 60 * 60 * 1000
const ONE_DAY_MS = 24 * ONE_HOUR_MS

// WAS-32: requestPasswordReset/resendVerification return the same generic
// response whether or not the account exists, so the enumeration guard
// depends on the response also taking the same amount of TIME either way.
// The "user found" path awaits a real Resend API call (hundreds of ms); the
// "user not found" path used to return right after a single fast DB lookup,
// which is a timing oracle that reveals account existence even though the
// response body/status are identical. Pad the "not found" path with a fixed
// delay that approximates typical email-send latency. This is a fixed
// approximation, not a measurement of actual Resend latency - it won't be
// exact, but it closes the multi-hundred-ms gap that made timing trivially
// distinguishable.
const ANTI_ENUMERATION_DELAY_MS = 300

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class AuthService {
  static async signUp(userData: SignUpData) {
    await connectDB()

    const email = normalizeEmail(userData.email)

    const existing = await User.findOne({ email })
    if (existing) throw new Error("User already exists")

    const passwordHash = await bcrypt.hash(userData.password, 10)

    // Not migrating existing duplicate-case accounts here - this repo has no
    // production users yet, so there's nothing to merge. If that's no longer
    // true when this lands, run a one-time script to dedupe by lowercased
    // email before this normalization goes live.
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
  }

  static async signIn(email: string, password: string) {
    await connectDB()

    // WAS-11: passwordHash is select:false on the schema, so this is the
    // one place that legitimately needs it and must opt back in.
    const user = await User.findOne({ email: normalizeEmail(email) }).select("+passwordHash")
    if (!user) throw new Error("Invalid email or password")

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) throw new Error("Invalid email or password")

    return user
  }

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

  static async requestPasswordReset(email: string) {
    await connectDB()

    const user = await User.findOne({ email: normalizeEmail(email) })
    // WAS-32: anti-enumeration - the caller (route) always reports success
    // either way, so a missing user is a silent no-op, not an error. The
    // delay keeps this path's timing close to the "user found" path below.
    if (!user) {
      await delay(ANTI_ENUMERATION_DELAY_MS)
      return
    }

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
      // WAS-88: any JWT issued before this moment must stop being accepted -
      // see getUserIdFromRequest in lib/jwt.ts, which checks a token's iat
      // against this field.
      passwordChangedAt: new Date(),
      $unset: { resetPasswordTokenHash: 1, resetPasswordExpires: 1 },
    })
  }

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

  static async resendVerification(email: string) {
    await connectDB()

    const user = await User.findOne({ email: normalizeEmail(email) })
    // Same anti-enumeration reasoning as requestPasswordReset, including the
    // timing-oracle mitigation delay.
    if (!user) {
      await delay(ANTI_ENUMERATION_DELAY_MS)
      return
    }

    await AuthService.issueVerificationToken(user)
  }

  static async signOut() {
    // You would clear cookies or session here if implemented
    return true
  }

  static async getUserProfile(userId: string): Promise<IUser | null> {
    await connectDB()
    // WAS-7/WAS-32: passwordHash and the token-hash/expiry fields must
    // never leave the server. Shared by both /api/auth/profile and
    // /api/auth/me.
    return await User.findById(userId).select(
      "-passwordHash -resetPasswordTokenHash -resetPasswordExpires -emailVerificationTokenHash -emailVerificationExpires"
    )
  }

  static async updateUserProfile(userId: string, updates: Partial<IUser>) {
    await connectDB()
    const picked: Partial<IUser> = {}
    for (const field of ALLOWED_PROFILE_UPDATE_FIELDS) {
      if (field in updates) picked[field] = updates[field]
    }
    return await User.findByIdAndUpdate(userId, picked, { new: true })
  }

  static async checkDatabaseSetup() {
    await connectDB()

    try {
      await User.findOne().lean()
      return { isSetup: true, missingTables: [] }
    } catch (error) {
      console.error('Database setup check failed:', error)
      return {
        isSetup: false,
        missingTables: ["User"],
      }
    }
  }
}
