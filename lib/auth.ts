import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface UserProfile {
  id: string
  user_id: string
  email: string
  first_name: string
  last_name: string
  zipcode?: string
  occupation_status?: string
  created_at: string
  updated_at: string
}

export interface DatabaseSetupStatus {
  isSetup: boolean
  missingTables: string[]
  error?: string
}

export interface SignUpData {
  email: string
  password: string
  firstName: string
  lastName: string
  zipcode: string
  occupationStatus: string
  professionalStatus: string
}

export class AuthService {
  static async signUp(userData: SignUpData) {
    try {
      console.log("Starting signup process with:", userData)

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      })

      if (authError) {
        console.error("Auth signup error:", authError)
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error("No user data returned from signup")
      }

      console.log("Auth user created:", authData.user.id)

      // Create user profile
      const profileData = {
        user_id: authData.user.id,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        zip_code: userData.zipcode,
        occupation_status: userData.occupationStatus,
        // professional_status: userData.professionalStatus,
      }
      console.log("Profile data:", profileData)

      const { data: profileResult, error: profileError } = await supabase
        .from("user_profiles")
        .insert(profileData)
        .select()
        .single()

      if (profileError) {
        console.error("Profile creation error:", JSON.stringify(profileError, null, 2));
        // Don't throw here - user is created, profile creation can be retried
        console.warn("Profile creation failed, but user account exists")
      } else {
        console.log("Profile created successfully:", profileResult)
      }

      return {
        user: authData.user,
        profile: profileResult,
      }
    } catch (error) {
      console.error("Signup process failed:", error)
      throw error
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>) {

    const { data, error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error("Sign in error:", error)
      throw error
    }
  }

  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error("Sign out error:", error)
      throw error
    }
  }

  static async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        console.error("Get current user error:", error)
        return null
      }

      return user
    } catch (error) {
      console.error("Get current user error:", error)
      return null
    }
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error("Get user profile error:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Get user profile error:", error)
      return null
    }
  }


  static async createUserProfile(
    profileData: Omit<UserProfile, "id" | "created_at" | "updated_at">,
  ): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase.from("user_profiles").insert(profileData).select().single()

      if (error) {
        console.error("Create user profile error:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Create user profile error:", error)
      return null
    }
  }

  static async checkDatabaseSetup(): Promise<DatabaseSetupStatus> {
    try {
      const missingTables: string[] = []

      // Check user_profiles table
      const { error: profilesError } = await supabase.from("user_profiles").select("id").limit(1)

      if (profilesError) {
        console.warn("user_profiles table check failed:", profilesError)
        missingTables.push("user_profiles")
      }

      // Check quiz_results table
      const { error: quizError } = await supabase.from("quiz_results").select("id").limit(1)

      if (quizError) {
        console.warn("quiz_results table check failed:", quizError)
        missingTables.push("quiz_results")
      }

      return {
        isSetup: missingTables.length === 0,
        missingTables,
      }
    } catch (error) {
      console.error("Database setup check failed:", error)
      return {
        isSetup: false,
        missingTables: ["user_profiles", "quiz_results"],
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  static onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null)
    })
  }
}
