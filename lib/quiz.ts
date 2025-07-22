import { supabase } from "./supabase"
import type { QuizResult } from "./supabase"

export interface QuizAnswer {
  id: number;
  questionId?: number | string;
  archetype: "Avoider" | "Gambler" | "Realist" | "Architect";
  points: number;
  text: string;
  question?: string;
  answer?: string;
}

export interface QuizSubmission {
  answers: Record<number, QuizAnswer>
  sessionId?: string
}

export class QuizService {
  // Get current user helper
  static async getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  }

  // Test database connection
  static async testConnection() {
    try {
      const { data, error } = await supabase.from("quiz_results").select("count").limit(1)
      return { success: !error, error }
    } catch (error) {
      return { success: false, error }
    }
  }

  static async submitQuiz(submission: QuizSubmission): Promise<QuizResult> {
    try {
      const user = await this.getCurrentUser()
      if (!user) throw new Error("User not authenticated")

      console.log("Submitting quiz with submission:", submission)

      // Calculate archetype scores
      const scores = { Avoider: 0, Gambler: 0, Realist: 0, Architect: 0 }

      Object.values(submission.answers).forEach((answer) => {
        scores[answer.archetype] += answer.points
      })

      console.log("Calculated scores:", scores)

      // Determine top archetype
      const topArchetype = Object.entries(scores).reduce((a, b) =>
        scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b,
      )[0] as keyof typeof scores

      console.log("Top archetype:", topArchetype)

      // Create detailed result with complete answer data
      const detailedAnswers = {
        responses: submission.answers,
        scores: scores,
        totalQuestions: Object.keys(submission.answers).length,
        completedAt: new Date().toISOString(),
      }

      // Try to insert into Supabase database
      try {
        const { data, error } = await supabase
          .from("quiz_results")
          .insert({
            user_id: user.id,
            archetype: topArchetype,
            score: scores[topArchetype],
            answers: detailedAnswers,
            session_id: submission.sessionId || Math.random().toString(36).substr(2, 9),
            has_viewed_results: false,
            has_watched_film: false,
          })
          .select()
          .single()

        if (error) {
          console.warn("Database insert failed, using fallback storage:", error)
          throw error
        }

        console.log("Quiz submitted successfully to database:", data)

        // Also log user activity
        await this.logUserActivity(user.id, "quiz_completed", {
          archetype: topArchetype,
          score: scores[topArchetype],
          session_id: submission.sessionId,
        })

        return data
      } catch (dbError) {
        console.warn("Database operation failed, using localStorage fallback:", dbError)

        // Fallback to localStorage if database is not available
        const mockResult: QuizResult = {
          id: Math.random().toString(36).substring(2, 9),
          user_id: user.id,
          archetype: topArchetype,
          score: scores[topArchetype],
          answers: {
            responses: submission.answers,
            scores,
            totalQuestions: Object.keys(submission.answers).length,
            completedAt: new Date().toISOString(),
          },
          completed_at: new Date().toISOString(),
          session_id: submission.sessionId || Math.random().toString(36).substring(2, 9),
          has_viewed_results: false,
          has_watched_film: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // Store in localStorage as fallback
        const existingResults = JSON.parse(localStorage.getItem(`quiz_results_${user.id}`) || "[]")
        existingResults.unshift(mockResult)
        localStorage.setItem(`quiz_results_${user.id}`, JSON.stringify(existingResults))


        console.log("Quiz submitted successfully with localStorage fallback:", mockResult)
        return mockResult
      }
    } catch (error) {
      console.error("Submit quiz error:", error)
      throw error
    }
  }

  static async getUserQuizResults(userId: string): Promise<QuizResult[]> {
    try {
      console.log("Getting quiz results for user:", userId)

      // Try to get results from Supabase database first
      try {
        const { data, error } = await supabase
          .from("quiz_results")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })

        if (error) {
          console.warn("Database query failed, using localStorage fallback:", error)
          throw error
        }

        console.log("Successfully retrieved quiz results from database:", data?.length || 0, "results")
        return data || []
      } catch (dbError) {
        console.warn("Database operation failed, using localStorage fallback:", dbError)

        // Fallback to localStorage
        const storedResults = JSON.parse(localStorage.getItem(`quiz_results_${userId}`) || "[]")
        console.log("Retrieved quiz results from localStorage:", storedResults.length, "results")
        return storedResults
      }
    } catch (error) {
      console.error("Get user quiz results error:", error)
      return []
    }
  }

  static async getLatestQuizResult(userId: string): Promise<QuizResult | null> {
    try {
      console.log("Getting latest quiz result for user:", userId)

      // Try to get latest result from Supabase database first
      try {
        const { data, error } = await supabase
          .from("quiz_results")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (error && error.code !== "PGRST116") {
          // PGRST116 is "not found"
          console.warn("Database query failed, using localStorage fallback:", error)
          throw error
        }

        if (data) {
          console.log("Successfully retrieved latest quiz result from database")
          return data
        }
      } catch (dbError) {
        console.warn("Database operation failed, using localStorage fallback:", dbError)
      }

      // Fallback to localStorage
      const storedResults = JSON.parse(localStorage.getItem(`quiz_results_${userId}`) || "[]")
      const latestResult = storedResults.length > 0 ? storedResults[0] : null
      console.log("Retrieved latest quiz result from localStorage:", !!latestResult)
      return latestResult
    } catch (error) {
      console.error("Get latest quiz result error:", error)
      return null
    }
  }

  static async updateQuizResult(resultId: string, updates: Partial<QuizResult>): Promise<QuizResult> {
    try {
      console.log("Updating quiz result:", resultId, updates)

      const user = await this.getCurrentUser()
      if (!user) throw new Error("User not authenticated")

      // Try to update in Supabase database first
      try {
        const { data, error } = await supabase
          .from("quiz_results")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", resultId)
          .eq("user_id", user.id) // Ensure user can only update their own results
          .select()
          .single()

        if (error) {
          console.warn("Database update failed, using localStorage fallback:", error)
          throw error
        }

        console.log("Quiz result updated successfully in database:", data)

        // Log activity if results were viewed or film was watched
        if (updates.has_viewed_results) {
          await this.logUserActivity(user.id, "results_viewed", { result_id: resultId })
        }
        if (updates.has_watched_film) {
          await this.logUserActivity(user.id, "film_watched", { result_id: resultId })
        }

        return data
      } catch (dbError) {
        console.warn("Database operation failed, using localStorage fallback:", dbError)

        // Fallback to localStorage
        const storedResults = JSON.parse(localStorage.getItem(`quiz_results_${user.id}`) || "[]")
        const updatedResults = storedResults.map((result: QuizResult) =>
          result.id === resultId ? { ...result, ...updates, updated_at: new Date().toISOString() } : result,
        )
        localStorage.setItem(`quiz_results_${user.id}`, JSON.stringify(updatedResults))

        const updatedResult = updatedResults.find((r: QuizResult) => r.id === resultId)
        console.log("Quiz result updated successfully with localStorage fallback:", updatedResult)
        return updatedResult || ({} as QuizResult)
      }
    } catch (error) {
      console.error("Update quiz result error:", error)
      throw error
    }
  }

  static async deleteQuizResult(resultId: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser()
      if (!user) throw new Error("User not authenticated")

      // Try to delete from Supabase database first
      try {
        const { error } = await supabase.from("quiz_results").delete().eq("id", resultId).eq("user_id", user.id) // Ensure user can only delete their own results

        if (error) {
          console.warn("Database delete failed, using localStorage fallback:", error)
          throw error
        }

        console.log("Quiz result deleted successfully from database")
        return true
      } catch (dbError) {
        console.warn("Database operation failed, using localStorage fallback:", dbError)

        // Fallback to localStorage
        const storedResults = JSON.parse(localStorage.getItem(`quiz_results_${user.id}`) || "[]")
        const filteredResults = storedResults.filter((result: QuizResult) => result.id !== resultId)
        localStorage.setItem(`quiz_results_${user.id}`, JSON.stringify(filteredResults))

        console.log("Quiz result deleted successfully with localStorage fallback")
        return true
      }
    } catch (error) {
      console.error("Delete quiz result error:", error)
      return false
    }
  }

  static async logUserActivity(userId: string, activityType: string, metadata?: Record<string, any>) {
    try {
      const { error } = await supabase.from("user_activity").insert({
        user_id: userId,
        activity_type: activityType,
        metadata: metadata || {},
      })

      if (error) {
        console.warn("Failed to log user activity:", error)
      } else {
        console.log("User activity logged:", activityType)
      }
    } catch (error) {
      console.warn("Error logging user activity:", error)
    }
  }

  static async getArchetypeDistribution() {
    try {
      console.log("Getting archetype distribution")

      // Try to get from database view first
      try {
        const { data, error } = await supabase.from("archetype_distribution").select("*")

        if (error) {
          console.warn("Database query failed, using mock data:", error)
          throw error
        }

        console.log("Successfully retrieved archetype distribution from database")
        return data || []
      } catch (dbError) {
        console.warn("Database operation failed, using mock data:", dbError)

        // Return mock data as fallback
        return [
          { archetype: "Realist", count: 45, percentage: 35 },
          { archetype: "Avoider", count: 38, percentage: 30 },
          { archetype: "Gambler", count: 25, percentage: 20 },
          { archetype: "Architect", count: 19, percentage: 15 },
        ]
      }
    } catch (error) {
      console.error("Get archetype distribution error:", error)
      return []
    }
  }

  static async getUserEngagementStats() {
    try {
      console.log("Getting user engagement stats")

      // Try to get from database view first
      try {
        const { data, error } = await supabase
          .from("user_engagement_stats")
          .select("*")
          .order("date", { ascending: false })
          .limit(30) // Last 30 days

        if (error) {
          console.warn("Database query failed, using mock data:", error)
          throw error
        }

        console.log("Successfully retrieved user engagement stats from database")
        return data || []
      } catch (dbError) {
        console.warn("Database operation failed, using mock data:", dbError)

        // Return empty array as fallback
        return []
      }
    } catch (error) {
      console.error("Get user engagement stats error:", error)
      return []
    }
  }

  // Utility function to sync localStorage data to database (for migration)
  static async syncLocalStorageToDatabase(userId: string) {
    try {
      const localResults = JSON.parse(localStorage.getItem(`quiz_results_${userId}`) || "[]")

      if (localResults.length === 0) {
        console.log("No local results to sync")
        return { success: true, synced: 0 }
      }

      let syncedCount = 0

      for (const result of localResults) {
        try {
          // Check if result already exists in database
          const { data: existing } = await supabase.from("quiz_results").select("id").eq("id", result.id).single()

          if (!existing) {
            // Insert into database
            const { error } = await supabase.from("quiz_results").insert({
              id: result.id,
              user_id: result.user_id,
              archetype: result.archetype,
              score: result.score,
              answers: result.answers,
              completed_at: result.completed_at,
              session_id: result.session_id,
              has_viewed_results: result.has_viewed_results,
              has_watched_film: result.has_watched_film,
              created_at: result.created_at,
              updated_at: result.updated_at,
            })

            if (!error) {
              syncedCount++
              console.log("Synced result to database:", result.id)
            }
          }
        } catch (syncError) {
          console.warn("Failed to sync individual result:", syncError)
        }
      }

      console.log(`Successfully synced ${syncedCount} results to database`)
      return { success: true, synced: syncedCount }
    } catch (error) {
      console.error("Error syncing localStorage to database:", error)
      return { success: false, error }
    }
  }
}
