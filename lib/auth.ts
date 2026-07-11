// lib/auth.ts (updated for Mongoose)

import bcrypt from "bcryptjs"
import User, { IUser } from "@/models/User"
import connectDB from "@/lib/mongoose"

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

export class AuthService {
  static async signUp(userData: SignUpData) {
    await connectDB()

    const existing = await User.findOne({ email: userData.email })
    if (existing) throw new Error("User already exists")

    const passwordHash = await bcrypt.hash(userData.password, 10)

    const user = await User.create({
      email: userData.email,
      passwordHash,
      first_name: userData.firstName,
      last_name: userData.lastName,
      zip_code: userData.zip_code,
      occupation_status: userData.occupationStatus,
    })

    return user
  }

  static async signIn(email: string, password: string) {
    await connectDB()

    const user = await User.findOne({ email })
    if (!user) throw new Error("Invalid email or password")

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) throw new Error("Invalid email or password")

    return user
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
