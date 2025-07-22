import { createClient } from "@supabase/supabase-js"
import type { QuizAnswer } from "./quiz"


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database



export interface QuizResponse {
  id: number
  question: string
  text: string
  archetype: string
  points: number
  question_id: string        // 👈 REQUIRED
  answer: string             // 👈 REQUIRED
}



export interface UserProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  zip_code?: string
  // professional_status?: "working-professional" | "dedicated-student" | "entrepreneur" | "retired"
  profile?: string
  created_at: string
  updated_at: string
  zipcode?: string
  occupation_status?: string
}

export interface QuizResult {
  id: string
  user_id: string
  archetype: "Avoider" | "Gambler" | "Realist" | "Architect"
  score: number
  answers: {
    responses: Record<number, QuizAnswer>
    scores: Record<string, number>
    totalQuestions: number
    completedAt: string
  }
  completed_at?: string
  session_id?: string
  has_viewed_results: boolean
  has_watched_film: boolean
  created_at?: string
  updated_at?: string
}

export interface UserActivity {
  id: string
  user_id: string
  activity_type: "signup" | "quiz_completed" | "results_viewed" | "film_watched" | "profile_updated"
  metadata?: Record<string, any>
  created_at: string
}

export interface ArchetypeDistribution {
  archetype: string
  count: number
  percentage: number
}

export interface UserEngagementStats {
  date: string
  quizzes_completed: number
  results_viewed: number
  films_watched: number
  results_view_rate: number
  film_completion_rate: number
}

//  test function
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from("user_profiles").select("count").limit(1)
    if (error) throw error
    return { success: true, message: "Supabase connection successful" }
  } catch (error) {
    console.error("Supabase connection test failed:", error)
    return { success: false, message: "Supabase connection failed", error }
  }
}

// Helper function to check if tables exist
export async function checkTablesExist() {
  try {
    const tables = ["user_profiles", "quiz_results", "user_activity"]
    const results = []

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select("*").limit(1)
        results.push({ table, exists: !error })
      } catch (err) {
        results.push({ table, exists: false, error: err })
      }
    }

    return results
  } catch (error) {
    console.error("Error checking tables:", error)
    return []
  }
}
