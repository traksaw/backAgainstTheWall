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

    const user = await User.findOne({ email: normalizeEmail(email) })
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

  static async signOut() {
    // You would clear cookies or session here if implemented
    return true
  }

  static async getUserProfile(userId: string): Promise<IUser | null> {
    await connectDB()
    // WAS-7: passwordHash must never leave the server. This is shared by
    // both /api/auth/profile and /api/auth/me.
    return await User.findById(userId).select("-passwordHash")
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
