// lib/auth.ts (updated for Mongoose)

import bcrypt from "bcryptjs"
import User, { IUser } from "@/models/User"
import { connectDB } from "@/lib/mongoose"

export interface SignUpData {
  email: string
  password: string
  firstName: string
  lastName: string
  zip_code: string
  occupationStatus: string
}

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
    return await User.findById(userId)
  }

  static async updateUserProfile(userId: string, updates: Partial<IUser>) {
    await connectDB()
    return await User.findByIdAndUpdate(userId, updates, { new: true })
  }

  static async checkDatabaseSetup() {
    await connectDB()

    try {
      const anyUser = await User.findOne().lean()
      return { isSetup: true, missingTables: [] }
    } catch (error) {
      return {
        isSetup: false,
        missingTables: ["User"],
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}
