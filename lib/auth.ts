import { supabase } from "./supabase"
import type { UserProfile } from "./supabase"

export class AuthService {
  static async signUp(data: {
    email: string
    password: string
    firstName?: string
    lastName?: string
    zipcode?: string
    occupationStatus?: string
    passwordConfirmation?: string // Not sent to Supabase, just for client validation
  }) {
    try {
      console.log("Attempting signup with data:", {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        zipcode: data.zipcode,
        occupationStatus: data.occupationStatus,
      })

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            zipcode: data.zipcode,
            occupation_status: data.occupationStatus,
          },
        },
      })

      if (error) {
        console.error("Supabase signup error:", {
          message: error.message,
          status: error.status,
          name: error.name,
          cause: error.cause,
        })
        throw error
      }

      console.log("Signup successful:", {
        user: authData.user?.id,
        session: !!authData.session,
      })

      // Try to create user profile in database
      if (authData.user) {
        try {
          await this.createUserProfile(authData.user.id, {
            first_name: data.firstName || "",
            last_name: data.lastName || "",
            zip_code: data.zipcode || "",
            professional_status: this.mapOccupationStatus(data.occupationStatus || ""),
          })
        } catch (profileError) {
          console.warn("Failed to create user profile in database:", profileError)
          // Don't throw error here, as the user account was created successfully
        }
      }

      return { user: authData.user, session: authData.session }
    } catch (error) {
      // Enhanced error logging
      console.error("Signup error details:", {
        error,
        errorType: typeof error,
        errorConstructor: (error as any)?.constructor?.name,
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        // If it's a Supabase error
        status: (error as any)?.status,
        statusCode: (error as any)?.statusCode,
        details: (error as any)?.details,
      })

      // Re-throw with more context if needed
      if (error instanceof Error) {
        throw error
      } else {
        throw new Error(`Signup failed: ${JSON.stringify(error)}`)
      }
    }
  }

  static async signIn(data: { email: string; password: string }) {
    try {
      console.log("Attempting signin with email:", data.email)

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        console.error("Supabase signin error:", {
          message: error.message,
          status: error.status,
          name: error.name,
        })
        throw error
      }

      console.log("Signin successful:", {
        user: authData.user?.id,
        session: !!authData.session,
      })

      return { user: authData.user, session: authData.session }
    } catch (error) {
      console.error("Signin error details:", {
        error,
        message: (error as any)?.message,
        status: (error as any)?.status,
      })
      throw error
    }
  }

  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Signout error:", error)
        throw error
      }
      console.log("Signout successful")
    } catch (error) {
      console.error("Signout error details:", error)
      throw error
    }
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      console.log("Attempting to get user profile for:", userId)

      // Try to get profile from database first
      try {
        const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

        if (error) {
          // If it's a "not found" error or table doesn't exist, return null (not an error)
          if (
            error.code === "PGRST116" ||
            error.message.includes("relation") ||
            error.message.includes("does not exist")
          ) {
            console.log("User profile table not ready or profile not found - will use fallback")
            return null
          }

          // For other errors, log and return null
          console.warn("Database error getting user profile:", error.message)
          return null
        }

        console.log("Successfully retrieved user profile from database")
        return data
      } catch (dbError) {
        console.warn("Database operation failed for user profile:", (dbError as any)?.message)
        return null
      }
    } catch (error) {
      console.warn("Error accessing user profile database:", (error as any)?.message)
      return null
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      console.log("Updating user profile for:", userId, updates)

      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single()

      if (error) {
        console.error("Update user profile error:", error)
        throw error
      }

      console.log("User profile updated successfully")
      return data
    } catch (error) {
      console.error("Update user profile error details:", error)
      throw error
    }
  }

  static async createUserProfile(
    userId: string,
    profileData: Omit<UserProfile, "id" | "created_at" | "updated_at">,
  ): Promise<UserProfile> {
    try {
      console.log("Creating user profile for:", userId, profileData)

      const { data, error } = await supabase
        .from("user_profiles")
        .insert({
          id: userId,
          ...profileData,
        })
        .select()
        .single()

      if (error) {
        console.error("Create user profile error:", error)
        throw error
      }

      console.log("User profile created successfully")
      return data
    } catch (error) {
      console.error("Create user profile error details:", error)
      throw error
    }
  }

  // Helper function to map occupation status to database enum
  private static mapOccupationStatus(status: string): UserProfile["professional_status"] {
    const statusMap: Record<string, UserProfile["professional_status"]> = {
      "Working Professional": "working-professional",
      "Dedicated Student": "dedicated-student",
      Entrepreneur: "entrepreneur",
      Retired: "retired",
      "Transitioning Between Opportunities": "working-professional", // Default mapping
    }

    return statusMap[status] || "working-professional"
  }

  // Test database connection
  static async testConnection() {
    try {
      const { data, error } = await supabase.from("user_profiles").select("count").limit(1)
      return { success: !error, error }
    } catch (error) {
      return { success: false, error }
    }
  }
}
