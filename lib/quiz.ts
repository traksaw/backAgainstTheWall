// lib/quiz.ts

import type { Archetype, QuizAnswer, QuizQuestion, QuizResult } from "@/types/quiz"
import { logger } from "@/lib/logger"
export type { Archetype, QuizAnswer, QuizResult }

export interface QuizResultUpdate {
  hasViewedResults?: boolean;
  hasWatchedFilm?: boolean;
}

export class QuizService {
  static async getUserQuizResults(): Promise<QuizResult[]> {
    const res = await fetch("/api/quiz/results", {
      credentials: "include",
    })

    if (!res.ok) throw new Error("Failed to fetch results")
    return await res.json()
  }

  /** WAS-107: create a server-persisted shuffled layout for this attempt. */
  static async startQuiz(): Promise<{ sessionId: string; questions: QuizQuestion[] }> {
    const res = await fetch("/api/quiz/start", {
      method: "POST",
      credentials: "include",
    })

    if (!res.ok) {
      let errorData: { error?: string } = {}
      try {
        errorData = await res.json()
      } catch {
        // ignore parse failure
      }
      throw new Error(errorData?.error || `Failed to start quiz (HTTP ${res.status})`)
    }

    return await res.json()
  }

  static async submitQuiz(data: {
    answers: Record<number, QuizAnswer>
    sessionId: string
    archetype: string
    score: number
    scores?: Record<string, number>
  }): Promise<QuizResult> {
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      })

      if (!res.ok) {
        let errorData
        try {
          errorData = await res.json()
        } catch (jsonError) {
          logger.error('Failed to parse error response as JSON:', jsonError)
          errorData = { error: `HTTP ${res.status}: ${res.statusText}` }
        }

        // Detail only - the throw below re-enters the catch below, which is
        // the single point that reports this failure to Sentry.
        logger.warn("Quiz submission HTTP error:", {
          status: res.status,
          statusText: res.statusText,
          errorData
        })

        throw new Error(errorData?.error || `HTTP ${res.status}: ${res.statusText}`)
      }

      const responseData = await res.json()
      return responseData

    } catch (error) {
      logger.error('Quiz submission fetch error:', error)
      throw error
    }
  }

  static async updateQuizResult(resultId: string, updates: QuizResultUpdate): Promise<QuizResult> {
    const res = await fetch(`/api/quiz/${resultId}/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
      credentials: "include",
    })

    if (!res.ok) throw new Error("Failed to update quiz result")
    return await res.json()
  }

}
